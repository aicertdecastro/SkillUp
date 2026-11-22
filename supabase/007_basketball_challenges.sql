-- =====================================================================
-- SkillUp - 007 - Basketball challenges (Positions, Rules, Timing, Choose play; Level 1 + 2)
-- Run after 006_soccer_lessons.sql. Safe to run again.
--
-- How answers stay safe:
--   * challenge_levels.content (public) has what the screen shows: spots, players, scenarios.
--   * challenge_keys (private, no read policy) has the answers. The browser never sees them.
--   * Every pick goes to challenge_move(); the server says right or wrong, counts misses/tries
--     and pays the points. Timing is played in the browser, so finish_timing() can only check
--     that the numbers are possible (5 tries, 0-5 hits).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. TABLES
-- ---------------------------------------------------------------------

alter table public.challenge_levels add column if not exists content jsonb not null default '{}';

create table if not exists public.challenge_keys (
  challenge_level_id int primary key references public.challenge_levels(id) on delete cascade,
  answer             jsonb not null
);
alter table public.challenge_keys enable row level security;   -- no policy = nobody can read it
revoke all on public.challenge_keys from anon, authenticated;

-- One attempt = one go at a level. "result" holds the live state while it is open
-- (placed tokens, misses, tries) and the final report once it is finished.
alter table public.challenge_attempts
  alter column result    set default '{}',
  alter column score_pct set default 0,
  alter column passed    set default false,
  add column if not exists points_awarded int not null default 0;

do $$ begin
  if not exists (select 1 from information_schema.columns
                  where table_schema = 'public' and table_name = 'challenge_attempts' and column_name = 'finished_at') then
    alter table public.challenge_attempts add column finished_at timestamptz;
    update public.challenge_attempts set finished_at = created_at;   -- old rows were one-shot results
  end if;
end $$;

-- At most one unfinished attempt per learner and level (refresh = carry on).
create unique index if not exists challenge_attempts_one_open
  on public.challenge_attempts (user_id, challenge_level_id) where finished_at is null;

-- ---------------------------------------------------------------------
-- 2. PRIVATE HELPERS
-- ---------------------------------------------------------------------

-- Why a level can't be played yet, or null when it is open.
create or replace function public._challenge_lock(p_user uuid, p_level_id int) returns text
language plpgsql stable security definer set search_path = public as $$
declare v_lvl challenge_levels%rowtype; v_lesson lessons%rowtype;
begin
  select * into v_lvl from challenge_levels where id = p_level_id;
  if not found then return 'Unknown challenge level'; end if;
  if v_lvl.content = '{}'::jsonb then return 'This challenge is not ready yet'; end if;

  select * into v_lesson from lessons where sport_id = v_lvl.sport_id and challenge_type = v_lvl.challenge_type;
  if found and not exists (select 1 from lesson_progress
                            where user_id = p_user and lesson_id = v_lesson.id and completed_at is not null) then
    return 'Finish Lesson ' || v_lesson.lesson_no || ' first';
  end if;

  if v_lvl.level = 2 and not exists (
       select 1 from challenge_passes cp join challenge_levels cl on cl.id = cp.challenge_level_id
        where cp.user_id = p_user and cl.sport_id = v_lvl.sport_id
          and cl.challenge_type = v_lvl.challenge_type and cl.level = 1) then
    return 'Pass Level 1 first';
  end if;
  return null;
end $$;

