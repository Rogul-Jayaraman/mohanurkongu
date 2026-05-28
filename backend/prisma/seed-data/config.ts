import type { PrismaClient } from '@prisma/client';

export const SEED_CONFIG = {
  TOTAL_ACCOUNTS: 1000,
  TOTAL_PROFILES: 850,
  ACCOUNTS_ACTIVE_PCT: 0.95,
  ACCOUNTS_SUSPENDED_PCT: 0.05,

  PROFILE_STATUS_DISTRIBUTION: {
    ACTIVE: 650,
    PENDING: 50,
    DRAFT: 50,
    REJECTED: 30,
    ARCHIVED: 15,
    DELETED: 5,
  } as Record<string, number>,

  UPLOAD_DISTRIBUTION: {
    TEMP: 50,
    ATTACHED: 500,
    ACTIVE: 2500,
    DELETE_PENDING: 200,
    DELETED: 250,
  } as Record<string, number>,

  GENDER_DISTRIBUTION: [
    { value: 'FEMALE', weight: 55 },
    { value: 'MALE', weight: 43 },
    { value: 'OTHER', weight: 2 },
  ],

  DIET_DISTRIBUTION: [
    { value: 'VEGETARIAN', weight: 60 },
    { value: 'NON_VEGETARIAN', weight: 33 },
    { value: 'EGGETARIAN', weight: 4 },
    { value: 'VEGAN', weight: 3 },
  ],

  MARITAL_STATUS_DISTRIBUTION: [
    { value: 'NEVER_MARRIED', weight: 82 },
    { value: 'DIVORCED', weight: 9 },
    { value: 'WIDOWED', weight: 6 },
    { value: 'SEPARATED', weight: 3 },
  ],

  COMPLEXION_DISTRIBUTION: [
    { value: 'FAIR', weight: 35 },
    { value: 'WHEATISH', weight: 40 },
    { value: 'BROWN', weight: 18 },
    { value: 'DARK', weight: 7 },
  ],

  BLOOD_GROUP_DISTRIBUTION: [
    { value: 'O_POSITIVE', weight: 35 },
    { value: 'A_POSITIVE', weight: 28 },
    { value: 'B_POSITIVE', weight: 22 },
    { value: 'AB_POSITIVE', weight: 5 },
    { value: 'O_NEGATIVE', weight: 4 },
    { value: 'A_NEGATIVE', weight: 3 },
    { value: 'B_NEGATIVE', weight: 2 },
    { value: 'AB_NEGATIVE', weight: 1 },
  ],

  RESIDENCE_TYPE_DISTRIBUTION: [
    { value: 'OWNED', weight: 55 },
    { value: 'RENTED', weight: 25 },
    { value: 'PARENTAL', weight: 15 },
    { value: 'LEASED', weight: 5 },
  ],

  PROFILE_FOR_DISTRIBUTION: [
    { value: 'MYSELF', weight: 70 },
    { value: 'MY_SON', weight: 12 },
    { value: 'MY_DAUGHTER', weight: 10 },
    { value: 'MY_SISTER', weight: 5 },
    { value: 'MY_BROTHER', weight: 3 },
  ],

  JOB_SECTOR_DISTRIBUTION: [
    { value: 'PRIVATE', weight: 35 },
    { value: 'GOVT', weight: 15 },
    { value: 'BUSINESS', weight: 12 },
    { value: 'DOCTOR', weight: 10 },
    { value: 'FOREIGN', weight: 8 },
    { value: 'SELF_EMPLOYED', weight: 7 },
    { value: 'OTHERS', weight: 13 },
  ],

  AGE_FEMALE: { min: 18, max: 35, mean: 24, stddev: 3 },
  AGE_MALE: { min: 21, max: 45, mean: 28, stddev: 4 },

  HEIGHT_FEMALE: { min: 147, max: 175, mean: 158, stddev: 5 },
  HEIGHT_MALE: { min: 160, max: 193, mean: 172, stddev: 6 },

  SALARY_RANGES: [
    { min: 0, max: 15000, weight: 10 },
    { min: 15001, max: 30000, weight: 30 },
    { min: 30001, max: 60000, weight: 35 },
    { min: 60001, max: 100000, weight: 15 },
    { min: 100001, max: 200000, weight: 7 },
    { min: 200001, max: 500000, weight: 2 },
    { min: 500001, max: 9999999, weight: 1 },
  ],

  SECTION_COMPLETION: {
    PROFESSIONAL: 0.85,
    FAMILY: 0.60,
    HOROSCOPE: 0.47,
    PRIMARY_PHOTO: 0.92,
    GALLERY: 0.40,
    PARTNER_PREFERENCE: 0.61,
    ASSETS: 0.26,
    TA_TRANSLATION: 0.62,
  },

  SHORTLIST_PER_USER: { min: 0, max: 60, activePowerAvg: 3.5 },
  HOT_PROFILE_SHORTLISTS: { min: 50, max: 100 },

  MEMBERSHIP_PREMIUM_PCT: 0.25,
  MEMBERSHIP_EXPIRED_PCT: 0.05,

  VERIFICATION_PURPOSE_DISTRIBUTION: [
    { value: 'REGISTER', weight: 85 },
    { value: 'RESET_PASSWORD', weight: 15 },
  ],

  VERIFICATION_STATE_DISTRIBUTION: [
    { value: 'VERIFIED', weight: 70 },
    { value: 'EXPIRED', weight: 15 },
    { value: 'CANCELLED', weight: 10 },
    { value: 'PENDING', weight: 4 },
    { value: 'ARCHIVED', weight: 1 },
  ],

  SESSION_COUNT_PER_ACCOUNT: { min: 0, max: 10, avg: 2.5 },

  ACTIVITY_RECENCY: [
    { period: '24h', pct: 0.05 },
    { period: '7d', pct: 0.20 },
    { period: '30d', pct: 0.30 },
    { period: '90d', pct: 0.25 },
    { period: 'older', pct: 0.20 },
  ],

  DISTRICT_WEIGHTS: {
    COIMBATORE: 0.30,
    ERODE: 0.15,
    TIRUPPUR: 0.11,
    SALEM: 0.08,
    NAMAKKAL: 0.07,
    TIRUVALLUR: 0.03,
    CHENNAI: 0.04,
    KANCHEEPURAM: 0.02,
    DHARMAPURI: 0.03,
    TIRUVANNAMALAI: 0.02,
    NILGIRIS: 0.02,
    DINDIGUL: 0.02,
    KARUR: 0.02,
    THIRUCHIRAPPALLI: 0.02,
    MADURAI: 0.02,
    THENI: 0.01,
    VIRUDHUNAGAR: 0.01,
    KRISHNAGIRI: 0.02,
    CHENGALPATTU: 0.01,
    MAYILADUTHURAI: 0.01,
    VELLORE: 0.01,
    NAGAPATTINAM: 0.005,
    THANJAVUR: 0.01,
    PUDUKKOTTAI: 0.005,
    RAMANATHAPURAM: 0.005,
    TIRUNELVELI: 0.005,
    KANYAKUMARI: 0.005,
    OTHER: 0.005,
  } as Record<string, number>,

  SUSPENDED_REASONS: [
    { reasonEn: 'TOS violation', reasonTa: 'சேவை விதிமுறைகளை மீறுதல்', weight: 40 },
    { reasonEn: 'Fake information provided', reasonTa: 'தவறான தகவல் வழங்கப்பட்டது', weight: 30 },
    { reasonEn: 'Harassment complaint received', reasonTa: 'துன்புறுத்தல் புகார் பெறப்பட்டது', weight: 16 },
    { reasonEn: 'Duplicate account detected', reasonTa: 'நகல் கணக்கு கண்டறியப்பட்டது', weight: 10 },
    { reasonEn: 'Automated activity detected', reasonTa: 'தானியங்கி செயல்பாடு கண்டறியப்பட்டது', weight: 4 },
  ],

  REJECTION_REASONS: [
    { reasonEn: 'Photo does not meet guidelines', reasonTa: 'புகைப்படம் வழிகாட்டுதல்களை பூர்த்தி செய்யவில்லை', weight: 35 },
    { reasonEn: 'Incomplete profile information', reasonTa: 'முழுமையற்ற சுயவிவர தகவல்', weight: 30 },
    { reasonEn: 'Suspicious account activity detected', reasonTa: 'சந்தேகத்திற்குரிய கணக்கு செயல்பாடு கண்டறியப்பட்டது', weight: 15 },
    { reasonEn: 'Inappropriate photo content', reasonTa: 'பொருத்தமற்ற புகைப்பட உள்ளடக்கம்', weight: 10 },
    { reasonEn: 'Unable to verify identity', reasonTa: 'அடையாளத்தை சரிபார்க்க முடியவில்லை', weight: 10 },
  ],

  ARCHIVE_REASONS: [
    'Profile no longer active — member request',
    'Account holder requested removal',
    'Inactive for over 6 months',
    'Duplicate profile — merged with primary',
  ],
};

