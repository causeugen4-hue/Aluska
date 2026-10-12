-- Alușka Art Studio, pasul 3: înscriere la o singură lecție (o zi anume) + viteză
-- Rulează o singură dată în Supabase > SQL Editor, DUPĂ migration-2.sql.

-- Data de azi în Moldova
create or replace function public.today_md() returns date
language sql stable as $$ select (now() at time zone 'Europe/Chisinau')::date $$;

-- 1. Fiecare înscriere are acum o dată de lecție
alter table public.enrollments add column if not exists lesson_date date;

-- Înscrierile existente: le mutăm pe prima lecție următoare a grupei
update public.enrollments e
set lesson_date = coalesce(
  g.trial_date,
  public.today_md() + ((g.weekday - extract(isodow from public.today_md())::int + 7) % 7)
)
from public.groups g
where g.id = e.group_id and e.lesson_date is null;

alter table public.enrollments alter column lesson_date set not null;
alter table public.enrollments drop constraint if exists enrollments_child_id_group_id_key;
alter table public.enrollments
  add constraint enrollments_child_group_date_key unique (child_id, group_id, lesson_date);

-- 2. Locurile ocupate se numără pe fiecare lecție în parte
drop function if exists public.group_spots();
create or replace function public.group_spots()
returns table(group_id uuid, lesson_date date, taken bigint)
language sql security definer stable set search_path = public as $$
  select e.group_id, e.lesson_date, count(*)
  from public.enrollments e
  where e.lesson_date >= public.today_md()
  group by e.group_id, e.lesson_date
$$;
grant execute on function public.group_spots() to anon, authenticated;

-- 3. Verificări la înscriere (pe fiecare lecție)
create or replace function public.check_capacity() returns trigger
language plpgsql security definer set search_path = public as $$
declare g public.groups; cnt int;
begin
  select * into g from public.groups where id = new.group_id;
  if not public.is_admin() then
    if not g.is_open then raise exception 'Înscrierile la această grupă sunt închise.'; end if;
    if new.lesson_date < public.today_md() then raise exception 'Lecția aceasta a trecut.'; end if;
    if g.trial_date is not null then
      if new.lesson_date <> g.trial_date then raise exception 'Data lecției nu este validă.'; end if;
    elsif extract(isodow from new.lesson_date)::int <> g.weekday then
      raise exception 'Data lecției nu este validă.';
    end if;
    if exists (select 1 from public.cancelled_lessons
               where group_id = new.group_id and lesson_date = new.lesson_date) then
      raise exception 'Lecția aceasta este închisă.';
    end if;
  end if;
  select count(*) into cnt from public.enrollments
    where group_id = new.group_id and lesson_date = new.lesson_date and id <> new.id;
  if cnt >= g.capacity then raise exception 'Grupa este plină.'; end if;
  return new;
end $$;

drop trigger if exists enrollments_capacity on public.enrollments;
create trigger enrollments_capacity
before insert or update of group_id, lesson_date on public.enrollments
for each row execute function public.check_capacity();

-- 4. Indexuri pentru viteză
create index if not exists enrollments_group_date_idx on public.enrollments (group_id, lesson_date);
create index if not exists enrollments_child_idx on public.enrollments (child_id);
create index if not exists children_parent_idx on public.children (parent_id);
create index if not exists star_ledger_parent_idx on public.star_ledger (parent_id);
