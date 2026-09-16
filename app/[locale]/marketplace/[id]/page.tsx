import { createClient } from '@/utils/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { MapPin, Calendar, CheckCircle2, MessageCircle, AlertTriangle } from 'lucide-react'

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  
  // Get current user to check role
  const { data: { user } } = await supabase.auth.getUser()
  const isBuyer = user ? (await supabase.from('users').select('role').eq('id', user.id).single()).data?.role === 'BUYER' : false

  const { data: listing } = await supabase
    .from('marketplace_listings')
    .select('*, users(name, verification_status)')
    .eq('id', id)
    .single()

  if (!listing) {
    notFound()
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="bg-white rounded-3xl shadow-sm border border-emerald-100 overflow-hidden">
        {/* Header / Hero */}
        <div className="bg-emerald-800 p-8 text-white relative">
          <div className="absolute top-4 right-4 bg-emerald-700 px-3 py-1 rounded-full text-sm font-bold border border-emerald-600">
            {listing.status}
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold mb-2">{listing.crop_name} {listing.variety && <span className="font-medium text-emerald-300 text-2xl">({listing.variety})</span>}</h1>
          <p className="text-emerald-100 text-lg flex items-center gap-2 mt-4">
            <MapPin className="w-5 h-5" /> {listing.location_text}
          </p>
        </div>

        {/* Content */}
        <div className="p-8 grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                <span className="text-emerald-700 text-sm font-bold block mb-1">Available Quantity</span>
                <span className="text-2xl font-black text-emerald-950">{listing.quantity} {listing.unit}</span>
              </div>
              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                <span className="text-emerald-700 text-sm font-bold block mb-1">Expected Rate</span>
                <span className="text-2xl font-black text-emerald-950">₹{listing.expected_price} <span className="text-base font-normal">/{listing.unit}</span></span>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-emerald-900 mb-4 border-b pb-2">Produce Details</h3>
              <ul className="space-y-4">
                <li className="flex gap-4">
                  <div className="w-1/3 text-gray-500">Quality Grade</div>
                  <div className="font-semibold text-gray-900">{listing.quality_grade || 'Standard'}</div>
                </li>
                <li className="flex gap-4">
                  <div className="w-1/3 text-gray-500">Harvest Date</div>
                  <div className="font-semibold text-gray-900 flex items-center gap-2">
                    {listing.harvest_date}
                  </div>
                </li>
                {listing.description && (
                  <li className="flex gap-4">
                    <div className="w-1/3 text-gray-500">Description</div>
                    <div className="font-semibold text-gray-900">{listing.description}</div>
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-4">Seller Information</h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-emerald-200 flex items-center justify-center text-emerald-800 font-bold text-xl">
                  {(listing.users?.name || 'F')[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-gray-900">{listing.users?.name}</p>
                  {listing.users?.verification_status === 'VERIFIED' && (
                    <span className="text-blue-600 text-xs font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Verified Farmer
                    </span>
                  )}
                </div>
              </div>
            </div>

            {user?.id !== listing.farmer_id && (
              <div className="bg-orange-50 rounded-2xl p-6 border border-orange-200">
                {isBuyer ? (
                  <>
                    <h3 className="font-bold text-orange-900 mb-2">Interested?</h3>
                    <p className="text-sm text-orange-800 mb-4">Send an enquiry directly to the farmer to start negotiation.</p>
                    <form action={async () => {
                      'use server'
                      const { sendEnquiry } = await import('@/app/actions/marketplace')
                      await sendEnquiry(listing.id, listing.farmer_id)
                    }}>
                      <button type="submit" className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition shadow-md">
                        <MessageCircle className="w-5 h-5" />
                        Send Enquiry
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                     <div className="flex items-start gap-2 text-orange-800 text-sm">
                        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                        <p>You must be registered as a <strong>BUYER</strong> to send enquiries and negotiate with farmers.</p>
                     </div>
                  </>
                )}
              </div>
            )}
            
            {user?.id === listing.farmer_id && (
              <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-200 text-center">
                <p className="text-emerald-800 font-medium mb-3">This is your listing.</p>
                <button className="text-emerald-700 font-bold underline">Edit Details</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
