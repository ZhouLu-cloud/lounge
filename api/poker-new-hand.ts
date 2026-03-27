import { buildPokerHand } from './_lib/games';

type NewHandBody = {
  roomCode?: string;
  playerName?: string;
  isHost?: boolean;
};

const ROOM_CODE_REGEX = /^\d{4}$/;

type RoomRow = {
  id: string;
  room_code: string;
  players: number;
  max_players: number;
  status: string;
  game_type: string;
};

type HandRow = {
  id: string;
  room_code: string;
  player_name: string;
  player_cards: unknown;
  all_community_cards: unknown;
  community_cards: unknown;
  reveal_stage: number;
  created_at: string;
};

function sendJson(res: any, statusCode: number, payload: unknown) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function supabaseHeaders(apiKey: string) {
  return {
    apikey: apiKey,
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
}

async function parseBody(req: any): Promise<NewHandBody> {
  if (req.body && typeof req.body === 'object') {
    return req.body as NewHandBody;
  }

  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body) as NewHandBody;
    } catch {
      return {};
    }
  }

  return await new Promise<NewHandBody>((resolve) => {
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
        resolve(JSON.parse(raw) as NewHandBody);
      } catch {
        resolve({});
      }
    });

    req.on('error', () => resolve({}));
  });
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
    const isHost = Boolean(body.isHost);

    if (!ROOM_CODE_REGEX.test(roomCode)) {
      return sendJson(res, 400, { ok: false, error: 'roomCode must be 4 digits.' });
    }

    if (!isHost) {
      return sendJson(res, 403, { ok: false, error: 'Only host can start the game.' });
    }

    const roomRes = await fetch(
      `${supabaseUrl}/rest/v1/game_rooms?room_code=eq.${encodeURIComponent(roomCode)}&select=id,room_code,players,max_players,status,game_type`,
      { headers: supabaseHeaders(serviceKey) },
    );

    if (!roomRes.ok) {
      return sendJson(res, 500, { ok: false, error: await roomRes.text() });
    }

    const roomRows = (await roomRes.json()) as RoomRow[];
    const room = roomRows[0];

    if (!room) {
      return sendJson(res, 404, { ok: false, error: 'Room not found.' });
    }

    if (room.game_type !== 'POKER') {
      return sendJson(res, 400, { ok: false, error: 'Invalid room type.' });
    }

    if (room.players < room.max_players) {
      return sendJson(res, 400, { ok: false, error: 'Room is not full yet.' });
    }

    const hand = buildPokerHand();

    const createHandRes = await fetch(`${supabaseUrl}/rest/v1/poker_hands`, {
      method: 'POST',
      headers: {
        ...supabaseHeaders(serviceKey),
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        room_code: roomCode,
        player_name: body.playerName ?? 'Host',
        player_cards: hand.playerCards,
        all_community_cards: hand.allCommunityCards,
        community_cards: hand.communityCards,
        reveal_stage: hand.revealStage,
      }),
    });

    if (!createHandRes.ok) {
      return sendJson(res, 500, { ok: false, error: await createHandRes.text() });
    }

    const handRows = (await createHandRes.json()) as HandRow[];
    const data = handRows[0];

    if (!data) {
      return sendJson(res, 500, { ok: false, error: 'Failed to create poker hand.' });
    }

    const updateRoomRes = await fetch(`${supabaseUrl}/rest/v1/game_rooms?id=eq.${encodeURIComponent(room.id)}`, {
      method: 'PATCH',
      headers: {
        ...supabaseHeaders(serviceKey),
      },
      body: JSON.stringify({ status: 'active' }),
    });

    if (!updateRoomRes.ok) {
      return sendJson(res, 500, { ok: false, error: await updateRoomRes.text() });
    }

    return sendJson(res, 200, {
      ok: true,
      hand: {
        id: data.id,
        roomCode: data.room_code,
        playerName: data.player_name,
        playerCards: data.player_cards,
        allCommunityCards: data.all_community_cards,
        communityCards: data.community_cards,
        revealStage: data.reveal_stage,
        createdAt: data.created_at,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return sendJson(res, 500, { ok: false, error: message });
  }
}
