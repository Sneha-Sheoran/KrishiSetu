import { Link } from '@/i18n/routing'
import { createClient } from '@/utils/supabase/server'
import { Tractor, LineChart, Leaf, Store, MessageCircle, User, LayoutDashboard, FileText } from 'lucide-react'
import { GuestNavbar } from '@/components/GuestNavbar'
import MobileNav from '@/components/MobileNav'
import { getTranslations } from 'next-intl/server'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { checkHasUnreadMessages } from '@/lib/messages'

export async function Navbar() {
  const t = await getTranslations('Nav')
  let user: { id: string } | null = null
  let profile: { role?: string; name?: string } | null = null
  let hasUnreadMessages = false

  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    user = data?.user

    if (user) {
      const { data: userProfile } = await supabase.from('users').select('role, name').eq('id', user.id).single()
      profile = userProfile
      hasUnreadMessages = await checkHasUnreadMessages(supabase, user.id)
    }
  } catch (err) {
    console.error('Navbar Supabase session check error:', err)
  }

  if (!user) return <GuestNavbar />

  const isFarmer = profile?.role === 'FARMER'
  const isBuyer = profile?.role === 'BUYER'
  const isAdmin = profile?.role === 'ADMIN'

  return (
    <nav className="bg-emerald-800 text-white shadow-md">
      {/* Desktop Top Nav */}
      <div className="hidden md:block max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
              <Tractor className="w-6 h-6 text-emerald-300" />
              KrishiSetu
            </Link>
          </div>
          
          <div className="flex items-center space-x-1">
            {isFarmer && (
              <>
                <Link href="/dashboard" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-emerald-700 flex items-center gap-2"><LayoutDashboard className="w-4 h-4"/> {t('dashboard')}</Link>
                <Link href="/advisory" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-emerald-700 flex items-center gap-2"><Leaf className="w-4 h-4"/> {t('advisory')}</Link>
                <Link href="/records" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-emerald-700 flex items-center gap-2"><FileText className="w-4 h-4"/> {t('records')}</Link>
                <Link href="/marketplace/my-listings" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-emerald-700 flex items-center gap-2"><Store className="w-4 h-4"/> {t('myListings')}</Link>
              </>
            )}
            
            {isBuyer && (
              <Link href="/buyer" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-emerald-700 flex items-center gap-2"><LayoutDashboard className="w-4 h-4"/> {t('dashboard')}</Link>
            )}

            {isAdmin && (
              <Link href="/admin" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-emerald-700 text-red-200">{t('adminPanel')}</Link>
            )}

            <Link href="/market" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-emerald-700 flex items-center gap-2"><LineChart className="w-4 h-4"/> {t('mandiPrices')}</Link>
            <Link href="/marketplace" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-emerald-700 flex items-center gap-2"><Store className="w-4 h-4"/> {t('marketplace')}</Link>
            <Link href="/messages" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-emerald-700 flex items-center gap-2">
              <div className="relative flex items-center">
                <MessageCircle className="w-4 h-4"/>
                {hasUnreadMessages && (
                  <span
                    data-testid="unread-dot-desktop"
                    className="absolute -top-1 -right-1.5 w-2 h-2 bg-amber-400 rounded-full ring-2 ring-emerald-800"
                  />
                )}
              </div>
              {t('messages')}
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link href="/profile" className="p-2 bg-emerald-700 rounded-full hover:bg-emerald-600 transition" aria-label={t('profile')}>
              <User className="w-5 h-5 text-emerald-100" />
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile-First Navigation (Top bar + Bottom bar + More Bottom Sheet) */}
      <MobileNav role={profile?.role} userName={profile?.name} hasUnreadMessages={hasUnreadMessages} />
    </nav>
  )
}
