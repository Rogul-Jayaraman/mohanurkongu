import { describe, it, expect } from 'vitest';
import { saveDraftSchema } from '../../modules/profile/dto/save-draft.dto.js';
import { createProfileSchema } from '../../modules/profile/dto/create-profile.dto.js';

describe('Translation Save: Schema Parse Test', () => {
  const requestBody = {
    basic: {
      profileFor: 'MYSELF',
      gender: 'MALE',
      dob: '2004-10-15',
      diet: 'VEGETARIAN',
      bloodGroup: 'A_POSITIVE',
      height: 123,
      weight: 52,
      complexion: 'DARK',
      maritalStatus: 'NEVER_MARRIED',
      currentDistrict: 'CHENNAI',
      currentTaluk: 'AYANAVARAM',
      currentCityEn: 'AYANAVARAM',
      currentCityTa: '\u0B85\u0BAF\u0BA9\u0BBE\u0BB5\u0BB0\u0BAE\u0BCD',
      currentStateEn: 'Tamil Nadu',
      currentStateTa: '\u0BA4\u0BAE\u0BBF\u0BB4\u0BCD\u0BA8\u0BBE\u0B9F\u0BC1',
      currentCountryEn: 'India',
      currentCountryTa: '\u0B87\u0BA8\u0BCD\u0BA4\u0BBF\u0BAF\u0BBE',
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
    horoscope: { mode: null, rasi: null, nakshatra: null, lagna: null, rasiChartUploadId: null, navamsaChartUploadId: null, horoscopeJson: null },
    photos: { primaryUploadId: null, galleryUploadIds: [] },
    assets: { landEn: null, landTa: null, residenceType: null, otherAssetsEn: null, otherAssetsTa: null, vehicle: null },
    partnerPreference: { ageMin: 21, ageMax: 40, heightMinId: 122, heightMaxId: 231, monthlySalary: null, expectationNoteEn: null, preferredLocationEn: null, preferredLocationTa: null },
    translations: [
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
        firstName: '\u0BB0\u0BCB\u0B95\u0BC1\u0BB2\u0BCD',
        lastName: '\u0B9C\u0BC6\u0BAF\u0BB0\u0BBE\u0BAE\u0BA9\u0BCD',
        kuladeivam: null,
        fatherName: null,
        motherName: null,
        jobLocation: null,
      },
    ],
    updatedAt: Date.now(),
  };

  it('should preserve translation fields through saveDraftSchema.parse()', () => {
    const parsed = saveDraftSchema.parse(requestBody);

    expect(parsed.translations).toBeDefined();
    expect(parsed.translations!.length).toBe(2);

    const en = parsed.translations!.find(t => t.language === 'EN');
    const ta = parsed.translations!.find(t => t.language === 'TA');

    expect(en).toBeDefined();
    expect(en!.firstName).toBe('Rogul');
    expect(en!.lastName).toBe('Jayaraman');
    expect(ta!.firstName).toBe('\u0BB0\u0BCB\u0B95\u0BC1\u0BB2\u0BCD');
    expect(ta!.lastName).toBe('\u0B9C\u0BC6\u0BAF\u0BB0\u0BBE\u0BAE\u0BA9\u0BCD');

    console.log('[test] saveDraft parse EN:', JSON.stringify(en));
    console.log('[test] saveDraft parse TA:', JSON.stringify(ta));
  });

  it('preserves translations via createProfileSchema', () => {
    const createBody = {
      ...requestBody,
      basic: {
        ...requestBody.basic,
        profileFor: 'MYSELF',
        gender: 'MALE',
        dob: '2004-10-15',
        diet: 'VEGETARIAN',
        height: 123,
        weight: 52,
        maritalStatus: 'NEVER_MARRIED',
      },
      photos: {
        primaryUploadId: 'upl_test_photo_001',
        galleryUploadIds: [],
      },
      translations: [
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
          firstName: '\u0BB0\u0BCB\u0B95\u0BC1\u0BB2\u0BCD',
          lastName: '\u0B9C\u0BC6\u0BAF\u0BB0\u0BBE\u0BAE\u0BA9\u0BCD',
          kuladeivam: null,
          fatherName: null,
          motherName: null,
          jobLocation: null,
        },
      ],
      agreedToTerms: true,
    };

    const parsed = createProfileSchema.parse(createBody);

    expect(parsed.translations).toBeDefined();
    expect(parsed.translations.length).toBe(2);

    const en = parsed.translations.find(t => t.language === 'EN');
    const ta = parsed.translations.find(t => t.language === 'TA');

    expect(en!.firstName).toBe('Rogul');
    expect(ta!.firstName).toBe('\u0BB0\u0BCB\u0B95\u0BC1\u0BB2\u0BCD');

    console.log('[test] createProfile parse EN firstName:', en!.firstName);
    console.log('[test] createProfile parse TA firstName:', ta!.firstName);
  });
});
