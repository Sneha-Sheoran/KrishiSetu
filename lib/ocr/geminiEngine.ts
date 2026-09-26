import type { ExtractedReceiptData } from './types';

/*
 * Gemini models are tried in this order.
 *
 * The first model is the primary OCR model.
 * Flash-Lite models are used as fallbacks when Gemini
 * is temporarily unavailable or times out.
 */
const GEMINI_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
];

const REQUEST_TIMEOUT_MS = 20_000;

/* ---------------------------------------------------------
   Utility functions
--------------------------------------------------------- */

function clampConfidence(
  value: unknown
): number {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(numberValue)
    )
  );
}

function normalizeFieldConfidences(
  fieldValues: unknown
): Record<string, number> {
  if (
    !fieldValues ||
    typeof fieldValues !== 'object'
  ) {
    return {};
  }

  const result: Record<string, number> = {};

  for (const [
    key,
    fieldValue,
  ] of Object.entries(
    fieldValues as Record<
      string,
      unknown
    >
  )) {
    result[key] =
      clampConfidence(fieldValue);
  }

  return result;
}

function toNumber(
  value: unknown
): number | null {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value)
      ? value
      : null;
  }

  const cleaned = String(value)
    .replace(/[₹,\s]/g, '')
    .replace(/[^\d.-]/g, '');

  if (!cleaned) {
    return null;
  }

  const numberValue =
    Number(cleaned);

  return Number.isFinite(numberValue)
    ? numberValue
    : null;
}

/* ---------------------------------------------------------
   Math verification

   IMPORTANT:
   This does NOT calculate missing receipt values.

   It only verifies a calculation when all required
   values are explicitly printed on the receipt.
--------------------------------------------------------- */

function calculateMathVerified(
  data: ExtractedReceiptData
): boolean {
  if (
    data.quantity === null ||
    data.price_per_unit === null ||
    data.gross_amount === null
  ) {
    return false;
  }

  let expectedGross =
    data.quantity *
    data.price_per_unit;

  const unit = (
    data.unit || ''
  ).toLowerCase();

  /*
   * If quantity is in KG while the rate is
   * per quintal, convert KG → Quintal.
   */
  if (
    unit.includes('kg') ||
    unit.includes('kilogram')
  ) {
    expectedGross =
      (data.quantity / 100) *
      data.price_per_unit;
  }

  return (
    Math.abs(
      expectedGross -
        data.gross_amount
    ) <= 1
  );
}

/* ---------------------------------------------------------
   OCR Prompt
--------------------------------------------------------- */