export const REFERENCE_TABLES = [
  'profile_for', 'height', 'job_sector', 'kulam', 'rasi',
  'nakshatra', 'lagna', 'district', 'taluk', 'community', 'caste',
  'role', 'membership_plan', 'counter',
] as const;

export async function getReferenceIds(prisma: PrismaClient) {
  const profileFors = await prisma.profileFor.findMany();
  const heights = await prisma.height.findMany({ orderBy: { valueCm: 'asc' } });
  const jobSectors = await prisma.jobSector.findMany();
  const kulams = await prisma.kulam.findMany();
  const rasis = await prisma.rasi.findMany();
  const nakshatras = await prisma.nakshatra.findMany();
  const lagnas = await prisma.lagna.findMany();
  const districts = await prisma.district.findMany();
  const taluks = await prisma.taluk.findMany();
  const communities = await prisma.community.findMany();
  const castes = await prisma.caste.findMany();
  const roles = await prisma.role.findMany();
  const plans = await prisma.membershipPlan.findMany();

  const heightMap = new Map<number, number>();
  for (const h of heights) heightMap.set(h.valueCm, h.id);

  const districtMap = new Map(districts.map(d => [d.code, d.id]));
  const talukMap = new Map<string, number>();
  for (const t of taluks) talukMap.set(`${t.districtId}_${t.code}`, t.id);

  const kulamCodes = kulams.map(k => k.code);
  const rasiCodes = rasis.map(r => r.code);
  const nakshatraCodes = nakshatras.map(n => n.code);
  const lagnaCodes = lagnas.map(l => l.code);

  return {
    profileFors,
    heights,
    heightMap,
    jobSectors,
    kulams,
    kulamCodes,
    rasis,
    rasiCodes,
    nakshatras,
    nakshatraCodes,
    lagnas,
    lagnaCodes,
    districts: districtMap,
    taluks: talukMap,
    communities,
    castes,
    roles,
    plans,
  };
}
