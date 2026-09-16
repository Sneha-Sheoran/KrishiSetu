import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Link } from '@/i18n/routing'
import { User, Tractor, Store, Edit, MapPin } from 'lucide-react'

export default async function ProfilePage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()
  
  if (!profile) redirect('/login')

  // Fetch role specific data
  let roleData = null
  if (profile.role === 'FARMER') {
    const { data: farms } = await supabase.from('farms').select('*').eq('farmer_id', user.id)
    roleData = { farms }
  } else if (profile.role === 'BUYER') {
    const { data: buyerDetails } = await supabase.from('buyers').select('*').eq('user_id', user.id).single()
    roleData = { buyerDetails }
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <header className="mb-8 border-b border-emerald-100 pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-emerald-950">My Profile</h1>
          <p className="text-emerald-700 mt-1">Manage your account and settings.</p>
        </div>
        <form action={async () => {
          'use server'
          const { logout } = await import('@/app/actions/auth')
          await logout()
        }}>
          <button type="submit" className="text-red-600 font-semibold hover:bg-red-50 px-4 py-2 rounded-lg transition">
            Logout
          </button>
        </form>
      </header>

      <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm flex items-start gap-6">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 text-emerald-800 text-3xl font-bold">
          {profile.name?.[0].toUpperCase()}
        </div>
        <div className="flex-grow">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-emerald-950">{profile.name}</h2>
              <p className="text-gray-500">{profile.email} • {profile.phone}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              profile.role === 'FARMER' ? 'bg-green-100 text-green-800' : 
              profile.role === 'BUYER' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {profile.role}
            </span>
          </div>
          <button className="text-emerald-600 text-sm font-semibold mt-4 flex items-center gap-1 hover:underline">
            <Edit className="w-4 h-4" /> Edit Profile
          </button>
        </div>
      </div>

      {profile.role === 'FARMER' && (
        <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden">
          <div className="bg-emerald-50 px-6 py-4 border-b flex justify-between items-center">
            <h3 className="font-bold text-emerald-900 flex items-center gap-2">
              <Tractor className="w-5 h-5 text-emerald-600" /> My Farms
            </h3>
            <Link href="/profile/add-farm" className="text-sm font-bold text-emerald-700 hover:underline">
              + Add Farm
            </Link>
          </div>
          <div className="p-6">
            {roleData?.farms && roleData.farms.length > 0 ? (
              <div className="space-y-4">
                {roleData.farms.map((farm: any) => (
                  <div key={farm.id} className="border border-gray-200 rounded-xl p-4">
                    <h4 className="font-bold text-gray-900 text-lg">{farm.farm_name}</h4>
                    <p className="text-sm text-gray-500 flex items-center gap-1 mb-2">
                      <MapPin className="w-4 h-4" /> {farm.village}, {farm.district}, {farm.state}
                    </p>
                    <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t text-sm">
                      <div><span className="text-gray-500 block text-xs">Area</span>{farm.area} {farm.area_unit}</div>
                      <div><span className="text-gray-500 block text-xs">Soil</span>{farm.soil_type || 'Unknown'}</div>
                      <div><span className="text-gray-500 block text-xs">Irrigation</span>{farm.irrigation_type}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No farms registered yet.</p>
            )}
          </div>
        </div>
      )}

      {profile.role === 'BUYER' && (
        <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden">
          <div className="bg-blue-50 px-6 py-4 border-b flex justify-between items-center">
            <h3 className="font-bold text-blue-900 flex items-center gap-2">
              <Store className="w-5 h-5 text-blue-600" /> Business Details
            </h3>
            <Link href="/profile/buyer-setup" className="text-sm font-bold text-blue-700 hover:underline">
              Edit Business
            </Link>
          </div>
          <div className="p-6">
            {roleData?.buyerDetails ? (
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <span className="text-gray-500 block text-xs mb-1">Business Name</span>
                  <p className="font-semibold">{roleData.buyerDetails.business_name}</p>
                </div>
                <div>
                  <span className="text-gray-500 block text-xs mb-1">Type</span>
                  <p className="font-semibold">{roleData.buyerDetails.buyer_type}</p>
                </div>
                <div>
                  <span className="text-gray-500 block text-xs mb-1">Location</span>
                  <p className="font-semibold">{roleData.buyerDetails.district}, {roleData.buyerDetails.state}</p>
                </div>
                <div>
                  <span className="text-gray-500 block text-xs mb-1">Verification Status</span>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    roleData.buyerDetails.verification_status === 'VERIFIED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {roleData.buyerDetails.verification_status}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-500 mb-3">Business profile is incomplete.</p>
                <Link href="/profile/buyer-setup" className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold">
                  Complete Profile
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
