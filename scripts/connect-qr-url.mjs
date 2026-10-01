/**
 * Prints the QR entry URL for the connection form.
 *
 * Usage:
 *   pnpm connect:url
 *   QR_CONNECT_SECRET=... pnpm connect:url
 *
 * Encode the printed URL in the QR code that gets shown at church. Rotating
 * `QR_CONNECT_SECRET` invalidates the old QR code and every open gate cookie.
 */
import { readFileSync } from "node:fs";

// The script lives outside `src/`, so it has to reach into it.
/* oxlint-disable import/no-relative-parent-imports */
import { churchInfo } from "../src/lib/church-data.ts";
import { deriveConnectEntryToken } from "../src/lib/connect-gate.ts";

const SECRET_LINE = /^\s*QR_CONNECT_SECRET\s*=\s*(.+?)\s*$/;
const WRAPPING_QUOTES = /^["']|["']$/g;

const readSecret = () => {
  if (process.env.QR_CONNECT_SECRET) {
    return process.env.QR_CONNECT_SECRET;
  }
  try {
    const vars = readFileSync(new URL("../.dev.vars", import.meta.url), "utf8");
    for (const line of vars.split("\n")) {
      const match = line.match(SECRET_LINE);
      if (match) {
        return match[1].replaceAll(WRAPPING_QUOTES, "");
      }
    }
  } catch {
    // Fall through to the error below.
  }
  return "";
};

const secret = readSecret();
if (!secret) {
  console.error(
    "Missing QR_CONNECT_SECRET. Set the variable or create .dev.vars (see .dev.vars.example)."
  );
  process.exit(1);
}

console.log(`${churchInfo.url}/qr/${await deriveConnectEntryToken(secret)}`);
