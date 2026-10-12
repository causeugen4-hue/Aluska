-- Alușka Art Studio, pasul 5: abonamente cu cod
-- Rulează o singură dată în Supabase > SQL Editor, DUPĂ migration-4.sql.

-- 1. Abonamentele (codul îl formezi tu din Administrare; părintele îl scrie în contul lui)
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  total_lessons int not null check (total_lessons > 0),
  note text not null default '',
  parent_id uuid references public.profiles(id) on delete set null,
  redeemed_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index if not exists subscriptions_code_key on public.subscriptions (code);

alter table public.subscriptions enable row level security;
create policy "abonament: al tău sau admin" on public.subscriptions
  for select using (parent_id = auth.uid() or public.is_admin());
create policy "abonamente gestionate de admin" on public.subscriptions
  for all using (public.is_admin()) with check (public.is_admin());

-- 2. Fiecare înscriere poate fi plătită cu un abonament
alter table public.enrollments
  add column if not exists subscription_id uuid references public.subscriptions(id) on delete set null;

-- Câte lecții a folosit un abonament (lecțiile închise nu se numără, se returnează)
create or replace function public.sub_used(sid uuid, except_id uuid default null) returns int
language sql security definer stable set search_path = public as $$
  select count(*)::int from public.enrollments e
  where e.subscription_id = sid
    and (except_id is null or e.id <> except_id)
    and not exists (select 1 from public.cancelled_lessons c
                    where c.group_id = e.group_id and c.lesson_date = e.lesson_date)
$$;

create or replace function public.subscription_usage()
returns table(subscription_id uuid, used int)
language sql security definer stable set search_path = public as $$
  select s.id, public.sub_used(s.id)
  from public.subscriptions s
  where s.parent_id = auth.uid() or public.is_admin()
$$;
grant execute on function public.subscription_usage() to authenticated;

-- 3. Părintele își adaugă abonamentul cu codul primit
create or replace function public.redeem_subscription(p_code text) returns int
language plpgsql security definer set search_path = public as $$
declare s public.subscriptions; c text;
begin
  if auth.uid() is null then raise exception 'Intră în cont.'; end if;
  c := regexp_replace(upper(coalesce(p_code, '')), '[^A-Z0-9]', '', 'g');
  select * into s from public.subscriptions where code = c for update;
  if not found then raise exception 'Cod invalid. Verifică și încearcă din nou.'; end if;
  if s.parent_id is not null then
    if s.parent_id = auth.uid() then raise exception 'Ai adăugat deja acest abonament.'; end if;
    raise exception 'Codul acesta a fost deja folosit.';
  end if;
  update public.subscriptions set parent_id = auth.uid(), redeemed_at = now() where id = s.id;
  return s.total_lessons - public.sub_used(s.id);
end $$;
grant execute on function public.redeem_subscription(text) to authenticated;

-- 4. Verificări la înscrierea cu abonament
create or replace function public.check_subscription() returns trigger
language plpgsql security definer set search_path = public as $$
declare s public.subscriptions; kid_parent uuid;
begin
  if new.subscription_id is null then return new; end if;
  select * into s from public.subscriptions where id = new.subscription_id for update;
  select parent_id into kid_parent from public.children where id = new.child_id;
  if s.parent_id is null or s.parent_id is distinct from kid_parent then
    raise exception 'Abonamentul nu aparține acestui cont.';
  end if;
  if new.is_trial then
    raise exception 'Lecția de probă nu se plătește cu abonament.';
  end if;
  if public.sub_used(s.id, new.id) >= s.total_lessons then
    raise exception 'Abonamentul nu mai are lecții disponibile.';
  end if;
  return new;
end $$;

drop trigger if exists enrollments_subscription on public.enrollments;
create trigger enrollments_subscription
before insert or update of subscription_id, is_trial on public.enrollments
for each row execute function public.check_subscription();
