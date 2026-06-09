export interface ManamaalaiAnalytics {
  overview: {
    activeProfiles: number;
    pendingVerifications: number;
    newRegistrations7d: number;
    activeMemberships: number;
  };
  profileGrowth: { date: string; count: number }[];
  demographicsRadar: {
    labels: string[];
    male: number[];
    female: number[];
  };
  ageGenderMatrix: { bucket: string; male: number; female: number }[];
  profileStatusStack: {
    date: string;
    draft: number;
    pending: number;
    active: number;
    rejected: number;
    archived: number;
  }[];
  membershipRevenue: {
    mrr: number;
    arr: number;
    arpu: number;
    churnRate: number;
  };
  membershipFunnel: { stage: string; count: number }[];
  membershipPlanDistribution: { plan: string; count: number; percentage: number }[];
  renewalForecast: { bucket: string; silver: number; gold: number; platinum: number }[];
  verificationStats: {
    pendingTotal: number;
    pendingToday: number;
    approvedToday: number;
    rejectedToday: number;
    avgReviewTimeHours: number;
  };
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
