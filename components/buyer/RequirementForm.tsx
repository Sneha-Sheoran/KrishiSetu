'use client'

import { useState } from 'react'
import { createRequirement } from '@/app/actions/buyer'
import { TrendingUp, MapPin, Calendar, ArrowLeft } from 'lucide-react'
import { Link } from '@/i18n/routing'
import { useTranslations } from 'next-intl'

const ALLOWED_UNITS = ['Kg', 'Quintal', 'Tons', 'Box', 'Crate', 'Dozen']

export default function RequirementForm() {
  const t = useTranslations('Requirement')
  const tUnits = useTranslations('Units')
  const tErrors = useTranslations('Errors')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [unit, setUnit] = useState<string>('Quintal')

  const todayStr = new Date().toISOString().split('T')[0]

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    formData.set('unit', unit)

    // Client validation
    const crop = (formData.get('crop') as string)?.trim()
    const quantity = Number(formData.get('required_quantity'))
    const targetPrice = Number(formData.get('target_price'))
    const requiredBy = (formData.get('required_by') as string)?.trim()
    const location = (formData.get('location') as string)?.trim()

    if (!crop) {
      setError(tErrors('cropRequired'))
      setLoading(false)
      document.getElementById('crop')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    if (isNaN(quantity) || quantity <= 0) {
      setError(tErrors('positiveQuantity'))
      setLoading(false)
      document.getElementById('required_quantity')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    if (isNaN(targetPrice) || targetPrice < 0) {
      setError(tErrors('validTargetPrice'))
      setLoading(false)
      document.getElementById('target_price')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    if (!requiredBy) {
      setError(tErrors('requiredByMandatory'))
      setLoading(false)
      document.getElementById('required_by')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    if (!location) {
      setError(tErrors('deliveryLocationRequired'))
      setLoading(false)
      document.getElementById('location')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    try {
      const result = await createRequirement(formData)
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
              <TrendingUp className="w-6 h-6 text-emerald-300 flex-shrink-0" />
              <h1 className="text-xl md:text-2xl font-black tracking-tight">
                {t('postRequirementTitle')}
              </h1>
            </div>
            <Link
              href="/buyer"
              className="min-h-[44px] px-3 py-2 text-sm font-bold text-emerald-100 hover:text-white flex items-center gap-1.5 transition rounded-lg hover:bg-emerald-700/50"
            >
              <ArrowLeft className="w-4 h-4" /> {t('back')}
            </Link>
          </div>
          <p className="text-emerald-100 text-xs md:text-sm">
            {t('postRequirementSubtitle')}
          </p>
        </div>

        <div className="p-4 md:p-8">
          {error && (
            <div className="bg-red-50 text-red-700 p-3.5 md:p-4 rounded-xl mb-5 border border-red-200 text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
              {/* Crop Name */}
              <div className="col-span-1 md:col-span-2">
                <label htmlFor="crop" className="block text-sm md:text-base font-bold text-emerald-950 mb-1.5">
                  {t('cropName')} <span className="text-red-500">*</span>
                </label>
                <input
                  id="crop"
                  name="crop"
                  type="text"
                  list="common-crops"
                  required
                  placeholder={t('cropPlaceholder')}
                  className="w-full h-12 px-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none transition text-base text-gray-900 bg-white"
                />
              </div>

              {/* Required Quantity */}
              <div>
                <label htmlFor="required_quantity" className="block text-sm md:text-base font-bold text-emerald-950 mb-1.5">
                  {t('quantity')} <span className="text-red-500">*</span>
                </label>
                <input
                  id="required_quantity"
                  name="required_quantity"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0.01"
                  required
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

              {/* Target Price */}
              <div>
                <label htmlFor="target_price" className="block text-sm md:text-base font-bold text-emerald-950 mb-1.5">
                  {t('targetPrice')} <span className="text-red-500">*</span>
                </label>
                <input
                  id="target_price"
                  name="target_price"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  required
                  placeholder={t('pricePlaceholder')}
                  className="w-full h-12 px-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none transition text-base text-gray-900 bg-white"
                />
              </div>

              {/* Required By Date */}
              <div>
                <label htmlFor="required_by" className="block text-sm md:text-base font-bold text-emerald-950 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-emerald-600" /> {t('requiredBy')} <span className="text-red-500">*</span>
                </label>
                <input
                  id="required_by"
                  name="required_by"
                  type="date"
                  min={todayStr}
                  required
                  className="w-full h-12 px-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none transition text-base text-gray-900 bg-white"
                />
              </div>

              {/* Delivery Location */}
              <div className="col-span-1 md:col-span-2">
                <label htmlFor="location" className="block text-sm md:text-base font-bold text-emerald-950 mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-600" /> {t('deliveryLocation')} <span className="text-red-500">*</span>
                </label>
                <input
                  id="location"
                  name="location"
                  type="text"
                  required
                  placeholder={t('locationPlaceholder')}
                  className="w-full h-12 px-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none transition text-base text-gray-900 bg-white"
                />
              </div>
            </div>

            {/* Desktop Action Buttons */}
            <div className="hidden md:flex items-center gap-4 pt-4 border-t border-gray-100">
              <Link
                href="/buyer"
                className="w-1/3 h-12 flex items-center justify-center rounded-xl border border-gray-300 font-bold text-gray-700 hover:bg-gray-50 transition text-base"
              >
                {t('cancel')}
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="w-2/3 h-12 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md transition disabled:opacity-70 text-base flex items-center justify-center"
              >
                {loading ? t('posting') : t('postRequirement')}
              </button>
            </div>

            {/* Mobile Sticky Bottom Save Bar */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 p-3 px-4 bg-white/95 backdrop-blur-md border-t border-gray-200 z-30 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-lg flex items-center gap-2">
              <Link
                href="/buyer"
                className="w-1/3 h-12 rounded-xl border border-gray-300 font-bold text-gray-700 hover:bg-gray-50 transition text-sm flex items-center justify-center"
              >
                {t('cancel')}
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="w-2/3 h-12 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md transition disabled:opacity-70 text-base flex items-center justify-center"
              >
                {loading ? t('posting') : t('postRequirement')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
