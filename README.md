# SkillUp — Start + Home setup

Login, sign-up, dashboard and learner profile, connected to Supabase.

## 1. Tools (each member)
- VS Code with the **Claude Code** and **Live Server** extensions
- Git
- No Node.js needed

## 2. Supabase (one member, about 20 minutes)
1. Go to supabase.com → **New project**. Pick the **Singapore** region. Save the database password somewhere safe.
2. **Authentication → Sign In / Providers → Email**: turn **Confirm email** OFF.
3. **Authentication → URL Configuration**: set Site URL to `http://127.0.0.1:5500`.
4. **SQL Editor → New query**: paste and run each file, in this order:
   1. `supabase/schema.sql`
   2. `supabase/seed.sql`
   3. `supabase/002_home.sql`
5. **Project Settings → API**: copy the **Project URL** and the **anon / publishable** key into `js/data/config.js`.
   Never use the service_role / secret key in the website.

## 3. Run the site
1. Open this folder in VS Code.
2. Right-click `index.html` → **Open with Live Server**.
3. Click **SIGN UP FREE** and create an account.

## 4. Demo account (Jamie, matches the Figma screens)
1. On the sign-up page create: name `Jamie Dela Cruz`, username `jamiedc`, email `jamie@skillup.test`, a password of your choice.
2. In the Supabase SQL Editor, run `supabase/demo_jamie.sql`.
3. Refresh the dashboard: 1,240 points, 5-day streak, 3 badges, Basketball 3/5, Continue: Lesson 4.
   Run the file again before the presentation to reset Jamie's streak to end on that day.

## 5. Test checklist
- [ ] New account → dashboard shows 0 points, 0/5 lessons, NEW! on every sport
- [ ] Wrong password → "Wrong email or password. Try again!"
- [ ] Signing up with a taken username → "That username is taken."
- [ ] Open `dashboard.html` while logged out → sent to the login page
- [ ] Keep me logged in ON → close the browser, reopen → still logged in
- [ ] Keep me logged in OFF → close the browser, reopen → logged out
- [ ] Edit profile → name and username change on the profile and dashboard
- [ ] Log out works
- [ ] Headings use the chunky Lilita One font (needs internet for Google Fonts)
- [ ] Phone size (Chrome DevTools → device toolbar) looks right
- [ ] In Supabase **Table Editor**, every table shows "RLS enabled"

## Folder map
```
index.html  signup.html  dashboard.html  profile.html
css/                     base.css (shared), auth.css, dashboard.css, profile.css
js/presentation/         pages/ (one script per page), components/ (icons, ui helpers, page guard)
js/business/             authService.js, homeService.js
js/data/                 config.js, supabaseClient.js, authRepository.js, homeRepository.js, sportInfo.js
supabase/                schema.sql, seed.sql, 002_home.sql, demo_jamie.sql
assets/img/               artwork cut from the Figma export
CLAUDE.md                rules Claude Code follows in this project
```
