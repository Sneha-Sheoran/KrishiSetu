-- Migration: 20260919180000_marketplace_phase1.sql
-- Description: Safe public views for user profiles and buyer business profiles.
-- Fixes RLS restrictions so listing pages can display seller names and verified badges,
-- and conversations can display buyer business names without exposing sensitive columns.

-- 1. Safe public view for user profiles (farmers & counterparts)
-- Exposes id, name, verification_status (role dropped).
-- Only includes farmers, conversation counterparts with auth.uid(), or the user themselves.
drop view if exists public.public_users cascade;

create view public.public_users with (security_invoker = false) as
  select
    u.id,
    u.name,
    u.verification_status
  from public.users u
  where
    u.role = 'FARMER'
    or u.id = auth.uid()
    or exists (
      select 1 from public.conversations c
      where (c.farmer_id = auth.uid() and c.buyer_id = u.id)
         or (c.buyer_id = auth.uid() and c.farmer_id = u.id)
    );

-- Grant access to anonymous and authenticated users (to view farmer names on listings)
grant select on public.public_users to anon, authenticated;

-- 2. Safe public view for buyer business profiles
-- Exposes id, user_id, business_name, buyer_type, state, district, verification_status.
-- Only includes verified buyers, the buyer themselves (user_id = auth.uid()),
-- or buyers in a conversation where auth.uid() is the farmer.
drop view if exists public.public_buyers cascade;

create view public.public_buyers with (security_invoker = false) as
  select
    b.id,
    b.user_id,
    b.business_name,
    b.buyer_type,
    b.state,
    b.district,
    b.verification_status
  from public.buyers b
  where
    b.verification_status = 'VERIFIED'
    or b.user_id = auth.uid()
    or exists (
      select 1 from public.conversations c
      where c.farmer_id = auth.uid()
        and c.buyer_id = b.user_id
    );

-- Revoke all from anon, grant select to authenticated only
revoke all on public.public_buyers from anon;
grant select on public.public_buyers to authenticated;

-- 3. Unique constraint on conversations (listing_id, buyer_id)
-- Step 1: Reassign messages from duplicate conversations to the kept oldest conversation
-- so that messages are preserved and not cascade-deleted.
with ranked_conversations as (
  select
    id,
    first_value(id) over (
      partition by listing_id, buyer_id
      order by created_at asc, id asc
    ) as kept_id
  from public.conversations
)
update public.messages m
set conversation_id = rc.kept_id
from ranked_conversations rc
where m.conversation_id = rc.id
  and rc.id != rc.kept_id;

-- Step 2: Safely delete duplicate conversations, keeping the oldest record (earliest created_at).
delete from public.conversations c1
using public.conversations c2
where c1.listing_id = c2.listing_id
  and c1.buyer_id = c2.buyer_id
  and (c1.created_at > c2.created_at or (c1.created_at = c2.created_at and c1.id > c2.id));

-- Step 3: Add unique constraint on (listing_id, buyer_id)
alter table public.conversations
  drop constraint if exists conversations_listing_id_buyer_id_key;

alter table public.conversations
  add constraint conversations_listing_id_buyer_id_key unique (listing_id, buyer_id);

