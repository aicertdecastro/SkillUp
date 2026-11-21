-- =====================================================================
-- SkillUp - 003 - lesson cards + sport final questions
-- Run after 003_learn_quiz.sql. Run the WHOLE file with nothing highlighted
-- in the SQL Editor (Supabase runs only the highlighted text if there is any).
-- Safe to run again: rows that already exist are skipped.
-- Basketball Lesson 4 cards are copied from the Figma screen.
-- Everything marked DRAFT was written to fill the gaps: coach/team to review.
-- Card count per lesson must match lessons.card_count (4, 4, 4, 3, 4).
-- Icons: ball, team, hoop, court, timer, whistle, hand, pass, target, brain, star, goal
-- =====================================================================

insert into public.lesson_cards (lesson_id, card_no, label, heading, body, icon)
select l.id, c.card_no, c.label, c.heading, c.body, c.icon
  from (values
  -- ---------------- BASKETBALL ----------------
  -- Lesson 1 - Meet basketball (DRAFT)
  ('basketball',1,1,'Teams',      'Two teams of 5:',        'each team has 5 players on the court. Players can swap in and out during the game.', 'team'),
  ('basketball',1,2,'Scoring',    'Scoring:',               'a basket from inside the arc is 2 points, from behind the 3-point line is 3 points, and a free throw is 1 point.', 'hoop'),
  ('basketball',1,3,'The court',  'The court:',             'a hoop at each end, a center circle, a free-throw line and a 3-point arc.', 'court'),
  ('basketball',1,4,'Game time',  'Game time:',             'a game is split into quarters. The team with more points when time runs out wins.', 'timer'),
  -- Lesson 2 - Positions (DRAFT)
  ('basketball',2,1,'Point guard','Point guard (1):',       'the team leader. Brings the ball up the court and calls the plays.', 'team'),
  ('basketball',2,2,'Wings',      'Shooting guard and small forward (2 and 3):', 'move around the arc, shoot from outside and drive to the basket.', 'target'),
  ('basketball',2,3,'Bigs',       'Power forward and center (4 and 5):', 'usually the tallest players. They play near the basket, rebound and block shots.', 'hoop'),
  ('basketball',2,4,'Spacing',    'Spread out:',            'keep space between teammates so one defender can''t guard two of you at once.', 'court'),
  -- Lesson 3 - Basic rules (DRAFT)
  ('basketball',3,1,'Traveling',  'Traveling:',             'taking more than two steps while holding the ball without dribbling. The other team gets the ball.', 'whistle'),
  ('basketball',3,2,'Double dribble','Double dribble:',     'dribbling with both hands at once, or stopping your dribble and then dribbling again.', 'hand'),
  ('basketball',3,3,'Fouls',      'Fouls:',                 'pushing, holding or hitting a player is a foul. Some fouls give the other team free throws.', 'whistle'),
  ('basketball',3,4,'Out of bounds','Out of bounds:',       'if the ball, or the player holding it, touches the line or beyond, the other team gets the ball.', 'court'),
  -- Lesson 4 - Basic skills (from the Figma screen)
  ('basketball',4,1,'Dribble',    'Dribble:',               'push the ball down with your fingertips, not your palm. Keep it at waist height and your eyes up.', 'hand'),
  ('basketball',4,2,'Chest pass', 'Chest pass:',            'hold the ball at your chest. Step toward your teammate and push your arms out, ending with thumbs pointing down.', 'pass'),
  ('basketball',4,3,'B.E.E.F.',   'Shooting with B.E.E.F.:','Balance (feet shoulder-width apart), Eyes on the hoop, Elbow under the ball, Follow-through (snap your wrist and hold it, like reaching into a cookie jar).', 'target'),
  -- Lesson 5 - Game smarts (DRAFT)
  ('basketball',5,1,'Open player','Find the open player:',  'before you shoot or dribble, look up. A teammate with no defender close is the best pass.', 'brain'),
  ('basketball',5,2,'Move',       'Move without the ball:', 'cut to the basket or to open space so a teammate can pass to you.', 'team'),
  ('basketball',5,3,'Defense',    'Stay between:',          'on defense, keep yourself between your player and the basket.', 'court'),
  ('basketball',5,4,'Talk',       'Talk to your team:',     'call for the ball, warn about screens and cheer each other on.', 'star'),

  -- ---------------- VOLLEYBALL (DRAFT) ----------------
  ('volleyball',1,1,'Teams',      'Two teams of 6:',        'each team keeps the ball off the floor on its side of the net.', 'team'),
  ('volleyball',1,2,'3 touches',  'Up to 3 touches:',       'your team can touch the ball up to 3 times before sending it over the net.', 'hand'),
  ('volleyball',1,3,'Scoring',    'Every rally scores:',    'the team that wins the rally gets a point. A set goes to 25, and you must win by 2.', 'star'),
  ('volleyball',1,4,'Rotation',   'Rotate:',                'when your team wins the serve back, every player moves one spot clockwise.', 'court'),
  ('volleyball',2,1,'Zones',      'Six zones:',             'the court is numbered 1 to 6. Zone 1 is back right, where the server stands.', 'court'),
  ('volleyball',2,2,'Setter',     'Setter:',                'usually takes the second touch and sets the ball up for a hitter.', 'hand'),
  ('volleyball',2,3,'Hitters',    'Hitters:',               'outside, middle and opposite hitters attack the ball over the net.', 'target'),
  ('volleyball',2,4,'Libero',     'Libero:',                'a back-row defender in a different-colored shirt. Great at passing, can''t attack above the net.', 'team'),
  ('volleyball',3,1,'In or out',  'In or out:',             'a ball that lands on the line is IN.', 'court'),
  ('volleyball',3,2,'Net touch',  'Net touch:',             'touching the net while playing the ball is a fault.', 'whistle'),
  ('volleyball',3,3,'Four hits',  'Too many touches:',      'a fourth touch by your team is a fault.', 'hand'),
  ('volleyball',3,4,'Double hit', 'Double contact:',        'one player can''t touch the ball twice in a row (a block doesn''t count).', 'whistle'),
  ('volleyball',4,1,'Bump',       'Bump:',                  'make a flat platform with your forearms, bend your knees, and push up with your legs, not your arms.', 'hand'),
  ('volleyball',4,2,'Set',        'Set:',                   'make a triangle window with your hands above your forehead and push the ball up with your fingertips.', 'pass'),
  ('volleyball',4,3,'Serve',      'Underhand serve:',       'hold the ball low in front, step forward and swing to hit it with the heel of your hand.', 'target'),
  ('volleyball',5,1,'Bump-set-hit','Bump, set, hit:',       'use all 3 touches. A good first pass makes a good set and a strong hit.', 'team'),
  ('volleyball',5,2,'Call it',    'Call the ball:',         'shout "Mine!" so two players don''t crash into each other.', 'star'),
  ('volleyball',5,3,'Ready',      'Ready position:',        'knees bent, weight on your toes, arms out in front, eyes on the ball.', 'brain'),
  ('volleyball',5,4,'Find space', 'Aim for space:',         'send the ball where no one is standing.', 'target'),

  -- ---------------- SOCCER (DRAFT) ----------------
  ('soccer',1,1,'Teams',          'Two teams of 11:',       'each team has 10 field players and 1 goalkeeper.', 'team'),
  ('soccer',1,2,'Scoring',        'Scoring:',               'it''s a goal when the WHOLE ball crosses the goal line between the posts.', 'goal'),
  ('soccer',1,3,'No hands',       'No hands:',              'only the goalkeeper can use their hands, and only inside their own box.', 'hand'),
  ('soccer',1,4,'Game time',      'Game time:',             'two halves of 45 minutes. The team with more goals wins.', 'timer'),
  ('soccer',2,1,'Goalkeeper',     'Goalkeeper:',            'guards the goal and is the last line of defense.', 'goal'),
  ('soccer',2,2,'Defenders',      'Defenders:',             'play in front of the keeper and stop attackers.', 'court'),
  ('soccer',2,3,'Midfielders',    'Midfielders:',           'link defense and attack. They run the most!', 'pass'),
  ('soccer',2,4,'Forwards',       'Forwards:',              'play closest to the other goal. Their main job is to score.', 'target'),
  ('soccer',3,1,'Handball',       'Handball:',              'touching the ball with your hand or arm on purpose is a foul.', 'whistle'),
  ('soccer',3,2,'Throw-in',       'Throw-in:',              'ball over the sideline? Throw it back in with both hands over your head, both feet on the ground.', 'hand'),
  ('soccer',3,3,'Goal line',      'Over the goal line:',    'last touched by an attacker -> goal kick. Last touched by a defender -> corner kick.', 'court'),
  ('soccer',3,4,'Offside',        'Offside:',               'when the ball is passed to you, you can''t be closer to the goal than both the ball and the second-last defender.', 'whistle'),
  ('soccer',4,1,'Pass',           'Pass:',                  'use the inside of your foot. Put your other foot beside the ball and point it at your target.', 'pass'),
  ('soccer',4,2,'Dribble',        'Dribble:',               'use small touches with the inside and outside of your foot. Keep the ball close and look up.', 'ball'),
  ('soccer',4,3,'Shoot',          'Shoot:',                 'strike with your laces, keep your head over the ball, and aim for the corners.', 'target'),
  ('soccer',5,1,'Scan',           'Look around:',           'check where teammates and defenders are BEFORE the ball comes to you.', 'brain'),
  ('soccer',5,2,'Pass and move',  'Pass and move:',         'after you pass, move into open space to get the ball back.', 'pass'),
  ('soccer',5,3,'Width',          'Spread out:',            'use the whole field so defenders have to run more.', 'court'),
  ('soccer',5,4,'Talk',           'Talk:',                  'call "Man on!" to warn a teammate and ask for the ball.', 'star')
  ) as c(sport_id, lesson_no, card_no, label, heading, body, icon)
  join public.lessons l on l.sport_id = c.sport_id and l.lesson_no = c.lesson_no
