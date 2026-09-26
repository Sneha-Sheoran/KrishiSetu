export interface ExtractedReceiptData {
  market: string | null;
  mandi_location: string | null;

  farmer_name: string | null;
  farmer_id: string | null;

  receipt_number: string | null;
  receipt_date: string | null;

  commodity: string | null;
  variety: string | null;

  quantity: number | null;
  unit: string | null;
  price_per_unit: number | null;

  gross_amount: number | null;

  commission: number | null;
  deductions: number | null;

  net_amount: number | null;

  buyer_name: string | null;
  seller_name: string | null;
  vehicle_number: string | null;

  confidence: number;

  field_confidences?: Record<string, number>;

  raw_text?: string;

  math_verified?: boolean;

  quality_warnings?: string[];

  engine_used?: 'gemini' | 'tesseract';
}

export interface OCRProcessingResult {
  status:
    | 'CONFIDENT'
    | 'NEEDS_REVIEW'
    | 'POOR_QUALITY';

  data: ExtractedReceiptData;

  error?: string;
}