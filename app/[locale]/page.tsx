import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';

export default function HomePage() {
  const t = useTranslations('Index');
  const tNav = useTranslations('Navigation');

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-emerald-800 text-white p-4 flex justify-between items-center shadow-md">
        <div className="text-xl font-bold flex items-center gap-2">
          {t('title')}
        </div>
        <nav className="hidden md:flex gap-6">
          <Link href="/" className="hover:text-emerald-200">{tNav('home')}</Link>
          <Link href="/advisory" className="hover:text-emerald-200">{tNav('advisory')}</Link>
          <Link href="/market" className="hover:text-emerald-200">{tNav('market')}</Link>
          <Link href="/records" className="hover:text-emerald-200">{tNav('records')}</Link>
          <Link href="/marketplace" className="hover:text-emerald-200">{tNav('marketplace')}</Link>
        </nav>
        <div className="flex gap-4">
          <Link href="/login" className="px-4 py-2 hover:bg-emerald-700 rounded-md transition">{tNav('login')}</Link>
          <Link href="/register" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-md transition font-medium">{tNav('getStarted')}</Link>
        </div>
      </header>
      
      <main className="flex-grow flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold text-emerald-900 max-w-4xl mb-6">
          {t('headline')}
        </h1>
        <p className="text-lg md:text-xl text-emerald-800 max-w-2xl mb-10">
          {t('subheading')}
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/register" className="px-8 py-4 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-bold text-lg transition shadow-lg">
            {t('getStarted')}
          </Link>
          <Link href="/market" className="px-8 py-4 bg-white border-2 border-emerald-700 text-emerald-800 hover:bg-emerald-50 rounded-xl font-bold text-lg transition shadow-md">
            {t('exploreMarket')}
          </Link>
        </div>
      </main>
    </div>
  );
}
