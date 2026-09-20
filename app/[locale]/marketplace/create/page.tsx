import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import ListingForm from '@/components/marketplace/ListingForm'

export default async function CreateListingPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'BUYER') {
    redirect('/marketplace')
  }

  return <ListingForm />
}
