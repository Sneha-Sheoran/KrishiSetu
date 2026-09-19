import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { ShieldCheck, Users, Store, FileText, Activity } from 'lucide-react'

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()
  
  // Basic admin check (could be more robust in prod)
  if (profile?.role !== 'ADMIN') {
    redirect('/dashboard') // Redirect non-admins
  }

  // Fetch some quick stats
  const { count: farmerCount } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'FARMER')
  const { count: buyerCount } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'BUYER')
  const { count: listingCount } = await supabase.from('marketplace_listings').select('*', { count: 'exact', head: true })
  
  // Pending Verifications
  const { data: pendingBuyers } = await supabase.from('buyers').select('*').eq('verification_status', 'PENDING')

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <header className="mb-8 border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-900">Admin Control Panel</h1>
        <p className="text-gray-500 mt-1">Platform overview and moderation.</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <Users className="w-8 h-8 text-blue-600 mb-2" />
          <span className="text-sm font-medium text-gray-500">Total Farmers</span>
          <span className="text-2xl font-bold text-gray-900 block">{farmerCount || 0}</span>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <Store className="w-8 h-8 text-purple-600 mb-2" />
          <span className="text-sm font-medium text-gray-500">Total Buyers</span>
          <span className="text-2xl font-bold text-gray-900 block">{buyerCount || 0}</span>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <FileText className="w-8 h-8 text-emerald-600 mb-2" />
          <span className="text-sm font-medium text-gray-500">Active Listings</span>
          <span className="text-2xl font-bold text-gray-900 block">{listingCount || 0}</span>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <ShieldCheck className="w-8 h-8 text-orange-600 mb-2" />
          <span className="text-sm font-medium text-gray-500">Pending Approvals</span>
          <span className="text-2xl font-bold text-gray-900 block">{pendingBuyers?.length || 0}</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mt-8">
        {/* Verification Queue */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b">
            <h3 className="font-bold text-gray-900">Pending Buyer Verifications</h3>
          </div>
          <div className="p-0">
            {pendingBuyers && pendingBuyers.length > 0 ? (
              <ul className="divide-y">
                {pendingBuyers.map((buyer: any) => (
                  <li key={buyer.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                    <div>
                      <p className="font-bold text-gray-900">{buyer.business_name}</p>
                      <p className="text-sm text-gray-500">{buyer.buyer_type} | {buyer.state}</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-md font-bold text-sm">Approve</button>
                      <button className="px-3 py-1 bg-red-100 text-red-700 rounded-md font-bold text-sm">Reject</button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-8 text-center text-gray-500">No pending verifications.</div>
            )}
          </div>
        </div>

        {/* Data Source Health */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-gray-500" /> Data Source Health
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center p-3 rounded-lg border">
              <div>
                <p className="font-bold text-gray-800">Agmarknet API</p>
                <p className="text-xs text-gray-500">Market Prices</p>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">Connected</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg border">
              <div>
                <p className="font-bold text-gray-800">IMD Weather API</p>
                <p className="text-xs text-gray-500">Forecasts</p>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">Connected</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg border">
              <div>
                <p className="font-bold text-gray-800">Sentinel-2 Hub</p>
                <p className="text-xs text-gray-500">Satellite Imagery</p>
              </div>
              <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">Mocked (No Key)</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg border">
              <div>
                <p className="font-bold text-gray-800">OCR Engine</p>
                <p className="text-xs text-gray-500">Receipt Processing</p>
              </div>
              <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">Internal Adapter</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
