import { Link } from '@/i18n/routing'
import { createClient } from '@/utils/supabase/server'
import { Tractor, Home, LineChart, Leaf, Store, MessageCircle, User, LayoutDashboard, FileText } from 'lucide-react'

export async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null; // Don't show this navbar for unauthenticated users, they have the landing page one

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  
  const isFarmer = profile?.role === 'FARMER'
  const isBuyer = profile?.role === 'BUYER'
  const isAdmin = profile?.role === 'ADMIN'

  return (
    <nav className="bg-emerald-800 text-white shadow-md">
      {/* Desktop Top Nav */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
              <Tractor className="w-6 h-6 text-emerald-300" />
              KrishiSetu
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-1">
            {isFarmer && (
              <>
                <Link href="/dashboard" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-emerald-700 flex items-center gap-2"><LayoutDashboard className="w-4 h-4"/> Dashboard</Link>
                <Link href="/advisory" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-emerald-700 flex items-center gap-2"><Leaf className="w-4 h-4"/> Advisory</Link>
                <Link href="/records" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-emerald-700 flex items-center gap-2"><FileText className="w-4 h-4"/> Records</Link>
              </>
            )}
            
            {isBuyer && (
              <Link href="/buyer" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-emerald-700 flex items-center gap-2"><LayoutDashboard className="w-4 h-4"/> Dashboard</Link>
            )}

            {isAdmin && (
              <Link href="/admin" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-emerald-700 text-red-200">Admin Panel</Link>
            )}

            <Link href="/market" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-emerald-700 flex items-center gap-2"><LineChart className="w-4 h-4"/> Mandi Prices</Link>
            <Link href="/marketplace" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-emerald-700 flex items-center gap-2"><Store className="w-4 h-4"/> Marketplace</Link>
            <Link href="/messages" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-emerald-700 flex items-center gap-2"><MessageCircle className="w-4 h-4"/> Messages</Link>
          </div>

          <div className="flex items-center gap-3">
             <button className="relative p-2 text-emerald-100 hover:text-white transition">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
               <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-emerald-800"></span>
             </button>
             <Link href="/profile" className="p-2 bg-emerald-700 rounded-full hover:bg-emerald-600 transition">
               <User className="w-5 h-5 text-emerald-100" />
             </Link>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Nav (simulated for mobile-first) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 text-gray-500 flex justify-around items-center h-16 z-50">
         <Link href={isFarmer ? "/dashboard" : "/buyer"} className="flex flex-col items-center p-2 hover:text-emerald-700">
            <Home className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-medium">Home</span>
         </Link>
         {isFarmer && (
           <Link href="/advisory" className="flex flex-col items-center p-2 hover:text-emerald-700">
              <Leaf className="w-6 h-6 mb-1" />
              <span className="text-[10px] font-medium">Advisory</span>
           </Link>
         )}
         <Link href="/market" className="flex flex-col items-center p-2 hover:text-emerald-700">
            <LineChart className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-medium">Market</span>
         </Link>
         {isFarmer && (
           <Link href="/records" className="flex flex-col items-center p-2 hover:text-emerald-700">
              <FileText className="w-6 h-6 mb-1" />
              <span className="text-[10px] font-medium">Records</span>
           </Link>
         )}
         <Link href="/marketplace" className="flex flex-col items-center p-2 hover:text-emerald-700">
            <Store className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-medium">Marketplace</span>
         </Link>
      </div>
    </nav>
  )
}
