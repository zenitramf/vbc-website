/**
 * Delivers connection-form submissions to the church inbox.
 *
 * Two transports are supported, first one configured wins:
 *
 * 1. Resend HTTP API (`RESEND_API_KEY` secret) — takes precedence the moment
 *    the operator sets it, since a declared `CONNECT_EMAIL` binding can still
 *    lack domain/destination verification at the Cloudflare account.
 * 2. Cloudflare Email Sending binding (`CONNECT_EMAIL` in wrangler.jsonc) —
 *    no API key, restricted to the church inbox as destination.
 *
 * See the README ("Connection form") for the one-time setup.
 */

import { churchInfo, SERVICE_TIMEZONE } from "@/lib/church-data";

export interface ConnectSubmission {
  email: string;
  howHeard: string[];
  howHeardOther: string;
  interests: string[];
  interestsOther: string;
  name: string;
  phone: string;
  prayer: string;
  submittedAt: string;
  userAgent: string;
}

export type ConnectEmailEnv = Partial<
  Pick<Env, "CONNECT_EMAIL" | "RESEND_API_KEY">
>;

export const CONNECT_EMAIL_TO = churchInfo.email;
export const CONNECT_EMAIL_FROM = "website@fresnovictory.com";

const FROM_NAME = "VBC Website — Victory Baptist Church";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const formatList = (values: string[], other: string): string => {
  // The checked "Other" checkbox collapses into its free-text line when present.
  const items = other
    ? values.filter((value) => value !== "Other")
    : [...values];
  if (other) {
    items.push(`Other: ${other}`);
  }
  return items.length > 0 ? items.join(", ") : "—";
};

const formatSubmittedAt = (isoDate: string): string => {
  try {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: SERVICE_TIMEZONE,
    }).format(new Date(isoDate));
  } catch {
    return isoDate;
  }
};

export interface ConnectEmailContent {
  html: string;
  subject: string;
  text: string;
}

export const buildConnectEmail = (
  submission: ConnectSubmission
): ConnectEmailContent => {
  const howHeard = formatList(submission.howHeard, submission.howHeardOther);
  const interests = formatList(submission.interests, submission.interestsOther);
  const contact =
    [submission.email, submission.phone].filter(Boolean).join(" · ") || "—";
  const prayer = submission.prayer || "—";
  const receivedAt = formatSubmittedAt(submission.submittedAt);

  const rows: [string, string][] = [
    ["Name", submission.name],
    ["Email", submission.email || "—"],
    ["Phone", submission.phone || "—"],
    ["How did you hear about us?", howHeard],
    ["I want to know more about", interests],
  ];

  const text = [
    "New connection card",
    "",
    "Source: Connection card (QR code)",
    "",
    ...rows.map(([label, value]) => `${label}: ${value}`),
    "",
    "How can we pray for you?",
    prayer,
    "",
    `Submitted: ${receivedAt}`,
  ].join("\n");

  const html = [
    `<div style="background:#fbbf24;border-radius:8px;padding:14px 18px;margin:0 0 20px"><p style="margin:0;font-size:15px;color:#1c1917"><strong>SOURCE:</strong> <strong>Connection card — private QR-code form</strong></p></div>`,
    "<h2>New connection card</h2>",
    `<table cellpadding="6" cellspacing="0" style="border-collapse:collapse">`,
    ...rows.map(
      ([label, value]) =>
        `<tr><td style="vertical-align:top"><strong>${escapeHtml(label)}</strong></td><td>${escapeHtml(value)}</td></tr>`
    ),
    "</table>",
    "<h3>How can we pray for you?</h3>",
    `<p style="white-space:pre-wrap">${escapeHtml(prayer)}</p>`,
    `<p style="color:#666;font-size:12px">Submitted: ${escapeHtml(receivedAt)}<br />Contact: ${escapeHtml(contact)}<br />Browser: ${escapeHtml(submission.userAgent)}</p>`,
  ].join("\n");

  return {
    html,
    subject: `New connection: ${submission.name || "Visitor"}`,
    text,
  };
};

export type ConnectEmailTransport = "cloudflare" | "resend";

