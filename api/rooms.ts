type RoomRow = {
  id: string;
  name: string;
  game_type: string;
  players: number;
  max_players: number;
  min_buy_in: number | null;
  stakes: string | null;
  status: string;
  chinese_name: string | null;
};

function sendJson(res: any, statusCode: number, payload: unknown) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function methodNotAllowed(req: any, res: any, allowed: string[]) {
  res.setHeader('Allow', allowed.join(', '));
  return sendJson(res, 405, {
    ok: false,
    error: `Method ${req.method ?? 'UNKNOWN'} not allowed`,
  });
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
      return methodNotAllowed(req, res, ['GET']);
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return sendJson(res, 500, { ok: false, error: 'Missing Supabase environment variables.' });
    }

    const response = await fetch(
      `${supabaseUrl}/rest/v1/game_rooms?select=id,name,game_type,players,max_players,min_buy_in,stakes,status,chinese_name&order=created_at.asc`,
      { headers: supabaseHeaders(serviceKey) },
    );

    if (!response.ok) {
      return sendJson(res, 500, { ok: false, error: await response.text() });
    }

    const data = (await response.json()) as RoomRow[];

    const rooms = (data ?? []).map((room) => ({
      id: room.id,
      name: room.name,
      type: room.game_type,
      players: room.players,
      maxPlayers: room.max_players,
      minBuyIn: room.min_buy_in,
      stakes: room.stakes,
      status: room.status,
      chineseName: room.chinese_name,
    }));

    return sendJson(res, 200, {
      ok: true,
      rooms,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return sendJson(res, 500, { ok: false, error: message });
  }
}
