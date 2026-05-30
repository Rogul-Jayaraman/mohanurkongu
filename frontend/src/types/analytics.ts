export interface OverviewMetric {
  value: number;
  change: number;
}

export interface ManamaalaiAnalytics {
  overview: {
    activeProfiles: number;
    pendingVerifications: number;
    newRegistrations7d: number;
    activeMemberships: number;
    activeProfilesWoW: number;
    pendingVerificationsWoW: number;
    newRegistrationsWoW: number;
    activeMembershipsWoW: number;
  };
  profileGrowth: { date: string; count: number; movingAvg: number }[];
  membershipDistribution: { plan: string; count: number; percentage: number }[];
  demographicsRadar: {
    labels: string[];
    male: number[];
    female: number[];
  };
  ageGenderMatrix: { bucket: string; male: number; female: number }[];
  activityCalendar: { date: string; count: number }[];
  communityTreemap: { name: string; value: number }[];
  profileStatusStack: {
    date: string;
    draft: number;
    pending: number;
    active: number;
    rejected: number;
    archived: number;
  }[];
}

export interface MandapamAnalytics {
  overview: {
    occupancyRate: number;
    activeBookings: number;
    revenueMTD: number;
    outstandingBalance: number;
    revenueWoW: number;
    occupancyWoW: number;
    bookingWoW: number;
    outstandingWoW: number;
  };
  calendarHeatmap: { date: string; status: string }[];
  revenueBreakdown: {
    month: string;
    standard: number;
    royal: number;
    grand: number;
    addon: number;
  }[];
  bookingTrend: { month: string; bookings: number; revenue: number }[];
  bookingLifecycle: {
    confirmed: number;
    eventInProgress: number;
    settlementPending: number;
    completed: number;
    cancelled: number;
  };
  addonPerformance: { name: string; count: number; revenue: number }[];
  paymentDistribution: { method: string; count: number; total: number }[];
  occupancyGauge: {
    current: number;
    forecast: number;
    next30Days: { date: string; status: string }[];
  };
}

export interface MembershipAnalytics {
  overview: {
    mrr: number;
    arr: number;
    avgRevenuePerUser: number;
    churnRate: number;
    mrrWoW: number;
    arrWoW: number;
    arpuWoW: number;
    churnWoW: number;
  };
  mrrTrend: { month: string; mrr: number }[];
  planDistribution: { plan: string; count: number }[];
  churnRiskScatter: {
    plan: string;
    daysSinceLogin: number;
    daysToExpiry: number;
    value: number;
  }[];
  expiryForecast: {
    bucket: string;
    bronze: number;
    silver: number;
    gold: number;
    platinum: number;
  }[];
}

export interface OperationsAnalytics {
  overview: {
    queueSize: number;
    avgTAT: number;
    slaCompliance: number;
    approvalsToday: number;
    tatWoW: number;
    slaWoW: number;
  };
  queueTrend: { date: string; incoming: number; resolved: number; pending: number }[];
  verificationTimeDist: { label: string; count: number }[];
  queueAging: { label: string; count: number }[];
  approvalTrend: { date: string; approved: number; rejected: number; approvalRate: number }[];
  rejectionReasons: { reason: string; count: number }[];
}
