import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createLocalServerClient } from '@/lib/localAuthDb'

function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return !!(
    url &&
    key &&
    url.trim() !== '' &&
    key.trim() !== '' &&
    !url.includes('placeholder') &&
    !url.includes('dummy') &&
    url.startsWith('http')
  )
}

export async function createClient(): Promise<any> {
  const cookieStore = await cookies()

  if (!isSupabaseConfigured()) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Supabase is not configured. Local DB shim is disabled in production.')
    }
    return createLocalServerClient(cookieStore)
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignored when called from Server Component
          }
        },
      },
    }
  )
}
