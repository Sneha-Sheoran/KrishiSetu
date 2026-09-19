// End-to-end verification script for KrishiSetu authentication
import http from 'http'

async function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = ''
      res.on('data', chunk => body += chunk)
      res.on('end', () => resolve({
        statusCode: res.statusCode,
        headers: res.headers,
        body
      }))
    })
    req.on('error', reject)
    if (postData) req.write(postData)
    req.end()
  })
}

async function runTests() {
  console.log('--- Starting Authentication Verification Tests ---')

  // 1. Check local db seed
  const { getLocalDb } = await import('../lib/localAuthDb.ts')
  const db = getLocalDb()
  console.log('Seed users count:', db.users.length)
  console.log('Seed users:', db.users.map(u => ({ email: u.email, role: u.role })))

  // 2. Test server client auth methods
  const { createLocalServerClient } = await import('../lib/localAuthDb.ts')
  const mockCookies = new Map()
  const mockCookieStore = {
    get: (key) => ({ value: mockCookies.get(key) }),
    set: (key, val) => mockCookies.set(key, val),
    delete: (key) => mockCookies.delete(key)
  }

  const client = createLocalServerClient(mockCookieStore)

  // Test 2a: Invalid password
  const failLogin = await client.auth.signInWithPassword({
    email: 'farmer@krishisetu.com',
    password: 'wrongpassword'
  })
  console.log('Test 2a (Invalid password error handling):', failLogin.error?.message === 'Incorrect password. Please try again.' ? 'PASSED' : 'FAILED')

  // Test 2b: Successful login as Farmer
  const farmerLogin = await client.auth.signInWithPassword({
    email: 'farmer@krishisetu.com',
    password: 'password123'
  })
  console.log('Test 2b (Farmer login success):', farmerLogin.data?.user?.email === 'farmer@krishisetu.com' ? 'PASSED' : 'FAILED')
  console.log('Session cookie set:', mockCookies.get('krishi_session'))

  // Test 2c: Get user from session
  const currentUser = await client.auth.getUser()
  console.log('Test 2c (Get current user):', currentUser.data?.user?.name === 'Ramesh Patel' ? 'PASSED' : 'FAILED')

  // Test 2d: Query farms for farmer
  const farmsRes = await client.from('farms').select('*').eq('farmer_id', currentUser.data.user.id)
  console.log('Test 2d (Query user farms):', farmsRes.data?.length > 0 ? 'PASSED' : 'FAILED')

  // Test 2e: Register a new custom user
  const newEmail = `testfarmer_${Date.now()}@example.com`
  const signupRes = await client.auth.signUp({
    email: newEmail,
    password: 'securepassword123',
    options: {
      data: {
        role: 'FARMER',
        full_name: 'Test Farmer',
        phone: '9998887776'
      }
    }
  })
  console.log('Test 2e (New user registration):', signupRes.data?.user?.email === newEmail ? 'PASSED' : 'FAILED')

  // Test 2f: Login with the newly registered user
  mockCookies.delete('krishi_session')
  const newLoginRes = await client.auth.signInWithPassword({
    email: newEmail,
    password: 'securepassword123'
  })
  console.log('Test 2f (Login with new user):', newLoginRes.data?.user?.name === 'Test Farmer' ? 'PASSED' : 'FAILED')

  // Test 2g: Successful login as Buyer
  const buyerLogin = await client.auth.signInWithPassword({
    email: 'buyer@krishisetu.com',
    password: 'password123'
  })
  console.log('Test 2g (Buyer login success):', buyerLogin.data?.user?.user_metadata?.role === 'BUYER' ? 'PASSED' : 'FAILED')

  // Test 2h: Logout
  await client.auth.signOut()
  const loggedOutUser = await client.auth.getUser()
  console.log('Test 2h (Logout clears session):', loggedOutUser.data?.user === null ? 'PASSED' : 'FAILED')

  console.log('--- All Authentication Unit Tests Completed ---')
}

runTests().catch(console.error)
