-- Migration: 20260920170000_listing_visibility.sql
-- Description: Scoped visibility for active listings:
-- - Everyone (buyers, admins, anonymous/logged-out visitors) can view all ACTIVE listings.
-- - Farmers can only view their own listings (enforced in both public listing view and my-listings).
-- - "Farmers can manage their own listings" remains in place for farmers to manage their own records.
-- - Helper function public.current_user_role() is defined with SECURITY DEFINER to avoid recursive RLS on users table.
-- - Existing conversations joins and public_users view continue to work seamlessly.

-- 1. Helper function to fetch current user's role securely without triggering RLS recursion
create or replace function public.current_user_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role from public.users where id = auth.uid();
$$;

grant execute on function public.current_user_role() to anon, authenticated;

-- 2. Drop the overly broad select policy on marketplace_listings
drop policy if exists "Anyone can view active listings." on public.marketplace_listings;
drop policy if exists "Anyone can view active listings" on public.marketplace_listings;
drop policy if exists "View active listings" on public.marketplace_listings;

-- 3. Create scoped select policy on marketplace_listings
-- Allows viewing ACTIVE listings for:
--   a) Anonymous (logged-out) visitors (auth.uid() is null)
--   b) Users whose role is NOT 'FARMER' (e.g. 'BUYER', 'ADMIN')
--   c) Farmers viewing their own listings (auth.uid() = farmer_id)
-- Also allows viewing any listing linked to a conversation in which the user is involved (counterparts join)
create policy "Scoped active listings visibility" on public.marketplace_listings
  for select
  using (
    (
      status = 'ACTIVE'
      and (
        auth.uid() is null
        or public.current_user_role() is distinct from 'FARMER'
        or auth.uid() = farmer_id
      )
    )
    or exists (
      select 1 from public.conversations c
      where c.listing_id = marketplace_listings.id
        and (c.buyer_id = auth.uid() or c.farmer_id = auth.uid())
    )
  );
