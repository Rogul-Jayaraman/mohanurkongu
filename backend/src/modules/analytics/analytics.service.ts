import type { AnalyticsRepository } from './analytics.repository.js';
import type { AnalyticsCache } from './analytics.cache.js';
import type { ManamaalaiAnalyticsDTO } from './analytics.dto.js';
import { logger } from '../../common/utils/logger.js';

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 86400000);
}

function floorDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const QUERY_TIMEOUT = 12_000;

function runWithTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ]);
}

export class AnalyticsService {
  constructor(
    private readonly repo: AnalyticsRepository,
    private readonly cache: AnalyticsCache,
  ) {}

  async getManamaalaiAnalytics(): Promise<ManamaalaiAnalyticsDTO> {
    const cached = await this.cache.get<ManamaalaiAnalyticsDTO>('manamaalai');
    if (cached) return cached;

    const data = await runWithTimeout(
      Promise.all([
        this.repo.profileCountByStatus(),
        this.repo.dailyProfileGrowth(90),
        this.repo.profileDietByGender(),
        this.repo.profileMaritalStatusByGender(),
        this.repo.salaryCountByGender(),
        this.repo.averageAgeByGender(),
        this.repo.ageGenderMatrix(),
        this.repo.profileStateHistoryInRange(30),
        this.repo.accountCreationInRange(30),
        this.repo.membershipPlanDistribution(),
        this.repo.conversionFunnel(),
        this.repo.activeSubscriptionPrices(),
        this.repo.membershipCounts(),
        this.repo.renewalForecast(),
        this.repo.getVerificationStats(),
      ]),
      QUERY_TIMEOUT,
      'getManamaalaiAnalytics',
    ).catch(err => {
      logger.error({ err }, 'getManamaalaiAnalytics failed');
      throw err;
    });

    const [
      statusDist,
      growth,
      dietByGender,
      maritalStatusByGender,
      salaryByGender,
      avgAgeByGender,
      ageGenderRaw,
      stateHistory,
      registrations,
      planDist,
      funnelStages,
      mrrPrices,
      membershipCounts,
      renewals,
      verificationStats,
    ] = data;

    // ── Overview ──
    const activeProfiles = statusDist.find(s => s.status === 'ACTIVE')?.count ?? 0;
    const pendingVerifications = statusDist.find(s => s.status === 'PENDING')?.count ?? 0;
    const last7dReg = registrations
      .filter(r => new Date(r.date) >= daysAgo(7))
      .reduce((s, r) => s + r.count, 0);
    const activeMemberships = planDist.reduce((s, p) => s + p.count, 0);

    // ── Profile growth ──
    const profileGrowth = growth;

    // ── Demographics radar (4 traits: Vegetarian%, NeverMarried%, HasSalary%, AvgAge) ──
    const totalM = (dietByGender.filter(d => d.gender === 'MALE').reduce((s, d) => s + d.count, 0)) || 1;
    const totalF = (dietByGender.filter(d => d.gender === 'FEMALE').reduce((s, d) => s + d.count, 0)) || 1;

    const vegM = dietByGender.find(r => r.gender === 'MALE' && r.diet === 'VEGETARIAN')?.count ?? 0;
    const vegF = dietByGender.find(r => r.gender === 'FEMALE' && r.diet === 'VEGETARIAN')?.count ?? 0;

    const neverMarriedM = maritalStatusByGender.find(r => r.gender === 'MALE' && r.maritalStatus === 'NEVER_MARRIED')?.count ?? 0;
    const neverMarriedF = maritalStatusByGender.find(r => r.gender === 'FEMALE' && r.maritalStatus === 'NEVER_MARRIED')?.count ?? 0;

    const withSalaryM = salaryByGender.find(r => r.gender === 'MALE')?.count ?? 0;
    const withSalaryF = salaryByGender.find(r => r.gender === 'FEMALE')?.count ?? 0;

    const avgAgeM = avgAgeByGender.find(r => r.gender === 'MALE')?.avgAge ?? 0;
    const avgAgeF = avgAgeByGender.find(r => r.gender === 'FEMALE')?.avgAge ?? 0;

    const demographicsRadar = {
      labels: ['Vegetarian %', 'Never Married %', 'Has Salary %', 'Avg Age'],
      male: [
        Math.round((vegM / totalM) * 100),
        Math.round((neverMarriedM / totalM) * 100),
        Math.round((withSalaryM / totalM) * 100),
        Math.round(avgAgeM),
      ],
      female: [
        Math.round((vegF / totalF) * 100),
        Math.round((neverMarriedF / totalF) * 100),
        Math.round((withSalaryF / totalF) * 100),
        Math.round(avgAgeF),
      ],
    };

    // ── Age-gender matrix ──
    const buckets = ['18-24', '25-30', '31-35', '36-40', '40+'];
    const ageGenderMap = new Map<string, { male: number; female: number }>();
    for (const b of buckets) ageGenderMap.set(b, { male: 0, female: 0 });
    for (const r of ageGenderRaw) {
      const entry = ageGenderMap.get(r.bucket);
      if (entry) {
        if (r.gender === 'MALE') entry.male += r.count;
        else if (r.gender === 'FEMALE') entry.female += r.count;
      }
    }
    const ageGenderMatrix = buckets.map(b => ({ bucket: b, ...ageGenderMap.get(b)! }));

    // ── Profile status stack (30d) ──
    const statusStackMap = new Map<string, { draft: number; pending: number; active: number; rejected: number; archived: number }>();
    for (const h of stateHistory) {
      const key = floorDate(h.createdAt);
      if (!statusStackMap.has(key)) {
        statusStackMap.set(key, { draft: 0, pending: 0, active: 0, rejected: 0, archived: 0 });
      }
      const entry = statusStackMap.get(key)!;
      const s = h.toStatus.toLowerCase();
      if (s in entry) (entry as Record<string, number>)[s]++;
    }
    const profileStatusStack: { date: string; draft: number; pending: number; active: number; rejected: number; archived: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const key = floorDate(daysAgo(i));
      profileStatusStack.push({ date: key, ...(statusStackMap.get(key) ?? { draft: 0, pending: 0, active: 0, rejected: 0, archived: 0 }) });
    }

    // ── Membership revenue ──
    const totalMRR = mrrPrices.reduce((s, p) => s + p, 0);
    const monthlyMRR = Math.round(totalMRR / 3);
    const paidUsersCount = mrrPrices.length;
    const arpu = paidUsersCount > 0 ? Math.round(totalMRR / paidUsersCount) : 0;
    const churnRate = membershipCounts.total > 0
      ? Math.round((membershipCounts.expiredOrCancelled / membershipCounts.total) * 100)
      : 0;

    const membershipRevenue = {
      mrr: Math.round(monthlyMRR / 10) * 10,
      arr: Math.round(monthlyMRR * 12 / 10) * 10,
      arpu,
      churnRate,
    };

    // ── Membership funnel ──
    const membershipFunnel = funnelStages;

    // ── Membership plan distribution ──
    const totalPlans = planDist.reduce((s, p) => s + p.count, 0);
    const membershipPlanDistribution = planDist.map(p => ({
      plan: p.plan,
      count: p.count,
      percentage: totalPlans > 0 ? Math.round((p.count / totalPlans) * 100) : 0,
    }));

    // ── Renewal forecast ──
    const forecastBuckets = ['0-30 Days', '31-60 Days', '61-90 Days'];
    const renewalMap = new Map<string, { silver: number; gold: number; platinum: number }>();
    for (const b of forecastBuckets) renewalMap.set(b, { silver: 0, gold: 0, platinum: 0 });
    for (const r of renewals) {
      const entry = renewalMap.get(r.bucket);
      if (entry) {
        const planKey = r.planCode.toLowerCase() as 'silver' | 'gold' | 'platinum';
        entry[planKey] += r.count;
      }
    }
    const renewalForecast = forecastBuckets.map(b => ({ bucket: b, ...renewalMap.get(b)! }));

    const response: ManamaalaiAnalyticsDTO = {
      overview: {
        activeProfiles,
        pendingVerifications,
        newRegistrations7d: last7dReg,
        activeMemberships,
      },
      profileGrowth,
      demographicsRadar,
      ageGenderMatrix,
      profileStatusStack,
      membershipRevenue,
      membershipFunnel,
      membershipPlanDistribution,
      renewalForecast,
      verificationStats,
    };

    await this.cache.set('manamaalai', response, 300);

    return response;
  }

