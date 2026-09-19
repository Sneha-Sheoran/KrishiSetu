import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Link } from '@/i18n/routing'
import { Store, Edit, Trash2, MapPin } from 'lucide-react'

export default async function MyListingsPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: listings } = await supabase
    .from('marketplace_listings')
    .select('*')
    .eq('farmer_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-emerald-950">My Marketplace Listings</h1>
          <p className="text-emerald-700 mt-1">Manage your active and past produce listings.</p>
        </div>
        <Link href="/marketplace/create" className="bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-2 px-6 rounded-xl transition shadow-sm">
          + New Listing
        </Link>
      </header>

      <div className="space-y-4">
        {listings && listings.length > 0 ? (
          listings.map((listing: any) => (
            <div key={listing.id} className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-emerald-950">{listing.crop_name}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    listing.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                    listing.status === 'SOLD' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {listing.status}
                  </span>
                </div>
                <div className="text-sm text-gray-600 flex flex-wrap gap-x-6 gap-y-2">
                  <span className="font-semibold text-emerald-800">{listing.quantity} {listing.unit} @ ₹{listing.expected_price}/{listing.unit}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {listing.location_text}</span>
                  <span>Listed: {new Date(listing.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2 mt-4 md:mt-0">
                <button className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition" title="Edit">
                  <Edit className="w-5 h-5" />
                </button>
                <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
            <Store className="w-16 h-16 text-emerald-200 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-emerald-800">No listings yet</h3>
            <p className="text-emerald-600 mt-2 mb-6">Create your first listing to connect with buyers.</p>
            <Link href="/marketplace/create" className="bg-emerald-700 text-white font-bold py-2 px-6 rounded-xl transition">
              Create Listing
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
