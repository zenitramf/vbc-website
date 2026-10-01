/**
 * Shared connection-form vocabulary: option labels, error codes and the
 * messages rendered on `/connect`. Kept in one place so the form page and the
 * `/api/connect` endpoint can never drift apart.
 */

import { churchInfo } from "@/lib/church-data";

export const HOW_HEARD_OPTIONS = [
  "Website",
  "Social media",
  "Family",
  "Friend",
] as const;
export const INTEREST_OPTIONS = [
  "Salvation",
  "Baptism",
  "Discipleship",
  "Serving",
] as const;

// UTF-16 lengths match the browser's native maxlength enforcement.
export const CONNECT_FIELD_LIMITS = {
  email: 200,
  how_heard_other: 200,
  interests_other: 200,
  message: 2000,
  name: 200,
  phone: 200,
  prayer: 2000,
} as const;

// Allows the complete form, including percent-encoded Unicode, without
// buffering arbitrary request bodies in the Worker.
export const CONNECT_MAX_BODY_BYTES = 64 * 1024;

/** Public contact form handler and confirmation page. */
export const CONTACT_PATH = "/contact";
export const CONTACT_THANKS_PATH = "/contact/thanks";

export type ConnectErrorCode =
  | "contact"
  | "content"
  | "delivery"
  | "email"
  | "format"
  | "length"
  | "message"
  | "name";

export const CONNECT_ERROR_MESSAGES: Record<ConnectErrorCode, string> = {
  contact: "Leave us your email or phone number so we can get back to you.",
  content:
    "The form is larger than allowed. Please shorten it before sending it again.",
  delivery: `We couldn't send your information right now. Please try again in a few minutes or email us at ${churchInfo.email}.`,
  email: "Please check your email address. It doesn't look valid.",
  format:
    "We couldn't read the form. Please submit it from this page without attaching files.",
  length:
    "Please check the length of your answers: long texts (prayer request or message) can be up to 2000 characters and every other field up to 200. We kept what you wrote so you can fix it.",
  message: "Please write your message so we can help you.",
  name: "Please enter your name so we can get to know you.",
};

const ACCENT_MARKS = /[\u0300-\u036F]/g;
const NON_ALPHANUMERIC = /[^a-z0-9]+/g;
const EDGE_DASHES = /(^-|-$)/g;

/** DOM id for a checkbox generated from its option label. */
export const connectOptionId = (prefix: string, label: string): string =>
  `${prefix}-${label
    .normalize("NFD")
    .replace(ACCENT_MARKS, "")
    .toLowerCase()
    .replace(NON_ALPHANUMERIC, "-")
    .replace(EDGE_DASHES, "")}`;
