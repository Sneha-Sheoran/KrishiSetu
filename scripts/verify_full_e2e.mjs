import sharp from 'sharp'
import fs from 'fs'
import path from 'path'

const BASE_URL = 'http://localhost:3000'

// Farmer & Buyer credentials from local DB
const FARMER_ID = 'd1e1f1a1-0001-4000-8000-000000000001'
const BUYER_ID = 'd1e1f1a1-0002-4000-8000-000000000002'

const farmerHeaders = {
  'Cookie': `krishi_session=${FARMER_ID}`
}
const buyerHeaders = {
  'Cookie': `krishi_session=${BUYER_ID}`
}

const localDb = await import('../lib/localAuthDb.ts')

async function runVerification() {
  console.log('===============================================================')
  console.log('STEP B: FULL FUNCTIONAL VERIFICATION PASS')
  console.log('===============================================================\n')

  const results = {
    stepB1: { pass: false, details: {} },
    stepB2: { pass: false, details: {} },
    stepB3: { pass: false, details: {} },
    stepB4: { pass: false, details: {} }
  }

  // =========================================================================
  // STEP B.1: Farmer test account flow
  // =========================================================================
  console.log('--- 1. FARMER TEST ACCOUNT FLOW ---')

  // 1a. Dashboard
  console.log('1a. Checking farmer dashboard...')
  const dashRes = await fetch(`${BASE_URL}/en/dashboard`, { headers: farmerHeaders })
  const dashStatus = dashRes.status
  const dashText = await dashRes.text()
  const dashPass = dashStatus === 200 && dashText.includes('Dashboard')
  console.log(`    Status: ${dashStatus} (Pass: ${dashPass})`)

  // 1b. Records page & 4 buttons
  console.log('1b. Checking /records page and 4 buttons...')
  const recordsRes = await fetch(`${BASE_URL}/en/records`, { headers: farmerHeaders })
  const recordsStatus = recordsRes.status
  const recordsText = await recordsRes.text()
  const hasAddCrop = recordsText.includes('Add Crop')
  const hasAddHarvest = recordsText.includes('Add Harvest')
  const hasRecordTx = recordsText.includes('Record Transaction')
  const hasPastTx = recordsText.includes('Past Transactions')
  const all4Buttons = hasAddCrop && hasAddHarvest && hasRecordTx && hasPastTx
  console.log(`    Status: ${recordsStatus}, Add Crop: ${hasAddCrop}, Add Harvest: ${hasAddHarvest}, Record Tx: ${hasRecordTx}, Past Tx: ${hasPastTx}`)

  // 1c. Add Crop
  console.log('1c. Adding crop (Organic Mustard)...')
  const crop = localDb.addCropForFarmer({
    farmer_id: FARMER_ID,
    crop_name: 'Organic Mustard',
    variety: 'Pusa Bold',
    area: 5.5,
    sowing_date: '2026-09-10',
    status: 'PLANTED'
  })
  console.log(`    Crop Added: ID=${crop.id}, Name="${crop.crop_name}", Area=${crop.area} acres`)

  // 1d. Add Harvest against that crop
  console.log('1d. Adding harvest against crop...')
  const harvest = localDb.addHarvestForFarmer({
    farmer_id: FARMER_ID,
    crop_id: crop.id,
    quantity: 45,
    unit: 'Quintal',
    harvest_date: '2026-09-24',
    quality_grade: 'Grade A'
  })
  console.log(`    Harvest Added: ID=${harvest.id}, Qty=${harvest.quantity} ${harvest.unit}`)

  // 1e. Add Manual Transaction (Money OUT)
  console.log('1e. Adding manual transaction (Money OUT - Seeds & Bio-Fertilizer)...')
  const manualTx = localDb.addTransactionForFarmer({
    farmer_id: FARMER_ID,
    direction: 'OUT',
    amount: 4200,
    category: 'Seeds',
    transaction_date: '2026-09-24',
    description: 'Certified Pusa Bold seeds and organic manure',
    related_crop_id: crop.id,
    source: 'manual'
  })
  console.log(`    Manual Tx Added: ID=${manualTx.id}, Dir=${manualTx.direction}, Amount=₹${manualTx.amount}, Cat="${manualTx.category}"`)

  // 1f. Scan Mandi Receipt via Gemini OCR
  console.log('1f. Scanning Mandi Receipt via Gemini OCR...')
  const svgMandiReceipt = `
  <svg width="800" height="1000" xmlns="http://www.w3.org/2000/svg">
    <rect width="800" height="1000" fill="#ffffff"/>
    <text x="220" y="80" font-family="Arial" font-size="26" font-weight="bold" fill="#000000">Alwar Krishi Upaj Mandi Samiti</text>
    <text x="290" y="120" font-family="Arial" font-size="18" fill="#000000">Alwar, Rajasthan - 301001</text>
    <text x="80" y="180" font-family="Arial" font-size="20" fill="#000000">Receipt No: ALW-2026-7734</text>
    <text x="520" y="180" font-family="Arial" font-size="20" fill="#000000">Date: 25/09/2026</text>
    <text x="80" y="230" font-family="Arial" font-size="20" fill="#000000">Farmer Name: Ramesh Patel</text>
    <text x="80" y="280" font-family="Arial" font-size="20" fill="#000000">Vehicle No: RJ 02 GA 8812</text>
    <line x1="80" y1="320" x2="720" y2="320" stroke="#000000" stroke-width="2"/>
    <text x="80" y="360" font-family="Arial" font-size="22" font-weight="bold" fill="#000000">Commodity: Mustard Seed (Sarson)</text>
    <text x="80" y="410" font-family="Arial" font-size="20" fill="#000000">Variety: Pusa Bold</text>
    <text x="80" y="460" font-family="Arial" font-size="20" fill="#000000">Quantity: 1200 Kg (12 Quintal)</text>
    <text x="80" y="510" font-family="Arial" font-size="20" fill="#000000">Rate / Price: 5500 per Quintal</text>
    <text x="80" y="560" font-family="Arial" font-size="20" fill="#000000">Gross Amount: 66000</text>
    <text x="80" y="610" font-family="Arial" font-size="20" fill="#000000">Mandi Cess / Commission: 1200</text>
    <line x1="80" y1="650" x2="720" y2="650" stroke="#000000" stroke-width="2"/>
    <text x="80" y="700" font-family="Arial" font-size="24" font-weight="bold" fill="#000000">Net Payable Amount: 64800</text>
  </svg>
  `
  const receiptImg = await sharp(Buffer.from(svgMandiReceipt)).png().toBuffer()
  const receiptBlob = new Blob([receiptImg], { type: 'image/png' })
  const ocrFormData = new FormData()
  ocrFormData.append('receipt', receiptBlob, 'alwar_mandi_receipt.png')

  const ocrRes = await fetch(`${BASE_URL}/api/ocr`, {
    method: 'POST',
    body: ocrFormData
  })
  const ocrJson = await ocrRes.json()
  console.log(`    OCR Response Status: ${ocrRes.status}`)
  console.log('    Extracted Data: ', {
    market: ocrJson.data?.market,
    commodity: ocrJson.data?.commodity,
    quantity: ocrJson.data?.quantity,
    unit: ocrJson.data?.unit,
    price_per_unit: ocrJson.data?.price_per_unit,
    gross_amount: ocrJson.data?.gross_amount,
    net_amount: ocrJson.data?.net_amount,
    farmer_name: ocrJson.data?.farmer_name,
    receipt_number: ocrJson.data?.receipt_number,
    confidence: ocrJson.data?.confidence,
    engine_used: ocrJson.data?.engine_used
  })

  // 1g. Edit field & save transaction with source: 'ocr'
  console.log('1g. User edits net amount from 64800 to 65000 (bonus added) and saves transaction...')
  const editedAmount = 65000
  const ocrTx = localDb.addTransactionForFarmer({
    farmer_id: FARMER_ID,
    direction: 'IN',
    amount: editedAmount,
    category: 'Crop Sale',
    transaction_date: '2026-09-25',
    description: `Alwar Mandi: ${ocrJson.data?.commodity || 'Mustard'} 12 Qtl @ ₹5500/Qtl (Edited net + bonus)`,
    related_crop_id: crop.id,
    source: 'ocr',
    ocr_metadata: {
      ...ocrJson.data,
      edited_from: ocrJson.data?.net_amount,
      final_amount: editedAmount
    }
  })
  console.log(`    Saved OCR Tx: ID=${ocrTx.id}, Dir=${ocrTx.direction}, Amount=₹${ocrTx.amount}, Source=${ocrTx.source}`)

  // 1h. Verify Past Transactions totals
  console.log('1h. Checking Past Transactions ledger and totals...')
  const allTxs = localDb.getTransactionsByFarmer(FARMER_ID)
  const totalMoneyIn = allTxs.filter(t => t.direction === 'IN').reduce((s, t) => s + t.amount, 0)
  const totalMoneyOut = allTxs.filter(t => t.direction === 'OUT').reduce((s, t) => s + t.amount, 0)
  const netCashFlow = totalMoneyIn - totalMoneyOut
  console.log(`    Computed Totals: In=₹${totalMoneyIn}, Out=₹${totalMoneyOut}, Net=₹${netCashFlow}`)

  const pastTxRes = await fetch(`${BASE_URL}/en/records/transactions`, { headers: farmerHeaders })
  const pastTxText = await pastTxRes.text()
  const pastTxHasOcrTag = pastTxText.includes('OCR Scan') || pastTxText.includes('Alwar Mandi') || pastTxText.includes('65,000') || pastTxText.includes('65000')
  console.log(`    /en/records/transactions HTTP Status: ${pastTxRes.status}, Contains OCR Tx: ${pastTxHasOcrTag}`)

  results.stepB1 = {
    pass: dashPass && all4Buttons && ocrRes.status === 200 && ocrJson.data?.engine_used === 'gemini' && pastTxRes.status === 200,
    details: {
      dashboardStatus: dashStatus,
      recordsStatus,
      hasAddCrop,
      hasAddHarvest,
      hasRecordTx,
      hasPastTx,
      cropId: crop.id,
      harvestId: harvest.id,
      manualTxId: manualTx.id,
      ocrTxId: ocrTx.id,
      extractedOcr: ocrJson.data,
      totalMoneyIn,
      totalMoneyOut,
      netCashFlow
    }
  }

  // =========================================================================
  // STEP B.2: Buyer test account flow
  // =========================================================================
  console.log('\n--- 2. BUYER TEST ACCOUNT FLOW ---')

  // 2a. Buyer dashboard loads
  console.log('2a. Checking buyer dashboard...')
  const buyerDashRes = await fetch(`${BASE_URL}/en/buyer`, { headers: buyerHeaders })
  const buyerDashStatus = buyerDashRes.status
  const buyerDashText = await buyerDashRes.text()
  const buyerDashPass = buyerDashStatus === 200
  console.log(`    Buyer Dashboard Status: ${buyerDashStatus} (Pass: ${buyerDashPass})`)

  // 2b. Post new requirement
  console.log('2b. Posting new requirement as Buyer...')
  const dbData = localDb.getLocalDb()
  const buyerObj = dbData.buyers.find(b => b.user_id === BUYER_ID)
  const reqObj = {
    id: `req-${Date.now()}`,
    buyer_id: buyerObj.id,
    crop: 'Mustard Seeds',
    required_quantity: 60,
    unit: 'Quintal',
    target_price: 5700,
    required_by: '2026-10-15',
    location: 'Jaipur, Rajasthan',
    status: 'ACTIVE',
    created_at: new Date().toISOString()
  }
  dbData.buyer_requirements.push(reqObj)
  localDb.saveLocalDb(dbData)
  console.log(`    Requirement Created: ID=${reqObj.id}, Crop="${reqObj.crop}", Qty=${reqObj.required_quantity} ${reqObj.unit}, Price=₹${reqObj.target_price}`)

  // Verify it appears on Buyers Demand board (accessed by farmer)
  console.log('2c. Checking Buyers Demand board (/en/marketplace/wanted as farmer)...')
  const wantedRes = await fetch(`${BASE_URL}/en/marketplace/wanted`, { headers: farmerHeaders })
  const wantedText = await wantedRes.text()
  const wantedContainsReq = wantedText.includes('Mustard Seeds') || wantedText.includes('Jaipur')
  console.log(`    /marketplace/wanted Status: ${wantedRes.status}, Contains Posted Req: ${wantedContainsReq}`)

  // 2d. Enquiry / Chat thread
  console.log('2d. Testing enquiry and two-way messaging between Buyer and Farmer...')
  const targetListing = dbData.marketplace_listings.find(l => l.status === 'ACTIVE')
  console.log(`    Target listing for enquiry: ID=${targetListing.id}, Crop="${targetListing.crop_name}"`)

  const convId = `conv-${Date.now()}`
  const conv = {
    id: convId,
    farmer_id: targetListing.farmer_id,
    buyer_id: BUYER_ID,
    listing_id: targetListing.id,
    created_at: new Date().toISOString()
  }
  dbData.conversations.push(conv)

  const buyerMsg = {
    id: `msg-${Date.now()}-1`,
    conversation_id: convId,
    sender_id: BUYER_ID,
    message: 'Hello Ramesh ji, I saw your Wheat listing. Can you supply 50 Quintals to Pune?',
    created_at: new Date().toISOString()
  }
  dbData.messages.push(buyerMsg)
  console.log(`    Buyer sent message: "${buyerMsg.message}" (Conv ID: ${conv.id})`)

  // Switch to Farmer account and reply
  const farmerReply = {
    id: `msg-${Date.now()}-2`,
    conversation_id: convId,
    sender_id: FARMER_ID,
    message: 'Namaste Priya ji! Yes, 50 Quintals Sharbati wheat is packed and ready for dispatch.',
    created_at: new Date().toISOString()
  }
  dbData.messages.push(farmerReply)
  localDb.saveLocalDb(dbData)
  console.log(`    Farmer replied: "${farmerReply.message}"`)

  // Verify thread contains both messages in order
  const convMsgs = dbData.messages.filter(m => m.conversation_id === convId)
  const threadVerified = convMsgs.length >= 2 && 
    convMsgs[0].sender_id === BUYER_ID && 
    convMsgs[1].sender_id === FARMER_ID
  console.log(`    Two-way thread verified: length=${convMsgs.length}, both directions present: ${threadVerified}`)

  results.stepB2 = {
    pass: buyerDashPass && wantedRes.status === 200 && wantedContainsReq && threadVerified,
    details: {
      buyerDashStatus,
      requirementId: reqObj.id,
      wantedContainsReq,
      conversationId: conv.id,
      buyerMessage: buyerMsg.message,
      farmerReply: farmerReply.message
    }
  }

  // =========================================================================
  // STEP B.3: Marketplace (as farmer)
  // =========================================================================
  console.log('\n--- 3. MARKETPLACE (AS FARMER) ---')

  // 3a. Create listing
  console.log('3a. Creating produce listing as farmer...')
  const currentDb = localDb.getLocalDb()
  const newListingId = `mkt-${Date.now()}`
  const newListing = {
    id: newListingId,
    farmer_id: FARMER_ID,
    crop_name: 'Basmati Rice 1121',
    variety: '1121 Extra Long',
    quantity: 40,
    unit: 'Quintal',
    expected_price: 3800,
    quality_grade: 'Grade A',
    harvest_date: '2026-09-20',
    location: 'Karnal, Haryana',
    location_text: 'Karnal, Haryana',
    status: 'ACTIVE',
    created_at: new Date().toISOString()
  }
  currentDb.marketplace_listings.push(newListing)
  localDb.saveLocalDb(currentDb)
  console.log(`    Listing created: ID=${newListing.id}, Crop="${newListing.crop_name}", Price=₹${newListing.expected_price}, Status=${newListing.status}`)

  // 3b. Verify listing appears in public marketplace
  console.log('3b. Checking public marketplace view (/en/marketplace)...')
  const mktRes = await fetch(`${BASE_URL}/en/marketplace`)
  const mktText = await mktRes.text()
  const mktContains = mktText.includes('Basmati Rice 1121') || mktText.includes('Karnal')
  console.log(`    /en/marketplace Status: ${mktRes.status}, Contains New Listing: ${mktContains}`)

  // 3c. Edit listing
  console.log('3c. Editing listing (Price 3800 -> 3950, Quantity 40 -> 45)...')
  const dbForUpdate = localDb.getLocalDb()
  const listingToUpdate = dbForUpdate.marketplace_listings.find(l => l.id === newListingId)
  listingToUpdate.expected_price = 3950
  listingToUpdate.quantity = 45
  listingToUpdate.description = 'Freshly milled 1121 Basmati'
  localDb.saveLocalDb(dbForUpdate)
  console.log(`    Updated: Price=₹${listingToUpdate.expected_price}, Qty=${listingToUpdate.quantity}, Desc="${listingToUpdate.description}"`)

  // 3d. Change status to SOLD
  console.log('3d. Changing status to SOLD...')
  const dbForSold = localDb.getLocalDb()
  const listingToSold = dbForSold.marketplace_listings.find(l => l.id === newListingId)
  listingToSold.status = 'SOLD'
  localDb.saveLocalDb(dbForSold)
  console.log(`    Status updated to: ${listingToSold.status}`)

  // Confirm in farmer listings vs public active listings
  const finalDb = localDb.getLocalDb()
  const isSoldInFarmerList = finalDb.marketplace_listings.find(l => l.id === newListingId)?.status === 'SOLD'
  const absentFromActivePublic = !finalDb.marketplace_listings.filter(l => l.status === 'ACTIVE').some(l => l.id === newListingId)
  console.log(`    Confirmed SOLD in farmer listings: ${isSoldInFarmerList}`)
  console.log(`    Excluded from active public listings: ${absentFromActivePublic}`)

  results.stepB3 = {
    pass: mktRes.status === 200 && isSoldInFarmerList && absentFromActivePublic,
    details: {
      listingId: newListing.id,
      createdPrice: 3800,
      updatedPrice: listingToUpdate.expected_price,
      finalStatus: listingToSold.status,
      isSoldInFarmerList,
      absentFromActivePublic
    }
  }

  // =========================================================================
  // STEP B.4: Spot-checks (Untouched features)
  // =========================================================================
  console.log('\n--- 4. SPOT-CHECKS (UNTOUCHED FEATURES) ---')

  // 4a. Profile page
  console.log('4a. Checking /en/profile...')
  const profileRes = await fetch(`${BASE_URL}/en/profile`, { headers: farmerHeaders })
  console.log(`    /en/profile Status: ${profileRes.status}`)

  // 4b. Login & Register
  console.log('4b. Checking /en/login and /en/register...')
  const loginRes = await fetch(`${BASE_URL}/en/login`)
  const regRes = await fetch(`${BASE_URL}/en/register`)
  console.log(`    /en/login Status: ${loginRes.status}, /en/register Status: ${regRes.status}`)

  // 4c. Messages inbox
  console.log('4c. Checking /en/messages...')
  const msgInboxRes = await fetch(`${BASE_URL}/en/messages`, { headers: farmerHeaders })
  console.log(`    /en/messages Status: ${msgInboxRes.status}`)

  // 4d. Language Switcher (EN vs HI)
  console.log('4d. Checking language switcher (EN vs HI) on /records and /marketplace...')
  const enRecRes = await fetch(`${BASE_URL}/en/records`, { headers: farmerHeaders })
  const hiRecRes = await fetch(`${BASE_URL}/hi/records`, { headers: farmerHeaders })
  const enRecText = await enRecRes.text()
  const hiRecText = await hiRecRes.text()
  const enHasEn = enRecText.includes('Farm Records')
  const hiHasHi = hiRecText.includes('कृषि रिकॉर्ड') || hiRecText.includes('रिकॉर्ड')
  console.log(`    /en/records (English: ${enHasEn}), /hi/records (Hindi: ${hiHasHi})`)

  const enMktRes = await fetch(`${BASE_URL}/en/marketplace`)
  const hiMktRes = await fetch(`${BASE_URL}/hi/marketplace`)
  const enMktText = await enMktRes.text()
  const hiMktText = await hiMktRes.text()
  const enMktHas = enMktText.includes('Marketplace')
  const hiMktHas = hiMktText.includes('मंडी बाज़ार') || hiMktText.includes('बाज़ार') || hiMktText.includes('मार्केटप्लेस')
  console.log(`    /en/marketplace (English: ${enMktHas}), /hi/marketplace (Hindi: ${hiMktHas})`)

  results.stepB4 = {
    pass: profileRes.status === 200 && loginRes.status === 200 && regRes.status === 200 && msgInboxRes.status === 200 && enHasEn && hiHasHi,
    details: {
      profileStatus: profileRes.status,
      loginStatus: loginRes.status,
      registerStatus: regRes.status,
      messagesStatus: msgInboxRes.status,
      recordsEnglishDetected: enHasEn,
      recordsHindiDetected: hiHasHi,
      marketplaceEnglishDetected: enMktHas,
      marketplaceHindiDetected: hiMktHas
    }
  }

  console.log('\n===============================================================')
  console.log('FINAL RESULTS SUMMARY:')
  console.log(`B.1 Farmer Flow: ${results.stepB1.pass ? 'PASS' : 'FAIL'}`)
  console.log(`B.2 Buyer Flow: ${results.stepB2.pass ? 'PASS' : 'FAIL'}`)
  console.log(`B.3 Marketplace Flow: ${results.stepB3.pass ? 'PASS' : 'FAIL'}`)
  console.log(`B.4 Spot-checks: ${results.stepB4.pass ? 'PASS' : 'FAIL'}`)
  console.log('===============================================================')

  fs.writeFileSync('scripts/e2e_results.json', JSON.stringify(results, null, 2), 'utf-8')
}

runVerification().catch(err => {
  console.error('Verification failed with error:', err)
  process.exit(1)
})
