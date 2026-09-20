import { Link } from '@/i18n/routing'
import { getTranslations } from 'next-intl/server'
import { Tractor } from 'lucide-react'
import GuestMobileNav from '@/components/GuestMobileNav'
import LanguageSwitcher from '@/components/LanguageSwitcher'

export async function GuestNavbar() {
  const t = await getTranslations('Nav')

  return (
    <nav className="bg-emerald-800 text-white shadow-md">
      {/* Desktop Top Nav */}
      <div className="hidden md:block max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
              <Tractor className="w-6 h-6 text-emerald-300" />
              KrishiSetu
            </Link>
          </div>

          <div className="flex items-center space-x-1">
            <Link href="/" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-emerald-700 transition">
              {t('home')}
            </Link>
            <Link href="/advisory" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-emerald-700 transition">
              {t('advisory')}
            </Link>
            <Link href="/market" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-emerald-700 transition">
              {t('market')}
            </Link>
            <Link href="/marketplace" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-emerald-700 transition">
              {t('marketplace')}
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link
              href="/login"
              className="px-4 py-2 hover:bg-emerald-700 rounded-md transition text-sm font-medium"
            >
              {t('login')}
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-md transition text-sm font-medium shadow-sm"
            >
              {t('getStarted')}
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Guest Top Bar & Menu */}
      <GuestMobileNav />
    </nav>
  )
}
