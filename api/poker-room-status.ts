import { getSupabaseAdmin } from './_lib/supabase';
import { handleApiError, methodNotAllowed, sendJson } from './_lib/http';

const ROOM_CODE_REGEX = /^\d{4}$/;

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== 'GET') {
      return methodNotAllowed(req, res, ['GET']);
    }

    const roomCode = String(req.query?.roomCode ?? '').trim();

    if (!ROOM_CODE_REGEX.test(roomCode)) {
      return sendJson(res, 400, { ok: false, error: 'roomCode query is required and must be 4 digits.' });
    }

    const supabase = getSupabaseAdmin() as any;

    const { data: room, error: roomError } = await supabase
      .from('game_rooms')
      .select('room_code,name,players,max_players,status')
      .eq('room_code', roomCode)
      .single();

    if (roomError) {
      throw roomError;
    }

    if (!room) {
      return sendJson(res, 404, { ok: false, error: 'Room not found.' });
    }

    const { data: latestHand, error: handError } = await supabase
      .from('poker_hands')
      .select('id, player_cards, community_cards, reveal_stage, created_at')
      .eq('room_code', roomCode)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (handError) {
      throw handError;
    }

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
    return handleApiError(res, error);
  }
}
