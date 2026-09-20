'use client'

import { useState } from 'react'
import { Link, usePathname, useRouter } from '@/i18n/routing'
import { useSearchParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { Tractor, Menu, X, Home, Leaf, LineChart, Store, ChevronRight } from 'lucide-react'

export default function GuestMobileNav() {
  const t = useTranslations('Nav')
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const locale = useLocale()

  const toggleLocale = () => {
    const nextLocale = locale === 'en' ? 'hi' : 'en'
    const sp = searchParams.toString()
    const target = sp ? `${pathname}?${sp}` : pathname
    router.replace(target, { locale: nextLocale })
  }

  return (
    <div className="md:hidden">
      {/* Mobile Top Bar */}
      <div className="bg-emerald-800 text-white px-3 h-16 flex items-center justify-between border-b border-emerald-900 shadow-sm sticky top-0 z-40">
        <Link href="/" className="flex items-center gap-1.5 font-bold text-lg tracking-tight text-white flex-shrink-0">
          <Tractor className="w-5 h-5 text-emerald-300" />
          <span>KrishiSetu</span>
        </Link>

        <div className="flex items-center gap-1.5">
          <Link
            href="/login"
            className="px-2.5 py-1.5 rounded-lg text-emerald-100 hover:text-white hover:bg-emerald-700/60 font-semibold text-xs transition min-h-[44px] flex items-center justify-center"
          >
            {t('login')}
          </Link>
          <Link
            href="/register"
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white font-bold text-xs transition shadow-sm min-h-[44px] flex items-center justify-center"
          >
            {t('getStarted')}
          </Link>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-10 h-10 rounded-lg bg-emerald-700 hover:bg-emerald-600 flex items-center justify-center text-white transition min-w-[44px] min-h-[44px]"
            aria-label={t('toggleNavMenu')}
            aria-expanded={isOpen}
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="bg-white border-b border-gray-200 px-4 py-3 shadow-lg space-y-1 animate-in slide-in-from-top-2 text-gray-800">
          <Link
            href="/"
            onClick={() => setIsOpen(false)}
            className="flex items-center justify-between py-3 px-2 rounded-xl hover:bg-emerald-50 text-base font-medium min-h-[48px]"
          >
            <div className="flex items-center gap-3 text-emerald-900">
              <Home className="w-5 h-5 text-emerald-600" />
              <span>{t('home')}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </Link>

          <Link
            href="/advisory"
            onClick={() => setIsOpen(false)}
            className="flex items-center justify-between py-3 px-2 rounded-xl hover:bg-emerald-50 text-base font-medium min-h-[48px]"
          >
            <div className="flex items-center gap-3 text-emerald-900">
              <Leaf className="w-5 h-5 text-emerald-600" />
              <span>{t('advisory')}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </Link>

          <Link
            href="/market"
            onClick={() => setIsOpen(false)}
            className="flex items-center justify-between py-3 px-2 rounded-xl hover:bg-emerald-50 text-base font-medium min-h-[48px]"
          >
            <div className="flex items-center gap-3 text-emerald-900">
              <LineChart className="w-5 h-5 text-emerald-600" />
              <span>{t('market')}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </Link>

          <Link
            href="/marketplace"
            onClick={() => setIsOpen(false)}
            className="flex items-center justify-between py-3 px-2 rounded-xl hover:bg-emerald-50 text-base font-medium min-h-[48px]"
          >
            <div className="flex items-center gap-3 text-emerald-900">
              <Store className="w-5 h-5 text-emerald-600" />
              <span>{t('marketplace')}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </Link>

          {/* Language Toggle in guest menu */}
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between py-2 px-2">
            <span className="text-sm font-semibold text-gray-600">{t('language')}:</span>
            <button
              type="button"
              onClick={toggleLocale}
              className="px-3 py-1.5 text-xs font-bold rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1 transition min-h-[44px]"
            >
              <span className={locale === 'en' ? 'font-extrabold underline' : ''}>EN</span>
              <span>/</span>
              <span className={locale === 'hi' ? 'font-extrabold underline' : ''}>हिं</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
