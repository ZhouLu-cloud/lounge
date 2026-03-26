import { handleApiError, methodNotAllowed, sendJson } from './_lib/http';

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== 'GET') {
      return methodNotAllowed(req, res, ['GET']);
    }

    return sendJson(res, 200, {
      ok: true,
      service: 'the-lounge-api',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return handleApiError(res, error);
  }
}
