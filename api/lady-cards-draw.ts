import { drawLadyCard } from './_lib/games';

type DrawBody = {
  playerName?: string;
};

type DrawRow = {
  id: string;
  created_at: string;
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

async function parseBody(req: any): Promise<DrawBody> {
  if (req.body && typeof req.body === 'object') {
    return req.body as DrawBody;
  }

  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body) as DrawBody;
    } catch {
      return {};
    }
  }

  return {};
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

    const body = await parseBody(req);
    const card = drawLadyCard();

    const insertRes = await fetch(`${supabaseUrl}/rest/v1/lady_cards_draws`, {
      method: 'POST',
      headers: {
        ...supabaseHeaders(serviceKey),
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        player_name: body.playerName ?? 'Guest',
        card_value: card.v,
        suit_name: card.s.name,
        suit_icon: card.s.icon,
        suit_color: card.s.color,
        card_name: card.name,
        rule_text: card.rule,
        rule_icon: card.icon,
      }),
    });

    if (!insertRes.ok) {
      return sendJson(res, 500, { ok: false, error: await insertRes.text() });
    }

    const rows = (await insertRes.json()) as DrawRow[];
    const data = rows[0] ?? null;

    return sendJson(res, 200, {
      ok: true,
      drawId: data?.id ?? null,
      createdAt: data?.created_at ?? null,
      card,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return sendJson(res, 500, { ok: false, error: message });
  }
}
