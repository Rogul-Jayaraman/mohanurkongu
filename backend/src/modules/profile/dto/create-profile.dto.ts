import { z } from 'zod';
import { Gender, Diet, MaritalStatus } from '@prisma/client';

const englishNameRegex = /^[A-Za-z\s'.\-]+$/u;
const tamilNameRegex = /^[\u0B80-\u0BFF\s]+$/u;
const MIN_AGE = 21;
const MAX_AGE = 40;

function calculateAge(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

const englishNameField = z.string().trim().min(2).max(100).regex(englishNameRegex, 'Name must contain only English letters, spaces, apostrophes, hyphens, and periods').nullable().optional();
const tamilNameField = z.string().trim().min(1).max(100).regex(tamilNameRegex, 'Name must contain only Tamil characters').nullable().optional();
const translationCommonFields = {
  lastName: z.string().max(100).nullable().optional(),
  kuladeivam: z.string().max(100).nullable().optional(),
  fatherName: z.string().max(100).nullable().optional(),
  motherName: z.string().max(100).nullable().optional(),
  jobLocation: z.string().max(255).nullable().optional(),
};

export const createProfileSchema = z.object({
  profileId: z.string().uuid().optional(),
  basic: z.object({
    profileFor: z.string().min(1),
    gender: z.nativeEnum(Gender),
    dob: z.string().min(1).refine((val) => {
      if (!val) return true;
      const age = calculateAge(val);
      return age >= MIN_AGE && age <= MAX_AGE;
    }, { message: `Age must be between ${MIN_AGE} and ${MAX_AGE}` }),
    diet: z.nativeEnum(Diet),
    bloodGroup: z.string().max(20).nullable().optional(),
    height: z.number().positive().min(120).max(250),
    weight: z.number().positive().min(20).max(250).nullable().optional(),
    complexion: z.string().nullable().optional(),
    maritalStatus: z.nativeEnum(MaritalStatus).nullable().optional(),
    currentDistrict: z.string().nullable().optional(),
    currentTaluk: z.string().nullable().optional(),
    currentCityEn: z.string().nullable().optional(),
    currentCityTa: z.string().nullable().optional(),
    currentStateEn: z.string().nullable().optional(),
    currentStateTa: z.string().nullable().optional(),
    currentCountryEn: z.string().nullable().optional(),
    currentCountryTa: z.string().nullable().optional(),
    nativeDistrict: z.string().nullable().optional(),
    nativeTaluk: z.string().nullable().optional(),
    nativeCityEn: z.string().nullable().optional(),
    nativeCityTa: z.string().nullable().optional(),
    nativeStateEn: z.string().nullable().optional(),
    nativeStateTa: z.string().nullable().optional(),
    nativeCountryEn: z.string().nullable().optional(),
    nativeCountryTa: z.string().nullable().optional(),
  }),
  community: z.object({
    community: z.string().min(1).optional(),
    communityId: z.number().positive().optional(),
    caste: z.string().min(1).optional(),
    casteId: z.number().positive().optional(),
    kulam: z.string().max(255).nullable().optional(),
    kulamId: z.number().nullable().optional(),
  }).refine((d) => d.community || d.communityId, { message: 'community or communityId required' })
    .refine((d) => d.caste || d.casteId, { message: 'caste or casteId required' }),
  professional: z.object({
    education: z.string().max(255).nullable().optional(),
    jobSector: z.string().nullable().optional(),
    jobSectorId: z.number().nullable().optional(),
    jobDetail: z.string().max(255).nullable().optional(),
    companyName: z.string().max(255).nullable().optional(),
    jobLocationEn: z.string().nullable().optional(),
    jobLocationTa: z.string().nullable().optional(),
    monthlySalary: z.number().nonnegative().nullable().optional(),
  }).nullable().optional(),
  family: z.object({
    fatherAlive: z.boolean().optional(),
    fatherName: z.string().max(100).nullable().optional(),
    fatherJob: z.string().max(100).nullable().optional(),
    fatherSalary: z.number().nonnegative().nullable().optional(),
    motherAlive: z.boolean().optional(),
    motherName: z.string().max(100).nullable().optional(),
    motherJob: z.string().max(100).nullable().optional(),
    motherSalary: z.number().nonnegative().nullable().optional(),
    noOfBrother: z.number().int().min(0).max(20).nullable().optional(),
    noOfSister: z.number().int().min(0).max(20).nullable().optional(),
  }).nullable().optional(),
  horoscope: z.object({
    mode: z.enum(['GENERATED', 'UPLOADED']).nullable().optional(),
    rasi: z.string().nullable().optional(),
    nakshatra: z.string().nullable().optional(),
    lagna: z.string().nullable().optional(),
    rasiId: z.number().nullable().optional(),
    nakshatraId: z.number().nullable().optional(),
    lagnaId: z.number().nullable().optional(),
    rasiChartUploadId: z.string().nullable().optional(),
    navamsaChartUploadId: z.string().nullable().optional(),
    horoscopeJson: z.any().nullable().optional(),
  }).superRefine((data, ctx) => {
    if (data.mode === 'GENERATED') {
      if (!data.rasi) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Rasi is required for GENERATED mode', path: ['rasi'] });
      if (!data.nakshatra) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Nakshatra is required for GENERATED mode', path: ['nakshatra'] });
      if (!data.lagna) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Lagna is required for GENERATED mode', path: ['lagna'] });
    }
  }).nullable().optional(),
  photos: z.object({
    primaryUploadId: z.string().uuid(),
    galleryUploadIds: z.array(z.string()).optional(),
  }),
  assets: z.object({
    landEn: z.string().max(2000).nullable().optional(),
    landTa: z.string().max(2000).nullable().optional(),
    residenceType: z.string().nullable().optional(),
    otherAssetsEn: z.string().max(2000).nullable().optional(),
    otherAssetsTa: z.string().max(2000).nullable().optional(),
    vehicle: z.string().max(255).nullable().optional(),
  }).nullable().optional(),
  partnerPreference: z.object({
    ageMin: z.number().nullable().optional(),
    ageMax: z.number().nullable().optional(),
    heightMinId: z.number().nullable().optional(),
    heightMaxId: z.number().nullable().optional(),
    monthlySalary: z.number().nonnegative().nullable().optional(),
    expectationNoteEn: z.string().max(2000).nullable().optional(),
    expectationNoteTa: z.string().max(2000).nullable().optional(),
    preferredLocationEn: z.string().nullable().optional(),
    preferredLocationTa: z.string().nullable().optional(),
  }).nullable().optional(),
  translations: z.array(z.discriminatedUnion('language', [
    z.object({
      language: z.literal('EN'),
      firstName: englishNameField,
      ...translationCommonFields,
    }),
    z.object({
      language: z.literal('TA'),
      firstName: tamilNameField,
      ...translationCommonFields,
    }),
  ])).min(1),
  agreedToTerms: z.literal(true, { errorMap: () => ({ message: 'You must agree to the terms' }) }),
}).refine((doc) => {
  const en = doc.translations.find(t => t.language === 'EN');
  return en && en.firstName && en.firstName.trim().length > 0;
}, { message: 'EN translation with valid firstName is required' })
.refine((doc) => {
  const pp = doc.partnerPreference;
  if (!pp) return true;
  if (pp.ageMin != null && pp.ageMax != null && pp.ageMin > pp.ageMax) return false;
  if (pp.heightMinId != null && pp.heightMaxId != null && pp.heightMinId > pp.heightMaxId) return false;
  return true;
}, { message: 'Minimum value must not exceed maximum value in partner preferences' });
