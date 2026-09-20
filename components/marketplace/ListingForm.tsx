'use client'

import { useState } from 'react'
import { createListing, updateListing } from '@/app/actions/marketplace'
import { Store, MapPin, Calendar, Tag, ArrowLeft } from 'lucide-react'
import { Link } from '@/i18n/routing'
import { useTranslations } from 'next-intl'

const ALLOWED_UNITS = ['Kg', 'Quintal', 'Tons', 'Box', 'Crate', 'Dozen']
const ALLOWED_GRADES = [
  { value: 'Grade A', fallback: 'Grade A (Premium)' },
  { value: 'Grade B', fallback: 'Grade B (Standard)' },
  { value: 'Grade C', fallback: 'Grade C (Average)' },
  { value: 'Standard', fallback: 'Standard' },
  { value: 'Organic', fallback: 'Organic' },
  { value: 'Ungraded', fallback: 'Ungraded' }
]

interface ListingFormProps {
  isEdit?: boolean
  listingId?: string
  initialData?: {
    crop_name?: string
    variety?: string | null
    quantity?: number
    unit?: string
    expected_price?: number
    quality_grade?: string | null
    harvest_date?: string | null
    location_text?: string
    description?: string | null
  }
}

export default function ListingForm({ isEdit = false, listingId, initialData }: ListingFormProps) {
  const t = useTranslations('Listing')
  const tErrors = useTranslations('Errors')
  const tUnits = useTranslations('Units')
  const tGrades = useTranslations('Grades')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [unit, setUnit] = useState<string>(initialData?.unit || 'Quintal')
  const [qualityGrade, setQualityGrade] = useState<string>(initialData?.quality_grade || 'Standard')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    formData.set('unit', unit)
    formData.set('quality_grade', qualityGrade)

    // Client validation
    const cropName = (formData.get('crop_name') as string)?.trim()
    const quantity = Number(formData.get('quantity'))
    const price = Number(formData.get('expected_price'))

    if (!cropName) {
      setError(tErrors('cropRequired'))
      setLoading(false)
      document.getElementById('crop_name')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    if (isNaN(quantity) || quantity <= 0) {
      setError(tErrors('positiveQuantity'))
      setLoading(false)
      document.getElementById('quantity')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    if (isNaN(price) || price <= 0) {
      setError(tErrors('positivePrice'))
      setLoading(false)
      document.getElementById('expected_price')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    try {
      const result = isEdit && listingId
        ? await updateListing(listingId, formData)
        : await createListing(formData)

      if (result?.error) {
        setError(result.error)
        setLoading(false)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : tErrors('genericError')
      if (message === 'NEXT_REDIRECT') {
        throw err
      }
      setError(message)
      setLoading(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <div className="min-h-[100dvh] bg-orange-50/50 p-3 md:p-8 pb-32 md:pb-8">
      <datalist id="common-crops">
        <option value="Wheat" />
        <option value="Rice (Paddy)" />
        <option value="Onion" />
        <option value="Tomato" />
        <option value="Potato" />
        <option value="Soybean" />
        <option value="Mustard" />
        <option value="Cotton" />
        <option value="Maize" />
        <option value="Gram (Chana)" />
        <option value="Sugarcane" />
        <option value="Garlic" />
        <option value="Ginger" />
        <option value="Turmeric" />
        <option value="Chilli" />
      </datalist>

      <div className="max-w-2xl mx-auto bg-white rounded-2xl md:rounded-3xl shadow-sm border border-emerald-100 overflow-hidden">
        <div className="bg-emerald-800 p-5 md:p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <Store className="w-6 h-6 text-emerald-300 flex-shrink-0" />
              <h1 className="text-xl md:text-2xl font-bold">
                {isEdit ? t('editProduceTitle') : t('listProduceTitle')}
              </h1>
            </div>
            <Link
              href="/marketplace/my-listings"
              className="text-xs font-semibold text-emerald-200 hover:text-white flex items-center gap-1 transition p-2 min-h-[44px]"
            >
              <ArrowLeft className="w-4 h-4" /> {t('back')}
            </Link>
          </div>
          <p className="text-emerald-100 text-sm">
            {isEdit ? t('editProduceSubtitle') : t('listProduceSubtitle')}
          </p>
        </div>

        <div className="p-5 md:p-8">
          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6 border border-red-200 text-sm font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
              {/* Crop Name with Datalist */}
              <div className="col-span-1 md:col-span-1">
                <label htmlFor="crop_name" className="block text-sm md:text-base font-bold text-emerald-950 mb-1.5">
                  {t('cropName')} <span className="text-red-500">*</span>
                </label>
                <input
                  id="crop_name"
                  name="crop_name"
                  type="text"
                  list="common-crops"
                  required
                  defaultValue={initialData?.crop_name || ''}
                  placeholder={t('cropPlaceholder')}
                  className="w-full h-12 px-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none transition text-base text-gray-900 bg-white"
                />
              </div>

              {/* Variety */}
              <div className="col-span-1 md:col-span-1">
                <label htmlFor="variety" className="block text-sm md:text-base font-bold text-emerald-950 mb-1.5">
                  {t('variety')}
                </label>
                <input
                  id="variety"
                  name="variety"
                  type="text"
                  defaultValue={initialData?.variety || ''}
                  placeholder={t('varietyPlaceholder')}
                  className="w-full h-12 px-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none transition text-base text-gray-900 bg-white"
                />
              </div>

              {/* Quantity */}
              <div>
                <label htmlFor="quantity" className="block text-sm md:text-base font-bold text-emerald-950 mb-1.5">
                  {t('quantity')} <span className="text-red-500">*</span>
                </label>
                <input
                  id="quantity"
                  name="quantity"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0.01"
                  required
                  defaultValue={initialData?.quantity !== undefined ? initialData.quantity : ''}
                  placeholder={t('quantityPlaceholder')}
                  className="w-full h-12 px-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none transition text-base text-gray-900 bg-white"
                />
              </div>

              {/* Unit (Segmented Chips) */}
              <div>
                <label className="block text-sm md:text-base font-bold text-emerald-950 mb-1.5">
                  {t('unit')} <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {ALLOWED_UNITS.map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setUnit(u)}
                      className={`min-h-[48px] px-3.5 py-2 rounded-xl text-sm md:text-base font-bold transition border ${
                        unit === u
                          ? 'bg-emerald-700 text-white border-emerald-800 shadow-sm'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-emerald-50'
                      }`}
                    >
                      {tUnits.has(u as any) ? tUnits(u as any) : u}
                    </button>
                  ))}
                </div>
                <input type="hidden" name="unit" value={unit} />
              </div>

              {/* Expected Price */}
              <div>
                <label htmlFor="expected_price" className="block text-sm md:text-base font-bold text-emerald-950 mb-1.5">
                  {t('expectedPrice')} <span className="text-red-500">*</span>
                </label>
                <input
                  id="expected_price"
                  name="expected_price"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0.01"
                  required
                  defaultValue={initialData?.expected_price !== undefined ? initialData.expected_price : ''}
                  placeholder={t('pricePlaceholder')}
                  className="w-full h-12 px-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none transition text-base text-gray-900 bg-white"
                />
              </div>

              {/* Quality Grade (Segmented Chips) */}
              <div>
                <label className="block text-sm md:text-base font-bold text-emerald-950 mb-1.5">
                  {t('qualityGrade')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {ALLOWED_GRADES.map((g) => (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => setQualityGrade(g.value)}
                      className={`min-h-[48px] px-3 py-2 rounded-xl text-xs md:text-sm font-bold transition border ${
                        qualityGrade === g.value
                          ? 'bg-emerald-700 text-white border-emerald-800 shadow-sm'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-emerald-50'
                      }`}
                    >
                      {tGrades.has(g.value as any) ? tGrades(g.value as any) : g.fallback}
                    </button>
                  ))}
                </div>
                <input type="hidden" name="quality_grade" value={qualityGrade} />
              </div>

              {/* Harvest Date */}
              <div className="col-span-1 md:col-span-2">
                <label htmlFor="harvest_date" className="block text-sm md:text-base font-bold text-emerald-950 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-emerald-600" /> {t('harvestDate')}
                </label>
                <input
                  id="harvest_date"
                  name="harvest_date"
                  type="date"
                  defaultValue={initialData?.harvest_date || ''}
                  className="w-full h-12 px-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none transition text-base text-gray-900 bg-white"
                />
              </div>

              {/* Location */}
              <div className="col-span-1 md:col-span-2">
                <label htmlFor="location_text" className="block text-sm md:text-base font-bold text-emerald-950 mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-600" /> {t('location')} <span className="text-red-500">*</span>
                </label>
                <input
                  id="location_text"
                  name="location_text"
                  type="text"
                  required
                  defaultValue={initialData?.location_text || ''}
                  placeholder={t('locationPlaceholder')}
                  className="w-full h-12 px-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none transition text-base text-gray-900 bg-white"
                />
              </div>

              {/* Description */}
              <div className="col-span-1 md:col-span-2">
                <label htmlFor="description" className="block text-sm md:text-base font-bold text-emerald-950 mb-1.5 flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-emerald-600" /> {t('additionalDetails')}
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  defaultValue={initialData?.description || ''}
                  placeholder={t('detailsPlaceholder')}
                  className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none transition text-base text-gray-900 bg-white"
                />
              </div>
            </div>

            {/* Desktop Action Buttons (Hidden on mobile) */}
            <div className="hidden md:flex items-center gap-4 pt-4 border-t border-gray-100">
              <Link
                href="/marketplace/my-listings"
                className="w-1/3 h-12 flex items-center justify-center rounded-xl border border-gray-300 font-bold text-gray-700 hover:bg-gray-50 transition text-base"
              >
                {t('cancel')}
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="w-2/3 h-12 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md transition disabled:opacity-70 text-base flex items-center justify-center"
              >
                {loading
                  ? (isEdit ? t('saving') : t('publishing'))
                  : (isEdit ? t('saveChanges') : t('publishListing'))}
              </button>
            </div>

            {/* Mobile Sticky Bottom Save Button */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 p-3 px-4 bg-white/95 backdrop-blur-md border-t border-gray-200 z-30 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-lg flex items-center gap-2">
              <Link
                href="/marketplace/my-listings"
                className="w-1/3 h-12 rounded-xl border border-gray-300 font-bold text-gray-700 hover:bg-gray-50 transition text-sm flex items-center justify-center"
              >
                {t('cancel')}
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="w-2/3 h-12 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md transition disabled:opacity-70 text-base flex items-center justify-center"
              >
                {loading
                  ? (isEdit ? t('saving') : t('publishing'))
                  : (isEdit ? t('saveChanges') : t('publishListing'))}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
