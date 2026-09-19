import { createClient } from '@/utils/supabase/server'
import { Link } from '@/i18n/routing'
import { Search, MapPin, Calendar, ArrowRight, ShieldCheck, Store } from 'lucide-react'

export default async function MarketplacePage() {
  const supabase = await createClient()
  
  // Fetch active listings
  const { data: listings } = await supabase
    .from('marketplace_listings')
    .select('*, users(name, verification_status)')
    .eq('status', 'ACTIVE')
    .order('created_at', { ascending: false })

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-emerald-950">Produce Marketplace</h1>
          <p className="text-emerald-700 mt-1">Connect directly with farmers for fresh agricultural produce.</p>
        </div>
        
        <Link href="/marketplace/create" className="bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-2 px-6 rounded-xl transition shadow-sm">
          List Produce
        </Link>
      </header>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search crop, variety, or location..." 
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none bg-gray-50"
          />
        </div>
        <select className="border border-gray-200 rounded-lg p-3 outline-none bg-gray-50 md:w-48">
          <option>All Crops</option>
          <option>Tomato</option>
          <option>Onion</option>
        </select>
        <select className="border border-gray-200 rounded-lg p-3 outline-none bg-gray-50 md:w-48">
          <option>Sort: Newest</option>
          <option>Price: Low to High</option>
        </select>
      </div>

      {/* Listings Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {listings && listings.length > 0 ? (
          listings.map((listing: any) => (
            <div key={listing.id} className="bg-white rounded-2xl border border-emerald-100 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col">
              <div className="bg-emerald-50 p-6 border-b border-emerald-100 flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-emerald-950">{listing.crop_name}</h3>
                  {listing.variety && <p className="text-emerald-700">{listing.variety}</p>}
                </div>
                <div className="bg-white px-3 py-1 rounded-lg border border-emerald-200 text-center">
                  <span className="block text-xs text-gray-500">Qty</span>
                  <span className="font-bold text-emerald-900">{listing.quantity} {listing.unit}</span>
                </div>
              </div>
              
              <div className="p-6 flex-grow space-y-4">
                <div className="flex justify-between items-end border-b pb-4">
                  <div>
                    <span className="text-sm text-gray-500 block mb-1">Expected Rate</span>
                    <span className="text-2xl font-bold text-emerald-900">₹{listing.expected_price}</span>
                    <span className="text-gray-500 text-sm"> / {listing.unit}</span>
                  </div>
                  <span className="bg-orange-100 text-orange-800 text-xs font-bold px-3 py-1 rounded-full">
                    {listing.quality_grade || 'Standard'}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span>{listing.location_text}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    <span>Harvest: {listing.harvest_date}</span>
                  </div>
                </div>
                
                {/* Farmer Info */}
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 font-bold">
                    {(listing.users?.name || 'F')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                      {listing.users?.name || 'Farmer'}
                      {listing.users?.verification_status === 'VERIFIED' && (
                        <span title="Verified Farmer" className="flex items-center">
                          <ShieldCheck className="w-4 h-4 text-blue-500" />
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-gray-50 border-t border-gray-100">
                <Link 
                  href={`/marketplace/${listing.id}`} 
                  className="w-full flex items-center justify-center gap-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold py-3 rounded-xl transition"
                >
                  View Details <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-3 text-center py-20 bg-white rounded-2xl border border-gray-200">
            <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-700">No active listings</h3>
            <p className="text-gray-500 mt-2">Check back later for fresh produce.</p>
          </div>
        )}
      </div>
    </div>
  )
}
