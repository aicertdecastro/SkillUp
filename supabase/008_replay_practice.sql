-- =====================================================================
-- SkillUp - 008 - Replays are practice: no points, no badge changes
-- Run after 007_basketball_challenges.sql. Safe to run again.
--
-- Learners can go back to finished lessons, passed challenge levels and a
-- finished Sport Final. A replay ("practice") still counts as an active day
-- for the streak, but it never gives points, never gives or upgrades a badge
-- and never changes a best score.
--   * Lesson:          already paid once only by complete_lesson() (no change here).
--   * Challenge level: practice when the level was already passed at the start of the try.
--   * Sport Final:     practice when the learner already finished the Final for that sport.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. TABLES
-- ---------------------------------------------------------------------

alter table public.quiz_attempts      add column if not exists practice boolean not null default false;
alter table public.challenge_attempts add column if not exists practice boolean not null default false;

-- Attempts that are open right now and are really replays.
update public.quiz_attempts a set practice = true
 where a.finished_at is null and not a.practice
   and exists (select 1 from public.quiz_attempts b
                where b.user_id = a.user_id and b.sport_id = a.sport_id and b.finished_at is not null);

update public.challenge_attempts a set practice = true
 where a.finished_at is null and not a.practice
   and exists (select 1 from public.challenge_passes p
                where p.user_id = a.user_id and p.challenge_level_id = a.challenge_level_id);

-- ---------------------------------------------------------------------
-- 2. SPORT FINAL QUIZ (same as 003, plus the practice rule)
-- ---------------------------------------------------------------------

