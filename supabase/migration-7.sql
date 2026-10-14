-- Alușka Art Studio, pasul 7: stil de sărbătoare ales pentru anumite zile
-- Rulează o singură dată în Supabase > SQL Editor, DUPĂ migration-6.sql.
-- (Dacă ai rulat deja o versiune anterioară a acestui fișier, rulează-l și pe acesta: nu strică nimic.)

create table if not exists public.day_themes (
  lesson_date date primary key,
  theme text not null,
  created_at timestamptz not null default now()
);
alter table public.day_themes enable row level security;
drop policy if exists "teme zile vizibile tuturor" on public.day_themes;
drop policy if exists "teme zile gestionate de admin" on public.day_themes;
create policy "teme zile vizibile tuturor" on public.day_themes for select using (true);
create policy "teme zile gestionate de admin" on public.day_themes
  for all using (public.is_admin()) with check (public.is_admin());
