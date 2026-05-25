import { describe, it, expect } from 'vitest';
import { saveDraftSchema } from '../../modules/profile/dto/save-draft.dto.js';
import { publishSchema } from '../../modules/profile/dto/publish.dto.js';

describe('Profile Validators', () => {
  describe('saveDraftSchema', () => {
    it('should accept empty draft', () => {
      const result = saveDraftSchema.parse({});
      expect(result).toBeDefined();
    });

    it('should accept partial basic section', () => {
      const result = saveDraftSchema.parse({
        basic: { gender: 'MALE', dob: '1995-06-15' },
      });
      expect(result.basic?.gender).toBe('MALE');
    });

    it('should accept full draft with translations', () => {
      const result = saveDraftSchema.parse({
        basic: { gender: 'MALE', dob: '1995-06-15', diet: 'VEGETARIAN', height: 150, profileFor: 'MYSELF' },
        community: { communityId: 1, casteId: 1, kulamId: 5 },
        professional: { education: 'BE', jobSectorId: 2, jobDetail: 'Engineer', monthlySalary: 50000 },
        family: { fatherAlive: true, fatherName: 'Raja', motherAlive: true, motherName: 'Rani', noOfBrother: 1, noOfSister: 0 },
        photos: { primaryUploadId: 'uuid-1', galleryUploadIds: ['uuid-2', 'uuid-3'] },
        horoscope: { mode: 'MANUAL', rasiId: 3, nakshatraId: 5, lagnaId: 2 },
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

    it('should accept partial translations', () => {
      const result = saveDraftSchema.parse({
        translations: [{ language: 'EN', firstName: 'John' }],
      });
      expect(result.translations?.[0]?.firstName).toBe('John');
    });

    it('should reject invalid language code', () => {
      expect(() => saveDraftSchema.parse({
        translations: [{ language: 'FR', firstName: 'John' }],
      })).toThrow();
    });
  });

  describe('publishSchema', () => {
    it('should accept valid publish data', () => {
      const result = publishSchema.parse({
        draftId: '550e8400-e29b-41d4-a716-446655440000',
        idempotencyKey: '550e8400-e29b-41d4-a716-446655440001',
        agreedToTerms: true,
      });
      expect(result.draftId).toBe('550e8400-e29b-41d4-a716-446655440000');
    });

    it('should reject missing agreedToTerms', () => {
      expect(() => publishSchema.parse({
        draftId: '550e8400-e29b-41d4-a716-446655440000',
        idempotencyKey: '550e8400-e29b-41d4-a716-446655440001',
      })).toThrow();
    });

    it('should reject agreedToTerms false', () => {
      expect(() => publishSchema.parse({
        draftId: '550e8400-e29b-41d4-a716-446655440000',
        idempotencyKey: '550e8400-e29b-41d4-a716-446655440001',
        agreedToTerms: false,
      })).toThrow();
    });

    it('should reject invalid draftId', () => {
      expect(() => publishSchema.parse({
        draftId: 'not-a-uuid',
        idempotencyKey: '550e8400-e29b-41d4-a716-446655440001',
        agreedToTerms: true,
      })).toThrow();
    });

    it('should reject invalid idempotencyKey', () => {
      expect(() => publishSchema.parse({
        draftId: '550e8400-e29b-41d4-a716-446655440000',
        idempotencyKey: 'not-a-uuid',
        agreedToTerms: true,
      })).toThrow();
    });
  });
});
