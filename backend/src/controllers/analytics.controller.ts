import { Response } from 'express';
import * as analyticsService from '../services/analytics.service';
import { sendSuccess } from '../utils/response';
import { sendError, ErrorCode } from '../utils/errors';

export const getDashboardAnalytics = async (req: any, res: Response) => {
  try {
    const data = await analyticsService.getFullAnalytics();
    return sendSuccess(res, data, 200);
  } catch (error: any) {
    console.error('Analytics Error:', error);
    return sendError(res, ErrorCode.ERR_SERVER_001, error.message);
  }
};

export const getBasicStats = async (req: any, res: Response) => {
  try {
    const [revenue, mandapam, matrimony] = await Promise.all([
      analyticsService.getRevenueAnalytics(),
      analyticsService.getMandapamAnalytics(),
      analyticsService.getMatrimonyAnalytics()
    ]);
    return sendSuccess(res, { revenue: revenue.highlights, mandapam, matrimony }, 200);
  } catch (error: any) {
    return sendError(res, ErrorCode.ERR_SERVER_001, error.message);
  }
};
