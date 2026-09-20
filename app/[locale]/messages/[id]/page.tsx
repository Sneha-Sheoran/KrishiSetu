'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient, isSupabaseConfigured } from '@/utils/supabase/client'
import { Send, ArrowLeft, Tag } from 'lucide-react'
import { Link } from '@/i18n/routing'
import { useTranslations, useLocale } from 'next-intl'
import { getCropDisplayName } from '@/lib/constants/crops'

interface MessageItem {
  id?: string
  conversation_id: string
  sender_id: string
  message: string
  created_at: string
}

interface CounterpartBuyer {
  business_name?: string
  buyer_type?: string
  verification_status?: string
}

interface CounterpartFarmer {
  name?: string
  verification_status?: string
}

interface ListingDetails {
  crop_name?: string
  quantity?: number
  expected_price?: number
  unit?: string
}

interface RequirementDetails {
  crop?: string
  required_quantity?: number
  target_price?: number | null
  unit?: string
}

interface ConversationDetails {
  id: string
  buyer_id?: string
  farmer_id?: string
  listing_id?: string | null
  requirement_id?: string | null
  marketplace_listings?: ListingDetails | null
  requirement?: RequirementDetails | null
  buyer?: CounterpartBuyer | null
  farmer?: CounterpartFarmer | null
}

