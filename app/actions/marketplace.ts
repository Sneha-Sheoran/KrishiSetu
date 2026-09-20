'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getTranslations } from 'next-intl/server'

const ALLOWED_UNITS = ['Kg', 'Quintal', 'Tons', 'Box', 'Crate', 'Dozen']
const ALLOWED_GRADES = ['Grade A', 'Grade B', 'Grade C', 'Standard', 'Organic', 'Ungraded']

interface ListingInputValidation {
  crop_name: string
  variety: string | null
  quantity: number
  unit: string
  expected_price: number
  quality_grade: string | null
  harvest_date: string | null
  location_text: string
  description: string | null
}

async function validateListingInput(formData: FormData): Promise<{ data?: ListingInputValidation; error?: string }> {
  const t = await getTranslations('Errors')

  const crop_name = (formData.get('crop_name') as string)?.trim()
  if (!crop_name) {
    return { error: t('cropRequired') }
  }

  const variety = (formData.get('variety') as string)?.trim() || null

  const rawQuantity = formData.get('quantity') as string
  const quantity = parseFloat(rawQuantity)
  if (isNaN(quantity) || quantity <= 0) {
    return { error: t('positiveQuantity') }
  }

  const unit = (formData.get('unit') as string)?.trim()
  if (!unit || !ALLOWED_UNITS.includes(unit)) {
    return { error: `Unit must be one of: ${ALLOWED_UNITS.join(', ')}.` }
  }

  const rawPrice = formData.get('expected_price') as string
  const expected_price = parseFloat(rawPrice)
  if (isNaN(expected_price) || expected_price <= 0) {
    return { error: t('positivePrice') }
  }

  const rawGrade = (formData.get('quality_grade') as string)?.trim()
  const quality_grade = rawGrade && ALLOWED_GRADES.includes(rawGrade) ? rawGrade : null

  const rawDate = (formData.get('harvest_date') as string)?.trim()
  if (rawDate && isNaN(Date.parse(rawDate))) {
    return { error: t('validHarvestDate') }
  }
  const harvest_date = rawDate || null

  const location_text = (formData.get('location_text') as string)?.trim()
  if (!location_text) {
    return { error: t('locationRequired') }
  }

  const description = (formData.get('description') as string)?.trim() || null

  return {
    data: {
      crop_name,
      variety,
      quantity,
      unit,
      expected_price,
      quality_grade,
      harvest_date,
      location_text,
      description
    }
  }
}

export async function createListing(formData: FormData) {
  const t = await getTranslations('Errors')
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  // Check role from users table (FARMER only)
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'FARMER') {
    return { error: t('farmerOnly') }
  }

  const validation = await validateListingInput(formData)
  if (validation.error || !validation.data) {
    return { error: validation.error }
  }

  const { error } = await supabase.from('marketplace_listings').insert({
    farmer_id: user.id,
    ...validation.data,
    status: 'ACTIVE'
  }).select().single()

  if (error) {
    console.error('Error creating listing:', error)
    return { error: t('failedCreateListing') }
  }

  revalidatePath('/marketplace')
  revalidatePath('/marketplace/my-listings')
  redirect('/marketplace/my-listings')
}

export async function updateListing(listingId: string, formData: FormData) {
  const t = await getTranslations('Errors')
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  // Fetch listing to verify ownership
  const { data: listing, error: fetchError } = await supabase
    .from('marketplace_listings')
    .select('*')
    .eq('id', listingId)
    .maybeSingle()

  if (fetchError || !listing) {
    return { error: t('listingNotFound') }
  }

  if (listing.farmer_id !== user.id) {
    return { error: t('notAuthorizedListing') }
  }

  if (listing.status === 'DELETED') {
    return { error: t('cannotEditDeleted') }
  }

  const validation = await validateListingInput(formData)
  if (validation.error || !validation.data) {
    return { error: validation.error }
  }

  const { error: updateError } = await supabase
    .from('marketplace_listings')
    .update({
      ...validation.data
    })
    .eq('id', listingId)

  if (updateError) {
    console.error('Error updating listing:', updateError)
    return { error: t('failedUpdateListing') }
  }

  revalidatePath('/marketplace')
  revalidatePath('/marketplace/my-listings')
  revalidatePath(`/marketplace/${listingId}`)
  redirect('/marketplace/my-listings')
}

