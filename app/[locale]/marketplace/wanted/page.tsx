import { redirect } from 'next/navigation'
import { Link } from '@/i18n/routing'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/utils/supabase/server'
import WantedFilters from '@/components/marketplace/WantedFilters'
import WantedRequirementCard, {
  WantedRequirementItem,
  MatchingListingOption
} from '@/components/marketplace/WantedRequirementCard'
import { Sparkles, ShoppingBag } from 'lucide-react'

interface PageProps {
  params: Promise<{ locale: string }>
  searchParams: Promise<{
    q?: string
    crop?: string
    sort?: string
    matchesMyCrops?: string
    page?: string
  }>
}

export default async function BuyersWantedPage({ params, searchParams }: PageProps) {
  const { locale } = await params
  const sParams = await searchParams
  const t = await getTranslations({ locale, namespace: 'Marketplace' })

  const supabase = await createClient()

  // 1. Authenticate & Role Gate
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/${locale}/login`)
  }

  const role = user.user_metadata?.role || (user as any).role
  if (role === 'BUYER') {
    redirect(`/${locale}/buyer`)
  }

  const isFarmer = role === 'FARMER'
  const isAdmin = role === 'ADMIN'

  // 2. Fetch Active Requirements
  const { data: rawRequirements } = await supabase
    .from('buyer_requirements')
    .select('id, buyer_id, crop, required_quantity, unit, target_price, required_by, location, status, created_at')
    .eq('status', 'ACTIVE')
    .order('created_at', { ascending: false })

  // Filter out expired requirements
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const activeRequirements = (rawRequirements || []).filter((req: any) => {
    if (!req.required_by) return true
    const d = new Date(req.required_by)
    return d >= today
  })

  // 3. Fetch buyer public details via public_buyers
  const buyerIds = Array.from(new Set(activeRequirements.map((r: any) => r.buyer_id)))
  const buyerMap = new Map<string, any>()

  if (buyerIds.length > 0) {
    const { data: buyers } = await supabase
      .from('public_buyers')
      .select('id, business_name, buyer_type, state, district, verification_status')
      .in('id', buyerIds)

    if (buyers) {
      for (const b of buyers) {
        buyerMap.set(b.id, b)
      }
    }
  }

  // 4. If Farmer, fetch farmer's active produce listings
  let farmerListings: MatchingListingOption[] = []
  if (isFarmer) {
    const { data: listings } = await supabase
      .from('marketplace_listings')
      .select('id, crop_name, quantity, unit, expected_price')
      .eq('farmer_id', user.id)
      .eq('status', 'ACTIVE')

    farmerListings = (listings || []) as MatchingListingOption[]
  }

  const farmerCropNames = new Set(
    farmerListings.map((l) => l.crop_name.trim().toLowerCase())
  )

  // 5. Fetch existing requirement conversations for this farmer
  const existingConvMap = new Map<string, string>() // requirement_id -> conversation_id
  if (isFarmer) {
    const { data: conversations } = await supabase
      .from('conversations')
      .select('id, requirement_id')
      .eq('farmer_id', user.id)

    if (conversations) {
      for (const c of conversations) {
        if (c.requirement_id) {
          existingConvMap.set(c.requirement_id, c.id)
        }
      }
    }
  }

  // Attach safe buyer data
  const combinedRequirements: WantedRequirementItem[] = activeRequirements.map((req: any) => ({
    id: req.id,
    crop: req.crop,
    required_quantity: req.required_quantity,
    unit: req.unit,
    target_price: req.target_price,
    required_by: req.required_by,
    location: req.location,
    created_at: req.created_at,
    buyer: buyerMap.get(req.buyer_id) || null
  }))

  // Available unique crops for filter dropdown
  const availableCrops = Array.from(
    new Set(combinedRequirements.map((r) => r.crop))
  ).sort()

  // 6. Filtering & Searching
  const query = (sParams.q || '').trim().toLowerCase()
  const cropFilter = sParams.crop || 'ALL'
  const matchesMyCrops = sParams.matchesMyCrops === 'true'
  const sort = sParams.sort || 'newest'

  let filtered = combinedRequirements.filter((r) => {
    // Crop filter
    if (cropFilter !== 'ALL' && r.crop.toLowerCase() !== cropFilter.toLowerCase()) {
      return false
    }

    // Matches my crops toggle
    if (matchesMyCrops) {
      if (!farmerCropNames.has(r.crop.trim().toLowerCase())) {
        return false
      }
    }

    // Text search query
    if (query) {
      const matchCrop = r.crop.toLowerCase().includes(query)
      const matchLocation = (r.location || '').toLowerCase().includes(query)
      const matchBuyer = (r.buyer?.business_name || '').toLowerCase().includes(query)
      if (!matchCrop && !matchLocation && !matchBuyer) {
        return false
      }
    }

    return true
  })

  // 7. Sorting
  filtered.sort((a, b) => {
    if (sort === 'required_soonest') {
      if (!a.required_by) return 1
      if (!b.required_by) return -1
      return new Date(a.required_by).getTime() - new Date(b.required_by).getTime()
    }
    if (sort === 'price_high') {
      const priceA = a.target_price || 0
      const priceB = b.target_price || 0
      return priceB - priceA
    }
    // Default newest
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  // 8. Pagination (12 per page)
  const pageSize = 12
  const currentPage = Math.max(1, parseInt(sParams.page || '1', 10) || 1)
  const totalCount = filtered.length
  const totalPages = Math.ceil(totalCount / pageSize) || 1
  const paginatedRequirements = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  return (
    <div className="min-h-screen bg-gray-50 pb-28 md:pb-16 pt-4 md:pt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Segmented Switch for Farmers: My Produce | Buyers Demand */}
        {isFarmer && (
          <div className="mb-6 flex justify-center sm:justify-start">
            <div className="inline-flex p-1 bg-gray-200/80 rounded-2xl w-full sm:w-auto">
              <Link
                href="/marketplace"
                className="flex-1 sm:flex-initial min-h-[48px] px-6 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 text-gray-700 hover:text-gray-900 transition"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{t('myProduce')}</span>
              </Link>
              <div className="flex-1 sm:flex-initial min-h-[48px] px-6 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-white text-emerald-800 shadow-sm">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>{t('buyersWanted')}</span>
              </div>
            </div>
          </div>
        )}

        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {t('buyersWanted')}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            {t('wantedSubtitle')}
          </p>
        </div>

        {/* Filters */}
        <WantedFilters
          initialQ={sParams.q || ''}
          initialCrop={cropFilter}
          initialSort={sort}
          initialMatchesMyCrops={matchesMyCrops}
          availableCrops={availableCrops}
          hasFarmerProduce={farmerListings.length > 0}
        />

        {/* Results Header */}
        <div className="mb-4 flex items-center justify-between">
          <span className="text-xs sm:text-sm font-medium text-gray-500">
            {t('resultsCount', { count: totalCount })}
          </span>
        </div>

        {/* Requirements Grid */}
        {paginatedRequirements.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 sm:p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-600">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              {t('noWantedTitle')}
            </h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              {t('noWantedDesc')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {paginatedRequirements.map((req) => {
              const matching = farmerListings.filter(
                (l) => l.crop_name.trim().toLowerCase() === req.crop.trim().toLowerCase()
              )
              const convId = existingConvMap.get(req.id) || null

              return (
                <WantedRequirementCard
                  key={req.id}
                  requirement={req}
                  matchingListings={matching}
                  existingConversationId={convId}
                  isAdmin={isAdmin}
                />
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-5">
            <div>
              {currentPage > 1 ? (
                <Link
                  href={{
                    pathname: '/marketplace/wanted',
                    query: { ...sParams, page: String(currentPage - 1) }
                  }}
                  className="min-h-[48px] px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 flex items-center transition"
                >
                  {t('previous')}
                </Link>
              ) : (
                <div />
              )}
            </div>

            <span className="text-sm text-gray-600 font-medium">
              {t('page', { current: currentPage, total: totalPages })}
            </span>

            <div>
              {currentPage < totalPages ? (
                <Link
                  href={{
                    pathname: '/marketplace/wanted',
                    query: { ...sParams, page: String(currentPage + 1) }
                  }}
                  className="min-h-[48px] px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 flex items-center transition"
                >
                  {t('next')}
                </Link>
              ) : (
                <div />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
