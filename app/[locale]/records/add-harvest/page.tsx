'use client'

import { useState } from 'react'
import { useRouter } from '@/i18n/routing'
import { Package, ArrowLeft } from 'lucide-react'
import { Link } from '@/i18n/routing'

export default function AddHarvestPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    
    // Mock save
    setTimeout(() => {
      router.push('/records')
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-orange-50 p-4 md:p-8">
      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
        <div className="bg-emerald-800 p-6 text-white flex items-center gap-4">
          <Link href="/records" className="hover:bg-emerald-700 p-2 rounded-full transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6 text-emerald-300" />
            <h1 className="text-2xl font-bold">Add Harvest Record</h1>
          </div>
        </div>

        <div className="p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-emerald-900 mb-1">Crop</label>
              <select name="crop" required className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-emerald-500 outline-none bg-white">
                <option value="">Select an active crop...</option>
                <option value="tomato">Tomato (Summer)</option>
                <option value="onion">Onion (Rabi)</option>
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-emerald-900 mb-1">Yield Quantity</label>
                <input name="quantity" type="number" required placeholder="e.g. 50" className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-emerald-900 mb-1">Unit</label>
                <select name="unit" required className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-emerald-500 outline-none bg-white">
                  <option value="Quintal">Quintal</option>
                  <option value="Tons">Tons</option>
                  <option value="Kg">Kg</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-emerald-900 mb-1">Harvest Date</label>
              <input name="date" type="date" required className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-emerald-900 mb-1">Quality Note (Optional)</label>
              <textarea name="notes" rows={2} placeholder="e.g. Good quality, medium size..." className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-emerald-500 outline-none"></textarea>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-4 rounded-xl shadow-md transition disabled:opacity-70 text-lg mt-6"
            >
              {loading ? 'Saving...' : 'Save Harvest'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
