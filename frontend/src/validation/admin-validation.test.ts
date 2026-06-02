import { describe, it, expect } from 'vitest';
import { rejectionSchema, archiveReasonSchema, adminEditFieldSchema, validateRejectionReason, validateArchiveReason } from './admin-validation';

describe('admin validation', () => {
  describe('rejectionSchema', () => {
    it('accepts valid rejection with reasonEn', () => {
      const result = rejectionSchema.safeParse({ reasonEn: 'Invalid photo — image is too blurry to verify identity' });
      expect(result.success).toBe(true);
    });

    it('accepts rejection with both en and ta reasons', () => {
      const result = rejectionSchema.safeParse({ reasonEn: 'Invalid photo', reasonTa: 'புகைப்படம் பொருத்தமற்றது' });
      expect(result.success).toBe(true);
    });

    it('rejects empty reasonEn', () => {
      const result = rejectionSchema.safeParse({ reasonEn: '' });
      expect(result.success).toBe(false);
    });

    it('rejects too-short reasonEn', () => {
      const result = rejectionSchema.safeParse({ reasonEn: 'Short' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('REJECTION_REASON_TOO_SHORT');
      }
    });

    it('rejects too-long reasonEn', () => {
      const result = rejectionSchema.safeParse({ reasonEn: 'x'.repeat(501) });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('REJECTION_REASON_TOO_LONG');
      }
    });
  });

  describe('archiveReasonSchema', () => {
    it('accepts valid archive reason', () => {
      const result = archiveReasonSchema.safeParse({ reasonEn: 'Profile no longer active — user requested removal' });
      expect(result.success).toBe(true);
    });

    it('rejects too-short archive reason', () => {
      const result = archiveReasonSchema.safeParse({ reasonEn: 'Short' });
      expect(result.success).toBe(false);
    });
  });

  describe('adminEditFieldSchema', () => {
    it('accepts valid edit fields', () => {
      const result = adminEditFieldSchema.safeParse({ firstNameEn: 'Kumar', education: 'B.E.', companyName: 'Acme Corp' });
      expect(result.success).toBe(true);
    });

    it('accepts empty object', () => {
      const result = adminEditFieldSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('rejects too-long firstNameEn', () => {
      const result = adminEditFieldSchema.safeParse({ firstNameEn: 'x'.repeat(101) });
      expect(result.success).toBe(false);
    });
  });

  describe('validateRejectionReason helper', () => {
    it('returns success for valid input', () => {
      const result = validateRejectionReason({ reasonEn: 'This is a valid rejection reason with enough length' });
      expect(result.success).toBe(true);
    });
  });

  describe('validateArchiveReason helper', () => {
    it('returns success for valid input', () => {
      const result = validateArchiveReason({ reasonEn: 'This is a valid archive reason with enough characters' });
      expect(result.success).toBe(true);
    });

    it('returns failure for empty input', () => {
      const result = validateArchiveReason({});
      expect(result.success).toBe(false);
    });
  });
});
