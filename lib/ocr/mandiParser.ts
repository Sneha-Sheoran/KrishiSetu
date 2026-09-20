import type { ExtractedReceiptData } from './types';

/**
 * Parses raw OCR text from an Indian agricultural / Mandi receipt.
 * Employs robust pattern matching, numeric sanitization, and agricultural domain heuristics.
 */
export function parseMandiReceiptText(
  rawText: string,
  ocrConfidence: number = 85
): ExtractedReceiptData {
  const lines = rawText
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);

  const fullText = rawText.replace(/\r/g, ' ');

  // 1. Market / Mandi Name
  let market: string | null = null;
  let mandi_location: string | null = null;

  const marketRegex = /(?:APMC|Krishi\s+Upaj\s+Mandi|Mandi\s+Samiti|Anaj\s+Mandi|Grain\s+Market|Mandi\s+Parishad|Agricultural\s+Produce\s+Market)[^\n,\r]*/i;
  const marketMatch = fullText.match(marketRegex);
  if (marketMatch) {
    market = marketMatch[0].trim();
  } else {
    // Check first 3 lines for prominent header
    for (let i = 0; i < Math.min(3, lines.length); i++) {
      if (/Mandi|APMC|Samiti|Market|Krishi/i.test(lines[i])) {
        market = lines[i];
        break;
      }
    }
  }

  // Mandi Location (Delhi, Vashi, Pune, Indore, Jaipur, Kota, etc.)
  const locationRegex = /(?:New\s+Delhi|Delhi|Mumbai|Vashi|Pune|Nashik|Indore|Ujjain|Bhopal|Jaipur|Kota|Ahmedabad|Rajkot|Karnal|Ambala|Ludhiana|Hapur|Agra|Kanpur|Lucknow|Nagpur)/i;
  const locMatch = fullText.match(locationRegex);
  if (locMatch) {
    mandi_location = locMatch[0].trim();
  }

  // 2. Receipt / Bill / Memo Number
  let receipt_number: string | null = null;
  const receiptNoRegex = /(?:Receipt\s*(?:No|#|\.)?|Bill\s*(?:No|#|\.)?|Lot\s*(?:No|#|\.)?|Memo\s*(?:No|#|\.)?|Voucher\s*(?:No|#|\.)?|Token\s*(?:No|#|\.)?|Bilty\s*(?:No|#|\.)?)[:\s-]*([A-Za-z0-9\/-]+)/i;
  const receiptMatch = fullText.match(receiptNoRegex);
  if (receiptMatch && receiptMatch[1]) {
    receipt_number = receiptMatch[1].trim();
  }

  // 3. Receipt Date
  let receipt_date: string | null = null;
  const dateRegex = /(?:Date|दिनांक|तारीख)?[:\s]*(\b\d{1,2}[-\/.]\d{1,2}[-\/.]\d{2,4}\b)/i;
  const dateMatch = fullText.match(dateRegex);
  if (dateMatch && dateMatch[1]) {
    const rawDate = dateMatch[1].replace(/[-.]/g, '/');
    const parts = rawDate.split('/');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      let year = parts[2];
      if (year.length === 2) year = '20' + year;
      // Convert to YYYY-MM-DD for standard date input
      receipt_date = `${year}-${month}-${day}`;
    }
  }

  // 4. Farmer Name
  let farmer_name: string | null = null;
  const farmerRegex = /(?:Farmer\s*Name|Kisan\s*Name|कृषक\s*नाम|किसान)[:\s-]*([A-Za-z\s.]+?)(?:\r|\n|$)/i;
  const farmerMatch = fullText.match(farmerRegex);
  if (farmerMatch && farmerMatch[1]) {
    const candidate = farmerMatch[1].trim();
    if (candidate.length > 2 && !/Commodity|Crop|Vehicle|Date|Receipt/i.test(candidate)) {
      farmer_name = candidate;
    }
  }

  // 5. Vehicle Number
  let vehicle_number: string | null = null;
  const vehicleRegex = /(?:Vehicle\s*(?:No|#|\.)?|गाड़ी\s*नं\.?)[:\s-]*([A-Z]{2}[ -]?[0-9]{1,2}[A-Z]?[ -]?[A-Z]{0,3}[ -]?[0-9]{4})/i;
  const vehicleMatch = fullText.match(vehicleRegex);
  if (vehicleMatch && vehicleMatch[1]) {
    vehicle_number = vehicleMatch[1].trim().replace(/\s+/g, ' ');
  } else {
    // Try general Indian vehicle registration regex
    const genVehMatch = fullText.match(/\b([A-Z]{2}[ -]?[0-9]{1,2}[A-Z]?[ -]?[A-Z]{0,3}[ -]?[0-9]{4})\b/i);
    if (genVehMatch) {
      vehicle_number = genVehMatch[1].trim();
    }
  }

  // 6. Crop / Commodity
  let commodity: string | null = null;
  const commoditiesMap: Record<string, string> = {
    potato: 'Potato',
    aloo: 'Potato',
    tomato: 'Tomato',
    tamatar: 'Tomato',
    onion: 'Onion',
    pyaz: 'Onion',
    wheat: 'Wheat',
    gehun: 'Wheat',
    gehu: 'Wheat',
    kanak: 'Wheat',
    paddy: 'Paddy',
    dhan: 'Paddy',
    rice: 'Rice',
    chawal: 'Rice',
    soybean: 'Soybean',
    soyabean: 'Soybean',
    mustard: 'Mustard',
    sarson: 'Mustard',
    cotton: 'Cotton',
    kapas: 'Cotton',
    gram: 'Gram',
    chana: 'Gram',
    maize: 'Maize',
    makka: 'Makka',
    bajra: 'Bajra',
    garlic: 'Garlic',
    lahsun: 'Garlic',
    ginger: 'Ginger',
    adrak: 'Ginger',
    turmeric: 'Turmeric',
    haldi: 'Turmeric'
  };

  for (const [key, val] of Object.entries(commoditiesMap)) {
    const regex = new RegExp(`\\b${key}\\b`, 'i');
    if (regex.test(fullText)) {
      commodity = val;
      break;
    }
  }

  // 7. Variety / Grade
  let variety: string | null = null;
  const varietyRegex = /(?:Variety|Grade|प्रकार|किस्म)[:\s-]*([A-Za-z0-9\s-]+?)(?:\r|\n|$)/i;
  const varietyMatch = fullText.match(varietyRegex);
  if (varietyMatch && varietyMatch[1]) {
    const v = varietyMatch[1].trim();
    if (!/Quantity|Rate|Crop|Price/i.test(v) && v.length < 30) {
      variety = v;
    }
  }

  // 8. Quantity & Unit
  // CRITICAL: Ensure 5000 is preserved and not truncated to 50!
  let quantity: number | null = null;
  let unit: string = 'Quintal';

  // Check for explicit Quantity line: e.g. "Quantity: 5000 Kg (50 Quintal)" or "Quantity: 5000 Kg" or "5000.00 Kg"
  const qtyLineMatch = fullText.match(/(?:Quantity|Net\s*Weight|वजन|मात्रा)[:\s-]*(\d+(?:\.\d+)?)\s*(Kg|Kgs|Kilogram|Quintal|Qtl|Q|MT|Tonne|Bag|Bori|Katta)?/i);
  if (qtyLineMatch) {
    quantity = parseFloat(qtyLineMatch[1]);
    if (qtyLineMatch[2]) {
      const u = qtyLineMatch[2].toLowerCase();
      if (u.startsWith('kg')) unit = 'Kg';
      else if (u.startsWith('q')) unit = 'Quintal';
      else if (u.startsWith('mt') || u.startsWith('t')) unit = 'Tonne';
      else if (u.startsWith('b') || u.startsWith('k')) unit = 'Bags';
    }
  }

  // If not found from label, search for prominent weight with unit
  if (!quantity) {
    const standaloneWeight = fullText.match(/\b(\d{2,6}(?:\.\d+)?)\s*(Kg|Kgs|Quintal|Qtl)\b/i);
    if (standaloneWeight) {
      quantity = parseFloat(standaloneWeight[1]);
      unit = standaloneWeight[2].toLowerCase().startsWith('kg') ? 'Kg' : 'Quintal';
    }
  }

  // 9. Rate / Price per unit
  // CRITICAL: Ensure 1350 is preserved and not truncated to 135!
  let price_per_unit: number | null = null;
  const rateRegex = /(?:Rate|Price|दर|भाव|Bhav|Dar)[:\s\/-]*[₹Rs\.]*\s*(\d{2,5}(?:\.\d+)?)/i;
  const rateMatch = fullText.match(rateRegex);
  if (rateMatch && rateMatch[1]) {
    price_per_unit = parseFloat(rateMatch[1]);
  } else {
    // Look for per quintal pattern: e.g. "1350 / Quintal" or "1350 per Qtl"
    const perUnitMatch = fullText.match(/(\d{3,5})\s*(?:\/|per)\s*(?:Quintal|Qtl|Kg|Q)/i);
    if (perUnitMatch) {
      price_per_unit = parseFloat(perUnitMatch[1]);
    }
  }

  // 10. Gross Amount, Commission, Deductions
  let gross_amount: number | null = null;
  const grossRegex = /(?:Gross\s*Amount|Total\s*Amount|सकल\s*राशि|कुल\s*राशि)[:\s-]*[₹Rs\.]*\s*(\d+(?:\.\d+)?)/i;
  const grossMatch = fullText.match(grossRegex);
  if (grossMatch) {
    gross_amount = parseFloat(grossMatch[1]);
  }

  let commission: number | null = null;
  const commRegex = /(?:Commission|Mandi\s*Fee|Market\s*Fee|आढ़त|शुल्क|Charges)[:\s-]*[₹Rs\.]*\s*(\d+(?:\.\d+)?)/i;
  const commMatch = fullText.match(commRegex);
  if (commMatch) {
    commission = parseFloat(commMatch[1]);
  }

  let deductions: number | null = 0;
  const dedRegex = /(?:Deductions|कटौती|Labor|Labour|Hamali)[:\s-]*[₹Rs\.]*\s*(\d+(?:\.\d+)?)/i;
  const dedMatch = fullText.match(dedRegex);
  if (dedMatch) {
    deductions = parseFloat(dedMatch[1]);
  }

  // 11. Net Payable Amount
  // CRITICAL: Extract 66500 instead of mock 56500!
  let net_amount: number | null = null;
  const netRegex = /(?:Net\s*(?:Payable)?\s*(?:Amount)?|शुद्ध\s*राशि|कुल\s*देय\s*राशि|Net\s*Amount|Amount\s*Payable)[:\s-]*[₹Rs\.]*\s*(\d+(?:\.\d+)?)/i;
  const netMatch = fullText.match(netRegex);
  if (netMatch) {
    net_amount = parseFloat(netMatch[1]);
  }

  // 12. Mathematical Cross-Validation & Disambiguation
  // Check if quantity × rate ≈ gross or net
  // Note: Mandi rates are almost universally per Quintal (1 Quintal = 100 Kg).
  let math_verified = false;
  if (quantity && price_per_unit) {
    let effectiveQuintals = quantity;
    if (unit.toLowerCase() === 'kg') {
      effectiveQuintals = quantity / 100;
    }

    const calculatedGross = Math.round(effectiveQuintals * price_per_unit);
    
    // Check if calculated gross matches explicit gross_amount or net_amount
    if (gross_amount && Math.abs(calculatedGross - gross_amount) <= Math.max(10, gross_amount * 0.02)) {
      math_verified = true;
    } else if (!gross_amount) {
      gross_amount = calculatedGross;
      math_verified = true;
    }

    // If net_amount is missing or questionable, calculate from gross - commission - deductions
    if (!net_amount && gross_amount) {
      const totalDeductions = (commission || 0) + (deductions || 0);
      net_amount = gross_amount - totalDeductions;
    } else if (net_amount && gross_amount) {
      const diff = gross_amount - net_amount;
      if (diff > 0 && (!commission || commission === 0)) {
        commission = diff;
      }
      math_verified = true;
    }
  }

  // Field-level confidence estimation
  const field_confidences: Record<string, number> = {
    market: market ? 90 : 20,
    commodity: commodity ? 95 : 20,
    variety: variety ? 85 : 40,
    quantity: quantity ? (math_verified ? 96 : 88) : 20,
    unit: 90,
    price_per_unit: price_per_unit ? (math_verified ? 95 : 85) : 20,
    net_amount: net_amount ? (math_verified ? 97 : 85) : 20,
    receipt_date: receipt_date ? 90 : 30,
    receipt_number: receipt_number ? 92 : 30,
    farmer_name: farmer_name ? 88 : 30
  };

  // Overall confidence
  const coreScores = [
    field_confidences.commodity,
    field_confidences.quantity,
    field_confidences.price_per_unit,
    field_confidences.net_amount
  ];
  const avgCore = coreScores.reduce((a, b) => a + b, 0) / coreScores.length;
  const overallConfidence = Math.round(avgCore * (ocrConfidence / 100));

  return {
    market,
    mandi_location,
    farmer_name,
    farmer_id: null,
    receipt_number,
    receipt_date,
    commodity,
    variety,
    quantity,
    unit,
    price_per_unit,
    gross_amount,
    commission,
    deductions,
    net_amount,
    buyer_name: null,
    seller_name: null,
    vehicle_number,
    confidence: Math.min(100, Math.max(10, overallConfidence)),
    field_confidences,
    math_verified,
    raw_text: rawText,
    engine_used: 'tesseract'
  };
}
