export interface VerificationStatsDTO {
  pendingTotal: number;
  pendingToday: number;
  approvedToday: number;
  rejectedToday: number;
  avgReviewTimeHours: number;
}

export interface ManamaalaiAnalyticsDTO {
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
  verificationStats: VerificationStatsDTO;
}
