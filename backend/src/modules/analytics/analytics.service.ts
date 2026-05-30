import type { AnalyticsRepository } from './analytics.repository.js';

function floorDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 86400000);
}

function computeAge(dob: Date): number {
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return age;
}

function movingAvg(values: number[], window: number): number[] {
  return values.map((_, i) => {
    const slice = values.slice(Math.max(0, i - window + 1), i + 1);
    return Math.round((slice.reduce((a, b) => a + b, 0) / slice.length) * 100) / 100;
  });
}

export class AnalyticsService {
  constructor(private readonly repo: AnalyticsRepository) {}

  async getMatrimonyAnalytics() {
    const [
      statusDist,
      profiles,
      planDist,
      basics,
      communities,
      stateHistory,
      registrations,
      lastLogin,
      dietByGender,
      maritalStatusByGender,
      complexionByGender,
      salaryByGender,
    ] = await Promise.all([
      this.repo.profileCountByStatus(),
      this.repo.profilesCreatedInRange(90),
      this.repo.membershipPlanDistribution(),
      this.repo.profileBasicFields(),
      this.repo.communityDistribution(),
      this.repo.profileStateHistoryInRange(30),
      this.repo.accountCreationInRange(30),
      this.repo.loginActivityInRange(90),
      this.repo.profileDietByGender(),
      this.repo.profileMaritalStatusByGender(),
      this.repo.profileComplexionByGender(),
      this.repo.salaryCountByGender(),
    ]);

    // Metrics
    const activeProfiles = statusDist.find(s => s.status === 'ACTIVE')?.count ?? 0;
    const pendingVerifications = statusDist.find(s => s.status === 'PENDING')?.count ?? 0;
    const last7dReg = registrations.filter(r => r.createdAt >= daysAgo(7)).length;
    const totalMemberships = planDist.reduce((s, p) => s + p.count, 0);

    const weekAgo = daysAgo(7);
    const prevWeek = daysAgo(14);
    const last7dRegPrev = registrations.filter(r => r.createdAt >= prevWeek && r.createdAt < weekAgo).length;

    // Profile growth (daily for 90d)
    const dailyMap = new Map<string, number>();
    for (const p of profiles) {
      const key = floorDate(p.createdAt);
      dailyMap.set(key, (dailyMap.get(key) ?? 0) + 1);
    }
    const profileGrowth: { date: string; count: number; movingAvg: number }[] = [];
    const counts: number[] = [];
    const start = daysAgo(90);
    for (let i = 0; i < 90; i++) {
      const d = new Date(start.getTime() + i * 86400000);
      const key = floorDate(d);
      const c = dailyMap.get(key) ?? 0;
      counts.push(c);
      profileGrowth.push({ date: key, count: c, movingAvg: 0 });
    }
    const mas = movingAvg(counts, 7);
    profileGrowth.forEach((p, i) => { p.movingAvg = mas[i]; });

    // Age-gender matrix
    const buckets = ['18-24', '25-30', '31-35', '36-40', '40+'];
    const ageGenderMap = new Map<string, { male: number; female: number }>();
    for (const b of buckets) ageGenderMap.set(b, { male: 0, female: 0 });
    for (const b of basics) {
      const age = computeAge(b.dob);
      const bucket = age <= 24 ? '18-24' : age <= 30 ? '25-30' : age <= 35 ? '31-35' : age <= 40 ? '36-40' : '40+';
      const entry = ageGenderMap.get(bucket)!;
      if (b.gender === 'MALE') entry.male++;
      else if (b.gender === 'FEMALE') entry.female++;
    }
    const ageGenderMatrix = buckets.map(b => ({ bucket: b, ...ageGenderMap.get(b)! }));

    // Demographics radar (male vs female percentages) — uses aggregated queries
    const totalM = basics.filter(b => b.gender === 'MALE').length || 1;
    const totalF = basics.filter(b => b.gender === 'FEMALE').length || 1;
    const vegM = dietByGender.find(r => r.gender === 'MALE' && r.diet === 'VEGETARIAN')?.count ?? 0;
    const vegF = dietByGender.find(r => r.gender === 'FEMALE' && r.diet === 'VEGETARIAN')?.count ?? 0;
    const neverMarriedM = maritalStatusByGender.find(r => r.gender === 'MALE' && r.maritalStatus === 'NEVER_MARRIED')?.count ?? 0;
    const neverMarriedF = maritalStatusByGender.find(r => r.gender === 'FEMALE' && r.maritalStatus === 'NEVER_MARRIED')?.count ?? 0;
    const fairComplexionM = complexionByGender.find(r => r.gender === 'MALE' && r.complexion === 'FAIR')?.count ?? 0;
    const fairComplexionF = complexionByGender.find(r => r.gender === 'FEMALE' && r.complexion === 'FAIR')?.count ?? 0;
    const withSalaryM = salaryByGender.find(r => r.gender === 'MALE')?.count ?? 0;
    const withSalaryF = salaryByGender.find(r => r.gender === 'FEMALE')?.count ?? 0;

    const demographicsRadar = {
      labels: ['Vegetarian %', 'Never Married %', 'Fair Complexion %', 'Has Salary %', 'Avg Age (yrs)'],
      male: [
        Math.round((vegM / totalM) * 100),
        Math.round((neverMarriedM / totalM) * 100),
        Math.round((fairComplexionM / totalM) * 100),
        Math.round((withSalaryM / totalM) * 100),
        Math.round(basics.filter(b => b.gender === 'MALE').reduce((s, b) => s + computeAge(b.dob), 0) / totalM),
      ],
      female: [
        Math.round((vegF / totalF) * 100),
        Math.round((neverMarriedF / totalF) * 100),
        Math.round((fairComplexionF / totalF) * 100),
        Math.round((withSalaryF / totalF) * 100),
        Math.round(basics.filter(b => b.gender === 'FEMALE').reduce((s, b) => s + computeAge(b.dob), 0) / totalF),
      ],
    };

    // Activity calendar (last 12 weeks)
    const activityMap = new Map<string, number>();
    for (const l of lastLogin) {
      if (l.lastLoginAt) {
        const key = floorDate(l.lastLoginAt);
        activityMap.set(key, (activityMap.get(key) ?? 0) + 1);
      }
    }
    const activityCalendar: { date: string; count: number }[] = [];
    for (let i = 83; i >= 0; i--) {
      const d = floorDate(daysAgo(i));
      activityCalendar.push({ date: d, count: activityMap.get(d) ?? 0 });
    }

    // Community treemap (top communities by count)
    const communityTreemap = communities
      .map(c => ({ name: `Community ${c.communityId}`, value: c.count }))
      .sort((a, b) => b.value - a.value);

    // Profile status stack (daily for 30d)
    const statusStackMap = new Map<string, { draft: number; pending: number; active: number; rejected: number; archived: number }>();
    for (const h of stateHistory) {
      const key = floorDate(h.createdAt);
      if (!statusStackMap.has(key)) {
        statusStackMap.set(key, { draft: 0, pending: 0, active: 0, rejected: 0, archived: 0 });
      }
      const entry = statusStackMap.get(key)!;
      const s = h.toStatus.toLowerCase();
      if (s in entry) (entry as any)[s]++;
    }
    const profileStatusStack: any[] = [];
    for (let i = 29; i >= 0; i--) {
      const key = floorDate(daysAgo(i));
      profileStatusStack.push({ date: key, ...(statusStackMap.get(key) ?? { draft: 0, pending: 0, active: 0, rejected: 0, archived: 0 }) });
    }

    // WoW changes
    const regWoW = last7dRegPrev > 0 ? Math.round(((last7dReg - last7dRegPrev) / last7dRegPrev) * 100) : 0;

    return {
      overview: {
        activeProfiles,
        pendingVerifications,
        newRegistrations7d: last7dReg,
        activeMemberships: totalMemberships,
        activeProfilesWoW: 0,
        pendingVerificationsWoW: 0,
        newRegistrationsWoW: regWoW,
        activeMembershipsWoW: 0,
      },
      profileGrowth,
      membershipDistribution: planDist.map(p => ({ plan: p.plan, count: p.count, percentage: totalMemberships > 0 ? Math.round((p.count / totalMemberships) * 100) : 0 })),
      demographicsRadar,
      ageGenderMatrix,
      activityCalendar,
      communityTreemap,
      profileStatusStack,
    };
  }

