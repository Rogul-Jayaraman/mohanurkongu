import { HoroscopeMode, ProfileVisibility } from '@prisma/client';
import prisma from '../config/prisma';
import { profileSchema } from '../utils/validators/profile';
import { RegistrationService } from './registration.service';

export const findProfiles = async (filters: any, currentUserId?: string) => {
  const { ignoreStatusFilters, take, skip, orderBy, select, ...whereFilters } = filters;
  
  const queryArgs: any = {
    where: {
      ...(!ignoreStatusFilters && {
        status: 'ACTIVE',
        adminVerified: 'ACCEPTED',
      }),
      ...whereFilters
    },
    take,
    skip,
    orderBy
  };

  if (select) {
    queryArgs.select = {
      ...select,
      user: {
        select: { id: true }
      }
    };
    if (currentUserId) {
      queryArgs.select.shortlistedBy = { where: { userId: currentUserId } };
    }
  } else {
    queryArgs.include = {
      user: {
        select: { id: true }
      }
    };
    if (currentUserId) {
      queryArgs.include.shortlistedBy = { where: { userId: currentUserId } };
    }
  }

  const profiles = await prisma.profile.findMany(queryArgs);

  const mappedProfiles = profiles.map((p: any) => {
    const today = new Date();
    const dob = p.dob ? new Date(p.dob) : null;
    let age = 0;
    if (dob) {
      age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
    }

    return {
      ...p,
      shortlistedBy: undefined, // Cleanup after mapping
      user: undefined, // Cleanup after mapping
      isShortlisted: p.shortlistedBy ? p.shortlistedBy.length > 0 : false,
      age,
      profession: p.jobDetail,
      nakshatra: p.star
    };
  });

  return mappedProfiles;
};

export const findProfileById = async (id: string, currentUserId?: string) => {
  const profile = await prisma.profile.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true, firstNameEn: true, lastNameEn: true, firstNameTa: true, lastNameTa: true, phone: true, email: true }
      },
      horoscope: true,
      shortlistedBy: currentUserId ? { where: { userId: currentUserId } } : false
    }
  });

  if (!profile) return null;

  const isOwner = currentUserId ? profile.userId === currentUserId : false;
  const isShortlisted = currentUserId ? (profile as any).shortlistedBy.length > 0 : false;
  
  // No restrictions as requested by user
  const canViewFullProfile = true;

  const today = new Date();
  const dob = profile.dob ? new Date(profile.dob) : null;
  let age = 0;
  if (dob) {
    age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
  }

  const result: any = {
    ...profile,
    horoscope: profile.horoscope ? {
      ...profile.horoscope,
      rasi: (profile.horoscope.mode === 'CREATE' && profile.horoscope.rasi) 
        ? JSON.parse(profile.horoscope.rasi as string) 
        : profile.horoscope.rasi,
      navamsa: (profile.horoscope.mode === 'CREATE' && profile.horoscope.navamsa) 
        ? JSON.parse(profile.horoscope.navamsa as string) 
        : profile.horoscope.navamsa
    } : null,
    owner: profile.user ? {
      id: profile.user.id,
      firstNameEn: profile.user.firstNameEn,
      lastNameEn: profile.user.lastNameEn,
      firstNameTa: profile.user.firstNameTa,
      lastNameTa: profile.user.lastNameTa,
      phone: profile.user.phone,
      email: profile.user.email,
    } : null,
    isShortlisted,
    canViewFullProfile,
    phone: profile.user?.phone,
    email: profile.user?.email,
    age,
    profession: profile.jobDetail,
    nakshatra: profile.star
  };

  return result;
};



