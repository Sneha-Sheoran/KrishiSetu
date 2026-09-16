'use client'

import { useState } from 'react'
import { createListing } from '@/app/actions/marketplace'
import { Store, MapPin, Calendar, Tag } from 'lucide-react'

export default function CreateListingPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    
    const result = await createListing(formData)
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
            <Store className="w-6 h-6 text-emerald-300" />
            <h1 className="text-2xl font-bold">List Produce for Sale</h1>
          </div>
          <p className="text-emerald-100">Directly connect with verified buyers by creating an open listing.</p>
        </div>

        <div className="p-6 md:p-8">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-emerald-900 mb-1">Crop Name</label>
                <input name="crop_name" type="text" required placeholder="e.g. Onion" className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-emerald-900 mb-1">Variety (Optional)</label>
                <input name="variety" type="text" placeholder="e.g. Red Nashik" className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-emerald-900 mb-1">Quantity</label>
                <input name="quantity" type="number" step="0.1" required placeholder="Total amount" className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-emerald-900 mb-1">Unit</label>
                <select name="unit" required className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-emerald-500 outline-none bg-white">
                  <option value="Quintal">Quintal</option>
                  <option value="Tons">Tons</option>
                  <option value="Kg">Kg</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-emerald-900 mb-1">Expected Price (₹)</label>
                <input name="expected_price" type="number" required placeholder="Per unit" className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-emerald-900 mb-1">Quality Grade</label>
                <select name="quality_grade" className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-emerald-500 outline-none bg-white">
                  <option value="Grade A">Grade A (Premium)</option>
                  <option value="Grade B">Grade B (Standard)</option>
                  <option value="Grade C">Grade C (Average)</option>
                  <option value="Ungraded">Ungraded</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-emerald-900 mb-1 flex items-center gap-1"><Calendar className="w-4 h-4"/> Harvest Date</label>
                <input name="harvest_date" type="date" required className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-emerald-900 mb-1 flex items-center gap-1"><MapPin className="w-4 h-4"/> Location</label>
                <input name="location_text" type="text" required placeholder="Village, District (e.g. Niphad, Nashik)" className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-emerald-900 mb-1 flex items-center gap-1"><Tag className="w-4 h-4"/> Additional Details</label>
                <textarea name="description" rows={3} placeholder="Any specific requirements for buyers or details about produce..." className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-emerald-500 outline-none"></textarea>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-4 rounded-xl shadow-md transition disabled:opacity-70 text-lg mt-6"
            >
              {loading ? 'Publishing...' : 'Publish Listing'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
