-- =====================================================================
-- SkillUp · Demo account "Jamie Dela Cruz" (matches the Figma screens)
--
-- 1. Sign up on the website first:
--      Name: Jamie Dela Cruz · Username: jamiedc
--      Email: jamie@skillup.test · Password: (your choice)
-- 2. Then run this file in the Supabase SQL Editor.
-- Safe to run again: it clears Jamie's progress and fills it back in.
-- =====================================================================

do $$
declare
  u     uuid := (select id from public.profiles where username = 'jamiedc');
  today date := public.manila_today();
  lvl   int;
begin
  if u is null then
    raise exception 'Sign up the jamiedc account on the website first.';
  end if;

  delete from public.points_ledger      where user_id = u;
  delete from public.user_badges        where user_id = u;
  delete from public.challenge_passes   where user_id = u;
  delete from public.challenge_attempts where user_id = u;
  delete from public.quiz_attempts      where user_id = u;
  delete from public.lesson_progress    where user_id = u;
  delete from public.activity_days      where user_id = u;

  -- Basketball 1–3 done, Lesson 4 started (step: Learn, card 1 ticked). Volleyball 1 done.
  -- (cards_done needs 003_learn_quiz.sql)
  insert into public.lesson_progress (user_id, lesson_id, step, cards_read, cards_done, completed_at, updated_at)
  select u, l.id, 'play', l.card_count, array(select generate_series(1, l.card_count)),
         now() - interval '3 days', now() - interval '3 days'
    from public.lessons l
   where (l.sport_id = 'basketball' and l.lesson_no <= 3) or (l.sport_id = 'volleyball' and l.lesson_no = 1);
  insert into public.lesson_progress (user_id, lesson_id, step, cards_read, cards_done, updated_at)
  select u, id, 'learn', 1, '{1}', now() - interval '1 hour'
    from public.lessons where sport_id = 'basketball' and lesson_no = 4;

  -- Basketball: positions L1+L2 and rules L1+L2 passed (4/8). Volleyball: timing L1.
  insert into public.challenge_passes (user_id, challenge_level_id, best_score_pct)
  select u, id, case when challenge_type = 'rules' then 90 when sport_id = 'volleyball' then 72 else 78 end
    from public.challenge_levels
   where (sport_id = 'basketball' and challenge_type in ('positions','rules'))
      or (sport_id = 'volleyball' and challenge_type = 'timing' and level = 1);

  -- The 3 badges on the trophy shelf
  insert into public.user_badges (user_id, badge_id, tier, best_score) values
    (u, 'court-basics', 'bronze', 78),
    (u, 'rules-rookie', 'silver', 90),
    (u, 'first-bump',   'bronze', 72);

  -- Points: the real rewards above, plus a demo top-up so the total is 1,240
  insert into public.points_ledger (user_id, amount, reason, source_key)
  select u, 10, 'Finished a lesson', 'lesson:' || lesson_id
    from public.lesson_progress where user_id = u and completed_at is not null;
  insert into public.points_ledger (user_id, amount, reason, source_key)
  select u, 20, 'Passed a challenge level', 'level:' || challenge_level_id
    from public.challenge_passes where user_id = u;
  insert into public.points_ledger (user_id, amount, reason, source_key)
  values (u, 1240 - (select sum(amount) from public.points_ledger where user_id = u),
          'Demo starting points', 'demo:start');

  -- 5-day streak ending today
  insert into public.activity_days (user_id, day)
  select u, today - n from generate_series(0, 4) n;
end $$;
