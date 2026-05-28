import { prisma } from '../../database/prisma.js';

export class AdminDashboardRepository {
  async countTotalUsers(): Promise<number> {
    return prisma.account.count();
  }

  async countNewUsers(days: number): Promise<number> {
    const since = new Date(Date.now() - days * 86400000);
    return prisma.account.count({ where: { createdAt: { gte: since } } });
  }

  async countTotalProfiles(): Promise<number> {
    return prisma.profile.count();
  }

  async countProfilesByStatus(status: string): Promise<number> {
    return prisma.profile.count({ where: { currentStatus: status as any } });
  }
}
