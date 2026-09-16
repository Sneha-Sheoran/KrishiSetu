'use client'

import { useState, useEffect } from 'react'
import { CloudRain, Thermometer, Droplets, Wind, AlertTriangle, TrendingUp, CheckCircle, Info } from 'lucide-react'
import { Link } from '@/i18n/routing'

export default function AdvisoryPage() {
  const [weather, setWeather] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAdvisoryData = async () => {
      try {
        const res = await fetch('/api/advisory/weather?lat=19.07&lon=72.87')
        const json = await res.json()
        if (json.status === 'SUCCESS') {
          setWeather(json.data)
        } else {
          setError(json.message)
        }
      } catch (err) {
        setError('Failed to load advisory data. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchAdvisoryData()
  }, [])

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-emerald-950">Crop & Weather Advisory</h1>
        <p className="text-emerald-700 mt-1">Personalized intelligence based on your farm data.</p>
      </header>

      {loading && (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-700"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 flex items-center gap-3">
          <AlertTriangle className="w-6 h-6" />
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && weather && (
        <div className="grid md:grid-cols-3 gap-6">
          {/* Weather Panel */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-6 text-white shadow-md">
              <h3 className="font-bold text-blue-100 flex items-center gap-2 mb-4">
                <CloudRain className="w-5 h-5" /> Current Weather
              </h3>
              <div className="flex justify-between items-end mb-6">
                <div>
                  <div className="text-5xl font-bold">{weather.current.temp}°C</div>
                  <div className="text-blue-100 text-lg mt-1">{weather.current.condition}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 border-t border-blue-400/50 pt-4">
                <div className="flex flex-col">
                  <span className="text-blue-200 text-sm flex items-center gap-1"><Droplets className="w-4 h-4"/> Humidity</span>
                  <span className="font-semibold">{weather.current.humidity}%</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-blue-200 text-sm flex items-center gap-1"><Wind className="w-4 h-4"/> Wind</span>
                  <span className="font-semibold">{weather.current.wind_speed} km/h</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm">
              <h3 className="font-bold text-emerald-900 mb-4">Irrigation Advisory</h3>
              <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl">
                <p className="text-orange-900 font-semibold mb-1">Delay Irrigation</p>
                <p className="text-orange-800 text-sm mb-2">High probability of rain ({weather.forecast[0].rain_prob}%) tomorrow.</p>
                <div className="flex items-center gap-1 text-xs text-orange-600 font-medium">
                  <Info className="w-4 h-4" /> Based on IMD Forecast
                </div>
              </div>
            </div>
          </div>

          {/* Crop Recommendation Panel */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-emerald-900">Crop Recommendation Engine</h3>
                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" /> Analyzed for Rabi Season
                </span>
              </div>
              
              <div className="border border-emerald-200 rounded-xl overflow-hidden">
                <div className="bg-emerald-50 p-4 border-b border-emerald-200 flex justify-between items-center">
                  <div>
                    <h4 className="text-xl font-bold text-emerald-950">Tomato (Hybrid)</h4>
                    <p className="text-emerald-700 text-sm">High Suitability (88%)</p>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-emerald-200 text-center shadow-sm">
                    <span className="block text-xs font-bold text-emerald-600 uppercase">Decision Signal</span>
                    <span className="block text-emerald-900 font-extrabold text-lg">FAVORABLE</span>
                  </div>
                </div>
                
                <div className="p-4 grid md:grid-cols-2 gap-4 bg-white">
                  <div>
                    <h5 className="font-semibold text-emerald-900 mb-2 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500" /> Supporting Factors
                    </h5>
                    <ul className="text-sm text-gray-600 space-y-2 ml-6 list-disc marker:text-emerald-500">
                      <li>Soil pH (6.5) is highly optimal.</li>
                      <li>Temperature forecast matches crop requirements.</li>
                      <li>Market demand trend is historically high next quarter.</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-orange-500" /> Potential Risks
                    </h5>
                    <ul className="text-sm text-gray-600 space-y-2 ml-6 list-disc marker:text-orange-500">
                      <li>Requires consistent drip irrigation.</li>
                      <li>Moderate risk of early blight in current humidity.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm">
              <h3 className="text-xl font-bold text-emerald-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" /> Price Advisory Signal
              </h3>
              <p className="text-gray-600 mb-4">Based on current Agmarknet arrivals and historical trends for your region.</p>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="border border-gray-200 rounded-xl p-4 text-center hover:bg-gray-50 transition cursor-pointer">
                  <span className="block text-gray-500 text-sm font-semibold uppercase mb-1">Sell Now</span>
                  <span className="block text-gray-400 text-xs">If perishable</span>
                </div>
                <div className="border-2 border-emerald-500 bg-emerald-50 rounded-xl p-4 text-center relative shadow-sm">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">Recommended</div>
                  <span className="block text-emerald-900 text-sm font-bold uppercase mb-1 mt-1">Monitor</span>
                  <span className="block text-emerald-700 text-xs">Prices trending up</span>
                </div>
                <div className="border border-gray-200 rounded-xl p-4 text-center hover:bg-gray-50 transition cursor-pointer">
                  <span className="block text-gray-500 text-sm font-semibold uppercase mb-1">Review</span>
                  <span className="block text-gray-400 text-xs">Wait 7 days</span>
                </div>
              </div>
              
              <div className="mt-6 text-center">
                <Link href="/market" className="text-emerald-700 font-semibold hover:underline">View detailed market prices & charts &rarr;</Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
