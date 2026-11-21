# SkillUp — setup

Login, sign-up, dashboard, learner profile, and **Learn, quiz + review** (lesson page, Sport Final quiz, results), connected to Supabase.

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
   4. `supabase/003_learn_quiz.sql`
   5. `supabase/003_content.sql` (lesson cards + finals; rows marked DRAFT need a coach's review)

   Already ran 1–3 for "start + home"? Just run 4 and 5, then run `demo_jamie.sql` again.
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

## 5. Lesson videos (optional, when the team has them)
1. **Storage → New bucket** `lesson-videos`, set to **Public**.
2. Upload `basketball-4.mp4` (and captions `basketball-4.vtt` for the CC button).
3. In **Table Editor → lessons**, paste the public URLs into `video_url` and `captions_url`, and the length in seconds into `video_seconds`.
Until then the lesson shows the "VIDEO GOES HERE" placeholder.

## 6. Trying the Sport Final
The final unlocks after all 5 lessons of a sport are finished. The "Try it / Quick check / Play"
steps are the next wireframes, so for now open `supabase/test_unlock_final.sql`, set the username
and sport, and run it. **Test databases only.**

## 7. Test checklist
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

Learn, quiz + review:
- [ ] Jamie: dashboard **Continue** opens Basketball Lesson 4: sidebar Done/Done/Done/Up next/Not started, 3 / 5, 4 / 8, card 1 ticked, "1 / 3"
- [ ] Tick cards 2 and 3 → refresh → still ticked; **Next: Try it** works only at 3 / 3
- [ ] Dashboard Continue now says "Next step: Try it"
- [ ] Basketball Sport Final button is locked (3/5); opening `final.html?sport=basketball` shows "Sport final locked"
- [ ] After `test_unlock_final.sql` (volleyball): live "Correct so far", a wrong answer shows the right one + review link
- [ ] Refresh in the middle of the quiz → carries on from the same question
- [ ] 7/10 → Bronze, 9/10 → Silver; a retake only pays points for questions not answered right before
- [ ] Results: Try again, Dashboard and Next buttons work; Celebration sound OFF is remembered
- [ ] Profile tracker rows and Resume open the right lesson

## Folder map
```
index.html  signup.html  dashboard.html  profile.html  lesson.html  final.html  result.html
css/                     base.css (shared), auth.css, dashboard.css, profile.css, learn.css
js/presentation/         pages/ (one script per page), components/ (icons, ui helpers, page guard, top bar, sound)
js/business/             authService.js, homeService.js, lessonService.js, quizService.js
js/data/                 config.js, supabaseClient.js, *Repository.js, sportInfo.js, lessonUi.js
supabase/                schema.sql, seed.sql, 002_home.sql, 003_learn_quiz.sql, 003_content.sql,
                         demo_jamie.sql, test_unlock_final.sql (test only)
assets/img/               artwork cut from the Figma export
CLAUDE.md                rules Claude Code follows in this project
```
