import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../config/prisma';
import * as profileService from '../services/profile';
import { CloudinaryService } from '../services/cloudinary.service';
import { profileSchema } from '../utils/validators/profile';
import { sendSuccess } from '../utils/response';
import { sendError, ErrorCode } from '../utils/errors';
import { DraftService } from '../services/draft.service';
import { ProfilePublishService } from '../services/profile-publish.service';

import { MINIMUM_PROFILE_SELECT } from '../constants/selects';

export const getAllProfiles = async (req: any, res: Response) => {
  try {
    const {
      gender,
      currentDistrict, city,
      nativeDistrict, nativeTaluk,
      kulam, kuladeivam, kulamAvoid,
      minHeight, maxHeight, minWeight, maxWeight,
      diet, complexion,
      education, jobTitle, jobLocation, minSalary, maxSalary,
      rasi, nakshatra, laganam, dosham,
      residence, maritalStatus,
      minAge, maxAge, sameDistrict,
      search,
      userId,
      page: pageQuery,
      limit: limitQuery,
    } = req.query;

    const currentUserId = req.user?.userId;
    
    // Pagination params
    const page = parseInt(pageQuery as string) || 1;
    const limit = parseInt(limitQuery as string) || 20;
    const skip = (page - 1) * limit;
    
    // Calculate Date of Birth ranges from Age
    let dobFilter: any = undefined;
    if (minAge || maxAge) {
        dobFilter = {};
        const today = new Date();
        if (minAge) {
            const minDOBdate = new Date(today.getFullYear() - parseInt(minAge as string), today.getMonth(), today.getDate());
            dobFilter.lte = minDOBdate; // lte means older (lower age string means newer date, but lte on date means older!) Wait: Age 20 -> born 2004. Age >= 20 means born <= 2004. So lte. 
        }
        if (maxAge) {
            const maxDOBdate = new Date(today.getFullYear() - parseInt(maxAge as string) - 1, today.getMonth(), today.getDate());
            dobFilter.gt = maxDOBdate; // Age <= 30 means born > 1993
        }
    }

    let userDistrict: any = undefined;
    if (sameDistrict === 'true' && currentUserId) {
       const userProfile = await prisma.profile.findFirst({ where: { userId: currentUserId }, select: { currentDistrict: true } });
       if (userProfile && userProfile.currentDistrict) {
           userDistrict = userProfile.currentDistrict;
       }
    }

    const where: Prisma.ProfileWhereInput = {
      status: 'ACTIVE' as any,
      adminVerified: 'ACCEPTED' as any,
      ...(gender && { gender: gender as any }),
      ...(userId && { userId: userId as string }),
      ...(maritalStatus && { maritalStatus: maritalStatus as any }),
      ...( (currentDistrict || userDistrict) && { currentDistrict: (currentDistrict || userDistrict) as any }),
      ...(city && { currentCityEn: { contains: city as string, mode: 'insensitive' } }),
      ...(nativeDistrict && { nativeDistrict: nativeDistrict as any }),
      ...(nativeTaluk && { nativeTaluk: { contains: nativeTaluk as string, mode: 'insensitive' } }),
      ...(kulam && { kulam: kulam as any }),
      ...(kulamAvoid && { kulam: { not: kulamAvoid as any } }),
      ...(kuladeivam && { kuladeivamEn: { contains: kuladeivam as string, mode: 'insensitive' } }),
      
      ...( (minHeight || maxHeight) && { height: { 
          ...(minHeight ? { gte: parseFloat(minHeight as string) } : {}),
          ...(maxHeight ? { lte: parseFloat(maxHeight as string) } : {})
      }}),
      ...( (minWeight || maxWeight) && { weight: { 
          ...(minWeight ? { gte: parseFloat(minWeight as string) } : {}),
          ...(maxWeight ? { lte: parseFloat(maxWeight as string) } : {})
      }}),

      ...(diet && { diet: diet as any }),
      ...(complexion && { complexion: complexion as any }),
      
      ...(education && { education: { contains: education as string, mode: 'insensitive' } }),
      ...(jobTitle && { jobDetail: { contains: jobTitle as string, mode: 'insensitive' } }),
      ...(jobLocation && { jobLocationEn: { contains: jobLocation as string, mode: 'insensitive' } }),
      ...( (minSalary || maxSalary) && { salaryMonthly: { 
          ...(minSalary ? { gte: parseInt(minSalary as string) } : {}),
          ...(maxSalary ? { lte: parseInt(maxSalary as string) } : {})
      }}),

      ...(residence && { residence: residence as any }),
      ...(dobFilter && { dob: dobFilter }),
      ...(dosham && dosham !== 'NO' && dosham !== 'Any' ? { dosham: dosham as any } : dosham === 'NO' ? { dosham: 'NO' } : {}),
      
      // Astrology (Fields on Profile model)
      ...(rasi && { rasi: rasi as any }),
      ...(nakshatra && { star: nakshatra as any }),
      ...(laganam && { laganam: laganam as any }),
      ...(currentUserId && {
        shortlistedBy: {
          none: {
            userId: currentUserId
          }
        }
      }),
    };

    if (search) {
      where.OR = [
        { firstNameEn: { contains: search as string, mode: 'insensitive' } },
        { lastNameEn: { contains: search as string, mode: 'insensitive' } },
        { firstNameTa: { contains: search as string, mode: 'insensitive' } },
        { lastNameTa: { contains: search as string, mode: 'insensitive' } },
        { regNo: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const sort = req.query.sort as string;
    let orderBy: Prisma.ProfileOrderByWithRelationInput = { createdAt: 'desc' };

    if (sort === 'newest') {
      orderBy = { createdAt: 'desc' };
    } else if (sort === 'age_asc') {
      orderBy = { dob: 'desc' }; // Descending means younger (lower age) - DOB closer to today
    } else if (sort === 'age_desc') {
      orderBy = { dob: 'asc' }; // Ascending means older (higher age) - DOB further in the past
    }

    const [profiles, total] = await Promise.all([
      profileService.findProfiles({ 
        ...where, 
        take: limit, 
        skip,
        orderBy,
        select: MINIMUM_PROFILE_SELECT
      }, currentUserId),
      prisma.profile.count({ where })
    ]);

    return sendSuccess(res, profiles, 200, {
      page,
      limit,
      total
    });
  } catch (error: any) {
    return sendError(res, ErrorCode.ERR_SERVER_001, error.message);
  }
};

export const getBrowseProfiles = async (req: any, res: Response) => {
  try {
    const {
      gender,
      currentDistrict, city,
      nativeDistrict, nativeTaluk,
      kulam, kuladeivam, kulamAvoid,
      minHeight, maxHeight, minWeight, maxWeight,
      diet, complexion,
      education, jobTitle, jobLocation, minSalary, maxSalary,
      rasi, nakshatra, laganam, dosham,
      residence, maritalStatus,
      minAge, maxAge, sameDistrict,
      search,
      page: pageQuery,
      limit: limitQuery,
    } = req.query;

    const currentUserId = req.user?.userId;
    
    // Check for active premium status
    let isPremiumActive = false;
    if (currentUserId) {
        const user = await prisma.user.findUnique({
            where: { id: currentUserId },
            select: { plan: true, planExpiry: true }
        });
        
        if (user && user.plan === 'PREMIUM' && user.planExpiry) {
            isPremiumActive = new Date(user.planExpiry) > new Date();
        }
    }
    
    // Pagination params
    const page = parseInt(pageQuery as string) || 1;
    const limit = parseInt(limitQuery as string) || 20;
    const skip = (page - 1) * limit;

    let dobFilter: any = undefined;
    if (minAge || maxAge) {
        dobFilter = {};
        const today = new Date();
        if (minAge) {
            const minDOBdate = new Date(today.getFullYear() - parseInt(minAge as string), today.getMonth(), today.getDate());
            dobFilter.lte = minDOBdate;
        }
        if (maxAge) {
            const maxDOBdate = new Date(today.getFullYear() - parseInt(maxAge as string) - 1, today.getMonth(), today.getDate());
            dobFilter.gt = maxDOBdate;
        }
    }

    let userDistrict: any = undefined;
    if (sameDistrict === 'true' && currentUserId) {
       const userProfile = await prisma.profile.findFirst({ where: { userId: currentUserId }, select: { currentDistrict: true } });
       if (userProfile && userProfile.currentDistrict) {
           userDistrict = userProfile.currentDistrict;
       }
    }

    const where: Prisma.ProfileWhereInput = {
      status: 'ACTIVE' as any,
      adminVerified: 'ACCEPTED' as any,
      ...(gender && { gender: gender as any }),
      ...(maritalStatus && { maritalStatus: maritalStatus as any }),
      ...( (currentDistrict || userDistrict) && { currentDistrict: (currentDistrict || userDistrict) as any }),
      ...(city && { currentCityEn: { contains: city as string, mode: 'insensitive' } }),
      ...(nativeDistrict && { nativeDistrict: nativeDistrict as any }),
      ...(nativeTaluk && { nativeTaluk: { contains: nativeTaluk as string, mode: 'insensitive' } }),
      ...(kulam && { kulam: kulam as any }),
      ...(kulamAvoid && { kulam: { not: kulamAvoid as any } }),
      ...(kuladeivam && { kuladeivamEn: { contains: kuladeivam as string, mode: 'insensitive' } }),
      ...( (minHeight || maxHeight) && { height: { 
          ...(minHeight ? { gte: parseFloat(minHeight as string) } : {}),
          ...(maxHeight ? { lte: parseFloat(maxHeight as string) } : {})
      }}),
      ...( (minWeight || maxWeight) && { weight: { 
          ...(minWeight ? { gte: parseFloat(minWeight as string) } : {}),
          ...(maxWeight ? { lte: parseFloat(maxWeight as string) } : {})
      }}),
      ...(diet && { diet: diet as any }),
      ...(complexion && { complexion: complexion as any }),
      ...(education && { education: { contains: education as string, mode: 'insensitive' } }),
      ...(jobTitle && { jobDetail: { contains: jobTitle as string, mode: 'insensitive' } }),
      ...(jobLocation && { jobLocationEn: { contains: jobLocation as string, mode: 'insensitive' } }),
      ...( (minSalary || maxSalary) && { salaryMonthly: { 
          ...(minSalary ? { gte: parseInt(minSalary as string) } : {}),
          ...(maxSalary ? { lte: parseInt(maxSalary as string) } : {})
      }}),
      ...(residence && { residence: residence as any }),
      ...(dobFilter && { dob: dobFilter }),
      ...(dosham && dosham !== 'NO' && dosham !== 'Any' ? { dosham: dosham as any } : dosham === 'NO' ? { dosham: 'NO' } : {}),
      ...(rasi && { rasi: rasi as any }),
      ...(nakshatra && { star: nakshatra as any }),
      ...(laganam && { laganam: laganam as any }),
      
      // EXCLUDE profiles that the current user has shortlisted ONLY if they are an active PREMIUM user
      ...(isPremiumActive && currentUserId && {
        shortlistedBy: {
          none: {
            userId: currentUserId
          }
        }
      })
    };

    if (search) {
      where.OR = [
        { firstNameEn: { contains: search as string, mode: 'insensitive' } },
        { lastNameEn: { contains: search as string, mode: 'insensitive' } },
        { firstNameTa: { contains: search as string, mode: 'insensitive' } },
        { lastNameTa: { contains: search as string, mode: 'insensitive' } },
        { regNo: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const sort = req.query.sort as string;
    let orderBy: Prisma.ProfileOrderByWithRelationInput = { createdAt: 'desc' };

    if (sort === 'newest') {
      orderBy = { createdAt: 'desc' };
    } else if (sort === 'age_asc') {
      orderBy = { dob: 'desc' };
    } else if (sort === 'age_desc') {
      orderBy = { dob: 'asc' };
    }

    const [profiles, total] = await Promise.all([
      profileService.findProfiles({ 
        ...where, 
        take: limit, 
        skip,
        orderBy,
        select: MINIMUM_PROFILE_SELECT
      }, currentUserId),
      prisma.profile.count({ where })
    ]);

    const hasNextPage = skip + limit < total;
    const nextPage = hasNextPage ? page + 1 : null;

    return sendSuccess(res, profiles, 200, {
      page,
      limit,
      total,
      nextPage
    });
  } catch (error: any) {
    return sendError(res, ErrorCode.ERR_SERVER_001, error.message);
  }
};

export const getMyProfiles = async (req: any, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return sendError(res, ErrorCode.ERR_AUTH_003, 'Unauthorized');

    // Forced version: 1.0.1
    const select = {
      ...MINIMUM_PROFILE_SELECT,
      status: true,
      adminVerified: true
    };

    const profiles = await profileService.findProfiles({
      userId,
      ignoreStatusFilters: true,
      select,
      orderBy: { createdAt: 'desc' }
    });

    return sendSuccess(res, profiles);
  } catch (error: any) {
    return sendError(res, ErrorCode.ERR_SERVER_001, error.message);
  }
};

export const getSuggestedProfiles = async (req: any, res: Response) => {
  try {
    const userId = req.user?.userId;
    
    const profiles = await prisma.profile.findMany({
      where: {
        status: 'ACTIVE',
        adminVerified: 'ACCEPTED',
        ...(userId && { 
          userId: { not: userId },
          shortlistedBy: { none: { userId } }
        })
      },
      select: {
        ...MINIMUM_PROFILE_SELECT,
        user: { select: { id: true } },
        shortlistedBy: userId ? { where: { userId } } : false
      },
      take: 4,
      orderBy: { updatedAt: 'desc' }
    });

    const transformedProfiles = profiles.map(p => ({
      ...p,
      photo: p.profilePhoto,
      isShortlisted: userId ? (p as any).shortlistedBy.length > 0 : false,
      profession: p.jobDetail,
      shortlistedBy: undefined,
      user: undefined
    }));

    return sendSuccess(res, transformedProfiles);
  } catch (error: any) {
    return sendError(res, ErrorCode.ERR_SERVER_001, error.message);
  }
};

export const getProfileById = async (req: any, res: Response) => {
  try {
    const id = req.params.id as string;
    const currentUserId = req.user?.userId;
    const profile = await profileService.findProfileById(id, currentUserId);

    if (!profile) return sendError(res, ErrorCode.ERR_PROFILE_001);

    return sendSuccess(res, profile);
  } catch (error: any) {
    return sendError(res, ErrorCode.ERR_SERVER_001, error.message);
  }
};



export const updateProfileStatus = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;

    if (!status) {
      return sendError(res, ErrorCode.ERR_VALIDATION_001, 'Status is required');
    }

    const profile = await profileService.toggleProfileStatus(id, status);
    return sendSuccess(res, profile);
  } catch (error: any) {
    return sendError(res, ErrorCode.ERR_SERVER_001, error.message);
  }
};

export const createProfile = async (req: any, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return sendError(res, ErrorCode.ERR_AUTH_003, 'Unauthorized');

    const { draftId } = req.body;
    if (!draftId) return sendError(res, ErrorCode.ERR_VALIDATION_001, 'draftId is required');

    const result = await ProfilePublishService.publish(draftId, userId);
    return sendSuccess(res, result, 201);
  } catch (error: any) {
    console.error('[PROFILE_CONTROLLER] Error publishing profile:', error);

    if (error.name === 'ZodError') {
      const fieldErrors: Record<string, string> = {};
      const issues = error.issues || error.errors || [];
      issues.forEach((e: any) => fieldErrors[e.path.join('.')] = e.message);
      return sendError(res, ErrorCode.ERR_VALIDATION_001, 'Validation failed', fieldErrors);
    }
    if (error.code === 'P2002') {
      return sendError(res, ErrorCode.ERR_PROFILE_004, 'Registration number or unique field already exists');
    }
    if (error.code === 'P2003') {
      return sendError(res, ErrorCode.ERR_PROFILE_004, 'User associated with this profile not found');
    }

    const statusCode = error.statusCode || 500;
    const clientMsg = statusCode < 500 ? error.message : 'An unexpected error occurred during profile creation';
    return sendError(res, ErrorCode.ERR_PROFILE_004, clientMsg);
  }
};

export const saveDraft = async (req: any, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return sendError(res, ErrorCode.ERR_AUTH_003, 'Unauthorized');

    const { draftId, currentStep, draftData, birthData, horoscopeJson, inputHash } = req.body;
    const result = draftId
      ? await DraftService.updateDraft(draftId, userId, { currentStep, draftData, birthData, horoscopeJson, inputHash })
      : await DraftService.createDraft(userId, { currentStep, draftData, birthData, horoscopeJson, inputHash });
    return sendSuccess(res, result, draftId ? 200 : 201);
  } catch (error: any) {
    console.error('[PROFILE_CONTROLLER] Error saving draft:', error);
    const statusCode = error.statusCode || 500;
    return sendError(res, ErrorCode.ERR_SERVER_001, statusCode < 500 ? error.message : 'Failed to save draft');
  }
};

export const getDraft = async (req: any, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return sendError(res, ErrorCode.ERR_AUTH_003, 'Unauthorized');

    const { draftId } = req.params;
    const draft = await DraftService.getDraft(draftId, userId);
    if (!draft) return sendError(res, ErrorCode.ERR_PROFILE_001, 'Draft not found');
    return sendSuccess(res, draft);
  } catch (error: any) {
    console.error('[PROFILE_CONTROLLER] Error getting draft:', error);
    const statusCode = error.statusCode || 500;
    if (statusCode === 409) return sendError(res, ErrorCode.ERR_PROFILE_003, 'Draft already published');
    if (statusCode === 410) return sendError(res, ErrorCode.ERR_PROFILE_001, 'Draft has expired');
    return sendError(res, ErrorCode.ERR_SERVER_001, error.message);
  }
};

