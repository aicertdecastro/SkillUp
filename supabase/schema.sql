-- =====================================================================
-- SkillUp · Supabase database (DATA LAYER + trusted BUSINESS RULES)
-- DRAFT FOR REVIEW — do not run in Supabase until the team approves.
-- Run order in Supabase SQL Editor: schema.sql, then seed.sql
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. CONTENT TABLES (same for every user, read-only from the website)
-- ---------------------------------------------------------------------

create table public.sports (
  id            text primary key,              -- 'basketball', 'volleyball', 'soccer'
  name          text not null,
  accent_color  text not null,                 -- '#E8792B'
  sort_order    int  not null default 0
);

create table public.lessons (
  id              serial primary key,
  sport_id        text not null references public.sports(id),
  lesson_no       int  not null check (lesson_no between 1 and 5),
  title           text not null,               -- 'Basic skills'
  goal            text not null,
  card_count      int  not null,               -- key-point cards to tick (3 or 4)
  challenge_type  text check (challenge_type in ('positions','rules','timing','play')),
  video_url       text,                        -- link to the lesson video
  unique (sport_id, lesson_no)
);

-- One row per challenge level: 3 sports x 4 challenges x 2 levels = 24 rows.
-- The pass rule lives HERE (not in the browser) so the server can check it.
create table public.challenge_levels (
  id              serial primary key,
  sport_id        text not null references public.sports(id),
  challenge_type  text not null check (challenge_type in ('positions','rules','timing','play')),
  level           int  not null check (level in (1,2)),
  title           text not null,               -- 'Timing bar: free throw'
  settings        jsonb not null default '{}', -- {"tries":5,"hits_to_pass":3,"sweep_s":2.0,"zone_pct":25}
  points          int  not null default 20,
  unique (sport_id, challenge_type, level)
);

-- Final quiz questions. The correct answer is NEVER sent to the browser:
-- no select policy is created for this table; the site reads it via get_quiz().
create table public.quiz_questions (
  id             serial primary key,
  sport_id       text not null references public.sports(id),
  from_lesson_no int  not null,
  question_no    int  not null,
  prompt         text not null,
  options        jsonb not null,               -- ["5","6","11"]
  correct_index  int  not null,
  unique (sport_id, question_no)
);

-- Badge catalog. A badge is earned from either a challenge (any level)
-- or a sport final quiz; the tier comes from the best score.
create table public.badges (
  id              text primary key,            -- 'free-throw-pro'
  name            text not null,               -- 'Free Throw Pro'
  sport_id        text not null references public.sports(id),
  source          text not null check (source in ('challenge','quiz')),
  challenge_type  text check (challenge_type in ('positions','rules','timing','play'))
);

-- ---------------------------------------------------------------------
-- 2. USER TABLES (one learner's own data)
-- ---------------------------------------------------------------------

create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  username      text unique not null check (username ~ '^[a-z0-9_]{3,20}$'),
  display_name  text not null,
  created_at    timestamptz not null default now()
);

