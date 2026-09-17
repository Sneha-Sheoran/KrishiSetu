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

  let userToInsert = null;
  let authError = null;
  
  let adminClient = null;
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const { createClient: createAdminClient } = await import('@supabase/supabase-js');
    adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
  }

  // 1. Try to use Admin API if service role key is available (Bypasses all email rate limits)
  if (adminClient) {
    const { data, error } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role, full_name: name }
    });
    
    authError = error;
    userToInsert = data.user;
    
    // If created via admin, we must sign them in on the client side
    if (!error) {
       await supabase.auth.signInWithPassword({ email, password });
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
        }
      }
    })
    authError = error;
    userToInsert = data.user;
  }

  if (authError) {
    return { error: authError.message }
  }

  // Insert into public.users
  if (userToInsert) {
    // Use adminClient to insert, which bypasses RLS policies (since we don't have an insert policy on users table)
    const dbClient = adminClient ? adminClient : supabase;
    const { error: insertError } = await dbClient.from('users').insert({
      id: userToInsert.id,
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
