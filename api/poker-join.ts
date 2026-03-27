type JoinBody = {
  roomCode?: string;
  playerName?: string;
  createRoom?: boolean;
  maxPlayers?: number;
};

const ROOM_CODE_REGEX = /^\d{4}$/;

type RoomRow = {
  id: string;
  room_code: string;
  game_type: string;
  players: number;
  max_players: number;
  name: string;
  status: string;
};

function sendJson(res: any, statusCode: number, payload: unknown) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

async function parseBody(req: any): Promise<JoinBody> {
  if (req.body && typeof req.body === 'object') {
    return req.body as JoinBody;
  }

  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body) as JoinBody;
    } catch {
      return {};
    }
  }

  return await new Promise<JoinBody>((resolve) => {
    const chunks: Buffer[] = [];

    req.on('data', (chunk: Buffer | string) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });

    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw) as JoinBody);
      } catch {
        resolve({});
      }
    });

    req.on('error', () => resolve({}));
  });
}

function supabaseHeaders(apiKey: string) {
  return {
    apikey: apiKey,
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
}

async function fetchRoom(baseUrl: string, apiKey: string, roomCode: string): Promise<RoomRow | null> {
  const url = `${baseUrl}/rest/v1/game_rooms?room_code=eq.${encodeURIComponent(roomCode)}&select=id,room_code,game_type,players,max_players,name,status`;
  const response = await fetch(url, { headers: supabaseHeaders(apiKey) });
  if (!response.ok) {
    throw new Error(await response.text());
  }

  const rows = (await response.json()) as RoomRow[];
  return rows.length ? rows[0] : null;
}

async function createRoom(baseUrl: string, apiKey: string, roomCode: string, requestedMaxPlayers: number) {
  const url = `${baseUrl}/rest/v1/game_rooms`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      ...supabaseHeaders(apiKey),
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      room_code: roomCode,
      name: `Poker Room ${roomCode}`,
      game_type: 'POKER',
      players: 1,
      max_players: requestedMaxPlayers,
      status: 'waiting',
    }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const rows = (await response.json()) as RoomRow[];
  return rows[0] ?? null;
}

async function updateRoom(baseUrl: string, apiKey: string, roomId: string, payload: Record<string, unknown>) {
  const url = `${baseUrl}/rest/v1/game_rooms?id=eq.${encodeURIComponent(roomId)}`;
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      ...supabaseHeaders(apiKey),
      Prefer: 'return=representation',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const rows = (await response.json()) as RoomRow[];
  return rows[0] ?? null;
}

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return sendJson(res, 405, { ok: false, error: 'Method not allowed.' });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return sendJson(res, 500, { ok: false, error: 'Missing Supabase environment variables.' });
    }

    const body = await parseBody(req);
    const roomCode = String(body.roomCode ?? '').trim();
    const createRoomMode = Boolean(body.createRoom);
    const requestedMaxPlayers = Number(body.maxPlayers ?? 6);

    if (!ROOM_CODE_REGEX.test(roomCode)) {
      return sendJson(res, 400, { ok: false, error: 'roomCode must be 4 digits.' });
    }

    if (createRoomMode && (!Number.isInteger(requestedMaxPlayers) || requestedMaxPlayers < 2 || requestedMaxPlayers > 10)) {
      return sendJson(res, 400, { ok: false, error: 'maxPlayers must be an integer between 2 and 10.' });
    }

    const existingRoom = await fetchRoom(supabaseUrl, serviceKey, roomCode);

    if (createRoomMode && existingRoom) {
      if (existingRoom.game_type !== 'POKER') {
        return sendJson(res, 400, { ok: false, error: 'This room code is used by another game type.' });
      }

      return sendJson(res, 200, {
        ok: true,
        isHost: true,
        room: {
          code: existingRoom.room_code,
          name: existingRoom.name,
          players: existingRoom.players,
          maxPlayers: existingRoom.max_players,
          status: existingRoom.status,
        },
        playerName: body.playerName ?? 'Host',
      });
    }

    if (!createRoomMode && !existingRoom) {
      return sendJson(res, 404, { ok: false, error: 'Room not found. Host must create this room first.' });
    }

    if (!existingRoom && createRoomMode) {
      const createdRoom = await createRoom(supabaseUrl, serviceKey, roomCode, requestedMaxPlayers);
      if (!createdRoom) {
        return sendJson(res, 500, { ok: false, error: 'Failed to create room.' });
      }

      return sendJson(res, 200, {
        ok: true,
        isHost: true,
        room: {
          code: createdRoom.room_code,
          name: createdRoom.name,
          players: createdRoom.players,
          maxPlayers: createdRoom.max_players,
          status: createdRoom.status,
        },
        playerName: body.playerName ?? 'Host',
      });
    }

    if (!existingRoom) {
      return sendJson(res, 500, { ok: false, error: 'Room lookup failed.' });
    }

    if (existingRoom.game_type !== 'POKER') {
      return sendJson(res, 400, { ok: false, error: 'This room is not a poker room.' });
    }

    if (existingRoom.players >= existingRoom.max_players) {
      return sendJson(res, 400, { ok: false, error: 'Room is full.' });
    }

    const nextPlayers = Math.min(existingRoom.players + 1, existingRoom.max_players);
    const nextStatus = nextPlayers >= existingRoom.max_players ? 'full' : 'waiting';

    const updatedRoom = await updateRoom(supabaseUrl, serviceKey, existingRoom.id, {
      players: nextPlayers,
      status: nextStatus,
    });

    if (!updatedRoom) {
      return sendJson(res, 500, { ok: false, error: 'Failed to update room.' });
    }

    return sendJson(res, 200, {
      ok: true,
      isHost: false,
      room: {
        code: updatedRoom.room_code,
        name: updatedRoom.name,
        players: updatedRoom.players,
        maxPlayers: updatedRoom.max_players,
        status: updatedRoom.status,
      },
      playerName: body.playerName ?? 'Guest',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return sendJson(res, 500, { ok: false, error: message });
  }
}
