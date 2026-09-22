'use client'

import { useState, useEffect } from 'react'
import { Link, usePathname, useRouter } from '@/i18n/routing'
import { useSearchParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import {
  Tractor,
  Home,
  Store,
  MessageCircle,
  MoreHorizontal,
  Plus,
  X,
  User,
  Leaf,
  FileText,
  LineChart,
  Globe,
  ChevronRight,
  ShieldCheck,
  Package
} from 'lucide-react'

interface MobileNavProps {
  role?: string | null
  userName?: string | null
}

export default function MobileNav({ role }: MobileNavProps) {
  const t = useTranslations('Nav')
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const locale = useLocale()

  const [isMoreOpen, setIsMoreOpen] = useState(false)

  const isFarmer = role === 'FARMER'
  const isBuyer = role === 'BUYER'
  const isAdmin = role === 'ADMIN'

  // Close sheet on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMoreOpen(false)
    }
    if (isMoreOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isMoreOpen])

  const toggleLocale = () => {
    const nextLocale = locale === 'en' ? 'hi' : 'en'
    const sp = searchParams.toString()
    const target = sp ? `${pathname}?${sp}` : pathname
    router.replace(target, { locale: nextLocale })
  }

  // Check if we are inside a specific chat conversation (/messages/[id])
  const isChatRoom = pathname.startsWith('/messages/') && pathname !== '/messages'

  // Check if current route matches tab
  const isHomeActive = isFarmer
    ? pathname === '/dashboard'
    : isBuyer
    ? pathname === '/buyer'
    : pathname === '/admin'
  const isMarketActive = pathname === '/marketplace' || pathname.startsWith('/marketplace/') && !pathname.includes('/create') && !pathname.includes('/my-listings')
  const isActionActive = isFarmer
    ? pathname === '/marketplace/create'
    : isBuyer
    ? pathname === '/buyer/requirements/new'
    : false
  const isMessagesActive = pathname === '/messages' || pathname.startsWith('/messages/')

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden bg-emerald-800 text-white px-4 h-16 flex items-center justify-between border-b border-emerald-900 shadow-sm sticky top-0 z-40">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-white">
          <Tractor className="w-6 h-6 text-emerald-300" />
          <span>KrishiSetu</span>
        </Link>

        <div className="flex items-center gap-2.5">
          {/* Compact Language Toggle */}
          <button
            type="button"
            onClick={toggleLocale}
            className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-900/70 text-emerald-100 hover:text-white hover:bg-emerald-700/60 border border-emerald-600/40 flex items-center gap-1 transition min-h-[36px] min-w-[56px] justify-center"
            aria-label={t('toggleLanguage')}
          >
            <span className={locale === 'en' ? 'text-white font-extrabold underline decoration-emerald-400 underline-offset-2' : 'text-emerald-300 font-normal'}>EN</span>
            <span className="text-emerald-400">/</span>
            <span className={locale === 'hi' ? 'text-white font-extrabold underline decoration-emerald-400 underline-offset-2' : 'text-emerald-300 font-normal'}>हिं</span>
          </button>

          {/* Profile Icon */}
          <Link
            href="/profile"
            className="w-10 h-10 bg-emerald-700 rounded-full flex items-center justify-center hover:bg-emerald-600 transition text-emerald-100 min-h-[44px] min-w-[44px]"
            aria-label={t('profile')}
          >
            <User className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar (Hidden on chat room /messages/[id]) */}
      {!isChatRoom && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 text-gray-500 z-40 pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
          {isAdmin ? (
            /* Admin: Pre-mobile-redesign bar maintained with Home -> /admin */
            <div className="flex justify-around items-center h-16 px-2">
              <Link
                href="/admin"
                className={`flex flex-col items-center justify-center min-w-[48px] min-h-[48px] px-2 py-1 transition ${
                  pathname === '/admin' ? 'text-emerald-700 font-bold' : 'hover:text-emerald-700'
                }`}
              >
                <ShieldCheck className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">{t('adminPanel')}</span>
              </Link>
              <Link
                href="/market"
                className={`flex flex-col items-center justify-center min-w-[48px] min-h-[48px] px-2 py-1 transition ${
                  pathname === '/market' ? 'text-emerald-700 font-bold' : 'hover:text-emerald-700'
                }`}
              >
                <LineChart className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">{t('mandiPrices')}</span>
              </Link>
              <Link
                href="/marketplace"
                className={`flex flex-col items-center justify-center min-w-[48px] min-h-[48px] px-2 py-1 transition ${
                  isMarketActive ? 'text-emerald-700 font-bold' : 'hover:text-emerald-700'
                }`}
              >
                <Store className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">{t('marketplace')}</span>
              </Link>
              <Link
                href="/messages"
                className={`flex flex-col items-center justify-center min-w-[48px] min-h-[48px] px-2 py-1 transition ${
                  isMessagesActive ? 'text-emerald-700 font-bold' : 'hover:text-emerald-700'
                }`}
              >
                <MessageCircle className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">{t('messages')}</span>
              </Link>
            </div>
          ) : (
            /* Farmer & Buyer: 5 items with raised center button */
            <div className="grid grid-cols-5 items-center h-16 px-1">
              {/* Item 1: Home */}
              <Link
                href={isFarmer ? '/dashboard' : '/buyer'}
                className={`flex flex-col items-center justify-center min-w-[48px] min-h-[48px] p-1 transition ${
                  isHomeActive ? 'text-emerald-700 font-bold' : 'hover:text-emerald-700'
                }`}
              >
                <Home className="w-5 h-5 mb-0.5" />
                <span className="text-xs font-medium">{t('home')}</span>
              </Link>

              {/* Item 2: Market */}
              <Link
                href="/marketplace"
                className={`flex flex-col items-center justify-center min-w-[48px] min-h-[48px] p-1 transition ${
                  isMarketActive ? 'text-emerald-700 font-bold' : 'hover:text-emerald-700'
                }`}
              >
                <Store className="w-5 h-5 mb-0.5" />
                <span className="text-xs font-medium">{t('marketplace')}</span>
              </Link>

              {/* Item 3: Raised Centre Button (+ Action) */}
              <div className="flex flex-col items-center justify-center -mt-5">
                <Link
                  href={isFarmer ? '/marketplace/create' : '/buyer/requirements/new'}
                  className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition transform active:scale-95 bg-emerald-600 text-white hover:bg-emerald-500 ${
                    isActionActive ? 'ring-4 ring-emerald-200' : ''
                  }`}
                  aria-label={isFarmer ? t('sell') : t('postNeed')}
                >
                  <Plus className="w-6 h-6 stroke-[2.5]" />
                </Link>
                <span className="text-[11px] font-bold text-emerald-800 mt-0.5">
                  {isFarmer ? t('sell') : t('postNeed')}
                </span>
              </div>

              {/* Item 4: Messages */}
              <Link
                href="/messages"
                className={`flex flex-col items-center justify-center min-w-[48px] min-h-[48px] p-1 transition ${
                  isMessagesActive ? 'text-emerald-700 font-bold' : 'hover:text-emerald-700'
                }`}
              >
                <MessageCircle className="w-5 h-5 mb-0.5" />
                <span className="text-xs font-medium">{t('messages')}</span>
              </Link>

              {/* Item 5: More */}
              <button
                type="button"
                onClick={() => setIsMoreOpen(true)}
                className={`flex flex-col items-center justify-center min-w-[48px] min-h-[48px] p-1 transition ${
                  isMoreOpen ? 'text-emerald-700 font-bold' : 'hover:text-emerald-700'
                }`}
                aria-label={t('more')}
              >
                <MoreHorizontal className="w-5 h-5 mb-0.5" />
                <span className="text-xs font-medium">{t('more')}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Accessible "More" Bottom Sheet */}
      {isMoreOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/60 flex flex-col justify-end transition-opacity animate-in fade-in"
          onClick={() => setIsMoreOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="more-sheet-title"
        >
          <div
            className="bg-white rounded-t-3xl p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle & Header */}
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-2" />
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 id="more-sheet-title" className="text-lg font-bold text-gray-900">
                {t('more')}
              </h2>
              <button
                type="button"
                onClick={() => setIsMoreOpen(false)}
                className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-800 transition min-w-[44px] min-h-[44px]"
                aria-label={t('close')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Menu Items */}
            <div className="divide-y divide-gray-100">
              {isFarmer && (
                <>
                  <Link
                    href="/marketplace/my-listings"
                    onClick={() => setIsMoreOpen(false)}
                    className="flex items-center justify-between py-3.5 px-2 hover:bg-emerald-50 rounded-xl transition text-gray-800 font-medium text-base min-h-[48px]"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                        <Package className="w-5 h-5" />
                      </div>
                      <span>{t('myListings')}</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </Link>

                  <Link
                    href="/advisory"
                    onClick={() => setIsMoreOpen(false)}
                    className="flex items-center justify-between py-3.5 px-2 hover:bg-emerald-50 rounded-xl transition text-gray-800 font-medium text-base min-h-[48px]"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                        <Leaf className="w-5 h-5" />
                      </div>
                      <span>{t('advisory')}</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </Link>

                  <Link
                    href="/records"
                    onClick={() => setIsMoreOpen(false)}
                    className="flex items-center justify-between py-3.5 px-2 hover:bg-emerald-50 rounded-xl transition text-gray-800 font-medium text-base min-h-[48px]"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                        <FileText className="w-5 h-5" />
                      </div>
                      <span>{t('records')}</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </Link>
                </>
              )}

              {/* Both Farmer & Buyer */}
              <Link
                href="/market"
                onClick={() => setIsMoreOpen(false)}
                className="flex items-center justify-between py-3.5 px-2 hover:bg-emerald-50 rounded-xl transition text-gray-800 font-medium text-base min-h-[48px]"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <LineChart className="w-5 h-5" />
                  </div>
                  <span>{t('mandiPrices')}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </Link>

              <Link
                href="/profile"
                onClick={() => setIsMoreOpen(false)}
                className="flex items-center justify-between py-3.5 px-2 hover:bg-emerald-50 rounded-xl transition text-gray-800 font-medium text-base min-h-[48px]"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <User className="w-5 h-5" />
                  </div>
                  <span>{t('profile')}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </Link>

              {/* Language Switch Option */}
              <button
                type="button"
                onClick={toggleLocale}
                className="w-full flex items-center justify-between py-3.5 px-2 hover:bg-emerald-50 rounded-xl transition text-gray-800 font-medium text-base min-h-[48px]"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <Globe className="w-5 h-5" />
                  </div>
                  <span>Language / भाषा ({locale === 'en' ? 'हिन्दी में बदलें' : 'Switch to English'})</span>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-md">
                  {locale === 'en' ? 'EN' : 'हिं'}
                </span>
              </button>
            </div>

            {/* Cancel Button */}
            <button
              type="button"
              onClick={() => setIsMoreOpen(false)}
              className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl transition min-h-[48px]"
            >
              {t('close')}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
