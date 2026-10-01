/**
 * QR entry gate for the connection form.
 *
 * A QR code encodes `/qr/<token>` where `<token>` is derived from the
 * `QR_CONNECT_SECRET` Worker secret. Scanning it stores a signed, expiring
 * cookie and redirects to the clean `/connect` URL. Visitors who type or
 * bookmark `/connect` without that cookie are bounced to `/visit`.
 *
 * No session storage is involved: token and cookie are HMAC-signed values
 * derived from the same secret, verified with WebCrypto in the Worker.
 *
 * This module must stay dependency-free: `scripts/connect-qr-url.mjs` imports
 * it directly under Node.
 */

/** Where non-QR visitors (and expired/invalid cookies) are sent. */
export const VISIT_PATH = "/visit";

/** Canonical URLs of the gated flow. */
export const CONNECT_PATH = "/connect";
export const CONNECT_THANKS_PATH = "/connect/thanks";
export const CONNECT_API_PATH = "/api/connect";

/** QR entry URL prefix: `/qr/<token>`. */
export const CONNECT_ENTRY_PREFIX = "/qr/";

export const CONNECT_COOKIE_NAME = "vbc_connect";

/** Cookie lifetime in seconds. */
export const CONNECT_COOKIE_MAX_AGE = 60 * 60 * 24;

/**
 * Redirect status for the gate. `304 Not Modified` is a cache response and
 * cannot redirect a browser, so the gate uses `302 Found`.
 */
export const GATE_REDIRECT_STATUS = 302;

const ENTRY_TOKEN_CONTEXT = "connect-entry:v1";
const COOKIE_CONTEXT = "connect-cookie:v1";
const COOKIE_PATTERN = /^(\d+)\.(.+)$/;
const TRAILING_PADDING = /=+$/;
const encoder = new TextEncoder();

const toBase64Url = (bytes: Uint8Array): string => {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCodePoint(byte);
  }
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(TRAILING_PADDING, "");
};

const sign = async (secret: string, value: string): Promise<string> => {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { hash: "SHA-256", name: "HMAC" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(value)
  );
  return toBase64Url(new Uint8Array(signature));
};

/** Constant-time string comparison (length differences leak only the length). */
export const timingSafeEqual = (a: string, b: string): boolean => {
  if (a.length !== b.length) {
    return false;
  }
  let difference = 0;
  for (let index = 0; index < a.length; index += 1) {
    // oxlint-disable-next-line no-bitwise
    difference |= (a.codePointAt(index) ?? 0) ^ (b.codePointAt(index) ?? 0);
  }
  return difference === 0;
};

/** Token encoded in the printed QR code. Rotating the secret invalidates it. */
export const deriveConnectEntryToken = (secret: string): Promise<string> =>
  sign(secret, ENTRY_TOKEN_CONTEXT);

export const verifyConnectEntryToken = async (
  token: string,
  secret: string
): Promise<boolean> => {
  if (!(token && secret)) {
    return false;
  }
  return timingSafeEqual(token, await deriveConnectEntryToken(secret));
};

/**
 * Signed, expiring cookie value: `<expiresAt>.<hmac>`.
 * `expiresAt` is a Unix timestamp in seconds.
 */
export const buildConnectCookieValue = async (
  secret: string,
  now = Date.now()
): Promise<string> => {
  const expiresAt = Math.floor(now / 1000) + CONNECT_COOKIE_MAX_AGE;
  return `${expiresAt}.${await sign(secret, `${COOKIE_CONTEXT}:${expiresAt}`)}`;
};

export const verifyConnectCookieValue = async (
  value: string | undefined,
  secret: string,
  now = Date.now()
): Promise<boolean> => {
  const match = value && secret ? COOKIE_PATTERN.exec(value) : null;
  if (!match) {
    return false;
  }
  const expiresAt = Number(match[1]);
  if (expiresAt * 1000 <= now) {
    return false;
  }
  return timingSafeEqual(
    match[2],
    await sign(secret, `${COOKIE_CONTEXT}:${expiresAt}`)
  );
};

/** Paths that require a valid QR cookie. */
const GATED_PATHS = new Set<string>([
  CONNECT_PATH,
  `${CONNECT_PATH}/`,
  CONNECT_THANKS_PATH,
  `${CONNECT_THANKS_PATH}/`,
  CONNECT_API_PATH,
  `${CONNECT_API_PATH}/`,
]);

export const isConnectEntryPath = (pathname: string): boolean =>
  pathname.startsWith(CONNECT_ENTRY_PREFIX);

export const isConnectGatePath = (pathname: string): boolean =>
  GATED_PATHS.has(pathname);
