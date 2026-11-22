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
   6. `supabase/004_basketball_lessons.sql` (exact Basketball lesson 1–5 cards from the Figma screens)
   7. `supabase/005_volleyball_lessons.sql` (exact Volleyball lesson 1–5 cards from the Figma screens)
   8. `supabase/006_soccer_lessons.sql` (exact Soccer lesson 1–5 cards, "Timing bar: shooting", Soccer final Q9–Q10)
   9. `supabase/007_basketball_challenges.sql` (Basketball challenges: Positions, Rules, Timing, Choose play; answers kept on the server)

   Already ran the earlier files? Only run the new ones (e.g. just 9), then `demo_jamie.sql` again.
   Run each file whole, with nothing highlighted in the SQL Editor.
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
The final unlocks after all 5 lessons of a sport are finished. A lesson is finished by ticking every
key-point card and pressing the big footer button ("Next lesson: …" or "Play the challenge: …").
Shortcut for testing: `supabase/test_unlock_final.sql` (set the username and sport). **Test databases only.**

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
- [ ] Tick cards 2 and 3 → refresh → still ticked
- [ ] Basketball Sport Final button is locked (3/5); opening `final.html?sport=basketball` shows "Sport final locked"
- [ ] After `test_unlock_final.sql` (volleyball): live "Correct so far", a wrong answer shows the right one + review link
- [ ] Refresh in the middle of the quiz → carries on from the same question
- [ ] 7/10 → Bronze, 9/10 → Silver; a retake only pays points for questions not answered right before
- [ ] Results: Try again, Dashboard and Next buttons work; Celebration sound OFF is remembered
- [ ] Profile tracker rows and Resume open the right lesson

Basketball lessons 1–5:
- [ ] Each lesson matches its Figma screen: card text, picture labels (5 v 5, 10 ft high, 1·2·3, Gear, PG, SG, SF, PF + C, Traveling, Double dribble, Foul, Out, Open, Keep moving, Shoot, Defense), counter 0 / 4 (Lesson 4: 0 / 3)
- [ ] Sidebar says "Drag-and-drop court positions", "Clickable rule scenarios", "Choose your play cards"
- [ ] Footer: Lesson 1 "Next lesson: Positions"; Lessons 2–5 "Play the challenge: …"; it only works once every card is ticked
- [ ] Lesson 1 footer → +10 pts toast → opens Lesson 2; Lessons 2–5 → +10 pts, sidebar shows Done and progress goes up
- [ ] Back on Lesson 3 → Lesson 2; Back on Lesson 1 → dashboard
- [ ] Finishing a lesson again gives no extra points
- [ ] Jamie: finish Lessons 4 and 5 → Basketball Sport Final unlocks; dashboard shows Basketball 5/5

Volleyball lessons 1–5:
- [ ] Jamie → Volleyball tab: Lesson 1 Done, Lesson 2 Up next, progress 1 / 5 (challenge levels shows 1 / 8 because of Jamie's First Bump pass; the Figma screen shows 0 / 8)
- [ ] Each lesson matches its Figma screen: card text, labels (6 v 6, Over the net, 3 touches, 25, Zones 1–6, 1, Roles, Rotate, Net touch, Foot fault, Max 3, Line = in, Bump, Set, Serve, Bump·Set·Hit, MINE!, Open space, Get ready), counter 0 / 4 (Lesson 4: 0 / 3)
- [ ] Bold words in the middle of a card show bold (Lesson 2 "Hitters", "Libero:"; Lesson 3 "Four hits:"), never as `**`
- [ ] Sidebar and Lesson 2 footer say "Drag-and-drop court zones"; Lesson 4 "Timing bar: underhand serve"; Lesson 1 footer "Next lesson: Positions and court zones"
- [ ] Finish all 5 volleyball lessons → Volleyball Sport Final unlocks

Soccer lessons 1–5:
- [ ] Jamie → Soccer tab: Lesson 1 Up next, progress 0 / 5, challenge levels 0 / 8 (matches the Figma screens)
- [ ] Lesson page colours follow the sport: Basketball orange, Volleyball yellow, Soccer green
- [ ] Each lesson matches its Figma screen: card text, labels (11 v 11, Goal!, Only GK, Gear, GK, DF, MF, FW, Handball, Foul, Ball out, Offside, Pass, Dribble, Laces, Spread out, Pass, Shoot, Defense), counter 0 / 4 (Lesson 4: 0 / 3)
- [ ] Sidebar and footers: "Drag-and-drop field positions", "Timing bar: shooting"; Lesson 1 footer "Next lesson: Positions"
- [ ] Finish all 5 soccer lessons → Soccer Sport Final unlocks; Q9 is "Why should your team spread out?"

Basketball challenges (Level 1 + Level 2):
- [ ] A challenge opens only after its lesson (Positions ← Lesson 2, Rules ← 3, Timing ← 4, Choose play ← 5); locked tabs show a lock and say which lesson to finish
- [ ] Lesson 2–5 footer "Play the challenge: …" → +10 toast → opens that challenge; dashboard **Challenges** opens it too (Volleyball/Soccer still "Coming soon")
- [ ] Level 2 tab stays locked until Level 1 is passed
- [ ] Positions: drag a token or tap token → tap spot; a wrong spot adds a miss and shows "Not there! …"; PF/C either low post, SG/SF either wing; Level 2 court is flipped with "?" spots; Reset starts again
- [ ] Rules: Level 1 traveling = #10, Level 2 foul = #6; a wrong pick shows the hint and adds to "Tries so far"
- [ ] Timing: START, then SHOOT! (or Space) in the green zone; 5 tries, Level 1 needs 3 hits (2.0 s, 25 %), Level 2 needs 4 (1.4 s, 15 %); coach tip after each try
- [ ] Choose play: START → 5 s (Level 2: 3 s) countdown; right answer "Great choice! +20 pts" with the reason; wrong or too late → Try again
- [ ] "Level N passed! +20 pts" only the first time; replays give no points but can upgrade the badge
- [ ] See results → `result.html?level=…`: score, misses/tries/hits/time, badge tier, Try again, Next (Level 2 → next game → Sport Final)
- [ ] Refresh in the middle of Positions or Rules → carries on where you were
- [ ] Jamie: Positions and Rules show both levels passed (from the demo); Timing and Choose play locked until Lessons 4 and 5 are done
- [ ] Security: in Table Editor `challenge_keys` has RLS on and no policies; the old `submit_challenge` can't be called from the site

## Folder map
```
index.html  signup.html  dashboard.html  profile.html  lesson.html  final.html  result.html  challenge.html
css/                     base.css (shared), auth.css, dashboard.css, profile.css, learn.css, challenge.css
js/presentation/         pages/ (one script per page), components/ (icons, ui helpers, page guard, top bar, sound,
                         courtArt, games/ = the four challenge games)
js/business/             authService.js, homeService.js, lessonService.js, quizService.js, challengeService.js
js/data/                 config.js, supabaseClient.js, *Repository.js, sportInfo.js, lessonUi.js, challengeUi.js
supabase/                schema.sql, seed.sql, 002_home.sql, 003_learn_quiz.sql, 003_content.sql,
                         004_basketball_lessons.sql, 005_volleyball_lessons.sql,
                         006_soccer_lessons.sql, 007_basketball_challenges.sql,
                         demo_jamie.sql, test_unlock_final.sql (test only)
assets/img/               artwork cut from the Figma export
CLAUDE.md                rules Claude Code follows in this project
```
