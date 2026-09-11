import { initialVehicles } from '../data/mockVehicles';
import { initialOrders, urgentOrderP101 } from '../data/mockOrders';
import { initialRoutes } from '../data/mockRoutes';
import { initialDisruptionEvents } from '../data/mockEvents';
import { Vehicle } from '../types/fleet';
import { Order } from '../types/order';
import { Route } from '../types/route';
import { DisruptionEvent, DisruptionType } from '../types/event';
import { WhatIfKnobs, WhatIfScenarioComparison, PlanMetrics } from '../types/scenario';

export interface DashboardMetrics {
  totalOperatingCostInr: number;
  onTimeSlaPct: number;
  activeVehiclesCount: number;
  totalVehiclesCount: number;
  totalOrdersCount: number;
  lateOrdersCount: number;
  fleetUtilizationPct: number;
  totalDistanceKm: number;
  reoptimisationsCount: number;
  pendingPickupCount: number;
  disruptedVehiclesCount: number;
  savedCostInr: number;
}

export const api = {
  async getFleet(): Promise<Vehicle[]> {
    return Promise.resolve(initialVehicles);
  },

  async getOrders(): Promise<Order[]> {
    return Promise.resolve(initialOrders);
  },

  async getRoutes(): Promise<Route[]> {
    return Promise.resolve(initialRoutes);
  },

  async getEvents(): Promise<DisruptionEvent[]> {
    return Promise.resolve(initialDisruptionEvents);
  },

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    return Promise.resolve({
      totalOperatingCostInr: 12450,
      onTimeSlaPct: 95.0,
      activeVehiclesCount: 4,
      totalVehiclesCount: 5,
      totalOrdersCount: 15,
      lateOrdersCount: 1,
      fleetUtilizationPct: 81.0,
      totalDistanceKm: 312,
      reoptimisationsCount: 3,
      pendingPickupCount: 2,
      disruptedVehiclesCount: 0,
      savedCostInr: 2180,
    });
  },

  async triggerEvent(type: DisruptionType, customDetails?: Partial<DisruptionEvent>): Promise<{
    event: DisruptionEvent;
    explanation: string;
    metricsDelta: { delayMinutes: number; costDeltaInr: number; slaDeltaPct: number };
  }> {
    // Simulated OR-Tools & solver dispatch response
    switch (type) {
      case 'TRAFFIC':
        return Promise.resolve({
          event: {
            id: `EVT-${Date.now()}`,
            type: 'TRAFFIC',
            title: 'Traffic Congestion: Malviya Nagar Calgiri Marg',
            description: 'Heavy traffic on Calgiri corridor. Speed reduced to 12 km/h. V04 route resequenced via Apex Circle.',
            location: 'Malviya Nagar Calgiri Marg',
            timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            severity: 'WARNING',
            affectedVehicleIds: ['V04'],
            affectedOrderIds: ['#1009'],
            impactDelayMinutes: 14,
            impactCostInr: 65,
            resolved: false,
            reoptimisationTriggered: true,
          },
          explanation: 'Traffic bottleneck detected on Calgiri Marg. Deterministic re-route executed avoiding segment. Net ETA difference: +8 minutes, +₹65 marginal cost. SLA maintained.',
          metricsDelta: { delayMinutes: 8, costDeltaInr: 65, slaDeltaPct: 0 }
        });

      case 'WEATHER':
        return Promise.resolve({
          event: {
            id: `EVT-${Date.now()}`,
            type: 'WEATHER',
            title: 'Heavy Rain Alert: Jaipur South-West',
            description: 'Precipitation exceeding 25mm/hr in Mansarovar & Sodala. Wet road speed penalty +15% applied.',
            location: 'Mansarovar & Sodala Corridor',
            timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            severity: 'WARNING',
            affectedVehicleIds: ['V01', 'V02'],
            affectedOrderIds: ['#1003', '#1006'],
            impactDelayMinutes: 12,
            impactCostInr: 110,
            resolved: false,
            reoptimisationTriggered: true,
          },
          explanation: 'Weather penalty ingested into travel-time matrix. Vehicle trajectories re-timed with increased buffer windows. Net ETA impact: +12 minutes. Zero hard window breaches.',
          metricsDelta: { delayMinutes: 12, costDeltaInr: 110, slaDeltaPct: -1.2 }
        });

      case 'URGENT_ORDER':
        return Promise.resolve({
          event: {
            id: `EVT-${Date.now()}`,
            type: 'URGENT_ORDER',
            title: 'Priority Ingestion: Emergency Order P-101',
            description: 'Critical surgical medicines for Fortis Escorts Hospital Malviya Nagar. Strict SLA: 12:30 PM.',
            location: 'Fortis Escorts Hospital, Malviya Nagar',
            timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            severity: 'CRITICAL',
            affectedVehicleIds: ['V04'],
            affectedOrderIds: ['P-101'],
            impactDelayMinutes: 0,
            impactCostInr: 140,
            resolved: false,
            reoptimisationTriggered: true,
          },
          explanation: 'Evaluated candidate vehicles V01, V02, V04. V04 chosen for insertion between Stop 1 and Stop 2 (Malviya corridor). 45kg load accommodated, zero SLA breach on remaining orders.',
          metricsDelta: { delayMinutes: 0, costDeltaInr: 140, slaDeltaPct: 0 }
        });

      case 'VEHICLE_BREAKDOWN':
        return Promise.resolve({
          event: {
            id: `EVT-${Date.now()}`,
            type: 'VEHICLE_BREAKDOWN',
            title: 'Vehicle Breakdown: V03 Near C-Scheme',
            description: 'Pilot Suresh Meena reported mechanical alternator failure. 3 orders (#1008, #1012, #1016) affected.',
            location: 'C-Scheme (Near Statue Circle)',
            timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            severity: 'CRITICAL',
            affectedVehicleIds: ['V03'],
            affectedOrderIds: ['#1008', '#1012', '#1016'],
            impactDelayMinutes: 42,
            impactCostInr: 420,
            resolved: false,
            reoptimisationTriggered: true,
            recoveryRecommendation: 'Reassign #1008 & #1012 to V01; Reassign #1016 to V04.'
          },
          explanation: 'Vehicle V03 marked BROKEN_DOWN. 3 active orders redistributed: V01 absorbs cold-chain #1008 and #1012 (+340kg remaining capacity, valid driver hours); V04 absorbs #1016. Delay reduced by 42 minutes vs stalling.',
          metricsDelta: { delayMinutes: -42, costDeltaInr: 420, slaDeltaPct: -1.0 }
        });

      case 'CASCADING_BREAKDOWN':
        return Promise.resolve({
          event: {
            id: `EVT-${Date.now()}`,
            type: 'CASCADING_BREAKDOWN',
            title: 'Cascading Failure: Secondary Breakdown on V01',
            description: 'Vehicle V01 has experienced an engine fault on Ajmer Flyover. 2 of 4 active vehicles now disabled.',
            location: 'Ajmer Flyover / Sodala Corridor',
            timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            severity: 'CRITICAL',
            affectedVehicleIds: ['V01', 'V03'],
            affectedOrderIds: ['#1001', '#1003', '#1006', '#1008', '#1010', '#1012'],
            impactDelayMinutes: 68,
            impactCostInr: 1250,
            resolved: false,
            reoptimisationTriggered: true,
            recoveryRecommendation: 'Deploy Standby Vehicle V05 from Sitapura Depot, or outsource 3 deliveries to 3PL partner.',
            alternativeActions: [
              'Deploy Standby Vehicle V05 from Sitapura (Restores 98% SLA, +₹340 cost)',
              'Outsource 3 low-priority deliveries to local carrier partner',
              'Defer standard orders to Evening Shift B',
              'Authorize +1.5h driver overtime for V02 & V04'
            ]
          },
          explanation: 'Cascading failure detected. Fleet reduced to V02 & V04 only. Remaining capacity cannot satisfy all delivery windows. Orders classified: 8 On Time, 4 Late, 3 Unserviceable. Standby deployment recommended.',
          metricsDelta: { delayMinutes: 68, costDeltaInr: 1250, slaDeltaPct: -15.0 }
        });

      default:
        return Promise.resolve({
          event: {
            id: `EVT-${Date.now()}`,
            type: 'ROAD_CLOSURE',
            title: 'Road Network Closure Ingested',
            description: 'Tonk Road closed between Gandhi Nagar & Laxmi Mandir.',
            location: 'Tonk Road',
            timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            severity: 'CRITICAL',
            affectedVehicleIds: ['V01'],
            affectedOrderIds: ['#1010'],
            impactDelayMinutes: 22,
            impactCostInr: 280,
            resolved: false,
            reoptimisationTriggered: true,
          },
          explanation: 'Segment marked unavailable. V01 path rerouted via Jan Path and Gopalpura bypass. Estimated +4.2 km detour, saving 22 minutes traffic delay.',
          metricsDelta: { delayMinutes: -22, costDeltaInr: 280, slaDeltaPct: 0 }
        });
    }
  },

  async runWhatIfScenario(knobs: WhatIfKnobs): Promise<WhatIfScenarioComparison> {
    const baseline: PlanMetrics = {
      totalCostInr: 12450,
      totalDistanceKm: 312,
      onTimeSlaPct: 95.0,
      lateOrdersCount: 1,
      unserviceableOrdersCount: 0,
      fleetUtilizationPct: 81.0,
      activeVehiclesCount: 4,
      overtimeHours: 0.4,
      fuelCostInr: 6864,
      wagesInr: 4800,
      maintenanceInr: 786,
      slaPenaltyInr: 0,
      feasibilityStatus: 'FEASIBLE',
    };

    let simulated: PlanMetrics = { ...baseline };

    if (knobs.removeVehicleV04) {
      simulated.activeVehiclesCount = 3;
      simulated.totalCostInr = 13620;
      simulated.totalDistanceKm = 341;
      simulated.onTimeSlaPct = 80.0;
      simulated.lateOrdersCount = 4;
      simulated.fleetUtilizationPct = 94.0;
      simulated.overtimeHours = 3.8;
      simulated.fuelCostInr = 7502;
      simulated.wagesInr = 5750;
      simulated.maintenanceInr = 368;
      simulated.slaPenaltyInr = 1200;
      simulated.feasibilityStatus = 'DEGRADED' as const;
    }

    if (knobs.addStandbyV05) {
      simulated.activeVehiclesCount = knobs.removeVehicleV04 ? 4 : 5;
      simulated.totalCostInr = knobs.removeVehicleV04 ? 12790 : 13800;
      simulated.totalDistanceKm = 318;
      simulated.onTimeSlaPct = 98.2;
      simulated.lateOrdersCount = 0;
      simulated.unserviceableOrdersCount = 0;
      simulated.fleetUtilizationPct = 72.0;
      simulated.overtimeHours = 0.2;
      simulated.slaPenaltyInr = 0;
      simulated.feasibilityStatus = 'FEASIBLE' as const;
    }

    const recommendation = knobs.removeVehicleV04 && !knobs.addStandbyV05
      ? 'Keeping V04 active is strongly recommended. Removing V04 forces 6 clustered drops onto V01 and V02, triggering 3 hard SLA breaches in Mansarovar and Sodala during peak traffic.'
      : 'Adding Standby V05 from Sitapura buffer successfully absorbs the re-routed cargo with +₹340 net marginal cost and 0 SLA violations.';

    const mitigationStrategy = knobs.removeVehicleV04 && !knobs.addStandbyV05
      ? 'Deploy Standby V05 from Sitapura Hub or outsource 3 standard drops to maintain 98% SLA compliance.'
      : 'Maintain optimal operational margin with current fleet balance.';

    return Promise.resolve({
      baseline,
      simulated,
      recommendation,
      mitigationStrategy
    });
  },

  async askOperationsAssistant(question: string, context?: any): Promise<{ answer: string; constraintsChecked: string[]; confidencePct: number }> {
    const q = question.toLowerCase();

    if (q.includes('v03') || q.includes('reassigned') || q.includes('v01')) {
      return Promise.resolve({
        answer: "Vehicle V03 suffered an alternator breakdown at C-Scheme. Orders #1008 and #1012 were assigned to V01 because V01 is equipped with the required refrigeration unit, had 340 kg surplus capacity, and possessed 2.4 hours of remaining legal driver shift time.",
        constraintsChecked: [
          "Vehicle refrigeration eligibility (Cold-chain compliant)",
          "Capacity check: 140kg + 80kg = 220kg <= 340kg remaining payload",
          "Driver Hours of Service (HOS): 2.4h available > 1.1h estimated detour",
          "Time window compliance: ETA 12:15 PM preserves strict 12:30 PM deadline"
        ],
        confidencePct: 98.4
      });
    }

    if (q.includes('cheapest') || q.includes('recovery')) {
      return Promise.resolve({
        answer: "Deploying Standby Vehicle V05 from Sitapura is the most cost-effective recovery option at +₹340 net marginal cost. In contrast, outsourcing 3 drops to a 3PL carrier costs +₹750, and paying SLA delay penalties incurs ₹1,200.",
        constraintsChecked: [
          "Deploy Standby V05: +₹340 fuel/wages, 0 penalties",
          "3PL Outsource: ₹250/order = +₹750",
          "Absorb with Overtime: +₹950 overtime wages + risk of fatigue",
          "Accept Delay: ₹1,200 SLA customer breach penalties"
        ],
        confidencePct: 96.2
      });
    }

    if (q.includes('risk') || q.includes('late')) {
      return Promise.resolve({
        answer: "Order #1008 (Apex Healthcare, C-Scheme) currently has only a 15-minute buffer. If Tonk Road delays exceed 20 minutes, Order #1010 will also breach its SLA window.",
        constraintsChecked: [
          "SLA Buffer Audit: Order #1008 (15m buffer)",
          "Corridor congestion check on Tonk Road & Calgiri Marg",
          "Estimated speed reduction impact on remaining drops"
        ],
        confidencePct: 94.0
      });
    }

    return Promise.resolve({
      answer: "MargDarshak dynamic re-solver continuously evaluates vehicle capacities, driver hours of service, delivery time windows, and road network disruptions using deterministic mathematical constraint programming (OR-Tools) to guarantee operational feasibility.",
      constraintsChecked: [
        "Vehicle Capacity Constraints (weight & volume)",
        "Time Window Constraints (customer SLAs)",
        "Driver Shift & Overtime Limits (legal HOS)",
        "Spatial Network Restrictions (road closures & traffic)"
      ],
      confidencePct: 95.5
    });
  }
};
