import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Link } from '@/i18n/routing'
import { MessageCircle, ArrowRight, Clock, Tag } from 'lucide-react'
import { getTranslations, getLocale } from 'next-intl/server'
import { getCropDisplayName } from '@/lib/constants/crops'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface ConversationListing {
  id?: string
  crop_name?: string
  variety?: string | null
  quantity?: number
  expected_price?: number
  unit?: string
}

interface RequirementDetails {
  id: string
  crop: string
  required_quantity: number
  target_price?: number | null
  unit: string
}

interface ConversationItem {
  id: string
  buyer_id: string
  farmer_id: string
  created_at: string
  listing_id?: string | null
  requirement_id?: string | null
  marketplace_listings?: ConversationListing | null
}

export default async function MessagesInboxPage() {
  const locale = await getLocale()
  const t = await getTranslations('Messages')
  const tUnits = await getTranslations('Units')
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  
  // Fetch conversations where user is either farmer or buyer
  const columnToMatch = profile?.role === 'BUYER' ? 'buyer_id' : 'farmer_id'
  
  const { data: conversations } = await supabase
    .from('conversations')
    .select('*, marketplace_listings(crop_name, quantity, expected_price, unit)')
    .eq(columnToMatch, user.id)
    .order('created_at', { ascending: false })

  const convList: ConversationItem[] = (conversations || []) as unknown as ConversationItem[]
  const convIds = convList.map((c) => c.id).filter(Boolean)
  const buyerIds = Array.from(new Set(convList.map((c) => c.buyer_id).filter(Boolean)))
  const farmerIds = Array.from(new Set(convList.map((c) => c.farmer_id).filter(Boolean)))

  let buyersMap: Record<string, { business_name?: string; verification_status?: string }> = {}
  if (buyerIds.length > 0) {
    try {
      const { data: buyers } = await supabase
        .from('public_buyers')
        .select('user_id, business_name, verification_status')
        .in('user_id', buyerIds)
      if (buyers && Array.isArray(buyers)) {
        buyersMap = Object.fromEntries(buyers.map((b: { user_id: string; business_name?: string; verification_status?: string }) => [b.user_id, b]))
      }
    } catch {
      // Fallback
    }
  }

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
  const requirementIds = Array.from(new Set(convList.map((c) => c.requirement_id).filter(Boolean))) as string[]
  let requirementsMap: Record<string, RequirementDetails> = {}
  if (requirementIds.length > 0) {
    try {
      const { data: reqs } = await supabase
        .from('buyer_requirements')
        .select('id, crop, required_quantity, target_price, unit')
        .in('id', requirementIds)
      if (reqs && Array.isArray(reqs)) {
        requirementsMap = Object.fromEntries(reqs.map((r: RequirementDetails) => [r.id, r]))
      }
    } catch {
      // Fallback
    }
  }

  // Look up listings for listing-backed conversations
  const listingIds = Array.from(new Set(convList.map((c) => c.listing_id).filter(Boolean))) as string[]
  let listingsMap: Record<string, ConversationListing> = {}
  if (listingIds.length > 0) {
    try {
      const { data: listings } = await supabase
        .from('marketplace_listings')
        .select('id, crop_name, variety, quantity, expected_price, unit')
        .in('id', listingIds)
      if (listings && Array.isArray(listings)) {
        listingsMap = Object.fromEntries(listings.map((l: any) => [l.id, l]))
      }
    } catch {
      // Fallback
    }
  }

  // Single batch query: find all conversations with at least one unread message from the counterpart
  const unreadConvIds = new Set<string>()
  if (convIds.length > 0) {
    try {
      const { data: unreadMsgs } = await supabase
        .from('messages')
        .select('conversation_id')
        .in('conversation_id', convIds)
        .neq('sender_id', user.id)
        .is('read_at', null)
      if (unreadMsgs && Array.isArray(unreadMsgs)) {
        for (const m of unreadMsgs) {
          if (m.conversation_id) {
            unreadConvIds.add(m.conversation_id)
          }
        }
      }
    } catch {
      // Fallback
    }
  }

  return (
    <div className="p-3 md:p-6 max-w-4xl mx-auto space-y-5 md:space-y-6">
      <header className="border-b border-emerald-100 pb-3">
        <h1 className="text-2xl md:text-3xl font-black text-emerald-950">{t('title')}</h1>
        <p className="text-emerald-700 text-sm md:text-base mt-0.5">{t('subtitle')}</p>
      </header>

      <div className="space-y-3">
        {convList.length > 0 ? (
          convList.map((conv) => {
            const hasUnread = unreadConvIds.has(conv.id)
            const buyer = buyersMap[conv.buyer_id]
            const farmer = farmersMap[conv.farmer_id]
            const counterpartText = profile?.role === 'BUYER'
              ? (farmer?.name || t('farmer'))
              : (buyer?.business_name || t('buyer'))
            const isVerified = profile?.role === 'BUYER'
              ? farmer?.verification_status === 'VERIFIED'
              : buyer?.verification_status === 'VERIFIED'
            const lastMsg = lastMessageMap[conv.id]
            const timestamp = lastMsg?.created_at || conv.created_at

            const isRequirement = Boolean(conv.requirement_id)
            const req = conv.requirement_id ? requirementsMap[conv.requirement_id] : null
            const listing = conv.listing_id ? (listingsMap[conv.listing_id] || conv.marketplace_listings) : conv.marketplace_listings
            const rawCropName = isRequirement ? req?.crop : listing?.crop_name
            const variety = isRequirement ? null : listing?.variety
            let cropName = rawCropName ? getCropDisplayName(rawCropName, locale) : (isRequirement ? t('buyerRequest') : t('produceListing'))
            if (!isRequirement && rawCropName && variety) {
              cropName = `${cropName} (${variety})`
            }
            const rawUnit = isRequirement ? req?.unit : listing?.unit
            const unitLabel = rawUnit && tUnits.has(rawUnit as any) ? tUnits(rawUnit as any) : rawUnit

            return (
              <Link
                key={conv.id}
                href={`/messages/${conv.id}`}
                className={`block p-4 md:p-5 rounded-2xl border transition group min-h-[64px] ${
                  hasUnread
                    ? 'bg-emerald-50/60 border-emerald-300 shadow-sm hover:border-emerald-400 hover:shadow-md ring-1 ring-emerald-400/30'
                    : 'bg-white border-emerald-100 shadow-sm hover:border-emerald-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="relative flex-shrink-0">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition ${
                          hasUnread
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        <MessageCircle className="w-6 h-6" />
                      </div>
                      {hasUnread && (
                        <span
                          data-testid={`unread-dot-conv-${conv.id}`}
                          className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-500 rounded-full ring-2 ring-white shadow-sm"
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3
                          className={`text-base md:text-lg truncate ${
                            hasUnread ? 'font-black text-emerald-950' : 'font-extrabold text-emerald-900/90'
                          }`}
                        >
                          {cropName}
                        </h3>
                        {isRequirement && (
                          <span className="bg-amber-100 text-amber-900 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex-shrink-0 flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            {t('buyerRequest')}
                          </span>
                        )}
                        {isVerified && (
                          <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex-shrink-0">
                            {t('verified')}
                          </span>
                        )}
                      </div>
                      <div className="text-xs md:text-sm text-gray-600 flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                        {isRequirement && req ? (
                          <span className="font-semibold text-emerald-900">
                            {req.required_quantity} {unitLabel} • {req.target_price && req.target_price > 0 ? `₹${req.target_price.toLocaleString('en-IN')}` : t('priceOpen')}
                          </span>
                        ) : listing?.quantity !== undefined ? (
                          <span className="font-semibold text-emerald-900">
                            {listing.quantity} {unitLabel} @ ₹{listing.expected_price?.toLocaleString('en-IN')}
                          </span>
                        ) : null}
                        <span className="text-gray-300">•</span>
                        <span className="text-gray-700 font-medium truncate">
                          {counterpartText}
                        </span>
                      </div>
                      {lastMsg?.message && (
                        <p
                          className={`text-xs line-clamp-1 mt-1 ${
                            hasUnread
                              ? 'font-bold text-emerald-950 not-italic'
                              : 'text-gray-500 italic'
                          }`}
                        >
                          &quot;{lastMsg.message}&quot;
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end justify-between flex-shrink-0 gap-2">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[11px] flex items-center gap-1 ${
                          hasUnread ? 'font-bold text-emerald-800' : 'text-gray-400'
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        {new Date(timestamp).toLocaleDateString()}
                      </span>
                      {hasUnread && (
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-white flex-shrink-0" />
                      )}
                    </div>
                    <ArrowRight
                      className={`w-5 h-5 transition ${
                        hasUnread
                          ? 'text-emerald-700 font-bold group-hover:translate-x-0.5'
                          : 'text-gray-300 group-hover:text-emerald-600 group-hover:translate-x-0.5'
                      }`}
                    />
                  </div>
                </div>
              </Link>
            )
          })
        ) : (
          <div className="text-center py-16 bg-white rounded-3xl border border-gray-200 p-6">
            <MessageCircle className="w-14 h-14 text-emerald-200 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-emerald-900">{t('noConversations')}</h3>
            <p className="text-gray-500 text-sm mt-1">{t('noConversationsDesc')}</p>
            <Link
              href="/marketplace"
              className="mt-4 inline-flex items-center gap-1.5 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-sm rounded-xl transition shadow-sm min-h-[48px]"
            >
              {t('browseMarketplace')}
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
