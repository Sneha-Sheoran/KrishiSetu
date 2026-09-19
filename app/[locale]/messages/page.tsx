import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Link } from '@/i18n/routing'
import { MessageCircle, ArrowRight } from 'lucide-react'

export default async function MessagesInboxPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  
  // Fetch conversations where user is either farmer or buyer
  const columnToMatch = profile?.role === 'BUYER' ? 'buyer_id' : 'farmer_id'
  
  const { data: conversations } = await supabase
    .from('conversations')
    .select('*, marketplace_listings(crop_name, quantity, expected_price, unit)')
    .eq(columnToMatch, user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <header className="mb-8 border-b border-emerald-100 pb-4">
        <h1 className="text-3xl font-bold text-emerald-950">Messages</h1>
        <p className="text-emerald-700 mt-1">Manage your active negotiations.</p>
      </header>

      <div className="space-y-4">
        {conversations && conversations.length > 0 ? (
          conversations.map((conv: any) => (
            <Link key={conv.id} href={`/messages/${conv.id}`} className="block bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm hover:border-emerald-300 transition group">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="bg-emerald-100 p-3 rounded-full text-emerald-700">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-emerald-950">
                      Negotiation: {conv.marketplace_listings?.crop_name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {conv.marketplace_listings?.quantity} {conv.marketplace_listings?.unit} @ ₹{conv.marketplace_listings?.expected_price}
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-emerald-300 group-hover:text-emerald-600 transition" />
              </div>
            </Link>
          ))
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
            <MessageCircle className="w-16 h-16 text-emerald-200 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-emerald-800">No active messages</h3>
            <p className="text-emerald-600 mt-2">Enquiries on your listings will appear here.</p>
          </div>
        )}
      </div>
    </div>
  )
}
