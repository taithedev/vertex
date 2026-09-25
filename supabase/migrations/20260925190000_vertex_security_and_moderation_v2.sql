drop function if exists public.vertex_purchase_item(uuid);

create or replace function private.vertex_purchase_item(uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  p_item_id alias for $1;
  caller uuid := auth.uid();
  item_price bigint;
  item_status text;
  already_owned boolean;
  old_balance bigint;
begin
  if caller is null then raise exception 'Authentication is required.'; end if;
  select price, status into item_price, item_status
  from public.vertex_marketplace_items where id=p_item_id for update;
  if item_status is null or item_status <> 'published' then raise exception 'Marketplace item is not available.'; end if;
  select exists(select 1 from public.vertex_inventory where user_id=caller and item_id=p_item_id) into already_owned;
  if already_owned then return jsonb_build_object('ok',true,'owned',true,'price',item_price); end if;
  select balance into old_balance from public.vertex_currency_accounts where user_id=caller for update;
  if old_balance is null then insert into public.vertex_currency_accounts(user_id,balance) values(caller,0); old_balance:=0; end if;
  if old_balance < item_price then raise exception 'Insufficient Vertex currency.'; end if;
  update public.vertex_currency_accounts set balance=old_balance-item_price,updated_at=now() where user_id=caller;
  insert into public.vertex_currency_transactions(user_id,delta,reason,reference_type,reference_id) values(caller,-item_price,'marketplace_purchase','marketplace_item',p_item_id);
  insert into public.vertex_marketplace_purchases(buyer_id,item_id,price) values(caller,p_item_id,item_price);
  insert into public.vertex_inventory(user_id,item_id) values(caller,p_item_id);
  return jsonb_build_object('ok',true,'owned',true,'price',item_price,'balance',old_balance-item_price);
end;
$$;
revoke all on function private.vertex_purchase_item(uuid) from public;
grant execute on function private.vertex_purchase_item(uuid) to authenticated;

create or replace function public.vertex_purchase_item(p_item_id uuid)
returns jsonb
language sql
security invoker
set search_path = public, pg_catalog
as $$ select private.vertex_purchase_item(p_item_id); $$;
revoke all on function public.vertex_purchase_item(uuid) from public;
grant execute on function public.vertex_purchase_item(uuid) to authenticated;

create table if not exists public.vertex_user_moderation (
  user_id uuid primary key references auth.users(id) on delete cascade,
  status text not null default 'active' check (status in ('active','muted','suspended','banned')),
  reason text,
  expires_at timestamptz,
  note text,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);
create index if not exists vertex_user_moderation_status on public.vertex_user_moderation(status,expires_at);
alter table public.vertex_user_moderation enable row level security;
create policy "users see own moderation status" on public.vertex_user_moderation for select to authenticated using(user_id=(select auth.uid()));
create policy "staff read moderation states" on public.vertex_user_moderation for select to authenticated using(private.vertex_is_staff('moderate_users'));
create policy "staff manage moderation states" on public.vertex_user_moderation for all to authenticated using(private.vertex_is_staff('moderate_users')) with check(private.vertex_is_staff('moderate_users'));
grant select on public.vertex_user_moderation to authenticated;
grant insert,update,delete on public.vertex_user_moderation to authenticated;