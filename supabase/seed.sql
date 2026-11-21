-- =====================================================================
-- SkillUp · starting content (from the Figma screens)
-- DRAFT FOR REVIEW. Run after schema.sql.
-- TODO (team): video_url for each lesson, badge names marked TODO,
--              and the basketball + soccer final quiz questions.
-- =====================================================================

insert into public.sports (id, name, accent_color, sort_order) values
  ('basketball', 'Basketball', '#E8792B', 1),
  ('volleyball', 'Volleyball', '#F2C14E', 2),
  ('soccer',     'Soccer',     '#2FA35B', 3);

insert into public.lessons (sport_id, lesson_no, title, goal, card_count, challenge_type) values
  ('basketball', 1, 'Meet basketball', 'Know how the game works and how to score.', 4, null),
  ('basketball', 2, 'Positions',       'Know the 5 positions and where each one usually plays.', 4, 'positions'),
  ('basketball', 3, 'Basic rules',     'Spot the four most common beginner mistakes.', 4, 'rules'),
  ('basketball', 4, 'Basic skills',    'Learn to dribble, pass, and shoot with good form.', 3, 'timing'),
  ('basketball', 5, 'Game smarts',     'Make good choices during a game.', 4, 'play'),
  ('volleyball', 1, 'Meet volleyball', 'Know how the game works and how to score.', 4, null),
  ('volleyball', 2, 'Positions and court zones', 'Know the 6 court zones and the main player roles.', 4, 'positions'),
  ('volleyball', 3, 'Basic rules',     'Spot the most common faults.', 4, 'rules'),
  ('volleyball', 4, 'Basic skills',    'Learn to bump, set, and serve underhand.', 3, 'timing'),
  ('volleyball', 5, 'Game smarts',     'Use your 3 touches well and work as a team.', 4, 'play'),
  ('soccer', 1, 'Meet soccer',  'Know how the game works and how to score.', 4, null),
  ('soccer', 2, 'Positions',    'Know the 4 main positions and where they play.', 4, 'positions'),
  ('soccer', 3, 'Basic rules',  'Know what happens when a rule is broken or the ball goes out.', 4, 'rules'),
  ('soccer', 4, 'Basic skills', 'Learn to pass, dribble, and shoot.', 3, 'timing'),
  ('soccer', 5, 'Game smarts',  'Make good choices and play as a team.', 4, 'play');

-- 24 challenge levels. "items" = tokens to place; timing values match the screens.
insert into public.challenge_levels (sport_id, challenge_type, level, title, settings) values
  ('basketball','positions',1,'Set your starting five',          '{"items":5}'),
  ('basketball','positions',2,'Starting five: flipped court',    '{"items":5}'),
  ('basketball','rules',    1,'Which player is traveling?',      '{}'),
  ('basketball','rules',    2,'Which player made a foul?',       '{}'),
  ('basketball','timing',   1,'Timing bar: free throw',          '{"tries":5,"hits_to_pass":3,"sweep_s":2.0,"zone_pct":25}'),
  ('basketball','timing',   2,'Timing bar: free throw',          '{"tries":5,"hits_to_pass":4,"sweep_s":1.4,"zone_pct":15}'),
  ('basketball','play',     1,'Choose your play: open teammate', '{"seconds":5}'),
  ('basketball','play',     2,'Choose your play: open under the basket', '{"seconds":3}'),
  ('volleyball','positions',1,'Number the court zones',          '{"items":6}'),
  ('volleyball','positions',2,'Place the server, setter and libero', '{"items":3}'),
  ('volleyball','rules',    1,'Is this ball in or out?',         '{}'),
  ('volleyball','rules',    2,'Which player made a fault?',      '{}'),
  ('volleyball','timing',   1,'Timing bar: underhand serve',     '{"tries":5,"hits_to_pass":3,"sweep_s":2.0,"zone_pct":25}'),
  ('volleyball','timing',   2,'Timing bar: underhand serve',     '{"tries":5,"hits_to_pass":4,"sweep_s":1.4,"zone_pct":15}'),
  ('volleyball','play',     1,'Choose your play: first touch',   '{"seconds":5}'),
  ('volleyball','play',     2,'Choose your play: serving',       '{"seconds":3}'),
  ('soccer','positions',1,'Find each player''s area',            '{"items":4}'),
  ('soccer','positions',2,'Line up a 7 v 7 team (2-3-1)',        '{"items":7}'),
  ('soccer','rules',    1,'Which player touched the ball with their hand?', '{}'),
  ('soccer','rules',    2,'Which player is offside?',            '{}'),
  ('soccer','timing',   1,'Timing bar: shot on goal',            '{"tries":5,"hits_to_pass":3,"sweep_s":2.0,"zone_pct":25}'),
  ('soccer','timing',   2,'Timing bar: shot on goal',            '{"tries":5,"hits_to_pass":4,"sweep_s":1.4,"zone_pct":15}'),
  ('soccer','play',     1,'Choose your play: two defenders',     '{"seconds":5}'),
  ('soccer','play',     2,'Choose your play: alone with the keeper', '{"seconds":3}');

