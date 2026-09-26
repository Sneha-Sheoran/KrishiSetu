'use server'

import { createClient } from '@/utils/supabase/server'

export interface MarkAsReadResult {
  success: boolean
  updatedCount?: number
  error?: string
}

/**
 * Server Action: Mark all unread messages sent by the counterpart in a conversation as read.
 * Runs on the server with user authentication and participant verification.
 */
export async function markConversationAsRead(
  conversationId: string
): Promise<MarkAsReadResult> {
  if (!conversationId || typeof conversationId !== 'string') {
    return { success: false, error: 'Invalid conversation ID' }
  }

  try {
    const supabase = await createClient()

    // 1. Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    // 2. Verify user is a participant in this conversation (farmer or buyer)
    const { data: conv, error: convError } = await supabase
      .from('conversations')
      .select('id, farmer_id, buyer_id')
      .eq('id', conversationId)
      .single()

    if (convError || !conv) {
      return { success: false, error: 'Conversation not found' }
    }

    const isParticipant = conv.farmer_id === user.id || conv.buyer_id === user.id
    if (!isParticipant) {
      return { success: false, error: 'User is not a participant in this conversation' }
    }

    // 3. Update unread messages sent by the OTHER person
    const { count, error: updateError } = await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .neq('sender_id', user.id)
      .is('read_at', null)

    if (updateError) {
      console.error('Error updating message read status:', updateError)
      return { success: false, error: updateError.message }
    }

    return { success: true, updatedCount: count ?? 0 }
  } catch (err: any) {
    console.error('Exception in markConversationAsRead:', err)
    return { success: false, error: err?.message || 'Internal error' }
  }
}
