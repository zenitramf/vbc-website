import type { APIContext } from "astro";
import { defineMiddleware } from "astro:middleware";

import {
  buildConnectCookieValue,
  CONNECT_COOKIE_MAX_AGE,
  CONNECT_COOKIE_NAME,
  CONNECT_ENTRY_PREFIX,
  CONNECT_PATH,
  GATE_REDIRECT_STATUS,
  isConnectEntryPath,
  isConnectGatePath,
  verifyConnectCookieValue,
  verifyConnectEntryToken,
  VISIT_PATH,
} from "@/lib/connect-gate";

// Loaded lazily: middleware also runs at build time while prerendering the
// static pages, which must not depend on the Cloudflare runtime.
const loadSecret = async (): Promise<string> => {
  const { env } = await import("cloudflare:workers");
  return env.QR_CONNECT_SECRET ?? "";
};

const hasGateCookie = (context: APIContext, secret: string): Promise<boolean> =>
  verifyConnectCookieValue(
    context.cookies.get(CONNECT_COOKIE_NAME)?.value,
    secret
  );

/** Exchanges a valid `/qr/<token>` for the signed gate cookie. */
const enterViaQr = async (
  context: APIContext,
  secret: string
): Promise<Response> => {
  // Tokens are already base64url. Invalid percent escapes are simply
  // invalid tokens, not inputs to decodeURIComponent (which can throw).
  const token = context.url.pathname.slice(CONNECT_ENTRY_PREFIX.length);
  if (!(await verifyConnectEntryToken(token, secret))) {
    return context.redirect(VISIT_PATH, GATE_REDIRECT_STATUS);
  }
  context.cookies.set(
    CONNECT_COOKIE_NAME,
    await buildConnectCookieValue(secret),
    {
      httpOnly: true,
      maxAge: CONNECT_COOKIE_MAX_AGE,
      path: "/",
      sameSite: "lax",
      secure: context.url.protocol === "https:",
    }
  );
  return context.redirect(CONNECT_PATH, GATE_REDIRECT_STATUS);
};

/**
 * QR gate for the connection form.
 *
 * - `/qr/<token>` (the URL encoded in the printed QR code) exchanges a valid
 *   token for a signed, expiring cookie and redirects to `/connect`.
 * - Gated paths require that cookie; anything else is redirected to `/visit`
 *   so typed, bookmarked or crawled URLs never reach the form.
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  const isEntry = isConnectEntryPath(pathname);

  if (!(isEntry || isConnectGatePath(pathname))) {
    return next();
  }

  const secret = await loadSecret();

  if (isEntry) {
    return enterViaQr(context, secret);
  }

  if (!(await hasGateCookie(context, secret))) {
    return context.redirect(VISIT_PATH, GATE_REDIRECT_STATUS);
  }

  return next();
});
