import { randomDiceResults } from './_lib/games';
import { getSupabaseAdmin } from './_lib/supabase';
import { handleApiError, methodNotAllowed, parseJsonBody, sendJson } from './_lib/http';

type DiceRollBody = {
  diceCount?: number;
  playerName?: string;
};

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== 'POST') {
      return methodNotAllowed(req, res, ['POST']);
    }

    const body = await parseJsonBody<DiceRollBody>(req);
    const diceCount = Number(body.diceCount ?? 5);

    if (!Number.isInteger(diceCount) || diceCount < 1 || diceCount > 10) {
      return sendJson(res, 400, { ok: false, error: 'diceCount must be an integer between 1 and 10.' });
    }

    const results = randomDiceResults(diceCount);
    const total = results.reduce((sum, value) => sum + value, 0);

    const supabase = getSupabaseAdmin() as any;
    const { data, error } = await supabase
      .from('dice_rolls')
      .insert({
        player_name: body.playerName ?? 'Guest',
        dice_count: diceCount,
        results,
        total,
      })
      .select('id, created_at')
      .single();

    if (error) {
      throw error;
    }

    return sendJson(res, 200, {
      ok: true,
      rollId: data?.id ?? null,
      createdAt: data?.created_at ?? null,
      results,
      total,
    });
  } catch (error) {
    return handleApiError(res, error);
  }
}
