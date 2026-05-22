import { Response } from 'express';
import * as adminService from '../services/adminMatrimony.service';
import { sendSuccess } from '../utils/response';
import { sendError, ErrorCode } from '../utils/errors';

/**
 * Controller for Admin Matrimony Operations
 */

// --- ACCOUNTS ---

export const getAccounts = async (req: any, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const { data, meta } = await adminService.getAccounts({ page, limit, search });
    return sendSuccess(res, data, 200, meta);
  } catch (error: any) {
    return sendError(res, ErrorCode.ERR_SERVER_001, error.message);
  }
};

export const suspendAccount = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { reasonEn, reasonTa } = req.body;
    if (!reasonEn) return sendError(res, ErrorCode.ERR_VALIDATION_001, 'Suspension reason is required');

    const user = await adminService.suspendAccount(id, reasonEn, reasonTa || reasonEn);
    return sendSuccess(res, user, 200);
  } catch (error: any) {
    return sendError(res, ErrorCode.ERR_SERVER_001, error.message);
  }
};

export const revokeSuspension = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const user = await adminService.revokeSuspension(id);
    return sendSuccess(res, user, 200);
  } catch (error: any) {
    return sendError(res, ErrorCode.ERR_SERVER_001, error.message);
  }
};

// TODO: Re-implement upgradePlan, cancelPlan, getPlanHistory with new plan system

// --- PROFILES ---

export const getProfiles = async (req: any, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const status = req.query.status as string;
    const verified = req.query.verified as string;

    const { data, meta } = await adminService.getProfiles({ page, limit, search, status, verified });
    return sendSuccess(res, data, 200, meta);
  } catch (error: any) {
    return sendError(res, ErrorCode.ERR_SERVER_001, error.message);
  }
};

export const getVerificationProfiles = async (req: any, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;
    const search = req.query.search as string;

    const { data, meta } = await adminService.getVerificationProfiles({ 
      page, 
      limit, 
      search
    });
    return sendSuccess(res, data, 200, meta);
  } catch (error: any) {
    return sendError(res, ErrorCode.ERR_SERVER_001, error.message);
  }
};

export const verifyProfile = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { status, reasonEn, reasonTa } = req.body;

    if (!status) return sendError(res, ErrorCode.ERR_VALIDATION_001, 'Status is required');

    const profile = await adminService.verifyProfile(id, { status, reasonEn, reasonTa });
    return sendSuccess(res, profile, 200);
  } catch (error: any) {
    return sendError(res, ErrorCode.ERR_SERVER_001, error.message);
  }
};

export const blockProfile = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { reasonEn, reasonTa } = req.body;
    if (!reasonEn) return sendError(res, ErrorCode.ERR_VALIDATION_001, 'Reason for blocking is required');

    const profile = await adminService.blockProfile(id, reasonEn, reasonTa || reasonEn);
    return sendSuccess(res, profile, 200);
  } catch (error: any) {
    return sendError(res, ErrorCode.ERR_SERVER_001, error.message);
  }
};

export const updateProfileStatus = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) return sendError(res, ErrorCode.ERR_VALIDATION_001, 'Status is required');

    const profile = await adminService.updateProfileVisibility(id, status);
    return sendSuccess(res, profile, 200);
  } catch (error: any) {
    return sendError(res, ErrorCode.ERR_SERVER_001, error.message);
  }
};

export const getProfileById = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const profile = await adminService.getProfileById(id);
    if (!profile) return sendError(res, ErrorCode.ERR_PROFILE_001);
    return sendSuccess(res, profile, 200);
  } catch (error: any) {
    return sendError(res, ErrorCode.ERR_SERVER_001, error.message);
  }
};

export const getDashboardStats = async (req: any, res: Response) => {
  try {
    const stats = await adminService.getDashboardStats();
    return sendSuccess(res, stats, 200);
  } catch (error: any) {
    return sendError(res, ErrorCode.ERR_SERVER_001, error.message);
  }
};

// --- SETTINGS ---

// TODO: Re-implement getPremiumPrice, updatePremiumPrice with new plan system