on conflict (lesson_id, card_no) do nothing;

-- Sport finals for basketball and soccer (DRAFT - 2 questions per lesson).
-- correct_index starts at 0 (first option).
insert into public.quiz_questions (sport_id, from_lesson_no, question_no, prompt, options, correct_index) values
  ('basketball',1, 1,'How many players does each team have on the court?','["5","6","11"]',0),
  ('basketball',1, 2,'How many points is a basket from behind the 3-point line?','["1","2","3"]',2),
  ('basketball',2, 3,'Which player usually brings the ball up and calls the plays?','["Center","Point guard","Power forward"]',1),
  ('basketball',2, 4,'Where does the center usually play?','["Near the basket","Behind the 3-point line","At half court"]',0),
  ('basketball',3, 5,'Taking 3 steps holding the ball without dribbling is...','["A foul","Traveling","Allowed"]',1),
  ('basketball',3, 6,'You stop dribbling, then start dribbling again. That is...','["Double dribble","A jump ball","Fine"]',0),
  ('basketball',4, 7,'When you dribble, push the ball with your...','["Palm","Fingertips","Fist"]',1),
  ('basketball',4, 8,'In B.E.E.F., what does the second E stand for?','["Energy","Elbow","Eyes"]',1),
  ('basketball',5, 9,'Who is usually the best player to pass to?','["The tallest player","The open teammate","Whoever shouts loudest"]',1),
  ('basketball',5,10,'On defense, stay between your player and...','["The basket","The sideline","The bench"]',0),
  ('soccer',1, 1,'How many players does each team have on the field?','["5","6","11"]',2),
  ('soccer',1, 2,'When is it a goal?','["The ball hits the post","The whole ball crosses the goal line","Half the ball crosses the line"]',1),
  ('soccer',2, 3,'Which player can use their hands in their own box?','["Defender","Goalkeeper","Forward"]',1),
  ('soccer',2, 4,'Whose main job is to score goals?','["Forwards","Defenders","Goalkeeper"]',0),
  ('soccer',3, 5,'The ball goes over the sideline. How does play restart?','["Corner kick","Throw-in","Free kick"]',1),
  ('soccer',3, 6,'A field player touches the ball with their hand on purpose. That is...','["Handball","Offside","Allowed"]',0),
  ('soccer',4, 7,'For a short, accurate pass, use the...','["Toe","Inside of your foot","Heel"]',1),
  ('soccer',4, 8,'When you shoot, keep your head...','["Over the ball","Leaning back","Turned away"]',0),
  ('soccer',5, 9,'What should you do right after you pass?','["Stand still","Move into open space","Ask for a sub"]',1),
  ('soccer',5,10,'Why look around before the ball comes to you?','["To know your next move","To find the referee","It wastes time"]',0)
on conflict (sport_id, question_no) do nothing;
