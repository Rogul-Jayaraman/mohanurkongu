import sharp from 'sharp';

const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'];
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const BLOCKED_EXTENSIONS = ['svg', 'html', 'htm', 'exe', 'bat', 'cmd', 'sh', 'js', 'zip', 'gif', 'pdf'];

const MAGIC_BYTES: Array<{ label: string; bytes: number[]; offset: number }> = [
  { label: 'jpeg', bytes: [0xFF, 0xD8, 0xFF], offset: 0 },
  { label: 'png', bytes: [0x89, 0x50, 0x4E, 0x47], offset: 0 },
  { label: 'webp', bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 },
  { label: 'heic', bytes: [0x66, 0x74, 0x79, 0x70], offset: 4 },
  { label: 'heif', bytes: [0x66, 0x74, 0x79, 0x70], offset: 4 },
  { label: 'gif', bytes: [0x47, 0x49, 0x46], offset: 0 },
  { label: 'pdf', bytes: [0x25, 0x50, 0x44, 0x46], offset: 0 },
  { label: 'exe', bytes: [0x4D, 0x5A], offset: 0 },
];

const MAX_PIXELS = 100_000_000;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export interface ValidationResult {
  valid: boolean;
  mimeType: string | null;
  extension: string | null;
  width: number | null;
  height: number | null;
  error: string | null;
}

export async function validateImage(filePath: string, originalName: string, mimeHeader: string): Promise<ValidationResult> {
  const ext = originalName.split('.').pop()?.toLowerCase() || '';

  const blocked = BLOCKED_EXTENSIONS.some(b => ext === b);
  if (blocked) return { valid: false, mimeType: null, extension: null, width: null, height: null, error: `Extension .${ext} is blocked` };

  const extAllowed = ALLOWED_EXTENSIONS.some(a => ext === a);
  if (!extAllowed) return { valid: false, mimeType: null, extension: null, width: null, height: null, error: `Extension .${ext} is not supported` };

  const mimeAllowed = ALLOWED_MIMES.some(m => m === mimeHeader);
  if (!mimeAllowed) return { valid: false, mimeType: null, extension: null, width: null, height: null, error: `MIME type ${mimeHeader} is not supported` };

  const magicResult = await checkMagicBytes(filePath, ext);
  if (!magicResult.valid) return { valid: false, mimeType: null, extension: null, width: null, height: null, error: magicResult.error || 'Magic byte validation failed' };

  const metadata = await sharp(filePath).metadata();
  if (!metadata.width || !metadata.height) {
    return { valid: false, mimeType: null, extension: null, width: null, height: null, error: 'Could not read image dimensions' };
  }

  const totalPixels = metadata.width * metadata.height;
  if (totalPixels > MAX_PIXELS) {
    return { valid: false, mimeType: null, extension: null, width: null, height: null, error: `Image resolution ${totalPixels.toLocaleString()}px exceeds limit of ${MAX_PIXELS.toLocaleString()}px` };
  }

  const stat = await import('node:fs/promises').then(m => m.stat(filePath));
  if (stat.size > MAX_FILE_SIZE) {
    return { valid: false, mimeType: null, extension: null, width: null, height: null, error: `File too large (max ${(MAX_FILE_SIZE / 1024 / 1024).toFixed(0)}MB)` };
  }

  return {
    valid: true,
    mimeType: mimeHeader,
    extension: ext,
    width: metadata.width,
    height: metadata.height,
    error: null,
  };
}

async function checkMagicBytes(filePath: string, ext: string): Promise<{ valid: boolean; error: string | null }> {
  const fs = await import('node:fs/promises');
  const handle = await fs.open(filePath, 'r');
  try {
    const buf = Buffer.alloc(12);
    await handle.read(buf, 0, 12, 0);

    const jpegOk = buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF;
    const pngOk = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47;
    const riffOk = buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46;
    const webpOk = riffOk && buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50;
    const heicFtyp = buf[4] === 0x66 && buf[5] === 0x74 && buf[6] === 0x79 && buf[7] === 0x70;
    const heicOk = heicFtyp && (buf[8] === 0x68 || buf[8] === 0x6D);
    const gifOk = buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46;
    const exeOk = buf[0] === 0x4D && buf[1] === 0x5A;
    const pdfOk = buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46;
    const mzOk = exeOk;

    const isImage = jpegOk || pngOk || webpOk || heicOk;
    const isBlocked = gifOk || pdfOk || mzOk;

    if (isBlocked) {
      return { valid: false, error: 'File content is a blocked format' };
    }

    if (!isImage) {
      return { valid: false, error: 'File content does not match any supported image format' };
    }

    if (ext === 'heic' || ext === 'heif') {
      if (!heicOk) return { valid: false, error: 'HEIC/HEIF extension but file content is not HEIC/HEIF' };
    } else if (ext === 'webp') {
      if (!webpOk) return { valid: false, error: 'WEBP extension but file content is not WEBP' };
    } else if (['jpg', 'jpeg'].includes(ext)) {
      if (!jpegOk) return { valid: false, error: 'JPEG extension but file content is not JPEG' };
    } else if (ext === 'png') {
      if (!pngOk) return { valid: false, error: 'PNG extension but file content is not PNG' };
    }

    return { valid: true, error: null };
  } finally {
    await handle.close();
  }
}
