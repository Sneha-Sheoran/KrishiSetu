import { createClient } from '@/utils/supabase/server'
import { notFound, redirect } from 'next/navigation'
import ListingForm from '@/components/marketplace/ListingForm'

export default async function EditListingPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: listing, error } = await supabase
    .from('marketplace_listings')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error || !listing || listing.status === 'DELETED') {
    notFound()
  }

  if (listing.farmer_id !== user.id) {
    redirect('/marketplace')
  }

  return (
    <ListingForm
      isEdit={true}
      listingId={listing.id}
      initialData={{
        crop_name: listing.crop_name,
        variety: listing.variety,
        quantity: listing.quantity,
        unit: listing.unit,
        expected_price: listing.expected_price,
        quality_grade: listing.quality_grade,
        harvest_date: listing.harvest_date,
        location_text: listing.location_text,
        description: listing.description
      }}
    />
  )
}
