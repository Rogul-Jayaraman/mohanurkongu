import type { Request, Response, NextFunction } from 'express';
import type { AdminDashboardService } from './admin-dashboard.service.js';
import { sendSuccess } from '../../common/responses/ApiResponse.js';

export class AdminDashboardController {
  constructor(private readonly dashboardService: AdminDashboardService) {}

  getStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await this.dashboardService.getStats();
      sendSuccess(res, {
        stats: {
          totalUsers: stats.totalUsers,
          totalProfiles: stats.totalProfiles,
          activeProfiles: stats.activeProfiles,
          totalBookings: 0,
          totalRevenue: 0,
          newUsers: stats.newUsers,
          pendingVerifications: stats.pendingVerifications,
          bookingsToday: 0,
        },
        recentBookings: [],
      });
    } catch (err) {
      next(err);
    }
  };
}
