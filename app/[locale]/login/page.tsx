'use client'

import { useState } from 'react'
import { login } from '@/app/actions/auth'
import { Link } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import { Leaf } from 'lucide-react'

export default function LoginPage() {
  const t = useTranslations('Navigation')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const formData = new FormData()
    formData.append('email', email)
    formData.append('password', password)
    
    // Server action returns error object if failed, otherwise redirects
    const result = await login(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  const handleDemoLogin = async (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail)
    setPassword(demoPass)
    setLoading(true)
    setError(null)
    const formData = new FormData()
    formData.append('email', demoEmail)
    formData.append('password', demoPass)

    const result = await login(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-orange-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-emerald-100">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-emerald-100 p-3 rounded-full mb-3">
            <Leaf className="w-8 h-8 text-emerald-700" />
          </div>
          <h2 className="text-2xl font-bold text-emerald-950">Welcome Back</h2>
          <p className="text-emerald-700 mt-1">Login to KrishiSetu</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-emerald-900 mb-1">Email</label>
            <input
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-emerald-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              placeholder="Enter your email"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-emerald-900 mb-1">Password</label>
            <input
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-emerald-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-semibold py-3 rounded-xl transition shadow-md disabled:opacity-70 flex justify-center items-center"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {/* Quick Demo Accounts */}
        <div className="mt-6 pt-5 border-t border-emerald-100">
          <p className="text-xs text-center font-medium text-emerald-800 mb-2">Or test with 1-click Demo Account:</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleDemoLogin('farmer@krishisetu.com', 'password123')}
              disabled={loading}
              className="px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition text-center disabled:opacity-50"
            >
              🌾 Farmer Demo
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('buyer@krishisetu.com', 'password123')}
              disabled={loading}
              className="px-3 py-2 text-xs font-semibold rounded-lg bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 transition text-center disabled:opacity-50"
            >
              🏢 Buyer Demo
            </button>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-emerald-700">
          Don't have an account?{' '}
          <Link href="/register" className="text-emerald-900 font-bold hover:underline">
            Register here
          </Link>
        </div>
      </div>
    </div>
  )
}
