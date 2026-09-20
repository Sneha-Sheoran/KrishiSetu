'use client'

import { usePathname, useRouter } from '@/i18n/routing'
import { useSearchParams } from 'next/navigation'
import { useLocale } from 'next-intl'

export default function LanguageSwitcher() {
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
    <button
      type="button"
      onClick={toggleLocale}
      className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-900/70 text-emerald-100 hover:text-white hover:bg-emerald-700/60 border border-emerald-600/40 flex items-center gap-1 transition min-h-[36px] min-w-[56px] justify-center"
      aria-label="Toggle language between English and Hindi"
    >
      <span className={locale === 'en' ? 'text-white font-extrabold underline decoration-emerald-400 underline-offset-2' : 'text-emerald-300 font-normal'}>EN</span>
      <span className="text-emerald-400">/</span>
      <span className={locale === 'hi' ? 'text-white font-extrabold underline decoration-emerald-400 underline-offset-2' : 'text-emerald-300 font-normal'}>हिं</span>
    </button>
  )
}