function createPrompt(): string {
  return `
You are an OCR extraction system for Indian agricultural mandi receipts.

Your task is to READ the uploaded receipt image and extract ONLY information that is visibly present.

IMPORTANT:
This is OCR, not prediction.

NEVER invent, guess, estimate, or reconstruct a value.

If a value is:
- missing
- blurred
- damaged
- cropped
- unreadable
- ambiguous

return null for that field.

Do NOT use common sense to fill missing values.

Do NOT create realistic-looking names, IDs, dates, prices,
quantities, vehicle numbers, or receipt numbers.

--------------------------------------------------
CRITICAL OCR RULES
--------------------------------------------------

1. Extract only text and numbers visibly present.
2. Never hallucinate missing information.
3. Preserve digits exactly as printed.
4. Preserve decimal points when visible.
5. Preserve receipt numbers exactly.
6. Preserve IDs exactly.
7. Read Hindi, English, and mixed Hindi-English text.
8. Handwritten text should only be extracted when readable.
9. If uncertain, return null and lower confidence.
10. Confidence must reflect visual readability.
11. Do not infer values from other fields.
12. Do not calculate missing amounts.
13. Do not calculate missing quantity.
14. Do not calculate missing price.
15. Do not calculate commission.
16. Do not calculate deductions.
17. Do not calculate net amount.
18. Do not calculate gross amount.
19. raw_text must contain only visible receipt text.
20. Add quality warnings when the image or text is difficult to read.

--------------------------------------------------
VERY IMPORTANT ABOUT MONEY
--------------------------------------------------

If the receipt explicitly shows:

Quantity = 100
Rate = 1350
Gross = 135000

then extract all three.

But if the receipt shows:

Quantity = 100
Rate = 1350

and does NOT visibly show Gross,

then:

gross_amount = null

DO NOT calculate 135000.

Similarly:

If Gross and Net are not printed,
do not calculate either one.

If Commission is not printed,
commission = null.

If deductions are not printed,
deductions = null.

--------------------------------------------------
SUPPORTED LANGUAGES
--------------------------------------------------

The receipt may contain:

- English
- Hindi
- Devanagari
- Hindi + English
- Hindi + numbers
- English + numbers

Read the actual visible text.

Do not translate values unless necessary for understanding
the field.

--------------------------------------------------
IMAGE QUALITY
--------------------------------------------------

The receipt may be:

- blurry
- faded
- tilted
- damaged
- partially cropped
- low contrast
- handwritten
- photographed at an angle

Extract whatever is clearly readable.

For unreadable fields:

return null.

Add an appropriate warning such as:

"Image is blurry"

"Receipt is partially cropped"

"Some numeric fields are difficult to read"

"Handwritten text is unclear"

"Low contrast"

--------------------------------------------------
FIELD DEFINITIONS
--------------------------------------------------

market:

Mandi/market name explicitly printed.

mandi_location:

Mandi location/address explicitly printed.

farmer_name:

Farmer/producer/seller name explicitly printed.

farmer_id:

Farmer ID/account/registration number explicitly printed.

receipt_number:

Receipt/slip/token number explicitly printed.

receipt_date:

Date explicitly printed on the receipt.

Do NOT infer the date from the filename.

commodity:

Crop/commodity name explicitly printed.

Examples:

Wheat
Rice
गेहूँ
धान

variety:

Crop variety/grade explicitly printed.

quantity:

Only the explicitly printed quantity.

unit:

Only the explicitly printed unit.

Examples:

KG
Quintal
Qtl
Ton

price_per_unit:

Only the explicitly printed rate/price.

gross_amount:

Only the explicitly printed gross/total amount.

DO NOT calculate it.

commission:

Only the explicitly printed commission.

deductions:

Only deductions explicitly printed.

Do not calculate them.

net_amount:

Only the explicitly printed net amount.

DO NOT calculate it.

buyer_name:

Buyer/trader name explicitly printed.

seller_name:

Seller/farmer name if separately printed.

vehicle_number:

Vehicle number explicitly printed.

confidence:

Overall OCR confidence from 0 to 100.

field_confidences:

Confidence for each extracted field from 0 to 100.

raw_text:

Only text visibly readable in the receipt.

quality_warnings:

List of image/OCR quality problems.

--------------------------------------------------
OUTPUT FORMAT
--------------------------------------------------

Return ONLY valid JSON.

Do not return markdown.

Do not return explanations.

Use exactly this structure:

{
  "market": null,
  "mandi_location": null,
  "farmer_name": null,
  "farmer_id": null,
  "receipt_number": null,
  "receipt_date": null,
  "commodity": null,
  "variety": null,
  "quantity": null,
  "unit": null,
  "price_per_unit": null,
  "gross_amount": null,
  "commission": null,
  "deductions": null,
  "net_amount": null,
  "buyer_name": null,
  "seller_name": null,
  "vehicle_number": null,
  "confidence": 0,
  "field_confidences": {},
  "raw_text": "",
  "quality_warnings": []
}

Remember:

READ THE RECEIPT.

DO NOT GUESS.

DO NOT INVENT.

DO NOT CALCULATE MISSING VALUES.
`;
}

/* ---------------------------------------------------------
   Single Gemini request
--------------------------------------------------------- */

