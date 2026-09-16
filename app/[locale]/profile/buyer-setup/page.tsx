'use client'

import { useState } from 'react'
import { useRouter } from '@/i18n/routing'
import { Store, ShieldCheck } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

export default function BuyerSetupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
      return
    }

    const { error } = await supabase.from('buyers').insert({
      user_id: user.id,
      business_name: formData.get('business_name'),
      buyer_type: formData.get('buyer_type'),
      contact_person: formData.get('contact_person'),
      phone: formData.get('phone'),
      email: formData.get('email'),
      address: formData.get('address'),
      state: formData.get('state'),
      district: formData.get('district'),
      gstin: formData.get('gstin') || null,
      verification_status: 'PENDING'
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/buyer')
    }
  }

  return (
    <div className="min-h-screen bg-orange-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
        <div className="bg-emerald-800 p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <Store className="w-6 h-6 text-emerald-300" />
            <h1 className="text-2xl font-bold">Complete Business Profile</h1>
          </div>
          <p className="text-emerald-100">Provide your business details to build trust with farmers.</p>
        </div>

        <div className="p-6 md:p-8">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-emerald-900 border-b pb-2">Business Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-emerald-900 mb-1">Business Name</label>
                  <input name="business_name" type="text" required className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-emerald-900 mb-1">Buyer Type</label>
                  <select name="buyer_type" required className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-emerald-500 outline-none bg-white">
                    <option value="Wholesaler">Wholesaler</option>
                    <option value="Processor">Processor</option>
                    <option value="Retailer">Retailer</option>
                    <option value="Institution">Institution</option>
                    <option value="FPO">FPO</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-emerald-900 mb-1">GSTIN (Optional)</label>
                  <input name="gstin" type="text" className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-emerald-900 border-b pb-2">Contact Person</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-emerald-900 mb-1">Contact Name</label>
                  <input name="contact_person" type="text" required className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-emerald-900 mb-1">Phone</label>
                  <input name="phone" type="tel" required className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-emerald-900 mb-1">Email</label>
                  <input name="email" type="email" required className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-emerald-900 border-b pb-2">Location</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-emerald-900 mb-1">Full Address</label>
                  <input name="address" type="text" required className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-emerald-900 mb-1">State</label>
                  <input name="state" type="text" required className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-emerald-900 mb-1">District</label>
                  <input name="district" type="text" required className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-start gap-3 mt-6">
              <ShieldCheck className="w-6 h-6 text-blue-600 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-blue-900">Verification Process</h4>
                <p className="text-blue-800 text-sm">After submission, your profile will be reviewed. Verified buyers gain a trust badge and can negotiate faster with farmers.</p>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-4 rounded-xl shadow-md transition disabled:opacity-70 text-lg mt-6"
            >
              {loading ? 'Submitting...' : 'Submit Profile'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
