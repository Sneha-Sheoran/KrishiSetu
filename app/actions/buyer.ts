'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

const ALLOWED_UNITS = ['Kg', 'Quintal', 'Tons', 'Box', 'Crate', 'Dozen']
const ALLOWED_STATUSES = ['ACTIVE', 'FULFILLED', 'CANCELLED'] as const

interface RequirementInputValidation {
  crop: string
  required_quantity: number
  unit: string
  target_price: number
  required_by: string
  location: string
}

async function validateRequirementInput(formData: FormData): Promise<{
  data?: RequirementInputValidation
  error?: string
}> {
  const t = await getTranslations('Errors')

  const crop = ((formData.get('crop') || formData.get('crop_name')) as string)?.trim()
  if (!crop) {
    return { error: t('cropRequired') }
  }

  const rawQuantity = formData.get('required_quantity') || formData.get('quantity')
  const quantity = parseFloat(rawQuantity as string)
  if (isNaN(quantity) || quantity <= 0) {
    return { error: t('positiveQuantity') }
  }

  const unit = (formData.get('unit') as string)?.trim()
  if (!unit || !ALLOWED_UNITS.includes(unit)) {
    return { error: `Unit must be one of: ${ALLOWED_UNITS.join(', ')}.` }
  }

  const rawPrice = formData.get('target_price') as string
  const target_price = parseFloat(rawPrice)
  if (isNaN(target_price) || target_price < 0) {
    return { error: t('validTargetPrice') }
  }

  const rawDate = (formData.get('required_by') as string)?.trim()
  if (!rawDate) {
    return { error: t('requiredByMandatory') }
  }

  const parsedDate = new Date(rawDate)
  if (isNaN(parsedDate.getTime())) {
    return { error: t('validHarvestDate') }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  parsedDate.setHours(0, 0, 0, 0)
  if (parsedDate < today) {
    return { error: t('requiredByPast') }
  }

  const location = (formData.get('location') as string)?.trim()
  if (!location) {
    return { error: t('deliveryLocationRequired') }
  }

  return {
    data: {
      crop,
      required_quantity: quantity,
      unit,
      target_price,
      required_by: rawDate,
      location
    }
  }
}

export async function createRequirement(formData: FormData) {
  const t = await getTranslations('Errors')
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  // Authoritatively check role from users table
  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userProfile?.role !== 'BUYER') {
    return { error: t('buyerOnly') }
  }

  // Look up buyer row in buyers table (buyer_requirements.buyer_id references buyers.id)
  const { data: buyer, error: buyerError } = await supabase
    .from('buyers')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (buyerError || !buyer) {
    return { error: t('buyerProfileNotFound') }
  }

  const validation = await validateRequirementInput(formData)
  if (validation.error || !validation.data) {
    return { error: validation.error }
  }

  const { error: insertError } = await supabase
    .from('buyer_requirements')
    .insert({
      buyer_id: buyer.id,
      crop: validation.data.crop,
      required_quantity: validation.data.required_quantity,
      unit: validation.data.unit,
      target_price: validation.data.target_price,
      required_by: validation.data.required_by,
      location: validation.data.location,
      status: 'ACTIVE'
    })
    .select()
    .single()

  if (insertError) {
    console.error('Error creating requirement:', insertError)
    return { error: t('failedCreateRequirement') }
  }

  revalidatePath('/buyer')
  redirect('/buyer')
}

export async function setRequirementStatus(
  requirementId: string,
  status: 'ACTIVE' | 'FULFILLED' | 'CANCELLED'
) {
  const t = await getTranslations('Errors')
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  if (!ALLOWED_STATUSES.includes(status)) {
    return { error: t('genericError') }
  }

  // Look up buyer's buyers table row
  const { data: buyer, error: buyerError } = await supabase
    .from('buyers')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (buyerError || !buyer) {
    return { error: t('buyerProfileNotFound') }
  }

  // Fetch requirement and verify ownership
  const { data: requirement, error: reqError } = await supabase
    .from('buyer_requirements')
    .select('id, buyer_id, status')
    .eq('id', requirementId)
    .maybeSingle()

  if (reqError || !requirement) {
    return { error: t('requirementNotFound') }
  }

  if (requirement.buyer_id !== buyer.id) {
    return { error: t('notAuthorizedRequirement') }
  }

  const { error: updateError } = await supabase
    .from('buyer_requirements')
    .update({ status })
    .eq('id', requirementId)

  if (updateError) {
    console.error('Error updating requirement status:', updateError)
    return { error: t('failedUpdateRequirement') }
  }

  revalidatePath('/buyer')
  return { success: true }
}

export async function cancelRequirement(requirementId: string) {
  return setRequirementStatus(requirementId, 'CANCELLED')
}