/** Resend key wins while it is configured; binding is the native fallback. */
const deliver = async (
  env: ConnectEmailEnv,
  content: ConnectEmailContent,
  replyTo: string
): Promise<ConnectEmailTransport> => {
  const { html, subject, text } = content;

  if (env.RESEND_API_KEY) {
    const response = await fetch("https://api.resend.com/emails", {
      body: JSON.stringify({
        from: `${FROM_NAME} <${CONNECT_EMAIL_FROM}>`,
        html,
        reply_to: replyTo,
        subject,
        text,
        to: [CONNECT_EMAIL_TO],
      }),
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    });
    if (!response.ok) {
      throw new Error(
        `Resend request failed (${response.status}): ${await response.text()}`
      );
    }
    return "resend";
  }

  if (env.CONNECT_EMAIL) {
    await env.CONNECT_EMAIL.send({
      from: { email: CONNECT_EMAIL_FROM, name: FROM_NAME },
      html,
      replyTo,
      subject,
      text,
      to: CONNECT_EMAIL_TO,
    });
    return "cloudflare";
  }

  throw new Error(
    "No email transport configured (RESEND_API_KEY or CONNECT_EMAIL binding)"
  );
};

/**
 * Sends the connection card. Throws when no transport is configured or
 * delivery fails, so the caller can show the visitor a real error state.
 */
export const sendConnectEmail = (
  env: ConnectEmailEnv,
  submission: ConnectSubmission
): Promise<ConnectEmailTransport> =>
  deliver(
    env,
    buildConnectEmail(submission),
    submission.email || CONNECT_EMAIL_TO
  );

export interface ContactSubmission {
  email: string;
  message: string;
  name: string;
  phone: string;
  submittedAt: string;
  userAgent: string;
}

/** Plain contact inquiry from the public form on the Plan Your Visit page. */
export const buildContactEmail = (
  submission: ContactSubmission
): ConnectEmailContent => {
  const contact =
    [submission.email, submission.phone].filter(Boolean).join(" · ") || "—";
  const receivedAt = formatSubmittedAt(submission.submittedAt);

  const text = [
    "New contact message",
    "",
    "Source: Contact form (Plan Your Visit page)",
    "",
    `Name: ${submission.name || "—"}`,
    `Email: ${submission.email || "—"}`,
    `Phone: ${submission.phone || "—"}`,
    "",
    "Message:",
    submission.message || "—",
    "",
    `Submitted: ${receivedAt}`,
  ].join("\n");

  const html = [
    `<div style="background:#fbbf24;border-radius:8px;padding:14px 18px;margin:0 0 20px"><p style="margin:0;font-size:15px;color:#1c1917"><strong>SOURCE:</strong> <strong>Contact form — &quot;Plan Your Visit&quot; page (/visit)</strong></p></div>`,
    "<h2>New contact message</h2>",
    `<table cellpadding="6" cellspacing="0" style="border-collapse:collapse">`,
    ...(
      [
        ["Name", submission.name],
        ["Email", submission.email],
        ["Phone", submission.phone],
      ] as [string, string][]
    ).map(
      ([label, value]) =>
        `<tr><td style="vertical-align:top"><strong>${escapeHtml(label)}</strong></td><td>${escapeHtml(value || "—")}</td></tr>`
    ),
    "</table>",
    "<h3>Message</h3>",
    `<p style="white-space:pre-wrap">${escapeHtml(submission.message || "—")}</p>`,
    `<p style="color:#666;font-size:12px">Submitted: ${escapeHtml(receivedAt)}<br />Contact: ${escapeHtml(contact)}<br />Browser: ${escapeHtml(submission.userAgent)}</p>`,
  ].join("\n");

  return {
    html,
    subject: `New contact message: ${submission.name || "Visitor"}`,
    text,
  };
};

/** Sends the public contact inquiry with the same delivery guarantees. */
export const sendContactEmail = (
  env: ConnectEmailEnv,
  submission: ContactSubmission
): Promise<ConnectEmailTransport> =>
  deliver(
    env,
    buildContactEmail(submission),
    submission.email || CONNECT_EMAIL_TO
  );
