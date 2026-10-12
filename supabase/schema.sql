-- Alușka Art Studio: rulează tot fișierul în Supabase > SQL Editor

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text not null default '',
  email text not null default '',
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  weekday int not null check (weekday between 1 and 7), -- 1 = luni ... 7 = duminică
  start_time time not null,
  end_time time not null,
  price numeric(8,2) not null default 0,               -- preț pe o lecție
  capacity int not null default 8,
  is_open boolean not null default true,               -- înscrieri deschise
  created_at timestamptz not null default now()
);

create table public.children (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  birth_date date,
  notes text not null default '',
  created_at timestamptz not null default now()
);

create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  group_id uuid not null references public.groups(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (child_id, group_id)
);

create table public.cancelled_lessons (
  group_id uuid not null references public.groups(id) on delete cascade,
  lesson_date date not null,
  primary key (group_id, lesson_date)
);

-- Funcții ajutătoare
create or replace function public.is_admin() returns boolean
language sql security definer stable set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false)
$$;

create or replace function public.group_spots()
returns table(group_id uuid, taken bigint)
language sql security definer stable set search_path = public as $$
  select group_id, count(*) from public.enrollments group by group_id
$$;
grant execute on function public.group_spots() to anon, authenticated;

-- Profil creat automat la înregistrare
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    coalesce(new.email, '')
  );
  return new;
end $$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Verificare locuri și înscrieri închise
create or replace function public.check_capacity() returns trigger
language plpgsql security definer set search_path = public as $$
declare cap int; cnt int; open_ boolean;
begin
  select capacity, is_open into cap, open_ from public.groups where id = new.group_id;
  if not open_ and not public.is_admin() then
    raise exception 'Înscrierile la această grupă sunt închise.';
  end if;
  select count(*) into cnt from public.enrollments where group_id = new.group_id and id <> new.id;
  if cnt >= cap then
    raise exception 'Grupa este plină.';
  end if;
  return new;
end $$;

create trigger enrollments_capacity
before insert or update of group_id on public.enrollments
for each row execute function public.check_capacity();

-- Securitate (Row Level Security)
alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.children enable row level security;
alter table public.enrollments enable row level security;
alter table public.cancelled_lessons enable row level security;

create policy "profil propriu sau admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy "profil propriu editabil" on public.profiles
  for update using (id = auth.uid());
revoke update on public.profiles from authenticated;
grant update (full_name, phone) on public.profiles to authenticated;

create policy "grupe vizibile tuturor" on public.groups for select using (true);
create policy "grupe gestionate de admin" on public.groups
  for all using (public.is_admin()) with check (public.is_admin());

create policy "copii: părintele sau admin" on public.children
  for all using (parent_id = auth.uid() or public.is_admin())
  with check (parent_id = auth.uid() or public.is_admin());

create policy "înscrieri: părintele sau admin" on public.enrollments
  for all using (
    public.is_admin() or exists (
      select 1 from public.children c where c.id = child_id and c.parent_id = auth.uid())
  ) with check (
    public.is_admin() or exists (
      select 1 from public.children c where c.id = child_id and c.parent_id = auth.uid())
  );

create policy "lecții închise vizibile tuturor" on public.cancelled_lessons for select using (true);
create policy "lecții închise gestionate de admin" on public.cancelled_lessons
  for all using (public.is_admin()) with check (public.is_admin());

-- După ce îți faci cont pe site, fă-te administrator (înlocuiește emailul):
-- update public.profiles set is_admin = true where email = 'emailul-tau@exemplu.com';
