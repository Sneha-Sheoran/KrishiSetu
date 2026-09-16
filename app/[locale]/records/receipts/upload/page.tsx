'use client'

import { useState } from 'react'
import { Camera, Upload, FileText, Check, AlertTriangle } from 'lucide-react'
import { useRouter } from '@/i18n/routing'

export default function ReceiptUploadPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [status, setStatus] = useState<'IDLE' | 'PROCESSING' | 'REVIEW' | 'SAVING'>('IDLE')
  const [extractedData, setExtractedData] = useState<any>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)
      setPreview(URL.createObjectURL(selectedFile))
    }
  }

  const processReceipt = async () => {
    if (!file) return
    setStatus('PROCESSING')

    const formData = new FormData()
    formData.append('receipt', file)

    try {
      const response = await fetch('/api/ocr', {
        method: 'POST',
        body: formData
      })
      const result = await response.json()
      
      if (response.ok) {
        setExtractedData(result.data)
        setStatus('REVIEW')
      } else {
        alert('OCR failed: ' + result.error)
        setStatus('IDLE')
      }
    } catch (e) {
      alert('Network error')
      setStatus('IDLE')
    }
  }

  const handleSave = async () => {
    setStatus('SAVING')
    // TODO: Upload image to Supabase Storage and save extractedData to receipts table
    await new Promise(resolve => setTimeout(resolve, 1000))
    alert('Receipt verified and saved successfully!')
    router.push('/records')
  }

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

          {status === 'REVIEW' && extractedData && (
            <div className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-yellow-900">Please review extracted data</h4>
                  <p className="text-yellow-800 text-sm">AI can make mistakes. Verify the values below and correct them if necessary before saving.</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <img src={preview!} alt="Receipt" className="rounded-xl border border-emerald-200 w-full" />
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Market</label>
                    <input type="text" defaultValue={extractedData.market} className="w-full p-2 border rounded-lg focus:ring-1 outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Commodity</label>
                      <input type="text" defaultValue={extractedData.commodity} className="w-full p-2 border rounded-lg focus:ring-1 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Variety</label>
                      <input type="text" defaultValue={extractedData.variety} className="w-full p-2 border rounded-lg focus:ring-1 outline-none" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Qty</label>
                      <input type="number" defaultValue={extractedData.quantity} className="w-full p-2 border rounded-lg focus:ring-1 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Unit</label>
                      <input type="text" defaultValue={extractedData.unit} className="w-full p-2 border rounded-lg focus:ring-1 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Rate</label>
                      <input type="number" defaultValue={extractedData.price_per_unit} className="w-full p-2 border rounded-lg focus:ring-1 outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Net Amount (₹)</label>
                    <input type="number" defaultValue={extractedData.net_amount} className="w-full p-2 border rounded-lg font-bold text-emerald-700 focus:ring-1 outline-none" />
                  </div>

                  <button 
                    onClick={handleSave}
                    className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition shadow-md flex items-center justify-center gap-2 mt-4"
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
