import { getUserProfile, getUserFarms } from '@/app/actions/user'
import { redirect } from 'next/navigation'
import { Link } from '@/i18n/routing'
import { PlusCircle, Sprout, TrendingUp, CloudSun } from 'lucide-react'

export default async function DashboardPage() {
  const profile = await getUserProfile()
  
  if (!profile) {
    redirect('/login')
  }

  if (profile.role === 'BUYER') {
    redirect('/buyer')
  }

  // If Farmer, check if they have a farm registered
  const farms = await getUserFarms(profile.id)
  const hasFarm = farms.length > 0

  if (!hasFarm) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-orange-100 border border-orange-200 p-6 rounded-2xl text-center">
          <h2 className="text-2xl font-bold text-orange-900 mb-2">Welcome to KrishiSetu, {profile.name}!</h2>
          <p className="text-orange-800 mb-6">To get personalized crop and price advisory, please add your farm details.</p>
          <Link 
            href="/profile/add-farm" 
            className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold transition"
          >
            <PlusCircle className="w-5 h-5" />
            Add My Farm
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <header className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-emerald-950">Good morning, {profile.name}</h1>
          <p className="text-emerald-700 mt-1">Here is what you should know about your farm today.</p>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Quick Stats Cards */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-emerald-100 flex flex-col">
          <Sprout className="w-8 h-8 text-emerald-600 mb-2" />
          <span className="text-sm font-medium text-emerald-700">Active Crops</span>
          <span className="text-2xl font-bold text-emerald-950">3</span>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-emerald-100 flex flex-col">
          <TrendingUp className="w-8 h-8 text-emerald-600 mb-2" />
          <span className="text-sm font-medium text-emerald-700">Total Sales</span>
          <span className="text-2xl font-bold text-emerald-950">₹0</span>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-emerald-100 flex flex-col">
          <CloudSun className="w-8 h-8 text-emerald-600 mb-2" />
          <span className="text-sm font-medium text-emerald-700">Weather Alert</span>
          <span className="text-lg font-bold text-emerald-950">Clear Skies</span>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-emerald-100 flex flex-col">
          <span className="text-sm font-medium text-emerald-700 mb-2">Available Produce</span>
          <span className="text-2xl font-bold text-emerald-950">0 kg</span>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100">
            <h3 className="text-xl font-bold text-emerald-900 mb-4">Today's Advisory</h3>
            <p className="text-emerald-800">Based on your farm location and current weather, irrigation is not needed today. Soil moisture is optimal.</p>
            <Link href="/advisory" className="text-emerald-700 font-bold mt-4 inline-block hover:underline">View full advisory &rarr;</Link>
          </div>
          
          <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm">
            <h3 className="text-xl font-bold text-emerald-900 mb-4">Market Trend</h3>
            <p className="text-emerald-600 mb-4">Tomato prices are trending upwards in your district.</p>
            <Link href="/market" className="text-emerald-700 font-bold hover:underline">View live mandi prices &rarr;</Link>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm">
            <h3 className="text-xl font-bold text-emerald-900 mb-4">Recent Farm Record</h3>
            <p className="text-gray-500 text-sm mb-4">No recent records found.</p>
            <Link href="/records" className="w-full text-center block bg-emerald-100 text-emerald-800 font-semibold py-2 rounded-xl hover:bg-emerald-200 transition">
              Add Record
            </Link>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm">
            <h3 className="text-xl font-bold text-emerald-900 mb-4">Buyer Enquiries</h3>
            <p className="text-gray-500 text-sm mb-4">No new enquiries today.</p>
            <Link href="/marketplace/my-listings" className="w-full text-center block bg-emerald-100 text-emerald-800 font-semibold py-2 rounded-xl hover:bg-emerald-200 transition">
              View My Listings
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
