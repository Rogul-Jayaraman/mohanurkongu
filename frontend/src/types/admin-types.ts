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
  adminVerified: string;
  status: string;
  profilePhoto: string | null;
  photo?: string | null;
  createdAt: string;
  user?: any;
  owner?: any;
  horoscope?: any;
  [key: string]: any;
}

export interface MandapamPackage {
  id: string;
  [key: string]: any;
}

export interface MandapamBooking {
  id: string;
  [key: string]: any;
}

export interface AnalyticsData {
  [key: string]: any;
}

export interface BasicStats {
  [key: string]: any;
}
