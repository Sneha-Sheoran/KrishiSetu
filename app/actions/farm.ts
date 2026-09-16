'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function addFarm(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  const farm_name = formData.get('farm_name') as string
  const area = formData.get('area') as string
  const area_unit = formData.get('area_unit') as string
  const state = formData.get('state') as string
  const district = formData.get('district') as string
  const village = formData.get('village') as string
  const soil_type = formData.get('soil_type') as string
  const soil_ph = formData.get('soil_ph') as string
  const irrigation_type = formData.get('irrigation_type') as string

  const { error } = await supabase.from('farms').insert({
    farmer_id: user.id,
    farm_name,
    area: parseFloat(area),
    area_unit,
    state,
    district,
    village,
    soil_type: soil_type || null,
    soil_ph: soil_ph ? parseFloat(soil_ph) : null,
    irrigation_type: irrigation_type || null,
  })

  if (error) {
    console.error('Error adding farm:', error)
    return { error: 'Failed to add farm. Please try again.' }
  }

  redirect('/dashboard')
}
