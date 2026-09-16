import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Link } from '@/i18n/routing'
import { Store, MessageCircle, Heart, CheckCircle2, AlertTriangle, TrendingUp, Search } from 'lucide-react'

export default async function BuyerDashboardPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()
  
  if (profile?.role !== 'BUYER') {
    redirect('/dashboard')
  }

  // Check buyer profile completion
  const { data: buyerProfile } = await supabase.from('buyers').select('*').eq('user_id', user.id).single()

  if (!buyerProfile) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-orange-100 border border-orange-200 p-6 rounded-2xl text-center">
          <h2 className="text-2xl font-bold text-orange-900 mb-2">Welcome, {profile.name}!</h2>
          <p className="text-orange-800 mb-6">Please complete your buyer business profile to start negotiating with farmers.</p>
          <Link 
            href="/profile/buyer-setup" 
            className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold transition"
          >
            Complete Business Profile
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <header className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-emerald-950">Buyer Dashboard</h1>
          <p className="text-emerald-700 mt-1">{buyerProfile.business_name} | {buyerProfile.buyer_type}</p>
        </div>
        <Link href="/marketplace" className="bg-emerald-700 text-white px-6 py-2 rounded-xl flex items-center gap-2 font-semibold">
          <Search className="w-4 h-4"/> Search Produce
        </Link>
      </header>

      {buyerProfile.verification_status === 'PENDING' && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl flex items-start gap-3 mb-6">
          <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0" />
          <div>
            <h4 className="font-bold text-yellow-900">Verification Pending</h4>
            <p className="text-yellow-800 text-sm">Your business profile is under review by admins. You can browse the market, but some transactions may be restricted until verified.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-emerald-100 flex flex-col">
          <Store className="w-8 h-8 text-emerald-600 mb-2" />
          <span className="text-sm font-medium text-emerald-700">Available Produce</span>
          <span className="text-2xl font-bold text-emerald-950">24</span>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-emerald-100 flex flex-col">
          <Heart className="w-8 h-8 text-emerald-600 mb-2" />
          <span className="text-sm font-medium text-emerald-700">Saved Listings</span>
          <span className="text-2xl font-bold text-emerald-950">0</span>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-emerald-100 flex flex-col">
          <MessageCircle className="w-8 h-8 text-emerald-600 mb-2" />
          <span className="text-sm font-medium text-emerald-700">Active Enquiries</span>
          <span className="text-2xl font-bold text-emerald-950">0</span>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-emerald-100 flex flex-col">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 mb-2" />
          <span className="text-sm font-medium text-emerald-700">Completed Deals</span>
          <span className="text-2xl font-bold text-emerald-950">0</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mt-6">
        <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm">
          <h3 className="text-xl font-bold text-emerald-900 mb-4 border-b pb-2">Recent Active Conversations</h3>
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p>You have no active negotiations.</p>
            <Link href="/marketplace" className="text-emerald-600 font-bold mt-2 inline-block">Browse marketplace</Link>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h3 className="text-xl font-bold text-emerald-900">My Requirements</h3>
            <button className="text-sm text-emerald-600 font-bold bg-emerald-50 px-3 py-1 rounded-full">Add New</button>
          </div>
          <div className="text-center py-8 text-gray-500">
            <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p>Post a requirement to signal reverse demand to farmers.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
