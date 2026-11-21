-- =====================================================================
-- SkillUp - 005 - Volleyball lessons 1-5 (text from the Figma screens)
-- Run after 004_basketball_lessons.sql.
-- Run the WHOLE file with nothing highlighted in the SQL Editor.
-- Safe to run again: existing volleyball cards are replaced, nothing is duplicated.
-- Plain ASCII only: apostrophes are written '' and the dot / dash in two labels
-- are escape codes inside E'...' strings (Postgres turns them back into the real characters).
-- **text** inside a card body is shown in bold on the lesson page.
-- =====================================================================

insert into public.lesson_cards (lesson_id, card_no, label, heading, body, icon)
select l.id, c.card_no, c.label, c.heading, c.body, c.icon
  from (values
  -- Lesson 1 - Meet volleyball
  (1, 1, '6 v 6',        null, 'Two teams of 6 players stand on each side of a net.', 'players'),
  (1, 2, 'Over the net', null, 'Hit the ball over the net. Don''t let it touch the floor on your side.', 'net'),
  (1, 3, '3 touches',    null, 'Your team can touch the ball up to 3 times before sending it over.', 'touches'),
  (1, 4, '25',           null, 'Every rally wins a point for someone. The first team to 25 points, leading by 2, wins the set.', 'tile:25'),
  -- Lesson 2 - Positions and court zones
  (2, 1, E'Zones 1\u20136', 'The court has 6 zones.', 'Front row: Zones 4, 3, and 2 (left to right). Back row: Zones 5, 6, and 1.', 'zones'),
  (2, 2, '1',            null, 'The player in Zone 1 (back right) serves the ball.', 'badge:1'),
  (2, 3, 'Roles',        'Setter:', 'sets up the ball so a teammate can hit it. **Hitters** (outside and middle) jump and hit the ball over. **Libero:** a back-row defender who wears a different-colored shirt.', 'roles'),
  (2, 4, 'Rotate',       null, 'When your team wins back the serve, everyone rotates one zone clockwise.', 'rotate'),
  -- Lesson 3 - Basic rules
  (3, 1, 'Net touch',    'Net touch:',      'touching the net while playing the ball is a fault.', 'net'),
  (3, 2, 'Foot fault',   'Foot fault:',     'when serving, you can''t step on or over the end line before you hit the ball.', 'foot-fault'),
  (3, 3, 'Max 3',        'Double contact:', 'one player can''t touch the ball twice in a row. **Four hits:** a team touching the ball 4 times is a fault.', 'touches'),
  (3, 4, 'Line = in',    'Line ball:',      'a ball that lands on the line is in.', 'line-in'),
  -- Lesson 4 - Basic skills
  (4, 1, 'Bump',  'Bump (forearm pass):', 'hold your hands together and keep your arms straight to make a flat platform. Bend your knees and let the ball hit your forearms. Don''t swing your arms.', 'bump'),
  (4, 2, 'Set',   'Set:',             'hands above your forehead, fingers spread, thumbs and pointer fingers making a triangle "window." Push the ball up with your fingertips.', 'set'),
  (4, 3, 'Serve', 'Underhand serve:', 'hold the ball at waist height in front of you. Swing your other arm like a pendulum and hit the ball with the heel of your hand.', 'serve'),
  -- Lesson 5 - Game smarts
  (5, 1, E'Bump\u00b7Set\u00b7Hit', 'Use the pattern Bump, Set, Hit:', 'the first touch goes to the setter, the second sets it up, and the third goes over.', 'team'),
  (5, 2, 'MINE!',      null, 'Call "Mine!" loudly when the ball is yours so teammates don''t crash into each other.', 'tile:MINE!'),
  (5, 3, 'Open space', null, 'Aim for open spaces on the other side, where no player is standing.', 'target'),
  (5, 4, 'Get ready',  'After your touch, get ready again:', 'knees bent, arms ready.', 'ready')
  ) as c(lesson_no, card_no, label, heading, body, icon)
  join public.lessons l on l.sport_id = 'volleyball' and l.lesson_no = c.lesson_no
on conflict (lesson_id, card_no) do update
  set label = excluded.label, heading = excluded.heading, body = excluded.body, icon = excluded.icon;

-- Check (optional): should return 19
-- select count(*) from public.lesson_cards c join public.lessons l on l.id = c.lesson_id where l.sport_id = 'volleyball';
