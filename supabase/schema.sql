-- Supabase Schema for KrishiSetu

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- USERS TABLE
create table public.users (
  id uuid references auth.users not null primary key,
  role text not null check (role in ('FARMER', 'BUYER', 'ADMIN')),
  name text,
  phone text,
  email text,
  language text default 'en',
  verification_status text default 'PENDING' check (verification_status in ('PENDING', 'VERIFIED', 'REJECTED')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- FARMS TABLE
create table public.farms (
  id uuid default uuid_generate_v4() primary key,
  farmer_id uuid references public.users(id) on delete cascade not null,
  farm_name text not null,
  village text,
  district text,
  state text,
  latitude numeric,
  longitude numeric,
  area numeric,
  area_unit text,
  soil_type text,
  soil_ph numeric,
  irrigation_type text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- CROPS TABLE
create table public.crops (
  id uuid default uuid_generate_v4() primary key,
  farm_id uuid references public.farms(id) on delete cascade not null,
  farmer_id uuid references public.users(id) on delete cascade not null,
  crop_name text not null,
  variety text,
  season text,
  sowing_date date,
  expected_harvest_date date,
  actual_harvest_date date,
  area numeric,
  expected_yield numeric,
  actual_yield numeric,
  status text default 'PLANTED' check (status in ('PLANTED', 'HARVESTED', 'FAILED')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- EXPENSES TABLE
create table public.expenses (
  id uuid default uuid_generate_v4() primary key,
  farmer_id uuid references public.users(id) on delete cascade not null,
  farm_id uuid references public.farms(id) on delete cascade,
  crop_id uuid references public.crops(id) on delete cascade,
  category text not null check (category in ('Seeds', 'Fertilizer', 'Pesticide', 'Labour', 'Irrigation', 'Machinery', 'Transport', 'Other')),
  description text,
  amount numeric not null,
  date date not null,
  receipt_id uuid, -- will reference receipts later
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- HARVESTS TABLE
create table public.harvests (
  id uuid default uuid_generate_v4() primary key,
  farmer_id uuid references public.users(id) on delete cascade not null,
  crop_id uuid references public.crops(id) on delete cascade not null,
  harvest_date date not null,
  quantity numeric not null,
  unit text not null,
  quality_grade text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RECEIPTS TABLE
create table public.receipts (
  id uuid default uuid_generate_v4() primary key,
  farmer_id uuid references public.users(id) on delete cascade not null,
  image_url text not null,
  ocr_status text default 'PROCESSING' check (ocr_status in ('PROCESSING', 'NEEDS_REVIEW', 'VERIFIED', 'FAILED')),
  receipt_date date,
  market text,
  commodity text,
  variety text,
  quantity numeric,
  unit text,
  price_per_unit numeric,
  gross_amount numeric,
  commission numeric,
  deductions numeric,
  net_amount numeric,
  verification_status text default 'PENDING',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- add foreign key for receipt to expenses now that receipts exist
alter table public.expenses
  add constraint expenses_receipt_id_fkey foreign key (receipt_id) references public.receipts(id) on delete set null;

-- MARKETPLACE LISTINGS TABLE
create table public.marketplace_listings (
  id uuid default uuid_generate_v4() primary key,
  farmer_id uuid references public.users(id) on delete cascade not null,
  crop_name text not null,
  variety text,
  quantity numeric not null,
  unit text not null,
  expected_price numeric not null,
  quality_grade text,
  harvest_date date,
  available_from date,
  available_until date,
  latitude numeric,
  longitude numeric,
  location_text text,
  description text,
  image_url text,
  status text default 'ACTIVE' check (status in ('ACTIVE', 'PAUSED', 'SOLD', 'DELETED')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- BUYERS TABLE
create table public.buyers (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  business_name text not null,
  buyer_type text not null check (buyer_type in ('Processor', 'FPO', 'Retailer', 'Institution', 'Wholesaler')),
  contact_person text not null,
  phone text,
  email text,
  address text,
  state text,
  district text,
  gstin text,
  verification_status text default 'PENDING' check (verification_status in ('PENDING', 'VERIFIED', 'REJECTED')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- BUYER REQUIREMENTS TABLE
create table public.buyer_requirements (
  id uuid default uuid_generate_v4() primary key,
  buyer_id uuid references public.buyers(id) on delete cascade not null,
  crop text not null,
  required_quantity numeric,
  unit text,
  target_price numeric,
  required_by date,
  location text,
  status text default 'ACTIVE' check (status in ('ACTIVE', 'FULFILLED', 'CANCELLED')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- TRANSACTIONS TABLE
create table public.transactions (
  id uuid default uuid_generate_v4() primary key,
  farmer_id uuid references public.users(id) on delete set null,
  buyer_id uuid references public.users(id) on delete set null,
  listing_id uuid references public.marketplace_listings(id) on delete set null,
  crop text not null,
  quantity numeric not null,
  unit text not null,
  agreed_price numeric not null,
  total_amount numeric not null,
  status text default 'PENDING' check (status in ('PENDING', 'ACCEPTED', 'COMPLETED', 'CANCELLED')),
  payment_status text default 'PENDING' check (payment_status in ('PENDING', 'PAID', 'PARTIAL')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- CONVERSATIONS TABLE
create table public.conversations (
  id uuid default uuid_generate_v4() primary key,
  listing_id uuid references public.marketplace_listings(id) on delete cascade not null,
  farmer_id uuid references public.users(id) on delete cascade not null,
  buyer_id uuid references public.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- MESSAGES TABLE
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  sender_id uuid references public.users(id) on delete cascade not null,
  message text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  read_at timestamp with time zone
);


-- SETTING UP ROW LEVEL SECURITY (RLS)

-- Enable RLS on all tables
alter table public.users enable row level security;
alter table public.farms enable row level security;
alter table public.crops enable row level security;
alter table public.expenses enable row level security;
alter table public.harvests enable row level security;
alter table public.receipts enable row level security;
alter table public.marketplace_listings enable row level security;
alter table public.buyers enable row level security;
alter table public.buyer_requirements enable row level security;
alter table public.transactions enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- Users can read and update their own user record
create policy "Users can view own record." on public.users for select using (auth.uid() = id);
create policy "Users can update own record." on public.users for update using (auth.uid() = id);

-- Farms
create policy "Farmers can manage their own farms." on public.farms for all using (auth.uid() = farmer_id);

-- Crops
create policy "Farmers can manage their own crops." on public.crops for all using (auth.uid() = farmer_id);

-- Expenses
create policy "Farmers can manage their own expenses." on public.expenses for all using (auth.uid() = farmer_id);

-- Harvests
create policy "Farmers can manage their own harvests." on public.harvests for all using (auth.uid() = farmer_id);

-- Receipts
create policy "Farmers can manage their own receipts." on public.receipts for all using (auth.uid() = farmer_id);

-- Marketplace Listings
create policy "Anyone can view active listings." on public.marketplace_listings for select using (status = 'ACTIVE');
create policy "Farmers can manage their own listings." on public.marketplace_listings for all using (auth.uid() = farmer_id);

-- Buyers
create policy "Anyone can view verified buyers." on public.buyers for select using (verification_status = 'VERIFIED');
create policy "Buyers can manage their own buyer profile." on public.buyers for all using (auth.uid() = user_id);

-- Buyer Requirements
create policy "Anyone can view active requirements." on public.buyer_requirements for select using (status = 'ACTIVE');
create policy "Buyers can manage their own requirements." on public.buyer_requirements for all using (auth.uid() = (select user_id from public.buyers where id = buyer_id));

-- Transactions
create policy "Involved parties can view transactions." on public.transactions for select using (auth.uid() = farmer_id or auth.uid() = buyer_id);
create policy "Farmers can create transactions." on public.transactions for insert with check (auth.uid() = farmer_id);
create policy "Involved parties can update transactions." on public.transactions for update using (auth.uid() = farmer_id or auth.uid() = buyer_id);

-- Conversations
create policy "Involved parties can view conversations." on public.conversations for select using (auth.uid() = farmer_id or auth.uid() = buyer_id);
create policy "Buyers can create conversations." on public.conversations for insert with check (auth.uid() = buyer_id);

-- Messages
create policy "Involved parties can view messages in conversation." on public.messages for select using (
  auth.uid() in (select farmer_id from public.conversations where id = conversation_id) or
  auth.uid() in (select buyer_id from public.conversations where id = conversation_id)
);
create policy "Sender can insert message." on public.messages for insert with check (
  auth.uid() = sender_id and (
    auth.uid() in (select farmer_id from public.conversations where id = conversation_id) or
    auth.uid() in (select buyer_id from public.conversations where id = conversation_id)
  )
);

-- Set up Realtime for messaging
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.conversations;