-- Start (or resume) the final. A new attempt is practice when the Final was finished before.
create or replace function public.start_quiz(p_sport text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_user uuid := require_user(); v_att quiz_attempts%rowtype; v_total int;
begin
  if not exists (select 1 from sports where id = p_sport) then raise exception 'Unknown sport'; end if;
  select count(*) into v_total from quiz_questions where sport_id = p_sport;
  if v_total = 0 then raise exception 'No quiz for this sport'; end if;
  if not _final_unlocked(v_user, p_sport) then raise exception 'Finish all 5 lessons first'; end if;

  insert into quiz_attempts (user_id, sport_id, total, practice)
  values (v_user, p_sport, v_total,
          exists (select 1 from quiz_attempts
                   where user_id = v_user and sport_id = p_sport and finished_at is not null))
  on conflict (user_id, sport_id) where finished_at is null do nothing;
  select * into v_att from quiz_attempts
   where user_id = v_user and sport_id = p_sport and finished_at is null;

  insert into activity_days (user_id, day) values (v_user, manila_today()) on conflict do nothing;

  return jsonb_build_object(
    'attempt_id', v_att.id,
    'practice', v_att.practice,
    'sport', (select jsonb_build_object('id', id, 'name', name) from sports where id = p_sport),
    'total', v_att.total,
    'correct_so_far', v_att.correct_count,
    'lessons', (select jsonb_agg(jsonb_build_object('lesson_no', lesson_no, 'title', title) order by lesson_no)
                  from lessons where sport_id = p_sport),
    'questions', (select jsonb_agg(jsonb_build_object(
                     'question_id', q.id, 'question_no', q.question_no,
                     'from_lesson_no', q.from_lesson_no, 'lesson_title', l.title,
                     'prompt', q.prompt, 'options', q.options,
                     'answer', case when v_att.answers ? q.id::text then jsonb_build_object(
                                 'chosen', (v_att.answers->>q.id::text)::int,
                                 'correct_index', q.correct_index) end)
                     order by q.question_no)
                    from quiz_questions q
                    join lessons l on l.sport_id = q.sport_id and l.lesson_no = q.from_lesson_no
                   where q.sport_id = p_sport)
  );
end $$;

-- Answer one question. The first answer is final. +5 the first time a question is
-- ever answered right, never on a practice attempt.
create or replace function public.answer_quiz_question(p_attempt bigint, p_question_id int, p_index int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := require_user();
  v_att  quiz_attempts%rowtype;
  v_q    quiz_questions%rowtype;
  v_ok   boolean;
  v_pts  int := 0;
begin
  select * into v_att from quiz_attempts where id = p_attempt and user_id = v_user for update;
  if not found then raise exception 'Quiz not found'; end if;
  if v_att.finished_at is not null then raise exception 'This quiz is finished'; end if;

  select * into v_q from quiz_questions where id = p_question_id and sport_id = v_att.sport_id;
  if not found then raise exception 'Unknown question'; end if;
  if v_att.answers ? p_question_id::text then raise exception 'Already answered'; end if;
  if p_index is null or p_index < 0 or p_index >= jsonb_array_length(v_q.options) then
    raise exception 'Invalid answer';
  end if;

  v_ok := p_index = v_q.correct_index;
  if v_ok and not v_att.practice then
    v_pts := _award(v_user, 5, 'Correct quiz answer', 'quiz:' || v_q.id);
  end if;

  update quiz_attempts
     set answers        = answers || jsonb_build_object(p_question_id::text, p_index),
         correct_count  = correct_count + v_ok::int,
         points_awarded = points_awarded + v_pts
   where id = p_attempt
  returning * into v_att;
  insert into activity_days (user_id, day) values (v_user, manila_today()) on conflict do nothing;

  return jsonb_build_object(
    'correct', v_ok, 'correct_index', v_q.correct_index,
    'review_lesson_no', v_q.from_lesson_no,
    'review_lesson_title', (select title from lessons where sport_id = v_q.sport_id and lesson_no = v_q.from_lesson_no),
    'correct_so_far', v_att.correct_count,
    'answered', (select count(*) from jsonb_object_keys(v_att.answers)),
    'points_awarded', v_pts);
end $$;

-- Finish: needs every question answered. Gives or upgrades the badge, except on practice.
-- badge_tier is still saved so the results screen can show the practice score. Safe to call twice.
create or replace function public.finish_quiz(p_attempt bigint)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_user uuid := require_user(); v_att quiz_attempts%rowtype; v_score int; v_tier text; v_badge text;
begin
  select * into v_att from quiz_attempts where id = p_attempt and user_id = v_user for update;
  if not found then raise exception 'Quiz not found'; end if;
  if v_att.finished_at is not null then return jsonb_build_object('attempt_id', v_att.id); end if;
  if (select count(*) from jsonb_object_keys(v_att.answers)) < v_att.total then
    raise exception 'Answer every question first';
  end if;

  v_score := round(100.0 * v_att.correct_count / v_att.total);
  v_tier  := tier_for(v_score);
  select id into v_badge from badges where sport_id = v_att.sport_id and source = 'quiz';
  if v_tier is not null and not v_att.practice then perform _award_badge(v_user, v_badge, v_score); end if;

  update quiz_attempts set score_pct = v_score, badge_tier = v_tier, finished_at = now() where id = p_attempt;
  return jsonb_build_object('attempt_id', v_att.id);
end $$;

-- The results screen for one finished attempt (own attempts only).
create or replace function public.get_quiz_result(p_attempt bigint)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_user uuid := require_user(); v_att quiz_attempts%rowtype; v_badge badges%rowtype;
begin
  select * into v_att from quiz_attempts where id = p_attempt and user_id = v_user;
  if not found then raise exception 'Quiz not found'; end if;
  if v_att.finished_at is null then raise exception 'This quiz is not finished yet'; end if;
  select * into v_badge from badges where sport_id = v_att.sport_id and source = 'quiz';

  return jsonb_build_object(
    'attempt_id', v_att.id,
    'practice', v_att.practice,
    'sport', (select jsonb_build_object('id', id, 'name', name, 'sort_order', sort_order) from sports where id = v_att.sport_id),
    'correct', v_att.correct_count, 'total', v_att.total, 'score_pct', v_att.score_pct,
    'passed', v_att.score_pct >= 70,
    'tier', v_att.badge_tier,
    'best_tier', (select tier from user_badges where user_id = v_user and badge_id = v_badge.id),
    'badge_name', v_badge.name,
    'points_awarded', v_att.points_awarded,
    'review', (select coalesce(jsonb_agg(jsonb_build_object('lesson_no', r.lesson_no, 'title', r.title)
                                         order by r.lesson_no), '[]')
                 from (select distinct l.lesson_no, l.title
                         from quiz_questions q
                         join lessons l on l.sport_id = q.sport_id and l.lesson_no = q.from_lesson_no
                        where q.sport_id = v_att.sport_id
                          and (v_att.answers->>q.id::text)::int is distinct from q.correct_index) r),
    'next_sport', (select jsonb_build_object('id', s.id, 'name', s.name) from sports s
                    order by (s.sort_order <= (select sort_order from sports where id = v_att.sport_id)), s.sort_order
                    limit 1)
  );
end $$;

-- ---------------------------------------------------------------------
-- 3. CHALLENGES (same as 007, plus the practice rule)
-- ---------------------------------------------------------------------

-- Start (or resume) a try. A new try is practice when the level is already passed.
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

  insert into challenge_attempts (user_id, challenge_level_id, practice)
  values (v_user, p_level_id,
          exists (select 1 from challenge_passes where user_id = v_user and challenge_level_id = p_level_id))
  on conflict (user_id, challenge_level_id) where finished_at is null do nothing;
  select * into v_att from challenge_attempts
   where user_id = v_user and challenge_level_id = p_level_id and finished_at is null;

  insert into activity_days (user_id, day) values (v_user, manila_today()) on conflict do nothing;
  return jsonb_build_object('attempt_id', v_att.id, 'state', v_att.result, 'practice', v_att.practice);
end $$;

-- Close a try. Practice tries keep the streak day but change no pass, points or badge.
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

  if p_passed and not v_att.practice then
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
    'badge_tier', v_tier, 'level', v_lvl.level, 'attempt_id', p_attempt, 'practice', v_att.practice);
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
    'practice', v_att.practice,
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
-- 4. PERMISSIONS (same as 003 / 007)
-- ---------------------------------------------------------------------

revoke execute on function public._finish_challenge(bigint, int, boolean, jsonb) from public, anon, authenticated;

revoke execute on function public.start_quiz(text)                       from public, anon;
revoke execute on function public.answer_quiz_question(bigint, int, int) from public, anon;
revoke execute on function public.finish_quiz(bigint)                    from public, anon;
revoke execute on function public.get_quiz_result(bigint)                from public, anon;
revoke execute on function public.start_challenge(int, boolean)          from public, anon;
revoke execute on function public.get_challenge_result(bigint)           from public, anon;
grant  execute on function public.start_quiz(text)                       to authenticated;
grant  execute on function public.answer_quiz_question(bigint, int, int) to authenticated;
grant  execute on function public.finish_quiz(bigint)                    to authenticated;
grant  execute on function public.get_quiz_result(bigint)                to authenticated;
grant  execute on function public.start_challenge(int, boolean)          to authenticated;
grant  execute on function public.get_challenge_result(bigint)           to authenticated;
