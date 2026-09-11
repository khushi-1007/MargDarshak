export type DisruptionType = 
  | 'TRAFFIC' 
  | 'WEATHER' 
  | 'URGENT_ORDER' 
  | 'VEHICLE_BREAKDOWN' 
  | 'CASCADING_BREAKDOWN'
  | 'ROAD_CLOSURE';

export type EventSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface DisruptionEvent {
  id: string;
  type: DisruptionType;
  title: string;
  description: string;
  location: string;
  timestamp: string;
  severity: EventSeverity;
  affectedVehicleIds: string[];
  affectedOrderIds: string[];
  impactDelayMinutes: number;
  impactCostInr: number;
  resolved: boolean;
  reoptimisationTriggered: boolean;
  recoveryRecommendation?: string;
  alternativeActions?: string[];
}
