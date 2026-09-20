-- Migration: 20260920200000_requirement_conversations.sql
-- Description: Enable requirement-backed conversations between farmers and buyers.

-- 1. Alter conversations table
-- Make listing_id nullable
alter table public.conversations
  alter column listing_id drop not null;

-- Add requirement_id column with foreign key to buyer_requirements(id)
alter table public.conversations
  add column if not exists requirement_id uuid references public.buyer_requirements(id) on delete cascade;

-- Check constraint: exactly one of listing_id or requirement_id must be set
alter table public.conversations
  drop constraint if exists check_conversation_source;

alter table public.conversations
  add constraint check_conversation_source check (
    (listing_id is not null and requirement_id is null) or
    (listing_id is null and requirement_id is not null)
  );

-- Unique constraint on (requirement_id, farmer_id)
alter table public.conversations
  drop constraint if exists conversations_requirement_id_farmer_id_key;

alter table public.conversations
  add constraint conversations_requirement_id_farmer_id_key unique (requirement_id, farmer_id);

-- 2. RLS policy on conversations for farmers responding to requirements
drop policy if exists "Farmers can create requirement conversations" on public.conversations;

create policy "Farmers can create requirement conversations" on public.conversations
  for insert
  with check (
    requirement_id is not null
    and listing_id is null
    and farmer_id = auth.uid()
    and public.current_user_role() = 'FARMER'
    and exists (
      select 1 from public.buyer_requirements r
      join public.buyers b on b.id = r.buyer_id
      where r.id = conversations.requirement_id
        and r.status = 'ACTIVE'
        and b.user_id = conversations.buyer_id
    )
  );

-- 3. Extend public_buyers view
-- Exposes buyer row when buyer has at least one ACTIVE buyer_requirements row
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
    )
    or exists (
      select 1 from public.buyer_requirements r
      where r.buyer_id = b.id
        and r.status = 'ACTIVE'
    );

revoke all on public.public_buyers from anon;
grant select on public.public_buyers to authenticated;
