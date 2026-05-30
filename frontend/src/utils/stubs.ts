export async function stubFetchBasicStats() {
  return { totalUsers: 0, totalProfiles: 0, totalBookings: 0, totalRevenue: 0, recentUsers: 0, pendingVerifications: 0, matrimony: { total: 0, verified: 0, premium: 0 }, mandapam: { total: 0, completed: 0 }, revenue: { matrimony: 0, mandapam: 0 } };
}

export async function stubFetchPurchaseHistory(): Promise<any[]> {
  return [];
}

export async function stubFetchAnalyticsData(): Promise<any[]> {
  return [];
}
