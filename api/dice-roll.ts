import { randomDiceResults } from './_lib/games';
import { handleApiError, methodNotAllowed, parseJsonBody, sendJson } from './_lib/http';

type DiceRollBody = {
  diceCount?: number;
  playerName?: string;
};

type DiceRollRow = {
  id: string;
  created_at: string;
};

function supabaseHeaders(apiKey: string) {
  return {
    apikey: apiKey,
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
}

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== 'POST') {
      return methodNotAllowed(req, res, ['POST']);
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return sendJson(res, 500, { ok: false, error: 'Missing Supabase environment variables.' });
    }

    const body = await parseJsonBody<DiceRollBody>(req);
    const diceCount = Number(body.diceCount ?? 5);

    if (!Number.isInteger(diceCount) || diceCount < 1 || diceCount > 10) {
      return sendJson(res, 400, { ok: false, error: 'diceCount must be an integer between 1 and 10.' });
    }

    const results = randomDiceResults(diceCount);
    const total = results.reduce((sum, value) => sum + value, 0);

    const insertRes = await fetch(`${supabaseUrl}/rest/v1/dice_rolls`, {
      method: 'POST',
      headers: {
        ...supabaseHeaders(serviceKey),
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        player_name: body.playerName ?? 'Guest',
        dice_count: diceCount,
        results,
        total,
      }),
    });

    if (!insertRes.ok) {
      return sendJson(res, 500, { ok: false, error: await insertRes.text() });
    }

    const rows = (await insertRes.json()) as DiceRollRow[];
    const data = rows[0] ?? null;

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
