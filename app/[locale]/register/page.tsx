'use client'

import { useState } from 'react'
import { register } from '@/app/actions/auth'
import { Link } from '@/i18n/routing'
import { Leaf, Tractor, Store } from 'lucide-react'

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [role, setRole] = useState<'FARMER' | 'BUYER'>('FARMER')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    formData.append('role', role)
    
    const result = await register(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-orange-50 p-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-emerald-100">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-emerald-100 p-3 rounded-full mb-3">
            <Leaf className="w-8 h-8 text-emerald-700" />
          </div>
          <h2 className="text-2xl font-bold text-emerald-950">Join KrishiSetu</h2>
          <p className="text-emerald-700 mt-1">Create your account</p>
        </div>

        {/* Role Selection */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            type="button"
            onClick={() => setRole('FARMER')}
            className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition ${
              role === 'FARMER' 
                ? 'border-emerald-600 bg-emerald-50 text-emerald-900' 
                : 'border-gray-200 text-gray-500 hover:border-emerald-200 hover:bg-emerald-50/50'
            }`}
          >
            <Tractor className="w-6 h-6 mb-2" />
            <span className="font-semibold">Farmer</span>
          </button>
          <button
            type="button"
            onClick={() => setRole('BUYER')}
            className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition ${
              role === 'BUYER' 
                ? 'border-emerald-600 bg-emerald-50 text-emerald-900' 
                : 'border-gray-200 text-gray-500 hover:border-emerald-200 hover:bg-emerald-50/50'
            }`}
          >
            <Store className="w-6 h-6 mb-2" />
            <span className="font-semibold">Buyer</span>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-emerald-900 mb-1">Full Name</label>
            <input
              name="name"
              type="text"
              required
              className="w-full px-4 py-3 rounded-xl border border-emerald-200 focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="Enter your name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-emerald-900 mb-1">Phone Number</label>
            <input
              name="phone"
              type="tel"
              required
              className="w-full px-4 py-3 rounded-xl border border-emerald-200 focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="10-digit mobile number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-emerald-900 mb-1">Email</label>
            <input
              name="email"
              type="email"
              required
              className="w-full px-4 py-3 rounded-xl border border-emerald-200 focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="Enter your email"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-emerald-900 mb-1">Password</label>
            <input
              name="password"
              type="password"
              required
              minLength={6}
              className="w-full px-4 py-3 rounded-xl border border-emerald-200 focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="Create a password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-semibold py-3 rounded-xl transition shadow-md disabled:opacity-70 mt-2"
          >
            {loading ? 'Creating account...' : `Register as ${role === 'FARMER' ? 'Farmer' : 'Buyer'}`}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-emerald-700">
          Already have an account?{' '}
          <Link href="/login" className="text-emerald-900 font-bold hover:underline">
            Login here
          </Link>
        </div>
      </div>
    </div>
  )
}
