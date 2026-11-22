-- =====================================================================
-- SkillUp - 010 - Soccer challenges (Positions, Rules, Timing, Choose play; Level 1 + 2)
-- Run after 009_volleyball_challenges.sql. Safe to run again.
--
-- Content only: the 8 soccer challenge_levels rows and their settings are already in seed.sql,
-- and the game rules (challenge_move, finish_timing, _finish_challenge) from 007/008 work for any sport.
-- Answers go in challenge_keys (private, no read policy), like basketball and volleyball.
-- The Timing title stays "Timing bar: shooting" (set by 006 for the lesson link); its heading is in content.
--
-- -- DRAFT (a coach should check):
--    * where players and pieces stand in the pictures (x / y);
--    * Rules Level 1: white #4 is the player who handles the ball (not shown on the Figma screen);
--    * Rules Level 2: blue #9 is the offside player (not shown on the Figma screen);
--    * the Choose play "why" lines for the wrong options;
--    * the badge names Ref Ready, Top Corner, Team Player.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. CONTENT (text from the Figma screens)
-- x / y are percent of the picture. Spot ids are neutral (s1..s7) so they don't give the answer away.
-- Positions: pitch from above, their goal at the top, your goal at the bottom.
-- Rules / Choose play: pitch from above, blue attacks the goal on the right.
-- Positions Level 2 has repeated players, so tokens have unique ids (DF1, DF2...) and a short label to show.
-- ---------------------------------------------------------------------

update public.challenge_levels c
   set title = coalesce(v.title, c.title), content = v.content::jsonb
  from (values
  ('positions', 1, 'Find each player''s area', '{
     "heading": "Find each player''s area",
     "sub": "Drag the 4 players into their bands. Your goal is at the bottom. Drag a token onto a spot, or tap a token and then tap a spot.",
     "view": "bands",
     "bands": ["Attack", "Middle", "Defense", "Goal area"],
     "tokens": [{"id":"GK","name":"Goalkeeper"},{"id":"DF","name":"Defender"},
                {"id":"MF","name":"Midfielder"},{"id":"FW","name":"Forward"}],
     "spots": [{"id":"s2","label":null,"x":50,"y":20},{"id":"s4","label":null,"x":50,"y":44},
               {"id":"s1","label":null,"x":50,"y":67},{"id":"s3","label":null,"x":50,"y":86}],
     "miss": "Not there! Think about who plays closest to the basket, net, or goal.",
     "done": "Every player is in their area."}'),
  ('positions', 2, 'Line up a 7 v 7 team (2-3-1)', '{
     "heading": "Line up a 7 v 7 team (2-3-1)",
     "sub": "Place 1 GK, 2 DF, 3 MF and 1 FW. Your goal is at the bottom. Drag a token onto a spot, or tap a token and then tap a spot.",
     "view": "bands",
     "bands": ["Attack", "Middle (3)", "Defense (2)", "Goal area"],
     "tokens": [{"id":"GK","name":"Goalkeeper"},
                {"id":"DF1","label":"DF","name":"Defender"},{"id":"DF2","label":"DF","name":"Defender"},
                {"id":"MF1","label":"MF","name":"Midfielder"},{"id":"MF2","label":"MF","name":"Midfielder"},
                {"id":"MF3","label":"MF","name":"Midfielder"},{"id":"FW","name":"Forward"}],
     "spots": [{"id":"s5","label":null,"x":50,"y":20},
               {"id":"s2","label":null,"x":22,"y":44},{"id":"s7","label":null,"x":50,"y":44},{"id":"s4","label":null,"x":78,"y":44},
               {"id":"s6","label":null,"x":32,"y":67},{"id":"s1","label":null,"x":68,"y":67},
               {"id":"s3","label":null,"x":50,"y":86}],
     "miss": "Not there! Think about who plays closest to the basket, net, or goal.",
     "done": "Your 2-3-1 team is ready."}'),
  ('rules', 1, 'Which player touched the ball with their hand?', '{
     "heading": "Which player touched the ball with their hand?",
     "sub": "Blue #9 just shot at goal. Click the player who broke the rule.",
     "view": "pitch",
     "teams": {"blue": "Blue: attacking", "white": "White: defending"},
     "players": [{"no":"9","team":"blue","x":58,"y":56},{"no":"4","team":"white","x":78,"y":44,"ball":true},
                 {"no":"6","team":"white","x":70,"y":76},{"no":"1","team":"gk","x":93,"y":50}],
     "hint": "Remember: only the goalkeeper can use hands.",
     "success_title": "Handball!",
     "success": "Handball: the other team gets a free kick."}'),
  ('rules', 2, 'Which player is offside?', '{
     "heading": "Which player is offside?",
     "sub": "Blue #10 is kicking a pass forward right now. Blue attacks the goal on the right.",
     "view": "pitch",
     "teams": {"blue": "Blue: attacking", "white": "White: defending"},
     "players": [{"no":"10","team":"blue","x":36,"y":50,"ball":true},{"no":"7","team":"blue","x":54,"y":20},
                 {"no":"11","team":"blue","x":60,"y":82},{"no":"9","team":"blue","x":84,"y":38},
                 {"no":"5","team":"white","x":66,"y":30},{"no":"4","team":"white","x":60,"y":52},
                 {"no":"2","team":"white","x":70,"y":66},{"no":"1","team":"gk","x":94,"y":50}],
     "hint": "Count the opponents between each attacker and the goal.",
     "success_title": "Offside!",
     "success": "You need at least 2 opponents level with you or closer to their goal when the pass is made."}'),
  ('timing', 1, null, '{
     "heading": "Timing bar: shot on goal",
     "sub": "Watch the ball rolling toward the kicking foot. Press KICK! when the marker is in the green zone.",
     "button": "KICK!",
     "tips": {"early": "Too early! Plant your foot next to the ball first.",
              "late": "Too late! The ball rolled past. Kick as your foot lands.",
              "hit": "Goal! Laces on the ball."}}'),
  ('timing', 2, null, '{
     "heading": "Timing bar: shot on goal",
     "sub": "Watch the ball rolling toward the kicking foot. Press KICK! when the marker is in the green zone.",
     "button": "KICK!",
     "tips": {"early": "Too early! Plant your foot next to the ball first.",
              "late": "Too late! The ball rolled past. Kick as your foot lands.",
              "hit": "Goal! Laces on the ball."}}'),
  ('play', 1, 'Choose your play: two defenders', '{
     "heading": "Choose your play!",
     "scenario": "You''re dribbling toward goal. Two defenders block you, and a teammate is open on the left wing.",
     "options": ["Shoot through the defenders", "Dribble back", "Pass to the left wing"],
     "view": "pitch",
     "pieces": [{"kind":"you","label":"YOU","x":54,"y":50},{"kind":"opp","label":"D","x":68,"y":40},
                {"kind":"opp","label":"D","x":68,"y":62},{"kind":"gk","label":"GK","x":93,"y":50},
                {"kind":"mate","label":"FW","x":64,"y":14,"tag":"OPEN"}],
     "tips": ["Spread out so teammates are open.", "Pass to an open teammate ahead of you.", "Shoot when you have a clear view of the goal."]}'),
  ('play', 2, 'Choose your play: alone with the keeper', '{
     "heading": "Choose your play!",
     "scenario": "You''re alone in front of the goal with only the goalkeeper ahead.",
     "options": ["Shoot at the goalkeeper", "Shoot to the corner", "Pass back"],
     "view": "pitch",
     "pieces": [{"kind":"you","label":"YOU","x":78,"y":50},{"kind":"gk","label":"GK","x":93,"y":50},
                {"kind":"opp","label":"D","x":58,"y":64},{"kind":"mate","label":"MF","x":54,"y":30}],
     "tips": ["Spread out so teammates are open.", "Pass to an open teammate ahead of you.", "Shoot when you have a clear view of the goal."]}')
  ) as v(challenge_type, level, title, content)
 where c.sport_id = 'soccer' and c.challenge_type = v.challenge_type and c.level = v.level;

