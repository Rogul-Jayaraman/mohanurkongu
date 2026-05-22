import { Response } from 'express';
import prisma from '../config/prisma';
import * as shortlistService from '../services/shortlist';
import { sendSuccess } from '../utils/response';
import { sendError, ErrorCode } from '../utils/errors';

/**
 * GET /api/shortlist
 * Returns the list of profiles shortlisted by the current user.
 */
export const getMyShortlist = async (req: any, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return sendError(res, ErrorCode.ERR_AUTH_008);

    const profiles = await shortlistService.findShortlistedProfilesByUserId(userId);
    return sendSuccess(res, profiles);
  } catch (error: any) {
    console.error('Get Shortlist Error:', error);
    return sendError(res, ErrorCode.ERR_SERVER_001, error.message);
  }
};

/**
 * POST /api/shortlist/:id
 * Toggles a profile's shortlist status for the current user.
 */
export const handleToggleShortlist = async (req: any, res: Response) => {
  try {
    const profileId = req.params.id;
    const userId = req.user?.userId;

    if (!userId) return sendError(res, ErrorCode.ERR_AUTH_008);
    if (!profileId) return sendError(res, ErrorCode.ERR_VALIDATION_001, 'Profile ID is required');

    const result = await shortlistService.toggleShortlist(profileId, userId);
    return sendSuccess(res, result);
  } catch (error: any) {
    console.error('Toggle Shortlist Error:', error);
    return sendError(res, ErrorCode.ERR_SERVER_001, error.message);
  }
};
