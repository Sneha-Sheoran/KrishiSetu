-- Migration: 20260926170000_message_read_status.sql
-- Description: Add performance indexes for unread message count and RLS update policy for read_at

-- 1. Performance indexes for conversation lookup by participant
create index if not exists idx_conversations_farmer_id on public.conversations(farmer_id);
create index if not exists idx_conversations_buyer_id on public.conversations(buyer_id);

-- 2. Partial index targeting unread messages for instant unread badge checks
create index if not exists idx_messages_unread on public.messages(conversation_id, sender_id)
  where read_at is null;

-- 3. RLS update policy to allow participants to mark messages in their conversations as read
create policy "Recipient can mark messages as read." on public.messages for update
using (
  auth.uid() in (select farmer_id from public.conversations where id = conversation_id) or
  auth.uid() in (select buyer_id from public.conversations where id = conversation_id)
)
with check (
  auth.uid() in (select farmer_id from public.conversations where id = conversation_id) or
  auth.uid() in (select buyer_id from public.conversations where id = conversation_id)
);
