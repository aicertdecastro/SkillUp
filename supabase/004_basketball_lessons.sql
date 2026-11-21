-- =====================================================================
-- SkillUp - 004 - Basketball lessons 1-5 (text from the Figma screens)
-- Run after 003_learn_quiz.sql and 003_content.sql.
-- Run the WHOLE file with nothing highlighted in the SQL Editor.
-- Safe to run again: existing basketball cards are replaced, nothing is duplicated.
-- Plain ASCII only: apostrophes are written '' and the middle dot in the "1-2-3" label
-- is an escape code inside an E'...' string (Postgres turns it back into the dot).
-- =====================================================================

-- Lessons 1 and 5 have cards with no bold lead-in, so the heading is optional.
alter table public.lesson_cards alter column heading drop not null;

insert into public.lesson_cards (lesson_id, card_no, label, heading, body, icon)
select l.id, c.card_no, c.label, c.heading, c.body, c.icon
  from (values
  -- Lesson 1 - Meet basketball
  (1, 1, '5 v 5',      null,                  'Two teams play with 5 players each on the court.', 'players'),
  (1, 2, '10 ft high', null,                  'You score by shooting the ball through the other team''s hoop. The hoop is 10 feet (3.05 m) high.', 'hoop'),
  (1, 3, E'1\u00b72\u00b73', null,            'A free throw is worth 1 point. A basket inside the 3-point line is worth 2. A basket from behind the 3-point line is worth 3.', 'score'),
  (1, 4, 'Gear',       null,                  'What you need: a basketball, a court with hoops, and rubber-soled shoes.', 'gear'),
  -- Lesson 2 - Positions
  (2, 1, 'PG',         'Point Guard (PG):',   'the best dribbler. Brings the ball up and starts plays.', 'badge:PG'),
  (2, 2, 'SG',         'Shooting Guard (SG):','a good shooter who plays on the wing.', 'badge:SG'),
  (2, 3, 'SF',         'Small Forward (SF):', 'an all-around player who can shoot, drive, and defend.', 'badge:SF'),
  (2, 4, 'PF + C',     'Power Forward (PF) and Center (C):', 'play close to the basket. They rebound and block shots. The Center is often the tallest player.', 'badge:PF|C'),
  -- Lesson 3 - Basic rules
  (3, 1, 'Traveling',      'Traveling:',      'taking more than 2 steps while holding the ball without dribbling.', 'steps'),
  (3, 2, 'Double dribble', 'Double dribble:', 'dribbling with both hands at once, or stopping your dribble and then dribbling again.', 'dribble2'),
  (3, 3, 'Foul',           'Personal foul:',  'pushing, holding, or hitting another player.', 'foul'),
  (3, 4, 'Out',            'Out of bounds:',  'if the ball or the player holding it touches the line or outside it, the other team gets the ball.', 'out'),
  -- Lesson 4 - Basic skills
  (4, 1, 'Dribble',    'Dribble:',            'push the ball down with your fingertips, not your palm. Keep it at waist height and your eyes up.', 'hand'),
  (4, 2, 'Chest pass', 'Chest pass:',         'hold the ball at your chest. Step toward your teammate and push your arms out, ending with thumbs pointing down.', 'pass'),
  (4, 3, 'B.E.E.F.',   'Shooting with B.E.E.F.:', 'Balance (feet shoulder-width apart), Eyes on the hoop, Elbow under the ball, Follow-through (snap your wrist and hold it, like reaching into a cookie jar).', 'target'),
  -- Lesson 5 - Game smarts
  (5, 1, 'Open',        null,                 'Pass to a teammate who is open, meaning no defender is close to them.', 'open'),
  (5, 2, 'Keep moving', null,                 'After you pass, keep moving to get open again.', 'run'),
  (5, 3, 'Shoot',       null,                 'Take a shot when you are close to the basket and no one is guarding you.', 'shoot'),
  (5, 4, 'Defense',     null,                 'On defense, stay between your player and the basket.', 'shield')
  ) as c(lesson_no, card_no, label, heading, body, icon)
  join public.lessons l on l.sport_id = 'basketball' and l.lesson_no = c.lesson_no
on conflict (lesson_id, card_no) do update
  set label = excluded.label, heading = excluded.heading, body = excluded.body, icon = excluded.icon;

-- Check (optional): should return 19
-- select count(*) from public.lesson_cards c join public.lessons l on l.id = c.lesson_id where l.sport_id = 'basketball';
