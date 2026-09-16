'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function createListing(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  const crop_name = formData.get('crop_name') as string
  const variety = formData.get('variety') as string
  const quantity = formData.get('quantity') as string
  const unit = formData.get('unit') as string
  const expected_price = formData.get('expected_price') as string
  const quality_grade = formData.get('quality_grade') as string
  const harvest_date = formData.get('harvest_date') as string
  const location_text = formData.get('location_text') as string
  const description = formData.get('description') as string

  const { data, error } = await supabase.from('marketplace_listings').insert({
    farmer_id: user.id,
    crop_name,
    variety: variety || null,
    quantity: parseFloat(quantity),
    unit,
    expected_price: parseFloat(expected_price),
    quality_grade: quality_grade || null,
    harvest_date: harvest_date || null,
    location_text,
    description: description || null,
    status: 'ACTIVE'
  }).select().single()

  if (error) {
    console.error('Error creating listing:', error)
    return { error: 'Failed to create listing. Please try again.' }
  }

  redirect('/marketplace/my-listings')
}

export async function sendEnquiry(listingId: string, farmerId: string) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  // 1. Create a conversation
  const { data: conv, error: convError } = await supabase.from('conversations').insert({
    listing_id: listingId,
    farmer_id: farmerId,
    buyer_id: user.id
  }).select().single()

  if (convError) {
    return { error: 'Failed to create enquiry.' }
  }

  // 2. Add initial system/automated message
  const { error: msgError } = await supabase.from('messages').insert({
    conversation_id: conv.id,
    sender_id: user.id,
    message: 'I am interested in your produce. Is it still available?'
  })

  if (msgError) {
    return { error: 'Enquiry created but failed to send initial message.' }
  }

  redirect(`/messages/${conv.id}`)
}
