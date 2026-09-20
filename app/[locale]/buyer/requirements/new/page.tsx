import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import RequirementForm from '@/components/buyer/RequirementForm'

export default async function NewRequirementPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Authoritatively check role from users table
  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userProfile?.role !== 'BUYER') {
    redirect('/dashboard')
  }

  // Check if buyer has completed their business profile
  const { data: buyerProfile } = await supabase
    .from('buyers')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!buyerProfile) {
    redirect('/profile/buyer-setup')
  }

  return <RequirementForm />
}
