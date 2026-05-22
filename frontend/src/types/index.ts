export enum AccountRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export enum AccountPlan {
  BASIC = 'BASIC',
  PREMIUM = 'PREMIUM',
}

export interface User {
  id: string;
  customId: string;
  firstNameEn: string;
  lastNameEn: string;
  firstNameTa: string | null;
  lastNameTa: string | null;
  email: string;
  phone: string;
  role: AccountRole;
  plan: AccountPlan;
  planExpiry: string | null;
  createdAt: string;
  updatedAt: string;
}

export enum VerificationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

export enum ProfileVisibility {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DRAFT = 'DRAFT',
}

export interface Profile {
  id: string;
  userId: string;
  regNo: string;
  
  // Personal
  profileFor: string;
  firstNameEn: string | null;
  lastNameEn: string | null;
  firstNameTa: string | null;
  lastNameTa: string | null;
  dob: string;
  gender: string;
  maritalStatus: string;
  currentDistrict: string;
  currentDistrictEn: string | null;
  currentDistrictTa: string | null;
  currentCityEn: string | null;
  currentCityTa: string | null;
  currentStateEn: string | null;
  currentStateTa: string | null;
  currentCountryEn: string | null;
  currentCountryTa: string | null;
  currentTaluk: string;
  currentTalukTa: string | null;
  nativeDistrict: string;
  nativeDistrictTa: string | null;
  nativeTaluk: string;
  nativeTalukTa: string | null;
  bloodGroup: string;
  height: number;
  weight: number;
  diet: string;
  complexion: string | null;

  // Community
  caste: string;
  casteTa: string | null;
  community: string;
  communityTa: string | null;
  kulam: string;
  kuladeivamEn: string;
  kuladeivamTa: string | null;

  // Astrology
  star: string;
  rasi: string;
  laganam: string;
  dosham: string | null;
  birthTime: string | null;
  birthPlaceEn: string | null;
  birthPlaceTa: string | null;

  // Professional
  education: string;
  educationTa: string | null;
  jobDetail: string;
  jobDetailTa: string | null;
  companyName: string | null;
  jobLocationEn: string | null;
  jobLocationTa: string | null;
  jobSector: string;
  salaryMonthly: number | null;

  // Family
  fatherNameEn: string;
  fatherNameTa: string | null;
  fatherIsLate: boolean;
  fatherJob: string | null;
  fatherJobTa: string | null;
  fatherSalary: number | null;
  motherNameEn: string;
  motherNameTa: string | null;
  motherIsLate: boolean;
  motherJob: string | null;
  motherJobTa: string | null;
  motherSalary: number | null;
  noOfBrothers: number;
  noOfSisters: number;

  // Assets & Expectations
  residence: string;
  propertyDetailsEn: string | null;
  propertyDetailsTa: string | null;
  expectationEn: string | null;
  expectationTa: string | null;

  // Legacy Horoscope Fields (for backward compatibility)
  svgData?: any;
  svgDataEn?: any;
  svgNavamsaData?: any;
  svgNavamsaDataEn?: any;
  dasaRemaining?: string | null;

  horoscope?: {
    id: string;
    profileId: string;
    mode: 'CREATE' | 'UPLOAD';
    rasi: any | null;    // JSON object for CREATE, image URL for UPLOAD
    navamsa: any | null; // JSON object for CREATE, image URL for UPLOAD
    horoscopeVersion?: number;
    birthDate?: string | null;
    birthTime?: string | null;
    birthLocationName?: string | null;
    birthLatitude?: number | null;
    birthLongitude?: number | null;
    timezone?: string | null;
    ayanamsa?: number | null;
    generatedAt?: string | null;
    generationHash?: string | null;
    horoscopeJson?: any | null;
  };
  horoscopeFile?: File | null; // For upload flow

  // Photos
  profilePhoto: string | File | null;
  gallery: string[];
  galleryPhotos?: string[]; // Legacy or specific view use
  galleryFiles?: File[]; // During upload flow

  // Rejection / Block Reasons
  rejectionReasonEn?: string | null;
  rejectionReasonTa?: string | null;
  statusReasonEn?: string | null;
  statusReasonTa?: string | null;
  verifiedAt?: string | null;
  verifiedBy?: string | null;

  // Meta
  status: ProfileVisibility;
  adminVerified: VerificationStatus;
  createdAt: string;
  updatedAt: string;
  canViewFullProfile: boolean;

  // Allow string indexing for form loops
  [key: string]: any;
}

export interface ProfileSummary {
  id: string;
  regNo: string;
  firstNameEn: string;
  lastNameEn: string;
  firstNameTa: string | null;
  lastNameTa: string | null;
  age: number;
  education: string;
  community: string;
  profession: string;
  jobDetail: string;
  currentDistrictEn: string | null;
  currentDistrictTa: string | null;
  currentCityEn: string | null;
  currentCityTa: string | null;
  profilePhoto: string | null;
  isShortlisted: boolean;
}

export * from './calendar';
export * from './gallery';