export const cancelDraft = async (req: any, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return sendError(res, ErrorCode.ERR_AUTH_003, 'Unauthorized');

    const { draftId } = req.params;
    const result = await DraftService.cancelDraft(draftId, userId);
    return sendSuccess(res, result);
  } catch (error: any) {
    console.error('[PROFILE_CONTROLLER] Error cancelling draft:', error);
    const statusCode = error.statusCode || 500;
    if (statusCode === 409) return sendError(res, ErrorCode.ERR_PROFILE_003, 'Cannot cancel a published profile');
    return sendError(res, ErrorCode.ERR_SERVER_001, error.message);
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const data = req.body;
    const validatedData = profileSchema.partial().parse(data);
    const profile = await profileService.updateProfile(id, validatedData);
    return sendSuccess(res, profile);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      const fieldErrors: Record<string, string> = {};
      const issues = error.issues || error.errors || [];
      issues.forEach((e: any) => {
        fieldErrors[e.path.join('.')] = e.message;
      });
      return sendError(res, ErrorCode.ERR_VALIDATION_001, 'Validation failed', fieldErrors);
    }
    return sendError(res, ErrorCode.ERR_PROFILE_003, error.message);
  }
};

export const deleteProfile = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    
    // Cleanup images from Cloudinary before deleting from DB
    const profile = await prisma.profile.findUnique({
      where: { id },
      include: { horoscope: true }
    });

    if (profile) {
      const cleanupTasks = [];
      if (profile.profilePhoto) cleanupTasks.push(CloudinaryService.deleteImage(CloudinaryService.getPublicId('photo', id)));
      if (profile.horoscope?.rasi) cleanupTasks.push(CloudinaryService.deleteImage(CloudinaryService.getPublicId('rasi', id)));
      if (profile.horoscope?.navamsa) cleanupTasks.push(CloudinaryService.deleteImage(CloudinaryService.getPublicId('navamsa', id)));
      
      // Cleanup gallery
      for (let i = 0; i < profile.gallery.length; i++) {
        cleanupTasks.push(CloudinaryService.deleteImage(CloudinaryService.getPublicId('gallery', id, i + 1)));
      }

      await Promise.all(cleanupTasks).catch(err => console.error('Cloudinary cleanup error during profile deletion:', err));
    }

    await prisma.profile.delete({ where: { id } });
    return sendSuccess(res, { deleted: true });
  } catch (error: any) {
    return sendError(res, ErrorCode.ERR_SERVER_001, error.message);
  }
};

