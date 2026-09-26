-- Migration: Unified Farm Transactions and Records Hardening

-- 1. Make farm_id nullable in crops table so farmers can record crops immediately without first configuring a farm
alter table public.crops alter column farm_id drop not null;

-- 2. Create the unified farm financial ledger table (farm_transactions)
-- Note: Leaving public.transactions (marketplace deals) untouched.
create table if not exists public.farm_transactions (
  id uuid default uuid_generate_v4() primary key,
  farmer_id uuid references public.users(id) on delete cascade not null,
  direction text not null check (direction in ('IN', 'OUT')),
  amount numeric not null check (amount > 0),
  category text not null,
  transaction_date date not null default current_date,
  description text,
  related_crop_id uuid references public.crops(id) on delete set null,
  receipt_image_url text,
  source text not null check (source in ('manual', 'ocr')),
  ocr_metadata jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Enable RLS and setup policies for farm_transactions
alter table public.farm_transactions enable row level security;

create policy "Farmers can view their own farm transactions."
  on public.farm_transactions for select
  using (auth.uid() = farmer_id);

create policy "Farmers can insert their own farm transactions."
  on public.farm_transactions for insert
  with check (auth.uid() = farmer_id);

create policy "Farmers can update their own farm transactions."
  on public.farm_transactions for update
  using (auth.uid() = farmer_id);

create policy "Farmers can delete their own farm transactions."
  on public.farm_transactions for delete
  using (auth.uid() = farmer_id);

-- 4. Helpful index for chronological ledger queries
create index if not exists idx_farm_transactions_farmer_date
  on public.farm_transactions (farmer_id, transaction_date desc);
