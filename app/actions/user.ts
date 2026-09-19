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

  if (error || !profile) {
    // Fallback to auth metadata if table record is missing
    return {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
      role: user.user_metadata?.role || 'FARMER',
      phone: user.phone || (user.user_metadata as any)?.phone || '',
      verification_status: 'VERIFIED'
    }
  }

  return profile
}

export async function getUserFarms(userId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('farms')
    .select('*')
    .eq('farmer_id', userId)

  if (error || !data) {
    return []
  }

  return data
}
