import { buildPokerHand } from './_lib/games';
import { getSupabaseAdmin } from './_lib/supabase';
import { handleApiError, methodNotAllowed, parseJsonBody, sendJson } from './_lib/http';

type NewHandBody = {
  roomCode?: string;
  playerName?: string;
};

const ROOM_CODE_REGEX = /^\d{4}$/;

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== 'POST') {
      return methodNotAllowed(req, res, ['POST']);
    }

    const body = await parseJsonBody<NewHandBody>(req);
    const roomCode = (body.roomCode ?? '').trim();

    if (!ROOM_CODE_REGEX.test(roomCode)) {
      return sendJson(res, 400, { ok: false, error: 'roomCode must be 4 digits.' });
    }

    const hand = buildPokerHand();

    const supabase = getSupabaseAdmin() as any;
    const { data, error } = await supabase
      .from('poker_hands')
      .insert({
        room_code: roomCode,
        player_name: body.playerName ?? 'Guest',
        player_cards: hand.playerCards,
        all_community_cards: hand.allCommunityCards,
        community_cards: hand.communityCards,
        reveal_stage: hand.revealStage,
      })
      .select('id, room_code, player_name, player_cards, all_community_cards, community_cards, reveal_stage, created_at')
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error('Failed to create poker hand.');
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
    return handleApiError(res, error);
  }
}
