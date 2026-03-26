type ApiRequest = {
  method?: string;
  body?: unknown;
  on?: (event: string, listener: (...args: any[]) => void) => void;
  [Symbol.asyncIterator]?: () => AsyncIterator<any>;
} & Record<string, any>;

type ApiResponse = {
  statusCode?: number;
  setHeader: (name: string, value: string) => void;
  end: (body?: string) => void;
  status?: (code: number) => ApiResponse;
  json?: (body: unknown) => void;
} & Record<string, any>;

type ApiRequestBodyCarrier = {
  body?: unknown;
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
  if ((req as ApiRequestBodyCarrier).body && typeof (req as ApiRequestBodyCarrier).body === 'object') {
    return (req as ApiRequestBodyCarrier).body as T;
  }

  if (typeof req[Symbol.asyncIterator] === 'function') {
    const chunks: Uint8Array[] = [];
    for await (const chunk of req as any) {
      if (chunk instanceof Uint8Array) {
        chunks.push(chunk);
      } else {
        chunks.push(new TextEncoder().encode(String(chunk)));
      }
    }

    if (!chunks.length) {
      return {} as T;
    }

    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const merged = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }

    const raw = new TextDecoder().decode(merged);
    return raw ? (JSON.parse(raw) as T) : ({} as T);
  }

  const fallbackBody = (req as ApiRequestBodyCarrier).body;
  if (typeof fallbackBody === 'string' && fallbackBody.trim()) {
    return JSON.parse(fallbackBody) as T;
  }

  return {} as T;
}

export function handleApiError(res: ApiResponse, error: unknown, fallback = 'Internal server error') {
  const message = error instanceof Error ? error.message : fallback;
  sendJson(res, 500, {
    ok: false,
    error: message || fallback,
  });
}
