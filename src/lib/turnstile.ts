/**
 * Cloudflare Turnstile bot check for the public forms, plus a minimum
 * time-to-submit check. The widget runs in the browser and adds a one-time
 * token to the form; the Worker confirms it with Siteverify before sending any
 * email.
 *
 * This module must stay dependency-free so `node --test` can import it.
 *
 * https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 */

/** Form field the widget fills with its token (Turnstile's default name). */
export const TURNSTILE_RESPONSE_FIELD = "cf-turnstile-response";

/** Hidden field the browser fills with the time spent on the page. */
export const ELAPSED_FIELD = "elapsed_ms";

/** People can't fill in the contact form this fast; bots usually do. */
export const CONTACT_MIN_FILL_MS = 3000;

/**
 * Public site key of the "fresnovictory.com" Turnstile widget (Cloudflare
 * dashboard → Turnstile). Site keys are not secret; the matching secret key is
 * the `TURNSTILE_SECRET_KEY` Worker secret.
 */
export const TURNSTILE_SITE_KEY = "0x4AAAAAAF4HKxo8jlT898rD";

/** Cloudflare's always-pass test keys, used for local development only. */
export const TURNSTILE_TEST_SITE_KEY = "1x00000000000000000000AA";
export const TURNSTILE_TEST_SECRET_KEY = "1x0000000000000000000000000000000AA";

const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";
// Turnstile tokens are at most 2048 characters.
const MAX_TOKEN_LENGTH = 2048;
const SITEVERIFY_TIMEOUT_MS = 5000;

export type TurnstileFailure = "missing-secret" | "invalid" | "unavailable";

export type TurnstileResult =
  | { success: true }
  | { reason: TurnstileFailure; success: false };

interface SiteverifyResponse {
  "error-codes"?: string[];
  success?: boolean;
}

export interface VerifyTurnstileOptions {
  /** Visitor IP (`CF-Connecting-IP`); optional, improves Cloudflare's signal. */
  remoteIp?: string | null;
  secret: string | undefined;
  token: string | null | undefined;
  fetcher?: typeof fetch;
}

/** Throws on network errors, timeouts, non-2xx replies and malformed JSON. */
const callSiteverify = async (
  fetcher: typeof fetch,
  fields: Record<"remoteip" | "response" | "secret", string>
): Promise<SiteverifyResponse> => {
  const body = new URLSearchParams(fields);
  if (!fields.remoteip) {
    body.delete("remoteip");
  }
  const response = await fetcher(SITEVERIFY_URL, {
    body,
    method: "POST",
    signal: AbortSignal.timeout(SITEVERIFY_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`Siteverify responded ${response.status}`);
  }
  return (await response.json()) as SiteverifyResponse;
};

/** Confirms a widget token with Siteverify. Never throws. */
export const verifyTurnstileToken = async ({
  fetcher = fetch,
  remoteIp,
  secret,
  token,
}: VerifyTurnstileOptions): Promise<TurnstileResult> => {
  if (!secret) {
    return { reason: "missing-secret", success: false };
  }
  if (!token || token.length > MAX_TOKEN_LENGTH) {
    return { reason: "invalid", success: false };
  }

  try {
    const outcome = await callSiteverify(fetcher, {
      remoteip: remoteIp ?? "",
      response: token,
      secret,
    });
    return outcome.success === true
      ? { success: true }
      : { reason: "invalid", success: false };
  } catch {
    return { reason: "unavailable", success: false };
  }
};

/**
 * True when the form was sent faster than a person could fill it in. A missing
 * or malformed value counts as too fast: the browser script always sets it.
 */
export const submittedTooFast = (
  elapsedMs: string | null | undefined,
  minimumMs: number
): boolean => {
  const elapsed = Number(elapsedMs);
  return !(elapsedMs && Number.isFinite(elapsed) && elapsed >= minimumMs);
};
