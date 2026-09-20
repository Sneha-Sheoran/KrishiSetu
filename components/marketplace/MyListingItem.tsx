'use client'

import { useState, useTransition, useEffect } from 'react'
import { Link, useRouter } from '@/i18n/routing'
import { setListingStatus, deleteListing } from '@/app/actions/marketplace'
import { Edit, Trash2, MapPin, Pause, Play, CheckCircle, Loader2, MoreVertical, X } from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'
import { getCropDisplayName } from '@/lib/constants/crops'

interface Listing {
  id: string
  crop_name: string
  variety?: string | null
  quantity: number
  unit: string
  expected_price: number
  quality_grade?: string | null
  harvest_date?: string | null
  location_text?: string | null
  status: 'ACTIVE' | 'PAUSED' | 'SOLD' | string
  created_at: string
}

export default function MyListingItem({ listing }: { listing: Listing }) {
  const t = useTranslations('Listing')
  const tStatus = useTranslations('Status')
  const tUnits = useTranslations('Units')
  const locale = useLocale()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [actionError, setActionError] = useState<string | null>(null)
  const [showMenu, setShowMenu] = useState(false)
  const [showDeleteSheet, setShowDeleteSheet] = useState(false)

  // Close overflow menu on escape or click outside
  useEffect(() => {
    if (!showMenu && !showDeleteSheet) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowMenu(false)
        setShowDeleteSheet(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showMenu, showDeleteSheet])

  const handleStatusChange = (newStatus: 'ACTIVE' | 'PAUSED' | 'SOLD') => {
    setShowMenu(false)
    setActionError(null)
    startTransition(async () => {
      const res = await setListingStatus(listing.id, newStatus)
      if (res?.error) {
        setActionError(res.error)
      } else {
        router.refresh()
      }
    })
  }

  const confirmDelete = () => {
    setShowDeleteSheet(false)
    setActionError(null)
    startTransition(async () => {
      const res = await deleteListing(listing.id)
      if (res?.error) {
        setActionError(res.error)
      } else {
        router.refresh()
      }
    })
  }

  const localizedCrop = getCropDisplayName(listing.crop_name, locale)
  const unitLabel = tUnits.has(listing.unit as any) ? tUnits(listing.unit as any) : listing.unit
  const statusLabel = listing.status === 'ACTIVE'
    ? tStatus('active')
    : listing.status === 'PAUSED'
    ? tStatus('paused')
    : listing.status === 'SOLD'
    ? tStatus('sold')
    : listing.status

  return (
    <div className="bg-white p-4 md:p-6 rounded-2xl border border-emerald-100 shadow-sm flex flex-col justify-between gap-4 transition hover:shadow-md relative">
      <div>
        {/* Header: Title + Status */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <Link
            href={`/marketplace/${listing.id}`}
            className="text-lg md:text-xl font-black text-emerald-950 hover:text-emerald-700 transition"
          >
            {localizedCrop} {listing.variety && <span className="font-normal text-emerald-700 text-sm md:text-base">({listing.variety})</span>}
          </Link>
          <span
            className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider whitespace-nowrap ${
              listing.status === 'ACTIVE'
                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                : listing.status === 'PAUSED'
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : listing.status === 'SOLD'
                ? 'bg-blue-100 text-blue-900 border border-blue-300'
                : 'bg-gray-100 text-gray-800 border border-gray-300'
            }`}
          >
            {statusLabel}
          </span>
        </div>

        {/* Quantity and Expected Price Callout */}
        <div className="bg-emerald-50/60 border border-emerald-100/80 rounded-xl p-3 my-2.5 flex items-baseline justify-between">
          <div>
            <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider">{t('quantity')}</div>
            <div className="text-base md:text-lg font-black text-emerald-950">
              {listing.quantity} {unitLabel}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider">{t('expectedPrice')}</div>
            <div className="text-lg md:text-xl font-black text-emerald-800">
              ₹{listing.expected_price.toLocaleString('en-IN')} <span className="text-xs font-semibold text-gray-600">/{unitLabel}</span>
            </div>
          </div>
        </div>

        {/* Details: Location and Listed Date */}
        <div className="text-xs md:text-sm text-gray-600 flex flex-wrap gap-x-4 gap-y-1 mt-2">
          {listing.location_text && (
            <span className="flex items-center gap-1 text-gray-600">
              <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" /> {listing.location_text}
            </span>
          )}
          <span className="text-gray-400">
            {t('listedOn')} {new Date(listing.created_at).toLocaleDateString()}
          </span>
        </div>

        {actionError && (
          <p className="text-xs text-red-600 font-semibold mt-2">{actionError}</p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
        {/* Primary Action Button: Pause or Reactivate */}
        {listing.status === 'ACTIVE' && (
          <button
            onClick={() => handleStatusChange('PAUSED')}
            disabled={isPending}
            className="flex-1 md:flex-initial min-h-[48px] px-4 py-2 text-sm font-bold rounded-xl bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pause className="w-4 h-4" />}
            <span>{t('pause')}</span>
          </button>
        )}

        {listing.status === 'PAUSED' && (
          <button
            onClick={() => handleStatusChange('ACTIVE')}
            disabled={isPending}
            className="flex-1 md:flex-initial min-h-[48px] px-4 py-2 text-sm font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            <span>{t('reactivate')}</span>
          </button>
        )}

        {/* Desktop Buttons */}
        <div className="hidden md:flex items-center gap-2">
          {listing.status !== 'SOLD' && (
            <button
              onClick={() => handleStatusChange('SOLD')}
              disabled={isPending}
              className="min-h-[48px] px-3.5 py-2 text-xs font-bold rounded-xl bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200 transition disabled:opacity-50 flex items-center gap-1.5"
            >
              {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
              <span>{t('markSold')}</span>
            </button>
          )}

          <Link
            href={`/marketplace/${listing.id}/edit`}
            className="min-h-[48px] min-w-[48px] px-3 py-2 text-emerald-700 hover:bg-emerald-50 rounded-xl transition border border-emerald-100 flex items-center justify-center"
            title={t('edit')}
          >
            <Edit className="w-4 h-4" />
          </Link>

          <button
            onClick={() => setShowDeleteSheet(true)}
            disabled={isPending}
            className="min-h-[48px] min-w-[48px] px-3 py-2 text-red-600 hover:bg-red-50 rounded-xl transition border border-red-100 disabled:opacity-50 flex items-center justify-center"
            title={t('delete')}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile Overflow Menu Button */}
        <div className="md:hidden relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            aria-label={t('moreActions')}
            className="min-h-[48px] min-w-[48px] rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-700 hover:bg-gray-100 transition"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-40 bg-black/20"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 bottom-full mb-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                {listing.status !== 'SOLD' && (
                  <button
                    onClick={() => handleStatusChange('SOLD')}
                    className="w-full min-h-[48px] px-4 py-2.5 text-left text-sm font-semibold text-blue-700 hover:bg-blue-50 flex items-center gap-2.5 transition"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>{t('markSold')}</span>
                  </button>
                )}
                <Link
                  href={`/marketplace/${listing.id}/edit`}
                  onClick={() => setShowMenu(false)}
                  className="w-full min-h-[48px] px-4 py-2.5 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition"
                >
                  <Edit className="w-4 h-4 text-emerald-700" />
                  <span>{t('edit')}</span>
                </Link>
                <button
                  onClick={() => {
                    setShowMenu(false)
                    setShowDeleteSheet(true)
                  }}
                  className="w-full min-h-[48px] px-4 py-2.5 text-left text-sm font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{t('delete')}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile Delete Confirmation Bottom Sheet */}
      {showDeleteSheet && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end md:justify-center md:items-center p-0 md:p-4 animate-in fade-in duration-200"
          onClick={() => setShowDeleteSheet(false)}
        >
          <div
            className="bg-white rounded-t-3xl md:rounded-3xl p-6 shadow-2xl max-w-md w-full animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
          >
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4 md:hidden" />
            <div className="flex items-center justify-between mb-3">
              <h3 id="delete-dialog-title" className="text-xl font-bold text-gray-900">
                {t('deleteListingTitle')}
              </h3>
              <button
                onClick={() => setShowDeleteSheet(false)}
                className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              {t('confirmDelete', { crop: localizedCrop })}
            </p>
            <div className="space-y-3">
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isPending}
                className="w-full min-h-[48px] bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow transition flex items-center justify-center gap-2 text-base"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>{t('deleteListingBtn')}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteSheet(false)}
                className="w-full min-h-[48px] bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl transition flex items-center justify-center text-base"
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
