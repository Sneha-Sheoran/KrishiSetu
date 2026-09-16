'use client'

import { useState } from 'react'
import { useRecordsStore } from '@/lib/store/useRecordsStore'
import { useRouter } from '@/i18n/routing'
import { Sprout } from 'lucide-react'

export default function AddCropPage() {
  const router = useRouter()
  const { addCrop } = useRecordsStore()
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    
    const formData = new FormData(e.currentTarget)
    
    // Add locally to Zustand store (which persists to IndexedDB)
    addCrop({
      crop_name: formData.get('crop_name') as string,
      variety: formData.get('variety') as string,
      area: parseFloat(formData.get('area') as string),
      sowing_date: formData.get('sowing_date') as string,
      status: 'PLANTED'
    })

    // TODO: Trigger background sync queue here

    // Navigate back to records dashboard
    router.push('/records')
  }

  return (
    <div className="min-h-screen bg-orange-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
        <div className="bg-emerald-800 p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <Sprout className="w-6 h-6 text-emerald-300" />
            <h1 className="text-2xl font-bold">Add New Crop</h1>
          </div>
          <p className="text-emerald-100">Record a new crop planting. This will be saved offline and synced automatically.</p>
        </div>

        <div className="p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-emerald-900 mb-1">Crop Name</label>
                <input name="crop_name" type="text" required placeholder="e.g. Tomato" className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              
              <div className="col-span-2">
                <label className="block text-sm font-medium text-emerald-900 mb-1">Variety</label>
                <input name="variety" type="text" placeholder="e.g. Roma" className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-emerald-900 mb-1">Area</label>
                <input name="area" type="number" step="0.01" required placeholder="Area planted" className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-emerald-900 mb-1">Sowing Date</label>
                <input name="sowing_date" type="date" required className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-emerald-500 outline-none" />
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
