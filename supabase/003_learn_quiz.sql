-- =====================================================================
-- SkillUp - 003 - Learn, quiz + review (lesson page, sport final, results)
-- Run after schema.sql, seed.sql and 002_home.sql. Then run 003_content.sql.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. CONTENT: key-point cards for each lesson (same for every learner)
-- ---------------------------------------------------------------------

create table public.lesson_cards (
  lesson_id  int  not null references public.lessons(id) on delete cascade,
  card_no    int  not null check (card_no between 1 and 6),
  label      text not null,                 -- caption under the picture: 'Dribble'
  heading    text not null,                 -- bold start of the text: 'Dribble:'
  body       text not null,
  icon       text not null default 'ball',  -- picture key in js/presentation/components/icons.js
  primary key (lesson_id, card_no)
);
alter table public.lesson_cards enable row level security;
create policy "content is public" on public.lesson_cards for select using (true);

-- Video: an mp4 (Supabase Storage bucket "lesson-videos") + optional .vtt captions for the CC button.
alter table public.lessons
  add column captions_url  text,
  add column video_seconds int check (video_seconds > 0);

-- ---------------------------------------------------------------------
-- 2. PROGRESS: remember WHICH cards were ticked (any order), not just how many
-- ---------------------------------------------------------------------

alter table public.lesson_progress add column cards_done int[] not null default '{}';
update public.lesson_progress
   set cards_done = array(select generate_series(1, cards_read))
 where cards_read > 0;

-- ---------------------------------------------------------------------
-- 3. QUIZ ATTEMPTS: answered one question at a time, first answer is final
-- ---------------------------------------------------------------------

alter table public.quiz_attempts
  alter column answers       set default '{}',
  alter column correct_count set default 0,
  alter column score_pct     set default 0,
  add column finished_at    timestamptz,
  add column points_awarded int not null default 0;
update public.quiz_attempts set finished_at = created_at where finished_at is null;

-- At most one unfinished attempt per learner and sport (refresh = resume, not restart).
create unique index quiz_attempts_one_open
  on public.quiz_attempts (user_id, sport_id) where finished_at is null;

-- ---------------------------------------------------------------------
-- 4. PRIVATE HELPERS
-- ---------------------------------------------------------------------

-- The Sport Final opens once every lesson of that sport is finished.
create function public._final_unlocked(p_user uuid, p_sport text) returns boolean
language sql stable security definer set search_path = public as $$
  select not exists (
    select 1 from lessons l
     where l.sport_id = p_sport
       and not exists (select 1 from lesson_progress lp
                        where lp.user_id = p_user and lp.lesson_id = l.id and lp.completed_at is not null)) $$;

-- A sport's 5 lessons with status (same rules as get_home) and their challenge.
create function public._sport_lessons(p_user uuid, p_sport text) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'lesson_no', x.lesson_no, 'title', x.title, 'status', x.status,
           'challenge_type', x.challenge_type, 'challenge_title', x.challenge_title)
         order by x.lesson_no), '[]')
    from (
      select l.lesson_no, l.title, l.challenge_type,
             (select cl.title from challenge_levels cl
               where cl.sport_id = l.sport_id and cl.challenge_type = l.challenge_type and cl.level = 1) as challenge_title,
             case
               when lp.completed_at is not null then 'complete'
               when l.lesson_no = (select min(l2.lesson_no) from lessons l2
                                    where l2.sport_id = p_sport and not exists (
                                      select 1 from lesson_progress p2 where p2.user_id = p_user
                                        and p2.lesson_id = l2.id and p2.completed_at is not null))
                 then 'up_next'
               when lp.lesson_id is not null then 'in_progress'
               else 'not_started'
             end as status
        from lessons l
        left join lesson_progress lp on lp.lesson_id = l.id and lp.user_id = p_user
       where l.sport_id = p_sport) x $$;

-- ---------------------------------------------------------------------
-- 5. LESSON PAGE
-- ---------------------------------------------------------------------

