import { Request, Response } from 'express';
import * as profileService from '../services/profile';
import { sendSuccess } from '../utils/response';
import { ErrorCode, sendError } from '../utils/errors';

const FEATURED_SELECT = {
  id: true,
  regNo: true,
  firstNameEn: true,
  lastNameEn: true,
  firstNameTa: true,
  lastNameTa: true,
  profilePhoto: true,
  gender: true,
};

export const getFeaturedProfiles = async (req: Request, res: Response) => {
  try {
    const take = 8;
    const orderBy = { createdAt: 'desc' as const };

    const [groomProfiles, brideProfiles] = await Promise.all([
      profileService.findProfiles({
        gender: 'MALE',
        status: 'ACTIVE',
        adminVerified: 'ACCEPTED',
        ignoreStatusFilters: false,
        take,
        orderBy,
        select: FEATURED_SELECT,
      }),
      profileService.findProfiles({
        gender: 'FEMALE',
        status: 'ACTIVE',
        adminVerified: 'ACCEPTED',
        ignoreStatusFilters: false,
        take,
        orderBy,
        select: FEATURED_SELECT,
      }),
    ]);

    return sendSuccess(res, {
      grooms: groomProfiles,
      brides: brideProfiles,
    });
  } catch (error: any) {
    console.error('Featured Profiles Error:', error);
    return sendError(res, ErrorCode.ERR_SERVER_001, error.message);
  }
};
