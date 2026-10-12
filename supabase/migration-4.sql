-- Alușka Art Studio, pasul 4: lecția de probă = preț redus pentru prima lecție a copilului
-- Rulează o singură dată în Supabase > SQL Editor, DUPĂ migration-3.sql.

-- Fiecare înscriere poate fi „de probă” (părintele plătește 130 lei în loc de prețul grupei)
alter table public.enrollments add column if not exists is_trial boolean not null default false;

-- Verificări la înscriere: lecția de probă e permisă doar pentru prima lecție a copilului
create or replace function public.check_capacity() returns trigger
language plpgsql security definer set search_path = public as $$
declare g public.groups; cnt int;
begin
  select * into g from public.groups where id = new.group_id;
  if not public.is_admin() then
    if not g.is_open then raise exception 'Înscrierile la această grupă sunt închise.'; end if;
    if new.lesson_date < public.today_md() then raise exception 'Lecția aceasta a trecut.'; end if;
    if extract(isodow from new.lesson_date)::int <> g.weekday then
      raise exception 'Data lecției nu este validă.';
    end if;
    if exists (select 1 from public.cancelled_lessons
               where group_id = new.group_id and lesson_date = new.lesson_date) then
      raise exception 'Lecția aceasta este închisă.';
    end if;
    if new.is_trial then
      if exists (select 1 from public.enrollments where child_id = new.child_id and id <> new.id)
         or exists (select 1 from public.attendance where child_id = new.child_id) then
        raise exception 'Lecția de probă este doar pentru prima lecție a copilului.';
      end if;
    end if;
  end if;
  select count(*) into cnt from public.enrollments
    where group_id = new.group_id and lesson_date = new.lesson_date and id <> new.id;
  if cnt >= g.capacity then raise exception 'Grupa este plină.'; end if;
  return new;
end $$;

drop trigger if exists enrollments_capacity on public.enrollments;
create trigger enrollments_capacity
before insert or update of group_id, lesson_date, is_trial on public.enrollments
for each row execute function public.check_capacity();

-- Lecțiile de probă ca tip separat de lecție nu mai există
update public.groups set trial_date = null where trial_date is not null;
alter table public.groups drop column if exists trial_date;
