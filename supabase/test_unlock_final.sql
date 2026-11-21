-- =====================================================================
-- SkillUp · TEST ONLY · unlock a Sport Final for one account
-- Lessons can't be fully finished on the website until the "Try it",
-- "Quick check" and "Play" steps are built, so this marks every lesson
-- of one sport as done (cards ticked, completed, +10 each like the real thing).
-- Change the two values below, then run in the Supabase SQL Editor.
-- Never run this on the real class database.
-- =====================================================================

do $$
declare
  v_username text := 'jamiedc';      -- account to unlock
  v_sport    text := 'volleyball';   -- basketball | volleyball | soccer
  u uuid := (select id from public.profiles where username = v_username);
begin
  if u is null then raise exception 'No account with username %', v_username; end if;

  insert into public.lesson_progress (user_id, lesson_id, step, cards_read, cards_done, completed_at)
  select u, l.id, 'play', l.card_count, array(select generate_series(1, l.card_count)), now()
    from public.lessons l where l.sport_id = v_sport
  on conflict (user_id, lesson_id) do update
    set step = 'play', cards_read = excluded.cards_read, cards_done = excluded.cards_done,
        completed_at = coalesce(public.lesson_progress.completed_at, now()), updated_at = now();

  insert into public.points_ledger (user_id, amount, reason, source_key)
  select u, 10, 'Finished a lesson', 'lesson:' || l.id
    from public.lessons l where l.sport_id = v_sport
  on conflict (user_id, source_key) do nothing;
end $$;
