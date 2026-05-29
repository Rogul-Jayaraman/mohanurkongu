import type { PrismaClient } from '@prisma/client';

export const SEED_CONFIG = {
  TOTAL_ACCOUNTS: 2000,
  TOTAL_PROFILES: 1500,
  TOTAL_UPLOADS: 5000,
  TOTAL_SHORTLISTS: 4000,
  TOTAL_MEMBERSHIPS: 1000,
  TOTAL_SESSIONS: 4000,
  TOTAL_VERIFICATIONS: 2000,
  TOTAL_AUDIT_EVENTS: 3000,
  TOTAL_REG_SESSIONS: 500,
  TOTAL_RESET_SESSIONS: 200,
  TOTAL_PROFILE_OPENS: 2000,

  ACCOUNTS_ACTIVE_PCT: 0.92,
  ACCOUNTS_SUSPENDED_PCT: 0.06,
  ACCOUNTS_LOCKED_PCT: 0.02,

  PROFILE_STATUS_DISTRIBUTION: {
    ACTIVE: 900,
    PENDING: 150,
    DRAFT: 200,
    REJECTED: 100,
    ARCHIVED: 100,
    DELETED: 50,
  } as Record<string, number>,

  UPLOAD_DISTRIBUTION: {
    TEMP: 300,
    ATTACHED: 800,
    ACTIVE: 3200,
    DELETE_PENDING: 350,
    DELETED: 350,
  } as Record<string, number>,

  UPLOAD_TYPE_DISTRIBUTION: {
    profile_photo: 0.45,
    gallery_photo: 0.40,
    horoscope_chart: 0.10,
    document: 0.05,
  } as Record<string, number>,

  GENDER_DISTRIBUTION: [
    { value: 'FEMALE', weight: 54 },
    { value: 'MALE', weight: 44 },
    { value: 'OTHER', weight: 2 },
  ],

  DIET_DISTRIBUTION: [
    { value: 'VEGETARIAN', weight: 58 },
    { value: 'NON_VEGETARIAN', weight: 35 },
    { value: 'EGGETARIAN', weight: 5 },
    { value: 'VEGAN', weight: 2 },
  ],

  MARITAL_STATUS_DISTRIBUTION: [
    { value: 'NEVER_MARRIED', weight: 80 },
    { value: 'DIVORCED', weight: 10 },
    { value: 'WIDOWED', weight: 6 },
    { value: 'SEPARATED', weight: 3 },
    { value: 'ANNULED', weight: 1 },
  ],

  COMPLEXION_DISTRIBUTION: [
    { value: 'FAIR', weight: 33 },
    { value: 'WHEATISH', weight: 42 },
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
    { value: 'MYSELF', weight: 68 },
    { value: 'MY_SON', weight: 13 },
    { value: 'MY_DAUGHTER', weight: 11 },
    { value: 'MY_SISTER', weight: 5 },
    { value: 'MY_BROTHER', weight: 3 },
  ],

  JOB_SECTOR_DISTRIBUTION: [
    { value: 'PRIVATE', weight: 33 },
    { value: 'GOVT', weight: 16 },
    { value: 'BUSINESS', weight: 13 },
    { value: 'DOCTOR', weight: 9 },
    { value: 'FOREIGN', weight: 8 },
    { value: 'SELF_EMPLOYED', weight: 8 },
    { value: 'OTHERS', weight: 13 },
  ],

  AGE_FEMALE: { min: 18, max: 38, mean: 24, stddev: 3.5 },
  AGE_MALE: { min: 21, max: 50, mean: 29, stddev: 4.5 },

  HEIGHT_FEMALE: { min: 145, max: 178, mean: 158, stddev: 5 },
  HEIGHT_MALE: { min: 158, max: 196, mean: 172, stddev: 6 },

  SALARY_RANGES: [
    { min: 0, max: 15000, weight: 8 },
    { min: 15001, max: 30000, weight: 25 },
    { min: 30001, max: 60000, weight: 35 },
    { min: 60001, max: 100000, weight: 18 },
    { min: 100001, max: 200000, weight: 9 },
    { min: 200001, max: 500000, weight: 3 },
    { min: 500001, max: 9999999, weight: 2 },
  ],

  SECTION_COMPLETION: {
    PROFESSIONAL: 0.88,
    FAMILY: 0.65,
    HOROSCOPE: 0.50,
    PRIMARY_PHOTO: 0.93,
    GALLERY: 0.45,
    PARTNER_PREFERENCE: 0.65,
    ASSETS: 0.30,
    TA_TRANSLATION: 0.65,
  },

  GALLERY_SIZE_DISTRIBUTION: [
    { size: 1, weight: 30 },
    { size: 2, weight: 20 },
    { size: 3, weight: 15 },
    { size: 4, weight: 12 },
    { size: 5, weight: 8 },
    { size: 6, weight: 5 },
    { size: 7, weight: 3 },
    { size: 8, weight: 3 },
    { size: 10, weight: 2 },
    { size: 12, weight: 1 },
    { size: 15, weight: 1 },
  ],

  SHORTLIST_PER_USER: { min: 0, max: 80, activePowerAvg: 4.0 },
  HOT_PROFILE_SHORTLISTS: { min: 60, max: 150 },
  COLD_PROFILE_PCT: 0.15,

  MEMBERSHIP_PREMIUM_PCT: 0.30,
  MEMBERSHIP_EXPIRED_PCT: 0.06,
  MEMBERSHIP_CANCELLED_PCT: 0.03,

  MEMBERSHIP_TIER_DISTRIBUTION: [
    { value: 'BRONZE', weight: 50 },
    { value: 'SILVER', weight: 25 },
    { value: 'GOLD', weight: 18 },
    { value: 'PLATINUM', weight: 7 },
  ],

  VERIFICATION_PURPOSE_DISTRIBUTION: [
    { value: 'REGISTER', weight: 82 },
    { value: 'RESET_PASSWORD', weight: 18 },
  ],

  VERIFICATION_STATE_DISTRIBUTION: [
    { value: 'VERIFIED', weight: 68 },
    { value: 'EXPIRED', weight: 16 },
    { value: 'CANCELLED', weight: 10 },
    { value: 'PENDING', weight: 5 },
    { value: 'ARCHIVED', weight: 1 },
  ],

  SESSION_COUNT_PER_ACCOUNT: { min: 0, max: 12, avg: 2.8 },
  SESSION_REVOKE_PCT: 0.25,
  SESSION_EXPIRED_PCT: 0.15,

  ACTIVITY_RECENCY: [
    { period: '24h', pct: 0.06 },
    { period: '7d', pct: 0.22 },
    { period: '30d', pct: 0.32 },
    { period: '90d', pct: 0.24 },
    { period: 'older', pct: 0.16 },
  ],

  DISTRICT_WEIGHTS: {
    COIMBATORE: 0.28,
    ERODE: 0.16,
    TIRUPPUR: 0.12,
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
    { reasonEn: 'TOS violation', reasonTa: 'சேவை விதிமுறைகளை மீறுதல்', weight: 35 },
    { reasonEn: 'Fake information provided', reasonTa: 'தவறான தகவல் வழங்கப்பட்டது', weight: 28 },
    { reasonEn: 'Harassment complaint received', reasonTa: 'துன்புறுத்தல் புகார் பெறப்பட்டது', weight: 18 },
    { reasonEn: 'Duplicate account detected', reasonTa: 'நகல் கணக்கு கண்டறியப்பட்டது', weight: 12 },
    { reasonEn: 'Automated activity detected', reasonTa: 'தானியங்கி செயல்பாடு கண்டறியப்பட்டது', weight: 5 },
    { reasonEn: 'Under legal investigation', reasonTa: 'சட்ட விசாரணையின் கீழ்', weight: 2 },
  ],

  REJECTION_REASONS: [
    { reasonEn: 'Photo does not meet guidelines', reasonTa: 'புகைப்படம் வழிகாட்டுதல்களை பூர்த்தி செய்யவில்லை', weight: 30 },
    { reasonEn: 'Incomplete profile information', reasonTa: 'முழுமையற்ற சுயவிவர தகவல்', weight: 28 },
    { reasonEn: 'Suspicious account activity detected', reasonTa: 'சந்தேகத்திற்குரிய கணக்கு செயல்பாடு கண்டறியப்பட்டது', weight: 16 },
    { reasonEn: 'Inappropriate photo content', reasonTa: 'பொருத்தமற்ற புகைப்பட உள்ளடக்கம்', weight: 12 },
    { reasonEn: 'Unable to verify identity', reasonTa: 'அடையாளத்தை சரிபார்க்க முடியவில்லை', weight: 10 },
    { reasonEn: 'Information mismatch with documents', reasonTa: 'ஆவணங்களுடன் தகவல் பொருந்தவில்லை', weight: 4 },
  ],

  ARCHIVE_REASONS: [
    'Profile no longer active — member request',
    'Account holder requested removal',
    'Inactive for over 6 months',
    'Duplicate profile — merged with primary',
    'Matrimony successful — profile closed',
  ],

  ADMIN_AUDIT_ACTIONS: [
    'PROFILE_APPROVED',
    'PROFILE_REJECTED',
    'PROFILE_ARCHIVED',
    'PROFILE_DELETED',
    'ACCOUNT_SUSPENDED',
    'ACCOUNT_UNSUSPENDED',
    'BULK_APPROVE',
    'PROFILE_EDITED',
    'ASSIGNED_REVIEWER',
    'ESCALATED_PROFILE',
    'FRAUD_FLAGGED',
    'CONTACT_REQUEST',
  ],

  HOROSCOPE_MODE_DISTRIBUTION: [
    { value: 'GENERATED', weight: 65 },
    { value: 'UPLOADED', weight: 35 },
  ],

  EDGE_CASE_CONFIG: {
    EMPTY_GALLERY_PCT: 0.08,
    LARGE_GALLERY_PCT: 0.03,
    MISSING_HOROSCOPE_PCT: 0.12,
    SINGLE_PHOTO_PCT: 0.10,
    NO_SHORTLIST_PCT: 0.20,
    VERY_LONG_BIO_PCT: 0.02,
    UNICODE_ONLY_PCT: 0.02,
    CONFLICTING_PREFERENCES_PCT: 0.03,
  },

  PERFORMANCE_SKEW: {
    HOT_LOCATIONS: ['COIMBATORE', 'ERODE', 'TIRUPPUR'],
    HOT_LOCATION_CONCENTRATION: 0.56,
    HOT_AGE_RANGE: { min: 22, max: 30 },
    SALARY_OUTLIER_PCT: 0.02,
  },
};

export const REFERENCE_TABLES = [
  'profile_for', 'height', 'job_sector', 'kulam', 'rasi',
  'nakshatra', 'lagna', 'district', 'taluk', 'community', 'caste',
  'role', 'membership_plan', 'counter', 'system_settings',
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

  const districtByIdMap = new Map<number, string>();
  for (const d of districts) districtByIdMap.set(d.id, d.code);

  return {
    profileFors,
    heights,
    heightMap,
    jobSectors,
    kulams,
    kulamCodes: kulams.map(k => k.code),
    rasis,
    rasiCodes: rasis.map(r => r.code),
    nakshatras,
    nakshatraCodes: nakshatras.map(n => n.code),
    lagnas,
    lagnaCodes: lagnas.map(l => l.code),
    districts: districtMap,
    districtsById: districtByIdMap,
    taluks: talukMap,
    communities,
    castes,
    roles,
    plans,
  };
}

export const PASSWORD_HASH = '$argon2id$v=19$m=65536,t=3,p=4$SEED_DATA_PLACEHOLDER';
