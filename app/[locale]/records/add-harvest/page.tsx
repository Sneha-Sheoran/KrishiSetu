'use client'

import { useState, useEffect } from 'react'
import { useRouter } from '@/i18n/routing'
import { Link } from '@/i18n/routing'
import { Package, ArrowLeft, AlertCircle, Sprout, Plus } from 'lucide-react'
import { getCrops, addHarvest, CropItem } from '@/app/actions/records'

export default function AddHarvestPage() {
  const router = useRouter()
  const [crops, setCrops] = useState<CropItem[]>([])
  const [fetchingCrops, setFetchingCrops] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadFarmerCrops() {
      try {
        const farmerCrops = await getCrops()
        setCrops(farmerCrops)
      } catch (err) {
        console.error('Failed to load crops for harvest:', err)
      } finally {
        setFetchingCrops(false)
      }
    }
    loadFarmerCrops()
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const result = await addHarvest(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      router.push('/records')
    }
  }

  return (
    <div className="min-h-screen bg-orange-50 p-4 md:p-8">
      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
        <div className="bg-emerald-800 p-6 text-white flex items-center gap-4">
          <Link href="/records" className="p-2 hover:bg-emerald-700 rounded-xl transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <Package className="w-6 h-6 text-emerald-300" />
              <h1 className="text-2xl font-bold">Add Harvest Record</h1>
            </div>
            <p className="text-emerald-100 text-sm mt-1">Record harvested yield against your planted crops.</p>
          </div>
        </div>

        <div className="p-6 md:p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {fetchingCrops ? (
            <div className="py-12 flex justify-center items-center text-emerald-700 text-sm">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-700 mr-3"></div>
              Loading your crops...
            </div>
          ) : crops.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
                <Sprout className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-emerald-950 mb-1">No Planted Crops Found</h3>
              <p className="text-emerald-700 text-sm mb-6 max-w-sm mx-auto">
                You haven&apos;t added any crops yet. Please add a crop planting before recording its harvest.
              </p>
              <Link
                href="/records/add-crop"
                className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold px-6 py-3 rounded-xl shadow-sm transition"
              >
                <Plus className="w-5 h-5" />
                Add Your First Crop
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-emerald-900 mb-1">Select Crop *</label>
                <select
                  name="crop_id"
                  required
                  defaultValue={crops[0]?.id}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                >
                  {crops.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.crop_name} {c.variety ? `(${c.variety})` : ''} - Sown: {c.sowing_date || 'N/A'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-emerald-900 mb-1">Yield Quantity *</label>
                  <input
                    name="quantity"
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="e.g. 50"
                    className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-emerald-900 mb-1">Unit *</label>
                  <select
                    name="unit"
                    required
                    defaultValue="Quintal"
                    className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                  >
                    <option value="Quintal">Quintal</option>
                    <option value="Tons">Tons</option>
                    <option value="Kg">Kg</option>
                    <option value="Crates">Crates</option>
                    <option value="Bags">Bags</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-emerald-900 mb-1">Harvest Date *</label>
                <input
                  name="harvest_date"
                  type="date"
                  required
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-emerald-900 mb-1">Quality Grade (Optional)</label>
                <select
                  name="quality_grade"
                  defaultValue=""
                  className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                >
                  <option value="">Select grade (optional)...</option>
                  <option value="Grade A">Grade A (Premium)</option>
                  <option value="Grade B">Grade B (Standard)</option>
                  <option value="Grade C">Grade C (Commercial)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-4 rounded-xl shadow-md transition disabled:opacity-70 text-lg mt-6"
              >
                {loading ? 'Saving...' : 'Save Harvest'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
