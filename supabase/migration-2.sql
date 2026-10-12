-- Alușka Art Studio, pasul 2: rulează tot fișierul în Supabase > SQL Editor (o singură dată)
-- Adaugă: categorii de vârstă, lecții de probă, galerie foto, prezență, steluțe și magazin.

-- 1. Grupe: categorie de vârstă și lecție de probă (trial_date completat = lecție de probă, o singură dată)
alter table public.groups
  add column if not exists age_group text not null default '4-7' check (age_group in ('4-7', '8-12')),
  add column if not exists trial_date date;

-- Înscrierile la o lecție de probă trecută sunt închise
create or replace function public.check_capacity() returns trigger
language plpgsql security definer set search_path = public as $$
declare cap int; cnt int; open_ boolean; tdate date;
begin
  select capacity, is_open, trial_date into cap, open_, tdate from public.groups where id = new.group_id;
  if not public.is_admin() then
    if not open_ then raise exception 'Înscrierile la această grupă sunt închise.'; end if;
    if tdate is not null and tdate < current_date then
      raise exception 'Înscrierile la această grupă sunt închise.';
    end if;
  end if;
  select count(*) into cnt from public.enrollments where group_id = new.group_id and id <> new.id;
  if cnt >= cap then
    raise exception 'Grupa este plină.';
  end if;
  return new;
end $$;

-- 2. Galerie foto
create table if not exists public.gallery_photos (
  id uuid primary key default gen_random_uuid(),
  path text not null,
  caption text not null default '',
  created_at timestamptz not null default now()
);
alter table public.gallery_photos enable row level security;
create policy "galerie vizibilă tuturor" on public.gallery_photos for select using (true);
create policy "galerie gestionată de admin" on public.gallery_photos
  for all using (public.is_admin()) with check (public.is_admin());

insert into storage.buckets (id, name, public) values ('gallery', 'gallery', true)
  on conflict (id) do nothing;
create policy "poze galerie: citire publică" on storage.objects
  for select using (bucket_id = 'gallery');
create policy "poze galerie: admin încarcă" on storage.objects
  for insert to authenticated with check (bucket_id = 'gallery' and public.is_admin());
create policy "poze galerie: admin șterge" on storage.objects
  for delete to authenticated using (bucket_id = 'gallery' and public.is_admin());

-- 3. Prezență și steluțe
create table if not exists public.attendance (
  group_id uuid not null references public.groups(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  lesson_date date not null,
  created_at timestamptz not null default now(),
  primary key (group_id, child_id, lesson_date)
);

create table if not exists public.star_ledger (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.profiles(id) on delete cascade,
  amount int not null,                       -- + câștigat, - cheltuit
  reason text not null default '',
  attendance_key text unique,
  order_id uuid,
  created_at timestamptz not null default now()
);

create or replace function public.award_stars() returns trigger
language plpgsql security definer set search_path = public as $$
declare pid uuid; cname text;
begin
  select parent_id, name into pid, cname from public.children where id = new.child_id;
  if pid is not null then
    insert into public.star_ledger (parent_id, amount, reason, attendance_key)
    values (pid, 5, 'Lecție: ' || cname,
            new.group_id::text || '|' || new.child_id::text || '|' || new.lesson_date::text)
    on conflict (attendance_key) do nothing;
  end if;
  return new;
end $$;

drop trigger if exists attendance_stars on public.attendance;
create trigger attendance_stars after insert on public.attendance
for each row execute function public.award_stars();

alter table public.attendance enable row level security;
alter table public.star_ledger enable row level security;
create policy "prezență gestionată de admin" on public.attendance
  for all using (public.is_admin()) with check (public.is_admin());
create policy "steluțe: ale tale sau admin" on public.star_ledger
  for select using (parent_id = auth.uid() or public.is_admin());
create policy "steluțe: admin șterge" on public.star_ledger
  for delete using (public.is_admin());

create or replace function public.my_stars() returns int
language sql security definer stable set search_path = public as $$
  select coalesce(sum(amount), 0)::int from public.star_ledger where parent_id = auth.uid()
$$;
grant execute on function public.my_stars() to authenticated;

-- 4. Magazin
create table if not exists public.shop_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  price_stars int not null check (price_stars > 0),
  stock int check (stock is null or stock >= 0),   -- null = fără limită
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.shop_orders (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.profiles(id) on delete cascade,
  item_id uuid references public.shop_items(id) on delete set null,
  item_name text not null,
  price_stars int not null,
  status text not null default 'nou' check (status in ('nou', 'predat', 'anulat')),
  created_at timestamptz not null default now()
);

alter table public.shop_items enable row level security;
alter table public.shop_orders enable row level security;
create policy "produse active vizibile" on public.shop_items
  for select using (is_active or public.is_admin());
create policy "produse gestionate de admin" on public.shop_items
  for all using (public.is_admin()) with check (public.is_admin());
create policy "comenzi: ale tale sau admin" on public.shop_orders
  for select using (parent_id = auth.uid() or public.is_admin());
create policy "comenzi: admin actualizează" on public.shop_orders
  for update using (public.is_admin()) with check (public.is_admin());

create or replace function public.buy_item(p_item uuid) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); it public.shop_items; bal int; oid uuid;
begin
  if uid is null then raise exception 'Autentifică-te mai întâi.'; end if;
  perform 1 from public.profiles where id = uid for update;
  select * into it from public.shop_items where id = p_item for update;
  if not found or not it.is_active then raise exception 'Produsul nu mai este disponibil.'; end if;
  if it.stock is not null and it.stock <= 0 then raise exception 'Produsul nu mai este în stoc.'; end if;
  select coalesce(sum(amount), 0) into bal from public.star_ledger where parent_id = uid;
  if bal < it.price_stars then raise exception 'Nu ai destule steluțe.'; end if;
  insert into public.shop_orders (parent_id, item_id, item_name, price_stars)
    values (uid, it.id, it.name, it.price_stars) returning id into oid;
  insert into public.star_ledger (parent_id, amount, reason, order_id)
    values (uid, -it.price_stars, 'Magazin: ' || it.name, oid);
  if it.stock is not null then
    update public.shop_items set stock = stock - 1 where id = it.id;
  end if;
end $$;
revoke execute on function public.buy_item(uuid) from public, anon;
grant execute on function public.buy_item(uuid) to authenticated;

create or replace function public.cancel_order(p_order uuid) returns void
language plpgsql security definer set search_path = public as $$
declare o public.shop_orders;
begin
  if not public.is_admin() then raise exception 'Nu ai acces.'; end if;
  select * into o from public.shop_orders where id = p_order for update;
  if not found then return; end if;
  if o.status <> 'nou' then raise exception 'Doar comenzile noi pot fi anulate.'; end if;
  update public.shop_orders set status = 'anulat' where id = o.id;
  insert into public.star_ledger (parent_id, amount, reason, order_id)
    values (o.parent_id, o.price_stars, 'Returnat: ' || o.item_name, o.id);
  if o.item_id is not null then
    update public.shop_items set stock = stock + 1 where id = o.item_id and stock is not null;
  end if;
end $$;
revoke execute on function public.cancel_order(uuid) from public, anon;
grant execute on function public.cancel_order(uuid) to authenticated;
