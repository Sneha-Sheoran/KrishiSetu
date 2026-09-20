import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Link } from '@/i18n/routing'
import { Store, MessageCircle, CheckCircle2, AlertTriangle, TrendingUp, Search, Plus, Clock, ArrowRight } from 'lucide-react'
import { getTranslations, getLocale } from 'next-intl/server'
import BuyerRequirementItem, { BuyerRequirement } from '@/components/buyer/BuyerRequirementItem'
import { getCropDisplayName } from '@/lib/constants/crops'

interface ConversationItem {
  id: string
  listing_id?: string | null
  requirement_id?: string | null
  farmer_id: string
  created_at: string
  marketplace_listings?: {
    crop_name?: string
  } | null
}

export default async function BuyerDashboardPage() {
  const locale = await getLocale()
  const t = await getTranslations('Buyer')
  const tNav = await getTranslations('Nav')
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Authoritatively check role from users table
  const { data: userProfile } = await supabase
    .from('users')
    .select('id, name, role')
    .eq('id', user.id)
    .single()

  if (userProfile?.role !== 'BUYER') {
    redirect('/dashboard')
  }

  // Check buyer profile completion
  const { data: buyerProfile } = await supabase
    .from('buyers')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!buyerProfile) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-orange-100 border border-orange-200 p-6 rounded-2xl text-center">
          <h2 className="text-2xl font-bold text-orange-900 mb-2">
            {t('welcome', { name: userProfile?.name || 'Buyer' })}
          </h2>
          <p className="text-orange-800 mb-6">
            {t('profileIncompleteNotice')}
          </p>
          <Link
            href="/profile/buyer-setup"
            className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold transition shadow-sm"
          >
            {t('completeProfileBtn')}
          </Link>
        </div>
      </div>
    )
  }

  // 1. Stat Card Queries
  // Available Produce: count of ACTIVE listings
  const { count: availableProduceCount } = await supabase
    .from('marketplace_listings')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'ACTIVE')

  // My Active Requirements: count of the buyer's ACTIVE requirements
  const { count: activeRequirementsCount } = await supabase
    .from('buyer_requirements')
    .select('*', { count: 'exact', head: true })
    .eq('buyer_id', buyerProfile.id)
    .eq('status', 'ACTIVE')

  // Active Enquiries: count of the buyer's conversations
  const { count: activeEnquiriesCount } = await supabase
    .from('conversations')
    .select('*', { count: 'exact', head: true })
    .eq('buyer_id', user.id)

  // Completed Deals: count of transactions where buyer_id is the user and status is COMPLETED
  const { count: completedDealsCount } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .eq('buyer_id', user.id)
    .eq('status', 'COMPLETED')

  // 2. Recent Active Conversations (5 latest)
  const { data: rawConversations } = await supabase
    .from('conversations')
    .select('*, marketplace_listings(crop_name)')
    .eq('buyer_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const recentConversations: ConversationItem[] = (rawConversations || []) as ConversationItem[]
  const convIds = recentConversations.map((c) => c.id).filter(Boolean)
  const farmerIds = Array.from(new Set(recentConversations.map((c) => c.farmer_id).filter(Boolean)))
  const listingIds = Array.from(new Set(recentConversations.map((c) => c.listing_id).filter(Boolean)))

  // Look up listings for crop_name fallback if joined relation was missing
  let listingsMap: Record<string, { crop_name: string }> = {}
  if (listingIds.length > 0) {
    try {
      const { data: listings } = await supabase
        .from('marketplace_listings')
        .select('id, crop_name')
        .in('id', listingIds)
      if (listings) {
        listingsMap = Object.fromEntries(listings.map((l: { id: string; crop_name: string }) => [l.id, l]))
      }
    } catch {
      // Fallback
    }
  }

  // Look up farmer names from public_users view
  let farmersMap: Record<string, { name?: string; verification_status?: string }> = {}
  if (farmerIds.length > 0) {
    try {
      const { data: farmers } = await supabase
        .from('public_users')
        .select('id, name, verification_status')
        .in('id', farmerIds)
      if (farmers && Array.isArray(farmers)) {
        farmersMap = Object.fromEntries(farmers.map((f: { id: string; name?: string; verification_status?: string }) => [f.id, f]))
      }
    } catch {
      // Fallback
    }
  }

  // Look up latest message for each conversation
  const lastMessageMap: Record<string, { message: string; created_at: string }> = {}
  if (convIds.length > 0) {
    try {
      const { data: messages } = await supabase
        .from('messages')
        .select('conversation_id, message, created_at')
        .in('conversation_id', convIds)
        .order('created_at', { ascending: false })
      if (messages) {
        for (const m of messages) {
          if (!lastMessageMap[m.conversation_id]) {
            lastMessageMap[m.conversation_id] = m
          }
        }
      }
    } catch {
      // Fallback
    }
  }

  // Look up requirements for requirement-backed conversations
  const requirementIds = Array.from(new Set(recentConversations.map((c) => c.requirement_id).filter(Boolean))) as string[]
  let requirementsMap: Record<string, { crop: string }> = {}
  if (requirementIds.length > 0) {
    try {
      const { data: reqs } = await supabase
        .from('buyer_requirements')
        .select('id, crop')
        .in('id', requirementIds)
      if (reqs && Array.isArray(reqs)) {
        requirementsMap = Object.fromEntries(reqs.map((r: { id: string; crop: string }) => [r.id, r]))
      }
    } catch {
      // Fallback
    }
  }

  // 3. Buyer's Own Requirements (newest first)
  const { data: rawRequirements } = await supabase
    .from('buyer_requirements')
    .select('*')
    .eq('buyer_id', buyerProfile.id)
    .order('created_at', { ascending: false })

  const requirementsList: BuyerRequirement[] = (rawRequirements || []) as BuyerRequirement[]

  return (
    <div className="p-3 md:p-6 max-w-7xl mx-auto space-y-5 md:space-y-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-emerald-950">{t('dashboardTitle')}</h1>
          <p className="text-emerald-700 text-sm md:text-base mt-0.5">
            {buyerProfile.business_name} | {buyerProfile.buyer_type}
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Link
            href="/buyer/requirements/new"
            className="flex-1 sm:flex-initial min-h-[48px] bg-emerald-700 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold transition shadow-sm text-sm md:text-base"
          >
            <Plus className="w-5 h-5" /> {t('postRequirement')}
          </Link>
          <Link
            href="/marketplace"
            className="flex-1 sm:flex-initial min-h-[48px] bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold transition shadow-sm text-sm md:text-base"
          >
            <Search className="w-4 h-4" /> {t('searchProduce')}
          </Link>
        </div>
      </header>

      {buyerProfile.verification_status === 'PENDING' && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-amber-900 text-sm md:text-base">{t('verificationPendingTitle')}</h4>
            <p className="text-amber-800 text-xs md:text-sm mt-0.5">
              {t('verificationPendingDesc')}
            </p>
          </div>
        </div>
      )}

      {/* 4 Stat Cards (2x2 on mobile, 4 columns on desktop) - Tappable */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {/* Available Produce */}
        <Link
          href="/marketplace"
          className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-emerald-100 flex flex-col justify-between hover:border-emerald-300 hover:shadow-md transition group min-h-[108px]"
        >
          <div className="flex items-center justify-between mb-2">
            <Store className="w-7 h-7 md:w-8 md:h-8 text-emerald-600 group-hover:scale-105 transition" />
            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-600 transition" />
          </div>
          <div>
            <span className="text-xs md:text-sm font-semibold text-emerald-800 block line-clamp-1">{t('availableProduce')}</span>
            <span className="text-2xl md:text-3xl font-black text-emerald-950">{(availableProduceCount ?? 0).toLocaleString('en-IN')}</span>
          </div>
        </Link>

        {/* My Active Requirements */}
        <a
          href="#requirements-section"
          className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-emerald-100 flex flex-col justify-between hover:border-emerald-300 hover:shadow-md transition group min-h-[108px]"
        >
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-7 h-7 md:w-8 md:h-8 text-emerald-600 group-hover:scale-105 transition" />
            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-600 transition" />
          </div>
          <div>
            <span className="text-xs md:text-sm font-semibold text-emerald-800 block line-clamp-1">{t('myActiveRequirements')}</span>
            <span className="text-2xl md:text-3xl font-black text-emerald-950">{(activeRequirementsCount ?? 0).toLocaleString('en-IN')}</span>
          </div>
        </a>

        {/* Active Enquiries */}
        <Link
          href="/messages"
          className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-emerald-100 flex flex-col justify-between hover:border-emerald-300 hover:shadow-md transition group min-h-[108px]"
        >
          <div className="flex items-center justify-between mb-2">
            <MessageCircle className="w-7 h-7 md:w-8 md:h-8 text-emerald-600 group-hover:scale-105 transition" />
            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-600 transition" />
          </div>
          <div>
            <span className="text-xs md:text-sm font-semibold text-emerald-800 block line-clamp-1">{t('activeEnquiries')}</span>
            <span className="text-2xl md:text-3xl font-black text-emerald-950">{(activeEnquiriesCount ?? 0).toLocaleString('en-IN')}</span>
          </div>
        </Link>

        {/* Completed Deals */}
        <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-emerald-100 flex flex-col justify-between min-h-[108px]">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle2 className="w-7 h-7 md:w-8 md:h-8 text-emerald-600" />
          </div>
          <div>
            <span className="text-xs md:text-sm font-semibold text-emerald-800 block line-clamp-1">{t('completedDeals')}</span>
            <span className="text-2xl md:text-3xl font-black text-emerald-950">{(completedDealsCount ?? 0).toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 mt-4">
        {/* Recent Active Conversations */}
        <div className="bg-white rounded-2xl p-4 md:p-6 border border-emerald-100 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-2">
            <h3 className="text-lg md:text-xl font-bold text-emerald-950">
              {t('recentConversations')}
            </h3>
            <Link
              href="/messages"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              {t('viewAll')} <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {recentConversations.length > 0 ? (
            <div className="space-y-2.5 flex-grow">
              {recentConversations.map((conv) => {
                const isReqConv = Boolean(conv.requirement_id)
                const rawCropName = isReqConv
                  ? (conv.requirement_id ? requirementsMap[conv.requirement_id]?.crop : undefined)
                  : (conv.marketplace_listings?.crop_name || (conv.listing_id ? listingsMap[conv.listing_id]?.crop_name : undefined) || '')
                const cropName = rawCropName ? getCropDisplayName(rawCropName, locale) : (tNav('marketplace') || 'Produce')
                const farmerName = farmersMap[conv.farmer_id]?.name || tNav('home')
                const lastMsg = lastMessageMap[conv.id]
                const timestamp = lastMsg?.created_at || conv.created_at

                return (
                  <Link
                    key={conv.id}
                    href={`/messages/${conv.id}`}
                    className="block p-3.5 rounded-xl border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/40 transition min-h-[64px]"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-gray-900 text-base">{cropName}</h4>
                        <p className="text-xs text-emerald-700 font-medium">
                          {t('with')} {farmerName}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    {lastMsg?.message && (
                      <p className="text-xs text-gray-500 mt-1.5 line-clamp-1 italic">
                        &quot;{lastMsg.message}&quot;
                      </p>
                    )}
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500 flex flex-col items-center justify-center flex-grow">
              <MessageCircle className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-sm">{t('noActiveConversations')}</p>
              <Link href="/marketplace" className="text-emerald-700 font-bold mt-2 inline-flex items-center gap-1 hover:underline text-sm min-h-[44px]">
                {t('browseMarketplace')} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>

        {/* My Requirements */}
        <div id="requirements-section" className="bg-white rounded-2xl p-4 md:p-6 border border-emerald-100 shadow-sm flex flex-col scroll-mt-20">
          <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
            <h3 className="text-lg md:text-xl font-bold text-emerald-950">
              {t('myRequirements')}
            </h3>
            <Link
              href="/buyer/requirements/new"
              className="text-xs text-emerald-800 font-bold bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3.5 py-1.5 rounded-full flex items-center gap-1 transition min-h-[36px]"
            >
              <Plus className="w-3.5 h-3.5" /> {t('addNew')}
            </Link>
          </div>

          {requirementsList.length > 0 ? (
            <div className="space-y-3 flex-grow overflow-y-auto max-h-[520px] pr-1">
              {requirementsList.map((req) => (
                <BuyerRequirementItem key={req.id} requirement={req} />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500 flex flex-col items-center justify-center flex-grow">
              <TrendingUp className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-sm">{t('noRequirements')}</p>
              <Link
                href="/buyer/requirements/new"
                className="mt-3 inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-sm rounded-xl transition shadow-sm min-h-[48px]"
              >
                <Plus className="w-4 h-4" /> {t('postFirstRequirement')}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
