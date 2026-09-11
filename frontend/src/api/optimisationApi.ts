import { apiClient } from './client';

export interface OptimisationRunRequest {
  trigger_type?: string;
  traffic_factor?: number;
  weather_factor?: number;
  time_limit_seconds?: number;
  order_ids?: string[];
  vehicle_ids?: string[];
}

export const optimisationApi = {
  async reoptimiseFleet(params: OptimisationRunRequest = { trigger_type: 'MANUAL' }): Promise<any> {
    return apiClient.post('/optimisation/reoptimise', params);
  },

  async listRuns(): Promise<any[]> {
    return apiClient.get('/optimisation/runs');
  },

  async getRun(runId: string): Promise<any> {
    return apiClient.get(`/optimisation/runs/${runId}`);
  },
};
