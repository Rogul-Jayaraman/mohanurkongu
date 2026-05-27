import { z } from 'zod';

export const MIN_AGE = 21;
export const MAX_AGE = 40;
export const HEIGHT_MIN = 120;
export const HEIGHT_MAX = 250;
export const WEIGHT_MIN = 30;
export const WEIGHT_MAX = 150;
export const SIBLING_MIN = 0;
export const SIBLING_MAX = 20;
export const NAME_MIN = 2;
export const NAME_MAX = 100;
export const TEXT_MAX = 255;

export const toLocalDateStr = (d: Date): string => {
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().split('T')[0];
};

export const getMaxDobDate = (): string => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - MIN_AGE);
  return toLocalDateStr(d);
};

export const getMinDobDate = (): string => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - MAX_AGE);
  return toLocalDateStr(d);
};

export const calculateAge = (dob: string): number => {
  if (!dob) return -1;
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return -1;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

const nameRegex = /^[A-Za-z\s'.\-]+$/u;
const GENDERS = ['MALE', 'FEMALE'] as const;
const DIETS = ['VEGETARIAN', 'NON_VEGETARIAN'] as const;
const MARITAL_STATUSES = ['NEVER_MARRIED', 'DIVORCED', 'WIDOWED'] as const;
const BLOOD_GROUPS = ['A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE'] as const;
const PROFILE_FORS = ['MYSELF', 'MY_SON', 'MY_DAUGHTER', 'MY_SISTER', 'MY_BROTHER'] as const;
const RESIDENCES = ['OWN_HOUSE', 'RENTED'] as const;

const schemas: Record<string, z.ZodType> = {
  firstNameEn: z.string().min(NAME_MIN, `PROFILE_FIRST_NAME_TOO_SHORT:${NAME_MIN}`).max(NAME_MAX, `PROFILE_FIRST_NAME_TOO_LONG:${NAME_MAX}`).regex(nameRegex, 'PROFILE_FIRST_NAME_INVALID'),
  gender: z.enum(GENDERS, { errorMap: () => ({ message: 'PROFILE_GENDER_REQUIRED' }) }),
  dob: z.string().min(1, 'PROFILE_DOB_REQUIRED').refine((val) => {
    if (!val) return true;
    const age = calculateAge(val);
    if (age < 0) return true;
    return age >= MIN_AGE && age <= MAX_AGE;
  }, { message: `PROFILE_AGE_OUT_OF_RANGE:${MIN_AGE}:${MAX_AGE}` }),
  diet: z.enum(DIETS, { errorMap: () => ({ message: 'PROFILE_DIET_REQUIRED' }) }),
  height: z.number({ errorMap: () => ({ message: 'PROFILE_HEIGHT_REQUIRED' }) }).positive(`PROFILE_HEIGHT_INVALID:${HEIGHT_MIN}:${HEIGHT_MAX}`).min(HEIGHT_MIN, `PROFILE_HEIGHT_INVALID:${HEIGHT_MIN}:${HEIGHT_MAX}`).max(HEIGHT_MAX, `PROFILE_HEIGHT_INVALID:${HEIGHT_MIN}:${HEIGHT_MAX}`),
  weight: z.number().positive(`PROFILE_WEIGHT_INVALID:${WEIGHT_MIN}:${WEIGHT_MAX}`).min(WEIGHT_MIN, `PROFILE_WEIGHT_INVALID:${WEIGHT_MIN}:${WEIGHT_MAX}`).max(WEIGHT_MAX, `PROFILE_WEIGHT_INVALID:${WEIGHT_MIN}:${WEIGHT_MAX}`).optional(),
  profileFor: z.enum(PROFILE_FORS, { errorMap: () => ({ message: 'PROFILE_PROFILE_FOR_REQUIRED' }) }),
  maritalStatus: z.enum(MARITAL_STATUSES, { errorMap: () => ({ message: 'PROFILE_MARITAL_STATUS_REQUIRED' }) }),
  bloodGroup: z.enum(BLOOD_GROUPS, { errorMap: () => ({ message: 'PROFILE_BLOOD_GROUP_REQUIRED' }) }),
  currentDistrict: z.string().min(1, 'PROFILE_CURRENT_DISTRICT_REQUIRED'),
  nativeDistrict: z.string().min(1, 'PROFILE_NATIVE_DISTRICT_REQUIRED'),
  nativeTaluk: z.string().optional(),
  kulam: z.string().min(1, 'PROFILE_KULAM_REQUIRED'),
  kuladeivamEn: z.string().min(1, 'PROFILE_KULADEIVAM_REQUIRED'),
  fatherNameEn: z.string().min(1, 'PROFILE_FATHER_NAME_REQUIRED'),
  motherNameEn: z.string().min(1, 'PROFILE_MOTHER_NAME_REQUIRED'),
  noOfBrothers: z.number().int('PROFILE_INVALID_SIBLINGS').min(SIBLING_MIN, 'PROFILE_INVALID_SIBLINGS').max(SIBLING_MAX, 'PROFILE_INVALID_SIBLINGS'),
  noOfSisters: z.number().int('PROFILE_INVALID_SIBLINGS').min(SIBLING_MIN, 'PROFILE_INVALID_SIBLINGS').max(SIBLING_MAX, 'PROFILE_INVALID_SIBLINGS'),
  residence: z.enum(RESIDENCES, { errorMap: () => ({ message: 'PROFILE_RESIDENCE_REQUIRED' }) }),
  primaryUploadId: z.string().optional(),
  agreedToTerms: z.literal(true, { errorMap: () => ({ message: 'PROFILE_TERMS_REQUIRED' }) }),
};

export const fieldValidators: Record<string, (value: any) => string | null> = {};

for (const key of Object.keys(schemas)) {
  fieldValidators[key] = (value: any) => {
    const schema = schemas[key];
    if (!schema) return null;
    const result = schema.safeParse(value);
    if (result.success) return null;
    return result.error.errors[0]?.message || 'PROFILE_INVALID_VALUE';
  };
}

export const STEP_REQUIRED_FIELDS: Record<number, string[]> = {
  1: ['firstNameEn', 'gender', 'dob', 'diet', 'height', 'weight', 'profileFor', 'maritalStatus', 'bloodGroup', 'currentDistrict', 'currentTaluk', 'nativeDistrict', 'nativeTaluk'],
  2: ['kulam', 'kuladeivamEn'],
  3: ['fatherNameEn', 'motherNameEn', 'noOfBrothers', 'noOfSisters'],
  4: ['residence'],
  5: [],
   6: [],
  7: ['agreedToTerms'],
};

export function validateField(field: string, value: any): string | null {
  const validator = fieldValidators[field];
  return validator ? validator(value) : null;
}

export function validateStepAtNav(step: number, formData: Record<string, any>): { fieldErrors: Record<string, string>; hasErrors: boolean } {
  const fieldErrors: Record<string, string> = {};
  const fields = STEP_REQUIRED_FIELDS[step] || [];

  for (const field of fields) {
    if (field === 'kuladeivamEn') {
      const enVal = formData.kuladeivamEn?.trim();
      const taVal = formData.kuladeivamTa?.trim();
      if (!enVal && !taVal) {
        fieldErrors.kuladeivamEn = 'PROFILE_KULADEIVAM_REQUIRED';
      }
      continue;
    }
    if (field === 'currentTaluk') {
        if (formData.currentDistrict === 'OTHER') {
            if (!formData.currentCityEn?.trim() && !formData.currentCityTa?.trim()) {
                fieldErrors.currentCityEn = 'PROFILE_CURRENT_CITY_REQUIRED';
            }
            if (!formData.currentStateEn?.trim() && !formData.currentStateTa?.trim()) {
                fieldErrors.currentStateEn = 'PROFILE_CURRENT_STATE_REQUIRED';
            }
            if (!formData.currentCountryEn?.trim() && !formData.currentCountryTa?.trim()) {
                fieldErrors.currentCountryEn = 'PROFILE_CURRENT_COUNTRY_REQUIRED';
            }
            continue;
        }
        if (!formData.currentTaluk) {
            fieldErrors.currentTaluk = 'PROFILE_CURRENT_TALUK_REQUIRED';
        }
        continue;
    }
    if (field === 'nativeTaluk') {
        if (formData.nativeDistrict === 'OTHER') {
            if (!formData.nativeCityEn?.trim() && !formData.nativeCityTa?.trim()) {
                fieldErrors.nativeCityEn = 'PROFILE_NATIVE_CITY_REQUIRED';
            }
            if (!formData.nativeStateEn?.trim() && !formData.nativeStateTa?.trim()) {
                fieldErrors.nativeStateEn = 'PROFILE_NATIVE_STATE_REQUIRED';
            }
            if (!formData.nativeCountryEn?.trim() && !formData.nativeCountryTa?.trim()) {
                fieldErrors.nativeCountryEn = 'PROFILE_NATIVE_COUNTRY_REQUIRED';
            }
            continue;
        }
        if (!formData.nativeTaluk) {
            fieldErrors.nativeTaluk = 'PROFILE_NATIVE_TALUK_REQUIRED';
        }
        continue;
    }
    const error = validateField(field, formData[field]);
    if (error) fieldErrors[field] = error;
  }

  if (step === 4) {
    if (formData.ageMin != null && formData.ageMax != null && formData.ageMin > formData.ageMax) {
      fieldErrors.ageRange = 'PROFILE_AGE_RANGE_INVALID';
    }
    if (formData.heightMinId != null && formData.heightMaxId != null && formData.heightMinId > formData.heightMaxId) {
      fieldErrors.heightRange = 'PROFILE_HEIGHT_RANGE_INVALID';
    }
  }

  if (step === 5) {
    const astro = formData.astrology || {};
    const mode = astro.mode;
    if (!mode || mode === 'none') {
      fieldErrors.horoscopeMode = 'PROFILE_HOROSCOPE_MODE_REQUIRED';
    } else if (mode === 'GENERATED') {
      const star = formData.star || astro.star;
      const rasi = formData.rasi || astro.rasi;
      const laganam = formData.laganam || astro.laganam;
      if (!star) fieldErrors.star = 'PROFILE_STAR_REQUIRED';
      if (!rasi) fieldErrors.rasi = 'PROFILE_RASI_REQUIRED';
      if (!laganam) fieldErrors.laganam = 'PROFILE_LAGANAM_REQUIRED';
    }
  }

  return { fieldErrors, hasErrors: Object.keys(fieldErrors).length > 0 };
}

export function validateCreate(formData: Record<string, any>): string[] {
  const errors: string[] = [];
  for (const step of [1, 2, 3, 4, 5, 6, 7]) {
    const { fieldErrors } = validateStepAtNav(step, formData);
    for (const msg of Object.values(fieldErrors)) {
      errors.push(msg);
    }
  }
  return errors;
}
