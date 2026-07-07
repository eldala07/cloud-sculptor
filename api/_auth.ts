import { createHmac, timingSafeEqual } from 'node:crypto';

export interface ApiRequest {
  method?: string;
  body?: unknown;
  headers?: Record<string, string | string[] | undefined>;
}

export interface ApiResponse {
  status: (statusCode: number) => ApiResponse;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string | string[]) => void;
}

const cookieName = 'cloud_sculptor_session';
const sessionMaxAgeSeconds = 60 * 60 * 24 * 14;

function getPasscode() {
  return process.env.APP_PASSCODE ?? '';
}

function getSecret() {
  return process.env.AUTH_SECRET ?? process.env.APP_PASSCODE ?? process.env.OPENAI_API_KEY ?? 'cloud-sculptor-dev';
}

function base64Url(value: string) {
  return Buffer.from(value).toString('base64url');
}

function sign(value: string) {
  return createHmac('sha256', getSecret()).update(value).digest('base64url');
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function getCookieHeader(request: ApiRequest) {
  const cookie = request.headers?.cookie ?? request.headers?.Cookie;

  if (Array.isArray(cookie)) {
    return cookie.join('; ');
  }

  return cookie ?? '';
}

function readCookie(request: ApiRequest, name: string) {
  return getCookieHeader(request)
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

export function isAuthConfigured() {
  return Boolean(getPasscode());
}

export function isValidPasscode(value: unknown) {
  const passcode = getPasscode();

  return typeof value === 'string' && Boolean(passcode) && safeEqual(value, passcode);
}

export function createSessionCookie() {
  const expiresAt = Date.now() + sessionMaxAgeSeconds * 1000;
  const payload = JSON.stringify({ expiresAt });
  const encodedPayload = base64Url(payload);
  const token = `${encodedPayload}.${sign(encodedPayload)}`;
  const secureFlag = process.env.NODE_ENV === 'production' ? '; Secure' : '';

  return `${cookieName}=${token}; Path=/; HttpOnly; SameSite=Lax${secureFlag}; Max-Age=${sessionMaxAgeSeconds}`;
}

export function clearSessionCookie() {
  const secureFlag = process.env.NODE_ENV === 'production' ? '; Secure' : '';

  return `${cookieName}=; Path=/; HttpOnly; SameSite=Lax${secureFlag}; Max-Age=0`;
}

export function isAuthenticated(request: ApiRequest) {
  if (!isAuthConfigured()) {
    return false;
  }

  const token = readCookie(request, cookieName);

  if (!token) {
    return false;
  }

  const [encodedPayload, signature] = token.split('.');

  if (!encodedPayload || !signature || !safeEqual(signature, sign(encodedPayload))) {
    return false;
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as { expiresAt?: unknown };
    return typeof payload.expiresAt === 'number' && payload.expiresAt > Date.now();
  } catch {
    return false;
  }
}

export function setCorsHeaders(response: ApiResponse) {
  response.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN ?? '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}
