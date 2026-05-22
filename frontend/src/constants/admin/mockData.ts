/**
 * Centralized Mock Data for Admin Modules (Matrimony & Mandapam).
 * UI-only phase. Replace with API calls in production.
 */

// ── Matrimony Types ──────────────────────────────────────────────────────────

export interface Plan {
  id: string;
  nameEn: string;
  nameTa: string;
  name: string; // legacy
  price: number;
  duration: number; // months
  featuresEn: string[];
  featuresTa: string[];
  features: string[]; // legacy
  isPopular: boolean;
  isActive: boolean;
  memberCount: number;
}

export interface VerificationProfile {
  id: string;
  name: string;
  age: number;
  height: string;
  religion: string;
  caste: string;
  education: string;
  profession: string;
  location: string;
  createdBy: string;
  submittedAt: string;
  photos: string[];
  about: string;
  status: 'PENDING';
}

export interface AdminUser {
  id: string;
  displayId: string;
  fullName: string;
  name: string; // Added for compatibility
  email: string;
  phoneNumber: string;
  phone: string; // Added for compatibility
  img: string;
  joinedDate: string;
  status: 'active' | 'suspended' | 'pending';
  profileCount: number; // Added for compatibility
}

export interface ManagedProfile {
    id: string;
    regNo: string;
    nameEn: string;
    nameTa: string;
    photo: string;
    gender: 'MALE' | 'FEMALE';
    age: number;
    height: string;
    education: string;
    ownerName: string;
    status: 'approved' | 'pending' | 'rejected';
    kulam?: string;
    kuladeivam?: string;
    createdAt?: string;
}

export interface AdminProfile {
  id: string;
  memberId: string;
  firstName: string;
  lastName: string;
  age: number;
  religion: string;
  caste: string;
  profileImage: string;
  isFeatured: boolean;
  createdAt: string;
  memberedBy: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
}

// ── Mandapam Types ───────────────────────────────────────────────────────────

export interface Booking {
  id: string;
  eventTitle: string;
  clientName: string;
  clientPhone: string;
  date: string;
  session: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentStatus: 'not_paid' | 'advance' | 'fully_paid' | 'refunded';
  totalAmount: number;
  advanceAmount: number;
  packageName: string;
}

export interface Package {
  id: string;
  nameEn: string;
  nameTa: string;
  name: string; // legacy
  price: string;
  featuresEn: string[];
  featuresTa: string[];
  features: string[]; // legacy
  isFeatured: boolean;
  status: string;
  isActive: boolean;
}

// ── Matrimony Data ───────────────────────────────────────────────────────────

export const MOCK_PLANS: Plan[] = [
  {
    id: 'plan-1',
    nameEn: 'Basic',
    nameTa: 'அடிப்படை',
    name: 'Basic',
    price: 0,
    duration: 12,
    featuresEn: ['View limited profiles', 'Send 5 interests per day', 'Basic search filters', 'Standard profile listing'],
    featuresTa: ['வரம்பிற்குட்பட்ட சுயவிவரங்களைப் பார்க்கவும்', 'தினசரி 5 விருப்பங்களை அனுப்பவும்', 'அடிப்படை தேடல் வடிப்பான்கள்', 'நிலையான சுயவிவரப் பட்டியல்'],
    features: ['View limited profiles', 'Send 5 interests per day', 'Basic search filters', 'Standard profile listing'],
    isPopular: false,
    isActive: true,
    memberCount: 1420,
  },
  {
    id: 'plan-2',
    nameEn: 'Premium',
    nameTa: 'பிரீமியம்',
    name: 'Premium',
    price: 1499,
    duration: 12,
    featuresEn: ['Unlimited profiles visibility', 'Priority interests sending', 'Advanced search filters', 'Horoscope matching', 'Direct contact details', 'Featured profile placement', 'Priority support'],
    featuresTa: ['வரம்பற்ற சுயவிவரக் காட்சி', 'முன்னுரிமை விருப்பங்களை அனுப்புதல்', 'மேம்பட்ட தேடல் வடிப்பான்கள்', 'ஜாதகப் பொருத்தம்', 'நேரடி தொடர்பு விவரங்கள்', 'சிறப்பு சுயவிவர இடமாற்றம்', 'முன்னுரிமை ஆதரவு'],
    features: ['Unlimited profiles visibility', 'Priority interests sending', 'Advanced search filters', 'Horoscope matching', 'Direct contact details', 'Featured profile placement', 'Priority support'],
    isPopular: true,
    isActive: true,
    memberCount: 845,
  },
];

