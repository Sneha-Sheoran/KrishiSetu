'use client'

import { useState, useTransition, useEffect } from 'react'
import { Link } from '@/i18n/routing'
import { useTranslations, useLocale } from 'next-intl'
import { getCropDisplayName } from '@/lib/constants/crops'
import { offerToSupply } from '@/app/actions/supply'
import {
  MapPin,
  Calendar,
  Building2,
  CheckCircle2,
  MessageSquare,
  Package,
  X,
  Loader2,
  Sparkles,
  Tag
} from 'lucide-react'

export interface WantedRequirementItem {
  id: string
  crop: string
  required_quantity: number
  unit: string
  target_price: number | null
  required_by: string | null
  location: string
  created_at: string
  buyer?: {
    business_name?: string | null
    buyer_type?: string | null
    state?: string | null
    district?: string | null
    verification_status?: string | null
  } | null
}

export interface MatchingListingOption {
  id: string
  crop_name: string
  quantity: number
  unit: string
  expected_price: number
}

interface WantedRequirementCardProps {
  requirement: WantedRequirementItem
  matchingListings: MatchingListingOption[]
  existingConversationId?: string | null
  isAdmin?: boolean
}

export default function WantedRequirementCard({
  requirement,
  matchingListings,
  existingConversationId,
  isAdmin = false
}: WantedRequirementCardProps) {
  const t = useTranslations('Marketplace')
  const tUnits = useTranslations('Units')
  const locale = useLocale()
  const [isPending, startTransition] = useTransition()
  const [showSupplySheet, setShowSupplySheet] = useState(false)
  const [selectedListingId, setSelectedListingId] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const localizedCrop = getCropDisplayName(requirement.crop, locale)
  const hasMatchingListings = matchingListings.length > 0

  useEffect(() => {
    if (!showSupplySheet) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowSupplySheet(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showSupplySheet])

  const handleSupplyClick = () => {
    if (existingConversationId) return
    setErrorMessage(null)

    if (hasMatchingListings) {
      // Pre-select first listing if available
      setSelectedListingId(matchingListings[0].id)
      setShowSupplySheet(true)
    } else {
      // Direct call without listing
      startTransition(async () => {
        const res = await offerToSupply(requirement.id)
        if (res && res.error) {
          setErrorMessage(res.error)
        }
      })
    }
  }

  const handleConfirmSupply = () => {
    setErrorMessage(null)
    startTransition(async () => {
      const res = await offerToSupply(
        requirement.id,
        selectedListingId ? selectedListingId : undefined
      )
      if (res && res.error) {
        setErrorMessage(res.error)
      } else {
        setShowSupplySheet(false)
      }
    })
  }

  // Format date safely
  const formattedRequiredBy = requirement.required_by
    ? new Date(requirement.required_by).toLocaleDateString(locale === 'hi' ? 'hi-IN' : 'en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    : null

  const buyerDistrictState = [requirement.buyer?.district, requirement.buyer?.state]
    .filter(Boolean)
    .join(', ')

  return (
    <div className="bg-white rounded-2xl border border-gray-200 hover:border-emerald-300 transition-all p-5 flex flex-col justify-between shadow-sm hover:shadow-md">
      <div>
        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900">
              <Tag className="w-3.5 h-3.5" />
              {t('buyerRequest')}
            </span>
            {hasMatchingListings && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                {t('youHaveThisCrop')}
              </span>
            )}
          </div>
          {requirement.buyer?.verification_status === 'VERIFIED' && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {t('verifiedFarmer')}
            </span>
          )}
        </div>

        {/* Crop Name & Quantity */}
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-900">{localizedCrop}</h3>
          <p className="text-sm font-medium text-gray-600 mt-1 flex items-center gap-1.5">
            <Package className="w-4 h-4 text-gray-400" />
            <span className="text-gray-900 font-bold">
              {requirement.required_quantity} {tUnits(requirement.unit) || requirement.unit}
            </span>
          </p>
        </div>

        {/* Price and Date */}
        <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-xl mb-4 text-sm">
          <div>
            <span className="text-xs text-gray-500 block mb-0.5">{t('targetPrice')}</span>
            <span className="font-bold text-emerald-700">
              {requirement.target_price && requirement.target_price > 0
                ? `₹${requirement.target_price} / ${tUnits(requirement.unit) || requirement.unit}`
                : t('priceOpen')}
            </span>
          </div>
          <div>
            <span className="text-xs text-gray-500 block mb-0.5">{t('requiredBy')}</span>
            <span className="font-semibold text-gray-800 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              {formattedRequiredBy || '—'}
            </span>
          </div>
        </div>

        {/* Buyer & Location Details */}
        <div className="space-y-2 mb-5 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
            <span className="font-medium text-gray-900">
              {requirement.buyer?.business_name || t('buyer')}
            </span>
            {requirement.buyer?.buyer_type && (
              <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded">
                {requirement.buyer.buyer_type}
              </span>
            )}
          </div>
          {buyerDistrictState && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="ml-6">{buyerDistrictState}</span>
            </div>
          )}
          <div className="flex items-start gap-2 text-xs text-gray-500">
            <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
            <span>{requirement.location}</span>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg mb-4 font-medium">
            {errorMessage}
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="pt-2 border-t border-gray-100">
        {isAdmin ? (
          <div className="py-2 text-center text-xs text-gray-500 font-medium bg-gray-100 rounded-xl">
            {t('buyerRequest')}
          </div>
        ) : existingConversationId ? (
          <Link
            href={`/messages/${existingConversationId}`}
            className="w-full min-h-[48px] py-2.5 px-4 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 font-semibold rounded-xl text-sm flex items-center justify-center gap-2 transition"
          >
            <MessageSquare className="w-4 h-4" />
            <span>{t('chatStartedOpenChat')}</span>
          </Link>
        ) : (
          <button
            type="button"
            onClick={handleSupplyClick}
            disabled={isPending}
            className="w-full min-h-[48px] py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 transition shadow-sm disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t('startingChat')}</span>
              </>
            ) : (
              <>
                <MessageSquare className="w-4 h-4" />
                <span>{t('iCanSupply')}</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Bottom Sheet for Selecting Produce / Direct Chat */}
      {showSupplySheet && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end md:justify-center md:items-center p-0 md:p-4 animate-in fade-in duration-200"
          onClick={() => setShowSupplySheet(false)}
        >
          <div
            className="bg-white rounded-t-3xl md:rounded-3xl p-6 shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="supply-dialog-title"
          >
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4 md:hidden" />
            <div className="flex items-center justify-between mb-3">
              <h3 id="supply-dialog-title" className="text-xl font-bold text-gray-900">
                {t('selectProduceToOffer')}
              </h3>
              <button
                onClick={() => setShowSupplySheet(false)}
                className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              {t('chooseProduceOption')}
            </p>

            <div className="space-y-3 mb-6">
              {matchingListings.map((l) => (
                <label
                  key={l.id}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition min-h-[48px] ${
                    selectedListingId === l.id
                      ? 'border-emerald-600 bg-emerald-50/50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="selectedListing"
                    value={l.id}
                    checked={selectedListingId === l.id}
                    onChange={() => setSelectedListingId(l.id)}
                    className="w-4 h-4 text-emerald-600 mt-1 focus:ring-emerald-500"
                  />
                  <div className="flex-1 text-sm">
                    <div className="font-semibold text-gray-900">
                      {getCropDisplayName(l.crop_name, locale)}
                    </div>
                    <div className="text-xs text-gray-600 mt-0.5">
                      {l.quantity} {tUnits(l.unit) || l.unit} • ₹{l.expected_price} / {tUnits(l.unit) || l.unit}
                    </div>
                  </div>
                </label>
              ))}

              <label
                className={`flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition min-h-[48px] ${
                  selectedListingId === ''
                    ? 'border-emerald-600 bg-emerald-50/50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="selectedListing"
                  value=""
                  checked={selectedListingId === ''}
                  onChange={() => setSelectedListingId('')}
                  className="w-4 h-4 text-emerald-600 mt-1 focus:ring-emerald-500"
                />
                <div className="flex-1 text-sm">
                  <div className="font-semibold text-gray-900">{t('justStartChat')}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {t('noMatchingListingsNotice')}
                  </div>
                </div>
              </label>
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg mb-4 font-medium">
                {errorMessage}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowSupplySheet(false)}
                className="flex-1 min-h-[48px] py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-xl text-sm transition"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={handleConfirmSupply}
                disabled={isPending}
                className="flex-1 min-h-[48px] py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 transition shadow-sm disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t('startingChat')}</span>
                  </>
                ) : (
                  <span>{t('iCanSupply')}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