create table public.lesson_progress (
  user_id       uuid not null references public.profiles(id) on delete cascade,
  lesson_id     int  not null references public.lessons(id),
  step          text not null default 'learn' check (step in ('learn','try','check','play')),
  cards_read    int  not null default 0,
  completed_at  timestamptz,
  updated_at    timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

-- Every try is kept (for the results screen and "Tries so far").
create table public.challenge_attempts (
  id                  bigserial primary key,
  user_id             uuid not null references public.profiles(id) on delete cascade,
  challenge_level_id  int  not null references public.challenge_levels(id),
  result              jsonb not null,          -- what the game reported
  score_pct           int  not null,
  passed              boolean not null,
  created_at          timestamptz not null default now()
);

-- First pass of each level. The primary key makes "no points for replays" automatic.
create table public.challenge_passes (
  user_id             uuid not null references public.profiles(id) on delete cascade,
  challenge_level_id  int  not null references public.challenge_levels(id),
  best_score_pct      int  not null,
  first_passed_at     timestamptz not null default now(),
  primary key (user_id, challenge_level_id)
);

create table public.quiz_attempts (
  id             bigserial primary key,
  user_id        uuid not null references public.profiles(id) on delete cascade,
  sport_id       text not null references public.sports(id),
  answers        jsonb not null,
  correct_count  int  not null,
  total          int  not null,
  score_pct      int  not null,
  badge_tier     text check (badge_tier in ('bronze','silver','gold')),
  created_at     timestamptz not null default now()
);

create table public.user_badges (
  user_id     uuid not null references public.profiles(id) on delete cascade,
  badge_id    text not null references public.badges(id),
  tier        text not null check (tier in ('bronze','silver','gold')),
  best_score  int  not null,
  awarded_at  timestamptz not null default now(),
  primary key (user_id, badge_id)
);

-- Every point ever given is one row. Total points = sum(amount).
-- source_key is unique per user, so the same reward can never be paid twice.
create table public.points_ledger (
  id          bigserial primary key,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  amount      int  not null,
  reason      text not null,                   -- 'Finished a lesson'
  source_key  text not null,                   -- 'lesson:12', 'level:7', 'quiz:basketball:q3'
  created_at  timestamptz not null default now(),
  unique (user_id, source_key)
);

-- One row per day the learner did something. Drives the streak and the M–S row.
create table public.activity_days (
  user_id  uuid not null references public.profiles(id) on delete cascade,
  day      date not null,                      -- Philippine date (Asia/Manila)
  primary key (user_id, day)
);

-- ---------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY
-- The website uses the public "anon" key, so these rules ARE the security.
-- Users can READ their own rows. They can never write points, passes or
-- badges directly; only the functions in section 5 can.
-- ---------------------------------------------------------------------

alter table public.sports             enable row level security;
alter table public.lessons            enable row level security;
alter table public.challenge_levels   enable row level security;
alter table public.quiz_questions     enable row level security;  -- no policy = hidden
alter table public.badges             enable row level security;
alter table public.profiles           enable row level security;
alter table public.lesson_progress    enable row level security;
alter table public.challenge_attempts enable row level security;
alter table public.challenge_passes   enable row level security;
alter table public.quiz_attempts      enable row level security;
alter table public.user_badges        enable row level security;
alter table public.points_ledger      enable row level security;
alter table public.activity_days      enable row level security;

create policy "content is public" on public.sports           for select using (true);
create policy "content is public" on public.lessons          for select using (true);
create policy "content is public" on public.challenge_levels for select using (true);
create policy "content is public" on public.badges           for select using (true);

create policy "read own profile"   on public.profiles for select using (auth.uid() = id);
create policy "update own profile" on public.profiles for update using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "read own" on public.lesson_progress    for select using (auth.uid() = user_id);
create policy "read own" on public.challenge_attempts for select using (auth.uid() = user_id);
create policy "read own" on public.challenge_passes   for select using (auth.uid() = user_id);
create policy "read own" on public.quiz_attempts      for select using (auth.uid() = user_id);
create policy "read own" on public.user_badges        for select using (auth.uid() = user_id);
create policy "read own" on public.points_ledger      for select using (auth.uid() = user_id);
create policy "read own" on public.activity_days      for select using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- 4. PROFILE CREATED AUTOMATICALLY ON SIGN UP
-- The sign-up form sends username + display_name as user metadata.
-- ---------------------------------------------------------------------

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, display_name)
  values (new.id,
          lower(new.raw_user_meta_data->>'username'),
          coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'username'));
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- 5. BUSINESS RULES (called from the website with supabase.rpc(...))
-- security definer = runs with database rights, but always uses auth.uid(),
-- so a learner can only ever affect their own account.
-- ---------------------------------------------------------------------

-- helpers -------------------------------------------------------------

create function public.manila_today() returns date
language sql stable as $$ select (now() at time zone 'Asia/Manila')::date $$;

create function public.tier_for(p_score int) returns text
language sql immutable as $$
  select case when p_score >= 100 then 'gold'
              when p_score >= 85  then 'silver'
              when p_score >= 70  then 'bronze'
              else null end $$;

