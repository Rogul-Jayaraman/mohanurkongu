import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Profile Draft Integration', () => {
  const accountId = '00000000-0000-0000-0000-000000000001';
  const uploadId = '00000000-0000-0000-0000-000000000002';

  beforeAll(async () => {
    await prisma.upload.create({
      data: {
        id: uploadId,
        publicId: 'upl_test01',
        ownerAccountId: accountId,
        objectKey: 'test/file.jpg',
        originalFileName: 'file.jpg',
        mimeType: 'image/jpeg',
        extension: 'jpg',
        size: 1000,
        checksum: 'abc123def456',
        status: 'TEMP',
      },
    });
  });

  afterAll(async () => {
    await prisma.upload.deleteMany({ where: { ownerAccountId: accountId } }).catch(() => {});
    await prisma.profile.deleteMany({ where: { accountId } }).catch(() => {});
    await prisma.$disconnect();
  });

  it('should create a draft profile', async () => {
    const profile = await prisma.profile.create({
      data: { accountId, currentStatus: 'DRAFT', visibility: 'PRIVATE' },
    });

    expect(profile).toBeDefined();
    expect(profile.currentStatus).toBe('DRAFT');
    expect(profile.accountId).toBe(accountId);
  });

  it('should upsert basic section', async () => {
    const profile = await prisma.profile.findFirst({ where: { accountId } });
    expect(profile).toBeDefined();

    const basic = await prisma.profileBasic.upsert({
      where: { profileId: profile!.id },
      create: { profileId: profile!.id, profileForId: 1, gender: 'MALE', dob: new Date('1995-06-15'), diet: 'VEGETARIAN', heightId: 150 },
      update: { gender: 'MALE' },
    });

    expect(basic.gender).toBe('MALE');

    const updated = await prisma.profileBasic.upsert({
      where: { profileId: profile!.id },
      create: { profileId: profile!.id, profileForId: 1, gender: 'FEMALE', dob: new Date('1995-06-15'), diet: 'VEGETARIAN', heightId: 150 },
      update: { gender: 'FEMALE' },
    });

    expect(updated.gender).toBe('FEMALE');
    expect(updated.id).toBe(basic.id);
  });

  it('should attach uploads to draft', async () => {
    const upload = await prisma.upload.findUnique({ where: { id: uploadId } });
    expect(upload).toBeDefined();
    expect(upload!.status).toBe('TEMP');

    await prisma.upload.update({
      where: { id: uploadId },
      data: { status: 'DRAFT' },
    });

    const updated = await prisma.upload.findUnique({ where: { id: uploadId } });
    expect(updated!.status).toBe('DRAFT');
  });

  it('should record state history', async () => {
    const profile = await prisma.profile.findFirst({ where: { accountId } });
    expect(profile).toBeDefined();

    const history = await prisma.profileStateHistory.create({
      data: {
        profileId: profile!.id,
        changedByAccountId: accountId,
        toStatus: 'DRAFT',
      },
    });

    expect(history).toBeDefined();
    expect(history.toStatus).toBe('DRAFT');
  });

  it('should hard delete draft and uploads', async () => {
    const profile = await prisma.profile.findFirst({ where: { accountId } });

    if (profile) {
      await prisma.upload.deleteMany({ where: { id: uploadId } });
      await prisma.profile.delete({ where: { id: profile.id } });

      const deletedProfile = await prisma.profile.findFirst({ where: { accountId } });
      expect(deletedProfile).toBeNull();

      const deletedUpload = await prisma.upload.findUnique({ where: { id: uploadId } });
      expect(deletedUpload).toBeNull();
    }
  });

  describe('Native OTHER location round-trip', () => {
    let locationId: string | null = null;

    afterEach(async () => {
      if (locationId) {
        await prisma.location.deleteMany({ where: { id: locationId } }).catch(() => {});
        locationId = null;
      }
    });

    it('should persist native OTHER fields and return them on resume', async () => {
      const loc = await prisma.location.create({ data: { isOther: true } });
      locationId = loc.id;

      const profile = await prisma.profile.create({
        data: { accountId, currentStatus: 'DRAFT', visibility: 'PRIVATE' },
      });

      await prisma.profileBasic.create({
        data: {
          profileId: profile.id,
          profileForId: 1,
          gender: 'MALE',
          dob: new Date('1995-06-15'),
          diet: 'VEGETARIAN',
          heightId: 150,
          nativeLocationId: loc.id,
        },
      });

      await prisma.profileTranslation.create({
        data: {
          profileId: profile.id,
          language: 'EN',
          firstName: 'Test',
          nativeCity: 'Chennai',
          nativeState: 'Tamil Nadu',
          nativeCountry: 'India',
        },
      });

      await prisma.profileTranslation.create({
        data: {
          profileId: profile.id,
          language: 'TA',
          firstName: 'டெஸ்ட்',
          nativeCity: 'சென்னை',
          nativeState: 'தமிழ்நாடு',
          nativeCountry: 'இந்தியா',
        },
      });

      const saved = await prisma.profile.findFirst({
        where: { id: profile.id },
        include: {
          basic: { include: { nativeLocation: true } },
          translations: true,
        },
      });

      expect(saved?.basic?.nativeLocation?.isOther).toBe(true);
      const enTrans = saved?.translations?.find(t => t.language === 'EN');
      const taTrans = saved?.translations?.find(t => t.language === 'TA');
      expect(enTrans?.nativeCity).toBe('Chennai');
      expect(enTrans?.nativeState).toBe('Tamil Nadu');
      expect(enTrans?.nativeCountry).toBe('India');
      expect(taTrans?.nativeCity).toBe('சென்னை');
      expect(taTrans?.nativeState).toBe('தமிழ்நாடு');
      expect(taTrans?.nativeCountry).toBe('இந்தியா');
    });
  });
});
