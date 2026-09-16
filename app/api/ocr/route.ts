import { NextResponse } from 'next/server';

// Mock OCR adapter. In production, this would call Google Cloud Vision or AWS Textract
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('receipt') as File;

    if (!file) {
      return NextResponse.json({ error: 'No receipt file provided' }, { status: 400 });
    }

    // Simulate OCR processing delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Mock extracted data based on typical mandi receipt
    const extractedData = {
      market: 'APMC Vashi',
      commodity: 'Tomato',
      variety: 'Desi',
      quantity: 50,
      unit: 'Quintal',
      price_per_unit: 1200,
      gross_amount: 60000,
      commission: 3000,
      deductions: 500,
      net_amount: 56500,
      receipt_date: new Date().toISOString().split('T')[0],
      confidence: 0.85
    };

    return NextResponse.json({
      status: 'NEEDS_REVIEW',
      data: extractedData
    });

  } catch (error) {
    console.error('OCR Processing Error:', error);
    return NextResponse.json({ error: 'Failed to process receipt image' }, { status: 500 });
  }
}
