# AI-Slop De-slop Plan — Whole-Site Copy/Typographic Cleanup

Goal: remove 4 flagged AI-slop patterns (serif-italic headline accent, kicker-per-heading, em-dash habit, announcement pill) across the VBC Astro site with copy and typographic edits only. No visual rebrand, no layout rebuild, no new components.

Scope: whole site — homepage sections (`hero-component`, `ministries-section`, `about-section`, `plan-visit-section`, `staff-calendar-section`, `giving-section`), `page-header.astro` + all `PageHeader` pages (sermons, events, missions-conference, meet-the-staff, about-vbc, visit, hope), `salvation.astro`, `sermon-featured.tsx`, `footer-component.astro`. Out of scope: color/typeface rebrand, Starwind `Badge` removal, sermon D1/YouTube logic, calendar API.

Decisions (user-confirmed):

- Kicker rule: thin to wayfinding only. Keep `PageHeader` eyebrows, salvation numbered steps (01–04), visit Sundays/Thursdays group labels, role label Senior Pastor, featured label Latest Message. Delete/demote redundant homepage section kickers.
- Serif-italic rule: strip headline italic; reserve italic only for quoted Scripture/prayer text.
- Em-dash rule: rewrite prose with periods/commas; list separators become colons. Keep en-dash in `Ephesians 2:8–9` and sermon date ranges.
- Pill rule: no pill ships; add guardrail convention + delete dead hero eyebrow CSS.

## Findings inventory (evidence)

1. Serif italic in headlines:
   - `src/components/hero-component.astro:90-96,459-464` — `Glorify God.` in `.hero__headline-accent` is `font-style: italic`, otherwise identical white. Violates one-voice-per-headline.
   - `src/pages/salvation.astro:31,588-592` — H1 `You can <em>know.</em>`; `em` is block + gold-light + italic.
   - Keep-italic (quoted text, out of scope for stripping): `salvation.astro:1461-1468` prayer blockquote `font-style: italic`; verse cards use `font-display` non-italic (correct, leave alone).
2. Kicker above every heading:
   - `src/components/page-header.astro:33-36` + 6 call sites (`sermons.astro:30`, `events.astro:14`, `missions-conference.astro:11`, `meet-the-staff.astro:20`, `about-vbc.astro:55`, `visit.astro:40`) — KEEP (page context wayfinding).
   - Homepage redundant (DELETE): `ministries-section.astro:15` Ministries; `about-section.astro:22-26` Who We Are; `plan-visit-section.astro:35-40` Plan Your Visit; `staff-calendar-section.astro:9-10` Get Connected; `giving-section.astro:15-17` Giving; card mini-kickers `staff-calendar-section.astro:33-37` Our Team and `:69-70` Events.
   - Keep as wayfinding: `sermon-featured.tsx:64-67` Latest Message (distinguishes featured vs archive); `visit.astro:56,77` Sundays/Thursdays; `meet-the-staff.astro:45-49` Senior Pastor; `salvation.astro:27,130,215,284,344` hero eyebrow + numbered `section-eyebrow` 01–04. DELETE `salvation.astro:229-231` `.answer-kicker` sentence ("Though we were separated…") — classic slop kicker; fold into body or drop.
3. Em dashes (user-visible only; code comments ignored):
   - `ministries-section.astro:25` "Fresno — and the world —"; `:45` "heart. We'll" style "along — just".
   - `about-section.astro:37` "together — whether".
   - `footer-component.astro:36` "Sunday Service — {time}".
   - `visit.astro:62,66,70,83,87` `<strong>Label</strong> — time` (5x).
   - `events.astro:47` `{" — "}`.
   - `salvation.astro:151` "consequence—and the promise"; `:286` "faith—not"; `:329` "— Amen"; `:623-626` `li::before content: "—"`; meta `description` dashes (`salvation.astro:12`, `about-vbc.astro:53`, `visit.astro:38`, `church-data.ts:102`).
4. Announcement pill:
   - No pill renders today. `Badge` (`src/components/starwind/badge/Badge.astro`) is unused in site copy (only re-exported). `hero-component.astro:395-431,577,597,836-837` `.hero__eyebrow*` CSS is dead (`display:none`, no markup). Guardrail + dead-CSS cleanup only.

## Ordered tasks for implementer

1. Headline voice — hero (`hero-component.astro`):
   - Remove `font-style: italic` from `.hero__headline-accent`; keep block layout + line break for emphasis; bump to `font-weight: 700` so `Glorify God.` is distinguished by weight, not slant. No color change.
   - Verify `Grow in faith. Share the gospel. / Glorify God.` still wraps per existing `.hero__headline-pair` rules; check 400px breakpoint.
2. Headline voice — salvation (`salvation.astro:31,588-592`):
   - Replace `<em>know.</em>` with `<span class="hero-know">know.</span>` (block, gold-light, weight 700, non-italic). Update CSS selector `.hero-copy h1 em` → `.hero-copy h1 .hero-know`. Leave prayer/verse italic (`:1461`) untouched.
