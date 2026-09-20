import sharp from 'sharp';

async function runLiveTests() {
  console.log('Waiting for Next.js server to become ready on http://localhost:3000...');
  let ready = false;
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch('http://localhost:3000/api/ocr', { method: 'POST' });
      if (res.status === 400) {
        ready = true;
        break;
      }
    } catch {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  if (!ready) {
    throw new Error('Server did not become ready in time.');
  }

  console.log('Server is READY! Executing live API verification tests...');

  // Test 1: Empty upload (FormData without receipt file)
  console.log('\n--- 1. Testing Empty Upload ---');
  const emptyForm = new FormData();
  const res1 = await fetch('http://localhost:3000/api/ocr', { method: 'POST', body: emptyForm });
  const json1 = await res1.json();
  console.log('Status code:', res1.status, json1);
  if (res1.status !== 400) throw new Error('Expected 400 for empty upload');

  // Test 2: Invalid non-image upload
  console.log('\n--- 2. Testing Non-Image File Upload ---');
  const txtBlob = new Blob(['sample text'], { type: 'text/plain' });
  const formData2 = new FormData();
  formData2.append('receipt', txtBlob, 'invoice.txt');
  const res2 = await fetch('http://localhost:3000/api/ocr', {
    method: 'POST',
    body: formData2
  });
  const json2 = await res2.json();
  console.log('Status code:', res2.status, json2);
  if (res2.status !== 415) throw new Error('Expected 415 for non-image');

  // Test 3: Potato Mandi Receipt Image
  console.log('\n--- 3. Testing Real Potato Mandi Receipt Image ---');
  const svgReceipt = `
  <svg width="800" height="1000" xmlns="http://www.w3.org/2000/svg">
    <rect width="800" height="1000" fill="#ffffff"/>
    <text x="250" y="80" font-family="Arial" font-size="28" font-weight="bold" fill="#000000">APMC Azadpur Mandi</text>
    <text x="280" y="120" font-family="Arial" font-size="18" fill="#000000">New Delhi - 110033</text>
    <text x="80" y="180" font-family="Arial" font-size="20" fill="#000000">Receipt No: APMC-2024-8921</text>
    <text x="520" y="180" font-family="Arial" font-size="20" fill="#000000">Date: 15/09/2024</text>
    <text x="80" y="230" font-family="Arial" font-size="20" fill="#000000">Farmer Name: Rameshwar Lal</text>
    <text x="80" y="280" font-family="Arial" font-size="20" fill="#000000">Vehicle No: DL 1L AB 4521</text>
    <line x1="80" y1="320" x2="720" y2="320" stroke="#000000" stroke-width="2"/>
    <text x="80" y="360" font-family="Arial" font-size="22" font-weight="bold" fill="#000000">Commodity / Crop: Potato (Aloo)</text>
    <text x="80" y="410" font-family="Arial" font-size="20" fill="#000000">Variety: Jyoti</text>
    <text x="80" y="460" font-family="Arial" font-size="20" fill="#000000">Quantity: 5000 Kg (50 Quintal)</text>
    <text x="80" y="510" font-family="Arial" font-size="20" fill="#000000">Rate / Price: 1350 per Quintal</text>
    <text x="80" y="560" font-family="Arial" font-size="20" fill="#000000">Gross Amount: 67500</text>
    <text x="80" y="610" font-family="Arial" font-size="20" fill="#000000">Mandi Fee / Commission: 1000</text>
    <line x1="80" y1="650" x2="720" y2="650" stroke="#000000" stroke-width="2"/>
    <text x="80" y="700" font-family="Arial" font-size="24" font-weight="bold" fill="#000000">Net Payable Amount: 66500</text>
  </svg>
  `;

  const imgBuffer = await sharp(Buffer.from(svgReceipt))
    .png()
    .toBuffer();

  const imgBlob = new Blob([imgBuffer], { type: 'image/png' });
  const formData3 = new FormData();
  formData3.append('receipt', imgBlob, 'potato_receipt.png');

  console.log('Sending receipt image to /api/ocr...');
  const res3 = await fetch('http://localhost:3000/api/ocr', {
    method: 'POST',
    body: formData3
  });

  const json3 = await res3.json();
  console.log('Response Status:', res3.status);
  console.log('Extracted Data Result:\n', JSON.stringify(json3, null, 2));

  if (res3.status !== 200) throw new Error('Expected 200 for valid receipt');
  if (json3.data.quantity !== 5000) throw new Error(`Quantity mismatch: expected 5000, got ${json3.data.quantity}`);
  if (json3.data.price_per_unit !== 1350) throw new Error(`Rate mismatch: expected 1350, got ${json3.data.price_per_unit}`);
  if (json3.data.net_amount !== 66500) throw new Error(`Net amount mismatch: expected 66500, got ${json3.data.net_amount}`);
  if (json3.data.commodity !== 'Potato') throw new Error(`Commodity mismatch: expected Potato, got ${json3.data.commodity}`);

  console.log('\n=============================================');
  console.log('SUCCESS! Live /api/ocr endpoint verified:');
  console.log(`- Commodity: ${json3.data.commodity}`);
  console.log(`- Quantity: ${json3.data.quantity} ${json3.data.unit}`);
  console.log(`- Rate: ₹${json3.data.price_per_unit}`);
  console.log(`- Net Payable: ₹${json3.data.net_amount}`);
  console.log(`- Farmer Name: ${json3.data.farmer_name}`);
  console.log(`- Receipt No: ${json3.data.receipt_number}`);
  console.log(`- Vehicle No: ${json3.data.vehicle_number}`);
  console.log(`- Confidence: ${json3.data.confidence}%`);
  console.log('=============================================');
}

runLiveTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
