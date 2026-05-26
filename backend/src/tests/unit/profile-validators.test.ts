import { describe, it, expect } from 'vitest';
import { saveDraftSchema } from '../../modules/profile/dto/save-draft.dto.js';
import { createProfileSchema } from '../../modules/profile/dto/create-profile.dto.js';

describe('Profile Validators', () => {
  describe('saveDraftSchema', () => {
    it('should accept draft with minimum Step 1 fields', () => {
      const result = saveDraftSchema.parse({
        basic: { gender: 'MALE', dob: '1995-06-15' },
        translations: [{ language: 'EN', firstName: 'John' }],
      });
      expect(result.basic?.gender).toBe('MALE');
      expect(result.translations?.[0]?.firstName).toBe('John');
    });

    it('should accept full draft with translations', () => {
      const result = saveDraftSchema.parse({
        basic: { gender: 'MALE', dob: '1995-06-15', diet: 'VEGETARIAN', height: 150, profileFor: 'MYSELF' },
        community: { communityId: 1, casteId: 1, kulamId: 5 },
        professional: { education: 'BE', jobSectorId: 2, jobDetail: 'Engineer', monthlySalary: 50000 },
        family: { fatherAlive: true, fatherName: 'Raja', motherAlive: true, motherName: 'Rani', noOfBrother: 1, noOfSister: 0 },
        photos: { primaryUploadId: 'uuid-1', galleryUploadIds: ['uuid-2', 'uuid-3'] },
        horoscope: { mode: 'GENERATED', rasi: 'MESHA', nakshatra: 'ASHWINI', lagna: 'MESHA', rasiId: 3, nakshatraId: 5, lagnaId: 2 },
        assets: { landEn: '2 acres', residenceType: 'OWNED', vehicle: 'Car' },
        partnerPreference: { ageMin: 25, ageMax: 30, monthlySalary: 40000 },
        translations: [
          { language: 'EN', firstName: 'John', lastName: 'Doe' },
          { language: 'TA', firstName: 'ஜான்' },
        ],
      });
      expect(result.translations).toHaveLength(2);
      expect(result.photos?.galleryUploadIds).toHaveLength(2);
    });

    it('should reject draft missing firstName', () => {
      expect(() => saveDraftSchema.parse({
        basic: { gender: 'MALE', dob: '1995-06-15' },
      })).toThrow();
    });

    it('should reject draft missing gender', () => {
      expect(() => saveDraftSchema.parse({
        basic: { dob: '1995-06-15' },
        translations: [{ language: 'EN', firstName: 'John' }],
      })).toThrow();
    });

    it('should reject draft missing dob', () => {
      expect(() => saveDraftSchema.parse({
        basic: { gender: 'MALE' },
        translations: [{ language: 'EN', firstName: 'John' }],
      })).toThrow();
    });

    it('should reject invalid language code', () => {
      expect(() => saveDraftSchema.parse({
        basic: { gender: 'MALE', dob: '1995-06-15' },
        translations: [{ language: 'FR', firstName: 'John' }],
      })).toThrow();
    });
  });

  describe('createProfileSchema', () => {
    it('should accept valid create data', () => {
      const result = createProfileSchema.parse({
        basic: { profileFor: 'MYSELF', gender: 'MALE', dob: '1995-06-15', diet: 'VEGETARIAN', height: 170 },
        community: { communityId: 1, casteId: 1 },
        photos: { primaryUploadId: '550e8400-e29b-41d4-a716-446655440000' },
        translations: [{ language: 'EN', firstName: 'John' }],
        agreedToTerms: true,
      });
      expect(result.basic.dob).toBe('1995-06-15');
    });

    it('should accept profileId for draft transition', () => {
      const result = createProfileSchema.parse({
        profileId: '550e8400-e29b-41d4-a716-446655440000',
        basic: { profileFor: 'MYSELF', gender: 'MALE', dob: '1995-06-15', diet: 'VEGETARIAN', height: 170 },
        community: { communityId: 1, casteId: 1 },
        photos: { primaryUploadId: '550e8400-e29b-41d4-a716-446655440001' },
        translations: [{ language: 'EN', firstName: 'John' }],
        agreedToTerms: true,
      });
      expect(result.profileId).toBe('550e8400-e29b-41d4-a716-446655440000');
    });

    it('should reject name with symbols', () => {
      expect(() => createProfileSchema.parse({
        basic: { profileFor: 'MYSELF', gender: 'MALE', dob: '1995-06-15', diet: 'VEGETARIAN', height: 170 },
        community: { communityId: 1, casteId: 1 },
        photos: { primaryUploadId: '550e8400-e29b-41d4-a716-446655440000' },
        translations: [{ language: 'EN', firstName: 'Arun@123' }],
        agreedToTerms: true,
      })).toThrow();
    });

    it('should reject name with numbers', () => {
      expect(() => createProfileSchema.parse({
        basic: { profileFor: 'MYSELF', gender: 'MALE', dob: '1995-06-15', diet: 'VEGETARIAN', height: 170 },
        community: { communityId: 1, casteId: 1 },
        photos: { primaryUploadId: '550e8400-e29b-41d4-a716-446655440000' },
        translations: [{ language: 'EN', firstName: 'Arun123' }],
        agreedToTerms: true,
      })).toThrow();
    });

    it('should reject missing agreedToTerms', () => {
      expect(() => createProfileSchema.parse({
        basic: { profileFor: 'MYSELF', gender: 'MALE', dob: '1995-06-15', diet: 'VEGETARIAN', height: 170 },
        community: { communityId: 1, casteId: 1 },
        photos: { primaryUploadId: '550e8400-e29b-41d4-a716-446655440000' },
        translations: [{ language: 'EN', firstName: 'Arun' }],
      })).toThrow();
    });

    it('should accept English name with apostrophe', () => {
      const result = createProfileSchema.parse({
        basic: { profileFor: 'MYSELF', gender: 'MALE', dob: '1995-06-15', diet: 'VEGETARIAN', height: 170 },
        community: { communityId: 1, casteId: 1 },
        photos: { primaryUploadId: '550e8400-e29b-41d4-a716-446655440000' },
        translations: [{ language: 'EN', firstName: "D'Souza" }],
        agreedToTerms: true,
      });
      expect(result.translations[0].firstName).toBe("D'Souza");
    });

    it('should accept English name with period', () => {
      const result = createProfileSchema.parse({
        basic: { profileFor: 'MYSELF', gender: 'MALE', dob: '1995-06-15', diet: 'VEGETARIAN', height: 170 },
        community: { communityId: 1, casteId: 1 },
        photos: { primaryUploadId: '550e8400-e29b-41d4-a716-446655440000' },
        translations: [{ language: 'EN', firstName: 'A.Kumar' }],
        agreedToTerms: true,
      });
      expect(result.translations[0].firstName).toBe('A.Kumar');
    });

    it('should accept English + Tamil translations with valid Tamil name', () => {
      const result = createProfileSchema.parse({
        basic: { profileFor: 'MYSELF', gender: 'MALE', dob: '1995-06-15', diet: 'VEGETARIAN', height: 170 },
        community: { communityId: 1, casteId: 1 },
        photos: { primaryUploadId: '550e8400-e29b-41d4-a716-446655440000' },
        translations: [
          { language: 'EN', firstName: 'Rogul' },
          { language: 'TA', firstName: 'ரோகுல்' },
        ],
        agreedToTerms: true,
      });
      expect(result.translations).toHaveLength(2);
      expect(result.translations[1].firstName).toBe('ரோகுல்');
    });

    it('should accept English + Tamil translations with Tamil name containing pulli and vowel signs', () => {
      const result = createProfileSchema.parse({
        basic: { profileFor: 'MYSELF', gender: 'MALE', dob: '1995-06-15', diet: 'VEGETARIAN', height: 170 },
        community: { communityId: 1, casteId: 1 },
        photos: { primaryUploadId: '550e8400-e29b-41d4-a716-446655440000' },
        translations: [
          { language: 'EN', firstName: 'Murugan' },
          { language: 'TA', firstName: 'முருகன்' },
        ],
        agreedToTerms: true,
      });
      expect(result.translations[1].firstName).toBe('முருகன்');
    });

    it('should reject Tamil name containing Latin characters', () => {
      expect(() => createProfileSchema.parse({
        basic: { profileFor: 'MYSELF', gender: 'MALE', dob: '1995-06-15', diet: 'VEGETARIAN', height: 170 },
        community: { communityId: 1, casteId: 1 },
        photos: { primaryUploadId: '550e8400-e29b-41d4-a716-446655440000' },
        translations: [
          { language: 'EN', firstName: 'John' },
          { language: 'TA', firstName: 'Murugan' },
        ],
        agreedToTerms: true,
      })).toThrow();
    });

    it('should reject Tamil name containing digits', () => {
      expect(() => createProfileSchema.parse({
        basic: { profileFor: 'MYSELF', gender: 'MALE', dob: '1995-06-15', diet: 'VEGETARIAN', height: 170 },
        community: { communityId: 1, casteId: 1 },
        photos: { primaryUploadId: '550e8400-e29b-41d4-a716-446655440000' },
        translations: [
          { language: 'EN', firstName: 'John' },
          { language: 'TA', firstName: 'ரோகுல்123' },
        ],
        agreedToTerms: true,
      })).toThrow();
    });

    it('should reject Tamil name with empty string', () => {
      expect(() => createProfileSchema.parse({
        basic: { profileFor: 'MYSELF', gender: 'MALE', dob: '1995-06-15', diet: 'VEGETARIAN', height: 170 },
        community: { communityId: 1, casteId: 1 },
        photos: { primaryUploadId: '550e8400-e29b-41d4-a716-446655440000' },
        translations: [
          { language: 'EN', firstName: 'John' },
          { language: 'TA', firstName: '' },
        ],
        agreedToTerms: true,
      })).toThrow();
    });

    it('should accept TA null when EN is valid', () => {
      const result = createProfileSchema.parse({
        basic: { profileFor: 'MYSELF', gender: 'MALE', dob: '1995-06-15', diet: 'VEGETARIAN', height: 170 },
        community: { communityId: 1, casteId: 1 },
        photos: { primaryUploadId: '550e8400-e29b-41d4-a716-446655440000' },
        translations: [
          { language: 'EN', firstName: 'John' },
          { language: 'TA', firstName: null },
        ],
        agreedToTerms: true,
      });
      expect(result.translations[1].firstName).toBeNull();
    });

    it('should accept Tamil name with spaces', () => {
      const result = createProfileSchema.parse({
        basic: { profileFor: 'MYSELF', gender: 'MALE', dob: '1995-06-15', diet: 'VEGETARIAN', height: 170 },
        community: { communityId: 1, casteId: 1 },
        photos: { primaryUploadId: '550e8400-e29b-41d4-a716-446655440000' },
        translations: [
          { language: 'EN', firstName: 'Siva' },
          { language: 'TA', firstName: 'சிவ சுப்பிரமணியம்' },
        ],
        agreedToTerms: true,
      });
      expect(result.translations[1].firstName).toBe('சிவ சுப்பிரமணியம்');
    });

    it('should reject English name with accented characters', () => {
      expect(() => createProfileSchema.parse({
        basic: { profileFor: 'MYSELF', gender: 'MALE', dob: '1995-06-15', diet: 'VEGETARIAN', height: 170 },
        community: { communityId: 1, casteId: 1 },
        photos: { primaryUploadId: '550e8400-e29b-41d4-a716-446655440000' },
        translations: [{ language: 'EN', firstName: 'José' }],
        agreedToTerms: true,
      })).toThrow();
    });
  });
});