  async getMandapamAnalytics() {
    const [bookings, ledgers, payments, calendar, addons, settlements, allBookings] = await Promise.all([
      this.repo.bookingCountByStatus(),
      this.repo.financialLedgerByMonth(),
      this.repo.paymentMethodDistribution(),
      this.repo.calendarEntries(),
      this.repo.addonSnapshots(),
      this.repo.settlements(),
      this.repo.monthlyBookingCounts(),
    ]);

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

    // Revenue breakdown by source + month
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

    // Monthly booking trend
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

    // Booking lifecycle
    const confirmed = bookings.find(b => b.status === 'CONFIRMED')?.count ?? 0;
    const eventInProgress = bookings.find(b => b.status === 'EVENT_IN_PROGRESS')?.count ?? 0;
    const settlementPending = bookings.find(b => b.status === 'SETTLEMENT_PENDING')?.count ?? 0;
    const completed = bookings.find(b => b.status === 'COMPLETED')?.count ?? 0;
    const cancelled = bookings.find(b => b.status === 'CANCELLED')?.count ?? 0;

    // Addon performance
    const addonMap = new Map<string, { count: number; revenue: number }>();
    for (const a of addons) {
      const key = String(a.addonName);
      const existing = addonMap.get(key) ?? { count: 0, revenue: 0 };
      existing.count++;
      existing.revenue += Number(a.amount);
      addonMap.set(key, existing);
    }
    const addonPerformance = [...addonMap.entries()].map(([name, data]) => ({ name, ...data })).sort((a, b) => b.revenue - a.revenue);

    // Next 30 days occupancy forecast
    const next30Occupancy: { date: string; status: string }[] = [];
    const next30Booked = calendar.filter(c => {
      const d = new Date(c.date);
      const now = new Date();
      return d >= now && d <= new Date(now.getTime() + 30 * 86400000);
    });
    const next30BookedCount = next30Booked.filter(c => c.status === 'FULLY_BOOKED').length;
    const forecastOccupancy = next30Booked.length > 0 ? Math.round((next30BookedCount / Math.max(next30Booked.length, 1)) * 100) : 0;

    // Calendar heatmap (12 months)
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
      bookingLifecycle: {
        confirmed,
        eventInProgress,
        settlementPending,
        completed,
        cancelled,
      },
      addonPerformance,
      paymentDistribution: payments.map(p => ({ method: p.method, count: p.count, total: Number(p.total ?? 0) })),
      occupancyGauge: {
        current: occupancyRate,
        forecast: forecastOccupancy,
        next30Days: next30Occupancy,
      },
    };
  }

  async getMembershipAnalytics() {
    const [active, all] = await Promise.all([
      this.repo.activeSubscriptions(),
      this.repo.allSubscriptions(),
    ]);

    const activeSubs = all.filter(s => s.status === 'ACTIVE');
    const totalMRR = activeSubs.reduce((s, sub) => {
      const price = Number(sub.snapshotDisplayPrice);
      if (sub.snapshotPlanCode === 'BRONZE') return s; // free
      return s + price;
    }, 0);
    const monthlyMRR = Math.round(totalMRR / 3); // approximate monthly

    // MRR trend (monthly for 12 months)
    const mrrTrend: { month: string; mrr: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const subsInMonth = all.filter(s => {
        const created = new Date(s.createdAt);
        return created <= d;
      });
      const mrr = subsInMonth.filter(s => s.status === 'ACTIVE' && s.snapshotPlanCode !== 'BRONZE')
        .reduce((s, sub) => s + Number(sub.snapshotDisplayPrice), 0);
      mrrTrend.push({ month, mrr: Math.round(mrr / 3) });
    }

    // Plan distribution
    const planCounts = new Map<string, number>();
    for (const s of all) {
      if (s.snapshotPlanCode === 'BRONZE' && s.status !== 'ACTIVE') continue;
      const code = s.snapshotPlanCode;
      planCounts.set(code, (planCounts.get(code) ?? 0) + 1);
    }
    const planDistribution = [...planCounts.entries()].map(([plan, count]) => ({ plan, count }));

    // Churn (approximate: expired + cancelled / total)
    const expiredOrCancelled = all.filter(s => s.status === 'EXPIRED' || s.status === 'CANCELLED').length;
    const churnRate = all.length > 0 ? Math.round((expiredOrCancelled / all.length) * 100) : 0;

    // Avg revenue per user
    const paidUsers = all.filter(s => s.snapshotPlanCode !== 'BRONZE').length;
    const avgRevenuePerUser = paidUsers > 0 ? Math.round(totalMRR / paidUsers) : 0;

    // Expiry forecast
    const now = new Date();
    const expiringBuckets = [
      { label: '0-30 days', min: 0, max: 30 },
      { label: '31-60 days', min: 31, max: 60 },
      { label: '61-90 days', min: 61, max: 90 },
    ];
    const expiryForecast = expiringBuckets.map(b => {
      const subs = all.filter(s => {
        if (!s.expiresAt) return false;
        const days = Math.ceil((new Date(s.expiresAt).getTime() - now.getTime()) / 86400000);
        return days >= b.min && days <= b.max;
      });
      return {
        bucket: b.label,
        bronze: subs.filter(s => s.snapshotPlanCode === 'BRONZE').length,
        silver: subs.filter(s => s.snapshotPlanCode === 'SILVER').length,
        gold: subs.filter(s => s.snapshotPlanCode === 'GOLD').length,
        platinum: subs.filter(s => s.snapshotPlanCode === 'PLATINUM').length,
      };
    });

    // Churn risk scatter
    const recentLogin = await this.repo.loginActivityInRange(365);
    const loginMap = new Map<string, Date>();
    for (const l of recentLogin) {
      if (l.lastLoginAt) {
        const existing = loginMap.get(l.accountId);
        if (!existing || l.lastLoginAt > existing) loginMap.set(l.accountId, l.lastLoginAt);
      }
    }
    const churnRiskNow = Date.now();
    const churnRiskScatter = all
      .filter(s => s.expiresAt)
      .map(s => ({
        plan: s.snapshotPlanCode,
        daysSinceLogin: loginMap.has(s.accountId)
          ? Math.floor((churnRiskNow - loginMap.get(s.accountId)!.getTime()) / 86400000)
          : 365,
        daysToExpiry: Math.ceil((new Date(s.expiresAt!).getTime() - churnRiskNow) / 86400000),
        value: Number(s.snapshotDisplayPrice),
      }))
      .filter(s => s.daysToExpiry > 0 && s.daysToExpiry < 365);

    return {
      overview: {
        mrr: Math.round(monthlyMRR / 10) * 10,
        arr: Math.round(monthlyMRR * 12 / 10) * 10,
        avgRevenuePerUser,
        churnRate,
        mrrWoW: 0,
        arrWoW: 0,
        arpuWoW: 0,
        churnWoW: 0,
      },
      mrrTrend,
      planDistribution,
      churnRiskScatter,
      expiryForecast,
    };
  }

  async getOperationsAnalytics() {
    const [queue, reviews] = await Promise.all([
      this.repo.verificationQueueEntries(),
      this.repo.profileReviewsInRange(30),
    ]);

    const queueSize = queue.filter(q => !q.completedAt).length;
    const completed = reviews.length;

    // TAT calculation
    const tats: number[] = [];
    for (const q of queue) {
      if (q.completedAt && q.createdAt) {
        tats.push((q.completedAt.getTime() - q.createdAt.getTime()) / 3600000);
      }
    }
    const avgTAT = tats.length > 0 ? Math.round((tats.reduce((a, b) => a + b, 0) / tats.length) * 10) / 10 : 0;
    const slaCompliance = tats.length > 0 ? Math.round((tats.filter(t => t <= 48).length / tats.length) * 100) : 100;
    const approvalsToday = reviews.filter(r => r.action === 'APPROVED' && floorDate(r.createdAt) === floorDate(new Date())).length;

    // Queue trend (daily for 30d)
    const queueTrendMap = new Map<string, { incoming: number; resolved: number }>();
    for (const q of queue) {
      if (q.createdAt) {
        const key = floorDate(q.createdAt);
        if (!queueTrendMap.has(key)) queueTrendMap.set(key, { incoming: 0, resolved: 0 });
        queueTrendMap.get(key)!.incoming++;
      }
      if (q.completedAt) {
        const key = floorDate(q.completedAt);
        if (!queueTrendMap.has(key)) queueTrendMap.set(key, { incoming: 0, resolved: 0 });
        queueTrendMap.get(key)!.resolved++;
      }
    }
    const queueTrend: { date: string; incoming: number; resolved: number; pending: number }[] = [];
    let runningPending = 0;
    for (let i = 29; i >= 0; i--) {
      const key = floorDate(daysAgo(i));
      const d = queueTrendMap.get(key) ?? { incoming: 0, resolved: 0 };
      runningPending += d.incoming - d.resolved;
      queueTrend.push({ date: key, ...d, pending: Math.max(0, runningPending) });
    }

    // Verification time distribution
    const timeBuckets = [
      { label: '<1 hr', min: 0, max: 1 },
      { label: '1-2 hrs', min: 1, max: 2 },
      { label: '2-4 hrs', min: 2, max: 4 },
      { label: '4-8 hrs', min: 4, max: 8 },
      { label: '8-24 hrs', min: 8, max: 24 },
      { label: '>24 hrs', min: 24, max: Infinity },
    ];
    const verificationTimeDist = timeBuckets.map(b => ({
      label: b.label,
      count: tats.filter(t => t >= b.min && t < b.max).length,
    }));

    // Queue aging
    const now = Date.now();
    const ageBuckets = [
      { label: '<24h', min: 0, max: 86400000 },
      { label: '24-48h', min: 86400000, max: 172800000 },
      { label: '48-72h', min: 172800000, max: 259200000 },
      { label: '>72h', min: 259200000, max: Infinity },
    ];
    const queueAging = ageBuckets.map(b => ({
      label: b.label,
      count: queue.filter(q => !q.completedAt && (now - q.createdAt.getTime()) >= b.min && (now - q.createdAt.getTime()) < b.max).length,
    }));

    // Approval/rejection trend
    const approvalMap = new Map<string, { approved: number; rejected: number }>();
    for (const r of reviews) {
      const key = floorDate(r.createdAt);
      if (!approvalMap.has(key)) approvalMap.set(key, { approved: 0, rejected: 0 });
      if (r.action === 'APPROVED') approvalMap.get(key)!.approved++;
      else approvalMap.get(key)!.rejected++;
    }
    const approvalTrend: { date: string; approved: number; rejected: number; approvalRate: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const key = floorDate(daysAgo(i));
      const d = approvalMap.get(key) ?? { approved: 0, rejected: 0 };
      const total = d.approved + d.rejected;
      approvalTrend.push({ date: key, ...d, approvalRate: total > 0 ? Math.round((d.approved / total) * 100) : 0 });
    }

    // Rejection reasons
    const reasonMap = new Map<string, number>();
    for (const r of reviews) {
      if (r.action === 'REJECTED' && r.reasonEn) {
        const reason = r.reasonEn.slice(0, 50);
        reasonMap.set(reason, (reasonMap.get(reason) ?? 0) + 1);
      } else if (r.action === 'REJECTED') {
        reasonMap.set('Not specified', (reasonMap.get('Not specified') ?? 0) + 1);
      }
    }
    const rejectionReasons = [...reasonMap.entries()]
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count);

    return {
      overview: {
        queueSize,
        avgTAT,
        slaCompliance,
        approvalsToday,
        tatWoW: 0,
        slaWoW: 0,
      },
      queueTrend,
      verificationTimeDist,
      queueAging,
      approvalTrend,
      rejectionReasons,
    };
  }
}
