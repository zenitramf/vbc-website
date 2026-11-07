import assert from "node:assert/strict";
// oxlint-disable-next-line vitest/no-import-node-test -- this repo has no vitest; tests run on the built-in node:test runner via `pnpm test`.
import test from "node:test";

import {
  CONTACT_MIN_FILL_MS,
  submittedTooFast,
  verifyTurnstileToken,
} from "./turnstile.ts";

const HTTP_OK = 200;
const HTTP_SERVER_ERROR = 500;
const OVERSIZED_TOKEN_LENGTH = 2049;

interface Call {
  body: URLSearchParams;
  url: string;
}

const stubFetch = (
  reply: () => Response | Promise<Response>
): { calls: Call[]; fetcher: typeof fetch } => {
  const calls: Call[] = [];
  const fetcher = (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ body: init?.body as URLSearchParams, url: String(input) });
    return await reply();
  }) as typeof fetch;
  return { calls, fetcher };
};

const json = (body: unknown, status = HTTP_OK): Response =>
  Response.json(body, { status });

test("accepts a token Siteverify confirms, sending secret, token and IP", async () => {
  const { calls, fetcher } = stubFetch(() => json({ success: true }));
  const result = await verifyTurnstileToken({
    fetcher,
    remoteIp: "203.0.113.7",
    secret: "secret",
    token: "token",
  });
  assert.deepEqual(result, { success: true });
  assert.equal(calls.length, 1);
  assert.match(calls[0].url, /siteverify$/);
  assert.equal(calls[0].body.get("secret"), "secret");
  assert.equal(calls[0].body.get("response"), "token");
  assert.equal(calls[0].body.get("remoteip"), "203.0.113.7");
});

test("rejects a token Siteverify refuses", async () => {
  const { fetcher } = stubFetch(() =>
    json({ "error-codes": ["invalid-input-response"], success: false })
  );
  const result = await verifyTurnstileToken({
    fetcher,
    secret: "secret",
    token: "token",
  });
  assert.deepEqual(result, { reason: "invalid", success: false });
});

test("rejects missing or oversized tokens without calling Siteverify", async () => {
  const { calls, fetcher } = stubFetch(() => json({ success: true }));
  for (const token of [
    null,
    undefined,
    "",
    "x".repeat(OVERSIZED_TOKEN_LENGTH),
  ]) {
    // oxlint-disable-next-line no-await-in-loop -- sequential cases on one stub.
    const result = await verifyTurnstileToken({
      fetcher,
      secret: "secret",
      token,
    });
    assert.deepEqual(result, { reason: "invalid", success: false });
  }
  assert.equal(calls.length, 0);
});

test("fails closed when the secret is not configured", async () => {
  const { calls, fetcher } = stubFetch(() => json({ success: true }));
  const result = await verifyTurnstileToken({
    fetcher,
    secret: undefined,
    token: "token",
  });
  assert.deepEqual(result, { reason: "missing-secret", success: false });
  assert.equal(calls.length, 0);
});

test("fails closed when Siteverify is unreachable or errors", async () => {
  const replies: (() => Response | Promise<Response>)[] = [
    () => json({}, HTTP_SERVER_ERROR),
    () => Promise.reject(new TypeError("network down")),
    () => new Response("not json"),
  ];
  for (const reply of replies) {
    const { fetcher } = stubFetch(reply);
    // oxlint-disable-next-line no-await-in-loop -- sequential cases.
    const result = await verifyTurnstileToken({
      fetcher,
      secret: "secret",
      token: "token",
    });
    assert.deepEqual(result, { reason: "unavailable", success: false });
  }
});

test("flags submissions faster than the minimum fill time", () => {
  assert.equal(submittedTooFast("2999", CONTACT_MIN_FILL_MS), true);
  assert.equal(submittedTooFast("0", CONTACT_MIN_FILL_MS), true);
  assert.equal(submittedTooFast(null, CONTACT_MIN_FILL_MS), true);
  assert.equal(submittedTooFast("", CONTACT_MIN_FILL_MS), true);
  assert.equal(submittedTooFast("soon", CONTACT_MIN_FILL_MS), true);
  assert.equal(submittedTooFast("Infinity", CONTACT_MIN_FILL_MS), true);
  assert.equal(submittedTooFast("3000", CONTACT_MIN_FILL_MS), false);
  assert.equal(submittedTooFast("45210", CONTACT_MIN_FILL_MS), false);
});
