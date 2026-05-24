import { ProfileVisibility, VerificationStatus } from './enums';

export interface Profile {
  id: string;
  userId: string;
  regNo: string;

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

  caste: string;
  casteTa: string | null;
  community: string;
  communityTa: string | null;
  kulam: string;
  kuladeivamEn: string;
  kuladeivamTa: string | null;

  star: string;
  rasi: string;
  laganam: string;
  dosham: string | null;
  birthTime: string | null;
  birthPlaceEn: string | null;
  birthPlaceTa: string | null;

  education: string;
  educationTa: string | null;
  jobDetail: string;
  jobDetailTa: string | null;
  companyName: string | null;
  jobLocationEn: string | null;
  jobLocationTa: string | null;
  jobSector: string;
  salaryMonthly: number | null;

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

  residence: string;
  propertyDetailsEn: string | null;
  propertyDetailsTa: string | null;
  landEn: string | null;
  landTa: string | null;
  otherAssetsEn: string | null;
  otherAssetsTa: string | null;
  vehicle: string | null;
  expectationEn: string | null;
  expectationTa: string | null;
  expectationNoteEn: string | null;
  expectationNoteTa: string | null;
  ageMin: number | null;
  ageMax: number | null;
  heightMinId: number | null;
  heightMaxId: number | null;
  monthlySalary: number | null;
  preferredLocationEn: string | null;
  preferredLocationTa: string | null;

  svgData?: any;
  svgDataEn?: any;
  svgNavamsaData?: any;
  svgNavamsaDataEn?: any;
  dasaRemaining?: string | null;

  horoscope?: {
    id: string;
    profileId: string;
    mode: 'CREATE' | 'UPLOAD';
    rasi: any | null;
    navamsa: any | null;
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
  horoscopeFile?: File | null;

  profilePhoto: string | File | null;
  gallery: string[];
  galleryPhotos?: string[];
  galleryFiles?: File[];

  rejectionReasonEn?: string | null;
  rejectionReasonTa?: string | null;
  statusReasonEn?: string | null;
  statusReasonTa?: string | null;
  verifiedAt?: string | null;
  verifiedBy?: string | null;

  status: ProfileVisibility;
  adminVerified: VerificationStatus;
  createdAt: string;
  updatedAt: string;
  canViewFullProfile: boolean;

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
