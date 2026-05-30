import { prisma } from '../../database/prisma.js';

export class AnalyticsRepository {

  // ── Matrimony ──

  async profileCountByStatus() {
    const rows = await prisma.profile.groupBy({ by: ['currentStatus'], _count: true });
    return rows.map(r => ({ status: r.currentStatus, count: r._count }));
  }

  async profilesCreatedInRange(days: number) {
    const since = new Date(Date.now() - days * 86400000);
    const rows = await prisma.profile.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true, currentStatus: true },
      orderBy: { createdAt: 'asc' },
    });
    return rows;
  }

  async membershipPlanDistribution() {
    const rows = await prisma.subscription.groupBy({
      by: ['snapshotPlanCode'],
      _count: true,
      where: { status: 'ACTIVE' },
    });
    return rows.map(r => ({ plan: r.snapshotPlanCode, count: r._count }));
  }

  async profileBasicFields() {
    return prisma.profileBasic.findMany({
      select: { gender: true, dob: true },
    });
  }

  async profileDietByGender() {
    const rows = await prisma.profileBasic.groupBy({
      by: ['gender', 'diet'],
      _count: true,
    });
    return rows.map(r => ({ gender: r.gender, diet: r.diet, count: r._count }));
  }

  async profileMaritalStatusByGender() {
    const rows = await prisma.profileBasic.groupBy({
      by: ['gender', 'maritalStatus'],
      _count: true,
    });
    return rows.map(r => ({ gender: r.gender, maritalStatus: r.maritalStatus, count: r._count }));
  }

  async profileComplexionByGender() {
    const rows = await prisma.profileBasic.groupBy({
      by: ['gender', 'complexion'],
      _count: true,
    });
    return rows.map(r => ({ gender: r.gender, complexion: r.complexion, count: r._count }));
  }

  async salaryCountByGender() {
    const [maleCount, femaleCount] = await Promise.all([
      prisma.profile.count({
        where: {
          professional: { monthlySalary: { gt: 0 } },
          basic: { gender: 'MALE' },
        },
      }),
      prisma.profile.count({
        where: {
          professional: { monthlySalary: { gt: 0 } },
          basic: { gender: 'FEMALE' },
        },
      }),
    ]);
    return [
      { gender: 'MALE', count: maleCount },
      { gender: 'FEMALE', count: femaleCount },
    ];
  }

  async communityDistribution() {
    const rows = await prisma.profileCommunity.groupBy({
      by: ['communityId'],
      _count: true,
    });
    return rows.map(r => ({ communityId: r.communityId, count: r._count }));
  }

  async profileStateHistoryInRange(days: number) {
    const since = new Date(Date.now() - days * 86400000);
    return prisma.profileStateHistory.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true, toStatus: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  // ── Mandapam ──

  async bookingCountByStatus() {
    const rows = await prisma.mandapamBooking.groupBy({ by: ['status'], _count: true });
    return rows.map(r => ({ status: r.status, count: r._count }));
  }

  async monthlyBookingCounts() {
    const rows = await prisma.mandapamBooking.findMany({
      select: { createdAt: true, status: true },
      orderBy: { createdAt: 'asc' },
    });
    return rows;
  }

  async financialLedgerByMonth() {
    const rows = await prisma.mandapamFinancialLedger.findMany({
      select: { amount: true, source: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    return rows;
  }

  async paymentMethodDistribution() {
    const rows = await prisma.mandapamPaymentLedger.groupBy({
      by: ['paymentMethod'],
      _count: true,
      _sum: { amount: true },
    });
    return rows.map(r => ({ method: r.paymentMethod, count: r._count, total: r._sum.amount }));
  }

  async calendarEntries() {
    return prisma.mandapamCalendarEntry.findMany({
      select: { date: true, status: true },
    });
  }

  async addonSnapshots() {
    return prisma.mandapamBookingAddonSnapshot.findMany({
      select: { amount: true, addonName: true },
    });
  }

  async settlements() {
    return prisma.mandapamSettlement.findMany({
      select: { state: true, finalAmount: true, createdAt: true },
    });
  }

  // ── Membership ──

  async activeSubscriptions() {
    return prisma.subscription.findMany({
      where: { status: 'ACTIVE' },
      select: { snapshotDisplayPrice: true, snapshotPlanCode: true, createdAt: true, expiresAt: true },
    });
  }

  async allSubscriptions() {
    return prisma.subscription.findMany({
      select: { accountId: true, snapshotDisplayPrice: true, snapshotPlanCode: true, createdAt: true, expiresAt: true, status: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  // ── Operations ──

  async verificationQueueEntries() {
    return prisma.verificationQueue.findMany({
      select: { createdAt: true, completedAt: true, assignedTo: true },
    });
  }

  async profileReviewsInRange(days: number) {
    const since = new Date(Date.now() - days * 86400000);
    return prisma.profileReview.findMany({
      where: { createdAt: { gte: since } },
      select: { action: true, createdAt: true, reasonEn: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  // ── Accounts ──

  async accountCreationInRange(days: number) {
    const since = new Date(Date.now() - days * 86400000);
    const rows = await prisma.account.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    return rows;
  }

  async loginActivityInRange(days: number) {
    const since = new Date(Date.now() - days * 86400000);
    return prisma.accountCredential.findMany({
      where: { lastLoginAt: { gte: since } },
      select: { accountId: true, lastLoginAt: true },
    });
  }

}
