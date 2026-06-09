import type { Request, Response, NextFunction } from 'express';
import type { AdminDashboardService } from './admin-dashboard.service.js';
import { sendSuccess } from '../../common/responses/ApiResponse.js';

export class AdminDashboardController {
  constructor(private readonly dashboardService: AdminDashboardService) {}

  getStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.dashboardService.getStats();
      sendSuccess(res, {
        stats: {
          totalUsers: result.totalUsers,
          totalProfiles: result.totalProfiles,
          activeProfiles: result.activeProfiles,
          totalBookings: result.totalBookings,
          totalRevenue: result.totalRevenue,
          newUsers: result.newUsers,
          pendingVerifications: result.pendingVerifications,
          bookingsToday: result.bookingsToday,
        },
        todaysEvents: result.todaysEvents,
      });
    } catch (err) {
      next(err);
    }
  };
}
