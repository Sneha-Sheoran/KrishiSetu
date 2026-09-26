import { NextResponse } from 'next/server';
import { processReceiptPipeline } from '@/lib/ocr/processor';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 75;

const MAX_SIZE_BYTES = 15 * 1024 * 1024;
const OCR_TIMEOUT_MS = 55_000;

export async function POST(request: Request) {
  console.log('[OCR API] ===== REQUEST START =====');

  try {
    // --------------------------------------------------
    // 1. Validate Content-Type
    // --------------------------------------------------

    const contentType =
      request.headers.get('content-type') || '';

    console.log(
      `[OCR API] Content-Type: ${contentType}`
    );

    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Invalid request. Please upload a receipt using multipart/form-data.',
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 2. Read FormData
    // --------------------------------------------------

    console.log('[OCR API] Reading form data...');

    const formData = await request.formData();

    /*
     * Your frontend currently appears to use "receipt".
     * We also accept file/image as a safety fallback.
     */
    const uploaded =
      formData.get('receipt') ??
      formData.get('file') ??
      formData.get('image');

    if (!(uploaded instanceof File)) {
      console.error(
        '[OCR API] No valid File object found.'
      );

      return NextResponse.json(
        {
          success: false,
          error:
            'No receipt file was provided in the upload.',
        },
        { status: 400 }
      );
    }

    const file = uploaded;

    console.log(
      `[OCR API] File received: ${file.name}`
    );

    console.log(
      `[OCR API] File type: ${file.type}`
    );

    console.log(
      `[OCR API] File size: ${file.size} bytes`
    );

    // --------------------------------------------------
    // 3. Validate File Size
    // --------------------------------------------------

    if (file.size === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'The uploaded receipt file is empty.',
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Receipt image exceeds the 15MB limit. Please upload a smaller image.',
        },
        { status: 413 }
      );
    }

    // --------------------------------------------------
    // 4. Validate MIME Type
    // --------------------------------------------------

    if (
      file.type &&
      !file.type.startsWith('image/')
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Invalid file format. Please upload JPG, PNG, WebP, or another supported image.',
        },
        { status: 415 }
      );
    }

    // --------------------------------------------------
    // 5. Convert File → Buffer
    // --------------------------------------------------

    console.log('[OCR API] Converting image to buffer...');

    const arrayBuffer = await file.arrayBuffer();

    const buffer = Buffer.from(arrayBuffer);

    if (!buffer.length) {
      return NextResponse.json(
        {
          success: false,
          error: 'The uploaded receipt contains no image data.',
        },
        { status: 400 }
      );
    }

    console.log(
      `[OCR API] Buffer created: ${buffer.length} bytes`
    );

    // --------------------------------------------------
    // 6. Run OCR Pipeline With Hard Timeout
    // --------------------------------------------------

    console.log(
      '[OCR API] Starting receipt OCR pipeline...'
    );

    const timeoutPromise = new Promise<never>(
      (_, reject) => {
        setTimeout(() => {
          reject(
            new Error(
              'Receipt processing timed out after 55 seconds. Please upload a clearer receipt image and try again.'
            )
          );
        }, OCR_TIMEOUT_MS);
      }
    );

    const pipelinePromise = processReceiptPipeline(
      buffer,
      file.type || 'image/jpeg'
    );

    const result = await Promise.race([
      pipelinePromise,
      timeoutPromise,
    ]);

    // --------------------------------------------------
    // 7. Successful Response
    // --------------------------------------------------

    console.log(
      `[OCR API] OCR completed successfully. Status: ${result.status}`
    );

    console.log(
      `[OCR API] Confidence: ${result.data.confidence}`
    );

    console.log(
      `[OCR API] Engine: ${result.data.engine_used}`
    );

    console.log('[OCR API] ===== REQUEST SUCCESS =====');

    return NextResponse.json(
      {
        success: true,
        status: result.status,
        data: result.data,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error(
      '[OCR API] ===== REQUEST FAILED ====='
    );

    console.error(
      '[OCR API] Error:',
      error
    );

    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Failed to process receipt image. Please verify the image and try again.';

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}