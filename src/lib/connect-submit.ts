import { sendConnectEmail, sendContactEmail } from "@/lib/connect-email";
import type {
  ConnectEmailEnv,
  ConnectSubmission,
  ContactSubmission,
} from "@/lib/connect-email";
import {
  CONNECT_FIELD_LIMITS,
  CONNECT_MAX_BODY_BYTES,
  HOW_HEARD_OPTIONS,
  INTEREST_OPTIONS,
} from "@/lib/connect-form";
import type { ConnectErrorCode } from "@/lib/connect-form";
import {
  CONTACT_MIN_FILL_MS,
  ELAPSED_FIELD,
  submittedTooFast,
  TURNSTILE_RESPONSE_FIELD,
  TURNSTILE_TEST_SECRET_KEY,
  verifyTurnstileToken,
} from "@/lib/turnstile";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FORM_CONTENT_TYPE = "application/x-www-form-urlencoded";
const MAX_USER_AGENT_LENGTH = 300;
const HTTP_BAD_REQUEST = 400;
const HTTP_FORBIDDEN = 403;
const HTTP_PAYLOAD_TOO_LARGE = 413;
const HTTP_UNSUPPORTED_MEDIA_TYPE = 415;
const HTTP_UNPROCESSABLE = 422;
const HTTP_BAD_GATEWAY = 502;
const HTTP_SEE_OTHER = 303;

export type FormSubmitEnv = ConnectEmailEnv &
  Partial<Pick<Env, "TURNSTILE_SECRET_KEY">>;

export interface FormParseResult {
  /** Likely bot (honeypot, too fast): pretend success, deliver nothing. */
  discarded: boolean;
  errorCode: ConnectErrorCode | null;
  status: number;
  values: URLSearchParams;
}

const contentTypeOf = (request: Request): string | undefined =>
  request.headers.get("content-type")?.split(";")[0].trim().toLowerCase();

/** Decodes a request body as strict UTF-8, enforcing the byte limit while streaming. */
const readBounded = async (
  body: ReadableStream<Uint8Array>
): Promise<string> => {
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let length = 0;
  let text = "";
  // Leaving the loop early cancels the underlying stream.
  for await (const chunk of body) {
    length += chunk.byteLength;
    if (length > CONNECT_MAX_BODY_BYTES) {
      throw new Error("content");
    }
    text += decoder.decode(chunk, { stream: true });
  }
  return text + decoder.decode();
};

/** Native form encoding only; files and other content types aren't accepted. */
const readForm = async (request: Request): Promise<URLSearchParams> => {
  if (contentTypeOf(request) !== FORM_CONTENT_TYPE) {
    throw new Error("format");
  }
  if (Number(request.headers.get("content-length")) > CONNECT_MAX_BODY_BYTES) {
    await request.body?.cancel();
    throw new Error("content");
  }
  const body = request.body ? await readBounded(request.body) : "";
  // URLSearchParams tolerates broken percent/UTF-8 escapes; reject those
  // instead of silently replacing visitor data with replacement characters.
  decodeURIComponent(body.replaceAll("+", " "));
  return new URLSearchParams(body);
};

const readFailure = (error: unknown, request: Request): FormParseResult => {
  const tooLarge = error instanceof Error && error.message === "content";
  const unsupported = contentTypeOf(request) !== FORM_CONTENT_TYPE;
  let status = HTTP_BAD_REQUEST;
  if (tooLarge) {
    status = HTTP_PAYLOAD_TOO_LARGE;
  } else if (unsupported) {
    status = HTTP_UNSUPPORTED_MEDIA_TYPE;
  }
  return {
    discarded: false,
    errorCode: tooLarge ? "content" : "format",
    status,
    values: new URLSearchParams(),
  };
};

const exceedsLimits = (values: URLSearchParams): boolean =>
  Object.entries(CONNECT_FIELD_LIMITS).some(([field, limit]) =>
    values.getAll(field).some((value) => value.length > limit)
  );

const validateCore = (values: URLSearchParams): ConnectErrorCode | null => {
  const text = (field: string): string => values.get(field) ?? "";
  if (exceedsLimits(values)) {
    return "length";
  }
  if (!text("name").trim()) {
    return "name";
  }
  if (!(text("email").trim() || text("phone").trim())) {
    return "contact";
  }
  if (text("email") && !EMAIL_PATTERN.test(text("email"))) {
    return "email";
  }
  return null;
};

const failure = (
  values: URLSearchParams,
  errorCode: ConnectErrorCode
): FormParseResult => ({
  discarded: false,
  errorCode,
  status: HTTP_UNPROCESSABLE,
  values,
});

/** Validates parsed values: shared core, plus the message for the contact form. */
const finishParse = (
  values: URLSearchParams,
  { requireMessage }: { requireMessage: boolean }
): FormParseResult => {
  // Honeypot: no email, but the same confirmation as a successful submission.
  if (values.get("website_url")?.trim()) {
    return { discarded: true, errorCode: null, status: HTTP_SEE_OTHER, values };
  }
  const coreError = validateCore(values);
  if (coreError) {
    return failure(values, coreError);
  }
  if (requireMessage && !values.get("message")?.trim()) {
    return failure(values, "message");
  }
  return { discarded: false, errorCode: null, status: HTTP_SEE_OTHER, values };
};

/**
 * Reads, bounds and validates the shared form core: honeypot, field limits,
 * name, and at least one contact channel. The contact form additionally
 * requires a message.
 */
