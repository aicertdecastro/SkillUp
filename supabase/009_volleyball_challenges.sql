-- =====================================================================
-- SkillUp - 009 - Volleyball challenges (Positions, Rules, Timing, Choose play; Level 1 + 2)
-- Run after 008_replay_practice.sql. Safe to run again.
--
-- Content only: the 8 volleyball challenge_levels rows and their settings are already in seed.sql,
-- and the game rules (challenge_move, finish_timing, _finish_challenge) from 007/008 work for any sport.
-- Answers go in challenge_keys (private, no read policy), like basketball.
--
-- -- DRAFT (a coach should check):
--    * where players and pieces stand in the pictures (x / y);
--    * Rules Level 2: the Figma screen shows two players numbered 3; the white one is #4 here so
--      every player can be picked by number;
--    * the Choose play "why" lines for the wrong options;
--    * the badge names Zone Master, Line Judge, Smart Setter.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. CONTENT (text from the Figma screens)
-- x / y are percent of the picture. Spot ids are neutral (s1..s6) so they don't give the answer away.
-- Court seen from above with the net at the top: front row = zones 4, 3, 2; back row = zones 5, 6, 1.
-- ---------------------------------------------------------------------

update public.challenge_levels c
   set title = v.title, content = v.content::jsonb
  from (values
  ('positions', 1, 'Number the court zones', '{
     "heading": "Number the court zones",
     "sub": "Drag the numbers 1 to 6 onto the 6 zones. The net is at the top. Drag a token onto a spot, or tap a token and then tap a spot.",
     "view": "zones",
     "tokens": [{"id":"1","name":"Zone 1"},{"id":"2","name":"Zone 2"},{"id":"3","name":"Zone 3"},
                {"id":"4","name":"Zone 4"},{"id":"5","name":"Zone 5"},{"id":"6","name":"Zone 6"}],
     "spots": [{"id":"s3","label":"Front row","x":17,"y":28},{"id":"s5","label":"Front row","x":50,"y":28},
               {"id":"s1","label":"Front row","x":83,"y":28},{"id":"s6","label":"Back row","x":17,"y":62},
               {"id":"s2","label":"Back row","x":50,"y":62},{"id":"s4","label":"Back row","x":83,"y":62}],
     "miss": "Not there! Think about who plays closest to the basket, net, or goal.",
     "done": "Every number is in the right zone."}'),
  ('positions', 2, 'Place the server, setter and libero', '{
     "heading": "Place the server, setter and libero",
     "sub": "Server goes in Zone 1, Setter in Zone 2, and the Libero in any back row zone. Drag a token onto a spot, or tap a token and then tap a spot.",
     "view": "zones",
     "tokens": [{"id":"SV","name":"Server"},{"id":"S","name":"Setter"},{"id":"L","name":"Libero"}],
     "spots": [{"id":"s3","label":"Zone 4","x":17,"y":28},{"id":"s5","label":"Zone 3","x":50,"y":28},
               {"id":"s1","label":"Zone 2","x":83,"y":28},{"id":"s6","label":"Zone 5","x":17,"y":62},
               {"id":"s2","label":"Zone 6","x":50,"y":62},{"id":"s4","label":"Zone 1","x":83,"y":62}],
     "miss": "Not there! Think about who plays closest to the basket, net, or goal.",
     "done": "Server, setter and libero are all in place."}'),
  ('rules', 1, 'Is this ball in or out?', '{
     "heading": "Is this ball in or out?",
     "sub": "The ball just landed. Look where it touches the floor.",
     "view": "line",
     "players": [{"no":"in","label":"IN"},{"no":"out","label":"OUT"}],
     "hint": "Look closely. Is any part of the ball on the line?",
     "success_title": "It''s in!",
     "success": "A ball that lands on the line is in."}'),
  ('rules', 2, 'Which player made a fault?', '{
     "heading": "Which player made a fault?",
     "sub": "Blue #7 just spiked the ball. Click the player who broke the rule.",
     "view": "net",
     "players": [{"no":"3","team":"blue","x":20,"y":80},{"no":"5","team":"blue","x":46,"y":84},
                 {"no":"9","team":"blue","x":78,"y":76},{"no":"7","team":"blue","x":58,"y":60,"ball":true,"touch":"net"},
                 {"no":"4","team":"white","x":36,"y":28},{"no":"2","team":"white","x":70,"y":20}],
     "hint": "Look at the net.",
     "success_title": "Net touch!",
     "success": "Touching the net while playing the ball is a fault."}'),
  ('timing', 1, 'Timing bar: underhand serve', '{
     "heading": "Timing bar: underhand serve",
     "sub": "Watch the arm swinging forward toward the ball. Press SERVE! when the marker is in the green zone.",
     "button": "SERVE!",
     "tips": {"early": "Too early! Wait until your arm swings to the ball.",
              "late": "Too late! Swing sooner and hit with the heel of your hand.",
              "hit": "Over the net! Nice serve."}}'),
  ('timing', 2, 'Timing bar: underhand serve', '{
     "heading": "Timing bar: underhand serve",
     "sub": "Watch the arm swinging forward toward the ball. Press SERVE! when the marker is in the green zone.",
     "button": "SERVE!",
     "tips": {"early": "Too early! Wait until your arm swings to the ball.",
              "late": "Too late! Swing sooner and hit with the heel of your hand.",
              "hit": "Over the net! Nice serve."}}'),
  ('play', 1, 'Choose your play: first touch', '{
     "heading": "Choose your play!",
     "scenario": "The other team serves a ball to you. It''s your team''s first touch.",
     "options": ["Bump to the setter", "Hit it straight over", "Let it drop"],
     "view": "court",
     "pieces": [{"kind":"opp","label":"SV","x":7,"y":50},{"kind":"mate","label":"S","x":58,"y":30,"tag":"SETTER"},
                {"kind":"mate","label":"OH","x":60,"y":80},{"kind":"you","label":"YOU","x":76,"y":62},
                {"kind":"mate","label":"L","x":88,"y":34}],
     "tips": ["Use Bump, Set, Hit.", "Call Mine! when the ball is yours.", "Aim for open space."]}'),
  ('play', 2, 'Choose your play: serving', '{
     "heading": "Choose your play!",
     "scenario": "You''re serving. The other team''s back left corner is empty.",
     "options": ["Serve to the best passer", "Serve to the open corner", "Serve as hard as you can"],
     "view": "court",
     "pieces": [{"kind":"empty","label":"EMPTY","x":13,"y":20},{"kind":"opp","label":"P","x":13,"y":52},
                {"kind":"opp","label":"P","x":13,"y":82},{"kind":"opp","label":"P","x":36,"y":22},
                {"kind":"opp","label":"P","x":36,"y":52},{"kind":"opp","label":"P","x":36,"y":82},
                {"kind":"mate","label":"S","x":62,"y":30},{"kind":"mate","label":"OH","x":62,"y":72},
                {"kind":"you","label":"YOU","x":95,"y":50}],
     "tips": ["Use Bump, Set, Hit.", "Call Mine! when the ball is yours.", "Aim for open space."]}')
  ) as v(challenge_type, level, title, content)
 where c.sport_id = 'volleyball' and c.challenge_type = v.challenge_type and c.level = v.level;

