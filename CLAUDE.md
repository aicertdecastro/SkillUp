# SkillUp · rules for this project

Static website (HTML + ES modules, no build step, no Node.js) on Supabase. Run with VS Code Live Server.

## Layers (keep them separate)
- `js/presentation/` — pages and components. DOM only. Never call Supabase directly.
- `js/business/` — rules, validation, wording/shaping of data for the pages.
- `js/data/` — the only code that talks to Supabase (`supabaseClient.js` + `*Repository.js`), plus fixed wording.
- `supabase/*.sql` — tables, Row Level Security and the trusted rules (RPC functions).

## Security
- Anything that gives points, badges, passes or checks an answer is a `security definer` SQL function that uses `auth.uid()`. The browser never writes those tables.
- Quiz answers (`quiz_questions.correct_index`) never go to the browser before the question is answered.
- Only the anon / publishable key in `js/data/config.js`. Never the service_role / secret key.
- Escape user text with `esc()` before putting it in `innerHTML`.

## Conventions
- New database changes go in a new numbered file (`004_…sql`); never edit a file teams have already run.
- Build lesson links with `lessonHref()` from `js/business/lessonService.js`; challenge links with
  `challengeHref()` from `js/business/challengeService.js`.
- Challenge answers live in `challenge_keys` (no read policy); every pick is checked by `challenge_move()`.
  A new sport's challenges = content + keys in a new SQL file, then add it to `CHALLENGES_READY` (`js/data/challengeUi.js`).
- Unfinished pages: give the link the `soon` class (shows a "Coming soon" toast).
- Draft content in SQL is marked `-- DRAFT` until a coach reviews it.
- SQL files are plain ASCII (the Supabase editor paste broke on curly quotes): `''` for apostrophes,
  `E'...'` escape codes for symbols like the middle dot. Content upserts use `on conflict ... do update`.
- Card text may use `**bold**`; render it with `richText()` from `components/ui.js` (escapes first).
