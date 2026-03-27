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
  const directBody = (req as ApiRequestBodyCarrier).body;

  if (directBody && typeof directBody === 'object' && !Buffer.isBuffer(directBody)) {
    return directBody as T;
  }

  if (typeof directBody === 'string' && directBody.trim()) {
    return JSON.parse(directBody) as T;
  }

  if (Buffer.isBuffer(directBody) && directBody.length) {
    return JSON.parse(directBody.toString('utf8')) as T;
  }

  if (typeof req.on === 'function') {
    const raw = await new Promise<string>((resolve, reject) => {
      const chunks: Buffer[] = [];
      req.on?.('data', (chunk: Buffer | string) => {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      });
      req.on?.('end', () => {
        resolve(Buffer.concat(chunks).toString('utf8'));
      });
      req.on?.('error', (error: unknown) => reject(error));
    });

    return raw.trim() ? (JSON.parse(raw) as T) : ({} as T);
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
