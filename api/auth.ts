import {
  clearSessionCookie,
  createSessionCookie,
  isAuthConfigured,
  isAuthenticated,
  isValidPasscode,
  setCorsHeaders,
  type ApiRequest,
  type ApiResponse,
} from './_auth';

function readPasscode(body: unknown) {
  if (!body || typeof body !== 'object' || !('passcode' in body)) {
    return '';
  }

  return (body as { passcode?: unknown }).passcode;
}

export default function handler(request: ApiRequest, response: ApiResponse) {
  setCorsHeaders(response);

  if (request.method === 'OPTIONS') {
    response.status(204).json({});
    return;
  }

  if (request.method === 'GET') {
    response.status(200).json({
      authRequired: true,
      configured: isAuthConfigured(),
      authenticated: isAuthenticated(request),
    });
    return;
  }

  if (request.method === 'DELETE') {
    response.setHeader('Set-Cookie', clearSessionCookie());
    response.status(200).json({ authenticated: false });
    return;
  }

  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!isAuthConfigured()) {
    response.status(503).json({ error: 'App passcode is not configured' });
    return;
  }

  if (!isValidPasscode(readPasscode(request.body))) {
    response.status(401).json({ error: 'Invalid passcode' });
    return;
  }

  response.setHeader('Set-Cookie', createSessionCookie());
  response.status(200).json({ authenticated: true });
}