3. Kicker thinning — homepage (delete, adjust spacing):
   - Delete kicker `<p>` in `ministries-section`, `about-section`, `plan-visit-section` (keep its hairline `<span>` if desired, drop text or drop whole row — prefer drop whole `div.mb-6 flex` text, keep hairline only if section looks bare), `staff-calendar-section` Get Connected, `giving-section`. Remove now-orphaned `mb-4`/margin where H2 becomes first child; keep `reveal` classes on H2 container.
   - Delete card mini-kickers `Our Team` / `Events` in `staff-calendar-section`; H3s (`Meet our pastor…`, `What's coming up`) stand alone with existing icons.
   - Keep: all `PageHeader eyebrow` props, `Latest Message`, `Sundays/Thursdays`, `Senior Pastor`, salvation hero-eyebrow + numbered eyebrows.
   - Delete `.answer-kicker` block (`salvation.astro:229-231,1223-1230` CSS); merge its sentence into the following H2 intro or drop if redundant with `turning-content` copy.
4. Em-dash rewrite — prose (periods/commas):
   - `ministries-section:23-26` → "Every ministry at Victory Baptist Church serves one mission: reaching Fresno and the world with the gospel of Jesus Christ." `ministries:45-46` → "You don't need experience to come along. Just bring a willing heart. We'll pair you with someone and show you how."
   - `about-section:35-38` → "…serve our city together. Whether you've walked with Jesus for decades or you're still asking questions, come grow with us." (two sentences).
   - `salvation:151` → "The consequence and the promise" (or "The consequence: the promise"); `:286` → "Salvation is received by faith, not achieved by effort."; `:329` → "Amen" (drop leading dash); meta descriptions → commas/periods.
   - `defaultSEO` + page `description` strings with `—` → `, ` or `. ` (keep under ~155 chars, no meaning change).
5. Em-dash rewrite — lists (colons):
   - `visit.astro` 5 items + `events.astro:47` + `footer-component.astro:36` → `<strong>Label:</strong> time` pattern, e.g. `<strong>Sunday School:</strong> 10am`, `Sunday Service: 11am`, `Saturday: 10:30am`. Delete `{" — "}` / `{" "}` artifacts; use plain space after colon.
   - Keep en-dash in `Ephesians 2:8–9` and `sermons-table.tsx:212` `{firstRowNumber}–{lastRowNumber}` range.
   - Replace `hero-questions li::before content: "—"` (`salvation.astro:623-626`) with non-dash marker (gold `•` or 1.5rem hairline) or remove marker; cheapest: `content: "•"`.
6. Pill guardrail + dead CSS:
   - Delete dead CSS in `hero-component.astro`: `.hero__eyebrow`, `.hero__eyebrow-loc`, `.hero__eyebrow-dot`, `dot-pulse` keyframes + all references in media/reduced-motion blocks. No markup change (no eyebrow markup exists). Do NOT delete `Badge.astro` (shared lib).
   - Add one-line convention where future pills would be added (implementer picks smallest touch): either a comment in `page-header.astro` or `AGENTS.md` line: "Announcement pill/badge only for real, current, dated status (e.g. conference dates, new series); otherwise omit." No new component.
7. Validate:
   - `pnpm fix` then `pnpm check` (note: repo has pre-existing `check` failures on clean checkout per AGENTS.md; only ensure no NEW violations in touched files).
   - `pnpm build` passes (Cloudflare adapter, prerendered output). Spot-check `dist/` for: no `—` in edited copy, no `font-style: italic` on hero/salvation H1, homepage H2s render without kickers, `PageHeader` eyebrows intact.
   - Quick visual pass at `pnpm dev` (`http://localhost:4321/`): hero (desktop ≥900px + mobile), homepage sections, `/salvation/`, `/visit/`, one `PageHeader` page.

## Risks / notes

- Spacing after kicker deletion: H2s used `mb-4` on kicker for rhythm; verify section rhythm (add `mt-0` or rely on existing `py-24`) rather than leaving orphaned gaps.
- `plan-visit-section` kicker sits beside a hairline `<span class="h-px w-10 bg-cta">`; keep the hairline if the design needs an anchor, drop only the text.
- Salvation `em→span` change: screen-reader emphasis loss is intentional (headline should be one voice); color+block preserves visual hierarchy without slant.
- Do not touch code-comment em-dashes, `worker-configuration.d.ts`, or Spanish/staging schedule data.

## Acceptance

- Zero user-visible em-dashes in edited components/pages except retained en-dash ranges; lists use colons.
- Exactly one italic context site-wide: quoted Scripture/prayer (salvation prayer card); headlines have zero italic.
- Kickers remain only as listed keeps; every homepage section H2 stands without a same-style uppercase kicker.
- No announcement pill/badge renders; dead hero eyebrow CSS removed; `pnpm build` green.
