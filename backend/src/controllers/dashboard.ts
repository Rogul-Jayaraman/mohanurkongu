import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import prisma from '../config/prisma';
import * as profileService from '../services/profile';
import { sendSuccess } from '../utils/response';
import { ErrorCode, sendError } from '../utils/errors';

import { MINIMUM_PROFILE_SELECT } from '../constants/selects';

/**
 * Retrieves an overview for the user's dashboard.
 * Includes user's profiles, system-wide active matches count, 
 * and mocked/summarized stats for views and interests.
 */
export const getOverview = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return sendError(res, ErrorCode.ERR_AUTH_003);
        }

        // Parallelize all dashboard queries (Grooms, Brides, and User details)
        const [groomProfiles, brideProfiles, user] = await Promise.all([
            // 1. Recent Grooms
            profileService.findProfiles({ gender: 'MALE', status: 'ACTIVE', adminVerified: 'ACCEPTED', shortlistedBy: { none: { userId } }, take: 4, orderBy: { createdAt: 'desc' }, select: MINIMUM_PROFILE_SELECT }, userId),
            // 2. Recent Brides
            profileService.findProfiles({ gender: 'FEMALE', status: 'ACTIVE', adminVerified: 'ACCEPTED', shortlistedBy: { none: { userId } }, take: 4, orderBy: { createdAt: 'desc' }, select: MINIMUM_PROFILE_SELECT }, userId),
            // 3. User Details
            prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    customId: true,
                    firstNameEn: true,
                    lastNameEn: true,
                    firstNameTa: true,
                    lastNameTa: true,
                    email: true,
                    phone: true,
                    role: true,
                    createdAt: true
                }
            })
        ]);
        
        return sendSuccess(res, {
            user,
            groomProfiles,
            brideProfiles
        });
    } catch (error: any) {
        console.error('Dashboard Overview Error:', error);
        return sendError(res, ErrorCode.ERR_SERVER_001, error.message);
    }
};
