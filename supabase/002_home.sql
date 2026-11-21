-- =====================================================================
-- SkillUp · 002 · Start + Home (login, dashboard, profile)
-- Run after schema.sql and seed.sql.
-- =====================================================================

-- Learners may only edit their name and username (not id or created_at).
alter table public.profiles
  add constraint display_name_length check (char_length(display_name) between 1 and 40);
revoke update on public.profiles from anon, authenticated;
grant  update (display_name, username) on public.profiles to authenticated;

-- Trophy shelf order (matches the Figma shelf: Court Basics, Rules Rookie, First Bump,
-- then Free Throw Pro, Net Ninja, Pitch Starter). Lower number = further left.
alter table public.badges add column shelf_order int not null default 99;
update public.badges set shelf_order = case id
  when 'court-basics' then 1 when 'rules-rookie' then 2 when 'first-bump' then 3
  when 'free-throw-pro' then 4 when 'net-ninja' then 5 when 'pitch-starter' then 6 else 99 end;

-- Sign-up form: check a username before creating the account.
-- Only says yes/no; never returns anyone's email.
create function public.username_available(p_username text) returns boolean
language sql stable security definer set search_path = public as $$
  select not exists (select 1 from profiles where username = lower(p_username)) $$;
grant execute on function public.username_available(text) to anon, authenticated;

-- get_home() replaces get_dashboard(): one call feeds both the dashboard and the profile.
drop function if exists public.get_dashboard();

create function public.get_home()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_user  uuid := require_user();
  v_today date := manila_today();
  v_mon   date := manila_today() - (extract(isodow from manila_today())::int - 1);
  v_cont  jsonb;
  v_sport text;
begin
  -- "Continue where you left off": the latest unfinished lesson ...
  select jsonb_build_object('sport_id', s.id, 'sport_name', s.name, 'lesson_no', l.lesson_no,
                            'title', l.title, 'step', lp.step)
    into v_cont
    from lesson_progress lp join lessons l on l.id = lp.lesson_id join sports s on s.id = l.sport_id
   where lp.user_id = v_user and lp.completed_at is null
   order by lp.updated_at desc limit 1;

  -- ... otherwise the next lesson in the sport played last, otherwise the first lesson overall.
  if v_cont is null then
    select l.sport_id into v_sport
      from lesson_progress lp join lessons l on l.id = lp.lesson_id
     where lp.user_id = v_user order by lp.updated_at desc limit 1;

    select jsonb_build_object('sport_id', s.id, 'sport_name', s.name, 'lesson_no', l.lesson_no,
                              'title', l.title, 'step', 'learn')
      into v_cont
      from lessons l join sports s on s.id = l.sport_id
     where not exists (select 1 from lesson_progress lp where lp.user_id = v_user
                         and lp.lesson_id = l.id and lp.completed_at is not null)
     order by (l.sport_id = v_sport) desc nulls last, s.sort_order, l.lesson_no
     limit 1;
  end if;

  return jsonb_build_object(
    'profile', (select jsonb_build_object('id', id, 'username', username, 'display_name', display_name)
                  from profiles where id = v_user),
    'points',  (select coalesce(sum(amount), 0) from points_ledger where user_id = v_user),
    'streak',  current_streak(v_user),
    'lessons_done',  (select count(*) from lesson_progress where user_id = v_user and completed_at is not null),
    'badges_earned', (select count(*) from user_badges where user_id = v_user),

    -- Monday to Sunday of this week
    'week', (select jsonb_agg(jsonb_build_object(
                'day', d::date,
                'active', exists (select 1 from activity_days a where a.user_id = v_user and a.day = d::date),
                'is_today', d::date = v_today) order by d)
               from generate_series(v_mon, v_mon + 6, interval '1 day') d),

    -- each sport with its 5 lessons and their status
    'sports', (select jsonb_agg(sp order by (sp->>'sort_order')::int) from (
       select jsonb_build_object(
         'id', s.id, 'name', s.name, 'accent_color', s.accent_color, 'sort_order', s.sort_order,
         'lessons_total', (select count(*) from lessons where sport_id = s.id),
         'lessons_done',  (select count(*) from lesson_progress lp join lessons l on l.id = lp.lesson_id
                            where lp.user_id = v_user and l.sport_id = s.id and lp.completed_at is not null),
         'lessons', (select jsonb_agg(jsonb_build_object(
                        'lesson_no', x.lesson_no, 'title', x.title, 'status', x.status) order by x.lesson_no)
                     from (
                       select l.lesson_no, l.title,
                         case
                           when lp.completed_at is not null then 'complete'
                           when l.lesson_no = (select min(l2.lesson_no) from lessons l2
                                                where l2.sport_id = s.id and not exists (
                                                  select 1 from lesson_progress p2 where p2.user_id = v_user
                                                    and p2.lesson_id = l2.id and p2.completed_at is not null))
                             then 'up_next'
                           when lp.lesson_id is not null then 'in_progress'
                           else 'not_started'
                         end as status
                       from lessons l
                       left join lesson_progress lp on lp.lesson_id = l.id and lp.user_id = v_user
                       where l.sport_id = s.id) x)
       ) as sp
       from sports s) t),

    -- full badge catalog: earned ones first, then locked
    'badges', (select jsonb_agg(jsonb_build_object(
                  'id', b.id, 'name', b.name, 'sport_id', b.sport_id,
                  'earned', ub.badge_id is not null, 'tier', ub.tier, 'best_score', ub.best_score)
                  order by (ub.badge_id is null), b.shelf_order, s.sort_order, b.id)
               from badges b join sports s on s.id = b.sport_id
               left join user_badges ub on ub.badge_id = b.id and ub.user_id = v_user),

    'continue', v_cont
  );
end $$;