export default function MessagingPage({ params }: { params: Promise<{ id: string }> }) {
  const t = useTranslations('Messages')
  const tUnits = useTranslations('Units')
  const locale = useLocale()

  const [messages, setMessages] = useState<MessageItem[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [conversation, setConversation] = useState<ConversationDetails | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [convId, setConvId] = useState<string>('')

  useEffect(() => {
    params.then(({ id }) => setConvId(id))
  }, [params])

  useEffect(() => {
    if (!convId) return
    const supabase = createClient()

    const setup = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserId(user.id)

      // Fetch initial messages
      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true })
      
      if (msgs) setMessages(msgs as MessageItem[])

      // Fetch conversation details
      const { data: conv } = await supabase
        .from('conversations')
        .select('*, marketplace_listings(crop_name, quantity, expected_price, unit)')
        .eq('id', convId)
        .single()
      
      if (conv) {
        let buyerProfile: CounterpartBuyer | null = null
        let farmerProfile: CounterpartFarmer | null = null

        if (conv.buyer_id) {
          try {
            const { data: buyer } = await supabase
              .from('public_buyers')
              .select('business_name, buyer_type, verification_status')
              .eq('user_id', conv.buyer_id)
              .single()
            if (buyer) buyerProfile = buyer as CounterpartBuyer
          } catch {}
        }

        if (conv.farmer_id) {
          try {
            const { data: farmer } = await supabase
              .from('public_users')
              .select('name, verification_status')
              .eq('id', conv.farmer_id)
              .single()
            if (farmer) farmerProfile = farmer as CounterpartFarmer
          } catch {}
        }

        let requirementDetails: RequirementDetails | null = null
        if (conv.requirement_id) {
          try {
            const { data: req } = await supabase
              .from('buyer_requirements')
              .select('crop, required_quantity, target_price, unit')
              .eq('id', conv.requirement_id)
              .single()
            if (req) requirementDetails = req as RequirementDetails
          } catch {}
        }

        setConversation({
          ...conv,
          buyer: buyerProfile,
          farmer: farmerProfile,
          requirement: requirementDetails
        })
      }
    }

    setup()

    // Subscribe to realtime updates
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${convId}`,
        },
        (payload: { new: MessageItem }) => {
          setMessages((current) => [...current, payload.new])
        }
      )
      .subscribe()

    // Fallback polling for local shim mode only (real Supabase uses Realtime without polling)
    const isShim = Boolean((supabase as unknown as { isShim?: boolean })?.isShim || !isSupabaseConfigured())
    let pollInterval: NodeJS.Timeout | null = null

    if (isShim) {
      pollInterval = setInterval(async () => {
        const { data: msgs } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', convId)
          .order('created_at', { ascending: true })

        if (msgs) {
          setMessages(msgs as MessageItem[])
        }
      }, 3000)
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval)
      supabase.removeChannel(channel)
    }
  }, [convId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !userId || !convId) return

    const msg = newMessage
    setNewMessage('') // optimistic clear

    const supabase = createClient()
    await supabase.from('messages').insert({
      conversation_id: convId,
      sender_id: userId,
      message: msg
    })
  }

  if (!conversation) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-8 text-center text-gray-500">
        {t('loading')}
      </div>
    )
  }

  const counterpartName = conversation.buyer?.business_name || conversation.farmer?.name || t('counterpart')
  const isVerified = conversation.buyer?.verification_status === 'VERIFIED' || conversation.farmer?.verification_status === 'VERIFIED'
  const isRequirement = Boolean(conversation.requirement_id)
  const rawCrop = isRequirement ? conversation.requirement?.crop : conversation.marketplace_listings?.crop_name
  const cropTitle = rawCrop ? getCropDisplayName(rawCrop, locale) : (isRequirement ? t('buyerRequest') : t('produceListing'))
  const rawUnit = isRequirement ? conversation.requirement?.unit : conversation.marketplace_listings?.unit
  const unitLabel = rawUnit && tUnits.has(rawUnit as any) ? tUnits(rawUnit as any) : rawUnit

  return (
    <div className="fixed inset-0 z-40 bg-gray-50 flex flex-col h-[100dvh] md:static md:max-w-4xl md:mx-auto md:p-6 md:h-[calc(100vh-80px)]">
      {/* Header Bar */}
      <div className="bg-white md:rounded-t-2xl shadow-sm border-b md:border border-emerald-100 p-3 md:p-4 flex items-center justify-between z-10 relative flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Link
            href="/messages"
            className="min-w-[48px] min-h-[48px] -ml-1 rounded-xl flex items-center justify-center text-emerald-950 hover:bg-emerald-50 transition flex-shrink-0"
            aria-label={t('backToMessages')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-black text-emerald-950 text-base md:text-lg truncate">
                {cropTitle}
              </h2>
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
            <p className="text-xs text-gray-600 truncate">
              {t('with')} <span className="font-bold text-gray-800">{counterpartName}</span>
            </p>
          </div>
        </div>

        {isRequirement && conversation.requirement ? (
          <div className="text-right flex-shrink-0 pl-2">
            <div className="text-xs md:text-sm font-black text-amber-700">
              {conversation.requirement.target_price && conversation.requirement.target_price > 0
                ? `₹${conversation.requirement.target_price.toLocaleString('en-IN')}`
                : t('priceOpen')}
              {unitLabel && <span className="text-[10px] md:text-xs font-semibold text-gray-500">/{unitLabel}</span>}
            </div>
            <div className="text-[11px] text-gray-500 font-semibold">
              {t('qty')}: {conversation.requirement.required_quantity} {unitLabel}
            </div>
          </div>
        ) : conversation.marketplace_listings ? (
          <div className="text-right flex-shrink-0 pl-2">
            <div className="text-xs md:text-sm font-black text-emerald-800">
              ₹{conversation.marketplace_listings.expected_price?.toLocaleString('en-IN')}
              <span className="text-[10px] md:text-xs font-semibold text-gray-500">/{unitLabel}</span>
            </div>
            <div className="text-[11px] text-gray-500 font-semibold">
              {t('qty')}: {conversation.marketplace_listings.quantity} {unitLabel}
            </div>
          </div>
        ) : null}
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:border-x border-emerald-100 flex flex-col bg-emerald-50/20">
        {messages.map((msg, idx) => {
          const isMe = msg.sender_id === userId
          return (
            <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-3 shadow-sm break-words ${
                  isMe
                    ? 'bg-emerald-700 text-white rounded-tr-sm'
                    : 'bg-white border border-gray-200 text-gray-900 rounded-tl-sm'
                }`}
              >
                <p className="text-sm md:text-base leading-relaxed">{msg.message}</p>
                <span
                  className={`text-[10px] block mt-1.5 ${
                    isMe ? 'text-emerald-200 text-right' : 'text-gray-400'
                  }`}
                >
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar (Fixed at bottom with safe area padding) */}
      <div className="bg-white md:rounded-b-2xl shadow-sm border-t md:border border-emerald-100 p-2.5 md:p-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:pb-4 flex-shrink-0">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={t('typeMessage')}
            className="flex-grow h-12 bg-gray-50 border border-gray-300 rounded-xl px-4 outline-none focus:ring-2 focus:ring-emerald-500 text-base text-gray-900"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="min-w-[48px] min-h-[48px] h-12 w-12 bg-emerald-700 hover:bg-emerald-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white rounded-xl transition flex items-center justify-center flex-shrink-0 shadow-sm"
            aria-label={t('sendMessage')}
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  )
}
