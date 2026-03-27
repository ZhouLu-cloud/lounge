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

  if (typeof req.on === 'function') {
    const raw = await new Promise<string>((resolve, reject) => {
      const chunks: Uint8Array[] = [];
      req.on?.('data', (chunk: any) => {
        if (hasBuffer && Buffer.isBuffer(chunk)) {
          chunks.push(chunk);
        } else if (chunk instanceof Uint8Array) {
          chunks.push(chunk);
        } else {
          chunks.push(new TextEncoder().encode(String(chunk)));
        }
      });
      req.on?.('end', () => {
        const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
        const merged = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of chunks) {
          merged.set(chunk, offset);
          offset += chunk.length;
        }
        resolve(new TextDecoder().decode(merged));
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