-- ---------------------------------------------------------------------
-- 2. ANSWERS (private). Positions: which tokens may stand on each spot.
-- ---------------------------------------------------------------------

insert into public.challenge_keys (challenge_level_id, answer)
select c.id, v.answer::jsonb
  from (values
  ('positions', 1, '{"s2":["FW"],"s4":["MF"],"s1":["DF"],"s3":["GK"]}'),
  ('positions', 2, '{"s5":["FW"],"s2":["MF1","MF2","MF3"],"s7":["MF1","MF2","MF3"],"s4":["MF1","MF2","MF3"],
                     "s6":["DF1","DF2"],"s1":["DF1","DF2"],"s3":["GK"]}'),
  ('rules',     1, '{"player":"4"}'),
  ('rules',     2, '{"player":"9"}'),
  ('play',      1, '{"correct":2,"why":[
     "Shoot through the defenders: two defenders are in the way, so the shot will likely be blocked.",
     "Dribble back: you move away from goal and give the defenders time to get set.",
     "Pass to the left wing: Your teammate has space."]}'),
  ('play',      2, '{"correct":1,"why":[
     "Shoot at the goalkeeper: the keeper is right there and can save it easily.",
     "Shoot to the corner: It''s the hardest spot for the goalkeeper to reach.",
     "Pass back: you give away a great chance to score."]}')
  ) as v(challenge_type, level, answer)
  join public.challenge_levels c on c.sport_id = 'soccer' and c.challenge_type = v.challenge_type and c.level = v.level
on conflict (challenge_level_id) do update set answer = excluded.answer;

-- ---------------------------------------------------------------------
-- 3. BADGE NAMES (were placeholders in seed.sql) -- DRAFT
-- ---------------------------------------------------------------------

update public.badges b
   set name = v.name
  from (values ('sc-rules', 'Ref Ready'), ('sc-timing', 'Top Corner'), ('sc-play', 'Team Player')) as v(id, name)
 where b.id = v.id;

-- Check (optional):
-- select challenge_type, level, title, content->>'heading' from public.challenge_levels where sport_id = 'soccer' order by 1, 2;
-- select count(*) from public.challenge_keys k join public.challenge_levels c on c.id = k.challenge_level_id
--  where c.sport_id = 'soccer';   -- 6 (timing has no key)
-- select id, name from public.badges where sport_id = 'soccer';