-- ---------------------------------------------------------------------
-- 2. ANSWERS (private). Positions: which tokens may stand on each spot.
-- Level 2: Zone 1 (s4) is kept for the server, so the libero goes in Zone 5 (s6) or Zone 6 (s2).
-- Zones 3 and 4 (s3, s5) are listed with no tokens, so a drop there counts as a miss
-- (a spot missing from the key would be rejected as an invalid move).
-- ---------------------------------------------------------------------

insert into public.challenge_keys (challenge_level_id, answer)
select c.id, v.answer::jsonb
  from (values
  ('positions', 1, '{"s3":["4"],"s5":["3"],"s1":["2"],"s6":["5"],"s2":["6"],"s4":["1"]}'),
  ('positions', 2, '{"s4":["SV"],"s1":["S"],"s6":["L"],"s2":["L"],"s3":[],"s5":[]}'),
  ('rules',     1, '{"player":"in"}'),
  ('rules',     2, '{"player":"7"}'),
  ('play',      1, '{"correct":0,"why":[
     "Bump to the setter: It starts Bump, Set, Hit.",
     "Hit it straight over: a first touch over the net is hard to aim and gives the other team an easy ball.",
     "Let it drop: the ball lands in your court and the other team gets the point."]}'),
  ('play',      2, '{"correct":1,"why":[
     "Serve to the best passer: they pass it easily and their team starts a strong attack.",
     "Serve to the open corner: No one is there to pass it.",
     "Serve as hard as you can: very hard serves often go into the net or out."]}')
  ) as v(challenge_type, level, answer)
  join public.challenge_levels c on c.sport_id = 'volleyball' and c.challenge_type = v.challenge_type and c.level = v.level
on conflict (challenge_level_id) do update set answer = excluded.answer;

-- ---------------------------------------------------------------------
-- 3. BADGE NAMES (were placeholders in seed.sql) -- DRAFT
-- ---------------------------------------------------------------------

update public.badges b
   set name = v.name
  from (values ('vb-zones', 'Zone Master'), ('vb-rules', 'Line Judge'), ('vb-play', 'Smart Setter')) as v(id, name)
 where b.id = v.id;

-- Check (optional):
-- select challenge_type, level, title, content->>'heading' from public.challenge_levels where sport_id = 'volleyball' order by 1, 2;
-- select count(*) from public.challenge_keys k join public.challenge_levels c on c.id = k.challenge_level_id
--  where c.sport_id = 'volleyball';   -- 6 (timing has no key)
-- select id, name from public.badges where sport_id = 'volleyball';