export const uploadProfileImage = async (req: any, res: Response) => {
  try {
    const profileId = req.params.id;
    const type = req.params.type as 'photo' | 'rasi' | 'navamsa' | 'gallery';
    const index = req.query.index ? parseInt(req.query.index as string) : undefined;
    const file = req.file;

    if (!file) {
      return sendError(res, ErrorCode.ERR_VALIDATION_001, 'No image file provided');
    }

    const url = await CloudinaryService.uploadAsSvg(file.buffer, type, profileId, index);

    // Automatically update the profile record for single-slot images
    if (type === 'photo') {
      await prisma.profile.update({ where: { id: profileId }, data: { profilePhoto: url } });
    } else if (type === 'rasi' || type === 'navamsa') {
      await prisma.horoscope.upsert({
        where: { profileId },
        update: { [type]: url, mode: 'UPLOAD' },
        create: { profileId, [type]: url, mode: 'UPLOAD' }
      });
    } else if (type === 'gallery') {
      const profile = await prisma.profile.findUnique({ where: { id: profileId } });
      const gallery = profile?.gallery || [];
      if (index !== undefined && index < gallery.length) {
        gallery[index] = url;
      } else {
        gallery.push(url);
      }
      await prisma.profile.update({ where: { id: profileId }, data: { gallery } });
    }

    return sendSuccess(res, { url });
  } catch (error: any) {
    console.error('Upload error:', error);
    return sendError(res, ErrorCode.ERR_SERVER_001, error.message);
  }
};

