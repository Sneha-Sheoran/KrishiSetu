'use client'

import { useState } from 'react'
import { useRouter } from '@/i18n/routing'
import { Link } from '@/i18n/routing'
import { Sprout, ArrowLeft, AlertCircle } from 'lucide-react'
import { addCrop } from '@/app/actions/records'

export default function AddCropPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const result = await addCrop(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      router.push('/records')
    }
  }

  return (
    <div className="min-h-screen bg-orange-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
        <div className="bg-emerald-800 p-6 text-white flex items-center gap-4">
          <Link href="/records" className="p-2 hover:bg-emerald-700 rounded-xl transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <Sprout className="w-6 h-6 text-emerald-300" />
              <h1 className="text-2xl font-bold">Add New Crop</h1>
            </div>
            <p className="text-emerald-100 text-sm mt-1">Record a new crop planting in your farm records.</p>
          </div>
        </div>

        <div className="p-6 md:p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-emerald-900 mb-1">Crop Name *</label>
                <input
                  name="crop_name"
                  type="text"
                  required
                  placeholder="e.g. Wheat, Tomato, Soybean"
                  className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-emerald-900 mb-1">Variety</label>
                <input
                  name="variety"
                  type="text"
                  placeholder="e.g. Sharbati, Desi, Hybrid"
                  className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-emerald-900 mb-1">Area (Acres / Bigha)</label>
                <input
                  name="area"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="e.g. 2.5"
                  className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-emerald-900 mb-1">Sowing Date *</label>
                <input
                  name="sowing_date"
                  type="date"
                  required
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-4 rounded-xl shadow-md transition disabled:opacity-70 text-lg mt-6"
            >
              {loading ? 'Saving...' : 'Save Crop Record'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
