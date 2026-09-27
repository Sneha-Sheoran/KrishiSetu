/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState } from 'react'
import { useRouter } from '@/i18n/routing'
import { Link } from '@/i18n/routing'
import { 
  ArrowLeft, 
  Camera, 
  FileEdit, 
  Upload, 
  Check, 
  AlertCircle, 
  ArrowDownLeft, 
  ArrowUpRight, 
  RefreshCw,
  Sparkles
} from 'lucide-react'
import { addTransaction, CropItem } from '@/app/actions/records'

interface TransactionFormProps {
  crops: CropItem[]
  defaultMode?: 'scan' | 'manual'
  defaultDirection?: 'IN' | 'OUT'
}

const EXPENSE_CATEGORIES = [
  'Fertilizer',
  'Seeds',
  'Pesticide',
  'Labour',
  'Machinery / Tractor',
  'Irrigation / Water',
  'Transport',
  'Equipment',
  'Other Expense'
]

const INCOME_CATEGORIES = [
  'Crop Sale',
  'Mandi Sale Slip',
  'Government Subsidy',
  'Contract Farming',
  'Other Income'
]

export default function TransactionForm({
  crops,
  defaultMode = 'manual',
  defaultDirection = 'OUT'
}: TransactionFormProps) {
  const router = useRouter()
  const [mode, setMode] = useState<'scan' | 'manual'>(defaultMode)
  const [direction, setDirection] = useState<'IN' | 'OUT'>(defaultDirection)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // OCR Scan States
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [ocrStatus, setOcrStatus] = useState<'IDLE' | 'PROCESSING' | 'SUCCESS' | 'POOR_QUALITY'>('IDLE')
  const [ocrResult, setOcrResult] = useState<any>(null)
  const [ocrError, setOcrError] = useState<string | null>(null)
  const [ocrWarningMessage, setOcrWarningMessage] = useState<string | null>(null)

  // Form Fields State
  const [amount, setAmount] = useState<string>('')
  const [category, setCategory] = useState<string>(
    defaultDirection === 'IN' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]
  )
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [relatedCropId, setRelatedCropId] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [source, setSource] = useState<'manual' | 'ocr'>('manual')

  // Keep category in sync when direction changes if using default lists
  const handleDirectionChange = (newDir: 'IN' | 'OUT') => {
    setDirection(newDir)
    if (newDir === 'IN') {
      if (!INCOME_CATEGORIES.includes(category)) {
        setCategory(INCOME_CATEGORIES[0])
      }
    } else {
      if (!EXPENSE_CATEGORIES.includes(category)) {
        setCategory(EXPENSE_CATEGORIES[0])
      }
    }
  }

  // Handle image file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOcrError(null)
    setOcrWarningMessage(null)
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0]
      setFile(selected)
      setPreview(URL.createObjectURL(selected))
      setOcrStatus('IDLE')
    }
  }

  // Trigger OCR extraction
  const handleProcessReceipt = async () => {
    if (!file) return
    setOcrStatus('PROCESSING')
    setOcrError(null)
    setOcrWarningMessage(null)

    const formData = new FormData()
    formData.append('receipt', file)

    try {
      const response = await fetch('/api/ocr', {
        method: 'POST',
        body: formData
      })

      const rawText = await response.text()
      let json: any
      try {
        json = JSON.parse(rawText)
      } catch {
        throw new Error('Server returned an unreadable response format. Please try again.')
      }

      if (!response.ok) {
        throw new Error(json.error || 'Failed to process receipt image.')
      }

      const status = json.status || 'CONFIDENT'
      const extracted = json.data || {}
      const confidence = Number(extracted.confidence ?? 0)
      const amountVal = extracted.net_amount ?? extracted.gross_amount
      const hasAmount = amountVal != null && !isNaN(Number(amountVal))
      const hasCommodity = extracted.commodity != null && String(extracted.commodity).trim().length > 0
      const isRealExtraction = status !== 'POOR_QUALITY' && confidence >= 40 && (hasAmount || hasCommodity)

      setOcrResult(extracted)

      if (isRealExtraction) {
        setOcrStatus('SUCCESS')
        setOcrWarningMessage(null)
        setSource('ocr')

        // Mandi auction/sale slips represent income
        setDirection('IN')
        setCategory('Crop Sale')

        // Pre-fill amount from net_amount or gross_amount
        if (hasAmount) {
          setAmount(String(amountVal))
        }

        // Pre-fill date
        if (extracted.receipt_date) {
          setDate(extracted.receipt_date)
        }

        // Pre-fill description
        const descParts = []
        if (extracted.market) descParts.push(extracted.market)
        if (extracted.commodity) {
          descParts.push(extracted.commodity + (extracted.variety ? ` (${extracted.variety})` : ''))
        }
        if (extracted.quantity && extracted.unit) {
          descParts.push(`${extracted.quantity} ${extracted.unit}`)
        }
        if (extracted.price_per_unit) {
          descParts.push(`@ ₹${extracted.price_per_unit}/${extracted.unit || 'unit'}`)
        }
        if (extracted.receipt_number) {
          descParts.push(`Bill #${extracted.receipt_number}`)
        }
        if (descParts.length > 0) {
          setDescription(descParts.join(' • '))
        }

        // Attempt to auto-match related crop
        if (extracted.commodity && crops.length > 0) {
          const commLower = String(extracted.commodity).toLowerCase()
          const matched = crops.find(c => 
            commLower.includes(c.crop_name.toLowerCase()) || 
            c.crop_name.toLowerCase().includes(commLower)
          )
          if (matched) {
            setRelatedCropId(matched.id)
          }
        }
      } else {
        setOcrStatus('POOR_QUALITY')
        const warnings = extracted.quality_warnings
        if (Array.isArray(warnings) && warnings.length > 0) {
          setOcrWarningMessage(warnings.join('. '))
        } else {
          setOcrWarningMessage(null)
        }
      }

    } catch (err: any) {
      console.error('OCR Error:', err)
      setOcrError(err.message || 'Failed to extract text from receipt.')
      setOcrStatus('IDLE')
    }
  }

  // Handle final transaction save
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append('direction', direction)
    formData.append('amount', amount)
    formData.append('category', category)
    formData.append('transaction_date', date)
    formData.append('description', description)
    formData.append('source', source)
    if (relatedCropId) {
      formData.append('related_crop_id', relatedCropId)
    }
    if (preview) {
      // In local/demo mode, we store data preview reference
      formData.append('receipt_image_url', preview)
    }
    if (ocrResult) {
      formData.append('ocr_metadata', JSON.stringify(ocrResult))
    }

    const result = await addTransaction(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      router.push('/records/transactions')
    }
  }

  const confidenceBadge = ocrResult?.confidence !== undefined ? (
    ocrResult.confidence >= 80 
      ? { label: 'High Confidence', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' }
      : ocrResult.confidence >= 50
      ? { label: 'Medium Confidence', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' }
      : { label: 'Low Confidence', color: 'bg-orange-100 text-orange-800 border-orange-200' }
  ) : null

  return (
    <div className="min-h-screen bg-orange-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
        {/* Header */}
        <div className="bg-emerald-800 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/records" className="p-2 hover:bg-emerald-700 rounded-xl transition">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Record Transaction</h1>
              <p className="text-emerald-100 text-sm mt-0.5">Track your farm income and expenses in one ledger.</p>
            </div>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex border-b border-gray-100 bg-gray-50/70 p-2 gap-2">
          <button
            type="button"
            onClick={() => setMode('manual')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition ${
              mode === 'manual'
                ? 'bg-white text-emerald-900 shadow-sm border border-emerald-100'
                : 'text-gray-600 hover:text-emerald-800 hover:bg-white/50'
            }`}
          >
            <FileEdit className="w-4 h-4" />
            Fill Details Myself
          </button>
          <button
            type="button"
            onClick={() => setMode('scan')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition ${
              mode === 'scan'
                ? 'bg-white text-emerald-900 shadow-sm border border-emerald-100'
                : 'text-gray-600 hover:text-emerald-800 hover:bg-white/50'
            }`}
          >
            <Camera className="w-4 h-4" />
            Scan Mandi Receipt
          </button>
        </div>

        <div className="p-6 md:p-8 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* OCR Upload Flow */}
          {mode === 'scan' && (
            <div className="border border-orange-200 bg-orange-50/50 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-orange-950 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-orange-600" />
                  AI Receipt Scanner
                </span>
                {confidenceBadge && (
                  <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${confidenceBadge.color}`}>
                    {confidenceBadge.label} ({ocrResult.confidence}%)
                  </span>
                )}
              </div>

              {ocrError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{ocrError}</span>
                </div>
              )}

              {/* Upload Input / Preview */}
              {!preview ? (
                <div className="border-2 border-dashed border-emerald-300 rounded-xl p-6 text-center bg-white hover:bg-emerald-50/40 transition cursor-pointer relative">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Camera className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                  <p className="font-semibold text-emerald-950 text-sm">Take a photo or upload receipt image</p>
                  <p className="text-gray-500 text-xs mt-1">Supports Mandi slips, APMC receipts, and purchase bills</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative rounded-xl overflow-hidden border border-emerald-200 max-h-48 bg-black/5 flex items-center justify-center">
                    <img src={preview} alt="Receipt preview" className="object-contain max-h-48 w-full" />
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleProcessReceipt}
                      disabled={ocrStatus === 'PROCESSING'}
                      className="flex-1 bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-2.5 rounded-xl transition text-sm flex items-center justify-center gap-2 disabled:opacity-70 shadow-sm"
                    >
                      {ocrStatus === 'PROCESSING' ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Extracting with AI...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          {ocrStatus === 'SUCCESS' || ocrStatus === 'POOR_QUALITY' ? 'Re-extract Data' : 'Extract Data with AI'}
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFile(null)
                        setPreview(null)
                        setOcrResult(null)
                        setOcrStatus('IDLE')
                        setOcrWarningMessage(null)
                      }}
                      className="p-2.5 border border-gray-200 rounded-xl hover:bg-gray-100 text-gray-600 transition"
                      title="Clear image"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {ocrStatus === 'SUCCESS' && (
                <div className="p-3 bg-emerald-100/60 border border-emerald-300 rounded-xl text-xs text-emerald-900 flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-700 mt-0.5 flex-shrink-0" />
                  <span>
                    Receipt extracted successfully! Form fields below have been pre-filled. Please review and edit before saving.
                  </span>
                </div>
              )}

              {ocrStatus === 'POOR_QUALITY' && (
                <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-950 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    {ocrWarningMessage && (
                      <p className="font-semibold text-amber-950">{ocrWarningMessage}</p>
                    )}
                    <p className="text-amber-800">
                      Could not read this receipt clearly. Please check the image is a clear photo of a mandi receipt, or fill in the details manually below.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Unified Transaction Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Direction Selector: IN vs OUT */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Transaction Type *</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleDirectionChange('IN')}
                  className={`p-4 rounded-xl border-2 font-bold flex items-center justify-center gap-2 transition ${
                    direction === 'IN'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-sm'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white'
                  }`}
                >
                  <ArrowDownLeft className={`w-5 h-5 ${direction === 'IN' ? 'text-emerald-600' : 'text-gray-400'}`} />
                  <span>Money In (Income / Sale)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDirectionChange('OUT')}
                  className={`p-4 rounded-xl border-2 font-bold flex items-center justify-center gap-2 transition ${
                    direction === 'OUT'
                      ? 'border-rose-600 bg-rose-50 text-rose-900 shadow-sm'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white'
                  }`}
                >
                  <ArrowUpRight className={`w-5 h-5 ${direction === 'OUT' ? 'text-rose-600' : 'text-gray-400'}`} />
                  <span>Money Out (Expense / Purchase)</span>
                </button>
              </div>
            </div>

            {/* Amount and Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Amount (₹) *</label>
                <input
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="e.g. 15000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-lg text-emerald-950"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Category *</label>
                <select
                  name="category"
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-medium"
                >
                  {(direction === 'IN' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date and Related Crop */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Date *</label>
                <input
                  name="transaction_date"
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Related Crop (Optional)</label>
                <select
                  name="related_crop_id"
                  value={relatedCropId}
                  onChange={(e) => setRelatedCropId(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                >
                  <option value="">None / General Farm Transaction</option>
                  {crops.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.crop_name} {c.variety ? `(${c.variety})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description / Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Description / Notes</label>
              <textarea
                name="description"
                rows={2}
                placeholder="e.g. 5 bags of Urea from IFFCO dealer, or Mandi sale 20 quintals"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
              ></textarea>
            </div>

            {/* Source indicator */}
            <div className="text-xs text-gray-500 flex items-center justify-between pt-1">
              <span>Source: <strong className="uppercase">{source}</strong></span>
              {preview && <span className="text-emerald-700 font-medium">Receipt image attached</span>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-4 rounded-xl shadow-md transition disabled:opacity-70 text-lg mt-4 cursor-pointer"
            >
              {loading ? 'Saving Transaction...' : 'Save Transaction'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
