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
  firstNameEn: z.string().min(NAME_MIN, `First name must be at least ${NAME_MIN} characters`).max(NAME_MAX).regex(nameRegex, 'Name must not contain symbols or numbers'),
  gender: z.enum(GENDERS, { errorMap: () => ({ message: 'Gender is required' }) }),
  dob: z.string().min(1, 'Date of birth is required').refine((val) => {
    if (!val) return true;
    const age = calculateAge(val);
    if (age < 0) return true;
    return age >= MIN_AGE && age <= MAX_AGE;
  }, { message: `Age must be between ${MIN_AGE} and ${MAX_AGE}` }),
  diet: z.enum(DIETS, { errorMap: () => ({ message: 'Diet is required' }) }),
  height: z.number({ errorMap: () => ({ message: 'Height is required' }) }).positive().min(HEIGHT_MIN).max(HEIGHT_MAX),
  weight: z.number().positive().min(WEIGHT_MIN).max(WEIGHT_MAX).optional(),
  profileFor: z.enum(PROFILE_FORS, { errorMap: () => ({ message: 'Profile for is required' }) }),
  maritalStatus: z.enum(MARITAL_STATUSES, { errorMap: () => ({ message: 'Marital status is required' }) }),
  bloodGroup: z.enum(BLOOD_GROUPS, { errorMap: () => ({ message: 'Blood group is required' }) }),
  currentDistrict: z.string().min(1, 'Current district is required'),
  nativeDistrict: z.string().min(1, 'Native district is required'),
  nativeTaluk: z.string().optional(),
  kulam: z.string().min(1, 'Kulam is required'),
  kuladeivamEn: z.string().min(1, 'At least one of English or Tamil kuladeivam is required'),
  fatherNameEn: z.string().min(1, 'Father name (English) is required'),
  motherNameEn: z.string().min(1, 'Mother name (English) is required'),
  noOfBrothers: z.number().int().min(SIBLING_MIN).max(SIBLING_MAX, `Number of brothers must be between ${SIBLING_MIN} and ${SIBLING_MAX}`),
  noOfSisters: z.number().int().min(SIBLING_MIN).max(SIBLING_MAX, `Number of sisters must be between ${SIBLING_MIN} and ${SIBLING_MAX}`),
  residence: z.enum(RESIDENCES, { errorMap: () => ({ message: 'Residence type is required' }) }),
  primaryUploadId: z.string().min(1, 'Primary photo is required'),
  agreedToTerms: z.literal(true, { errorMap: () => ({ message: 'You must agree to the terms' }) }),
};

export const fieldValidators: Record<string, (value: any) => string | null> = {};

for (const key of Object.keys(schemas)) {
  fieldValidators[key] = (value: any) => {
    const schema = schemas[key];
    if (!schema) return null;
    const result = schema.safeParse(value);
    if (result.success) return null;
    return result.error.errors[0]?.message || 'Invalid value';
  };
}

export const STEP_REQUIRED_FIELDS: Record<number, string[]> = {
  1: ['firstNameEn', 'gender', 'dob', 'diet', 'height', 'profileFor', 'maritalStatus', 'bloodGroup', 'currentDistrict', 'currentTaluk', 'nativeDistrict', 'nativeTaluk'],
  2: ['kulam', 'kuladeivamEn'],
  3: ['fatherNameEn', 'motherNameEn'],
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
        fieldErrors.kuladeivamEn = 'At least one of English or Tamil kuladeivam is required';
      }
      continue;
    }
    if (field === 'currentTaluk') {
        if (formData.currentDistrict === 'OTHER') {
            if (!formData.currentCityEn?.trim() && !formData.currentCityTa?.trim()) {
                fieldErrors.currentCityEn = 'Current city is required';
            }
            if (!formData.currentStateEn?.trim() && !formData.currentStateTa?.trim()) {
                fieldErrors.currentStateEn = 'Current state is required';
            }
            if (!formData.currentCountryEn?.trim() && !formData.currentCountryTa?.trim()) {
                fieldErrors.currentCountryEn = 'Current country is required';
            }
            continue;
        }
        if (!formData.currentTaluk) {
            fieldErrors.currentTaluk = 'Current taluk is required';
        }
        continue;
    }
    if (field === 'nativeTaluk') {
        if (formData.nativeDistrict === 'OTHER') {
            if (!formData.nativeCityEn?.trim() && !formData.nativeCityTa?.trim()) {
                fieldErrors.nativeCityEn = 'Native city is required';
            }
            if (!formData.nativeStateEn?.trim() && !formData.nativeStateTa?.trim()) {
                fieldErrors.nativeStateEn = 'Native state is required';
            }
            if (!formData.nativeCountryEn?.trim() && !formData.nativeCountryTa?.trim()) {
                fieldErrors.nativeCountryEn = 'Native country is required';
            }
            continue;
        }
        if (!formData.nativeTaluk) {
            fieldErrors.nativeTaluk = 'Native taluk is required';
        }
        continue;
    }
    const error = validateField(field, formData[field]);
    if (error) fieldErrors[field] = error;
  }

  if (step === 4) {
    if (formData.ageMin != null && formData.ageMax != null && formData.ageMin > formData.ageMax) {
      fieldErrors.ageRange = 'Minimum age must not exceed maximum age';
    }
    if (formData.heightMinId != null && formData.heightMaxId != null && formData.heightMinId > formData.heightMaxId) {
      fieldErrors.heightRange = 'Minimum height must not exceed maximum height';
    }
  }

  if (step === 5) {
    const astro = formData.astrology || {};
    const mode = astro.mode;
    if (!mode || mode === 'none') {
      fieldErrors.horoscopeMode = 'Please select a horoscope method';
    } else if (mode === 'GENERATED') {
      const star = formData.star || astro.star;
      const rasi = formData.rasi || astro.rasi;
      const laganam = formData.laganam || astro.laganam;
      if (!star) fieldErrors.star = 'Star/Nakshatra is required for generated horoscope';
      if (!rasi) fieldErrors.rasi = 'Rasi is required for generated horoscope';
      if (!laganam) fieldErrors.laganam = 'Lagnam is required for generated horoscope';
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
