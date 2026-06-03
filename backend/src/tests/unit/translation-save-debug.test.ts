import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { ProfileUpsertService } from '../../modules/profile/profile-upsert.service.js';

const prisma = new PrismaClient();
const upsertService = new ProfileUpsertService();

const accountId = '00000000-0000-0000-0000-000000000099';

describe('Translation Save Debug', () => {
  let profileId: string;

  beforeAll(async () => {
    await prisma.account.upsert({
      where: { id: accountId },
      update: {},
      create: {
        id: accountId,
        accountNo: 'ACC099',
        credential: {
          create: { email: 'debug99@test.com', passwordHash: 'hash' },
        },
      },
    });
  });

  afterAll(async () => {
    await prisma.profileTranslation.deleteMany({ where: { profileId } }).catch(() => {});
    await prisma.profileBasic.deleteMany({ where: { profileId } }).catch(() => {});
    await prisma.profile.deleteMany({ where: { id: profileId } }).catch(() => {});
    await prisma.account.deleteMany({ where: { id: accountId } }).catch(() => {});
    await prisma.$disconnect();
  });

  it('should save translations via upsertSections and read them back', async () => {
    // Step 1: Create profile
    const profile = await prisma.profile.create({
      data: { accountId, currentStatus: 'DRAFT' },
    });
    profileId = profile.id;

    // Step 2: Call upsertSections with translations
    const sections = {
      basic: {
        profileFor: 'MYSELF',
        gender: 'MALE',
        dob: '2004-10-15T00:00:00.000Z',
        diet: 'VEGETARIAN',
        bloodGroup: 'A_POSITIVE',
        height: 123,
        weight: 52,
        complexion: 'DARK',
        maritalStatus: 'NEVER_MARRIED',
        currentDistrict: 'CHENNAI',
        currentTaluk: 'AYANAVARAM',
        currentCityEn: 'AYANAVARAM',
        currentCityTa: 'அயனாவரம்',
        currentStateEn: 'Tamil Nadu',
        currentStateTa: 'தமிழ்நாடு',
        currentCountryEn: 'India',
        currentCountryTa: 'இந்தியா',
        nativeDistrict: 'VELLORE',
        nativeTaluk: 'PERNAMBUT',
        nativeCityEn: null,
        nativeCityTa: null,
        nativeStateEn: null,
        nativeStateTa: null,
        nativeCountryEn: null,
        nativeCountryTa: null,
      },
      community: { community: 'Kongu Vellalar', caste: 'BC', kulam: 'AATHE_KULAM' },
      professional: { education: null, jobSector: null, jobDetail: null, companyName: null, jobLocationEn: null, jobLocationTa: null, monthlySalary: null },
      family: { fatherAlive: true, fatherName: null, fatherJob: null, fatherSalary: null, motherAlive: true, motherName: null, motherJob: null, motherSalary: null, noOfBrother: 0, noOfSister: 0 },
    };

    const photos = { primaryUploadId: null, primaryUploadUrl: null, galleryUploadIds: [], galleryUploadUrls: [] };

    const translations = [
      {
        language: 'EN',
        firstName: 'Rogul',
        lastName: 'Jayaraman',
        kuladeivam: null,
        fatherName: null,
        motherName: null,
        jobLocation: null,
      },
      {
        language: 'TA',
        firstName: 'ரோகுல்',
        lastName: 'ஜெயராமன்',
        kuladeivam: null,
        fatherName: null,
        motherName: null,
        jobLocation: null,
      },
    ];

    await prisma.$transaction(async (tx) => {
      await upsertService.upsertSections(tx, profileId, sections, photos, translations);
    });

    // Step 3: Read back and verify
    const saved = await prisma.profile.findUnique({
      where: { id: profileId },
      include: { translations: true },
    });

    console.log('[TEST] saved translations:', JSON.stringify(saved?.translations, null, 2));

    const enTrans = saved?.translations?.find(t => t.language === 'EN');
    const taTrans = saved?.translations?.find(t => t.language === 'TA');

    // Assertions
    expect(enTrans).toBeDefined();
    expect(taTrans).toBeDefined();
    expect(enTrans?.firstName).toBe('Rogul');
    expect(enTrans?.lastName).toBe('Jayaraman');
    expect(taTrans?.firstName).toBe('ரோகுல்');
    expect(taTrans?.lastName).toBe('ஜெயராமன்');

    // Location fields should also be correct
    expect(enTrans?.currentCity).toBe('AYANAVARAM');
    expect(taTrans?.currentCity).toBe('அயனாவரம்');
  });
});