create function public.tier_rank(p_tier text) returns int
language sql immutable as $$
  select case p_tier when 'gold' then 3 when 'silver' then 2 when 'bronze' then 1 else 0 end $$;

create function public.require_user() returns uuid
language plpgsql stable as $$
begin
  if auth.uid() is null then raise exception 'Not logged in'; end if;
  return auth.uid();
end $$;

-- private: give points once per source_key; returns points actually given
create function public._award(p_user uuid, p_amount int, p_reason text, p_key text) returns int
language plpgsql security definer set search_path = public as $$
declare v_rows int;
begin
  insert into points_ledger (user_id, amount, reason, source_key)
  values (p_user, p_amount, p_reason, p_key)
  on conflict (user_id, source_key) do nothing;
  get diagnostics v_rows = row_count;
  insert into activity_days (user_id, day) values (p_user, manila_today())
  on conflict do nothing;
  return case when v_rows > 0 then p_amount else 0 end;
end $$;

-- private: give or upgrade a badge; returns the tier now held (or null)
create function public._award_badge(p_user uuid, p_badge text, p_score int) returns text
language plpgsql security definer set search_path = public as $$
declare v_tier text := tier_for(p_score);
begin
  if p_badge is null or v_tier is null then return null; end if;
  insert into user_badges (user_id, badge_id, tier, best_score)
  values (p_user, p_badge, v_tier, p_score)
  on conflict (user_id, badge_id) do update
    set tier = excluded.tier, best_score = excluded.best_score, awarded_at = now()
    where excluded.best_score > user_badges.best_score;
  return (select tier from user_badges where user_id = p_user and badge_id = p_badge);
end $$;

-- lessons -------------------------------------------------------------

-- Save where the learner is (Learn / Try it / Quick check / Play, cards ticked).
create function public.save_lesson_step(p_lesson_id int, p_step text, p_cards_read int)
returns void language plpgsql security definer set search_path = public as $$
declare v_user uuid := require_user();
begin
  insert into lesson_progress (user_id, lesson_id, step, cards_read)
  values (v_user, p_lesson_id, p_step, greatest(p_cards_read, 0))
  on conflict (user_id, lesson_id) do update
    set step = excluded.step,
        cards_read = greatest(lesson_progress.cards_read, excluded.cards_read),
        updated_at = now();
  insert into activity_days (user_id, day) values (v_user, manila_today()) on conflict do nothing;
end $$;

