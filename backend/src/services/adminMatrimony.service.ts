import prisma from '../config/prisma';
import { AccountStatus, VerificationStatus, ProfileVisibility } from '@prisma/client';
import * as profileService from './profile';
import { DISTRICT_TAMIL, TALUK_TAMIL } from '../locations';

const calculateAge = (dob: Date) => {
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
};

const toTitleCase = (str?: string | null) => {
  if (!str) return '';
  return str.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
};

export interface AdminAccount {
  id: string;
  firstNameEn: string;
  lastNameEn: string;
  firstNameTa: string;
  lastNameTa: string;
  displayId: string;
  email: string;
  phone: string;

  profileCount: number;
  accountStatus: AccountStatus;
  joinedDate: Date;
}

export interface AdminManagedProfile {
  id: string;
  regNo: string;
  firstNameEn: string | null;
  lastNameEn: string | null;
  firstNameTa: string | null;
  lastNameTa: string | null;
  owner: {
    firstNameEn: string;
    lastNameEn: string;
    firstNameTa: string;
    lastNameTa: string;
    id: string;
    phone: string;
  };
  status: ProfileVisibility;
  adminVerified: VerificationStatus;
  photo: string | null;
  age: number;
  caste: string | null;
  community: string | null;
  currentDistrict: string | null;
  currentDistrictEn: string | null;
  currentDistrictTa: string | null;
  currentTaluk: string | null;
  kulam: string | null;
  kuladeivamEn: string | null;
  kuladeivamTa: string | null;
  createdAt: Date;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const getAccounts = async (params: { page: number; limit: number; search?: string }): Promise<PaginatedResponse<AdminAccount>> => {
  const { page, limit, search } = params;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (search) {
    where.OR = [
      { firstNameEn: { contains: search, mode: 'insensitive' } },
      { lastNameEn: { contains: search, mode: 'insensitive' } },
      { firstNameTa: { contains: search, mode: 'insensitive' } },
      { lastNameTa: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search } },
    ];
  }


  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { serialInt: 'desc' },
      select: {
        id: true,
        firstNameEn: true,
        lastNameEn: true,
        firstNameTa: true,
        lastNameTa: true,
        customId: true,
        email: true,
        phone: true,

        accountStatus: true,
        createdAt: true,
        _count: {
          select: { profiles: true }
        }
      }
    }),
    prisma.user.count({ where })
  ]);

  return {
    data: users.map((u: any) => ({
      id: u.id,
      firstNameEn: u.firstNameEn,
      lastNameEn: u.lastNameEn,
      firstNameTa: u.firstNameTa,
      lastNameTa: u.lastNameTa,
      displayId: u.customId,
      email: u.email,
      phone: u.phone,

      profileCount: u._count.profiles,
      accountStatus: u.accountStatus,
      joinedDate: u.createdAt
    })),
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};

export const suspendAccount = async (userId: string, reasonEn: string, reasonTa: string) => {
  return prisma.$transaction(async (tx: any) => {
    const user = await tx.user.update({
      where: { id: userId },
      data: {
        accountStatus: AccountStatus.SUSPENDED,
        suspensionReasonEn: reasonEn,
        suspensionReasonTa: reasonTa,
        suspendedAt: new Date()
      }
    });

    await tx.profile.updateMany({
      where: { userId },
      data: {
        status: ProfileVisibility.INACTIVE,
        statusReasonEn: `Account suspended: ${reasonEn}`,
        statusReasonTa: `கணக்கு இடைநீக்கம் செய்யப்பட்டது: ${reasonTa}`
      }
    });

    return user;
  });
};

export const revokeSuspension = async (userId: string) => {
  return prisma.$transaction(async (tx: any) => {
    const user = await tx.user.update({
      where: { id: userId },
      data: {
        accountStatus: AccountStatus.ACTIVE,
        suspensionReasonEn: null,
        suspensionReasonTa: null,
        suspendedAt: null
      }
    });

    await tx.profile.updateMany({
      where: { userId },
      data: {
        status: ProfileVisibility.ACTIVE,
        statusReasonEn: null,
        statusReasonTa: null
      }
    });

    return user;
  });
};

// TODO: Re-implement upgradePlan, cancelPlan, getPlanHistory with new plan system

