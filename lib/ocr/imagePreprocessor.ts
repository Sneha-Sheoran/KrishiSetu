import sharp from 'sharp';

export interface PreprocessingResult {
  processedBuffer: Buffer;
  mimeType: string;
  width: number;
  height: number;
  qualityScore: number;
  warnings: string[];
}

export async function preprocessReceiptImage(
  imageBuffer: Buffer
): Promise<PreprocessingResult> {
  if (!imageBuffer || imageBuffer.length === 0) {
    throw new Error('Empty image buffer.');
  }

  const warnings: string[] = [];

  console.log('[Image Preprocessor] Reading image metadata...');

  const metadata = await sharp(imageBuffer).metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error(
      'Unable to read image dimensions. Invalid image file.'
    );
  }

  const originalWidth = metadata.width;
  const originalHeight = metadata.height;

  console.log(
    `[Image Preprocessor] Original dimensions: ${originalWidth}x${originalHeight}`
  );

  let qualityScore = 1;

  if (originalWidth < 600 || originalHeight < 600) {
    qualityScore -= 0.25;

    warnings.push(
      'Low image resolution may reduce OCR accuracy.'
    );
  }

  if (originalWidth < 400 || originalHeight < 400) {
    qualityScore -= 0.25;

    warnings.push(
      'Very low resolution. Please upload a clearer receipt photo.'
    );
  }

  let pipeline = sharp(imageBuffer).rotate();

  /*
   * Gently enlarge small images.
   */
  if (
    originalWidth < 1400 &&
    originalHeight < 1400
  ) {
    pipeline = pipeline.resize({
      width: Math.round(originalWidth * 1.5),
      height: Math.round(originalHeight * 1.5),
      fit: 'inside',
      kernel: sharp.kernel.lanczos3,
    });
  }

  /*
   * Prevent extremely large images from consuming
   * excessive memory.
   */
  if (
    originalWidth > 2400 ||
    originalHeight > 2400
  ) {
    pipeline = pipeline.resize({
      width: 2200,
      height: 2200,
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  console.log(
    '[Image Preprocessor] Enhancing image for local OCR...'
  );

  const processedBuffer = await pipeline
    .grayscale()
    .normalise()
    .sharpen({
      sigma: 1,
      m1: 0.8,
      m2: 2,
    })
    .png()
    .toBuffer();

  console.log(
    `[Image Preprocessor] Processed image size: ${processedBuffer.length} bytes`
  );

  return {
    processedBuffer,
    mimeType: 'image/png',
    width: originalWidth,
    height: originalHeight,
    qualityScore: Math.max(
      0.2,
      Math.min(1, qualityScore)
    ),
    warnings,
  };
}