import { Link } from '@/i18n/routing'
import { 
  Sprout, 
  Package, 
  PlusCircle, 
  History, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Calendar,
  ChevronRight
} from 'lucide-react'
import { getCrops, getHarvests, getTransactions } from '@/app/actions/records'

export const dynamic = 'force-dynamic'

export default async function RecordsDashboardPage() {
  const [crops, harvests, transactions] = await Promise.all([
    getCrops(),
    getHarvests(),
    getTransactions()
  ])

  // Top summaries
  const totalIn = transactions
    .filter((t) => t.direction === 'IN')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)

  const totalOut = transactions
    .filter((t) => t.direction === 'OUT')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)

  const recentTransactions = transactions.slice(0, 4)
  const recentHarvests = harvests.slice(0, 4)

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-emerald-950">Farm Records</h1>
        <p className="text-emerald-700 mt-1">Manage your crops, harvests, and financial transactions.</p>
      </header>

      {/* Quick Action Buttons (2x2 on mobile, 4-across on desktop) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* 1. Add Crop */}
        <Link 
          href="/records/add-crop" 
          className="bg-emerald-700 hover:bg-emerald-600 text-white p-5 rounded-2xl flex flex-col items-center justify-center gap-2 transition shadow-sm"
        >
          <Sprout className="w-7 h-7 text-emerald-200" />
          <span className="font-bold text-base">Add Crop</span>
          <span className="text-xs text-emerald-100/80 font-normal">Record plantings</span>
        </Link>

        {/* 2. Add Harvest */}
        <Link 
          href="/records/add-harvest" 
          className="bg-white hover:bg-emerald-50/60 border-2 border-emerald-700 text-emerald-800 p-5 rounded-2xl flex flex-col items-center justify-center gap-2 transition shadow-sm"
        >
          <Package className="w-7 h-7 text-emerald-700" />
          <span className="font-bold text-base">Add Harvest</span>
          <span className="text-xs text-emerald-600 font-normal">Track crop yields</span>
        </Link>

        {/* 3. Record Transaction */}
        <Link 
          href="/records/transaction" 
          className="bg-orange-50 hover:bg-orange-100 border-2 border-orange-300 text-orange-900 p-5 rounded-2xl flex flex-col items-center justify-center gap-2 transition shadow-sm"
        >
          <PlusCircle className="w-7 h-7 text-orange-600" />
          <span className="font-bold text-base">Record Transaction</span>
          <span className="text-xs text-orange-700 font-normal">Manual entry or OCR</span>
        </Link>

        {/* 4. Past Transactions */}
        <Link 
          href="/records/transactions" 
          className="bg-white hover:bg-gray-50 border-2 border-gray-300 text-gray-800 p-5 rounded-2xl flex flex-col items-center justify-center gap-2 transition shadow-sm"
        >
          <History className="w-7 h-7 text-gray-600" />
          <span className="font-bold text-base">Past Transactions</span>
          <span className="text-xs text-gray-500 font-normal">Ledger & history</span>
        </Link>
      </div>

      {/* Main Grid: Your Crops + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Your Crops (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
            <div className="border-b p-5 bg-emerald-50/50 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-emerald-950">Your Crops</h2>
                <p className="text-emerald-700 text-xs">Currently planted and recorded crops</p>
              </div>
              <Link 
                href="/records/add-crop" 
                className="text-xs font-bold text-emerald-700 hover:text-emerald-900 hover:underline"
              >
                + Add Crop
              </Link>
            </div>
            
            <div className="p-5">
              {crops.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <Sprout className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="font-medium text-gray-700">No crops added yet.</p>
                  <p className="text-sm text-gray-400 mt-1">Add your first planted crop to track harvest and costs.</p>
                  <Link 
                    href="/records/add-crop"
                    className="inline-block mt-4 text-xs font-bold bg-emerald-700 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl transition"
                  >
                    Add Crop
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {crops.map((crop) => (
                    <div 
                      key={crop.id} 
                      className="flex justify-between items-center p-4 rounded-xl border border-emerald-100 hover:border-emerald-300 transition bg-emerald-50/20"
                    >
                      <div>
                        <h3 className="font-bold text-emerald-950 text-base">
                          {crop.crop_name} {crop.variety && <span className="text-sm font-normal text-gray-500">({crop.variety})</span>}
                        </h3>
                        <p className="text-emerald-700 text-xs mt-1">
                          Sown: {crop.sowing_date || 'N/A'} {crop.area ? `• Area: ${crop.area} Acres` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          crop.status === 'PLANTED' ? 'bg-blue-100 text-blue-800' :
                          crop.status === 'HARVESTED' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {crop.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Harvests */}
          <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
            <div className="border-b p-5 bg-emerald-50/50 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-emerald-950">Recent Harvests</h2>
                <p className="text-emerald-700 text-xs">Logged yields and outputs</p>
              </div>
              <Link 
                href="/records/add-harvest" 
                className="text-xs font-bold text-emerald-700 hover:text-emerald-900 hover:underline"
              >
                + Add Harvest
              </Link>
            </div>

            <div className="p-5">
              {recentHarvests.length === 0 ? (
                <p className="text-center py-6 text-gray-400 text-sm">
                  No harvest records logged yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {recentHarvests.map((h) => (
                    <div 
                      key={h.id}
                      className="flex justify-between items-center p-3.5 rounded-xl border border-gray-100 hover:bg-gray-50/60 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                          <Package className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{h.crop_name}</p>
                          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3" /> {h.harvest_date}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-emerald-900 text-sm block">
                          {h.quantity} {h.unit}
                        </span>
                        {h.quality_grade && (
                          <span className="text-[10px] text-gray-400 uppercase">{h.quality_grade}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Financial Summary & Recent Transactions (1 col) */}
        <div className="space-y-6">
          {/* Quick Cash Flow Card */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-emerald-100">
            <h3 className="font-bold text-emerald-950 mb-3 text-base">Cash Flow Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 rounded-xl bg-emerald-50/60">
                <div className="flex items-center gap-2">
                  <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-semibold text-emerald-900">Total Money In</span>
                </div>
                <span className="font-bold text-emerald-700 text-sm">
                  + ₹{totalIn.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 rounded-xl bg-rose-50/60">
                <div className="flex items-center gap-2">
                  <ArrowUpRight className="w-4 h-4 text-rose-600" />
                  <span className="text-xs font-semibold text-rose-900">Total Money Out</span>
                </div>
                <span className="font-bold text-rose-600 text-sm">
                  - ₹{totalOut.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <Link
              href="/records/transactions"
              className="mt-4 w-full block text-center py-2.5 rounded-xl border border-emerald-200 text-emerald-800 hover:bg-emerald-50 font-bold text-xs transition"
            >
              View Full Ledger &rarr;
            </Link>
          </div>

          {/* Recent Transactions List */}
          <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
            <div className="border-b p-4 bg-emerald-50/50 flex justify-between items-center">
              <h3 className="font-bold text-emerald-950 text-sm">Recent Transactions</h3>
              <Link
                href="/records/transactions"
                className="text-xs text-emerald-700 hover:underline flex items-center gap-0.5"
              >
                All <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="p-4">
              {recentTransactions.length === 0 ? (
                <p className="text-center py-6 text-gray-400 text-xs">
                  No transactions recorded yet.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {recentTransactions.map((tx) => (
                    <div 
                      key={tx.id}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-gray-100 hover:bg-gray-50 transition"
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden pr-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          tx.direction === 'IN' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                          {tx.direction === 'IN' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                        </div>
                        <div className="truncate">
                          <p className="font-bold text-gray-900 text-xs truncate">{tx.category}</p>
                          <p className="text-[10px] text-gray-400">{tx.transaction_date}</p>
                        </div>
                      </div>
                      <span className={`font-extrabold text-xs whitespace-nowrap ${
                        tx.direction === 'IN' ? 'text-emerald-700' : 'text-rose-600'
                      }`}>
                        {tx.direction === 'IN' ? '+' : '-'} ₹{Number(tx.amount).toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