-- Everything the lesson page needs in one call.
-- p_sport null  -> the sport the learner played last (or the first sport).
-- p_lesson_no null -> the unfinished lesson touched last in that sport (or the first unfinished, or 1).
-- Opening a lesson marks it started, so "Continue" on the dashboard points here.
create function public.get_lesson(p_sport text default null, p_lesson_no int default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_user   uuid := require_user();
  v_sport  text := p_sport;
  v_no     int  := p_lesson_no;
  v_lesson lessons%rowtype;
  v_prog   lesson_progress%rowtype;
begin
  if v_sport is null then
    select l.sport_id into v_sport
      from lesson_progress lp join lessons l on l.id = lp.lesson_id
     where lp.user_id = v_user order by lp.updated_at desc limit 1;
    v_sport := coalesce(v_sport, (select id from sports order by sort_order limit 1));
  end if;

  if v_no is null then
    select l.lesson_no into v_no
      from lessons l
      left join lesson_progress lp on lp.lesson_id = l.id and lp.user_id = v_user
     where l.sport_id = v_sport and lp.completed_at is null
     order by lp.updated_at desc nulls last, l.lesson_no
     limit 1;
    v_no := coalesce(v_no, 1);
  end if;

  select * into v_lesson from lessons where sport_id = v_sport and lesson_no = v_no;
  if not found then raise exception 'Lesson not found'; end if;

  insert into lesson_progress (user_id, lesson_id) values (v_user, v_lesson.id)
  on conflict (user_id, lesson_id) do update set updated_at = now()
  returning * into v_prog;
  insert into activity_days (user_id, day) values (v_user, manila_today()) on conflict do nothing;

  return jsonb_build_object(
    'sport', (select jsonb_build_object('id', id, 'name', name) from sports where id = v_sport),
    'lesson', jsonb_build_object(
       'id', v_lesson.id, 'lesson_no', v_lesson.lesson_no, 'title', v_lesson.title, 'goal', v_lesson.goal,
       'card_count', v_lesson.card_count, 'challenge_type', v_lesson.challenge_type,
       'video_url', v_lesson.video_url, 'captions_url', v_lesson.captions_url,
       'video_seconds', v_lesson.video_seconds),
    'cards', (select coalesce(jsonb_agg(jsonb_build_object(
                 'card_no', card_no, 'label', label, 'heading', heading, 'body', body, 'icon', icon)
                 order by card_no), '[]')
                from lesson_cards where lesson_id = v_lesson.id),
    'progress', jsonb_build_object(
       'step', v_prog.step, 'cards_done', to_jsonb(v_prog.cards_done),
       'completed', v_prog.completed_at is not null),
    'lessons', _sport_lessons(v_user, v_sport),
    'lessons_total', (select count(*) from lessons where sport_id = v_sport),
    'lessons_done',  (select count(*) from lesson_progress lp join lessons l on l.id = lp.lesson_id
                       where lp.user_id = v_user and l.sport_id = v_sport and lp.completed_at is not null),
    'levels_total',  (select count(*) from challenge_levels where sport_id = v_sport),
    'levels_passed', (select count(*) from challenge_passes cp join challenge_levels cl on cl.id = cp.challenge_level_id
                       where cp.user_id = v_user and cl.sport_id = v_sport),
    'points_this_lesson', (select coalesce(sum(amount), 0) from points_ledger
                            where user_id = v_user
                              and (source_key = 'lesson:' || v_lesson.id
                                   or source_key in (select 'level:' || cl.id from challenge_levels cl
                                                      where cl.sport_id = v_sport
                                                        and cl.challenge_type = v_lesson.challenge_type))),
    'final_unlocked', _final_unlocked(v_user, v_sport)
  );
end $$;

-- Tick one key-point card. Ticks are kept (tapping again does nothing). Returns the ticked card numbers.
create function public.tick_lesson_card(p_lesson_id int, p_card_no int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_user uuid := require_user(); v_done int[];
begin
  if not exists (select 1 from lesson_cards where lesson_id = p_lesson_id and card_no = p_card_no) then
    raise exception 'Unknown card';
  end if;
  insert into lesson_progress (user_id, lesson_id) values (v_user, p_lesson_id)
  on conflict (user_id, lesson_id) do nothing;
  update lesson_progress
     set cards_done = (select array_agg(distinct c order by c) from unnest(cards_done || p_card_no) c),
         cards_read = (select count(distinct c) from unnest(cards_done || p_card_no) c),
         updated_at = now()
   where user_id = v_user and lesson_id = p_lesson_id
  returning cards_done into v_done;
  insert into activity_days (user_id, day) values (v_user, manila_today()) on conflict do nothing;
  return to_jsonb(v_done);
end $$;

-- Save which step the learner is on. Moving past "Learn" needs every card ticked.
-- (Replaces the old 3-argument version that let the browser set the card count.)
drop function if exists public.save_lesson_step(int, text, int);
create function public.save_lesson_step(p_lesson_id int, p_step text)
returns void language plpgsql security definer set search_path = public as $$
declare v_user uuid := require_user(); v_need int;
begin
  if p_step is null or p_step not in ('learn','try','check','play') then raise exception 'Unknown step'; end if;
  select card_count into v_need from lessons where id = p_lesson_id;
  if not found then raise exception 'Lesson not found'; end if;
  if p_step <> 'learn' and coalesce((select cardinality(cards_done) from lesson_progress
                                      where user_id = v_user and lesson_id = p_lesson_id), 0) < v_need then
    raise exception 'Read every card first';
  end if;
  insert into lesson_progress (user_id, lesson_id, step) values (v_user, p_lesson_id, p_step)
  on conflict (user_id, lesson_id) do update set step = excluded.step, updated_at = now();
  insert into activity_days (user_id, day) values (v_user, manila_today()) on conflict do nothing;
end $$;

-- Finish a lesson: +10 the first time only, and only once every card is ticked.
-- (Later phases add the "Try it / Quick check / Play" conditions here.)
create or replace function public.complete_lesson(p_lesson_id int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_user uuid := require_user(); v_pts int;
begin
  if not exists (select 1 from lesson_progress lp join lessons l on l.id = lp.lesson_id
                  where lp.user_id = v_user and lp.lesson_id = p_lesson_id
                    and cardinality(lp.cards_done) >= l.card_count) then
    raise exception 'Read every card first';
  end if;
  update lesson_progress set completed_at = coalesce(completed_at, now()), updated_at = now()
   where user_id = v_user and lesson_id = p_lesson_id;
  v_pts := _award(v_user, 10, 'Finished a lesson', 'lesson:' || p_lesson_id);
  return jsonb_build_object('points_awarded', v_pts);
end $$;

-- ---------------------------------------------------------------------
-- 6. SPORT FINAL QUIZ (start -> answer each question -> finish -> result)
-- ---------------------------------------------------------------------

-- Start (or resume) the final. Questions come without answers, except the ones
-- already answered in this attempt (so a refresh shows them as answered).
create function public.start_quiz(p_sport text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_user uuid := require_user(); v_att quiz_attempts%rowtype; v_total int;
begin
  if not exists (select 1 from sports where id = p_sport) then raise exception 'Unknown sport'; end if;
  select count(*) into v_total from quiz_questions where sport_id = p_sport;
  if v_total = 0 then raise exception 'No quiz for this sport'; end if;
  if not _final_unlocked(v_user, p_sport) then raise exception 'Finish all 5 lessons first'; end if;

  insert into quiz_attempts (user_id, sport_id, total)
  values (v_user, p_sport, v_total)
  on conflict (user_id, sport_id) where finished_at is null do nothing;
  select * into v_att from quiz_attempts
   where user_id = v_user and sport_id = p_sport and finished_at is null;

  insert into activity_days (user_id, day) values (v_user, manila_today()) on conflict do nothing;

  return jsonb_build_object(
    'attempt_id', v_att.id,
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

-- Answer one question. The first answer is final. +5 the first time a question is ever answered right.
create function public.answer_quiz_question(p_attempt bigint, p_question_id int, p_index int)
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
  if v_ok then v_pts := _award(v_user, 5, 'Correct quiz answer', 'quiz:' || v_q.id); end if;

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

-- Finish: needs every question answered. Gives or upgrades the badge. Safe to call twice.
create function public.finish_quiz(p_attempt bigint)
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
  if v_tier is not null then perform _award_badge(v_user, v_badge, v_score); end if;

  update quiz_attempts set score_pct = v_score, badge_tier = v_tier, finished_at = now() where id = p_attempt;
  return jsonb_build_object('attempt_id', v_att.id);
end $$;

-- The results screen for one finished attempt (own attempts only).
create function public.get_quiz_result(p_attempt bigint)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_user uuid := require_user(); v_att quiz_attempts%rowtype; v_badge badges%rowtype;
begin
  select * into v_att from quiz_attempts where id = p_attempt and user_id = v_user;
  if not found then raise exception 'Quiz not found'; end if;
  if v_att.finished_at is null then raise exception 'This quiz is not finished yet'; end if;
  select * into v_badge from badges where sport_id = v_att.sport_id and source = 'quiz';

  return jsonb_build_object(
    'attempt_id', v_att.id,
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
-- 7. PERMISSIONS
-- ---------------------------------------------------------------------

-- The old one-shot submit would let someone skip the answer locks above.
revoke execute on function public.submit_quiz(text, jsonb) from public, anon, authenticated;

revoke execute on function public._final_unlocked(uuid, text) from public, anon, authenticated;
revoke execute on function public._sport_lessons(uuid, text)  from public, anon, authenticated;

-- Business functions: logged-in learners only.
revoke execute on function public.get_lesson(text, int)                    from public, anon;
revoke execute on function public.tick_lesson_card(int, int)               from public, anon;
revoke execute on function public.save_lesson_step(int, text)              from public, anon;
revoke execute on function public.start_quiz(text)                         from public, anon;
revoke execute on function public.answer_quiz_question(bigint, int, int)   from public, anon;
revoke execute on function public.finish_quiz(bigint)                      from public, anon;
revoke execute on function public.get_quiz_result(bigint)                  from public, anon;
grant  execute on function public.get_lesson(text, int)                    to authenticated;
grant  execute on function public.tick_lesson_card(int, int)               to authenticated;
grant  execute on function public.save_lesson_step(int, text)              to authenticated;
grant  execute on function public.start_quiz(text)                         to authenticated;
grant  execute on function public.answer_quiz_question(bigint, int, int)   to authenticated;
grant  execute on function public.finish_quiz(bigint)                      to authenticated;
grant  execute on function public.get_quiz_result(bigint)                  to authenticated;
