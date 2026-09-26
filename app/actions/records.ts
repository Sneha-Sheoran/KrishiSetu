/* eslint-disable @typescript-eslint/no-explicit-any */
'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { getTranslations } from 'next-intl/server'

export interface CropItem {
  id: string
  farm_id?: string | null
  farmer_id: string
  crop_name: string
  variety?: string | null
  season?: string | null
  sowing_date?: string | null
  expected_harvest_date?: string | null
  actual_harvest_date?: string | null
  area?: number | null
  expected_yield?: number | null
  actual_yield?: number | null
  status: 'PLANTED' | 'HARVESTED' | 'FAILED'
  created_at: string
}

export interface HarvestItem {
  id: string
  farmer_id: string
  crop_id: string
  crop_name?: string
  harvest_date: string
  quantity: number
  unit: string
  quality_grade?: string | null
  created_at: string
}

export interface TransactionItem {
  id: string
  farmer_id: string
  direction: 'IN' | 'OUT'
  amount: number
  category: string
  transaction_date: string
  description?: string | null
  related_crop_id?: string | null
  related_crop_name?: string | null
  receipt_image_url?: string | null
  source: 'manual' | 'ocr'
  ocr_metadata?: any | null
  created_at: string
}

/**
 * Internal helper to authenticate and ensure the caller is a FARMER.
 * Returns { user, profile } if valid, or null.
 */
async function getAuthenticatedFarmer() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return null
  }

  const { data: profile } = await supabase
    .from('users')
    .select('id, role')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile || profile.role !== 'FARMER') {
    return null
  }

  return { supabase, user, profile }
}

// ==========================================
// CROPS
// ==========================================

export async function getCrops(): Promise<CropItem[]> {
  const auth = await getAuthenticatedFarmer()
  if (!auth) {
    return []
  }

  const { supabase, user } = auth
  const { data: crops, error } = await supabase
    .from('crops')
    .select('*')
    .eq('farmer_id', user.id)
    .order('created_at', { ascending: false })

  if (error || !crops) {
    console.error('Error fetching crops:', error)
    return []
  }

  return crops as CropItem[]
}

export async function addCrop(formData: FormData): Promise<{ success?: boolean; data?: CropItem; error?: string }> {
  const t = await getTranslations('Errors')
  const auth = await getAuthenticatedFarmer()
  if (!auth) {
    return { error: 'Unauthorized: Only registered farmers can add crops.' }
  }

  const { supabase, user } = auth

  const cropName = (formData.get('crop_name') as string)?.trim()
  if (!cropName) {
    return { error: t('cropRequired') || 'Crop name is required.' }
  }

  const variety = ((formData.get('variety') as string) || '').trim() || null
  const season = ((formData.get('season') as string) || '').trim() || null

  const rawArea = formData.get('area')
  let area: number | null = null
  if (rawArea !== null && rawArea !== undefined && String(rawArea).trim() !== '') {
    const parsedArea = parseFloat(String(rawArea))
    if (isNaN(parsedArea) || parsedArea <= 0) {
      return { error: 'Area must be a positive number.' }
    }
    area = parsedArea
  }

  const rawSowingDate = (formData.get('sowing_date') as string)?.trim()
  const sowingDate = rawSowingDate || new Date().toISOString().split('T')[0]
  if (rawSowingDate) {
    const parsedDate = new Date(rawSowingDate)
    if (isNaN(parsedDate.getTime())) {
      return { error: 'Invalid sowing date.' }
    }
  }

  // Look up farmer's primary farm if one exists
  const { data: farm } = await supabase
    .from('farms')
    .select('id')
    .eq('farmer_id', user.id)
    .limit(1)
    .maybeSingle()

  const newCropData = {
    farmer_id: user.id,
    farm_id: farm?.id || null,
    crop_name: cropName,
    variety,
    season,
    sowing_date: sowingDate,
    area,
    status: 'PLANTED'
  }

  const { data: insertedCrop, error: insertError } = await supabase
    .from('crops')
    .insert(newCropData)
    .select()
    .single()

  if (insertError) {
    console.error('Error inserting crop:', insertError)
    return { error: 'Failed to record crop planting.' }
  }

  revalidatePath('/records')
  revalidatePath('/records/add-crop')
  revalidatePath('/records/add-harvest')
  revalidatePath('/records/transaction')

  return { success: true, data: insertedCrop as CropItem }
}

// ==========================================
// HARVESTS
// ==========================================

export async function getHarvests(): Promise<HarvestItem[]> {
  const auth = await getAuthenticatedFarmer()
  if (!auth) {
    return []
  }

  const { supabase, user } = auth
  const [crops, { data: harvests, error }] = await Promise.all([
    getCrops(),
    supabase
      .from('harvests')
      .select('*')
      .eq('farmer_id', user.id)
      .order('harvest_date', { ascending: false })
  ])

  if (error || !harvests) {
    console.error('Error fetching harvests:', error)
    return []
  }

  const cropMap = new Map<string, string>()
  crops.forEach((c) => {
    cropMap.set(c.id, c.variety ? `${c.crop_name} (${c.variety})` : c.crop_name)
  })

  return (harvests as HarvestItem[]).map((h) => ({
    ...h,
    crop_name: cropMap.get(h.crop_id) || 'Unknown Crop'
  }))
}