export const createProfile = async (userId: string, data: any) => {
  const { horoscope, ...profileData } = data;
  
  // Generate unique registration number based on district
  // RegistrationService.generateRegNo uses atomic upsert/increment, so it's safe without an outer transaction
  const regNo = await RegistrationService.generateRegNo(profileData.currentDistrict);

  const dataToCreate: any = {
    ...profileData,
    userId,
    regNo,
    status: profileData.status || ProfileVisibility.ACTIVE
  };

  // Ensure dob is a proper Date object if provided
  if (profileData.dob) {
    dataToCreate.dob = new Date(profileData.dob);
  }

  const profile = await prisma.profile.create({
    data: dataToCreate,
    select: {
      id: true,
      regNo: true,
      status: true
    }
  });

  if (horoscope) {
    const { mode, rasi, navamsa, rasiPath, navamsaPath, horoscopeVersion, horoscopeJson, birthDate, birthTime, birthLocationName, birthLatitude, birthLongitude, timezone, ayanamsa, generationHash } = horoscope;
    
    const horoscopeData: any = {
      mode: mode === 'auto' ? 'CREATE' : (mode === 'upload' ? 'UPLOAD' : mode),
      profileId: profile.id
    };

    const rasiVal = rasi || rasiPath;
    const navamsaVal = navamsa || navamsaPath;

    horoscopeData.rasi = typeof rasiVal === 'string' ? rasiVal : JSON.stringify(rasiVal);
    horoscopeData.navamsa = typeof navamsaVal === 'string' ? navamsaVal : JSON.stringify(navamsaVal);

    if (mode === 'CREATE' && horoscopeJson) {
      horoscopeData.horoscopeVersion = horoscopeVersion || 1;
      horoscopeData.horoscopeJson = horoscopeJson;
      horoscopeData.birthDate = birthDate ? new Date(birthDate) : null;
      horoscopeData.birthTime = birthTime;
      horoscopeData.birthLocationName = birthLocationName;
      horoscopeData.birthLatitude = birthLatitude;
      horoscopeData.birthLongitude = birthLongitude;
      horoscopeData.timezone = timezone;
      horoscopeData.ayanamsa = ayanamsa;
      horoscopeData.generationHash = generationHash;
    }

    await prisma.horoscope.create({
      data: horoscopeData
    });
  }

  return profile;
};

export const updateProfile = async (id: string, data: any) => {
  const { horoscope, ...profileData } = data;

  // Process profile data - specifically handling dates
  const dataToUpdate = { ...profileData };
  if (profileData.dob) {
    dataToUpdate.dob = new Date(profileData.dob);
  }

  // Special logic: If status is being set to ACTIVE, ensure it enters the verification queue
  if (profileData.status === 'ACTIVE') {
    dataToUpdate.adminVerified = 'PENDING';
  }

  // Run profile update and horoscope upsert in parallel (not transactional)
  // This avoids the 5000ms transaction timeout that occurs when both are slow
  const profilePromise = prisma.profile.update({
    where: { id },
    data: dataToUpdate,
    select: {
      id: true,
      regNo: true,
      status: true
    }
  });

  let horoscopePromise: Promise<any> = Promise.resolve();
  if (horoscope) {
    const { mode, rasi, navamsa, rasiPath, navamsaPath, horoscopeVersion, horoscopeJson, birthDate, birthTime, birthLocationName, birthLatitude, birthLongitude, timezone, ayanamsa, generationHash } = horoscope;
    
    const horoscopeData: any = {
      mode: mode === 'auto' ? 'CREATE' : (mode === 'upload' ? 'UPLOAD' : mode)
    };

    const rasiVal = rasi || rasiPath;
    const navamsaVal = navamsa || navamsaPath;

    horoscopeData.rasi = typeof rasiVal === 'string' ? rasiVal : JSON.stringify(rasiVal);
    horoscopeData.navamsa = typeof navamsaVal === 'string' ? navamsaVal : JSON.stringify(navamsaVal);

    if (mode === 'CREATE' && horoscopeJson) {
      horoscopeData.horoscopeVersion = horoscopeVersion || 1;
      horoscopeData.horoscopeJson = horoscopeJson;
      horoscopeData.birthDate = birthDate ? new Date(birthDate) : null;
      horoscopeData.birthTime = birthTime;
      horoscopeData.birthLocationName = birthLocationName;
      horoscopeData.birthLatitude = birthLatitude;
      horoscopeData.birthLongitude = birthLongitude;
      horoscopeData.timezone = timezone;
      horoscopeData.ayanamsa = ayanamsa;
      horoscopeData.generationHash = generationHash;
    }

    horoscopePromise = prisma.horoscope.upsert({
      where: { profileId: id },
      update: horoscopeData,
      create: { ...horoscopeData, profileId: id }
    });
  }

  const [profile] = await Promise.all([profilePromise, horoscopePromise]);
  return profile;
};

export const toggleProfileStatus = async (id: string, status: ProfileVisibility) => {
  return prisma.profile.update({
    where: { id },
    data: { status },
    select: { id: true, regNo: true, status: true }
  });
};
