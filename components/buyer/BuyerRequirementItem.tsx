'use client'

import { useState, useTransition, useEffect } from 'react'
import { setRequirementStatus } from '@/app/actions/buyer'
import { useRouter } from '@/i18n/routing'
import { CheckCircle, XCircle, MapPin, Calendar, Loader2, X } from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'
import { getCropDisplayName } from '@/lib/constants/crops'

export interface BuyerRequirement {
  id: string
  crop: string
  required_quantity: number
  unit: string
  target_price: number
  required_by?: string | null
  location: string
  status: 'ACTIVE' | 'FULFILLED' | 'CANCELLED' | string
  created_at: string
}

export default function BuyerRequirementItem({ requirement }: { requirement: BuyerRequirement }) {
  const t = useTranslations('Requirement')
  const tStatus = useTranslations('Status')
  const tUnits = useTranslations('Units')
  const locale = useLocale()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [actionError, setActionError] = useState<string | null>(null)
  const [showCancelSheet, setShowCancelSheet] = useState(false)

  useEffect(() => {
    if (!showCancelSheet) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowCancelSheet(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showCancelSheet])

  const handleStatusChange = (newStatus: 'FULFILLED' | 'CANCELLED') => {
    if (newStatus === 'CANCELLED') {
      setShowCancelSheet(true)
      return
    }

    setActionError(null)
    startTransition(async () => {
      const res = await setRequirementStatus(requirement.id, newStatus)
      if (res?.error) {
        setActionError(res.error)
      } else {
        router.refresh()
      }
    })
  }

  const confirmCancel = () => {
    setShowCancelSheet(false)
    setActionError(null)
    startTransition(async () => {
      const res = await setRequirementStatus(requirement.id, 'CANCELLED')
      if (res?.error) {
        setActionError(res.error)
      } else {
        router.refresh()
      }
    })
  }

  const localizedCrop = getCropDisplayName(requirement.crop, locale)
  const unitLabel = tUnits.has(requirement.unit as any) ? tUnits(requirement.unit as any) : requirement.unit
  const statusLabel = requirement.status === 'ACTIVE'
    ? tStatus('active')
    : requirement.status === 'FULFILLED'
    ? tStatus('fulfilled')
    : requirement.status === 'CANCELLED'
    ? tStatus('cancelled')
    : requirement.status

  return (
    <div className="p-4 md:p-5 rounded-2xl border border-gray-200 hover:border-emerald-200 transition bg-white shadow-sm space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h4 className="font-black text-gray-900 text-lg">{localizedCrop}</h4>
            <span
              className={`px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
                requirement.status === 'ACTIVE'
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  : requirement.status === 'FULFILLED'
                  ? 'bg-blue-100 text-blue-900 border border-blue-300'
                  : 'bg-gray-100 text-gray-800 border border-gray-300'
              }`}
            >
              {statusLabel}
            </span>
          </div>

          <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-2.5 my-2 flex items-baseline justify-between max-w-sm">
            <div>
              <span className="text-xs text-gray-500 font-semibold uppercase block">{t('required')}</span>
              <span className="text-base font-bold text-emerald-950">
                {requirement.required_quantity} {unitLabel}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-500 font-semibold uppercase block">{t('targetPriceLabel')}</span>
              <span className="text-base font-black text-emerald-800">
                ₹{requirement.target_price.toLocaleString('en-IN')} <span className="text-xs font-normal text-gray-600">/{unitLabel}</span>
              </span>
            </div>
          </div>
        </div>

        {requirement.status === 'ACTIVE' && (
          <div className="flex items-center gap-2 pt-2 sm:pt-0">
            <button
              onClick={() => handleStatusChange('FULFILLED')}
              disabled={isPending}
              className="flex-1 sm:flex-initial min-h-[48px] px-3.5 py-2 text-xs font-bold rounded-xl bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
              title={t('markFulfilled')}
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              <span>{t('markFulfilled')}</span>
            </button>
            <button
              onClick={() => handleStatusChange('CANCELLED')}
              disabled={isPending}
              className="flex-1 sm:flex-initial min-h-[48px] px-3.5 py-2 text-xs font-bold rounded-xl bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
              title={t('cancel')}
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
              <span>{t('cancel')}</span>
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 pt-1 border-t border-gray-100">
        {requirement.location && (
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
            {requirement.location}
          </span>
        )}
        {requirement.required_by && (
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
            {t('requiredByLabel')} {requirement.required_by}
          </span>
        )}
      </div>

      {actionError && (
        <p className="text-xs text-red-600 font-semibold">{actionError}</p>
      )}

      {/* Cancel Requirement Confirmation Sheet */}
      {showCancelSheet && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end md:justify-center md:items-center p-0 md:p-4 animate-in fade-in duration-200"
          onClick={() => setShowCancelSheet(false)}
        >
          <div
            className="bg-white rounded-t-3xl md:rounded-3xl p-6 shadow-2xl max-w-md w-full animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-dialog-title"
          >
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4 md:hidden" />
            <div className="flex items-center justify-between mb-3">
              <h3 id="cancel-dialog-title" className="text-xl font-bold text-gray-900">
                {t('cancelRequirementTitle')}
              </h3>
              <button
                onClick={() => setShowCancelSheet(false)}
                className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              {t('confirmCancelRequirement', { crop: localizedCrop })}
            </p>
            <div className="space-y-3">
              <button
                type="button"
                onClick={confirmCancel}
                disabled={isPending}
                className="w-full min-h-[48px] bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow transition flex items-center justify-center gap-2 text-base"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                <span>{t('cancelRequirement')}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowCancelSheet(false)}
                className="w-full min-h-[48px] bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl transition flex items-center justify-center text-base"
              >
                {t('keepRequirement')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
