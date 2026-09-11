import { apiClient } from './client';

export interface GroundedExplanationRequest {
  driver_id?: string;
  driver_name?: string;
  vehicle_id?: string;
  route_id?: string;
  action_type: string;
  target_order_id?: string;
  previous_stop_name?: string;
  new_stop_name?: string;
  eta_change_minutes?: number;
  reason?: string;
  decision_facts?: {
    action: string;
    target_order_id?: string;
    original_vehicle?: string;
    assigned_vehicle?: string;
    delay_delta_minutes?: number;
    cost_delta_inr?: number;
    constraints_satisfied?: string[];
  };
}

export interface GroundedExplanationResponse {
  summary: string;
  explanation: string;
  impact_statement: string;
  confidence_score: number;
  grounded_in_facts: boolean;
  constraints_checked: string[];
}

export const aiApi = {
  async explainDecision(req: GroundedExplanationRequest): Promise<GroundedExplanationResponse> {
    return apiClient.post<GroundedExplanationResponse>('/ai/explain', req);
  },
};