export async function setListingStatus(listingId: string, status: 'ACTIVE' | 'PAUSED' | 'SOLD') {
  const t = await getTranslations('Errors')
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  if (!['ACTIVE', 'PAUSED', 'SOLD'].includes(status)) {
    return { error: t('genericError') }
  }

  const { data: listing, error: fetchError } = await supabase
    .from('marketplace_listings')
    .select('farmer_id, status')
    .eq('id', listingId)
    .maybeSingle()

  if (fetchError || !listing) {
    return { error: t('listingNotFound') }
  }

  if (listing.farmer_id !== user.id) {
    return { error: t('notAuthorizedStatus') }
  }

  if (listing.status === 'DELETED') {
    return { error: t('cannotStatusDeleted') }
  }

  const { error: updateError } = await supabase
    .from('marketplace_listings')
    .update({ status })
    .eq('id', listingId)

  if (updateError) {
    console.error('Error updating listing status:', updateError)
    return { error: t('genericError') }
  }

  revalidatePath('/marketplace')
  revalidatePath('/marketplace/my-listings')
  revalidatePath(`/marketplace/${listingId}`)
  return { success: true }
}

export async function deleteListing(listingId: string) {
  const t = await getTranslations('Errors')
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  const { data: listing, error: fetchError } = await supabase
    .from('marketplace_listings')
    .select('farmer_id, status')
    .eq('id', listingId)
    .maybeSingle()

  if (fetchError || !listing) {
    return { error: t('listingNotFound') }
  }

  if (listing.farmer_id !== user.id) {
    return { error: t('notAuthorizedDelete') }
  }

  // Soft delete: set status to DELETED
  const { error: updateError } = await supabase
    .from('marketplace_listings')
    .update({ status: 'DELETED' })
    .eq('id', listingId)

  if (updateError) {
    console.error('Error deleting listing:', updateError)
    return { error: t('failedDeleteListing') }
  }

  revalidatePath('/marketplace')
  revalidatePath('/marketplace/my-listings')
  revalidatePath(`/marketplace/${listingId}`)
  return { success: true }
}

export async function sendEnquiry(listingId: string) {
  const t = await getTranslations('Errors')
  const tMsg = await getTranslations('Messages')
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  // Fetch listing by listingId to verify existence, status, and authoritative farmer_id
  const { data: listing, error: listingError } = await supabase
    .from('marketplace_listings')
    .select('farmer_id, status')
    .eq('id', listingId)
    .maybeSingle()

  if (listingError || !listing) {
    return { error: t('listingNotFound') }
  }

  if (listing.status !== 'ACTIVE') {
    return { error: t('listingNotActive') }
  }

  const farmerId = listing.farmer_id

  // Prevent farmer from enquiring on their own listing
  if (user.id === farmerId) {
    return { error: t('selfEnquiryNotAllowed') }
  }

  // Check for an existing conversation for (listing_id, buyer_id)
  const { data: existingConv } = await supabase
    .from('conversations')
    .select('id')
    .eq('listing_id', listingId)
    .eq('buyer_id', user.id)
    .maybeSingle()

  if (existingConv?.id) {
    redirect(`/messages/${existingConv.id}`)
  }

  // Attempt to create a new conversation
  let convId: string | null = null
  let isNew = false

  const { data: newConv, error: convError } = await supabase
    .from('conversations')
    .insert({
      listing_id: listingId,
      farmer_id: farmerId,
      buyer_id: user.id
    })
    .select('id')
    .single()

  if (newConv?.id) {
    convId = newConv.id
    isNew = true
  } else if (convError) {
    // Handle race where two concurrent clicks both attempted insert:
    // fetch the existing row created by the winning request
    const { data: racedConv } = await supabase
      .from('conversations')
      .select('id')
      .eq('listing_id', listingId)
      .eq('buyer_id', user.id)
      .maybeSingle()

    if (racedConv?.id) {
      convId = racedConv.id
      isNew = false
    } else {
      console.error('Error creating conversation:', convError)
      return { error: t('failedCreateEnquiry') }
    }
  }

  // Send the "I am interested" first message ONLY when a new conversation is created
  if (isNew && convId) {
    const { error: msgError } = await supabase.from('messages').insert({
      conversation_id: convId,
      sender_id: user.id,
      message: tMsg('defaultEnquiryMessage')
    })

    if (msgError) {
      console.error('Enquiry created but failed to send initial message:', msgError)
    }
  }

  if (convId) {
    redirect(`/messages/${convId}`)
  }

  return { error: t('failedCreateEnquiry') }
}