const parseForm = async (
  request: Request,
  options: { requireMessage: boolean }
): Promise<FormParseResult> => {
  try {
    return finishParse(await readForm(request), options);
  } catch (error) {
    return readFailure(error, request);
  }
};

// Local development falls back to Cloudflare's always-pass test secret, which
// pairs with the test site key the widget uses under `astro dev`.
const turnstileSecret = (env: FormSubmitEnv): string | undefined =>
  env.TURNSTILE_SECRET_KEY ||
  (import.meta.env.DEV ? TURNSTILE_TEST_SECRET_KEY : undefined);

/**
 * Bot checks after validation: Turnstile, then (contact form only) the minimum
 * time on the page. Turnstile goes first so a visitor without JavaScript sees
 * an error to act on instead of a silent drop. Returns null when the
 * submission may be delivered.
 */
const checkHuman = async (
  request: Request,
  env: FormSubmitEnv,
  parsed: FormParseResult,
  { label, minFillMs }: { label: string; minFillMs?: number }
): Promise<FormParseResult | null> => {
  const turnstile = await verifyTurnstileToken({
    remoteIp: request.headers.get("cf-connecting-ip"),
    secret: turnstileSecret(env),
    token: parsed.values.get(TURNSTILE_RESPONSE_FIELD),
  });
  if (!turnstile.success) {
    const log = turnstile.reason === "invalid" ? console.info : console.error;
    log(`[${label}] Turnstile check failed: ${turnstile.reason}`);
    return { ...parsed, errorCode: "verification", status: HTTP_FORBIDDEN };
  }
  if (
    minFillMs !== undefined &&
    submittedTooFast(parsed.values.get(ELAPSED_FIELD), minFillMs)
  ) {
    console.info(`[${label}] Discarded a submission sent too fast`);
    return { ...parsed, discarded: true };
  }
  return null;
};

/** Keeps only known option labels (plus "Other"), de-duplicated. */
const pickOptions = (
  values: URLSearchParams,
  field: string,
  allowed: readonly string[]
): string[] =>
  [...new Set(values.getAll(field))].filter(
    (value) => value === "Other" || allowed.includes(value)
  );

const buildSubmission = (
  request: Request,
  values: URLSearchParams
): ConnectSubmission => {
  const text = (field: string): string => values.get(field) ?? "";
  return {
    email: text("email"),
    howHeard: pickOptions(values, "how_heard", HOW_HEARD_OPTIONS),
    howHeardOther: text("how_heard_other"),
    interests: pickOptions(values, "interests", INTEREST_OPTIONS),
    interestsOther: text("interests_other"),
    name: text("name"),
    phone: text("phone"),
    prayer: text("prayer"),
    submittedAt: new Date().toISOString(),
    userAgent: (request.headers.get("user-agent") ?? "").slice(
      0,
      MAX_USER_AGENT_LENGTH
    ),
  };
};

const buildContactSubmission = (
  request: Request,
  values: URLSearchParams
): ContactSubmission => {
  const text = (field: string): string => values.get(field) ?? "";
  return {
    email: text("email"),
    message: text("message"),
    name: text("name"),
    phone: text("phone"),
    submittedAt: new Date().toISOString(),
    userAgent: (request.headers.get("user-agent") ?? "").slice(
      0,
      MAX_USER_AGENT_LENGTH
    ),
  };
};

interface SubmitOptions {
  deliver: (values: URLSearchParams) => Promise<unknown>;
  label: string;
  minFillMs?: number;
  requireMessage: boolean;
}

const deliverParsed = async (
  parsed: FormParseResult,
  { deliver, label }: Pick<SubmitOptions, "deliver" | "label">
): Promise<FormParseResult> => {
  try {
    await deliver(parsed.values);
  } catch {
    // Do not log message content, contact details, or provider error text.
    console.error(`[${label}] Email delivery failed`);
    return { ...parsed, errorCode: "delivery", status: HTTP_BAD_GATEWAY };
  }
  return parsed;
};

/** Parse, validate, bot checks, then email. */
const submitForm = async (
  request: Request,
  env: FormSubmitEnv,
  { deliver, label, minFillMs, requireMessage }: SubmitOptions
): Promise<FormParseResult> => {
  const parsed = await parseForm(request, { requireMessage });
  if (parsed.errorCode || parsed.discarded) {
    return parsed;
  }
  const blocked = await checkHuman(request, env, parsed, { label, minFillMs });
  return blocked ?? (await deliverParsed(parsed, { deliver, label }));
};

/** Returns the original values on every readable failure; never stores PII. */
export const submitConnectForm = (
  request: Request,
  env: FormSubmitEnv
): Promise<FormParseResult> =>
  // No minimum fill time here: the card is QR-gated, and a phone with
  // autofill can legitimately send name + contact in a couple of seconds.
  submitForm(request, env, {
    deliver: (values) =>
      sendConnectEmail(env, buildSubmission(request, values)),
    label: "connect",
    requireMessage: false,
  });

/** Public contact form on /visit: name, contact channel, message. */
export const submitContactForm = (
  request: Request,
  env: FormSubmitEnv
): Promise<FormParseResult> =>
  submitForm(request, env, {
    deliver: (values) =>
      sendContactEmail(env, buildContactSubmission(request, values)),
    label: "contact",
    minFillMs: CONTACT_MIN_FILL_MS,
    requireMessage: true,
  });
