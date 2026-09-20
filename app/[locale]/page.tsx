import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';

export default function HomePage() {
  const t = useTranslations('Index');

  return (
    <div className="flex flex-col min-h-screen">
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
