'use client'

import { useState } from 'react'
import { addFarm } from '@/app/actions/farm'
import { MapPin } from 'lucide-react'

export default function AddFarmPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    
    const result = await addFarm(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-orange-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
        <div className="bg-emerald-800 p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <MapPin className="w-6 h-6 text-emerald-300" />
            <h1 className="text-2xl font-bold">Add Farm Details</h1>
          </div>
          <p className="text-emerald-100">Tell us about your farm to receive personalized crop and weather advisory.</p>
        </div>

        <div className="p-6 md:p-8">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-emerald-900 border-b pb-2">Basic Information</h3>
              <div>
                <label className="block text-sm font-medium text-emerald-900 mb-1">Farm Name</label>
                <input name="farm_name" type="text" required placeholder="e.g. Green Valley Farm" className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-emerald-900 mb-1">Total Area</label>
                  <input name="area" type="number" step="0.01" required placeholder="e.g. 5" className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-emerald-900 mb-1">Unit</label>
                  <select name="area_unit" required className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-emerald-500 outline-none bg-white">
                    <option value="Acres">Acres</option>
                    <option value="Hectares">Hectares</option>
                    <option value="Bigha">Bigha</option>
                    <option value="Guntha">Guntha</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-emerald-900 border-b pb-2">Location</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-emerald-900 mb-1">State</label>
                  <input name="state" type="text" required className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-emerald-900 mb-1">District</label>
                  <input name="district" type="text" required className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-emerald-900 mb-1">Village/Town</label>
                <input name="village" type="text" required className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-emerald-900 border-b pb-2">Soil & Irrigation</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-emerald-900 mb-1">Soil Type</label>
                  <select name="soil_type" className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-emerald-500 outline-none bg-white">
                    <option value="">I don't know</option>
                    <option value="Alluvial">Alluvial</option>
                    <option value="Black">Black Soil (Regur)</option>
                    <option value="Red">Red Soil</option>
                    <option value="Laterite">Laterite</option>
                    <option value="Clay">Clay</option>
                    <option value="Sandy">Sandy</option>
                    <option value="Loamy">Loamy</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-emerald-900 mb-1">Soil pH (optional)</label>
                  <input name="soil_ph" type="number" step="0.1" placeholder="e.g. 6.5" className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-emerald-900 mb-1">Irrigation Type</label>
                <select name="irrigation_type" required className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-emerald-500 outline-none bg-white">
                  <option value="Rainfed">Rainfed</option>
                  <option value="Drip">Drip Irrigation</option>
                  <option value="Sprinkler">Sprinkler</option>
                  <option value="Canal">Canal/Flood</option>
                  <option value="Tube Well">Tube Well/Borewell</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-4 rounded-xl shadow-md transition disabled:opacity-70 text-lg mt-6"
            >
              {loading ? 'Saving Farm Details...' : 'Save & Continue'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
