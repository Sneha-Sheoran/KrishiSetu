'use client'

import { useState, useEffect, useCallback, useTransition } from 'react'
import { useRouter, usePathname } from '@/i18n/routing'
import { useSearchParams } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { Search, X } from 'lucide-react'
import { getCropDisplayName } from '@/lib/constants/crops'

interface MarketplaceFiltersProps {
  initialQ: string
  initialCrop: string
  initialMinPrice: string
  initialMaxPrice: string
  initialGrade: string
  initialSort: string
  crops: string[]
  grades: string[]
}

export default function MarketplaceFilters({
  initialQ,
  initialCrop,
  initialMinPrice,
  initialMaxPrice,
  initialGrade,
  initialSort,
  crops,
  grades
}: MarketplaceFiltersProps) {
  const t = useTranslations('Marketplace')
  const tGrades = useTranslations('Grades')
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  // Manage search input state with prop change synchronization during render
  const [prevInitialQ, setPrevInitialQ] = useState(initialQ)
  const [search, setSearch] = useState(initialQ)
  if (initialQ !== prevInitialQ) {
    setPrevInitialQ(initialQ)
    setSearch(initialQ)
  }

  // Manage minPrice state
  const [prevInitialMinPrice, setPrevInitialMinPrice] = useState(initialMinPrice)
  const [minPrice, setMinPrice] = useState(initialMinPrice)
  if (initialMinPrice !== prevInitialMinPrice) {
    setPrevInitialMinPrice(initialMinPrice)
    setMinPrice(initialMinPrice)
  }

  // Manage maxPrice state
  const [prevInitialMaxPrice, setPrevInitialMaxPrice] = useState(initialMaxPrice)
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice)
  if (initialMaxPrice !== prevInitialMaxPrice) {
    setPrevInitialMaxPrice(initialMaxPrice)
    setMaxPrice(initialMaxPrice)
  }

  const updateParam = useCallback((key: string, value: string, resetPage = true) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'ALL') {
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
  }, [pathname, router, searchParams])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== initialQ) {
        updateParam('q', search.trim())
      }
    }, 350)
    return () => clearTimeout(timer)
  }, [search, initialQ, updateParam])

  // Debounced minPrice
  useEffect(() => {
    const timer = setTimeout(() => {
      if (minPrice !== initialMinPrice) {
        updateParam('minPrice', minPrice.trim())
      }
    }, 350)
    return () => clearTimeout(timer)
  }, [minPrice, initialMinPrice, updateParam])

  // Debounced maxPrice
  useEffect(() => {
    const timer = setTimeout(() => {
      if (maxPrice !== initialMaxPrice) {
        updateParam('maxPrice', maxPrice.trim())
      }
    }, 350)
    return () => clearTimeout(timer)
  }, [maxPrice, initialMaxPrice, updateParam])

  const clearFilters = () => {
    setSearch('')
    setMinPrice('')
    setMaxPrice('')
    startTransition(() => {
      router.replace(pathname)
    })
  }

  const hasActiveFilters = Boolean(
    initialQ ||
    (initialCrop && initialCrop !== 'ALL') ||
    initialMinPrice ||
    initialMaxPrice ||
    (initialGrade && initialGrade !== 'ALL') ||
    (initialSort && initialSort !== 'newest')
  )

  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [sheetCrop, setSheetCrop] = useState(initialCrop || 'ALL')
  const [sheetGrade, setSheetGrade] = useState(initialGrade || 'ALL')
  const [sheetMinPrice, setSheetMinPrice] = useState(initialMinPrice)
  const [sheetMaxPrice, setSheetMaxPrice] = useState(initialMaxPrice)
  const [sheetSort, setSheetSort] = useState(initialSort || 'newest')

  const openSheet = () => {
    setSheetCrop(initialCrop || 'ALL')
    setSheetGrade(initialGrade || 'ALL')
    setSheetMinPrice(initialMinPrice)
    setSheetMaxPrice(initialMaxPrice)
    setSheetSort(initialSort || 'newest')
    setIsSheetOpen(true)
  }

  // Count active non-search filters
  let activeFilterCount = 0
  if (initialCrop && initialCrop !== 'ALL') activeFilterCount++
  if (initialGrade && initialGrade !== 'ALL') activeFilterCount++
  if (initialMinPrice) activeFilterCount++
  if (initialMaxPrice) activeFilterCount++
  if (initialSort && initialSort !== 'newest') activeFilterCount++

  const applySheetFilters = () => {
    const params = new URLSearchParams(searchParams.toString())
    if (sheetCrop && sheetCrop !== 'ALL') params.set('crop', sheetCrop); else params.delete('crop')
    if (sheetGrade && sheetGrade !== 'ALL') params.set('grade', sheetGrade); else params.delete('grade')
    if (sheetMinPrice.trim()) params.set('minPrice', sheetMinPrice.trim()); else params.delete('minPrice')
    if (sheetMaxPrice.trim()) params.set('maxPrice', sheetMaxPrice.trim()); else params.delete('maxPrice')
    if (sheetSort && sheetSort !== 'newest') params.set('sort', sheetSort); else params.delete('sort')
    params.delete('page')

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`)
    })
    setIsSheetOpen(false)
  }

  const clearSheetFilters = () => {
    setSheetCrop('ALL')
    setSheetGrade('ALL')
    setSheetMinPrice('')
    setSheetMaxPrice('')
    setSheetSort('newest')

    const params = new URLSearchParams(searchParams.toString())
    params.delete('crop')
    params.delete('grade')
    params.delete('minPrice')
    params.delete('maxPrice')
    params.delete('sort')
    params.delete('page')

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`)
    })
    setIsSheetOpen(false)
  }

  return (
    <>
      {/* MOBILE VIEW: Sticky search bar + Filters bottom sheet trigger */}
      <div className="md:hidden sticky top-16 z-30 bg-orange-50/95 backdrop-blur-sm pb-2 pt-1 -mx-4 px-4">
        <div className="flex items-center gap-2">
          {/* Sticky Search Input */}
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full pl-10 pr-10 h-12 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white text-base shadow-sm"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 min-w-[36px] min-h-[36px] flex items-center justify-center"
                aria-label={t('clearSearch')}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filters Button */}
          <button
            type="button"
            onClick={openSheet}
            className={`h-12 px-3.5 rounded-xl border flex items-center justify-center gap-1.5 font-bold text-sm transition min-w-[80px] shadow-sm flex-shrink-0 ${
              activeFilterCount > 0
                ? 'bg-emerald-700 text-white border-emerald-800'
                : 'bg-white text-emerald-900 border-gray-300 hover:bg-emerald-50'
            }`}
            aria-label={t('openFilters')}
          >
            <span>{t('filters')}</span>
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-900 text-xs flex items-center justify-center font-black">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* MOBILE FILTERS BOTTOM SHEET */}
      {isSheetOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/60 flex flex-col justify-end transition-opacity"
          onClick={() => setIsSheetOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="filters-sheet-title"
        >
          <div
            className="bg-white rounded-t-3xl p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-2xl space-y-5 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle & Title */}
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-1" />
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 id="filters-sheet-title" className="text-xl font-bold text-emerald-950">
                {t('filterProduce')} {activeFilterCount > 0 && `(${activeFilterCount})`}
              </h2>
              <button
                type="button"
                onClick={() => setIsSheetOpen(false)}
                className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-800 transition min-w-[44px] min-h-[44px]"
                aria-label={t('closeFilters')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Sort By */}
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1.5">
                  {t('sortBy')}
                </label>
                <select
                  value={sheetSort}
                  onChange={(e) => setSheetSort(e.target.value)}
                  className="w-full h-12 border border-gray-300 rounded-xl px-3 outline-none bg-gray-50 text-base text-gray-800 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="newest">{t('sortNewest')}</option>
                  <option value="price_asc">{t('sortPriceLow')}</option>
                  <option value="price_desc">{t('sortPriceHigh')}</option>
                </select>
              </div>

              {/* Crop Filter */}
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1.5">
                  {t('cropName')}
                </label>
                <select
                  value={sheetCrop}
                  onChange={(e) => setSheetCrop(e.target.value)}
                  className="w-full h-12 border border-gray-300 rounded-xl px-3 outline-none bg-gray-50 text-base text-gray-800 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="ALL">{t('allCrops')}</option>
                  {crops.map((c) => (
                    <option key={c} value={c}>
                      {getCropDisplayName(c, locale)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quality Grade */}
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1.5">
                  {t('qualityGrade')}
                </label>
                <select
                  value={sheetGrade}
                  onChange={(e) => setSheetGrade(e.target.value)}
                  className="w-full h-12 border border-gray-300 rounded-xl px-3 outline-none bg-gray-50 text-base text-gray-800 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="ALL">{t('allGrades')}</option>
                  {grades.map((g) => (
                    <option key={g} value={g}>
                      {tGrades.has(g as any) ? tGrades(g as any) : g}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1.5">
                  {t('priceRange')}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    value={sheetMinPrice}
                    onChange={(e) => setSheetMinPrice(e.target.value)}
                    placeholder={t('minPrice')}
                    className="w-full h-12 border border-gray-300 rounded-xl px-3 outline-none bg-gray-50 text-base text-gray-800 focus:ring-2 focus:ring-emerald-500"
                  />
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    value={sheetMaxPrice}
                    onChange={(e) => setSheetMaxPrice(e.target.value)}
                    placeholder={t('maxPrice')}
                    className="w-full h-12 border border-gray-300 rounded-xl px-3 outline-none bg-gray-50 text-base text-gray-800 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 space-y-2.5">
              <button
                type="button"
                onClick={applySheetFilters}
                className="w-full h-12 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl transition shadow-md text-base"
              >
                {t('applyFilters')}
              </button>
              <button
                type="button"
                onClick={clearSheetFilters}
                className="w-full h-12 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition text-base"
              >
                {t('clearAllFilters')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DESKTOP VIEW: Inline filters (Preserved completely on md: and up) */}
      <div className="hidden md:block bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm space-y-4">
        {/* Top row: Search + Sort */}
        <div className="flex flex-row gap-3">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none bg-gray-50 text-sm"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={t('clearSearch')}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <select
              value={initialSort || 'newest'}
              onChange={(e) => updateParam('sort', e.target.value, false)}
              className="border border-gray-200 rounded-xl px-3 py-2.5 outline-none bg-gray-50 text-sm text-gray-700 min-w-[160px] focus:ring-2 focus:ring-emerald-500"
            >
              <option value="newest">{t('sortNewest')}</option>
              <option value="price_asc">{t('sortPriceLow')}</option>
              <option value="price_desc">{t('sortPriceHigh')}</option>
            </select>
          </div>
        </div>

        {/* Secondary row: Crop, Grade, Price Range, Clear */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2 border-t border-gray-100 items-center">
          {/* Crop dropdown */}
          <div>
            <select
              value={initialCrop || 'ALL'}
              onChange={(e) => updateParam('crop', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 outline-none bg-gray-50 text-sm text-gray-700 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">{t('allCrops')}</option>
              {crops.map((c) => (
                <option key={c} value={c}>
                  {getCropDisplayName(c, locale)}
                </option>
              ))}
            </select>
          </div>

          {/* Quality grade dropdown */}
          <div>
            <select
              value={initialGrade || 'ALL'}
              onChange={(e) => updateParam('grade', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 outline-none bg-gray-50 text-sm text-gray-700 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">{t('allGrades')}</option>
              {grades.map((g) => (
                <option key={g} value={g}>
                  {tGrades.has(g as any) ? tGrades(g as any) : g}
                </option>
              ))}
            </select>
          </div>

          {/* Min price */}
          <div>
            <input
              type="number"
              min="0"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder={t('minPrice')}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 outline-none bg-gray-50 text-sm text-gray-700 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Max price */}
          <div>
            <input
              type="number"
              min="0"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder={t('maxPrice')}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 outline-none bg-gray-50 text-sm text-gray-700 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Clear Filters Button */}
          <div className="col-span-2 sm:col-span-1 flex items-center justify-end sm:justify-start">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition border border-red-200"
              >
                <X className="w-3.5 h-3.5" />
                {t('clearFilters')}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
