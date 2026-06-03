import { describe, it, expect } from 'vitest';
import { saveDraftSchema } from '../../modules/profile/dto/save-draft.dto.js';

describe('Translation debug', () => {
  it('should preserve firstName through Zod parse', () => {
    const input = {
      basic: { gender: 'MALE', dob: '1995-06-15' },
      translations: [
        { language: 'EN', firstName: 'John', lastName: 'Doe' },
        { language: 'TA', firstName: 'ரோகுல்' },
      ],
    };
    const result = saveDraftSchema.parse(input);
    expect(result.translations).toHaveLength(2);
    expect(result.translations[0].firstName).toBe('John');
    expect(result.translations[0].lastName).toBe('Doe');
    expect(result.translations[1].firstName).toBe('ரோகுல்');
    expect(result.translations[0].currentCity).toBeUndefined();
    expect(result.translations[0].currentState).toBeUndefined();
  });

  it('should preserve null firstName', () => {
    const input = {
      basic: { gender: 'MALE', dob: '1995-06-15' },
      translations: [
        { language: 'EN', firstName: 'John' },
        { language: 'TA', firstName: null },
      ],
    };
    const result = saveDraftSchema.parse(input);
    expect(result.translations[0].firstName).toBe('John');
    expect(result.translations[1].firstName).toBeNull();
  });

  it('should handle empty translations as undefined', () => {
    const input = {
      basic: { gender: 'MALE', dob: '1995-06-15' },
      translations: [
        { language: 'EN' },
        { language: 'TA', firstName: 'ரோகுல்' },
      ],
    };
    const result = saveDraftSchema.parse(input);
    expect(result.translations[0].firstName).toBeUndefined();
    expect(result.translations[1].firstName).toBe('ரோகுல்');
  });

  it('should fail if no firstName in any translation', () => {
    const input = {
      basic: { gender: 'MALE', dob: '1995-06-15' },
      translations: [
        { language: 'EN', firstName: '' },
        { language: 'TA', firstName: '' },
      ],
    };
    expect(() => saveDraftSchema.parse(input)).toThrow();
  });
});
