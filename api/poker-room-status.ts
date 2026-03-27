const ROOM_CODE_REGEX = /^\d{4}$/;

type RoomRow = {
  room_code: string;
  name: string;
  players: number;
  max_players: number;
  status: string;
};

type HandRow = {
  id: string;
  player_cards: unknown;
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

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      return sendJson(res, 405, { ok: false, error: 'Method not allowed.' });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return sendJson(res, 500, { ok: false, error: 'Missing Supabase environment variables.' });
    }

    const roomCode = String(req.query?.roomCode ?? '').trim();
    if (!ROOM_CODE_REGEX.test(roomCode)) {
      return sendJson(res, 400, { ok: false, error: 'roomCode query is required and must be 4 digits.' });
    }

    const roomResponse = await fetch(
      `${supabaseUrl}/rest/v1/game_rooms?room_code=eq.${encodeURIComponent(roomCode)}&select=room_code,name,players,max_players,status`,
      { headers: supabaseHeaders(serviceKey) },
    );

    if (!roomResponse.ok) {
      return sendJson(res, 500, { ok: false, error: await roomResponse.text() });
    }

    const roomRows = (await roomResponse.json()) as RoomRow[];
    const room = roomRows[0];

    if (!room) {
      return sendJson(res, 404, { ok: false, error: 'Room not found.' });
    }

    const handResponse = await fetch(
      `${supabaseUrl}/rest/v1/poker_hands?room_code=eq.${encodeURIComponent(roomCode)}&select=id,player_cards,community_cards,reveal_stage,created_at&order=created_at.desc&limit=1`,
      { headers: supabaseHeaders(serviceKey) },
    );

    if (!handResponse.ok) {
      return sendJson(res, 500, { ok: false, error: await handResponse.text() });
    }

    const handRows = (await handResponse.json()) as HandRow[];
    const latestHand = handRows[0] ?? null;

    return sendJson(res, 200, {
      ok: true,
      room: {
        code: room.room_code,
        name: room.name,
        players: room.players,
        maxPlayers: room.max_players,
        status: room.status,
      },
      hand: latestHand
        ? {
            id: latestHand.id,
            playerCards: latestHand.player_cards,
            communityCards: latestHand.community_cards,
            revealStage: latestHand.reveal_stage,
            createdAt: latestHand.created_at,
          }
        : null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return sendJson(res, 500, { ok: false, error: message });
  }
}
