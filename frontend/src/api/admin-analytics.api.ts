import api from '../lib/api';

/**
 * API service for Admin Analytics
 */
export const adminAnalyticsApi = {
  /**
   * Get full dashboard analytics
   */
  getFullAnalytics: async () => {
    return api.get('/admin/analytics');
  },

  /**
   * Get basic overview stats
   */
  getBasicStats: async () => {
    return api.get('/admin/analytics/stats');
  }
};
