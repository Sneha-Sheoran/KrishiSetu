import { createWorker } from 'tesseract.js';
import sharp from 'sharp';
import { parseMandiReceiptText } from '../lib/ocr/mandiParser.ts';

async function test() {
  console.log('Testing sharp, tesseract, and mandiParser...');
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

  const worker = await createWorker('eng');
  const ret = await worker.recognize(imgBuffer);
  await worker.terminate();

  const parsed = parseMandiReceiptText(ret.data.text, ret.data.confidence);
  console.log('Parsed Mandi Data:\n', JSON.stringify(parsed, null, 2));

  if (parsed.quantity !== 5000) throw new Error(`Expected quantity 5000, got ${parsed.quantity}`);
  if (parsed.price_per_unit !== 1350) throw new Error(`Expected rate 1350, got ${parsed.price_per_unit}`);
  if (parsed.net_amount !== 66500) throw new Error(`Expected net 66500, got ${parsed.net_amount}`);
  if (parsed.commodity !== 'Potato') throw new Error(`Expected Potato, got ${parsed.commodity}`);
  console.log('ALL ASSERTIONS PASSED!');
}

test().catch(console.error);
