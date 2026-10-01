import { sendConnectEmail } from "@/lib/connect-email";
import type { ConnectEmailEnv, ConnectSubmission } from "@/lib/connect-email";
import {
  CONNECT_FIELD_LIMITS,
  CONNECT_MAX_BODY_BYTES,
  HOW_HEARD_OPTIONS,
  INTEREST_OPTIONS,
} from "@/lib/connect-form";
import type { ConnectErrorCode } from "@/lib/connect-form";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FORM_CONTENT_TYPE = "application/x-www-form-urlencoded";
const MAX_USER_AGENT_LENGTH = 300;
const HTTP_BAD_REQUEST = 400;
const HTTP_PAYLOAD_TOO_LARGE = 413;
const HTTP_UNSUPPORTED_MEDIA_TYPE = 415;
const HTTP_UNPROCESSABLE = 422;
const HTTP_BAD_GATEWAY = 502;
const HTTP_SEE_OTHER = 303;

export interface FormParseResult {
  errorCode: ConnectErrorCode | null;
  /** Honeypot hit — pretend success without delivering anything. */
  honeypot: boolean;
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
    errorCode: tooLarge ? "content" : "format",
    honeypot: false,
    status,
    values: new URLSearchParams(),
  };
};

const exceedsLimits = (values: URLSearchParams): boolean =>
  Object.entries(CONNECT_FIELD_LIMITS).some(([field, limit]) =>
    values.getAll(field).some((value) => value.length > limit)
  );

const validationError = (values: URLSearchParams): ConnectErrorCode | null => {
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

/** Reads, bounds and validates the form: honeypot, limits, name, contact. */
const parseForm = async (request: Request): Promise<FormParseResult> => {
  let values: URLSearchParams;
  try {
    values = await readForm(request);
  } catch (error) {
    return readFailure(error, request);
  }

  // Honeypot: no email, but the same confirmation as a successful submission.
  if (values.get("website_url")?.trim()) {
    return { errorCode: null, honeypot: true, status: HTTP_SEE_OTHER, values };
  }
  const errorCode = validationError(values);
  return {
    errorCode,
    honeypot: false,
    status: errorCode ? HTTP_UNPROCESSABLE : HTTP_SEE_OTHER,
    values,
  };
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

/** Returns the original values on every readable failure; never stores PII. */
export const submitConnectForm = async (
  request: Request,
  env: ConnectEmailEnv
): Promise<FormParseResult> => {
  const parsed = await parseForm(request);
  if (parsed.errorCode || parsed.honeypot) {
    return parsed;
  }

  try {
    await sendConnectEmail(env, buildSubmission(request, parsed.values));
  } catch {
    // Do not log message content, contact details, or provider error text.
    console.error("[connect] Email delivery failed");
    return { ...parsed, errorCode: "delivery", status: HTTP_BAD_GATEWAY };
  }
  return parsed;
};