export async function addHarvest(formData: FormData): Promise<{ success?: boolean; data?: HarvestItem; error?: string }> {
  const auth = await getAuthenticatedFarmer()
  if (!auth) {
    return { error: 'Unauthorized: Only registered farmers can add harvests.' }
  }

  const { supabase, user } = auth

  const cropId = (formData.get('crop_id') as string)?.trim()
  if (!cropId) {
    return { error: 'Please select a crop for this harvest.' }
  }

  const rawQty = formData.get('quantity')
  const quantity = parseFloat(String(rawQty))
  if (isNaN(quantity) || quantity <= 0) {
    return { error: 'Yield quantity must be a positive number.' }
  }

  const unit = ((formData.get('unit') as string) || '').trim() || 'Quintal'

  const rawHarvestDate = (formData.get('harvest_date') as string)?.trim()
  const harvestDate = rawHarvestDate || new Date().toISOString().split('T')[0]
  if (rawHarvestDate) {
    const parsed = new Date(rawHarvestDate)
    if (isNaN(parsed.getTime())) {
      return { error: 'Invalid harvest date.' }
    }
  }

  const qualityGrade = ((formData.get('quality_grade') as string) || '').trim() || null

  const newHarvestData = {
    farmer_id: user.id,
    crop_id: cropId,
    quantity,
    unit,
    harvest_date: harvestDate,
    quality_grade: qualityGrade
  }

  const { data: insertedHarvest, error: insertError } = await supabase
    .from('harvests')
    .insert(newHarvestData)
    .select()
    .single()

  if (insertError) {
    console.error('Error inserting harvest:', insertError)
    return { error: 'Failed to save harvest record.' }
  }

  revalidatePath('/records')
  revalidatePath('/records/add-harvest')

  return { success: true, data: insertedHarvest as HarvestItem }
}

// ==========================================
// TRANSACTIONS (Record Transaction / Past Transactions)
// ==========================================

export async function getTransactions(): Promise<TransactionItem[]> {
  const auth = await getAuthenticatedFarmer()
  if (!auth) {
    return []
  }

  const { supabase, user } = auth
  const [crops, { data: transactions, error }] = await Promise.all([
    getCrops(),
    supabase
      .from('farm_transactions')
      .select('*')
      .eq('farmer_id', user.id)
      .order('transaction_date', { ascending: false })
  ])

  if (error || !transactions) {
    console.error('Error fetching transactions:', error)
    return []
  }

  const cropMap = new Map<string, string>()
  crops.forEach((c) => {
    cropMap.set(c.id, c.variety ? `${c.crop_name} (${c.variety})` : c.crop_name)
  })

  return (transactions as TransactionItem[]).map((t) => ({
    ...t,
    related_crop_name: t.related_crop_id ? cropMap.get(t.related_crop_id) || null : null
  }))
}

export async function addTransaction(formData: FormData): Promise<{ success?: boolean; data?: TransactionItem; error?: string }> {
  const auth = await getAuthenticatedFarmer()
  if (!auth) {
    return { error: 'Unauthorized: Only registered farmers can record transactions.' }
  }

  const { supabase, user } = auth

  const direction = (formData.get('direction') as string)?.trim().toUpperCase()
  if (direction !== 'IN' && direction !== 'OUT') {
    return { error: 'Transaction direction must be either IN (Income) or OUT (Expense).' }
  }

  const rawAmount = formData.get('amount')
  const amount = parseFloat(String(rawAmount))
  if (isNaN(amount) || amount <= 0) {
    return { error: 'Amount must be greater than zero.' }
  }

  const category = (formData.get('category') as string)?.trim()
  if (!category) {
    return { error: 'Please choose or provide a transaction category.' }
  }

  const rawDate = (formData.get('transaction_date') as string)?.trim()
  const transactionDate = rawDate || new Date().toISOString().split('T')[0]
  if (rawDate) {
    const parsedDate = new Date(rawDate)
    if (isNaN(parsedDate.getTime())) {
      return { error: 'Invalid transaction date.' }
    }
  }

  const description = ((formData.get('description') as string) || '').trim() || null
  const relatedCropId = ((formData.get('related_crop_id') as string) || '').trim() || null
  const receiptImageUrl = ((formData.get('receipt_image_url') as string) || '').trim() || null

  const rawSource = (formData.get('source') as string)?.trim().toLowerCase()
  const source = rawSource === 'ocr' ? 'ocr' : 'manual'

  let ocrMetadata: any = null
  const rawOcrMeta = formData.get('ocr_metadata')
  if (rawOcrMeta) {
    try {
      ocrMetadata = typeof rawOcrMeta === 'string' ? JSON.parse(rawOcrMeta) : rawOcrMeta
    } catch {
      ocrMetadata = null
    }
  }

  const newTxData = {
    farmer_id: user.id,
    direction: direction as 'IN' | 'OUT',
    amount,
    category,
    transaction_date: transactionDate,
    description,
    related_crop_id: relatedCropId,
    receipt_image_url: receiptImageUrl,
    source: source as 'manual' | 'ocr',
    ocr_metadata: ocrMetadata
  }

  const { data: insertedTx, error: insertError } = await supabase
    .from('farm_transactions')
    .insert(newTxData)
    .select()
    .single()

  if (insertError) {
    console.error('Error inserting transaction:', insertError)
    return { error: 'Failed to save transaction.' }
  }

  revalidatePath('/records')
  revalidatePath('/records/transaction')
  revalidatePath('/records/transactions')

  return { success: true, data: insertedTx as TransactionItem }
}
