'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function getUserProfile() {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  const { data: profile, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('Error fetching user profile:', error)
    return null
  }

  return profile
}

export async function getUserFarms(userId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('farms')
    .select('*')
    .eq('farmer_id', userId)

  if (error) {
    console.error('Error fetching farms:', error)
    return []
  }

  return data
}
