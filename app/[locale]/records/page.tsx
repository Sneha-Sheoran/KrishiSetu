'use client'

import { useState, useEffect } from 'react'
import { useRecordsStore } from '@/lib/store/useRecordsStore'
import { Link } from '@/i18n/routing'
import { Plus, Camera, Sprout, TrendingDown, Package, Clock, CheckCircle2, AlertCircle } from 'lucide-react'

export default function RecordsDashboardPage() {
  const [isMounted, setIsMounted] = useState(false)
  const { crops } = useRecordsStore()
  
  // Hydration fix for Zustand persist
  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) return null

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-emerald-950">Farm Records</h1>
          <p className="text-emerald-700 mt-1">Manage your crops, expenses, and harvests securely.</p>
        </div>
      </header>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Link href="/records/add-crop" className="bg-emerald-700 hover:bg-emerald-600 text-white p-4 rounded-xl flex flex-col items-center justify-center gap-2 transition shadow-sm">
          <Sprout className="w-6 h-6" />
          <span className="font-semibold">Add Crop</span>
        </Link>
        <Link href="/records/add-expense" className="bg-white hover:bg-emerald-50 border-2 border-emerald-700 text-emerald-800 p-4 rounded-xl flex flex-col items-center justify-center gap-2 transition shadow-sm">
          <TrendingDown className="w-6 h-6" />
          <span className="font-semibold">Add Expense</span>
        </Link>
        <Link href="/records/add-harvest" className="bg-white hover:bg-emerald-50 border-2 border-emerald-700 text-emerald-800 p-4 rounded-xl flex flex-col items-center justify-center gap-2 transition shadow-sm">
          <Package className="w-6 h-6" />
          <span className="font-semibold">Add Harvest</span>
        </Link>
        <Link href="/records/receipts/upload" className="bg-orange-100 hover:bg-orange-200 border-2 border-orange-300 text-orange-900 p-4 rounded-xl flex flex-col items-center justify-center gap-2 transition shadow-sm">
          <Camera className="w-6 h-6 text-orange-600" />
          <span className="font-semibold">Upload Receipt</span>
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
        <div className="border-b p-6 bg-emerald-50/50">
          <h2 className="text-xl font-bold text-emerald-900">Your Crops</h2>
        </div>
        
        <div className="p-6">
          {crops.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Sprout className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p>No crops added yet. Add your first crop to start tracking.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {crops.map((crop) => (
                <div key={crop.local_id} className="flex justify-between items-center p-4 rounded-xl border border-emerald-100 hover:border-emerald-300 transition bg-emerald-50/30">
                  <div>
                    <h3 className="font-bold text-emerald-900 text-lg">{crop.crop_name} <span className="text-sm font-normal text-gray-500">({crop.variety})</span></h3>
                    <p className="text-emerald-700 text-sm mt-1">Sown: {crop.sowing_date} • Area: {crop.area}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      crop.status === 'PLANTED' ? 'bg-blue-100 text-blue-800' :
                      crop.status === 'HARVESTED' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {crop.status}
                    </span>
                    
                    {/* Sync Status Badge */}
                    {crop.sync_status === 'SYNCED' ? (
                      <div className="flex items-center gap-1 text-emerald-600 text-xs font-medium" title="Saved to cloud">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="hidden md:inline">Synced</span>
                      </div>
                    ) : crop.sync_status === 'PENDING' ? (
                      <div className="flex items-center gap-1 text-orange-500 text-xs font-medium" title="Saved offline, waiting to sync">
                        <Clock className="w-4 h-4" />
                        <span className="hidden md:inline">Offline</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-red-500 text-xs font-medium" title="Sync failed">
                        <AlertCircle className="w-4 h-4" />
                        <span className="hidden md:inline">Failed</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