export const MOCK_VERIFICATION_PROFILES: VerificationProfile[] = [
  {
    id: 'vp-1',
    name: 'Anbu Selvan',
    age: 28,
    height: "5'8\"",
    religion: 'Hindu',
    caste: 'Vellalar',
    education: 'B.E Computer Science',
    profession: 'Software Engineer',
    location: 'Coimbatore, Tamil Nadu',
    createdBy: 'Self',
    submittedAt: '2026-04-10T08:30:00Z',
    photos: ['https://i.pravatar.cc/300?img=12'],
    about: 'Simple and family-oriented person.',
    status: 'PENDING',
  },
  {
    id: 'vp-2',
    name: 'Kavitha Murugan',
    age: 25,
    height: "5'4\"",
    religion: 'Hindu',
    caste: 'Gounder',
    education: 'M.Sc Biotechnology',
    profession: 'Lab Technician',
    location: 'Erode, Tamil Nadu',
    createdBy: 'Father',
    submittedAt: '2026-04-11T10:15:00Z',
    photos: ['https://i.pravatar.cc/300?img=47'],
    about: 'Loves cooking and classical music.',
    status: 'PENDING',
  },
];

export const MOCK_USERS: AdminUser[] = [
  {
    id: 'u-1',
    displayId: 'KMM-0001',
    fullName: 'Rajesh Kannan',
    name: 'Rajesh Kannan',
    email: 'rajesh.kannan@example.com',
    phoneNumber: '+91 90807 25466',
    phone: '+91 90807 25466',
    img: 'https://i.pravatar.cc/150?img=3',
    joinedDate: '2025-11-15',
    status: 'active',
    profileCount: 2,
  },
  {
    id: 'u-2',
    displayId: 'KMM-0002',
    fullName: 'Meena Selvam',
    name: 'Meena Selvam',
    email: 'meena.selvam@example.com',
    phoneNumber: '+91 97654 32109',
    phone: '+91 97654 32109',
    img: 'https://i.pravatar.cc/150?img=48',
    joinedDate: '2025-12-03',
    status: 'active',
    profileCount: 1,
  },
];

export const MOCK_MANAGED_PROFILES: ManagedProfile[] = [
    {
        id: 'p-1',
        regNo: 'KMP-1024',
        nameEn: 'Anbu Selvan',
        nameTa: 'அன்பு செல்வன்',
        photo: 'https://i.pravatar.cc/300?img=12',
        gender: 'MALE',
        age: 28,
        height: "5'8\"",
        education: 'B.E Computer Science',
        ownerName: 'Rajesh Kannan',
        status: 'approved',
        kulam: 'Vellalar',
        kuladeivam: 'Mariamman'
    },
    {
        id: 'p-2',
        regNo: 'KMP-1025',
        nameEn: 'Kavitha Murugan',
        nameTa: 'கவிதா முருகன்',
        photo: 'https://i.pravatar.cc/300?img=47',
        gender: 'FEMALE',
        age: 25,
        height: "5'4\"",
        education: 'M.Sc Biotechnology',
        ownerName: 'Meena Selvam',
        status: 'pending',
        kulam: 'Gounder',
        kuladeivam: 'Murugan'
    }
];

export const MOCK_PROFILES: AdminProfile[] = [
  {
    id: 'ap-1',
    memberId: 'KMM-0001',
    firstName: 'Anbu',
    lastName: 'Selvan',
    age: 28,
    religion: 'Hindu',
    caste: 'Vellalar',
    profileImage: 'https://i.pravatar.cc/300?img=12',
    isFeatured: true,
    createdAt: '2026-04-10T08:30:00Z',
    memberedBy: 'KMM-0001',
    status: 'APPROVED',
  },
  {
    id: 'ap-2',
    memberId: 'KMM-0002',
    firstName: 'Kavitha',
    lastName: 'Murugan',
    age: 25,
    religion: 'Hindu',
    caste: 'Gounder',
    profileImage: 'https://i.pravatar.cc/300?img=47',
    isFeatured: false,
    createdAt: '2026-04-11T10:15:00Z',
    memberedBy: 'KMM-0002',
    status: 'PENDING',
  },
];

// ── Mandapam Data ────────────────────────────────────────────────────────────

