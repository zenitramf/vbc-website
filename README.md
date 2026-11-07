# Astro Starter Kit: Minimal

```sh
pnpm create astro@latest -- --template minimal
```

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
├── src/
│   └── pages/
│       └── index.astro
└── package.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

Any static assets, like images, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                | Action                                           |
| :--------------------- | :----------------------------------------------- |
| `pnpm install`         | Installs dependencies                            |
| `pnpm dev`             | Starts local dev server at `localhost:4321`      |
| `pnpm build`           | Build your production site to `./dist/`          |
| `pnpm preview`         | Preview your build locally, before deploying     |
| `pnpm astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `pnpm astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).

## Connection form (QR-gated)

The connection card lives behind a printed QR code. Non-QR visits never reach it, and submissions are emailed to `contact@fresnovictory.com`.

### Routes

| Route | Access | Purpose |
| --- | --- | --- |
| `GET /qr/<token>` | public (token required) | QR landing: stores a signed gate cookie, redirects to `/connect` |
| `GET /connect` | gate cookie required | The connection form |
| `POST /api/connect` | gate cookie required | Validates, emails the submission, redirects to `/connect/thanks` |
| `GET /connect/thanks` | gate cookie required | Confirmation page |

Requests without a valid cookie are redirected (`302`) to `/visit`. The four routes render on demand; every other page stays prerendered. Gated pages are `noindex` and excluded from `robots.txt` and the sitemap.

The token and cookie are HMAC-signed values derived from `QR_CONNECT_SECRET` (`src/lib/connect-gate.ts`, enforced in `src/middleware.ts`), so nothing is stored server-side. Failed submissions re-render the form with everything the visitor typed (`422` validation, `502` delivery); only success redirects. Responses containing visitor data are `no-store`, the body is capped at 64 KiB, and over-long fields are rejected rather than truncated.

### Local setup

```sh
cp .dev.vars.example .dev.vars   # then edit QR_CONNECT_SECRET
pnpm dev
pnpm connect:url                 # prints the /qr/<token> URL to open
```

Locally, `astro dev` simulates the `CONNECT_EMAIL` binding and prints each email (subject plus paths to the text/HTML bodies) in the dev server log.

### Production setup

1. Set the signing secret (32+ random characters, e.g. `openssl rand -base64 32`): `pnpm exec wrangler secret put QR_CONNECT_SECRET`
2. Generate the URL for the printed QR code using the **production** secret: `QR_CONNECT_SECRET=<production secret> pnpm connect:url` Rotating the secret invalidates the old QR code and every open gate cookie.
3. Enable email delivery. `src/lib/connect-email.ts` supports two transports; the first one configured wins:
   - **Resend** (`pnpm exec wrangler secret put RESEND_API_KEY`): verify `fresnovictory.com` in Resend so it can send from `website@fresnovictory.com`.
   - **Cloudflare Email Sending** (`send_email` binding `CONNECT_EMAIL`, already declared in `wrangler.jsonc`): onboard `fresnovictory.com` for outbound sending and verify `contact@fresnovictory.com` as a destination address (`pnpm exec wrangler email routing addresses create contact@fresnovictory.com`). Don't enable inbound Email Routing on the apex just for this form; it would change where `contact@` receives mail.

Without a working transport, visitors see the delivery-error state and their input is preserved.

Form options (`HOW_HEARD_OPTIONS`, `INTEREST_OPTIONS`) and the field limits live in `src/lib/connect-form.ts`.

### Contact form (public, on `/visit`)

The Plan Your Visit page ends with a public contact form (name, email or phone, message) that emails the same inbox. It follows the same validate-and-email pipeline as the connection card, with `requireMessage` (`src/lib/connect-submit.ts`) and its own email template (`buildContactEmail` in `src/lib/connect-email.ts`).

| Route | Access | Purpose |
| --- | --- | --- |
| `GET /visit#contact` | public | The canonical contact form |
| `POST /contact` | public | Validates, emails the inquiry, redirects to `/contact/thanks` |
| `GET /contact/thanks` | public | Confirmation page |

Failures re-render `/contact` with everything the visitor typed (`422` validation, `502` delivery); only success redirects. `GET /contact` bounces to `/visit#contact`. The recovery and confirmation pages are on demand, `noindex`, and excluded from the sitemap. No QR gate, honeypot, body cap and `no-store` rules are the same as the connection card.

### Bot protection (both forms)

Both forms carry a hidden honeypot field and a [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/) widget (`src/components/turnstile-widget.astro`). The widget runs in managed, interaction-only mode, so most visitors see nothing; a checkbox appears only when Cloudflare wants a click. Before any email is sent, the Worker confirms the widget's token with Siteverify (`src/lib/turnstile.ts`). Missing or rejected tokens re-render the form with the visitor's input and a "couldn't confirm" message (`403`). If the secret is missing or Siteverify can't be reached, the check fails closed and the error is logged.

The contact form also drops anything sent less than 3 seconds after the page loaded (`CONTACT_MIN_FILL_MS`). The browser records the time on the page in the hidden `elapsed_ms` field on submit. Too-fast submissions get the normal thank-you page but no email, the same as honeypot hits. The QR-gated connection card skips this check, because phone autofill can legitimately fill it in seconds.

Setup:

1. Cloudflare dashboard → Turnstile → **Add widget**: hostname `fresnovictory.com`, mode **Managed**.
2. Put the public **site key** in `TURNSTILE_SITE_KEY` (`src/lib/turnstile.ts`). Production builds fail until it's set (or the `PUBLIC_TURNSTILE_SITE_KEY` build variable is).
3. Store the **secret key**: `pnpm exec wrangler secret put TURNSTILE_SECRET_KEY`. Set it before deploying, or every submission is rejected.

Locally, `astro dev` uses Cloudflare's always-pass test keys, so no setup is needed. To test a production build on localhost, add `localhost` to the widget's hostnames, or build with the test site key (`PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA`) and put the test secret in `.dev.vars`.
