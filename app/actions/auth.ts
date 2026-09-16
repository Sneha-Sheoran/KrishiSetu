'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  // Check role and redirect appropriately
  // For MVP, we can redirect to a common check page or dashboard
  redirect('/dashboard')
}

export async function register(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const role = formData.get('role') as string
  const name = formData.get('name') as string
  const phone = formData.get('phone') as string

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role,
        full_name: name,
      }
    }
  })

  if (error) {
    return { error: error.message }
  }

  // Insert into public.users
  if (data.user) {
    const { error: insertError } = await supabase.from('users').insert({
      id: data.user.id,
      role: role,
      name: name,
      phone: phone,
      email: email,
    })
    
    if (insertError) {
       console.error("Error creating user profile", insertError)
       return { error: "Failed to create user profile" }
    }
  }

  redirect('/dashboard')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
