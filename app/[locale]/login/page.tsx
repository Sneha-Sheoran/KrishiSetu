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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    
    // Server action returns error object if failed, otherwise redirects
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
