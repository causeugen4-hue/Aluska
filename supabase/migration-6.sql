-- Alușka Art Studio, pasul 6: imagini din Administrare (logo, poza de la început) + maximum 5 copii pe grupă
-- Rulează o singură dată în Supabase > SQL Editor, DUPĂ migration-5.sql.

-- 1. Maximum 5 copii într-o grupă
update public.groups set capacity = 5 where capacity > 5;
alter table public.groups alter column capacity set default 5;
alter table public.groups drop constraint if exists groups_capacity_max;
alter table public.groups add constraint groups_capacity_max check (capacity between 1 and 5);

-- 2. Imaginile site-ului (logo și poza de la începutul paginii); fișierele stau în bucket-ul „gallery”
create table if not exists public.site_images (
  key text primary key check (key in ('logo', 'hero')),
  path text not null,
  updated_at timestamptz not null default now()
);
alter table public.site_images enable row level security;
drop policy if exists "imagini site vizibile tuturor" on public.site_images;
drop policy if exists "imagini site gestionate de admin" on public.site_images;
create policy "imagini site vizibile tuturor" on public.site_images for select using (true);
create policy "imagini site gestionate de admin" on public.site_images
  for all using (public.is_admin()) with check (public.is_admin());
