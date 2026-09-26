import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const BASE_URL = 'http://localhost:3000'
const FARMER_ID = 'd1e1f1a1-0001-4000-8000-000000000001'
const BUYER_ID = 'd1e1f1a1-0002-4000-8000-000000000002'
const LISTING_CONV_ID = 'e048f2f6-47ce-4fab-a2b6-15fde082de58'
const REQ_CONV_ID = 'e39ea131-6ab3-41f5-9dec-272c91ecce7b'

const farmerHeaders = { 'Cookie': `krishi_session=${FARMER_ID}` }
const buyerHeaders = { 'Cookie': `krishi_session=${BUYER_ID}` }

async function run() {
  console.log('===============================================================')
  console.log('VERIFICATION: UNREAD NOTIFICATION DOT & CROP TITLES')
  console.log('===============================================================\n')

  const dbPath = path.resolve('data/local_db.json')
  const localDb = JSON.parse(fs.readFileSync(dbPath, 'utf8'))

  // -------------------------------------------------------------------------
  // 1. VERIFY CROP TITLES IN CONVERSATION INBOX (/messages)
  // -------------------------------------------------------------------------
  console.log('--- 1. CROP NAMES & VARIETIES IN INBOX (/messages) ---')

  // English Inbox
  const enRes = await fetch(`${BASE_URL}/en/messages`, { headers: farmerHeaders })
  const enHtml = await enRes.text()
  console.log(`[EN Inbox] Status: ${enRes.status}`)

  const enHasWheat = enHtml.includes('Wheat')
  const enHasVariety = enHtml.includes('Sharbati A-Grade')
  const enHasProduceListing = enHtml.includes('>Produce Listing<')

  console.log(`  - Shows 'Wheat': ${enHasWheat}`)
  console.log(`  - Shows variety '(Sharbati A-Grade)': ${enHasVariety}`)
  console.log(`  - Contains generic '>Produce Listing<': ${enHasProduceListing} (should be false)`)

  if (!enHasWheat || !enHasVariety || enHasProduceListing) {
    throw new Error('English inbox failed crop title check!')
  }

  // Hindi Inbox
  const hiRes = await fetch(`${BASE_URL}/hi/messages`, { headers: farmerHeaders })
  const hiHtml = await hiRes.text()
  console.log(`[HI Inbox] Status: ${hiRes.status}`)

  const hiHasGehun = hiHtml.includes('गेहूं')
  const hiHasProduceListing = hiHtml.includes('>उत्पाद लिस्टिंग<')
  console.log(`  - Shows 'गेहूं': ${hiHasGehun}`)
  console.log(`  - Contains generic '>उत्पाद लिस्टिंग<': ${hiHasProduceListing} (should be false)`)

  if (!hiHasGehun || hiHasProduceListing) {
    throw new Error('Hindi inbox failed crop title check!')
  }

  // Buyer Requirements conversation check
  const buyerReqRes = await fetch(`${BASE_URL}/en/messages`, { headers: buyerHeaders })
  const buyerReqHtml = await buyerReqRes.text()
  const hasMustard = buyerReqHtml.includes('Mustard')
  const hasBuyerReqBadge = buyerReqHtml.includes('BUYER REQUEST') || buyerReqHtml.includes('Buyer request')
  console.log(`  - Requirement-backed shows 'Mustard': ${hasMustard}`)
  console.log(`  - Requirement-backed shows 'BUYER REQUEST' badge: ${hasBuyerReqBadge}`)

  if (!hasMustard || !hasBuyerReqBadge) {
    throw new Error('Requirement-backed conversation failed title/badge check!')
  }

  console.log('>>> Inbox Crop Titles PASS!\n')

  // -------------------------------------------------------------------------
  // 2. VERIFY CHAT ROOM HEADERS (/messages/[id])
  // -------------------------------------------------------------------------
  console.log('--- 2. CHAT ROOM HEADERS (/messages/[id]) ---')
  const convResEn = await fetch(`${BASE_URL}/en/messages/${LISTING_CONV_ID}`, { headers: farmerHeaders })
  const convHtmlEn = await convResEn.text()
  console.log(`[EN Chat Room] Status: ${convResEn.status}`)

  // -------------------------------------------------------------------------
  // 3. UNREAD NOTIFICATION DOT VERIFICATION
  // -------------------------------------------------------------------------
  console.log('\n--- 3. UNREAD NOTIFICATION DOT LIFECYCLE ---')

  // Clean initial state: mark all existing messages in db as read
  const currentDb = JSON.parse(fs.readFileSync(dbPath, 'utf8'))
  const now = new Date().toISOString()
  currentDb.messages = currentDb.messages.map(m => ({ ...m, read_at: m.read_at || now }))
  fs.writeFileSync(dbPath, JSON.stringify(currentDb, null, 2))

  // 3a. Baseline: verify neither farmer nor buyer has unread dot (nav & inbox row)
  console.log('3a. Baseline check (all messages read):')
  const baseFarmerRes = await fetch(`${BASE_URL}/en/dashboard`, { headers: farmerHeaders })
  const baseFarmerHtml = await baseFarmerRes.text()
  const baseFarmerHasDot = baseFarmerHtml.includes('data-testid="unread-dot-desktop"')
  console.log(`  - Farmer nav has unread dot: ${baseFarmerHasDot} (expected: false)`)

  const baseFarmerInboxRes = await fetch(`${BASE_URL}/en/messages`, { headers: farmerHeaders })
  const baseFarmerInboxHtml = await baseFarmerInboxRes.text()
  const baseFarmerRowHasDot = baseFarmerInboxHtml.includes(`data-testid="unread-dot-conv-${LISTING_CONV_ID}"`)
  console.log(`  - Farmer inbox row [${LISTING_CONV_ID}] has unread dot: ${baseFarmerRowHasDot} (expected: false)`)

  const baseBuyerRes = await fetch(`${BASE_URL}/en/buyer`, { headers: buyerHeaders })
  const baseBuyerHtml = await baseBuyerRes.text()
  const baseBuyerHasDot = baseBuyerHtml.includes('data-testid="unread-dot-desktop"')
  console.log(`  - Buyer nav has unread dot: ${baseBuyerHasDot} (expected: false)`)

  const baseBuyerInboxRes = await fetch(`${BASE_URL}/en/messages`, { headers: buyerHeaders })
  const baseBuyerInboxHtml = await baseBuyerInboxRes.text()
  const baseBuyerRowHasDot = baseBuyerInboxHtml.includes(`data-testid="unread-dot-conv-${LISTING_CONV_ID}"`)
  console.log(`  - Buyer inbox row [${LISTING_CONV_ID}] has unread dot: ${baseBuyerRowHasDot} (expected: false)`)

  if (baseFarmerHasDot || baseFarmerRowHasDot || baseBuyerHasDot || baseBuyerRowHasDot) {
    throw new Error('Baseline failed: unexpected unread dot found on clean state!')
  }

  // 3b. Buyer sends message to Farmer
  console.log('\n3b. Buyer sends message to Farmer:')
  const msgFromBuyer = {
    id: 'test-msg-b2f-' + Date.now(),
    conversation_id: LISTING_CONV_ID,
    sender_id: BUYER_ID,
    message: 'Hello farmer! Is the Wheat available?',
    created_at: new Date().toISOString(),
    read_at: null
  }
  const dbWithBuyerMsg = JSON.parse(fs.readFileSync(dbPath, 'utf8'))
  dbWithBuyerMsg.messages.push(msgFromBuyer)
  fs.writeFileSync(dbPath, JSON.stringify(dbWithBuyerMsg, null, 2))
  console.log(`  - Inserted unread message from buyer (${msgFromBuyer.id})`)

  // Check Farmer nav (should have dot)
  const farmerWithMsgRes = await fetch(`${BASE_URL}/en/dashboard`, { headers: farmerHeaders })
  const farmerWithMsgHtml = await farmerWithMsgRes.text()
  const farmerHasDot = farmerWithMsgHtml.includes('data-testid="unread-dot-desktop"')
  console.log(`  - Farmer nav has unread dot: ${farmerHasDot} (expected: true)`)

  // Check Farmer inbox row (target conversation should have unread dot, other rows should NOT)
  const farmerInboxRes = await fetch(`${BASE_URL}/en/messages`, { headers: farmerHeaders })
  const farmerInboxHtml = await farmerInboxRes.text()
  const farmerRowHasDot = farmerInboxHtml.includes(`data-testid="unread-dot-conv-${LISTING_CONV_ID}"`)
  const farmerOtherRowHasDot = farmerInboxHtml.includes(`data-testid="unread-dot-conv-${REQ_CONV_ID}"`)
  console.log(`  - Farmer inbox row [${LISTING_CONV_ID}] has unread dot: ${farmerRowHasDot} (expected: true)`)
  console.log(`  - Farmer other row [${REQ_CONV_ID}] has unread dot: ${farmerOtherRowHasDot} (expected: false)`)

  // Check Buyer nav & inbox row (sender, should NOT have dot)
  const buyerSenderRes = await fetch(`${BASE_URL}/en/buyer`, { headers: buyerHeaders })
  const buyerSenderHtml = await buyerSenderRes.text()
  const buyerSenderHasDot = buyerSenderHtml.includes('data-testid="unread-dot-desktop"')
  console.log(`  - Buyer nav (sender) has unread dot: ${buyerSenderHasDot} (expected: false)`)

  const buyerInboxRes = await fetch(`${BASE_URL}/en/messages`, { headers: buyerHeaders })
  const buyerInboxHtml = await buyerInboxRes.text()
  const buyerSenderRowHasDot = buyerInboxHtml.includes(`data-testid="unread-dot-conv-${LISTING_CONV_ID}"`)
  console.log(`  - Buyer inbox row (sender) has unread dot: ${buyerSenderRowHasDot} (expected: false)`)

  if (!farmerHasDot || !farmerRowHasDot || farmerOtherRowHasDot || buyerSenderHasDot || buyerSenderRowHasDot) {
    throw new Error('Step 3b failed: unread dot did not appear correctly for recipient inbox row or leaked to sender!')
  }

  // 3c. Farmer opens conversation -> marks read
  console.log('\n3c. Farmer opens conversation (marks read):')
  // Simulating conversation open by calling markConversationMessagesAsRead logic
  const { markConversationMessagesAsRead } = await import('../lib/messages.ts')
  const { createLocalServerClient } = await import('../lib/localAuthDb.ts')
  const fakeCookies = {
    get: (name) => name === 'krishi_session' ? { value: FARMER_ID } : undefined,
    getAll: () => [{ name: 'krishi_session', value: FARMER_ID }],
    set: () => {}
  }
  const farmerClient = createLocalServerClient(fakeCookies)
  await markConversationMessagesAsRead(farmerClient, LISTING_CONV_ID, FARMER_ID)

  // Verify DB updated
  const updatedDb = JSON.parse(fs.readFileSync(dbPath, 'utf8'))
  const readMsg = updatedDb.messages.find(m => m.id === msgFromBuyer.id)
  console.log(`  - Message read_at after opening: ${readMsg?.read_at} (expected non-null timestamp)`)

  // Check Farmer nav & inbox row after reading (dots should be gone)
  const farmerReadRes = await fetch(`${BASE_URL}/en/dashboard`, { headers: farmerHeaders })
  const farmerReadHtml = await farmerReadRes.text()
  const farmerDotAfterRead = farmerReadHtml.includes('data-testid="unread-dot-desktop"')
  console.log(`  - Farmer nav has unread dot after reading: ${farmerDotAfterRead} (expected: false)`)

  const farmerInboxAfterReadRes = await fetch(`${BASE_URL}/en/messages`, { headers: farmerHeaders })
  const farmerInboxAfterReadHtml = await farmerInboxAfterReadRes.text()
  const farmerRowDotAfterRead = farmerInboxAfterReadHtml.includes(`data-testid="unread-dot-conv-${LISTING_CONV_ID}"`)
  console.log(`  - Farmer inbox row [${LISTING_CONV_ID}] has unread dot after reading: ${farmerRowDotAfterRead} (expected: false)`)

  if (!readMsg?.read_at || farmerDotAfterRead || farmerRowDotAfterRead) {
    throw new Error('Step 3c failed: message was not marked read or dot remained active in nav or inbox row!')
  }

  // 3d. Reverse roles: Farmer sends message to Buyer
  console.log('\n3d. Reverse roles: Farmer sends message to Buyer:')
  const msgFromFarmer = {
    id: 'test-msg-f2b-' + Date.now(),
    conversation_id: LISTING_CONV_ID,
    sender_id: FARMER_ID,
    message: 'Yes Priya, 100 quintals available for immediate pickup.',
    created_at: new Date().toISOString(),
    read_at: null
  }
  const dbWithFarmerMsg = JSON.parse(fs.readFileSync(dbPath, 'utf8'))
  dbWithFarmerMsg.messages.push(msgFromFarmer)
  fs.writeFileSync(dbPath, JSON.stringify(dbWithFarmerMsg, null, 2))

  // Buyer should now see the dot in nav AND inbox row
  const buyerWithMsgRes = await fetch(`${BASE_URL}/en/buyer`, { headers: buyerHeaders })
  const buyerWithMsgHtml = await buyerWithMsgRes.text()
  const buyerHasDot = buyerWithMsgHtml.includes('data-testid="unread-dot-desktop"')
  console.log(`  - Buyer nav has unread dot: ${buyerHasDot} (expected: true)`)

  const buyerInboxWithMsgRes = await fetch(`${BASE_URL}/en/messages`, { headers: buyerHeaders })
  const buyerInboxWithMsgHtml = await buyerInboxWithMsgRes.text()
  const buyerRowHasDot = buyerInboxWithMsgHtml.includes(`data-testid="unread-dot-conv-${LISTING_CONV_ID}"`)
  console.log(`  - Buyer inbox row [${LISTING_CONV_ID}] has unread dot: ${buyerRowHasDot} (expected: true)`)

  // Farmer should NOT see dot
  const farmerSenderRes = await fetch(`${BASE_URL}/en/dashboard`, { headers: farmerHeaders })
  const farmerSenderHtml = await farmerSenderRes.text()
  const farmerSenderHasDot = farmerSenderHtml.includes('data-testid="unread-dot-desktop"')
  console.log(`  - Farmer nav (sender) has unread dot: ${farmerSenderHasDot} (expected: false)`)

  const farmerSenderInboxRes = await fetch(`${BASE_URL}/en/messages`, { headers: farmerHeaders })
  const farmerSenderInboxHtml = await farmerSenderInboxRes.text()
  const farmerSenderRowHasDot = farmerSenderInboxHtml.includes(`data-testid="unread-dot-conv-${LISTING_CONV_ID}"`)
  console.log(`  - Farmer inbox row (sender) has unread dot: ${farmerSenderRowHasDot} (expected: false)`)

  if (!buyerHasDot || !buyerRowHasDot || farmerSenderHasDot || farmerSenderRowHasDot) {
    throw new Error('Step 3d failed: reverse role dot did not appear for buyer or appeared for farmer!')
  }

  // Buyer opens and marks read
  const fakeBuyerCookies = {
    get: (name) => name === 'krishi_session' ? { value: BUYER_ID } : undefined,
    getAll: () => [{ name: 'krishi_session', value: BUYER_ID }],
    set: () => {}
  }
  const buyerClient = createLocalServerClient(fakeBuyerCookies)
  await markConversationMessagesAsRead(buyerClient, LISTING_CONV_ID, BUYER_ID)

  const buyerReadRes = await fetch(`${BASE_URL}/en/buyer`, { headers: buyerHeaders })
  const buyerReadHtml = await buyerReadRes.text()
  const buyerDotAfterRead = buyerReadHtml.includes('data-testid="unread-dot-desktop"')
  console.log(`  - Buyer nav has unread dot after reading: ${buyerDotAfterRead} (expected: false)`)

  const buyerInboxAfterReadRes = await fetch(`${BASE_URL}/en/messages`, { headers: buyerHeaders })
  const buyerInboxAfterReadHtml = await buyerInboxAfterReadRes.text()
  const buyerRowDotAfterRead = buyerInboxAfterReadHtml.includes(`data-testid="unread-dot-conv-${LISTING_CONV_ID}"`)
  console.log(`  - Buyer inbox row has unread dot after reading: ${buyerRowDotAfterRead} (expected: false)`)

  if (buyerDotAfterRead || buyerRowDotAfterRead) {
    throw new Error('Step 3d failed: buyer dot did not disappear after reading from nav or inbox row!')
  }

  console.log('\n===============================================================')
  console.log('ALL VERIFICATIONS PASSED SUCCESSFULLY!')
  console.log('===============================================================')
}

run().catch(err => {
  console.error('\nVERIFICATION FAILED:', err)
  process.exit(1)
})
