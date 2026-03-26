import { drawLadyCard } from './_lib/games';
import { getSupabaseAdmin } from './_lib/supabase';
import { handleApiError, methodNotAllowed, parseJsonBody, sendJson } from './_lib/http';

type DrawBody = {
  playerName?: string;
};

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== 'POST') {
      return methodNotAllowed(req, res, ['POST']);
    }

    const body = await parseJsonBody<DrawBody>(req);
    const card = drawLadyCard();

    const supabase = getSupabaseAdmin() as any;
    const { data, error } = await supabase
      .from('lady_cards_draws')
      .insert({
        player_name: body.playerName ?? 'Guest',
        card_value: card.v,
        suit_name: card.s.name,
        suit_icon: card.s.icon,
        suit_color: card.s.color,
        card_name: card.name,
        rule_text: card.rule,
        rule_icon: card.icon,
      })
      .select('id, created_at')
      .single();

    if (error) {
      throw error;
    }

    return sendJson(res, 200, {
      ok: true,
      drawId: data?.id ?? null,
      createdAt: data?.created_at ?? null,
      card,
    });
  } catch (error) {
    return handleApiError(res, error);
  }
}
