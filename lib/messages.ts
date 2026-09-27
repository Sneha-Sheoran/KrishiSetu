/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Check if the user has at least one unread message from the other person
 * across all conversations they participate in.
 */
export async function checkHasUnreadMessages(
  supabase: any,
  userId: string
): Promise<boolean> {
  try {
    if (!userId) return false

    // 1. Fetch conversations the user participates in (as farmer or buyer)
    const { data: convs, error: convErr } = await supabase
      .from('conversations')
      .select('id')
      .or(`farmer_id.eq.${userId},buyer_id.eq.${userId}`)

    if (convErr || !convs || convs.length === 0) {
      return false
    }

    const convIds = convs.map((c: { id: string }) => c.id).filter(Boolean)
    if (convIds.length === 0) {
      return false
    }

    // 2. Check if there is at least 1 unread message sent by the other party
    const { count, error: msgErr } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .in('conversation_id', convIds)
      .neq('sender_id', userId)
      .is('read_at', null)
      .limit(1)

    if (msgErr) {
      return false
    }

    return (count ?? 0) > 0
  } catch (err) {
    console.error('Error checking unread messages:', err)
    return false
  }
}

/**
 * Mark all unread messages sent by the counterpart in a conversation as read.
 */
export async function markConversationMessagesAsRead(
  supabase: any,
  conversationId: string,
  userId: string
): Promise<void> {
  try {
    if (!conversationId || !userId) return

    await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId)
      .is('read_at', null)
  } catch (err) {
    console.error('Error marking conversation messages as read:', err)
  }
}
