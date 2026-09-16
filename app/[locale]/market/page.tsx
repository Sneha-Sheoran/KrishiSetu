'use client'

import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Store, TrendingUp, AlertCircle, Info } from 'lucide-react'

// Dummy historical data for chart
const chartData = [
  { name: '10 Sep', price: 1100 },
  { name: '11 Sep', price: 1150 },
  { name: '12 Sep', price: 1120 },
  { name: '13 Sep', price: 1200 },
  { name: '14 Sep', price: 1250 },
  { name: '15 Sep', price: 1200 },
  { name: '16 Sep', price: 1300 },
]

export default function MarketPage() {
  const [marketData, setMarketData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLive, setIsLive] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const res = await fetch('/api/advisory/market')
        const json = await res.json()
        if (json.status === 'SUCCESS') {
          setMarketData(json.data)
          setIsLive(json.isLive)
          setLastUpdated(json.last_updated)
        } else {
          setError(json.message)
        }
      } catch (err) {
        setError('Market data temporarily unavailable.')
      } finally {
        setLoading(false)
      }
    }

    fetchMarketData()
  }, [])

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-emerald-950">Live Mandi Prices</h1>
          <p className="text-emerald-700 mt-1">Track agricultural market prices across your region.</p>
        </div>
        
        {!loading && !error && (
          <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-emerald-100 flex items-center gap-2 text-sm">
            <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500' : 'bg-orange-500 animate-pulse'}`}></span>
            <span className="text-gray-600">
              {isLive ? 'Live Data (Agmarknet)' : `Showing last successfully updated data`}
            </span>
            {lastUpdated && <span className="text-gray-400 ml-2">from {new Date(lastUpdated).toLocaleTimeString()}</span>}
          </div>
        )}
      </header>

      {loading && (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-700"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-200 flex flex-col items-center justify-center text-center gap-3">
          <AlertCircle className="w-10 h-10 text-red-500 mb-2" />
          <h3 className="text-xl font-bold">Market Data Unavailable</h3>
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-6">
          {/* Filters - Static for MVP */}
          <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm flex flex-wrap gap-4 items-center">
            <span className="text-emerald-900 font-bold mr-2">Filters:</span>
            <select className="border-gray-200 rounded-lg p-2 text-sm bg-emerald-50 outline-none">
              <option>State: Maharashtra</option>
            </select>
            <select className="border-gray-200 rounded-lg p-2 text-sm bg-emerald-50 outline-none">
              <option>Crop: Tomato</option>
            </select>
            <select className="border-gray-200 rounded-lg p-2 text-sm bg-emerald-50 outline-none">
              <option>Variety: All</option>
            </select>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-emerald-50 text-emerald-900 border-b border-emerald-100">
                      <th className="p-4 font-bold">Mandi / Market</th>
                      <th className="p-4 font-bold">Variety</th>
                      <th className="p-4 font-bold">Min (₹/q)</th>
                      <th className="p-4 font-bold">Max (₹/q)</th>
                      <th className="p-4 font-bold">Modal (₹/q)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {marketData.map((item, idx) => (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-emerald-50/50 transition">
                        <td className="p-4 flex items-center gap-3">
                          <Store className="w-5 h-5 text-emerald-600" />
                          <div>
                            <p className="font-bold text-emerald-950">{item.market}</p>
                            <p className="text-xs text-gray-500">{item.district}, {item.state}</p>
                          </div>
                        </td>
                        <td className="p-4 text-gray-700">{item.variety}</td>
                        <td className="p-4 text-gray-600">{item.min_price}</td>
                        <td className="p-4 text-gray-600">{item.max_price}</td>
                        <td className="p-4 font-bold text-emerald-800">{item.modal_price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6">
                <h3 className="font-bold text-emerald-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" /> 7-Day Price Trend
                </h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                      <YAxis domain={['dataMin - 100', 'dataMax + 100']} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dx={-10} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ color: '#047857', fontWeight: 'bold' }}
                      />
                      <Line type="monotone" dataKey="price" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 flex items-start gap-2 bg-blue-50 text-blue-800 p-3 rounded-lg text-sm">
                  <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p>Modal prices for Tomato (Desi) have increased by 18% over the last week in APMC Vashi.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
