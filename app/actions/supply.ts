'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export interface SupplyActionResult {
  success?: boolean
  error?: string
}

export async function offerToSupply(
  requirementId: string,
  listingId?: string
): Promise<SupplyActionResult | void> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Authentication required' }
  }

  // Verify role is FARMER
  const role = user.user_metadata?.role || (user as any).role
  if (role !== 'FARMER') {
    return { error: 'Only farmers can respond to buyer requirements' }
  }

  // 1. Fetch requirement
  const { data: requirement, error: reqError } = await supabase
    .from('buyer_requirements')
    .select('*')
    .eq('id', requirementId)
    .single()

  if (reqError || !requirement) {
    return { error: 'Requirement not found' }
  }

  if (requirement.status !== 'ACTIVE') {
    return { error: 'This requirement is no longer active' }
  }

  if (requirement.required_by) {
    const reqDate = new Date(requirement.required_by)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (reqDate < today) {
      return { error: 'This requirement has expired' }
    }
  }

  // 2. Fetch authoritative buyer user_id from buyers table
  const { data: buyer, error: buyerError } = await supabase
    .from('buyers')
    .select('id, user_id')
    .eq('id', requirement.buyer_id)
    .single()

  if (buyerError || !buyer?.user_id) {
    return { error: 'Buyer details could not be resolved' }
  }

  const buyerUserId = buyer.user_id

  // 3. If listingId provided, verify it belongs to this farmer and is ACTIVE
  let listingData: any = null
  if (listingId && listingId.trim() !== '') {
    const { data: listing, error: listingErr } = await supabase
      .from('marketplace_listings')
      .select('*')
      .eq('id', listingId)
      .eq('farmer_id', user.id)
      .eq('status', 'ACTIVE')
      .single()

    if (listingErr || !listing) {
      return { error: 'Selected produce listing is invalid or no longer active' }
    }
    listingData = listing
  }

  let conversationId: string | null = null

  // 4. Check for existing conversation (Idempotency)
  try {
    const { data: existingConv } = await supabase
      .from('conversations')
      .select('id')
      .eq('requirement_id', requirementId)
      .eq('farmer_id', user.id)
      .maybeSingle()

    if (existingConv?.id) {
      conversationId = existingConv.id
    } else {
      // Create new conversation
      const { data: newConv, error: createError } = await supabase
        .from('conversations')
        .insert({
          requirement_id: requirementId,
          listing_id: null,
          farmer_id: user.id,
          buyer_id: buyerUserId
        })
        .select('id')
        .single()

      if (createError) {
        // Unique violation race condition check
        const { data: retryConv } = await supabase
          .from('conversations')
          .select('id')
          .eq('requirement_id', requirementId)
          .eq('farmer_id', user.id)
          .maybeSingle()

        if (retryConv?.id) {
          conversationId = retryConv.id
        } else {
          return { error: createError.message || 'Failed to start conversation' }
        }
      } else {
        conversationId = newConv.id

        // Format and send initial message
        const messageText = listingData
          ? `I can supply ${requirement.crop}. I have ${listingData.quantity} ${listingData.unit} at ₹${listingData.expected_price} per ${listingData.unit}.`
          : `I can supply ${requirement.crop}. Please tell me your requirements.`

        await supabase.from('messages').insert({
          conversation_id: conversationId,
          sender_id: user.id,
          message: messageText
        })
      }
    }
  } catch (err: any) {
    if (err?.digest?.startsWith?.('NEXT_REDIRECT')) {
      throw err
    }
    return { error: err.message || 'An unexpected error occurred' }
  }

  // 5. Redirect outside try/catch
  if (conversationId) {
    redirect(`/messages/${conversationId}`)
  }
}
