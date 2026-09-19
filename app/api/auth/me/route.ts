import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.getUser()
    if (error || !data.user) {
      return NextResponse.json({ user: null })
    }
    return NextResponse.json({ user: data.user })
  } catch (err: any) {
    return NextResponse.json({ user: null, error: err.message }, { status: 500 })
  }
}