  // ═══════════════════════════════════════════════
  // Mandapam — kept as-is (hold for future refactor)
  // ═══════════════════════════════════════════════

  async getMandapamAnalytics() {
    const [bookings, ledgers, payments, calendar, addons, settlements, allBookings] = await runWithTimeout(
      Promise.all([
        this.repo.bookingCountByStatus(),
        this.repo.financialLedgerByMonth(),
        this.repo.paymentMethodDistribution(),
        this.repo.calendarEntries(),
        this.repo.addonSnapshots(),
        this.repo.settlements(),
        this.repo.monthlyBookingCounts(),
      ]),
      QUERY_TIMEOUT,
      'getMandapamAnalytics',
    );

    const activeBookings = bookings.find(b => b.status === 'CONFIRMED' || b.status === 'SETTLEMENT_PENDING')?.count ?? 0;
    const totalRevenue = ledgers.reduce((s, l) => s + Number(l.amount), 0);
    const totalCalDays = calendar.length;
    const bookedDays = calendar.filter(c => c.status === 'FULLY_BOOKED').length;
    const occupancyRate = totalCalDays > 0 ? Math.round((bookedDays / totalCalDays) * 100) : 0;
    const last7dRevenue = ledgers.filter(l => l.createdAt >= daysAgo(7)).reduce((s, l) => s + Number(l.amount), 0);
    const prev7dRevenue = ledgers.filter(l => l.createdAt >= daysAgo(14) && l.createdAt < daysAgo(7)).reduce((s, l) => s + Number(l.amount), 0);
    const revenueWoW = prev7dRevenue > 0 ? Math.round(((last7dRevenue - prev7dRevenue) / prev7dRevenue) * 100) : 0;

    const pendingSettlements = settlements.filter(s => s.state === 'PENDING').length;
    const totalOutstandingPayments = ledgers.filter(l => l.source !== 'DISCOUNT' && l.source !== 'ADJUSTMENT').reduce((s, l) => s + Number(l.amount), 0);
    const totalPaid = payments.reduce((s, p) => s + Number(p.total ?? 0), 0);
    const outstandingBalance = Math.max(0, totalOutstandingPayments - totalPaid);

    const revenueMap = new Map<string, { month: string; standard: number; royal: number; grand: number; addon: number }>();
    for (const l of ledgers) {
      const month = l.createdAt.toISOString().slice(0, 7);
      if (!revenueMap.has(month)) {
        revenueMap.set(month, { month, standard: 0, royal: 0, grand: 0, addon: 0 });
      }
      const entry = revenueMap.get(month)!;
      if (l.source === 'PACKAGE') entry.standard += Number(l.amount);
      else if (l.source === 'ADDON') entry.addon += Number(l.amount);
      else if (l.source === 'SERVICE') entry.royal += Number(l.amount);
      else entry.grand += Number(l.amount);
    }
    const revenueBreakdown = [...revenueMap.values()].sort((a, b) => a.month.localeCompare(b.month));

    const bookingMonthlyMap = new Map<string, number>();
    for (const b of allBookings) {
      const month = b.createdAt.toISOString().slice(0, 7);
      bookingMonthlyMap.set(month, (bookingMonthlyMap.get(month) ?? 0) + 1);
    }
    const bookingTrend: { month: string; bookings: number; revenue: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const revRow = revenueBreakdown.find(r => r.month === month);
      const revenue = revRow
        ? Object.entries(revRow).filter(([k]) => k !== 'month').reduce((s, [, v]) => s + Number(v), 0)
        : 0;
      bookingTrend.push({ month, bookings: bookingMonthlyMap.get(month) ?? 0, revenue });
    }

    const confirmed = bookings.find(b => b.status === 'CONFIRMED')?.count ?? 0;
    const eventInProgress = bookings.find(b => b.status === 'EVENT_IN_PROGRESS')?.count ?? 0;
    const settlementPending = bookings.find(b => b.status === 'SETTLEMENT_PENDING')?.count ?? 0;
    const completed = bookings.find(b => b.status === 'COMPLETED')?.count ?? 0;
    const cancelled = bookings.find(b => b.status === 'CANCELLED')?.count ?? 0;

    const addonMap = new Map<string, { count: number; revenue: number }>();
    for (const a of addons) {
      const key = String(a.addonName);
      const existing = addonMap.get(key) ?? { count: 0, revenue: 0 };
      existing.count++;
      existing.revenue += Number(a.amount);
      addonMap.set(key, existing);
    }
    const addonPerformance = [...addonMap.entries()].map(([name, data]) => ({ name, ...data })).sort((a, b) => b.revenue - a.revenue);

    const next30Booked = calendar.filter(c => {
      const d = new Date(c.date);
      const now = new Date();
      return d >= now && d <= new Date(now.getTime() + 30 * 86400000);
    });
    const next30BookedCount = next30Booked.filter(c => c.status === 'FULLY_BOOKED').length;
    const forecastOccupancy = next30Booked.length > 0 ? Math.round((next30BookedCount / Math.max(next30Booked.length, 1)) * 100) : 0;

    const calendarHeatmap = calendar.map(c => ({ date: floorDate(new Date(c.date)), status: c.status }));

    return {
      overview: {
        occupancyRate,
        activeBookings,
        revenueMTD: last7dRevenue,
        outstandingBalance,
        revenueWoW,
        occupancyWoW: 0,
        bookingWoW: 0,
        outstandingWoW: 0,
      },
      calendarHeatmap,
      revenueBreakdown,
      bookingTrend,
      bookingLifecycle: { confirmed, eventInProgress, settlementPending, completed, cancelled },
      addonPerformance,
      paymentDistribution: payments.map(p => ({ method: p.method, count: p.count, total: Number(p.total ?? 0) })),
      occupancyGauge: { current: occupancyRate, forecast: forecastOccupancy, next30Days: next30Booked.map(c => ({ date: floorDate(new Date(c.date)), status: c.status })) },
    };
  }
}
