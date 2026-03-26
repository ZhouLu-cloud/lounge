import { getSupabaseAdmin } from './_lib/supabase';
import { handleApiError, methodNotAllowed, parseJsonBody, sendJson } from './_lib/http';

type RevealBody = {
  handId?: string;
};

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== 'POST') {
      return methodNotAllowed(req, res, ['POST']);
    }

    const body = await parseJsonBody<RevealBody>(req);

    if (!body.handId) {
      return sendJson(res, 400, { ok: false, error: 'handId is required.' });
    }

    const supabase = getSupabaseAdmin() as any;
    const { data: hand, error: fetchError } = await supabase
      .from('poker_hands')
      .select('id, reveal_stage, all_community_cards')
      .eq('id', body.handId)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    if (!hand) {
      return sendJson(res, 404, { ok: false, error: 'Hand not found.' });
    }

    const currentStage = hand.reveal_stage ?? 0;
    const nextStage = Math.min(currentStage + 1, 3);

    const allCommunityCards = Array.isArray(hand.all_community_cards) ? hand.all_community_cards : [];
    const revealCount = nextStage === 1 ? 3 : nextStage === 2 ? 4 : 5;
    const communityCards = allCommunityCards.slice(0, revealCount);

    const { data: updatedHand, error: updateError } = await supabase
      .from('poker_hands')
      .update({
        reveal_stage: nextStage,
        community_cards: communityCards,
      })
      .eq('id', body.handId)
      .select('id, reveal_stage, community_cards, all_community_cards')
      .single();

    if (updateError) {
      throw updateError;
    }

    if (!updatedHand) {
      throw new Error('Failed to update poker hand.');
    }

    return sendJson(res, 200, {
      ok: true,
      hand: {
        id: updatedHand.id,
        revealStage: updatedHand.reveal_stage,
        communityCards: updatedHand.community_cards,
        allCommunityCards: updatedHand.all_community_cards,
      },
    });
  } catch (error) {
    return handleApiError(res, error);
  }
}
