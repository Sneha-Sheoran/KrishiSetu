'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const email = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string
  
  if (!email || !password) {
    return { error: 'Please enter both email and password.' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  // Check role and redirect appropriately
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role === 'BUYER') {
      redirect('/buyer')
    }
  }

  redirect('/dashboard')
}

export async function register(formData: FormData) {
  const email = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string
  const role = (formData.get('role') as string) || 'FARMER'
  const name = formData.get('name') as string
  const phone = formData.get('phone') as string

  if (!email || !password) {
    return { error: 'Please fill in all required fields.' }
  }

  const supabase = await createClient()

  let userToInsert: any = null
  let authError: any = null
  
  let adminClient: any = null
  if (
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')
  ) {
    try {
      const { createClient: createAdminClient } = await import('@supabase/supabase-js')
      adminClient = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        { auth: { autoRefreshToken: false, persistSession: false } }
      )
    } catch (e) {
      console.warn('Could not initialize admin Supabase client', e)
    }
  }

  // 1. Try to use Admin API if service role key is available
  if (adminClient) {
    const { data, error } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role, full_name: name, name, phone }
    })
    
    authError = error
    userToInsert = data?.user
    
    if (!error) {
      await supabase.auth.signInWithPassword({ email, password })
    }
  } else {
    // 2. Fallback to normal signup
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role,
          full_name: name,
          name,
          phone,
        }
      }
    })
    authError = error
    userToInsert = data?.user

    if (!authError && email && password) {
      await supabase.auth.signInWithPassword({ email, password })
    }
  }

  if (authError) {
    return { error: authError.message }
  }

  // Insert into public.users
  if (userToInsert) {
    const dbClient = adminClient ? adminClient : supabase
    try {
      await dbClient.from('users').insert({
        id: userToInsert.id,
        role: role,
        name: name,
        phone: phone,
        email: email,
      })
    } catch (insertError) {
      console.error('Error creating user profile in table:', insertError)
    }
  }

  if (role === 'BUYER') {
    redirect('/buyer')
  }

  redirect('/dashboard')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