export const MOCK_BOOKINGS: Booking[] = [
  {
    id: 'B001',
    eventTitle: 'Suresh & Meena Wedding',
    clientName: 'Suresh Kumar',
    clientPhone: '+91 90807 25466',
    date: '2026-06-15',
    session: 'Morning',
    status: 'confirmed',
    paymentStatus: 'fully_paid',
    totalAmount: 50000,
    advanceAmount: 15000,
    packageName: 'Classic Wedding',
  },
  {
    id: 'B002',
    eventTitle: 'Corporate Annual Meet',
    clientName: 'Vijay Anand',
    clientPhone: '+91 97654 32109',
    date: '2026-07-20',
    session: 'Full Day',
    status: 'pending',
    paymentStatus: 'advance',
    totalAmount: 75000,
    advanceAmount: 10000,
    packageName: 'Premium Event',
  },
  {
    id: 'B003',
    eventTitle: 'Nithya Baby Shower',
    clientName: 'Venkatesh S',
    clientPhone: '+91 96543 21098',
    date: '2026-05-10',
    session: 'Evening',
    status: 'completed',
    paymentStatus: 'fully_paid',
    totalAmount: 25000,
    advanceAmount: 5000,
    packageName: 'Basic Gathering',
  },
  {
    id: 'B004',
    eventTitle: 'Engagement Ceremony',
    clientName: 'Priya Sundaram',
    clientPhone: '+91 95432 10987',
    date: '2026-08-05',
    session: 'Morning',
    status: 'cancelled',
    paymentStatus: 'refunded',
    totalAmount: 30000,
    advanceAmount: 5000,
    packageName: 'Classic Wedding',
  },
];

export const MOCK_PACKAGES: Package[] = [
  {
    id: 'PKG01',
    nameEn: 'Basic Gathering',
    nameTa: 'அடிப்படை ஒன்றுகூடல்',
    name: 'Basic Gathering',
    price: '₹25,000',
    featuresEn: ['Hall Seatings (100-200)', 'Basic Lighting', 'Standard Sound System', '4 Hours Session'],
    featuresTa: ['அரங்க இருக்கைகள் (100-200)', 'அடிப்படை விளக்குகள்', 'தரமான ஒலி அமைப்பு', '4 மணிநேர அமர்வு'],
    features: ['Hall Seatings (100-200)', 'Basic Lighting', 'Standard Sound System', '4 Hours Session'],
    isFeatured: false,
    status: 'Active',
    isActive: true,
  },
  {
    id: 'PKG02',
    nameEn: 'Classic Wedding',
    nameTa: 'கிளாசிக் திருமணம்',
    name: 'Classic Wedding',
    price: '₹50,000',
    featuresEn: ['Hall Seatings (300-500)', 'Stage Decoration', 'Dedicated Kitchen Space', 'Full Day Access', 'Power Backup'],
    featuresTa: ['அரங்க இருக்கைகள் (300-500)', 'மேடை அலங்காரம்', 'பிரத்யேக சமையலறை இடம்', 'முழு நாள் அணுகல்', 'பவர் பேக்கப்'],
    features: ['Hall Seatings (300-500)', 'Stage Decoration', 'Dedicated Kitchen Space', 'Full Day Access', 'Power Backup'],
    isFeatured: true,
    status: 'Active',
    isActive: true,
  },
  {
    id: 'PKG03',
    nameEn: 'Premium Event',
    nameTa: 'பிரீமியம் நிகழ்வு',
    name: 'Premium Event',
    price: '₹85,000',
    featuresEn: ['Hall Seatings (500+)', 'Grand Entrance Decor', 'Centralized AC', 'VIP Lounge', 'Photography Spot', 'Unlimited Access'],
    featuresTa: ['அரங்க இருக்கைகள் (500+)', 'பெரிய நுழைவாயில் அலங்காரம்', 'மத்திய ஏசி', 'விஐபி லவுஞ்ச்', 'புகைப்பட தளம்', 'வரம்பற்ற அணுகல்'],
    features: ['Hall Seatings (500+)', 'Grand Entrance Decor', 'Centralized AC', 'VIP Lounge', 'Photography Spot', 'Unlimited Access'],
    isFeatured: false,
    status: 'Active',
    isActive: true,
  },
];

export const TODAY_EVENTS = [
  { id: 'TE01', title: 'Suresh & Meena Wedding', time: '06:00 AM - 02:00 PM', type: 'Wedding', client: 'Suresh Kumar', status: 'live' },
  { id: 'TE02', title: 'Corporate Meetup', time: '04:00 PM - 09:00 PM', type: 'Meeting', client: 'Vijay Anand', status: 'upcoming' },
];

export const UPCOMING_EVENTS = [
  { id: 'UE01', title: 'Priya Engagement', date: 'May 12, 2026', type: 'Engagement', client: 'Priya Sundar' },
  { id: 'UE02', title: 'Nithya Baby Shower', date: 'May 18, 2026', type: 'Ceremony', client: 'Senthil' },
  { id: 'UE03', title: 'Annual Gala', date: 'June 05, 2026', type: 'Party', client: 'SRK Corp' },
];