-- Finish a lesson: +10 the first time only.
create function public.complete_lesson(p_lesson_id int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_user uuid := require_user(); v_pts int;
begin
  insert into lesson_progress (user_id, lesson_id, step, completed_at)
  values (v_user, p_lesson_id, 'play', now())
  on conflict (user_id, lesson_id) do update
    set completed_at = coalesce(lesson_progress.completed_at, now()), updated_at = now();
  v_pts := _award(v_user, 10, 'Finished a lesson', 'lesson:' || p_lesson_id);
  return jsonb_build_object('points_awarded', v_pts);
end $$;

-- challenges ----------------------------------------------------------
-- What each game sends in p_result:
--   positions: {"placed":5,"misses":1}   score = placed / (placed + misses)
--   rules:     {"tries":2}               score = 1 / tries (first try = 100%)
--   timing:    {"hits":4,"tries":5}      score = hits / tries
--   play:      {"correct":true}          score = 100 or 0
create function public.submit_challenge(p_level_id int, p_result jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_user   uuid := require_user();
  v_lvl    challenge_levels%rowtype;
  v_score  int;
  v_passed boolean;
  v_first  boolean := false;
  v_pts    int := 0;
  v_badge  text;
  v_tier   text;
  v_need   int;
  v_items  int;
begin
  select * into v_lvl from challenge_levels where id = p_level_id;
  if not found then raise exception 'Unknown challenge level'; end if;

  -- Level 2 opens only after Level 1 is passed
  if v_lvl.level = 2 and not exists (
       select 1 from challenge_passes cp join challenge_levels cl on cl.id = cp.challenge_level_id
       where cp.user_id = v_user and cl.sport_id = v_lvl.sport_id
         and cl.challenge_type = v_lvl.challenge_type and cl.level = 1) then
    raise exception 'Pass Level 1 first';
  end if;

  -- Check the result against this level's rules
  case v_lvl.challenge_type
    when 'timing' then
      if (p_result->>'tries')::int <> (v_lvl.settings->>'tries')::int
         or (p_result->>'hits')::int not between 0 and (p_result->>'tries')::int then
        raise exception 'Invalid timing result';
      end if;
      v_need   := (v_lvl.settings->>'hits_to_pass')::int;
      v_score  := round(100.0 * (p_result->>'hits')::int / (p_result->>'tries')::int);
      v_passed := (p_result->>'hits')::int >= v_need;
    when 'positions' then
      v_items := (v_lvl.settings->>'items')::int;
      if (p_result->>'placed')::int <> v_items or (p_result->>'misses')::int < 0 then
        raise exception 'Invalid positions result';
      end if;
      v_score  := round(100.0 * v_items / (v_items + (p_result->>'misses')::int));
      v_passed := true;
    when 'rules' then
      if (p_result->>'tries')::int < 1 then raise exception 'Invalid rules result'; end if;
      v_score  := round(100.0 / (p_result->>'tries')::int);
      v_passed := true;
    when 'play' then
      v_score  := case when (p_result->>'correct')::boolean then 100 else 0 end;
      v_passed := (p_result->>'correct')::boolean;
  end case;

  insert into challenge_attempts (user_id, challenge_level_id, result, score_pct, passed)
  values (v_user, p_level_id, p_result, v_score, v_passed);

  if v_passed then
    insert into challenge_passes (user_id, challenge_level_id, best_score_pct)
    values (v_user, p_level_id, v_score)
    on conflict (user_id, challenge_level_id) do update
      set best_score_pct = greatest(challenge_passes.best_score_pct, excluded.best_score_pct);
    v_pts := _award(v_user, v_lvl.points, 'Passed a challenge level', 'level:' || p_level_id);
    v_first := v_pts > 0;

    select id into v_badge from badges
     where sport_id = v_lvl.sport_id and source = 'challenge'
       and challenge_type = v_lvl.challenge_type;
    v_tier := _award_badge(v_user, v_badge, v_score);
  else
    insert into activity_days (user_id, day) values (v_user, manila_today()) on conflict do nothing;
  end if;

  return jsonb_build_object(
    'passed', v_passed, 'score_pct', v_score, 'first_pass', v_first,
    'points_awarded', v_pts, 'badge_id', v_badge, 'badge_tier', v_tier,
    'next_level_unlocked', v_passed and v_lvl.level = 1);
end $$;

-- final quiz ----------------------------------------------------------

-- Questions without the answers.
create function public.get_quiz(p_sport text)
returns table (question_id int, question_no int, from_lesson_no int, prompt text, options jsonb)
language sql stable security definer set search_path = public as $$
  select id, question_no, from_lesson_no, prompt, options
  from quiz_questions where sport_id = p_sport order by question_no $$;

-- p_answers: {"<question_id>": <chosen index>, ...}
-- +5 for each correct answer, but only the first time that question is answered correctly.
create function public.submit_quiz(p_sport text, p_answers jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := require_user();
  v_total int; v_correct int := 0; v_pts int := 0;
  v_score int; v_tier text; v_badge text;
  q record; v_review jsonb := '[]';
begin
  select count(*) into v_total from quiz_questions where sport_id = p_sport;
  if v_total = 0 then raise exception 'No quiz for this sport'; end if;

  for q in select * from quiz_questions where sport_id = p_sport order by question_no loop
    if (p_answers->>q.id::text)::int = q.correct_index then
      v_correct := v_correct + 1;
      v_pts := v_pts + _award(v_user, 5, 'Correct quiz answer', 'quiz:' || q.id);
    else
      -- wrong answer: show the right one and which lesson to review
      v_review := v_review || jsonb_build_object(
        'question_id', q.id, 'correct_index', q.correct_index, 'review_lesson_no', q.from_lesson_no);
    end if;
  end loop;

  v_score := round(100.0 * v_correct / v_total);
  v_tier  := tier_for(v_score);
  select id into v_badge from badges where sport_id = p_sport and source = 'quiz';
  if v_tier is not null then v_tier := _award_badge(v_user, v_badge, v_score); end if;

  insert into quiz_attempts (user_id, sport_id, answers, correct_count, total, score_pct, badge_tier)
  values (v_user, p_sport, p_answers, v_correct, v_total, v_score, tier_for(v_score));
  insert into activity_days (user_id, day) values (v_user, manila_today()) on conflict do nothing;

  return jsonb_build_object(
    'correct', v_correct, 'total', v_total, 'score_pct', v_score,
    'passed', v_score >= 70, 'points_awarded', v_pts,
    'badge_id', v_badge, 'badge_tier', v_tier, 'review', v_review);
end $$;

-- dashboard -----------------------------------------------------------

-- Consecutive active days ending today (or yesterday, so the streak
-- doesn't drop to 0 in the morning before the learner has played).
create function public.current_streak(p_user uuid) returns int
language plpgsql stable security definer set search_path = public as $$
declare v_day date := manila_today(); v_n int := 0;
begin
  if not exists (select 1 from activity_days where user_id = p_user and day = v_day) then
    v_day := v_day - 1;
  end if;
  while exists (select 1 from activity_days where user_id = p_user and day = v_day) loop
    v_n := v_n + 1; v_day := v_day - 1;
  end loop;
  return v_n;
end $$;

-- Everything the dashboard needs in one call.
create function public.get_dashboard()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_user uuid := require_user(); v_week_start date;
begin
  v_week_start := manila_today() - (extract(isodow from manila_today())::int - 1);  -- Monday
  return jsonb_build_object(
    'profile', (select to_jsonb(p) from profiles p where id = v_user),
    'points',  (select coalesce(sum(amount), 0) from points_ledger where user_id = v_user),
    'streak',  current_streak(v_user),
    'week',    (select coalesce(jsonb_agg(day order by day), '[]') from activity_days
                 where user_id = v_user and day >= v_week_start),
    'lessons_done', (select count(*) from lesson_progress
                      where user_id = v_user and completed_at is not null),
    'badges',  (select coalesce(jsonb_agg(jsonb_build_object(
                   'id', b.id, 'name', b.name, 'tier', ub.tier, 'best_score', ub.best_score)), '[]')
                 from user_badges ub join badges b on b.id = ub.badge_id where ub.user_id = v_user),
    'sports',  (select jsonb_agg(jsonb_build_object(
                   'id', s.id, 'name', s.name, 'accent_color', s.accent_color,
                   'lessons_done', (select count(*) from lesson_progress lp join lessons l on l.id = lp.lesson_id
                                     where lp.user_id = v_user and l.sport_id = s.id and lp.completed_at is not null),
                   'levels_passed', (select count(*) from challenge_passes cp join challenge_levels cl on cl.id = cp.challenge_level_id
                                     where cp.user_id = v_user and cl.sport_id = s.id)) order by s.sort_order)
                 from sports s),
    'continue', (select jsonb_build_object('sport_id', l.sport_id, 'lesson_no', l.lesson_no,
                                           'title', l.title, 'step', lp.step)
                 from lesson_progress lp join lessons l on l.id = lp.lesson_id
                 where lp.user_id = v_user and lp.completed_at is null
                 order by lp.updated_at desc limit 1)
  );
end $$;

-- Only logged-in users may call the business functions; helpers stay private.
revoke execute on function public._award(uuid,int,text,text)  from public, anon, authenticated;
revoke execute on function public._award_badge(uuid,text,int) from public, anon, authenticated;
revoke execute on function public.current_streak(uuid)        from public, anon, authenticated;
