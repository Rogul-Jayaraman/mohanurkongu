import type { AdminDashboardRepository } from './admin-dashboard.repository.js';

export class AdminDashboardService {
  constructor(private readonly repo: AdminDashboardRepository) {}

  async getStats() {
    const [
      totalUsers, newUsers, totalProfiles, activeProfiles,
      pendingVerifications, totalBookings, bookingsToday, totalRevenue, todaysEvents,
    ] = await Promise.all([
      this.repo.countTotalUsers(),
      this.repo.countNewUsers(30),
      this.repo.countTotalProfiles(),
      this.repo.countProfilesByStatus('ACTIVE'),
      this.repo.countProfilesByStatus('PENDING'),
      this.repo.countTotalBookings(),
      this.repo.countTodaysBookings(),
      this.repo.getTotalRevenue(),
      this.repo.getTodaysEvents(),
    ]);

    return {
      totalUsers,
      totalProfiles,
      activeProfiles,
      pendingVerifications,
      newUsers,
      totalBookings,
      bookingsToday,
      totalRevenue,
      todaysEvents,
    };
  }
}
