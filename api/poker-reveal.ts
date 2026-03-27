type RevealBody = {
  handId?: string;
};

type HandRow = {
  id: string;
  reveal_stage: number;
  all_community_cards: unknown;
  community_cards: unknown;
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

async function parseBody(req: any): Promise<RevealBody> {
  if (req.body && typeof req.body === 'object') {
    return req.body as RevealBody;
  }

  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body) as RevealBody;
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

    if (!body.handId) {
      return sendJson(res, 400, { ok: false, error: 'handId is required.' });
    }

    const fetchHandRes = await fetch(
      `${supabaseUrl}/rest/v1/poker_hands?id=eq.${encodeURIComponent(body.handId)}&select=id,reveal_stage,all_community_cards,community_cards`,
      { headers: supabaseHeaders(serviceKey) },
    );

    if (!fetchHandRes.ok) {
      return sendJson(res, 500, { ok: false, error: await fetchHandRes.text() });
    }

    const handRows = (await fetchHandRes.json()) as HandRow[];
    const hand = handRows[0];

    if (!hand) {
      return sendJson(res, 404, { ok: false, error: 'Hand not found.' });
    }

    const currentStage = hand.reveal_stage ?? 0;
    const nextStage = Math.min(currentStage + 1, 3);

    const allCommunityCards = Array.isArray(hand.all_community_cards) ? hand.all_community_cards : [];
    const revealCount = nextStage === 1 ? 3 : nextStage === 2 ? 4 : 5;
    const communityCards = allCommunityCards.slice(0, revealCount);

    const updateHandRes = await fetch(`${supabaseUrl}/rest/v1/poker_hands?id=eq.${encodeURIComponent(body.handId)}`, {
      method: 'PATCH',
      headers: {
        ...supabaseHeaders(serviceKey),
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        reveal_stage: nextStage,
        community_cards: communityCards,
      }),
    });

    if (!updateHandRes.ok) {
      return sendJson(res, 500, { ok: false, error: await updateHandRes.text() });
    }

    const updatedRows = (await updateHandRes.json()) as HandRow[];
    const updatedHand = updatedRows[0];

    if (!updatedHand) {
      return sendJson(res, 500, { ok: false, error: 'Failed to update poker hand.' });
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
    const message = error instanceof Error ? error.message : 'Internal server error';
    return sendJson(res, 500, { ok: false, error: message });
  }
}
