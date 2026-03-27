import { randomDiceResults } from './_lib/games';

type DiceRollBody = {
  diceCount?: number;
  playerName?: string;
};

type DiceRollRow = {
  id: string;
  created_at: string;
};

type HandlerPayload = {
  ok: boolean;
  [key: string]: unknown;
};

function isNodeResponse(res: any) {
  return !!res && typeof res.setHeader === 'function' && typeof res.end === 'function';
}

function sendNodeJson(res: any, statusCode: number, payload: HandlerPayload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function sendWebJson(statusCode: number, payload: HandlerPayload) {
  return new Response(JSON.stringify(payload), {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}

function respond(req: any, res: any, statusCode: number, payload: HandlerPayload) {
  if (isNodeResponse(res)) {
    sendNodeJson(res, statusCode, payload);
    return;
  }

  return sendWebJson(statusCode, payload);
}

function supabaseHeaders(apiKey: string) {
  return {
    apikey: apiKey,
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
}

async function parseBody(req: any, res?: any): Promise<DiceRollBody> {
  if (!isNodeResponse(res) && typeof req?.json === 'function') {
    try {
      const parsed = await req.json();
      if (parsed && typeof parsed === 'object') {
        return parsed as DiceRollBody;
      }
      return {};
    } catch {
      return {};
    }
  }

  if (req?.body && typeof req.body === 'object') {
    return req.body as DiceRollBody;
  }

  if (typeof req?.body === 'string') {
    try {
      return JSON.parse(req.body) as DiceRollBody;
    } catch {
      return {};
    }
  }

  if (typeof req?.on === 'function') {
    return await new Promise<DiceRollBody>((resolve) => {
      const chunks: string[] = [];

      req.on('data', (chunk: any) => {
        if (typeof chunk === 'string') {
          chunks.push(chunk);
          return;
        }

        if (typeof Buffer !== 'undefined' && Buffer.isBuffer(chunk)) {
          chunks.push(chunk.toString('utf8'));
          return;
        }

        if (chunk instanceof Uint8Array) {
          chunks.push(String.fromCharCode(...chunk));
          return;
        }

        chunks.push(String(chunk ?? ''));
      });

      req.on('end', () => {
        const raw = chunks.join('').trim();
        if (!raw) {
          resolve({});
          return;
        }
        try {
          resolve(JSON.parse(raw) as DiceRollBody);
        } catch {
          resolve({});
        }
      });

      req.on('error', () => resolve({}));
    });
  }

  return {};
}

export default async function handler(req: any, res?: any) {
  try {
    if ((req?.method ?? '').toUpperCase() !== 'POST') {
      if (isNodeResponse(res)) {
        res.setHeader('Allow', 'POST');
      }
      return respond(req, res, 405, {
        ok: false,
        error: `Method ${req?.method ?? 'UNKNOWN'} not allowed`,
      });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return respond(req, res, 500, { ok: false, error: 'Missing Supabase environment variables.' });
    }

    const body = await parseBody(req, res);
    const diceCount = Number(body.diceCount ?? 5);

    if (!Number.isInteger(diceCount) || diceCount < 1 || diceCount > 10) {
      return respond(req, res, 400, { ok: false, error: 'diceCount must be an integer between 1 and 10.' });
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
      return respond(req, res, 500, { ok: false, error: await insertRes.text() });
    }

    const rows = (await insertRes.json()) as DiceRollRow[];
    const data = rows[0] ?? null;

    return respond(req, res, 200, {
      ok: true,
      rollId: data?.id ?? null,
      createdAt: data?.created_at ?? null,
      results,
      total,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return respond(req, res, 500, { ok: false, error: message });
  }
}
