-- Alușka Art Studio, pasul 7: stilul de sărbătoare al cardurilor de lecții
-- Rulează o singură dată în Supabase > SQL Editor, DUPĂ migration-6.sql.

create table if not exists public.site_settings (
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now()
);
alter table public.site_settings enable row level security;
drop policy if exists "setări site vizibile tuturor" on public.site_settings;
drop policy if exists "setări site gestionate de admin" on public.site_settings;
create policy "setări site vizibile tuturor" on public.site_settings for select using (true);
create policy "setări site gestionate de admin" on public.site_settings
  for all using (public.is_admin()) with check (public.is_admin());
