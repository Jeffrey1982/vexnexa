/**
 * Zero-dependency image dimension reader for PNG, JPEG, and SVG buffers.
 * Used to compute aspect-ratio-preserving logo sizes for DOCX export.
 */

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface LogoSize {
  width: number;
  height: number;
}

/* ═══════════════════════════════════════════════════════════
   Read native dimensions from buffer
   ═══════════════════════════════════════════════════════════ */

/**
 * Detect native pixel dimensions from a PNG, JPEG, or SVG buffer.
 * Returns null if the format is unrecognised or dimensions cannot be read.
 */
export function getImageDimensions(buffer: Buffer): ImageDimensions | null {
  if (buffer.length < 8) return null;

  // PNG: bytes 0-7 are signature, IHDR chunk starts at byte 8
  // Width at offset 16 (4 bytes BE), Height at offset 20 (4 bytes BE)
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    if (buffer.length < 24) return null;
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    if (width > 0 && height > 0) return { width, height };
    return null;
  }

  // JPEG: starts with FF D8
  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    return readJpegDimensions(buffer);
  }

  // SVG: try parsing as text
  const head = buffer.subarray(0, Math.min(buffer.length, 2048)).toString("utf-8");
  if (head.includes("<svg")) {
    return parseSvgDimensions(head);
  }

  return null;
}

/* ── JPEG parser ── */

function readJpegDimensions(buffer: Buffer): ImageDimensions | null {
  let offset = 2; // skip FF D8
  while (offset < buffer.length - 1) {
    if (buffer[offset] !== 0xff) break;
    const marker = buffer[offset + 1];

    // SOF markers: C0-C3, C5-C7, C9-CB, CD-CF
    if (
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf)
    ) {
      if (offset + 9 > buffer.length) return null;
      const height = buffer.readUInt16BE(offset + 5);
      const width = buffer.readUInt16BE(offset + 7);
      if (width > 0 && height > 0) return { width, height };
      return null;
    }

    // Skip non-SOF markers
    if (offset + 3 >= buffer.length) break;
    const segLen = buffer.readUInt16BE(offset + 2);
    offset += 2 + segLen;
  }
  return null;
}

/* ── SVG parser ── */

function parseSvgDimensions(svgText: string): ImageDimensions | null {
  // Try viewBox first: viewBox="minX minY width height"
  const vbMatch = svgText.match(/viewBox\s*=\s*["']([^"']+)["']/i);
  if (vbMatch) {
    const parts = vbMatch[1].trim().split(/[\s,]+/).map(Number);
    if (parts.length >= 4 && parts[2] > 0 && parts[3] > 0) {
      return { width: parts[2], height: parts[3] };
    }
  }

  // Try explicit width/height attributes
  const wMatch = svgText.match(/<svg[^>]*\bwidth\s*=\s*["'](\d+(?:\.\d+)?)/i);
  const hMatch = svgText.match(/<svg[^>]*\bheight\s*=\s*["'](\d+(?:\.\d+)?)/i);
  if (wMatch && hMatch) {
    const w = parseFloat(wMatch[1]);
    const h = parseFloat(hMatch[1]);
    if (w > 0 && h > 0) return { width: w, height: h };
  }

  return null;
}

/* ═══════════════════════════════════════════════════════════
   Compute aspect-ratio-preserving logo size for DOCX
   ═══════════════════════════════════════════════════════════ */

const DEFAULT_HEIGHT = 32;
const MIN_HEIGHT = 24;
const MAX_HEIGHT = 36;
const MAX_WIDTH = 200;
const MAX_ASPECT_RATIO = 6; // width/height cap for extremely wide logos

/**
 * Compute target logo dimensions for DOCX embedding.
 * Preserves aspect ratio, clamps to safe bounds.
 *
 * @param buffer - The image buffer
 * @returns { width, height } in pixels for ImageRun transformation
 */
export function computeLogoDimensions(buffer: Buffer): LogoSize {
  const native = getImageDimensions(buffer);

  if (!native) {
    // Cannot detect — use safe defaults
    return { width: 120, height: DEFAULT_HEIGHT };
  }

  const aspectRatio = native.width / native.height;

  // Clamp extremely wide logos
  const effectiveRatio = Math.min(aspectRatio, MAX_ASPECT_RATIO);

  // Start with height clamped to [MIN_HEIGHT, MAX_HEIGHT]
  let targetHeight = Math.round(
    Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, native.height))
  );
  // Use DEFAULT_HEIGHT if native is larger than max (scale down)
  if (native.height > MAX_HEIGHT) {
    targetHeight = DEFAULT_HEIGHT;
  }

  let targetWidth = Math.round(targetHeight * effectiveRatio);

  // If width exceeds max, clamp and recompute height
  if (targetWidth > MAX_WIDTH) {
    targetWidth = MAX_WIDTH;
    targetHeight = Math.round(targetWidth / effectiveRatio);
    // Ensure height stays within bounds
    targetHeight = Math.max(MIN_HEIGHT, targetHeight);
  }

  // Final safety: ensure at least 1px
  return {
    width: Math.max(1, targetWidth),
    height: Math.max(1, targetHeight),
  };
}
