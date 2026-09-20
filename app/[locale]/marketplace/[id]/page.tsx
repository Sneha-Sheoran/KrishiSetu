import { createClient } from '@/utils/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { Link } from '@/i18n/routing'
import { MapPin, CheckCircle2, MessageCircle, AlertTriangle, PauseCircle } from 'lucide-react'
import { getTranslations, getLocale } from 'next-intl/server'
import { getCropDisplayName } from '@/lib/constants/crops'

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const locale = await getLocale()
  const tMarketplace = await getTranslations('Marketplace')
  const tListing = await getTranslations('Listing')
  const tStatus = await getTranslations('Status')
  const tUnits = await getTranslations('Units')
  const tGrades = await getTranslations('Grades')

  const supabase = await createClient()
  
  // Get current user to check role
  const { data: { user } } = await supabase.auth.getUser()
  let userRole: string | null = null
  if (user) {
    const { data: userProfile } = await supabase.from('users').select('role').eq('id', user.id).maybeSingle()
    userRole = userProfile?.role || null
  }
  const isBuyer = userRole === 'BUYER'
  const isFarmer = userRole === 'FARMER'

  const { data: rawListing } = await supabase
    .from('marketplace_listings')
    .select('*, users(name, verification_status)')
    .eq('id', id)
    .single()

  if (!rawListing || rawListing.status === 'DELETED') {
    notFound()
  }

  // If a FARMER opens a listing that is not their own, redirect to /marketplace
  if (isFarmer && user && rawListing.farmer_id !== user.id) {
    redirect('/marketplace')
  }

  // Fetch safe seller profile from public_users view (graceful fallback if view not yet created)
  let sellerProfile: { name: string; verification_status: string } | null = null
  if (rawListing.farmer_id) {
    try {
      const { data: seller } = await supabase
        .from('public_users')
        .select('name, verification_status')
        .eq('id', rawListing.farmer_id)
        .single()
      if (seller) {
        sellerProfile = seller
      }
    } catch {
      // Graceful fallback if view is not yet created in Supabase
    }
  }

  const listing = {
    ...rawListing,
    users: sellerProfile || rawListing.users || null
  }

  const localizedCrop = getCropDisplayName(listing.crop_name, locale)
  const unitLabel = tUnits.has(listing.unit as any) ? tUnits(listing.unit as any) : listing.unit
  const gradeLabel = listing.quality_grade && tGrades.has(listing.quality_grade as any)
    ? tGrades(listing.quality_grade as any)
    : (listing.quality_grade || tMarketplace('standard'))

  const statusLabel = listing.status === 'ACTIVE'
    ? tStatus('active')
    : listing.status === 'PAUSED'
    ? tStatus('paused')
    : listing.status === 'SOLD'
    ? tStatus('sold')
    : listing.status

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl md:rounded-3xl shadow-sm border border-emerald-100 overflow-hidden">
        {/* Header / Hero */}
        <div className="bg-emerald-800 p-5 md:p-8 text-white relative">
          <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold border ${
            listing.status === 'ACTIVE' ? 'bg-emerald-700/80 border-emerald-500 text-white' :
            listing.status === 'PAUSED' ? 'bg-amber-600/90 border-amber-400 text-white' :
            'bg-blue-600/90 border-blue-400 text-white'
          }`}>
            {statusLabel}
          </div>
          <h1 className="text-2xl md:text-5xl font-extrabold mb-1 md:mb-2 pr-20">
            {localizedCrop} {listing.variety && <span className="font-medium text-emerald-300 text-lg md:text-2xl">({listing.variety})</span>}
          </h1>
          <p className="text-emerald-100 text-sm md:text-lg flex items-center gap-1.5 mt-2 md:mt-4">
            <MapPin className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" /> {listing.location_text}
          </p>
        </div>

        {/* Status Banners (Always at top) */}
        {listing.status === 'PAUSED' && (
          <div className="bg-amber-50 border-b border-amber-200 p-4 px-5 md:px-8 flex items-center gap-3 text-amber-900">
            <PauseCircle className="w-5 h-5 flex-shrink-0 text-amber-600" />
            <span className="font-semibold text-sm">
              {tListing('pausedBanner')}
            </span>
          </div>
        )}
        {listing.status === 'SOLD' && (
          <div className="bg-blue-50 border-b border-blue-200 p-4 px-5 md:px-8 flex items-center gap-3 text-blue-900">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-blue-600" />
            <span className="font-semibold text-sm">
              {tListing('soldBanner')}
            </span>
          </div>
        )}

        {/* Content (Single column on mobile, 2-col + sidebar on md+) */}
        <div className="p-5 md:p-8 flex flex-col md:grid md:grid-cols-3 gap-6 md:gap-8 pb-28 md:pb-8">
          <div className="md:col-span-2 space-y-6 md:space-y-8">
            {/* Prominent Price & Quantity Block */}
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <div className="bg-emerald-50/80 p-4 rounded-2xl border border-emerald-100">
                <span className="text-emerald-700 text-xs md:text-sm font-bold block mb-1">{tMarketplace('expectedRate')}</span>
                <span className="text-2xl md:text-3xl font-black text-emerald-950">₹{listing.expected_price.toLocaleString('en-IN')}</span>
                <span className="text-emerald-800 text-xs md:text-sm block">/ {unitLabel}</span>
              </div>
              <div className="bg-emerald-50/80 p-4 rounded-2xl border border-emerald-100">
                <span className="text-emerald-700 text-xs md:text-sm font-bold block mb-1">{tMarketplace('availableQuantity')}</span>
                <span className="text-2xl md:text-3xl font-black text-emerald-950">{listing.quantity}</span>
                <span className="text-emerald-800 text-xs md:text-sm block">{unitLabel}</span>
              </div>
            </div>

            {/* Produce Details */}
            <div>
              <h3 className="text-lg md:text-xl font-bold text-emerald-900 mb-3 border-b pb-2">{tMarketplace('produceDetails')}</h3>
              <ul className="space-y-3 md:space-y-4 text-sm md:text-base">
                <li className="flex justify-between md:justify-start md:gap-8 py-1 border-b border-gray-50 md:border-none">
                  <div className="w-1/2 md:w-1/3 text-gray-500 font-medium">{tListing('qualityGrade')}</div>
                  <div className="w-1/2 md:w-2/3 font-bold text-gray-900 text-right md:text-left">{gradeLabel}</div>
                </li>
                {listing.harvest_date && (
                  <li className="flex justify-between md:justify-start md:gap-8 py-1 border-b border-gray-50 md:border-none">
                    <div className="w-1/2 md:w-1/3 text-gray-500 font-medium">{tListing('harvestDate')}</div>
                    <div className="w-1/2 md:w-2/3 font-semibold text-gray-900 text-right md:text-left">{listing.harvest_date}</div>
                  </li>
                )}
                {listing.description && (
                  <li className="flex flex-col md:flex-row md:gap-8 pt-2">
                    <div className="w-full md:w-1/3 text-gray-500 font-medium mb-1 md:mb-0">{tListing('additionalDetails')}</div>
                    <div className="w-full md:w-2/3 text-gray-800 leading-relaxed">{listing.description}</div>
                  </li>
                )}
              </ul>
            </div>

            {/* Seller Information (Stacked on mobile) */}
            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-3 text-base">{tMarketplace('sellerInformation')}</h3>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-emerald-200 flex items-center justify-center text-emerald-800 font-extrabold text-xl flex-shrink-0">
                  {(listing.users?.name || 'F')[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-base">{listing.users?.name}</p>
                  {listing.users?.verification_status === 'VERIFIED' ? (
                    <span className="text-blue-600 text-xs font-bold flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {tMarketplace('verifiedFarmer')}
                    </span>
                  ) : (
                    <span className="text-gray-500 text-xs font-medium">{tMarketplace('farmer')}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Sidebar Actions (Hidden on mobile, uses Sticky Bottom Bar instead) */}
          <div className="hidden md:block space-y-6">
            {user?.id !== listing.farmer_id && (
              <div className="bg-orange-50 rounded-2xl p-6 border border-orange-200">
                {listing.status !== 'ACTIVE' ? (
                  <div className="text-center py-2">
                    <p className="text-sm font-medium text-orange-950">
                      {tMarketplace('enquiriesClosedDesc')}
                    </p>
                  </div>
                ) : isBuyer ? (
                  <>
                    <h3 className="font-bold text-orange-900 mb-2">{tMarketplace('interested')}</h3>
                    <p className="text-sm text-orange-800 mb-4">{tMarketplace('interestedDesc')}</p>
                    <form action={async () => {
                      'use server'
                      const { sendEnquiry } = await import('@/app/actions/marketplace')
                      await sendEnquiry(listing.id)
                    }}>
                      <button type="submit" className="w-full h-12 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition shadow-md">
                        <MessageCircle className="w-5 h-5" />
                        {tMarketplace('sendEnquiry')}
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="flex items-start gap-2 text-orange-800 text-sm">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    <p>{tMarketplace('buyerRoleNotice')}</p>
                  </div>
                )}
              </div>
            )}
            
            {user?.id === listing.farmer_id && (
              <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-200 text-center space-y-3">
                <p className="text-emerald-800 font-medium">{tMarketplace('listingOwnerNote')}</p>
                <Link
                  href={`/marketplace/${listing.id}/edit`}
                  className="inline-flex items-center justify-center w-full h-12 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl transition shadow-sm"
                >
                  {tMarketplace('editDetails')}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE STICKY BOTTOM ACTION BAR (Positioned safely above bottom nav) */}
      <div className="md:hidden fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 p-3 px-4 z-30 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
        {user?.id !== listing.farmer_id ? (
          listing.status !== 'ACTIVE' ? (
            <div className="text-center py-1">
              <span className="text-xs font-semibold text-gray-500">
                {tMarketplace('enquiriesClosed')} ({statusLabel.toLowerCase()})
              </span>
            </div>
          ) : isBuyer ? (
            <form action={async () => {
              'use server'
              const { sendEnquiry } = await import('@/app/actions/marketplace')
              await sendEnquiry(listing.id)
            }}>
              <button
                type="submit"
                className="w-full h-12 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition shadow-md text-base"
              >
                <MessageCircle className="w-5 h-5" />
                {tMarketplace('sendEnquiry')}
              </button>
            </form>
          ) : (
            <Link
              href="/login"
              className="w-full h-12 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition shadow-md text-sm text-center"
            >
              {tMarketplace('buyerRoleNotice')}
            </Link>
          )
        ) : (
          <Link
            href={`/marketplace/${listing.id}/edit`}
            className="w-full h-12 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition shadow-md text-base"
          >
            {tMarketplace('editDetails')}
          </Link>
        )}
      </div>
    </div>
  )
}
