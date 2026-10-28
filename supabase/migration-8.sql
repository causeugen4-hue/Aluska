-- Alușka Art Studio, pasul 8: conturi și steluțe în Administrare
-- Rulează o singură dată în Supabase > SQL Editor, DUPĂ migration-7.sql.

-- Soldul de steluțe al fiecărui cont (doar pentru administrator)
create or replace function public.admin_star_balances()
returns table(parent_id uuid, balance int)
language sql security definer stable set search_path = public as $$
  select l.parent_id, coalesce(sum(l.amount), 0)::int
  from public.star_ledger l
  where public.is_admin()
  group by l.parent_id
$$;
revoke execute on function public.admin_star_balances() from public, anon;
grant execute on function public.admin_star_balances() to authenticated;

-- Adaugă (număr pozitiv) sau scoate (număr negativ) steluțe; soldul nu poate ajunge sub 0
create or replace function public.admin_adjust_stars(p_parent uuid, p_amount int, p_reason text)
returns int
language plpgsql security definer set search_path = public as $$
declare bal int;
begin
  if not public.is_admin() then raise exception 'Doar administratorul poate schimba steluțele.'; end if;
  if p_amount is null or p_amount = 0 then raise exception 'Scrie un număr diferit de 0.'; end if;
  perform 1 from public.profiles where id = p_parent for update;
  if not found then raise exception 'Contul nu există.'; end if;
  select coalesce(sum(amount), 0) into bal from public.star_ledger where parent_id = p_parent;
  if bal + p_amount < 0 then raise exception 'Părintele are doar % steluțe.', bal; end if;
  insert into public.star_ledger (parent_id, amount, reason)
  values (
    p_parent, p_amount,
    coalesce(nullif(trim(p_reason), ''),
      case when p_amount > 0 then 'Steluțe adăugate de administrator' else 'Steluțe scoase de administrator' end)
  );
  return bal + p_amount;
end $$;
revoke execute on function public.admin_adjust_stars(uuid, int, text) from public, anon;
grant execute on function public.admin_adjust_stars(uuid, int, text) to authenticated;