-- 5 badges per sport (4 challenges + final quiz). Names from the trophy
-- shelf are used where they fit; the rest are placeholders for the team.
insert into public.badges (id, name, sport_id, source, challenge_type) values
  ('court-basics',     'Court Basics',            'basketball','challenge','positions'),
  ('rules-rookie',     'Rules Rookie',            'basketball','challenge','rules'),
  ('free-throw-pro',   'Free Throw Pro',          'basketball','challenge','timing'),
  ('bb-playmaker',     'TODO Playmaker',          'basketball','challenge','play'),
  ('bb-final',         'TODO Basketball Final',   'basketball','quiz',     null),
  ('vb-zones',         'TODO Zone Master',        'volleyball','challenge','positions'),
  ('vb-rules',         'TODO Line Judge',         'volleyball','challenge','rules'),
  ('first-bump',       'First Bump',              'volleyball','challenge','timing'),
  ('vb-play',          'TODO Smart Setter',       'volleyball','challenge','play'),
  ('net-ninja',        'Net Ninja',               'volleyball','quiz',     null),
  ('pitch-starter',    'Pitch Starter',           'soccer',    'challenge','positions'),
  ('sc-rules',         'TODO Ref Ready',          'soccer',    'challenge','rules'),
  ('sc-timing',        'TODO Top Corner',         'soccer',    'challenge','timing'),
  ('sc-play',          'TODO Team Player',        'soccer',    'challenge','play'),
  ('sc-final',         'TODO Soccer Final',       'soccer',    'quiz',     null);

-- Volleyball final quiz (Q1 is from the screen; Q2–Q10 drafted from the lessons).
insert into public.quiz_questions (sport_id, from_lesson_no, question_no, prompt, options, correct_index) values
  ('volleyball',1, 1,'How many players does each team have on the court?','["5","6","11"]',1),
  ('volleyball',1, 2,'How many times can your team touch the ball before sending it over?','["2","3","4"]',1),
  ('volleyball',1, 3,'How many points win a set (leading by 2)?','["15","21","25"]',2),
  ('volleyball',2, 4,'Which zone does the server stand in?','["Zone 1","Zone 3","Zone 6"]',0),
  ('volleyball',2, 5,'Which player wears a different-colored shirt?','["Setter","Libero","Hitter"]',1),
  ('volleyball',3, 6,'A ball lands on the line. Is it in or out?','["In","Out","Replay the point"]',0),
  ('volleyball',3, 7,'Touching the net while playing the ball is…','["Allowed","A fault","A point for you"]',1),
  ('volleyball',4, 8,'In a bump, you hit the ball with your…','["Fingertips","Forearms","Palms"]',1),
  ('volleyball',4, 9,'In an underhand serve, you hit the ball with the…','["Heel of your hand","Fingertips","Fist from above"]',0),
  ('volleyball',5,10,'What is the usual pattern for your 3 touches?','["Set, Bump, Hit","Bump, Set, Hit","Hit, Hit, Hit"]',1);