export const getProfiles = async (params: { page: number; limit: number; search?: string; status?: string; verified?: string }): Promise<PaginatedResponse<AdminManagedProfile>> => {
  const { page, limit, search, status, verified } = params;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (search) {
    where.OR = [
      { firstNameEn: { contains: search, mode: 'insensitive' } },
      { lastNameEn: { contains: search, mode: 'insensitive' } },
      { firstNameTa: { contains: search, mode: 'insensitive' } },
      { lastNameTa: { contains: search, mode: 'insensitive' } },
      { regNo: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (status && status !== 'All') {
    where.status = status as ProfileVisibility;
  } else {
    // Exclude drafts by default from administrative lists
    where.status = { not: ProfileVisibility.DRAFT };
  }
  if (verified && verified !== 'All') {
    where.adminVerified = verified as VerificationStatus;
  }

  const [profiles, total] = await Promise.all([
    prisma.profile.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { firstNameEn: true, lastNameEn: true, firstNameTa: true, lastNameTa: true, id: true, phone: true, customId: true }
        }
      }
    }),
    prisma.profile.count({ where })
  ]);

  return {
    data: (profiles as any[]).map((p: any) => ({
      id: p.id,
      regNo: p.regNo,
      firstNameEn: p.firstNameEn,
      lastNameEn: p.lastNameEn,
      firstNameTa: p.firstNameTa,
      lastNameTa: p.lastNameTa,
      owner: {
        firstNameEn: p.user.firstNameEn,
        lastNameEn: p.user.lastNameEn,
        firstNameTa: p.user.firstNameTa,
        lastNameTa: p.user.lastNameTa,
        id: p.user.customId,
        phone: p.user.phone
      },
      status: p.status,
      adminVerified: p.adminVerified,
      photo: p.profilePhoto,
      age: calculateAge(p.dob),
      caste: p.caste,
      community: p.community,
      currentDistrict: p.currentDistrict,
      currentDistrictEn: p.currentDistrictEn,
      currentDistrictTa: p.currentDistrictTa,
      currentTaluk: p.currentTaluk,
      kulam: p.kulam,
      kuladeivamEn: p.kuladeivamEn,
      kuladeivamTa: p.kuladeivamTa,
      createdAt: p.createdAt
    })),
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};

export const getVerificationProfiles = async (params: { page: number; limit: number; search?: string }) => {
  const response = await getProfiles({ 
    ...params, 
    verified: VerificationStatus.PENDING,
    status: ProfileVisibility.ACTIVE // Only verify active profiles
  });
  const data = response.data.map((p) => {
    // Standardize currentLocation logic (similar to getProfileById but for list)
    const isOther = p.currentDistrict === 'OTHER';
    const currentLocationEn = isOther
      ? [p.currentDistrictEn, p.currentTaluk].filter(Boolean).map(s => toTitleCase(s)).join(', ')
      : [toTitleCase(p.currentDistrict), toTitleCase(p.currentTaluk)].filter(Boolean).join(', ');
    
    const currentLocationTa = isOther
      ? [p.currentDistrictTa, p.currentTaluk].filter(Boolean).join(', ')
      : [
          DISTRICT_TAMIL[p.currentDistrict as string] || p.currentDistrict,
          TALUK_TAMIL[p.currentTaluk as string] || p.currentTaluk
        ].filter(Boolean).join(', ');

    return {
      id: p.id,
      firstNameEn: p.firstNameEn,
      lastNameEn: p.lastNameEn,
      firstNameTa: p.firstNameTa,
      lastNameTa: p.lastNameTa,
      regNo: p.regNo,
      createdByEn: `${[p.owner.firstNameEn, p.owner.lastNameEn].filter(Boolean).join(' ')} (${p.owner.id})`,
      createdByTa: `${[p.owner.firstNameTa, p.owner.lastNameTa].filter(Boolean).join(' ')} (${p.owner.id})`,
      photo: p.photo,
      age: p.age,
      caste: p.caste,
      community: p.community,
      currentLocationEn,
      currentLocationTa,
      kulam: p.kulam,
      kuladeivamEn: p.kuladeivamEn,
      kuladeivamTa: p.kuladeivamTa,
      createdAt: p.createdAt
    };
  });
  return { ...response, data };
};

export const verifyProfile = async (profileId: string, data: { status: VerificationStatus; reasonEn?: string; reasonTa?: string }) => {
  const { status, reasonEn, reasonTa } = data;
  return prisma.profile.update({
    where: { id: profileId },
    data: {
      adminVerified: status,
      rejectionReasonEn: reasonEn || null,
      rejectionReasonTa: reasonTa || null,
      verifiedAt: status === VerificationStatus.ACCEPTED ? new Date() : null
    }
  });
};

export const blockProfile = async (profileId: string, reasonEn: string, reasonTa: string) => {
  return prisma.profile.update({
    where: { id: profileId },
    data: {
      status: ProfileVisibility.INACTIVE,
      statusReasonEn: reasonEn,
      statusReasonTa: reasonTa
    }
  });
};

