export interface ImageObject {
  url: string;
  width?: number | null;
  height?: number | null;
}

export interface AdminAccount {
  id: string;
  customId: string;
  firstNameEn: string;
  lastNameEn: string;
  firstNameTa?: string;
  lastNameTa?: string;
  email: string;
  phone: string;
  role: string;
  plan: string;
  planExpiry: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { profiles: number };
  profileCount?: number;
  joinedDate?: string;
  accountStatus?: string;
  [key: string]: any;
}

export interface AdminManagedProfile {
  id: string;
  regNo: string;
  firstNameEn: string;
  lastNameEn: string;
  gender: string;
  dob: string;
  status: string;
  profilePhoto: string | ImageObject | null;
  photo?: string | ImageObject | null;
  createdAt: string;
  user?: any;
  owner?: any;
  horoscope?: any;
  [key: string]: any;
}

export interface AnalyticsData {
  [key: string]: any;
}

export interface BasicStats {
  [key: string]: any;
}