export const deleteProfileImage = async (req: any, res: Response) => {
  try {
    const profileId = req.params.id;
    const type = req.params.type as 'photo' | 'rasi' | 'navamsa' | 'gallery';
    const index = req.query.index ? parseInt(req.query.index as string) : undefined;

    // Get public ID for Cloudinary
    // Index mapping: our getPublicId expects i + 1 for gallery
    const publicId = CloudinaryService.getPublicId(type, profileId, index !== undefined ? index + 1 : undefined);

    // Delete from Cloudinary
    await CloudinaryService.deleteImage(publicId).catch(err => {
      console.error('Cloudinary delete error (might already be gone):', err);
    });

    // Update DB
    if (type === 'photo') {
      await prisma.profile.update({ where: { id: profileId }, data: { profilePhoto: null } });
    } else if (type === 'rasi' || type === 'navamsa') {
      await prisma.horoscope.update({
        where: { profileId },
        data: { [type]: null }
      });
    } else if (type === 'gallery') {
      const profile = await prisma.profile.findUnique({ where: { id: profileId } });
      const gallery = profile?.gallery || [];
      if (index !== undefined && index < gallery.length) {
        gallery.splice(index, 1);
      }
      await prisma.profile.update({ where: { id: profileId }, data: { gallery } });
    }

    return sendSuccess(res, { deleted: true });
  } catch (error: any) {
    console.error('Delete image error:', error);
    return sendError(res, ErrorCode.ERR_SERVER_001, error.message);
  }
};

