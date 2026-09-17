'use client'

import { useState } from 'react'
import { useRouter } from '@/i18n/routing'
import { TrendingDown, ArrowLeft } from 'lucide-react'
import { Link } from '@/i18n/routing'

export default function AddExpensePage() {
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
            <TrendingDown className="w-6 h-6 text-emerald-300" />
            <h1 className="text-2xl font-bold">Add Farm Expense</h1>
          </div>
        </div>

        <div className="p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-emerald-900 mb-1">Expense Type</label>
              <select name="type" required className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-emerald-500 outline-none bg-white">
                <option value="Fertilizer">Fertilizer</option>
                <option value="Pesticide">Pesticide</option>
                <option value="Labor">Labor</option>
                <option value="Machinery">Machinery / Tractor</option>
                <option value="Seeds">Seeds</option>
                <option value="Irrigation">Irrigation / Water</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-emerald-900 mb-1">Amount (₹)</label>
              <input name="amount" type="number" required placeholder="e.g. 5000" className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-emerald-900 mb-1">Date</label>
              <input name="date" type="date" required className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-emerald-900 mb-1">Notes (Optional)</label>
              <textarea name="notes" rows={3} placeholder="Add any details..." className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-emerald-500 outline-none"></textarea>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-4 rounded-xl shadow-md transition disabled:opacity-70 text-lg mt-6"
            >
              {loading ? 'Saving...' : 'Save Expense'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
