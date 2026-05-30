import { z } from 'zod';

const basicSchema = z.object({
  profileFor: z.string().nullable().optional(),
  gender: z.string().nullable().optional(),
  dob: z.string().nullable().optional(),
  diet: z.string().nullable().optional(),
  bloodGroup: z.string().nullable().optional(),
  height: z.number().nullable().optional(),
  weight: z.number().min(30).max(150).nullable().optional(),
  complexion: z.string().nullable().optional(),
  maritalStatus: z.string().nullable().optional(),
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
});

const translationSchema = z.object({
  language: z.enum(['EN', 'TA']),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  kuladeivam: z.string().nullable().optional(),
  fatherName: z.string().nullable().optional(),
  motherName: z.string().nullable().optional(),
  jobLocation: z.string().nullable().optional(),
});

export const saveDraftSchema = z.object({
  profileId: z.string().uuid().optional(),
  basic: basicSchema.nullable().optional(),
  community: z.object({
    community: z.string().nullable().optional(),
    communityId: z.number().nullable().optional(),
    caste: z.string().nullable().optional(),
    casteId: z.number().nullable().optional(),
    kulam: z.string().nullable().optional(),
    kulamId: z.number().nullable().optional(),
  }).nullable().optional(),
  professional: z.object({
    education: z.string().nullable().optional(),
    jobSector: z.string().nullable().optional(),
    jobSectorId: z.number().nullable().optional(),
    jobDetail: z.string().nullable().optional(),
    companyName: z.string().nullable().optional(),
    jobLocationEn: z.string().nullable().optional(),
    jobLocationTa: z.string().nullable().optional(),
    monthlySalary: z.number().nullable().optional(),
  }).nullable().optional(),
  family: z.object({
    fatherAlive: z.boolean().optional(),
    fatherName: z.string().nullable().optional(),
    fatherJob: z.string().nullable().optional(),
    fatherSalary: z.number().nullable().optional(),
    motherAlive: z.boolean().optional(),
    motherName: z.string().nullable().optional(),
    motherJob: z.string().nullable().optional(),
    motherSalary: z.number().nullable().optional(),
    noOfBrother: z.number().nullable().optional(),
    noOfSister: z.number().nullable().optional(),
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
  }).nullable().optional(),
  photos: z.object({
    primaryUploadId: z.string().nullable().optional(),
    galleryUploadIds: z.array(z.string()).optional(),
  }).nullable().optional(),
  assets: z.object({
    landEn: z.string().nullable().optional(),
    landTa: z.string().nullable().optional(),
    residenceType: z.enum(['OWNED', 'RENTED']).nullable().optional(),
    otherAssetsEn: z.string().nullable().optional(),
    otherAssetsTa: z.string().nullable().optional(),
    vehicle: z.string().nullable().optional(),
  }).nullable().optional(),
  partnerPreference: z.object({
    ageMin: z.number().nullable().optional(),
    ageMax: z.number().nullable().optional(),
    heightMinId: z.number().nullable().optional(),
    heightMaxId: z.number().nullable().optional(),
    monthlySalary: z.number().nullable().optional(),
    expectationNoteEn: z.string().nullable().optional(),
    expectationNoteTa: z.string().nullable().optional(),
    preferredLocationEn: z.string().nullable().optional(),
    preferredLocationTa: z.string().nullable().optional(),
  }).nullable().optional(),
  translations: z.array(translationSchema).optional(),
}).superRefine((data, ctx) => {
  const basic = data.basic;
  const translations = data.translations;

  const hasFirstName = translations?.some(t => t.firstName && t.firstName.trim().length > 0);
  if (!hasFirstName) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Step 1 incomplete: at least one translation must have a firstName',
      path: ['translations'],
    });
  }

  if (!basic?.gender) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Step 1 incomplete: gender is required',
      path: ['basic', 'gender'],
    });
  }

  if (!basic?.dob) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Step 1 incomplete: date of birth is required',
      path: ['basic', 'dob'],
    });
  }
});
