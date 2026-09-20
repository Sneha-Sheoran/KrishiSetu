import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Link } from '@/i18n/routing'
import { Store } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import MyListingItem from '@/components/marketplace/MyListingItem'

interface MarketplaceListing {
  id: string
  crop_name: string
  variety?: string | null
  quantity: number
  unit: string
  expected_price: number
  quality_grade?: string | null
  harvest_date?: string | null
  location_text?: string | null
  status: string
  created_at: string
}

export default async function MyListingsPage() {
  const t = await getTranslations('Marketplace')
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: listings } = await supabase
    .from('marketplace_listings')
    .select('*')
    .eq('farmer_id', user.id)
    .neq('status', 'DELETED')
    .order('created_at', { ascending: false })

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-emerald-950">{t('myListings') || 'My Marketplace Listings'}</h1>
          <p className="text-emerald-700 mt-1">{t('myListingsSubtitle') || 'Manage your active and past produce listings.'}</p>
        </div>
        <Link
          href="/marketplace/create"
          className="bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-2.5 px-6 rounded-xl transition shadow-sm"
        >
          {t('newListing') || '+ New Listing'}
        </Link>
      </header>

      <div className="space-y-4">
        {listings && listings.length > 0 ? (
          (listings as MarketplaceListing[]).map((listing) => (
            <MyListingItem key={listing.id} listing={listing} />
          ))
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-200 shadow-sm">
            <Store className="w-16 h-16 text-emerald-200 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-emerald-950">{t('noListingsTitle') || 'No listings yet'}</h3>
            <p className="text-emerald-700 mt-2 mb-6 max-w-md mx-auto">
              {t('noListingsDesc') || 'Create your first listing to connect with buyers.'}
            </p>
            <Link
              href="/marketplace/create"
              className="inline-block bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-2.5 px-6 rounded-xl transition shadow-sm"
            >
              {t('createListingBtn') || 'Create Listing'}
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
