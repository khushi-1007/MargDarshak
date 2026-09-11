import { apiClient } from './client';
import { BackendOverviewMetrics, BackendCostMetrics } from './types';

export const analyticsApi = {
  async getOverview(): Promise<BackendOverviewMetrics> {
    return apiClient.get<BackendOverviewMetrics>('/analytics/overview');
  },

  async getCostAnalytics(): Promise<BackendCostMetrics> {
    return apiClient.get<BackendCostMetrics>('/analytics/cost');
  },

  async getSlaAnalytics(): Promise<any> {
    return apiClient.get('/analytics/sla');
  },

  async getUtilisationAnalytics(): Promise<any> {
    return apiClient.get('/analytics/utilisation');
  },

  async getPlanVsActual(): Promise<any> {
    return apiClient.get('/analytics/plan-vs-actual');
  },
};
