import { prisma } from '../../database/prisma.js';

export class AnalyticsRepository {

  async profileCountByStatus() {
    const rows = await prisma.profile.groupBy({ by: ['currentStatus'], _count: true });
    return rows.map(r => ({ status: r.currentStatus, count: r._count }));
  }

  async dailyProfileGrowth(days: number) {
    const rows: { date: string; count: bigint }[] = await prisma.$queryRawUnsafe(`
      SELECT DATE("createdAt")::text AS date, COUNT(*)::bigint AS count
      FROM "profiles"
      WHERE "createdAt" >= NOW() - $1::interval
      GROUP BY DATE("createdAt")
      ORDER BY date
    `, `${days} days`);
    return rows.map(r => ({ date: r.date, count: Number(r.count) }));
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

  async salaryCountByGender() {
    const [maleCount, femaleCount] = await Promise.all([
      prisma.profile.count({
        where: { professional: { monthlySalary: { gt: 0 } }, basic: { gender: 'MALE' } },
      }),
      prisma.profile.count({
        where: { professional: { monthlySalary: { gt: 0 } }, basic: { gender: 'FEMALE' } },
      }),
    ]);
    return [
      { gender: 'MALE', count: maleCount },
      { gender: 'FEMALE', count: femaleCount },
    ];
  }

  async ageGenderMatrix() {
    const rows: { gender: string; bucket: string; count: bigint }[] = await prisma.$queryRawUnsafe(`
      SELECT
        "gender"::text,
        CASE
          WHEN EXTRACT(YEAR FROM AGE("dob")) <= 24 THEN '18-24'
          WHEN EXTRACT(YEAR FROM AGE("dob")) <= 30 THEN '25-30'
          WHEN EXTRACT(YEAR FROM AGE("dob")) <= 35 THEN '31-35'
          WHEN EXTRACT(YEAR FROM AGE("dob")) <= 40 THEN '36-40'
          ELSE '40+'
        END AS bucket,
        COUNT(*)::bigint AS count
      FROM "profile_basic"
      GROUP BY "gender", bucket
      ORDER BY bucket, "gender"
    `);
    return rows.map(r => ({ gender: r.gender, bucket: r.bucket, count: Number(r.count) }));
  }

  async averageAgeByGender() {
    const rows: { gender: string; avgAge: number }[] = await prisma.$queryRawUnsafe(`
      SELECT "gender"::text, ROUND(AVG(EXTRACT(YEAR FROM AGE("dob"))))::int AS "avgAge"
      FROM "profile_basic"
      GROUP BY "gender"
    `);
    return rows;
  }

  async profileStateHistoryInRange(days: number) {
    const since = new Date(Date.now() - days * 86400000);
    return prisma.profileStateHistory.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true, toStatus: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async accountCreationInRange(days: number) {
    const rows: { date: string; count: bigint }[] = await prisma.$queryRawUnsafe(`
      SELECT DATE("createdAt")::text AS date, COUNT(*)::bigint AS count
      FROM "accounts"
      WHERE "createdAt" >= NOW() - $1::interval
      GROUP BY DATE("createdAt")
      ORDER BY date
    `, `${days} days`);
    return rows.map(r => ({ date: r.date, count: Number(r.count) }));
  }

  async membershipPlanDistribution() {
    const rows = await prisma.subscription.groupBy({
      by: ['snapshotPlanCode'],
      _count: true,
      where: { status: 'ACTIVE' },
    });
    return rows
      .filter(r => r.snapshotPlanCode !== 'BRONZE')
      .map(r => ({ plan: r.snapshotPlanCode, count: r._count }));
  }

  async conversionFunnel() {
    const [totalAccounts, totalProfiles, verifiedProfiles, purchasedSubs, activeSubs] =
      await Promise.all([
        prisma.account.count(),
        prisma.profile.count(),
        prisma.$queryRawUnsafe<{ count: bigint }[]>(`
          SELECT COUNT(DISTINCT "profileId")::bigint AS count FROM "profile_state_history"
        `),
        prisma.subscription.count({ where: { snapshotPlanCode: { not: 'BRONZE' } } }),
        prisma.subscription.count({ where: { status: 'ACTIVE', snapshotPlanCode: { not: 'BRONZE' } } }),
      ]);

    return [
      { stage: 'Registered Account', count: totalAccounts },
      { stage: 'Profile Created', count: totalProfiles },
      { stage: 'Verified', count: Number((verifiedProfiles as any)[0]?.count ?? 0) },
      { stage: 'Membership Purchased', count: purchasedSubs },
      { stage: 'Active Membership', count: activeSubs },
    ];
  }

  async membershipCounts() {
    const [active, expiredOrCancelled, total] = await Promise.all([
      prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      prisma.subscription.count({ where: { status: { in: ['EXPIRED', 'CANCELLED'] } } }),
      prisma.subscription.count(),
    ]);
    return { active, expiredOrCancelled, total };
  }

  async activeSubscriptionPrices() {
    const rows = await prisma.subscription.findMany({
      where: { status: 'ACTIVE', snapshotPlanCode: { not: 'BRONZE' } },
      select: { snapshotDisplayPrice: true },
    });
    return rows.map(r => Number(r.snapshotDisplayPrice));
  }

  async renewalForecast() {
    const rows: { planCode: string; bucket: string; count: bigint }[] = await prisma.$queryRawUnsafe(`
      SELECT
        "snapshotPlanCode"::text AS "planCode",
        CASE
          WHEN "expiresAt" <= NOW() + INTERVAL '30 days' THEN '0-30 Days'
          WHEN "expiresAt" <= NOW() + INTERVAL '60 days' THEN '31-60 Days'
          WHEN "expiresAt" <= NOW() + INTERVAL '90 days' THEN '61-90 Days'
        END AS bucket,
        COUNT(*)::bigint AS count
      FROM "subscriptions"
      WHERE "expiresAt" > NOW()
        AND "expiresAt" <= NOW() + INTERVAL '90 days'
        AND "snapshotPlanCode" IN ('SILVER', 'GOLD', 'PLATINUM')
      GROUP BY "snapshotPlanCode", bucket
      ORDER BY bucket, "snapshotPlanCode"
    `);
    return rows.map(r => ({ planCode: r.planCode, bucket: r.bucket, count: Number(r.count) }));
  }

  async totalProfileCount() {
    return prisma.profile.count();
  }

  // Mandapam — kept as-is
  async bookingCountByStatus() {
    const rows = await prisma.mandapamBooking.groupBy({ by: ['status'], _count: true });
    return rows.map(r => ({ status: r.status, count: r._count }));
  }

  async monthlyBookingCounts() {
    return prisma.mandapamBooking.findMany({
      select: { createdAt: true, status: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async financialLedgerByMonth() {
    return prisma.mandapamFinancialLedger.findMany({
      select: { amount: true, source: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
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
}