async function callGemini(
  imageBase64: string,
  mimeType: string,
  model: string
): Promise<ExtractedReceiptData> {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY is not configured. Add GEMINI_API_KEY to .env.local and restart the development server.'
    );
  }

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const controller =
    new AbortController();

  const timeout =
    setTimeout(() => {
      controller.abort();
    }, REQUEST_TIMEOUT_MS);

  try {
    console.log(
      `[Gemini OCR] Sending request to ${model}...`
    );

    const response =
      await fetch(url, {
        method: 'POST',

        headers: {
          'Content-Type':
            'application/json',

          'x-goog-api-key':
            apiKey,
        },

        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: createPrompt(),
                },
                {
                  inlineData: {
                    mimeType,
                    data: imageBase64,
                  },
                },
              ],
            },
          ],

          generationConfig: {
            responseMimeType:
              'application/json',

            /*
             * OCR does not need heavy reasoning.
             * Minimal thinking reduces latency.
             */
            thinkingConfig: {
              thinkingLevel:
                'minimal',
            },
          },
        }),

        signal:
          controller.signal,
      });

    if (!response.ok) {
      const errorText =
        await response.text();

      throw new Error(
        `Gemini API ${response.status}: ${errorText.slice(
          0,
          1500
        )}`
      );
    }

    const result =
      await response.json();

    const text =
      result?.candidates?.[0]
        ?.content?.parts?.[0]
        ?.text;

    if (!text) {
      throw new Error(
        'Gemini returned an empty response.'
      );
    }

    console.log(
      `[Gemini OCR] ${model} response received successfully.`
    );

    /* -----------------------------------------------------
       Parse JSON
    ----------------------------------------------------- */

    let parsed: any;

    try {
      parsed = JSON.parse(text);
    } catch {
      /*
       * Remove accidental markdown code fences.
       */
      const cleaned =
        text
          .replace(
            /^```json\s*/i,
            ''
          )
          .replace(
            /^```\s*/i,
            ''
          )
          .replace(
            /\s*```$/i,
            ''
          )
          .trim();

      try {
        parsed =
          JSON.parse(cleaned);
      } catch {
        throw new Error(
          'Gemini returned invalid JSON.'
        );
      }
    }

    /* -----------------------------------------------------
       Normalize confidence values
    ----------------------------------------------------- */

    const fieldConfidences =
      normalizeFieldConfidences(
        parsed.field_confidences
      );

    /* -----------------------------------------------------
       Build extracted receipt data
    ----------------------------------------------------- */

    const data:
      ExtractedReceiptData = {
      market:
        parsed.market ??
        null,

      mandi_location:
        parsed.mandi_location ??
        null,

      farmer_name:
        parsed.farmer_name ??
        null,

      farmer_id:
        parsed.farmer_id ??
        null,

      receipt_number:
        parsed.receipt_number ??
        null,

      receipt_date:
        parsed.receipt_date ??
        null,

      commodity:
        parsed.commodity ??
        null,

      variety:
        parsed.variety ??
        null,

      quantity:
        toNumber(
          parsed.quantity
        ),

      unit:
        parsed.unit ??
        null,

      price_per_unit:
        toNumber(
          parsed.price_per_unit
        ),

      gross_amount:
        toNumber(
          parsed.gross_amount
        ),

      commission:
        toNumber(
          parsed.commission
        ),

      deductions:
        toNumber(
          parsed.deductions
        ),

      net_amount:
        toNumber(
          parsed.net_amount
        ),

      buyer_name:
        parsed.buyer_name ??
        null,

      seller_name:
        parsed.seller_name ??
        null,

      vehicle_number:
        parsed.vehicle_number ??
        null,

      confidence:
        clampConfidence(
          parsed.confidence
        ),

      field_confidences:
        fieldConfidences,

      raw_text:
        typeof parsed.raw_text ===
        'string'
          ? parsed.raw_text
          : '',

      quality_warnings:
        Array.isArray(
          parsed.quality_warnings
        )
          ? parsed.quality_warnings.map(
              (item: unknown) =>
                String(item)
            )
          : [],

      math_verified:
        false,

      engine_used:
        'gemini',
    };

    /* -----------------------------------------------------
       Verify arithmetic only when all values are printed
    ----------------------------------------------------- */

    data.math_verified =
      calculateMathVerified(
        data
      );

    return data;
  } catch (error) {
    if (
      error instanceof Error &&
      error.name === 'AbortError'
    ) {
      throw new Error(
        `Gemini ${model} timed out after ${
          REQUEST_TIMEOUT_MS /
          1000
        } seconds.`
      );
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

/* ---------------------------------------------------------
   Main Gemini OCR function
--------------------------------------------------------- */

export async function extractWithGeminiVision(
  imageBuffer: Buffer,
  mimeType: string = 'image/jpeg'
): Promise<ExtractedReceiptData> {
  if (
    !imageBuffer ||
    imageBuffer.length === 0
  ) {
    throw new Error(
      'Image buffer is empty.'
    );
  }

  const imageBase64 =
    imageBuffer.toString(
      'base64'
    );

  console.log(
    `[Gemini OCR] Image converted to base64. Size: ${imageBase64.length}`
  );

  let lastError:
    | unknown = null;

  /*
   * Try models one by one.
   */
  for (
    const model of GEMINI_MODELS
  ) {
    console.log(
      `[Gemini OCR] Trying model: ${model}`
    );

    try {
      const result =
        await callGemini(
          imageBase64,
          mimeType,
          model
        );

      console.log(
        `[Gemini OCR] SUCCESS with model: ${model}`
      );

      result.engine_used =
        'gemini';

      return result;
    } catch (error) {
      lastError = error;

      const message =
        error instanceof Error
          ? error.message
          : String(error);

      console.error(
        `[Gemini OCR] ${model} failed: ${message}`
      );

      /*
       * 503:
       * Gemini model temporarily unavailable.
       */
      if (
        message.includes(
          'Gemini API 503'
        )
      ) {
        console.log(
          `[Gemini OCR] ${model} returned 503. Trying fallback model...`
        );

        continue;
      }

      /*
       * 429:
       * Rate limit.
       */
      if (
        message.includes(
          'Gemini API 429'
        )
      ) {
        console.log(
          `[Gemini OCR] ${model} returned 429. Trying fallback model...`
        );

        continue;
      }

      /*
       * Timeout.
       */
      if (
        message.includes(
          'timed out'
        )
      ) {
        console.log(
          `[Gemini OCR] ${model} timed out. Trying fallback model...`
        );

        continue;
      }

      /*
       * Other API errors.
       *
       * We still try the next model so that
       * one model failure doesn't break OCR.
       */
      console.log(
        `[Gemini OCR] Trying next fallback model...`
      );
    }
  }

  throw new Error(
    `All Gemini OCR models failed. Last error: ${
      lastError instanceof Error
        ? lastError.message
        : String(lastError)
    }`
  );
}