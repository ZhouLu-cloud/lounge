import { IncomingMessage, ServerResponse } from 'node:http';

type ApiRequest = IncomingMessage & {
  body?: unknown;
};

type ApiResponse = ServerResponse & {
  status?: (code: number) => ApiResponse;
  json?: (body: unknown) => void;
};

export type JsonRecord = Record<string, unknown>;

export function sendJson(res: ApiResponse, statusCode: number, payload: unknown) {
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    res.status(statusCode).json(payload);
    return;
  }

  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

export function methodNotAllowed(req: ApiRequest, res: ApiResponse, allowed: string[]) {
  res.setHeader('Allow', allowed.join(', '));
  sendJson(res, 405, {
    ok: false,
    error: `Method ${req.method ?? 'UNKNOWN'} not allowed`,
  });
}

export async function parseJsonBody<T = JsonRecord>(req: ApiRequest): Promise<T> {
  if (req.body && typeof req.body === 'object') {
    return req.body as T;
  }

  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (!chunks.length) {
    return {} as T;
  }

  const raw = Buffer.concat(chunks).toString('utf8');
  return JSON.parse(raw) as T;
}

export function handleApiError(res: ApiResponse, error: unknown, fallback = 'Internal server error') {
  const message = error instanceof Error ? error.message : fallback;
  sendJson(res, 500, {
    ok: false,
    error: message || fallback,
  });
}
