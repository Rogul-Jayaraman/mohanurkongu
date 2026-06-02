import type { Request, Response, NextFunction } from 'express';
import type { AnalyticsService } from './analytics.service.js';
import { sendSuccess } from '../../common/responses/ApiResponse.js';

export class AnalyticsController {
  constructor(private readonly service: AnalyticsService) {}

  getManamaalai = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getManamaalaiAnalytics();
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  };

  getMandapam = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getMandapamAnalytics();
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  };
}
