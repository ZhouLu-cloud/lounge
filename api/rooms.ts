import { getSupabaseAdmin } from './_lib/supabase';
import { handleApiError, methodNotAllowed, sendJson } from './_lib/http';

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== 'GET') {
      return methodNotAllowed(req, res, ['GET']);
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('game_rooms')
      .select('id,name,game_type,players,max_players,min_buy_in,stakes,status,chinese_name')
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

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
    return handleApiError(res, error);
  }
}
