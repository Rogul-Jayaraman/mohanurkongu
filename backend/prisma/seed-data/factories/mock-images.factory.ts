import type { PrismaClient } from '@prisma/client';
import sharp from 'sharp';
import path from 'node:path';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import { progressBar } from '../helpers.js';

const STORAGE_DIR = process.env.STORAGE_DIR || path.join(process.cwd(), '..', 'storage');

const MAX_PROFILE_IMAGES = 100;
const MAX_GALLERY_IMAGES = 60;
const MAX_HOROSCOPE_IMAGES = 30;

interface ImageConfig {
  maxWidth: number | null;
  maxHeight: number | null;
  maxDimension: number | null;
  quality: number;
}

const CATEGORY_CONFIGS: Record<string, ImageConfig> = {
  profiles: { maxWidth: 1800, maxHeight: 2400, maxDimension: null, quality: 90 },
  gallery: { maxWidth: null, maxHeight: null, maxDimension: 2200, quality: 90 },
  horoscope: { maxWidth: null, maxHeight: null, maxDimension: 3000, quality: 95 },
};

const MALE_URLS = Array.from({ length: 99 }, (_, i) => `https://randomuser.me/api/portraits/men/${i + 1}.jpg`);
const FEMALE_URLS = Array.from({ length: 99 }, (_, i) => `https://randomuser.me/api/portraits/women/${i + 1}.jpg`);

let maleIdx = 0;
let femaleIdx = 0;
let gallerySeed = 1;

function generateUploadToken(): string {
  const bytes = crypto.randomBytes(6);
  return `upl_${bytes.toString('hex')}`;
}

async function computeChecksum(filePath: string): Promise<string> {
  const content = await fs.readFile(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

async function fetchImage(url: string): Promise<Buffer> {
  const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
  return Buffer.from(await response.arrayBuffer());
}

async function downloadWithRetry(url: string, retries = 2): Promise<Buffer | null> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      await new Promise(r => setTimeout(r, 200));
      return await fetchImage(url);
    } catch {
      if (attempt < retries - 1) await new Promise(r => setTimeout(r, 1000));
    }
  }
  return null;
}

async function downloadProfileImage(gender: string): Promise<Buffer | null> {
  const urls = gender === 'FEMALE' ? FEMALE_URLS : MALE_URLS;
  const idx = gender === 'FEMALE' ? femaleIdx : maleIdx;
  if (gender === 'FEMALE') femaleIdx = (femaleIdx + 1) % FEMALE_URLS.length;
  else maleIdx = (maleIdx + 1) % MALE_URLS.length;
  return downloadWithRetry(urls[idx % urls.length]);
}

async function downloadGalleryImage(): Promise<Buffer | null> {
  const url = `https://picsum.photos/seed/${gallerySeed++}/800/1000`;
  return downloadWithRetry(url);
}

