-- =====================================================================
-- SkillUp - 006 - Soccer lessons 1-5 (text from the Figma screens)
-- Run after 005_volleyball_lessons.sql.
-- Run the WHOLE file with nothing highlighted in the SQL Editor.
-- Safe to run again: cards are replaced, renames and question updates just repeat.
-- Plain ASCII only: apostrophes are written ''.
-- =====================================================================

-- 1. Lesson cards ------------------------------------------------------
insert into public.lesson_cards (lesson_id, card_no, label, heading, body, icon)
select l.id, c.card_no, c.label, c.heading, c.body, c.icon
  from (values
  -- Lesson 1 - Meet soccer
  (1, 1, '11 v 11',  null, 'Two teams of 11 players each. Each team has 1 goalkeeper. Young players often play smaller games, like 7 vs 7.', 'players'),
  (1, 2, 'Goal!',    null, 'You score a goal when the whole ball crosses the goal line into the net.', 'goal'),
  (1, 3, 'Only GK',  null, 'Players use their feet, legs, body, and head, but not their hands or arms. Only the goalkeeper can use their hands, and only inside their own penalty area.', 'hand'),
  (1, 4, 'Gear',     'What you need:', 'a ball, shin guards, and soccer shoes or sneakers.', 'gear'),
  -- Lesson 2 - Positions
  (2, 1, 'GK', 'Goalkeeper (GK):',  'guards the goal and can use their hands in the penalty area.', 'hand'),
  (2, 2, 'DF', 'Defenders (DF):',   'play near their own goal and stop the other team from scoring.', 'shield'),
  (2, 3, 'MF', 'Midfielders (MF):', 'play in the middle. They help on defense and attack and pass the ball forward.', 'badge:MF'),
  (2, 4, 'FW', 'Forwards (FW):',    'play closest to the other team''s goal. Their main job is to score.', 'goal'),
  -- Lesson 3 - Basic rules
  (3, 1, 'Handball', 'Handball:', 'touching the ball on purpose with your hand or arm. The other team gets a free kick.', 'hand'),
  (3, 2, 'Foul',     'Fouls:',    'tripping, pushing, or kicking another player. The other team gets a free kick. If a defender fouls inside their own penalty area, it''s a penalty kick.', 'kick'),
  (3, 3, 'Ball out', 'Ball out:', 'over the sideline gives a throw-in (two hands, from behind the head, both feet on the ground). Over the goal line gives a corner kick or goal kick, depending on who touched it last.', 'ball-out'),
  (3, 4, 'Offside',  'Offside (simple version):', 'when a teammate passes to you in the other team''s half, at least 2 opponents (usually the goalkeeper and one defender) must be level with you or closer to their goal.', 'offside'),
  -- Lesson 4 - Basic skills
  (4, 1, 'Pass',    'Pass:',    'put your standing foot next to the ball, pointing at your target. Kick with the inside of your other foot and keep your ankle firm.', 'boot'),
  (4, 2, 'Dribble', 'Dribble:', 'use small, soft touches so the ball stays close. Use both feet and look up often.', 'dribble-foot'),
  (4, 3, 'Laces',   'Shoot:',   'plant your standing foot beside the ball, keep your head over the ball, and strike with your laces (top of your shoe).', 'target'),
  -- Lesson 5 - Game smarts
  (5, 1, 'Spread out', 'Spread out.', 'If everyone chases the ball together, no one is open for a pass.', 'spread'),
  (5, 2, 'Pass',       null, 'Pass to a teammate who is open and ahead of you when you can.', 'pass'),
  (5, 3, 'Shoot',      null, 'Shoot when you have a clear view of the goal.', 'goal'),
  (5, 4, 'Defense',    null, 'On defense, stay between the attacker and your goal.', 'shield')
  ) as c(lesson_no, card_no, label, heading, body, icon)
  join public.lessons l on l.sport_id = 'soccer' and l.lesson_no = c.lesson_no
on conflict (lesson_id, card_no) do update
  set label = excluded.label, heading = excluded.heading, body = excluded.body, icon = excluded.icon;

-- 2. Lesson 4 challenge name from the Figma screen --------------------
update public.challenge_levels
   set title = 'Timing bar: shooting'
 where sport_id = 'soccer' and challenge_type = 'timing';

-- 3. Soccer final: Q9 and Q10 now test what Lesson 5 teaches (DRAFT - coach to review).
--    Same rows (same ids), so earned points and past attempts stay valid.
update public.quiz_questions
   set prompt = 'Why should your team spread out?',
       options = '["So someone is open for a pass","To rest","So the referee can see"]', correct_index = 0
 where sport_id = 'soccer' and question_no = 9;
update public.quiz_questions
   set prompt = 'On defense, stay between the attacker and...',
       options = '["Your goal","The sideline","The corner flag"]', correct_index = 0
 where sport_id = 'soccer' and question_no = 10;

-- Checks (optional):
-- select count(*) from public.lesson_cards c join public.lessons l on l.id = c.lesson_id where l.sport_id = 'soccer';  -- 19
-- select level, title from public.challenge_levels where sport_id = 'soccer' and challenge_type = 'timing';           -- Timing bar: shooting
-- select question_no, prompt from public.quiz_questions where sport_id = 'soccer' and question_no in (9, 10);
