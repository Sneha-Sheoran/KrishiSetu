import { POST } from '../app/api/ocr/route.ts';
import sharp from 'sharp';

async function runTests() {
  console.log('--- TEST 1: Missing File (Should return 400) ---');
  const emptyFormData = new FormData();
  const req1 = new Request('http://localhost:3000/api/ocr', {
    method: 'POST',
    body: emptyFormData
  });
  const res1 = await POST(req1);
  const json1 = await res1.json();
  console.log('Status:', res1.status, json1);
  if (res1.status !== 400) throw new Error('Test 1 failed: Expected 400');

  console.log('\n--- TEST 2: Invalid File Type (Should return 415) ---');
  const txtFile = new File(['hello world text file'], 'receipt.txt', { type: 'text/plain' });
  const txtFormData = new FormData();
  txtFormData.append('receipt', txtFile);
  const req2 = new Request('http://localhost:3000/api/ocr', {
    method: 'POST',
    body: txtFormData
  });
  const res2 = await POST(req2);
  const json2 = await res2.json();
  console.log('Status:', res2.status, json2);
  if (res2.status !== 415) throw new Error('Test 2 failed: Expected 415');

  console.log('\n--- TEST 3: Potato Mandi Receipt Image (Should extract 5000, 1350, 66500) ---');
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

  const receiptFile = new File([imgBuffer], 'potato_receipt.png', { type: 'image/png' });
  const validFormData = new FormData();
  validFormData.append('receipt', receiptFile);

  const req3 = new Request('http://localhost:3000/api/ocr', {
    method: 'POST',
    body: validFormData
  });

  const res3 = await POST(req3);
  const json3 = await res3.json();
  console.log('Status:', res3.status);
  console.log('Data:\n', JSON.stringify(json3, null, 2));

  if (res3.status !== 200) throw new Error('Test 3 failed: Expected 200');
  if (json3.data.quantity !== 5000) throw new Error(`Expected quantity 5000, got ${json3.data.quantity}`);
  if (json3.data.price_per_unit !== 1350) throw new Error(`Expected rate 1350, got ${json3.data.price_per_unit}`);
  if (json3.data.net_amount !== 66500) throw new Error(`Expected net amount 66500, got ${json3.data.net_amount}`);
  if (json3.data.commodity !== 'Potato') throw new Error(`Expected Potato, got ${json3.data.commodity}`);

  console.log('\n========================================');
  console.log('ALL TESTS PASSED SUCCESSFULLY!');
  console.log('========================================');
}

runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
