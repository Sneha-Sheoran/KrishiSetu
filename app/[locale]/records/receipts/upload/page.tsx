'use client'

import { useState } from 'react'
import { Camera, Upload, FileText, Check, AlertTriangle, RefreshCw } from 'lucide-react'
import { useRouter } from '@/i18n/routing'
import { useRecordsStore } from '@/lib/store/useRecordsStore'

export default function ReceiptUploadPage() {
  const router = useRouter()
  const { addReceipt } = useRecordsStore()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [status, setStatus] = useState<'IDLE' | 'PROCESSING' | 'REVIEW' | 'SAVING'>('IDLE')
  const [extractedData, setExtractedData] = useState<any>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null)
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)
      setPreview(URL.createObjectURL(selectedFile))
    }
  }

  const handleFieldChange = (field: string, value: any) => {
    setExtractedData((prev: any) => ({
      ...prev,
      [field]: value
    }))
  }

  const resetUpload = () => {
    setFile(null)
    setPreview(null)
    setExtractedData(null)
    setErrorMessage(null)
    setStatus('IDLE')
  }

  const processReceipt = async () => {
    if (!file) return
    setStatus('PROCESSING')
    setErrorMessage(null)

    const formData = new FormData()
    formData.append('receipt', file)

    try {
      const response = await fetch('/api/ocr', {
        method: 'POST',
        body: formData
      })

      const rawText = await response.text()
      let result: any
      try {
        result = JSON.parse(rawText)
      } catch {
        throw new Error('Server returned an unreadable response format. Please try again.')
      }
      
      if (response.ok && result.data) {
        setExtractedData(result.data)
        setStatus('REVIEW')
      } else {
        setErrorMessage(result?.error || 'OCR could not read the receipt. Please upload a clearer photo.')
        setStatus('IDLE')
      }
    } catch (e: any) {
      setErrorMessage(e?.message || 'Network error while processing receipt. Please check your connection and try again.')
      setStatus('IDLE')
    }
  }

  const handleSave = async () => {
    if (!extractedData) return
    setStatus('SAVING')

    try {
      // Save verified receipt to Zustand / IndexedDB store
      addReceipt({
        market: extractedData.market || 'Unknown Market',
        commodity: extractedData.commodity || 'Unknown Commodity',
        variety: extractedData.variety || undefined,
        quantity: Number(extractedData.quantity) || 0,
        unit: extractedData.unit || 'Quintal',
        price_per_unit: Number(extractedData.price_per_unit) || 0,
        gross_amount: Number(extractedData.gross_amount) || (Number(extractedData.quantity) * Number(extractedData.price_per_unit)),
        commission: Number(extractedData.commission) || 0,
        deductions: Number(extractedData.deductions) || 0,
        net_amount: Number(extractedData.net_amount) || 0,
        receipt_date: extractedData.receipt_date || new Date().toISOString().split('T')[0],
        farmer_name: extractedData.farmer_name || undefined,
        receipt_number: extractedData.receipt_number || undefined,
        vehicle_number: extractedData.vehicle_number || undefined,
        image_url: preview || undefined,
        confidence: extractedData.confidence || undefined
      })

      await new Promise(resolve => setTimeout(resolve, 800))
      alert('Receipt verified and saved successfully!')
      router.push('/records')
    } catch (err: any) {
      alert('Failed to save receipt: ' + (err?.message || 'Unknown error'))
      setStatus('REVIEW')
    }
  }

  // Confidence Category Label & Styling
  const confidenceScore = extractedData?.confidence ?? 0
  const confidenceBadge = 
    confidenceScore >= 90
      ? { label: `${confidenceScore}% - High Confidence`, color: 'bg-emerald-100 text-emerald-800 border-emerald-300' }
      : confidenceScore >= 75
      ? { label: `${confidenceScore}% - Good Confidence`, color: 'bg-blue-100 text-blue-800 border-blue-300' }
      : confidenceScore >= 50
      ? { label: `${confidenceScore}% - Low Confidence (Verify)`, color: 'bg-yellow-100 text-yellow-800 border-yellow-300' }
      : { label: `${confidenceScore}% - Very Low (Manual Check)`, color: 'bg-red-100 text-red-800 border-red-300' }

  return (
    <div className="min-h-screen bg-orange-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
        <div className="bg-orange-100 border-b border-orange-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-6 h-6 text-orange-600" />
            <h1 className="text-2xl font-bold text-orange-900">Upload Mandi Receipt</h1>
          </div>
          <p className="text-orange-800">Take a photo of your receipt to automatically extract records.</p>
        </div>

        <div className="p-6 md:p-8">
          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-900">{errorMessage}</p>
              </div>
            </div>
          )}

          {status === 'IDLE' && (
            <div className="space-y-6">
              <div className="border-2 border-dashed border-emerald-200 rounded-2xl p-8 text-center bg-emerald-50 hover:bg-emerald-100 transition cursor-pointer relative">
                <input 
                  type="file" 
                  accept="image/*"
                  capture="environment" 
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Camera className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
                <p className="text-lg font-semibold text-emerald-900">Take a photo or upload</p>
                <p className="text-emerald-700 mt-1">Make sure all text is clearly visible</p>
              </div>
              
              {preview && (
                <div className="mt-6">
                  <p className="text-sm font-medium text-emerald-900 mb-2">Selected Image:</p>
                  <img src={preview} alt="Receipt Preview" className="max-h-64 rounded-xl border border-emerald-200 mx-auto" />
                  <button 
                    onClick={processReceipt}
                    className="w-full mt-4 bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition shadow-md flex items-center justify-center gap-2"
                  >
                    <Upload className="w-5 h-5" />
                    Extract Data with AI
                  </button>
                </div>
              )}
            </div>
          )}

          {status === 'PROCESSING' && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-700 mx-auto mb-4"></div>
              <h3 className="text-xl font-bold text-emerald-900">Analyzing Receipt...</h3>
              <p className="text-emerald-600">Our AI is reading the details.</p>
            </div>
          )}

          {status === 'SAVING' && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-700 mx-auto mb-4"></div>
              <h3 className="text-xl font-bold text-emerald-900">Saving Receipt...</h3>
              <p className="text-emerald-600">Updating your records.</p>
            </div>
          )}

          {status === 'REVIEW' && extractedData && (
            <div className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-yellow-900">Please review extracted data</h4>
                    <p className="text-yellow-800 text-sm">Verify the values below and correct them if necessary before saving.</p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${confidenceBadge.color}`}>
                  {confidenceBadge.label}
                </span>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <img src={preview!} alt="Receipt" className="rounded-xl border border-emerald-200 w-full object-contain max-h-96" />
                  <button
                    onClick={resetUpload}
                    className="w-full text-xs text-emerald-800 hover:text-emerald-950 font-medium py-2 flex items-center justify-center gap-1 border border-emerald-200 rounded-lg hover:bg-emerald-50 transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Upload Another Receipt
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Market</label>
                    <input 
                      type="text" 
                      value={extractedData.market ?? ''} 
                      onChange={(e) => handleFieldChange('market', e.target.value)}
                      className="w-full p-2 border rounded-lg focus:ring-1 outline-none" 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Farmer Name</label>
                      <input 
                        type="text" 
                        value={extractedData.farmer_name ?? ''} 
                        onChange={(e) => handleFieldChange('farmer_name', e.target.value)}
                        placeholder="Farmer Name"
                        className="w-full p-2 border rounded-lg focus:ring-1 outline-none" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
                      <input 
                        type="date" 
                        value={extractedData.receipt_date ?? ''} 
                        onChange={(e) => handleFieldChange('receipt_date', e.target.value)}
                        className="w-full p-2 border rounded-lg focus:ring-1 outline-none" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Commodity</label>
                      <input 
                        type="text" 
                        value={extractedData.commodity ?? ''} 
                        onChange={(e) => handleFieldChange('commodity', e.target.value)}
                        className="w-full p-2 border rounded-lg focus:ring-1 outline-none" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Variety</label>
                      <input 
                        type="text" 
                        value={extractedData.variety ?? ''} 
                        onChange={(e) => handleFieldChange('variety', e.target.value)}
                        className="w-full p-2 border rounded-lg focus:ring-1 outline-none" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Qty</label>
                      <input 
                        type="number" 
                        value={extractedData.quantity ?? ''} 
                        onChange={(e) => handleFieldChange('quantity', e.target.value === '' ? null : Number(e.target.value))}
                        className="w-full p-2 border rounded-lg focus:ring-1 outline-none font-semibold" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Unit</label>
                      <input 
                        type="text" 
                        value={extractedData.unit ?? ''} 
                        onChange={(e) => handleFieldChange('unit', e.target.value)}
                        className="w-full p-2 border rounded-lg focus:ring-1 outline-none" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Rate</label>
                      <input 
                        type="number" 
                        value={extractedData.price_per_unit ?? ''} 
                        onChange={(e) => handleFieldChange('price_per_unit', e.target.value === '' ? null : Number(e.target.value))}
                        className="w-full p-2 border rounded-lg focus:ring-1 outline-none font-semibold" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Receipt No.</label>
                      <input 
                        type="text" 
                        value={extractedData.receipt_number ?? ''} 
                        onChange={(e) => handleFieldChange('receipt_number', e.target.value)}
                        placeholder="Receipt / Bill #"
                        className="w-full p-2 border rounded-lg focus:ring-1 outline-none text-sm" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Vehicle No.</label>
                      <input 
                        type="text" 
                        value={extractedData.vehicle_number ?? ''} 
                        onChange={(e) => handleFieldChange('vehicle_number', e.target.value)}
                        placeholder="e.g. DL 1L AB 4521"
                        className="w-full p-2 border rounded-lg focus:ring-1 outline-none text-sm" 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Net Amount (₹)</label>
                    <input 
                      type="number" 
                      value={extractedData.net_amount ?? ''} 
                      onChange={(e) => handleFieldChange('net_amount', e.target.value === '' ? null : Number(e.target.value))}
                      className="w-full p-2 border rounded-lg font-bold text-emerald-700 focus:ring-1 outline-none text-lg" 
                    />
                  </div>

                  <button 
                    onClick={handleSave}
                    className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition shadow-md flex items-center justify-center gap-2 mt-4 cursor-pointer"
                  >
                    <Check className="w-5 h-5" />
                    Verify and Save Record
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
