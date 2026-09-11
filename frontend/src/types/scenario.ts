export interface WhatIfKnobs {
  removeVehicleV04: boolean;
  addStandbyV05: boolean;
  addUrgentOrder: boolean;
  simulateRoadClosure: boolean;
  tightenDeliveryWindows: boolean;
  fuelCostMultiplier: number;
  overtimeLimitHours: number;
  slaPenaltyPerBreachInr: number;
}

export interface PlanMetrics {
  totalCostInr: number;
  totalDistanceKm: number;
  onTimeSlaPct: number;
  lateOrdersCount: number;
  unserviceableOrdersCount: number;
  fleetUtilizationPct: number;
  activeVehiclesCount: number;
  overtimeHours: number;
  fuelCostInr: number;
  wagesInr: number;
  maintenanceInr: number;
  slaPenaltyInr: number;
  feasibilityStatus: 'FEASIBLE' | 'DEGRADED' | 'INFEASIBLE';
}

export interface WhatIfScenarioComparison {
  baseline: PlanMetrics;
  simulated: PlanMetrics;
  recommendation: string;
  mitigationStrategy: string;
}