export const updateProfileVisibility = async (profileId: string, status: ProfileVisibility) => {
  return prisma.profile.update({
    where: { id: profileId },
    data: { status }
  });
};

export const getDashboardStats = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const [totalUsers, pendingVerifications, totalRevenue, bookingsToday, recentBookings] = await Promise.all([
        prisma.user.count({ where: { role: 'USER' } }),
        prisma.profile.count({ 
            where: { 
                adminVerified: VerificationStatus.PENDING,
                status: ProfileVisibility.ACTIVE // Only count active pending profiles
            } 
        }),
        prisma.planTransaction.aggregate({ _sum: { amount: true } }),
        prisma.mandapamBooking.count({ 
            where: { 
                date: {
                    gte: today,
                    lt: tomorrow
                }
            } 
        }),
        prisma.mandapamBooking.findMany({
            where: {
                date: {
                    gte: today,
                    lt: tomorrow
                }
            },
            take: 5,
            orderBy: { createdAt: 'desc' }
        })
    ]);

    return {
        stats: {
            totalUsers,
            pendingVerifications,
            totalRevenue: totalRevenue._sum.amount || 0,
            bookingsToday
        },
        recentBookings: recentBookings.map((b: any) => ({
            eventId: b.eventId,
            eventTitleEn: b.eventTitleEn,
            eventTitleTa: b.eventTitleTa,
            session: b.session,
            nameEn: b.contactNameEn,
            nameTa: b.contactNameTa,
            phone: b.phone,
            paymentStatus: b.paymentStatus,
            amount: b.totalAmount,
            date: b.date
        }))
    };
};



export const getProfileById = async (id: string) => {
    const profile = await prisma.profile.findUnique({
        where: { id },
        include: {
            user: {
                select: {
                    id: true,
                    firstNameEn: true,
                    lastNameEn: true,
                    firstNameTa: true,
                    lastNameTa: true,
                    email: true,
                    phone: true,
                }
            },
            horoscope: true
        }
    });

    if (!profile) return null;

    const isOther = profile.currentDistrict === 'OTHER';
    const currentLocationEn = isOther
        ? [profile.currentCityEn, profile.currentStateEn, profile.currentCountryEn].filter(Boolean).map(s => toTitleCase(s)).join(', ')
        : [toTitleCase(profile.currentDistrict), toTitleCase(profile.currentTaluk)].filter(Boolean).join(', ');

    const currentLocationTa = isOther
        ? [profile.currentCityTa, profile.currentStateTa, profile.currentCountryTa].filter(Boolean).join(', ')
        : [
            DISTRICT_TAMIL[profile.currentDistrict as string] || profile.currentDistrict,
            TALUK_TAMIL[profile.currentTaluk as string] || profile.currentTaluk
          ].filter(Boolean).join(', ');

    const nativeLocationEn = [toTitleCase(profile.nativeDistrict), toTitleCase(profile.nativeTaluk)].filter(Boolean).join(', ');
    const nativeLocationTa = [
        DISTRICT_TAMIL[profile.nativeDistrict as string] || profile.nativeDistrict,
        TALUK_TAMIL[profile.nativeTaluk as string] || profile.nativeTaluk
    ].filter(Boolean).join(', ');


    // Omit raw location fields and sensitive/unnecessary data for cleaner response
    const {
        currentDistrict, currentTaluk,
        currentDistrictEn, currentDistrictTa,
        currentCityEn, currentCityTa,
        currentStateEn, currentStateTa,
        currentCountryEn, currentCountryTa,
        nativeDistrict, nativeTaluk,
        user,
        horoscope,
        ...rest
    } = profile as any;

    // Clean horoscope object
    let cleanHoroscope = null;
    if (horoscope) {
        const { id, profileId, ...horoRest } = horoscope;
        cleanHoroscope = horoRest;
    }

    return {
        ...rest,
        user: {
            email: user?.email,
            phone: user?.phone
        },
        horoscope: cleanHoroscope,
        currentLocationEn,
        currentLocationTa,
        nativeLocationEn,
        nativeLocationTa,
        isShortlisted: false,
        canViewFullProfile: true,
        plan: 'BASIC'
    };
};

// --- SETTINGS ---

export const getSetting = async (key: string) => {
  return prisma.appSettings.findUnique({
    where: { key }
  });
};

export const updateSetting = async (key: string, value: string) => {
  return prisma.appSettings.upsert({
    where: { key },
    update: { value },
    create: { key, value }
  });
};

// TODO: Re-implement getPremiumPrice with new plan system
export const getPremiumPrice = async () => 0;

