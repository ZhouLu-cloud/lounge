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
  if (!res) {
    return;
  }

  if (typeof res.status === 'function' && typeof res.json === 'function') {
    res.status(statusCode).json(payload);
    return;
  }

  if (typeof res.setHeader !== 'function' || typeof res.end !== 'function') {
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
  const hasBuffer = typeof Buffer !== 'undefined';

  const directBody = (req as ApiRequestBodyCarrier).body;

  if (directBody && typeof directBody === 'object' && !(hasBuffer && Buffer.isBuffer(directBody))) {
    return directBody as T;
  }

  if (typeof directBody === 'string' && directBody.trim()) {
    try {
      return JSON.parse(directBody) as T;
    } catch {
      return {} as T;
    }
  }

  if (hasBuffer && Buffer.isBuffer(directBody) && directBody.length) {
    try {
      return JSON.parse(directBody.toString('utf8')) as T;
    } catch {
      return {} as T;
    }
  }

  const requestLike = req as any;

  if (typeof requestLike?.json === 'function') {
    try {
      const parsed = await requestLike.json();
      if (parsed && typeof parsed === 'object') {
        return parsed as T;
      }
      return {} as T;
    } catch {
      return {} as T;
    }
  }

  if (typeof req.on === 'function') {
    const raw = await new Promise<string>((resolve, reject) => {
      const chunks: any[] = [];
      req.on?.('data', (chunk: any) => {
        chunks.push(chunk);
      });
      req.on?.('end', () => {
        const rawText = chunks
          .map((chunk) => {
            if (typeof chunk === 'string') {
              return chunk;
            }

            if (hasBuffer && Buffer.isBuffer(chunk)) {
              return chunk.toString('utf8');
            }

            if (chunk instanceof Uint8Array) {
              return String.fromCharCode(...chunk);
            }

            return String(chunk ?? '');
          })
          .join('');

        resolve(rawText);
      });
      req.on?.('error', (error: unknown) => reject(error));
    });

    if (!raw.trim()) {
      return {} as T;
    }

    try {
      return JSON.parse(raw) as T;
    } catch {
      return {} as T;
    }
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