async function generateHoroscopeChart(): Promise<Buffer> {
  const size = 600;
  const rasiLabels = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  const colors = ['#D4AF37', '#8B4513', '#C41E3A', '#2F4F4F', '#6B4423', '#4A6741'];
  const bgColor = '#F5EFE1';
  const accentColor = colors[Math.floor(Math.random() * colors.length)];

  const cells: string[] = [];
  const positions = [
    [0.15, 0.15], [0.55, 0.15],
    [0.15, 0.55], [0.55, 0.55],
  ];

  const numbers = [...Array(12)].map((_, i) => i + 1).sort(() => Math.random() - 0.5);

  positions.forEach(([x, y], i) => {
    const cx = Math.round(size * x);
    const cy = Math.round(size * y);
    const num = numbers[i];
    cells.push(`<circle cx="${cx}" cy="${cy}" r="${Math.round(size * 0.045)}" fill="${accentColor}" opacity="0.15"/>`);
    cells.push(`<text x="${cx}" y="${cy + Math.round(size * 0.007)}" text-anchor="middle" font-size="${Math.round(size * 0.025)}" fill="${accentColor}" font-weight="bold" font-family="serif">${num}</text>`);
  });

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <rect width="${size}" height="${size}" fill="${bgColor}" rx="${Math.round(size * 0.02)}"/>
    <rect x="${Math.round(size * 0.08)}" y="${Math.round(size * 0.08)}" width="${Math.round(size * 0.84)}" height="${Math.round(size * 0.84)}" fill="none" stroke="${accentColor}" stroke-width="2" rx="${Math.round(size * 0.01)}" opacity="0.4"/>
    <line x1="${Math.round(size * 0.08)}" y1="${Math.round(size * 0.5)}" x2="${Math.round(size * 0.92)}" y2="${Math.round(size * 0.5)}" stroke="${accentColor}" stroke-width="1" opacity="0.3"/>
    <line x1="${Math.round(size * 0.5)}" y1="${Math.round(size * 0.08)}" x2="${Math.round(size * 0.5)}" y2="${Math.round(size * 0.92)}" stroke="${accentColor}" stroke-width="1" opacity="0.3"/>
    ${cells.join('\n    ')}
  </svg>`;

  return sharp(Buffer.from(svg)).webp({ quality: 95 }).toBuffer();
}

async function processImageBuffer(
  buffer: Buffer,
  category: string,
  outputPath: string,
): Promise<{ width: number; height: number; size: number }> {
  const config = CATEGORY_CONFIGS[category];
  const metadata = await sharp(buffer).metadata();
  let targetWidth = metadata.width || 0;
  let targetHeight = metadata.height || 0;

  if (config.maxDimension) {
    const maxDim = config.maxDimension;
    if (targetWidth > maxDim || targetHeight > maxDim) {
      const scale = Math.min(maxDim / targetWidth, maxDim / targetHeight);
      targetWidth = Math.round(targetWidth * scale);
      targetHeight = Math.round(targetHeight * scale);
    }
  } else if (config.maxWidth && config.maxHeight) {
    const maxPixels = config.maxWidth * config.maxHeight;
    const currentPixels = targetWidth * targetHeight;
    if (currentPixels > maxPixels) {
      const scale = Math.min(1, Math.sqrt(maxPixels / currentPixels));
      targetWidth = Math.round(targetWidth * scale);
      targetHeight = Math.round(targetHeight * scale);
    }
    targetWidth = Math.min(targetWidth, config.maxWidth);
    targetHeight = Math.min(targetHeight, config.maxHeight);
  }

  await sharp(buffer)
    .rotate()
    .resize(targetWidth, targetHeight, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: config.quality, effort: 4 })
    .toFile(outputPath);

  const stat = await fs.stat(outputPath);
  return { width: targetWidth, height: targetHeight, size: stat.size };
}

function getObjectKey(category: string, uploadToken: string): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `${category}/${year}/${month}/${uploadToken}.webp`;
}

async function createUploadRecord(
  prisma: PrismaClient,
  buffer: Buffer,
  category: string,
  ownerAccountId: string,
): Promise<{ uploadId: string; objectKey: string }> {
  const uploadToken = generateUploadToken();
  const objectKey = getObjectKey(category, uploadToken);
  const destPath = path.join(STORAGE_DIR, objectKey);

  await fs.mkdir(path.dirname(destPath), { recursive: true });
  const { width, height, size } = await processImageBuffer(buffer, category, destPath);
  const checksum = await computeChecksum(destPath);

  const upload = await prisma.upload.create({
    data: {
      publicId: uploadToken,
      uploadToken,
      ownerAccountId,
      objectKey,
      originalFileName: `${uploadToken}.webp`,
      mimeType: 'image/webp',
      extension: 'webp',
      size,
      checksum,
      status: 'ACTIVE',
      version: 1,
      width,
      height,
    },
  });

  return { uploadId: upload.id, objectKey };
}

function getGenderFromProfile(profile: any, accountIndex: Record<number, any>): string {
  const accEntry = Object.values(accountIndex).find((ai: any) => ai.account.id === profile.accountId);
  return (accEntry as any)?.plan?.gender || 'MALE';
}

export async function seedMockImages(
  prisma: PrismaClient,
  accountIndex: Record<number, any>,
  profileIndex: Record<string, any>,
) {
  console.log('\n   → Downloading & processing profile photos...');

  const profileEntries = Object.values(profileIndex).filter(
    (p: any) => (p.status === 'ACTIVE' || p.status === 'PENDING') && p.hasPrimaryPhoto,
  );

  const targetProfiles = profileEntries.slice(0, MAX_PROFILE_IMAGES);
  let profileOk = 0;
  let profileFail = 0;

  for (const profile of targetProfiles) {
    const gender = getGenderFromProfile(profile, accountIndex);
    try {
      const imgBuffer = await downloadProfileImage(gender);
      if (!imgBuffer) { profileFail++; continue; }

      const { uploadId } = await createUploadRecord(prisma, imgBuffer, 'profiles', profile.accountId);

      const existingPhoto = await prisma.profilePhoto.findFirst({
        where: { profileId: profile.profile.id },
      });
      if (existingPhoto) {
        await prisma.profilePhoto.update({
          where: { id: existingPhoto.id },
          data: { primaryUploadId: uploadId },
        });
      }
      profileOk++;
    } catch { profileFail++; }
    progressBar(profileOk + profileFail, targetProfiles.length, 'Profile Photos');
  }
  console.log(`   Profile photos: ${profileOk} OK, ${profileFail} failed\n`);

  // ── Gallery images ──
  console.log('   → Downloading gallery photos...');
  const galleryProfiles = targetProfiles.filter((p: any) => {
    const accEntry = Object.values(accountIndex).find((ai: any) => ai.account.id === p.accountId);
    const plan = (accEntry as any)?.plan;
    return plan?.gender !== 'FEMALE';
  });

  let galleryTotal = 0;
  let galleryOk = 0;
  let galleryFail = 0;

  for (let g = 0; g < MAX_GALLERY_IMAGES && g < galleryProfiles.length * 2; g++) {
    const profile = galleryProfiles[g % galleryProfiles.length];
    try {
      const imgBuffer = await downloadGalleryImage();
      if (!imgBuffer) { galleryFail++; continue; }

      const { uploadId } = await createUploadRecord(prisma, imgBuffer, 'gallery', profile.accountId);

      const existingPhoto = await prisma.profilePhoto.findFirst({
        where: { profileId: profile.profile.id },
      });
      if (existingPhoto) {
        await prisma.profileGalleryPhoto.create({
          data: { profilePhotoId: existingPhoto.id, uploadId },
        });
      }
      galleryOk++;
    } catch { galleryFail++; }
    galleryTotal++;
    progressBar(galleryTotal, MAX_GALLERY_IMAGES, 'Gallery Photos');
  }
  console.log(`   Gallery photos: ${galleryOk} OK, ${galleryFail} failed\n`);

  // ── Horoscope chart images ──
  console.log('   → Generating horoscope chart images...');
  const horoscopeProfiles = targetProfiles.filter((p: any) => p.hasHoroscope).slice(0, MAX_HOROSCOPE_IMAGES);
  let horoscopeOk = 0;

  for (const profile of horoscopeProfiles) {
    try {
      const existingHoro = await prisma.profileHoroscope.findFirst({
        where: { profileId: profile.profile.id },
      });
      if (!existingHoro || existingHoro.mode === 'GENERATED') continue;

      const chartBuffer = await generateHoroscopeChart();
      const { uploadId: rasiUploadId } = await createUploadRecord(prisma, chartBuffer, 'horoscope', profile.accountId);
      const chartBuffer2 = await generateHoroscopeChart();
      const { uploadId: navamsaUploadId } = await createUploadRecord(prisma, chartBuffer2, 'horoscope', profile.accountId);

      await prisma.profileHoroscope.update({
        where: { id: existingHoro.id },
        data: {
          rasiChartUploadId: rasiUploadId,
          navamsaChartUploadId: navamsaUploadId,
        },
      });
      horoscopeOk++;
    } catch { /* skip */ }
    progressBar(horoscopeOk, horoscopeProfiles.length, 'Horoscope Charts');
  }
  console.log(`   Horoscope charts: ${horoscopeOk} generated\n`);

  const totalImages = profileOk + galleryOk + horoscopeOk;
  console.log(`  ✅ Mock images seeded: ${totalImages} total files written to ${STORAGE_DIR}`);
  if (profileFail > 0 || galleryFail > 0) {
    console.log(`  ⚠  ${profileFail + galleryFail} downloads failed (network issue — continuing)`);
  }
}
