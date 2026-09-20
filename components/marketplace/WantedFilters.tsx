'use client'

import { useState, useCallback, useTransition } from 'react'
import { useRouter, usePathname } from '@/i18n/routing'
import { useSearchParams } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { Search, X, Filter, Sparkles } from 'lucide-react'
import { getCropDisplayName } from '@/lib/constants/crops'

interface WantedFiltersProps {
  initialQ: string
  initialCrop: string
  initialSort: string
  initialMatchesMyCrops: boolean
  availableCrops: string[]
  hasFarmerProduce: boolean
}

export default function WantedFilters({
  initialQ,
  initialCrop,
  initialSort,
  initialMatchesMyCrops,
  availableCrops,
  hasFarmerProduce
}: WantedFiltersProps) {
  const t = useTranslations('Marketplace')
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const [search, setSearch] = useState(initialQ)
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  const updateParam = useCallback(
    (key: string, value: string | boolean, resetPage = true) => {
      const params = new URLSearchParams(searchParams.toString())
      if (typeof value === 'boolean') {
        if (value) {
          params.set(key, 'true')
        } else {
          params.delete(key)
        }
      } else if (value && value !== 'ALL') {
        params.set(key, value)
      } else {
        params.delete(key)
      }

      if (resetPage) {
        params.delete('page')
      }

      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`)
      })
    },
    [pathname, router, searchParams]
  )

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateParam('q', search.trim())
  }

  const handleClearAll = () => {
    setSearch('')
    startTransition(() => {
      router.replace(pathname)
    })
  }

  const hasActiveFilters =
    Boolean(initialQ) ||
    (Boolean(initialCrop) && initialCrop !== 'ALL') ||
    initialMatchesMyCrops ||
    (Boolean(initialSort) && initialSort !== 'newest')

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6 shadow-sm">
      {/* Search Bar & Mobile Filter Button */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full min-h-[48px] pl-11 pr-10 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base"
          />
          <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('')
                updateParam('q', '')
              }}
              aria-label={t('clearSearch')}
              className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 absolute right-1 top-1/2 -translate-y-1/2 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className={`md:hidden min-h-[48px] px-3.5 rounded-xl border flex items-center gap-2 font-medium text-sm transition ${
            hasActiveFilters
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
          aria-label={t('openFilters')}
        >
          <Filter className="w-4 h-4" />
          <span>{t('filters')}</span>
        </button>
      </form>

      {/* Filter Options (Always visible on Desktop, collapsible on Mobile) */}
      <div className={`${showMobileFilters ? 'block' : 'hidden'} md:block pt-3 border-t border-gray-100`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {/* Crop Selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              {t('cropName')}
            </label>
            <select
              value={initialCrop || 'ALL'}
              onChange={(e) => updateParam('crop', e.target.value)}
              className="w-full min-h-[48px] px-3 py-2 rounded-xl border border-gray-300 bg-white text-base focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">{t('allCrops')}</option>
              {availableCrops.map((c) => (
                <option key={c} value={c}>
                  {getCropDisplayName(c, locale)}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              {t('sortBy')}
            </label>
            <select
              value={initialSort || 'newest'}
              onChange={(e) => updateParam('sort', e.target.value)}
              className="w-full min-h-[48px] px-3 py-2 rounded-xl border border-gray-300 bg-white text-base focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="newest">{t('sortNewest')}</option>
              <option value="required_soonest">{t('sortRequiredSoonest')}</option>
              <option value="price_high">{t('sortPriceHigh')}</option>
            </select>
          </div>

          {/* Matches My Crops Toggle */}
          {hasFarmerProduce && (
            <div className="flex items-end">
              <label
                className={`w-full min-h-[48px] px-3.5 py-2 rounded-xl border-2 cursor-pointer flex items-center gap-3 transition ${
                  initialMatchesMyCrops
                    ? 'border-emerald-600 bg-emerald-50/70 text-emerald-900 font-semibold'
                    : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={initialMatchesMyCrops}
                  onChange={(e) => updateParam('matchesMyCrops', e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
                <span className="text-sm flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  {t('matchesMyCrops')}
                </span>
              </label>
            </div>
          )}
        </div>

        {hasActiveFilters && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end">
            <button
              type="button"
              onClick={handleClearAll}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 min-h-[48px] px-3 py-2 flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              {t('clearAllFilters')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