-- Close an attempt: save the result, and on a pass give +20 (once per level) and the badge.
create or replace function public._finish_challenge(p_attempt bigint, p_score int, p_passed boolean, p_result jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_att   challenge_attempts%rowtype;
  v_lvl   challenge_levels%rowtype;
  v_pts   int := 0;
  v_badge text;
  v_tier  text;
begin
  select * into v_att from challenge_attempts where id = p_attempt;
  select * into v_lvl from challenge_levels where id = v_att.challenge_level_id;

  if p_passed then
    insert into challenge_passes (user_id, challenge_level_id, best_score_pct)
    values (v_att.user_id, v_lvl.id, p_score)
    on conflict (user_id, challenge_level_id) do update
      set best_score_pct = greatest(challenge_passes.best_score_pct, excluded.best_score_pct);
    v_pts := _award(v_att.user_id, v_lvl.points, 'Passed a challenge level', 'level:' || v_lvl.id);
    select id into v_badge from badges
     where sport_id = v_lvl.sport_id and source = 'challenge' and challenge_type = v_lvl.challenge_type;
    v_tier := _award_badge(v_att.user_id, v_badge, p_score);
  else
    insert into activity_days (user_id, day) values (v_att.user_id, manila_today()) on conflict do nothing;
  end if;

  update challenge_attempts
     set result = p_result, score_pct = p_score, passed = p_passed,
         points_awarded = v_pts, finished_at = now()
   where id = p_attempt;

  return jsonb_build_object(
    'finished', true, 'passed', p_passed, 'score_pct', p_score, 'points_awarded', v_pts,
    'badge_tier', v_tier, 'level', v_lvl.level, 'attempt_id', p_attempt);
end $$;

-- ---------------------------------------------------------------------
-- 3. CHALLENGE PAGE
-- ---------------------------------------------------------------------

-- Everything the challenge page needs. p_type / p_level null -> the server picks
-- the first open game not passed yet, and Level 2 once Level 1 is passed.
create or replace function public.get_challenge(p_sport text default null, p_type text default null, p_level int default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_user  uuid := require_user();
  v_sport text := coalesce(p_sport, 'basketball');
  v_type  text := p_type;
  v_level int  := p_level;
  v_lvl   challenge_levels%rowtype;
  v_les   lessons%rowtype;
  v_att   challenge_attempts%rowtype;
  v_pass  challenge_passes%rowtype;
begin
  if not exists (select 1 from sports where id = v_sport) then raise exception 'Unknown sport'; end if;

  if v_type is null or v_type not in ('positions','rules','timing','play') then
    select l.challenge_type into v_type
      from lessons l
      join challenge_levels c1 on c1.sport_id = l.sport_id and c1.challenge_type = l.challenge_type and c1.level = 1
     where l.sport_id = v_sport and l.challenge_type is not null
     order by _challenge_lock(v_user, c1.id) is not null,
              (select count(*) from challenge_passes cp join challenge_levels cl on cl.id = cp.challenge_level_id
                where cp.user_id = v_user and cl.sport_id = v_sport and cl.challenge_type = l.challenge_type) >= 2,
              l.lesson_no
     limit 1;
  end if;

  if v_level is null or v_level not in (1, 2) then
    v_level := case when exists (select 1 from challenge_passes cp join challenge_levels cl on cl.id = cp.challenge_level_id
                                  where cp.user_id = v_user and cl.sport_id = v_sport and cl.challenge_type = v_type and cl.level = 1)
                     and not exists (select 1 from challenge_passes cp join challenge_levels cl on cl.id = cp.challenge_level_id
                                      where cp.user_id = v_user and cl.sport_id = v_sport and cl.challenge_type = v_type and cl.level = 2)
                    then 2 else 1 end;
  end if;

  select * into v_lvl from challenge_levels where sport_id = v_sport and challenge_type = v_type and level = v_level;
  if not found then raise exception 'Unknown challenge level'; end if;
  select * into v_les from lessons where sport_id = v_sport and challenge_type = v_type;
  select * into v_pass from challenge_passes where user_id = v_user and challenge_level_id = v_lvl.id;

  -- Resume an open try (not for Choose play: its timer starts again on START)
  if v_type <> 'play' then
    select * into v_att from challenge_attempts
     where user_id = v_user and challenge_level_id = v_lvl.id and finished_at is null;
  end if;

  return jsonb_build_object(
    'sport',  (select jsonb_build_object('id', id, 'name', name) from sports where id = v_sport),
    'points', (select coalesce(sum(amount), 0) from points_ledger where user_id = v_user),
    'final_unlocked', _final_unlocked(v_user, v_sport),
    'games', (select coalesce(jsonb_agg(jsonb_build_object(
                 'type', l.challenge_type, 'lesson_no', l.lesson_no, 'lesson_title', l.title,
                 'levels', (select jsonb_agg(jsonb_build_object(
                               'id', cl.id, 'level', cl.level, 'title', cl.title, 'settings', cl.settings,
                               'lock', _challenge_lock(v_user, cl.id),
                               'passed', cp.user_id is not null, 'best_score', cp.best_score_pct) order by cl.level)
                              from challenge_levels cl
                              left join challenge_passes cp on cp.challenge_level_id = cl.id and cp.user_id = v_user
                             where cl.sport_id = v_sport and cl.challenge_type = l.challenge_type))
                 order by l.lesson_no), '[]')
                from lessons l where l.sport_id = v_sport and l.challenge_type is not null),
    'current', jsonb_build_object(
       'id', v_lvl.id, 'type', v_type, 'level', v_level, 'title', v_lvl.title,
       'settings', v_lvl.settings, 'content', v_lvl.content, 'points', v_lvl.points,
       'lock', _challenge_lock(v_user, v_lvl.id),
       'passed', v_pass.user_id is not null, 'best_score', v_pass.best_score_pct,
       'lesson_no', v_les.lesson_no, 'lesson_title', v_les.title,
       'attempt', case when v_att.id is not null
                       then jsonb_build_object('id', v_att.id, 'state', v_att.result) end)
  );
end $$;

-- Open a try (or carry on with the open one). p_restart = Reset / Try again.
-- Choose play always starts fresh, because the server times the answer from here.
create or replace function public.start_challenge(p_level_id int, p_restart boolean default false)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := require_user();
  v_lock text;
  v_lvl  challenge_levels%rowtype;
  v_att  challenge_attempts%rowtype;
begin
  v_lock := _challenge_lock(v_user, p_level_id);
  if v_lock is not null then raise exception '%', v_lock; end if;
  select * into v_lvl from challenge_levels where id = p_level_id;

  if p_restart or v_lvl.challenge_type = 'play' then
    delete from challenge_attempts
     where user_id = v_user and challenge_level_id = p_level_id and finished_at is null;
  end if;

  insert into challenge_attempts (user_id, challenge_level_id)
  values (v_user, p_level_id)
  on conflict (user_id, challenge_level_id) where finished_at is null do nothing;
  select * into v_att from challenge_attempts
   where user_id = v_user and challenge_level_id = p_level_id and finished_at is null;

  insert into activity_days (user_id, day) values (v_user, manila_today()) on conflict do nothing;
  return jsonb_build_object('attempt_id', v_att.id, 'state', v_att.result);
end $$;

-- One pick, checked here.
--   positions: {"token":"PG","spot":"s5"}  -> right/wrong; pass when every token is placed
--              score = items / (items + misses)
--   rules:     {"player":"10"}             -> right/wrong + tries; score = 100 / tries
--   play:      {"choice":1} (null = time ran out) -> right only if in time; score 100 or 0
create or replace function public.challenge_move(p_attempt bigint, p_move jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_user   uuid := require_user();
  v_att    challenge_attempts%rowtype;
  v_lvl    challenge_levels%rowtype;
  v_key    jsonb;
  v_state  jsonb;
  v_ok     boolean;
  v_fin    jsonb := '{"finished": false}';
  v_token  text;
  v_spot   text;
  v_pick   text;
  v_items  int;
  v_placed int;
  v_misses int;
  v_tries  int;
  v_choice int;
  v_secs   numeric;
  v_late   boolean;
begin
  select * into v_att from challenge_attempts where id = p_attempt and user_id = v_user for update;
  if not found then raise exception 'Challenge not found'; end if;
  if v_att.finished_at is not null then raise exception 'This try is finished'; end if;
  select * into v_lvl from challenge_levels where id = v_att.challenge_level_id;
  if v_lvl.challenge_type = 'timing' then raise exception 'Invalid move'; end if;   -- timing uses finish_timing()
  select answer into v_key from challenge_keys where challenge_level_id = v_lvl.id;
  if v_key is null then raise exception 'This challenge is not ready yet'; end if;
  v_state := v_att.result;

  case v_lvl.challenge_type
  when 'positions' then
    v_token := p_move->>'token';
    v_spot  := p_move->>'spot';
    if v_token is null or v_spot is null or not (v_key ? v_spot)
       or not exists (select 1 from jsonb_array_elements(v_lvl.content->'tokens') t where t->>'id' = v_token) then
      raise exception 'Invalid move';
    end if;
    if coalesce(v_state->'placed', '{}') ? v_spot
       or exists (select 1 from jsonb_each_text(coalesce(v_state->'placed', '{}')) e where e.value = v_token) then
      raise exception 'Already placed';
    end if;

    v_ok := (v_key->v_spot) ? v_token;
    if v_ok then
      v_state := v_state || jsonb_build_object('placed',
                   coalesce(v_state->'placed', '{}') || jsonb_build_object(v_spot, v_token));
    else
      v_state := v_state || jsonb_build_object('misses', coalesce((v_state->>'misses')::int, 0) + 1);
    end if;
    v_items  := (v_lvl.settings->>'items')::int;
    v_placed := (select count(*) from jsonb_object_keys(coalesce(v_state->'placed', '{}')));
    v_misses := coalesce((v_state->>'misses')::int, 0);

    if v_placed >= v_items then
      v_fin := _finish_challenge(p_attempt, round(100.0 * v_items / (v_items + v_misses))::int, true, v_state);
    else
      update challenge_attempts set result = v_state where id = p_attempt;
    end if;
    return v_fin || jsonb_build_object('correct', v_ok, 'placed', coalesce(v_state->'placed', '{}'),
                                       'placed_count', v_placed, 'items', v_items, 'misses', v_misses);

  when 'rules' then
    v_pick := p_move->>'player';
    if v_pick is null
       or not exists (select 1 from jsonb_array_elements(v_lvl.content->'players') p where p->>'no' = v_pick) then
      raise exception 'Invalid move';
    end if;
    v_ok    := v_pick = v_key->>'player';
    v_tries := coalesce((v_state->>'tries')::int, 0) + 1;
    v_state := v_state || jsonb_build_object('tries', v_tries,
                 'wrong', coalesce(v_state->'wrong', '[]') || case when v_ok then '[]'::jsonb else to_jsonb(v_pick) end);
    if v_ok then
      v_fin := _finish_challenge(p_attempt, round(100.0 / v_tries)::int, true, v_state);
    else
      update challenge_attempts set result = v_state where id = p_attempt;
    end if;
    return v_fin || jsonb_build_object('correct', v_ok, 'tries', v_tries, 'wrong', v_state->'wrong');

  when 'play' then
    v_choice := (p_move->>'choice')::int;
    if v_choice is not null and (v_choice < 0 or v_choice >= jsonb_array_length(v_lvl.content->'options')) then
      raise exception 'Invalid move';
    end if;
    v_secs  := round(extract(epoch from (now() - v_att.created_at))::numeric, 1);
    v_late  := v_choice is null or v_secs > (v_lvl.settings->>'seconds')::numeric + 1;   -- 1 s grace for the network
    v_ok    := not v_late and v_choice = (v_key->>'correct')::int;
    v_state := jsonb_build_object('choice', v_choice, 'seconds', v_secs, 'late', v_late);
    v_fin   := _finish_challenge(p_attempt, case when v_ok then 100 else 0 end, v_ok, v_state);
    return v_fin || jsonb_build_object('correct', v_ok, 'late', v_late, 'seconds', v_secs,
                                       'why', case when v_late then null else v_key->'why'->>v_choice end);

  else
    raise exception 'Invalid move';
  end case;
end $$;

-- Timing bar: the browser times the presses, so only the numbers are checked.
create or replace function public.finish_timing(p_attempt bigint, p_hits int, p_tries int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := require_user();
  v_att  challenge_attempts%rowtype;
  v_lvl  challenge_levels%rowtype;
begin
  select * into v_att from challenge_attempts where id = p_attempt and user_id = v_user for update;
  if not found then raise exception 'Challenge not found'; end if;
  if v_att.finished_at is not null then raise exception 'This try is finished'; end if;
  select * into v_lvl from challenge_levels where id = v_att.challenge_level_id;
  if v_lvl.challenge_type <> 'timing' then raise exception 'Invalid move'; end if;
  if p_tries is distinct from (v_lvl.settings->>'tries')::int or p_hits is null or p_hits not between 0 and p_tries then
    raise exception 'Invalid timing result';
  end if;

  return _finish_challenge(p_attempt, round(100.0 * p_hits / p_tries)::int,
                           p_hits >= (v_lvl.settings->>'hits_to_pass')::int,
                           jsonb_build_object('hits', p_hits, 'tries', p_tries));
end $$;

-- The results screen for one finished try (own tries only).
create or replace function public.get_challenge_result(p_attempt bigint)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_user  uuid := require_user();
  v_att   challenge_attempts%rowtype;
  v_lvl   challenge_levels%rowtype;
  v_badge badges%rowtype;
begin
  select * into v_att from challenge_attempts where id = p_attempt and user_id = v_user;
  if not found then raise exception 'Challenge not found'; end if;
  if v_att.finished_at is null then raise exception 'This challenge is not finished yet'; end if;
  select * into v_lvl from challenge_levels where id = v_att.challenge_level_id;
  select * into v_badge from badges
   where sport_id = v_lvl.sport_id and source = 'challenge' and challenge_type = v_lvl.challenge_type;

  return jsonb_build_object(
    'attempt_id', v_att.id,
    'sport', (select jsonb_build_object('id', id, 'name', name) from sports where id = v_lvl.sport_id),
    'type', v_lvl.challenge_type, 'level', v_lvl.level, 'title', v_lvl.title, 'settings', v_lvl.settings,
    'result', v_att.result, 'score_pct', v_att.score_pct, 'passed', v_att.passed,
    'points_awarded', v_att.points_awarded,
    'tier', case when v_att.passed then tier_for(v_att.score_pct) end,
    'best_tier', (select tier from user_badges where user_id = v_user and badge_id = v_badge.id),
    'badge_name', v_badge.name,
    'lesson', (select jsonb_build_object('lesson_no', lesson_no, 'title', title) from lessons
                where sport_id = v_lvl.sport_id and challenge_type = v_lvl.challenge_type),
    'final_unlocked', _final_unlocked(v_user, v_lvl.sport_id)
  );
end $$;

-- ---------------------------------------------------------------------
-- 4. PERMISSIONS
-- ---------------------------------------------------------------------

-- The old one-shot submit believed whatever the browser reported.
revoke execute on function public.submit_challenge(int, jsonb) from public, anon, authenticated;

revoke execute on function public._challenge_lock(uuid, int)                    from public, anon, authenticated;
revoke execute on function public._finish_challenge(bigint, int, boolean, jsonb) from public, anon, authenticated;

revoke execute on function public.get_challenge(text, text, int)    from public, anon;
revoke execute on function public.start_challenge(int, boolean)     from public, anon;
revoke execute on function public.challenge_move(bigint, jsonb)     from public, anon;
revoke execute on function public.finish_timing(bigint, int, int)   from public, anon;
revoke execute on function public.get_challenge_result(bigint)      from public, anon;
grant  execute on function public.get_challenge(text, text, int)    to authenticated;
grant  execute on function public.start_challenge(int, boolean)     to authenticated;
grant  execute on function public.challenge_move(bigint, jsonb)     to authenticated;
grant  execute on function public.finish_timing(bigint, int, int)   to authenticated;
grant  execute on function public.get_challenge_result(bigint)      to authenticated;

-- ---------------------------------------------------------------------
-- 5. BASKETBALL CONTENT (text from the Figma screens)
-- x / y are percent of the picture. Spot ids are neutral (s1..s5) so they don't give the answer away.
-- -- DRAFT: player places in the Rules pictures and the Choose play "why" lines for the
--    wrong options are not on the screens; a coach should check them.
-- ---------------------------------------------------------------------

update public.challenge_levels c
   set title = v.title, content = v.content::jsonb
  from (values
  ('positions', 1, 'Set your starting five', '{
     "heading": "Set your starting five",
     "sub": "Place your 5 players on the half court. PF and C may swap low posts. Drag a token onto a spot, or tap a token and then tap a spot.",
     "flipped": false,
     "tokens": [{"id":"PG","name":"Point Guard"},{"id":"SG","name":"Shooting Guard"},{"id":"SF","name":"Small Forward"},
                {"id":"PF","name":"Power Forward"},{"id":"C","name":"Center"}],
     "spots": [{"id":"s1","label":"Low post","x":40,"y":30},{"id":"s2","label":"Low post","x":60,"y":30},
               {"id":"s3","label":"Left wing","x":14,"y":56},{"id":"s4","label":"Right wing","x":86,"y":56},
               {"id":"s5","label":"Top of the arc","x":50,"y":80}],
     "miss": "Not there! Think about who plays closest to the basket, net, or goal."}'),
  ('positions', 2, 'Starting five: flipped court', '{
     "heading": "Starting five: flipped court",
     "sub": "Same 5 players, but the court is flipped and the spots have no labels. Drag a token onto a spot, or tap a token and then tap a spot.",
     "flipped": true,
     "tokens": [{"id":"PG","name":"Point Guard"},{"id":"SG","name":"Shooting Guard"},{"id":"SF","name":"Small Forward"},
                {"id":"PF","name":"Power Forward"},{"id":"C","name":"Center"}],
     "spots": [{"id":"s1","label":null,"x":50,"y":20},{"id":"s2","label":null,"x":14,"y":44},
               {"id":"s3","label":null,"x":60,"y":70},{"id":"s4","label":null,"x":86,"y":44},
               {"id":"s5","label":null,"x":40,"y":70}],
     "miss": "Not there! Think about who plays closest to the basket, net, or goal."}'),
  ('rules', 1, 'Which player is traveling?', '{
     "heading": "Which player is traveling?",
     "sub": "The picture is paused. Click the player who broke the rule.",
     "hoop": "right",
     "players": [{"no":"4","team":"white","x":28,"y":64},{"no":"3","team":"blue","x":50,"y":22},
                 {"no":"10","team":"blue","x":70,"y":52,"ball":true},{"no":"8","team":"white","x":84,"y":24}],
     "footprints": [[34,46],[42,50],[50,46],[58,51],[64,48]],
     "hint": "Count the footprints. Who walked with the ball?",
     "success_title": "Traveling!",
     "success": "Traveling: more than 2 steps holding the ball without dribbling."}'),
  ('rules', 2, 'Which player made a foul?', '{
     "heading": "Which player made a foul?",
     "sub": "Blue #11 is going up for a shot. Click the player who broke the rule.",
     "hoop": "right",
     "players": [{"no":"3","team":"blue","x":40,"y":22},{"no":"2","team":"white","x":34,"y":66},
                 {"no":"6","team":"white","x":74,"y":54,"touch":"11"},{"no":"5","team":"blue","x":56,"y":76},
                 {"no":"11","team":"blue","x":82,"y":42,"ball":true}],
     "hint": "Look for someone touching another player.",
     "success_title": "Foul!",
     "success": "A foul is pushing, holding, or hitting another player."}'),
  ('timing', 1, 'Timing bar: free throw', '{
     "heading": "Timing bar: free throw",
     "sub": "Watch the player''s arm rising into a shot. Press SHOOT! when the marker is in the green zone.",
     "button": "SHOOT!",
     "tips": {"early": "Too early! Bend your knees and get balanced first.",
              "late": "Too late! Let go at the top of your shot.",
              "hit": "Swish! Great follow through."}}'),
  ('timing', 2, 'Timing bar: free throw', '{
     "heading": "Timing bar: free throw",
     "sub": "Watch the player''s arm rising into a shot. Press SHOOT! when the marker is in the green zone.",
     "button": "SHOOT!",
     "tips": {"early": "Too early! Bend your knees and get balanced first.",
              "late": "Too late! Let go at the top of your shot.",
              "hit": "Swish! Great follow through."}}'),
  ('play', 1, 'Choose your play: open teammate', '{
     "heading": "Choose your play!",
     "scenario": "You''re dribbling. A defender is in front of you, and your teammate is open under the basket.",
     "options": ["Shoot over the defender", "Pass to your teammate", "Keep dribbling"],
     "hoop": "right",
     "pieces": [{"kind":"mate","label":"PG","x":30,"y":24},{"kind":"you","label":"YOU","x":46,"y":54},
                {"kind":"opp","label":"D","x":58,"y":52},{"kind":"mate","label":"SF","x":84,"y":66,"open":true}],
     "tips": ["Pass to a teammate who is open.", "Shoot when you''re close and no one is guarding you.", "After you pass, keep moving."]}'),
  ('play', 2, 'Choose your play: open under the basket', '{
     "heading": "Choose your play!",
     "scenario": "You just got the ball close to the basket, and no one is guarding you.",
     "options": ["Pass back out", "Dribble away", "Shoot"],
     "hoop": "right",
     "pieces": [{"kind":"mate","label":"PG","x":24,"y":22},{"kind":"opp","label":"D","x":38,"y":30},
                {"kind":"you","label":"YOU","x":82,"y":54},{"kind":"mate","label":"SG","x":34,"y":76},
                {"kind":"opp","label":"D","x":46,"y":70}],
     "tips": ["Pass to a teammate who is open.", "Shoot when you''re close and no one is guarding you.", "After you pass, keep moving."]}')
  ) as v(challenge_type, level, title, content)
 where c.sport_id = 'basketball' and c.challenge_type = v.challenge_type and c.level = v.level;

-- Answers (private). Positions: which tokens may stand on each spot.
insert into public.challenge_keys (challenge_level_id, answer)
select c.id, v.answer::jsonb
  from (values
  ('positions', 1, '{"s1":["PF","C"],"s2":["PF","C"],"s3":["SG","SF"],"s4":["SG","SF"],"s5":["PG"]}'),
  ('positions', 2, '{"s1":["PG"],"s2":["SG","SF"],"s3":["PF","C"],"s4":["SG","SF"],"s5":["PF","C"]}'),
  ('rules',     1, '{"player":"10"}'),
  ('rules',     2, '{"player":"6"}'),
  ('play',      1, '{"correct":1,"why":[
     "Shoot over the defender: the defender is right in front of you, so the shot will likely be blocked.",
     "Pass to your teammate: They''re open for an easy shot.",
     "Keep dribbling: the defender stays in front of you and your open teammate gets covered."]}'),
  ('play',      2, '{"correct":2,"why":[
     "Pass back out: you are open and close, so this is the moment to shoot.",
     "Dribble away: moving away from the basket makes the shot harder.",
     "Shoot: You''re open and close."]}')
  ) as v(challenge_type, level, answer)
  join public.challenge_levels c on c.sport_id = 'basketball' and c.challenge_type = v.challenge_type and c.level = v.level
on conflict (challenge_level_id) do update set answer = excluded.answer;

-- Check (optional):
-- select challenge_type, level, title, content->>'heading' from public.challenge_levels where sport_id = 'basketball' order by 1, 2;
-- select count(*) from public.challenge_keys;   -- 6 (timing has no key)
