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
- Build lesson links with `lessonHref()` from `js/business/lessonService.js`.
- Unfinished pages: give the link the `soon` class (shows a "Coming soon" toast).
- Draft content in SQL is marked `-- DRAFT` until a coach reviews it.
