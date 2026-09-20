import { createClient } from '@/utils/supabase/server'
import { Link } from '@/i18n/routing'
import { getTranslations, getLocale } from 'next-intl/server'
import { MapPin, Calendar, ArrowRight, ShieldCheck, Store, ChevronLeft, ChevronRight, Sparkles, ShoppingBag } from 'lucide-react'
import MarketplaceFilters from '@/components/marketplace/MarketplaceFilters'
import { getCropDisplayName } from '@/lib/constants/crops'

interface SellerProfile {
  id: string
  name: string
  verification_status: string
}

interface MarketplaceListing {
  id: string
  farmer_id: string
  crop_name: string
  variety?: string | null
  quantity: number
  unit: string
  expected_price: number
  quality_grade?: string | null
  harvest_date?: string | null
  location_text?: string | null
  description?: string | null
  status: string
  created_at: string
  users?: {
    id?: string
    name?: string
    verification_status?: string
  } | null
}

const PAGE_SIZE = 12
const ALLOWED_SORTS = ['newest', 'price_asc', 'price_desc'] as const
const STANDARD_GRADES = ['Grade A', 'Grade B', 'Grade C', 'Standard', 'Organic']

export default async function MarketplacePage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const locale = await getLocale()
  const t = await getTranslations('Marketplace')
  const tUnits = await getTranslations('Units')
  const tGrades = await getTranslations('Grades')
  const resolvedParams = await searchParams
  const supabase = await createClient()

  // Strictly check user role from users table
  let userRole: string | null = null
  let currentUserId: string | null = null
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    currentUserId = user.id
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
    userRole = userProfile?.role || null
  }

  const isBuyer = userRole === 'BUYER'
  const isFarmer = userRole === 'FARMER'

  // 1. Sanitize search params
  const rawQ = typeof resolvedParams.q === 'string' ? resolvedParams.q : ''
  const sanitizedQ = rawQ.replace(/[%,\\]/g, ' ').trim()

  const rawCrop = typeof resolvedParams.crop === 'string' ? resolvedParams.crop.trim() : ''
  const crop = rawCrop && rawCrop !== 'ALL' ? rawCrop : ''

  const rawMinPrice = typeof resolvedParams.minPrice === 'string' ? resolvedParams.minPrice.trim() : ''
  const minPriceNum = Number(rawMinPrice)
  const validMinPrice = !isNaN(minPriceNum) && minPriceNum >= 0 && rawMinPrice !== '' ? minPriceNum : null

  const rawMaxPrice = typeof resolvedParams.maxPrice === 'string' ? resolvedParams.maxPrice.trim() : ''
  const maxPriceNum = Number(rawMaxPrice)
  const validMaxPrice = !isNaN(maxPriceNum) && maxPriceNum >= 0 && rawMaxPrice !== '' ? maxPriceNum : null

  const rawGrade = typeof resolvedParams.grade === 'string' ? resolvedParams.grade.trim() : ''
  const grade = rawGrade && rawGrade !== 'ALL' ? rawGrade : ''

  const rawSort = typeof resolvedParams.sort === 'string' ? resolvedParams.sort.trim() : 'newest'
  const sort = (ALLOWED_SORTS as readonly string[]).includes(rawSort) ? rawSort : 'newest'

  const rawPage = typeof resolvedParams.page === 'string' ? resolvedParams.page : '1'
  const pageNum = Math.max(1, parseInt(rawPage, 10) || 1)

  // 2. Fetch distinct active crop names for dropdown (scoped to farmer if logged-in farmer)
  let cropsQuery = supabase
    .from('marketplace_listings')
    .select('crop_name')
    .eq('status', 'ACTIVE')

  if (isFarmer && currentUserId) {
    cropsQuery = cropsQuery.eq('farmer_id', currentUserId)
  }

  const { data: cropsData } = await cropsQuery

  const cropNames: string[] = (cropsData || [])
    .map((c: { crop_name?: string }) => String(c.crop_name || '').trim())
    .filter((name: string) => name.length > 0)
  const availableCrops: string[] = Array.from(new Set(cropNames)).sort((a: string, b: string) => a.localeCompare(b))

  // 3. Build filtered listings query with pagination (scoped to farmer if logged-in farmer)
  const from = (pageNum - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let query = supabase
    .from('marketplace_listings')
    .select('*', { count: 'exact' })
    .eq('status', 'ACTIVE')

  if (isFarmer && currentUserId) {
    query = query.eq('farmer_id', currentUserId)
  }

  if (sanitizedQ) {
    query = query.or(
      `crop_name.ilike.%${sanitizedQ}%,variety.ilike.%${sanitizedQ}%,location_text.ilike.%${sanitizedQ}%`
    )
  }

  if (crop) {
    query = query.eq('crop_name', crop)
  }

  if (validMinPrice !== null) {
    query = query.gte('expected_price', validMinPrice)
  }

  if (validMaxPrice !== null) {
    query = query.lte('expected_price', validMaxPrice)
  }

  if (grade) {
    query = query.eq('quality_grade', grade)
  }

  if (sort === 'price_asc') {
    query = query.order('expected_price', { ascending: true })
  } else if (sort === 'price_desc') {
    query = query.order('expected_price', { ascending: false })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  query = query.range(from, to)

  const { data: rawListings, count: totalCount } = await query

  const listingsList: MarketplaceListing[] = (rawListings || []) as MarketplaceListing[]
  const total = typeof totalCount === 'number' ? totalCount : listingsList.length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  // 4. Fetch safe seller profiles from public_users view
  const farmerIds = Array.from(new Set(listingsList.map((l: MarketplaceListing) => l.farmer_id).filter(Boolean)))
  let sellersMap: Record<string, SellerProfile> = {}

  if (farmerIds.length > 0) {
    try {
      const { data: sellers } = await supabase
        .from('public_users')
        .select('id, name, verification_status')
        .in('id', farmerIds)

      if (sellers && Array.isArray(sellers)) {
        sellersMap = Object.fromEntries(sellers.map((s: SellerProfile) => [s.id, s]))
      }
    } catch {
      // Graceful fallback if view is not yet created in Supabase
    }
  }

  const listings: MarketplaceListing[] = listingsList.map((listing: MarketplaceListing) => ({
    ...listing,
    users: sellersMap[listing.farmer_id] || listing.users || null
  }))

  // Helper to build pagination links keeping active filters
  const buildPageHref = (targetPage: number) => {
    const params = new URLSearchParams()
    if (sanitizedQ) params.set('q', sanitizedQ)
    if (crop) params.set('crop', crop)
    if (validMinPrice !== null) params.set('minPrice', String(validMinPrice))
    if (validMaxPrice !== null) params.set('maxPrice', String(validMaxPrice))
    if (grade) params.set('grade', grade)
    if (sort !== 'newest') params.set('sort', sort)
    if (targetPage > 1) params.set('page', String(targetPage))
    const qStr = params.toString()
    return qStr ? `/marketplace?${qStr}` : '/marketplace'
  }

  const hasActiveFilters = Boolean(
    sanitizedQ || crop || validMinPrice !== null || validMaxPrice !== null || grade || sort !== 'newest'
  )

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {isFarmer && (
        <div className="flex justify-center sm:justify-start">
          <div className="inline-flex p-1 bg-gray-200/80 rounded-2xl w-full sm:w-auto">
            <div className="flex-1 sm:flex-initial min-h-[48px] px-6 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-white text-emerald-800 shadow-sm">
              <ShoppingBag className="w-4 h-4 text-emerald-600" />
              <span>{t('myProduce')}</span>
            </div>
            <Link
              href="/marketplace/wanted"
              className="flex-1 sm:flex-initial min-h-[48px] px-6 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 text-gray-700 hover:text-gray-900 transition"
            >
              <Sparkles className="w-4 h-4" />
              <span>{t('buyersWanted')}</span>
            </Link>
          </div>
        </div>
      )}

      <header className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-emerald-950">{t('title')}</h1>
          <p className="text-emerald-700 mt-1">{t('subtitle')}</p>
        </div>

        {!isBuyer && (
          <div className="hidden md:flex items-center gap-3">
            {isFarmer && (
              <Link
                href="/marketplace/my-listings"
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold py-2.5 px-6 rounded-xl transition shadow-sm"
              >
                {t('myListings')}
              </Link>
            )}
            <Link
              href="/marketplace/create"
              className="bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-2.5 px-6 rounded-xl transition shadow-sm"
            >
              {t('listProduce')}
            </Link>
          </div>
        )}
      </header>

      {/* Filter Component */}
      <MarketplaceFilters
        initialQ={rawQ}
        initialCrop={crop}
        initialMinPrice={rawMinPrice}
        initialMaxPrice={rawMaxPrice}
        initialGrade={grade}
        initialSort={sort}
        crops={availableCrops}
        grades={STANDARD_GRADES}
      />

      {/* Results Header / Count */}
      <div className="flex items-center justify-between px-1">
        <p className="text-sm font-semibold text-emerald-900">
          {t('resultsCount', { count: total })}
        </p>
      </div>

      {/* Listings Grid (Single-column on mobile, 2/3 cols on md+) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {listings && listings.length > 0 ? (
          listings.map((listing: MarketplaceListing) => {
            const localizedCrop = getCropDisplayName(listing.crop_name, locale)
            const unitLabel = tUnits.has(listing.unit as any) ? tUnits(listing.unit as any) : listing.unit
            const gradeLabel = listing.quality_grade && tGrades.has(listing.quality_grade as any)
              ? tGrades(listing.quality_grade as any)
              : (listing.quality_grade || t('standard'))

            return (
              <Link
                key={listing.id}
                href={`/marketplace/${listing.id}`}
                className="bg-white rounded-2xl border border-emerald-100 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col active:scale-[0.99] group"
              >
                <div className="bg-emerald-50/80 p-4 md:p-6 border-b border-emerald-100 flex justify-between items-start gap-2">
                  <div>
                    <h3 className="text-lg md:text-xl font-bold text-emerald-950 group-hover:text-emerald-700 transition leading-tight">
                      {localizedCrop}
                    </h3>
                    {listing.variety && <p className="text-sm text-emerald-700 font-medium">{listing.variety}</p>}
                  </div>
                  <div className="bg-white px-3 py-1.5 rounded-xl border border-emerald-200 text-center flex-shrink-0">
                    <span className="block text-[10px] uppercase font-bold text-gray-500">{t('qty')}</span>
                    <span className="font-extrabold text-emerald-900 text-sm md:text-base">
                      {listing.quantity} {unitLabel}
                    </span>
                  </div>
                </div>

                <div className="p-4 md:p-6 flex-grow space-y-3 md:space-y-4">
                  <div className="flex justify-between items-baseline border-b border-gray-100 pb-3">
                    <div>
                      <span className="text-xs text-gray-500 block">{t('expectedRate')}</span>
                      <span className="text-2xl font-black text-emerald-900">₹{listing.expected_price.toLocaleString('en-IN')}</span>
                      <span className="text-gray-500 text-xs font-semibold"> / {unitLabel}</span>
                    </div>
                    <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2.5 py-1 rounded-full border border-orange-200">
                      {gradeLabel}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span className="truncate">{listing.location_text}</span>
                    </div>
                    {listing.harvest_date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span>{t('harvest')}: {listing.harvest_date}</span>
                      </div>
                    )}
                  </div>

                  {/* Farmer Info */}
                  <div className="flex items-center gap-2.5 pt-3 border-t border-gray-100">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 font-bold text-xs flex-shrink-0">
                      {(listing.users?.name || 'F')[0].toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 flex items-center gap-1 truncate">
                        <span className="truncate">{listing.users?.name || t('farmer')}</span>
                        {listing.users?.verification_status === 'VERIFIED' && (
                          <span title={t('verifiedFarmer')} className="flex items-center flex-shrink-0">
                            <ShieldCheck className="w-4 h-4 text-blue-500" />
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Desktop-only Action hint */}
                <div className="hidden md:block p-3.5 bg-gray-50 border-t border-gray-100 text-center">
                  <span className="inline-flex items-center gap-2 text-emerald-800 font-bold text-sm group-hover:text-emerald-600">
                    {t('viewDetails')} <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            )
          })
        ) : (
          <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-16 md:py-20 bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-700">
              {hasActiveFilters
                ? t('noResultsTitle')
                : isFarmer
                ? t('farmerNoActiveListings')
                : t('noResultsTitle')}
            </h3>
            <p className="text-gray-500 mt-2 max-w-md mx-auto text-sm">
              {hasActiveFilters
                ? t('noResultsDesc')
                : isFarmer
                ? t('farmerNoActiveListingsDesc')
                : t('noResultsDesc')}
            </p>
            {hasActiveFilters ? (
              <div className="mt-6">
                <Link
                  href="/marketplace"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-sm rounded-xl transition min-h-[48px]"
                >
                  {t('clearFilters')}
                </Link>
              </div>
            ) : isFarmer ? (
              <div className="mt-6">
                <Link
                  href="/marketplace/create"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-sm rounded-xl transition shadow-sm min-h-[48px]"
                >
                  {t('listProduce')}
                </Link>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Pagination Controls (48px tap targets) */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 pt-6 px-1 gap-2">
          <div className="flex-1">
            {pageNum > 1 ? (
              <Link
                href={buildPageHref(pageNum - 1)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 h-12 px-4 rounded-xl border border-gray-300 bg-white text-base font-bold text-gray-700 hover:bg-gray-50 transition shadow-sm"
              >
                <ChevronLeft className="w-5 h-5" />
                <span>{t('previous')}</span>
              </Link>
            ) : (
              <span className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 h-12 px-4 rounded-xl border border-gray-200 bg-gray-100 text-base font-bold text-gray-400 cursor-not-allowed">
                <ChevronLeft className="w-5 h-5" />
                <span>{t('previous')}</span>
              </span>
            )}
          </div>

          <p className="text-xs md:text-sm text-gray-600 font-semibold px-2 text-center flex-shrink-0">
            {t('page', { current: pageNum, total: totalPages })}
          </p>

          <div className="flex-1 flex justify-end">
            {pageNum < totalPages ? (
              <Link
                href={buildPageHref(pageNum + 1)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 h-12 px-4 rounded-xl border border-gray-300 bg-white text-base font-bold text-gray-700 hover:bg-gray-50 transition shadow-sm"
              >
                <span>{t('next')}</span>
                <ChevronRight className="w-5 h-5" />
              </Link>
            ) : (
              <span className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 h-12 px-4 rounded-xl border border-gray-200 bg-gray-100 text-base font-bold text-gray-400 cursor-not-allowed">
                <span>{t('next')}</span>
                <ChevronRight className="w-5 h-5" />
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
