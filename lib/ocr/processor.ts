import { preprocessReceiptImage } from './imagePreprocessor';
import { extractWithGeminiVision } from './geminiEngine';
import type { ExtractedReceiptData } from './types';

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  label: string
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(
        new Error(
          `${label} timed out after ${timeoutMs / 1000} seconds.`
        )
      );
    }, timeoutMs);

    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

function calculateFinalConfidence(
  data: ExtractedReceiptData,
  qualityScore: number
): number {
  let confidence = Math.min(
    100,
    Math.max(0, Number(data.confidence) || 0)
  );

  const fieldConfidences =
    data.field_confidences || {};

  const values = Object.values(
    fieldConfidences
  ).filter(
    (fieldValue) =>
      typeof fieldValue === 'number' &&
      Number.isFinite(fieldValue)
  );

  if (values.length > 0) {
    const average =
      values.reduce(
        (sum, fieldValue) =>
          sum + fieldValue,
        0
      ) / values.length;

    confidence = Math.round(
      confidence * 0.5 +
        average * 0.5
    );
  }

  /*
   * Apply image quality to the final confidence.
   *
   * qualityScore is normally between 0.2 and 1.0.
   */
  confidence = Math.round(
    confidence *
      Math.max(
        0.2,
        Math.min(1, qualityScore)
      )
  );

  return Math.min(
    100,
    Math.max(0, confidence)
  );
}

export async function processReceiptPipeline(
  imageBuffer: Buffer,
  originalMimeType: string = 'image/jpeg'
): Promise<{
  status:
    | 'CONFIDENT'
    | 'NEEDS_REVIEW'
    | 'POOR_QUALITY';

  data: ExtractedReceiptData;
}> {
  console.log(
    '[OCR Pipeline] ===== START ====='
  );

  // ==================================================
  // VALIDATE INPUT
  // ==================================================

  if (
    !imageBuffer ||
    imageBuffer.length === 0
  ) {
    throw new Error(
      'Receipt image is empty.'
    );
  }

  console.log(
    `[OCR Pipeline] Image size: ${imageBuffer.length} bytes`
  );

  // ==================================================
  // STEP 1 — IMAGE PREPROCESSING
  // ==================================================

  console.log(
    '[OCR Pipeline] Step 1: preprocessing...'
  );

  const {
    qualityScore,
    warnings,
  } = await withTimeout(
    preprocessReceiptImage(
      imageBuffer
    ),
    10_000,
    'Image preprocessing'
  );

  console.log(
    `[OCR Pipeline] Preprocessing complete. Quality: ${qualityScore}`
  );

  if (warnings.length > 0) {
    console.log(
      '[OCR Pipeline] Image warnings:',
      warnings
    );
  }

  // ==================================================
  // STEP 2 — CHECK GEMINI API KEY
  // ==================================================

  const hasGeminiKey = Boolean(
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY
  );

  if (!hasGeminiKey) {
    throw new Error(
      'GEMINI_API_KEY is not configured. ' +
        'Add GEMINI_API_KEY to .env.local ' +
        'and restart the development server.'
    );
  }

  console.log(
    '[OCR Pipeline] Gemini API key detected.'
  );

  // ==================================================
  // STEP 3 — GEMINI VISION OCR
  // ==================================================

  console.log(
    '[OCR Pipeline] Step 2: sending receipt to Gemini Vision...'
  );

  let extractedData:
    ExtractedReceiptData;

  try {
    /*
     * IMPORTANT:
     *
     * Do NOT wrap this in another 50-second timeout.
     *
     * geminiEngine.ts now controls:
     * - request timeout
     * - AbortController cancellation
     * - retries
     * - fallback model
     *
     * Adding another timeout here was causing:
     *
     * "Gemini Vision OCR timed out after 50 seconds"
     *
     * while Gemini was still running.
     */
    extractedData =
      await extractWithGeminiVision(
        imageBuffer,
        originalMimeType
      );

  } catch (error) {
    console.error(
      '[OCR Pipeline] Gemini failed:',
      error
    );

    throw new Error(
      error instanceof Error
        ? `Gemini OCR failed: ${error.message}`
        : 'Gemini OCR failed.'
    );
  }

  console.log(
    '[OCR Pipeline] Gemini extraction successful.'
  );

  // ==================================================
  // STEP 4 — FINAL CONFIDENCE
  // ==================================================

  console.log(
    '[OCR Pipeline] Step 3: calculating confidence...'
  );

  extractedData.confidence =
    calculateFinalConfidence(
      extractedData,
      qualityScore
    );

  // ==================================================
  // STEP 5 — QUALITY WARNINGS
  // ==================================================

  if (
    !extractedData.quality_warnings
  ) {
    extractedData.quality_warnings =
      [];
  }

  if (warnings.length > 0) {
    extractedData.quality_warnings.push(
      ...warnings
    );
  }

  /*
   * Remove duplicate warnings.
   */
  extractedData.quality_warnings = [
    ...new Set(
      extractedData.quality_warnings
    ),
  ];

  // ==================================================
  // STEP 6 — DETERMINE STATUS
  // ==================================================

  let status:
    | 'CONFIDENT'
    | 'NEEDS_REVIEW'
    | 'POOR_QUALITY' =
    'NEEDS_REVIEW';

  /*
   * CONFIDENT:
   *
   * High OCR confidence AND
   * printed quantity/rate/gross
   * arithmetic was verified.
   */
  if (
    extractedData.confidence >= 85 &&
    extractedData.math_verified === true
  ) {
    status = 'CONFIDENT';
  }

  /*
   * POOR QUALITY:
   *
   * Very low confidence.
   */
  else if (
    extractedData.confidence < 50
  ) {
    status = 'POOR_QUALITY';
  }

  /*
   * Otherwise:
   * NEEDS_REVIEW
   */

  // ==================================================
  // LOG FINAL RESULT
  // ==================================================

  console.log(
    `[OCR Pipeline] Final confidence: ${extractedData.confidence}`
  );

  console.log(
    `[OCR Pipeline] Math verified: ${extractedData.math_verified}`
  );

  console.log(
    `[OCR Pipeline] Status: ${status}`
  );

  console.log(
    `[OCR Pipeline] Engine: ${extractedData.engine_used}`
  );

  console.log(
    '[OCR Pipeline] ===== END ====='
  );

  // ==================================================
  // RETURN RESULT
  // ==================================================

  return {
    status,
    data: extractedData,
  };
}