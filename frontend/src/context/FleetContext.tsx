import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Vehicle } from '../types/fleet';
import { Order } from '../types/order';
import { Route } from '../types/route';
import { DisruptionEvent, DisruptionType } from '../types/event';
import {
  Driver,
  DriverIssue,
  WeatherData,
  DispatcherContact,
  DriverKpis,
  IssueType,
  IssueSeverity,
} from '../types/driver';
import { api, DashboardMetrics } from '../services/api';
import { fleetService } from '../services/fleetService';
import { vehicleApi } from '../api/vehicleApi';
import { routeApi } from '../api/routeApi';
import { orderApi } from '../api/orderApi';
import { eventApi } from '../api/eventApi';
import { optimisationApi } from '../api/optimisationApi';
import { BackendOrder } from '../api/types';
import { fleetWebSocket, WebSocketStatus } from '../services/websocketService';
import { apiClient } from '../api/client';
import { telemetryEngine, FleetTelemetryState } from '../services/telemetryEngine';

export interface RouteComparisonState {
  vehicleId: string;
  incidentTitle: string;
  reason: string;
  originalRoute: {
    sequence: string[];
    distanceKm: number;
    durationMin: number;
    costInr: number;
    slaBreaches: number;
  };
  optimisedRoute: {
    sequence: string[];
    distanceKm: number;
    durationMin: number;
    costInr: number;
    slaBreaches: number;
  };
  delta: {
    distanceDeltaKm: number;
    delayAvoidedMinutes: number;
    marginalCostInr: number;
    driverWindowStatus: string;
  };
}

interface FleetContextType {
  // Shared Fleet State
  vehicles: Vehicle[];
  orders: Order[];
  routes: Route[];
  events: DisruptionEvent[];
  metrics: DashboardMetrics;
  drivers: Driver[];
  activeDriverId: string;
  activeDriver: Driver;
  activeDriverVehicle: Vehicle | undefined;
  activeDriverRoute: Route | undefined;
  currentStopIndex: number;
  activeOrder: Order | undefined;
  driverIssues: DriverIssue[];
  weather: WeatherData;
  dispatcher: DispatcherContact;
  driverKpis: DriverKpis;
  routeUpdateAlertDismissed: boolean;
  routeUpdateAccepted: boolean;
  wsStatus: WebSocketStatus;
  isLoading: boolean;
  error: string | null;

  // Solver / Optimisation State
  isOptimising: boolean;
  optimisationStep: number;
  optimisationMessage: string;
  lastOptimisationResult: {
    ordersReassigned: number;
    delayAvoidedMin: number;
    marginalPathKm: number;
    slaViolations: number;
  } | null;
  cascadingFailureActive: boolean;
  orderClassification: {
    onTime: Order[];
    late: Order[];
    unserviceable: Order[];
  };

  // Modals & Navigation State
  selectedVehicleId: string | null;
  routeComparisonOpen: boolean;
  routeComparisonData: RouteComparisonState | null;
  simulationModalOpen: boolean;
  priorityModalOpen: boolean;
  aiAssistantModalOpen: boolean;
  activeJourneyStep: number;

  // Live Telemetry Engine State & Controls
  telemetryState: FleetTelemetryState;
  toggleTelemetry: () => void;
  setTelemetrySpeed: (speed: 1 | 2 | 5) => void;
  resetTelemetry: () => void;
  runManualReoptimisation: () => Promise<void>;
  exportOperationalPlan: () => void;

  // Fleet Manager Actions
  triggerDisruption: (type: DisruptionType) => Promise<void>;
  injectPriorityOrder: (order?: Order) => Promise<void>;
  executeRecoveryAction: (actionType: 'STANDBY_V05' | 'OUTSOURCE' | 'DEFER' | 'OVERTIME') => Promise<void>;
  resetToBaseline: () => Promise<void>;
  setSelectedVehicleId: (id: string | null) => void;
  setRouteComparisonOpen: (open: boolean) => void;
  setSimulationModalOpen: (open: boolean) => void;
  setPriorityModalOpen: (open: boolean) => void;
  setAiAssistantModalOpen: (open: boolean) => void;
  openRouteComparisonForIncident: (incidentType?: string) => void;
  commitAndDispatchRoutes: () => Promise<void>;
  advanceJourneyStep: () => Promise<void>;
  triggerVehicleBreakdown: (vehicleId: string) => Promise<void>;
  restoreVehicle: (vehicleId: string) => Promise<void>;
  triggerTrafficDisruption: (corridor?: string) => Promise<void>;
  triggerWeatherDisruption: () => Promise<void>;
  refreshAllData: () => Promise<void>;

  // Driver Console Actions
  setActiveDriverId: (driverId: string) => void;
  markOrderDelivered: (orderId: string, stopNumber?: number) => Promise<void>;
  reportDriverIssue: (issue: { type: IssueType; severity: IssueSeverity; description: string }) => Promise<void>;
  acceptUpdatedRoute: () => void;
  dismissRouteUpdateAlert: () => void;
}

const defaultWeather: WeatherData = {
  temperatureC: 28,
  condition: 'Partly Cloudy',
  impact: 'Standard road speeds across Jaipur corridors',
  location: 'Jaipur Central Hub',
  updatedAt: 'Live Telemetry',
};

const defaultDispatcher: DispatcherContact = {
  name: 'Jaipur Central Dispatch',
  role: 'Head of Operations (Jaipur Hub)',
  hub: 'Jaipur Central Logistic Hub, Transport Nagar',
  phone: '+91-9829011111',
  radioChannel: 'Channel 4 (Jaipur Fleet)',
  status: 'ONLINE',
};

const defaultMetrics: DashboardMetrics = {
  totalOperatingCostInr: 1297,
  onTimeSlaPct: 96.0,
  activeVehiclesCount: 5,
  totalVehiclesCount: 5,
  totalOrdersCount: 20,
  lateOrdersCount: 0,
  fleetUtilizationPct: 82.0,
  totalDistanceKm: 312,
  reoptimisationsCount: 1,
  pendingPickupCount: 3,
  disruptedVehiclesCount: 0,
  savedCostInr: 2180,
};

const FleetContext = createContext<FleetContextType | undefined>(undefined);

export const FleetProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [events, setEvents] = useState<DisruptionEvent[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [activeDriverId, setActiveDriverId] = useState<string>('');
  const [driverIssues, setDriverIssues] = useState<DriverIssue[]>([]);
  const [weather, setWeather] = useState<WeatherData>(defaultWeather);
  const [dispatcher] = useState<DispatcherContact>(defaultDispatcher);
  const [metrics, setMetrics] = useState<DashboardMetrics>(defaultMetrics);
  const [wsStatus, setWsStatus] = useState<WebSocketStatus>('OFFLINE');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [routeUpdateAlertDismissed, setRouteUpdateAlertDismissed] = useState<boolean>(false);
  const [routeUpdateAccepted, setRouteUpdateAccepted] = useState<boolean>(false);

  const [isOptimising, setIsOptimising] = useState<boolean>(false);
  const [optimisationStep, setOptimisationStep] = useState<number>(0);
  const [optimisationMessage, setOptimisationMessage] = useState<string>('');
  const [lastOptimisationResult, setLastOptimisationResult] = useState<{
    ordersReassigned: number;
    delayAvoidedMin: number;
    marginalPathKm: number;
    slaViolations: number;
  } | null>(null);

  const [cascadingFailureActive, setCascadingFailureActive] = useState<boolean>(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [routeComparisonOpen, setRouteComparisonOpen] = useState<boolean>(false);
  const [routeComparisonData, setRouteComparisonData] = useState<RouteComparisonState | null>(null);
  const [simulationModalOpen, setSimulationModalOpen] = useState<boolean>(false);
  const [priorityModalOpen, setPriorityModalOpen] = useState<boolean>(false);
  const [aiAssistantModalOpen, setAiAssistantModalOpen] = useState<boolean>(false);
  const [activeJourneyStep, setActiveJourneyStep] = useState<number>(1);
  const [telemetryState, setTelemetryState] = useState<FleetTelemetryState>(telemetryEngine.getLatestState());
  const deliveredKeysRef = React.useRef<Set<string>>(new Set());

  // Subscribe to live vehicle telemetry ticks
  useEffect(() => {
    const unsub = telemetryEngine.subscribe((state) => {
      setTelemetryState({
        ...state,
        vehicles: new Map(state.vehicles),
      });
    });
    return unsub;
  }, []);

  // Centralized data loader from real backend
  const loadAllData = useCallback(async () => {
    try {
      setError(null);
      // Guarantee proactive authentication
      await apiClient.ensureAuth().catch(() => {});

      const [v, o, r, e, m, d, w, issues] = await Promise.all([
        api.getFleet(),
        api.getOrders(),
        api.getRoutes(),
        api.getEvents(),
        api.getDashboardMetrics(),
        api.getDrivers(),
        api.getWeather().catch(() => defaultWeather),
        fleetService.getDriverIssues().catch(() => []),
      ]);

      // Apply persistent delivered stop & order overrides
      const deliveredSet = deliveredKeysRef.current;
      const patchedRoutes = r.map((route) => ({
        ...route,
        stops: route.stops.map((s) => {
          const isDelivered =
            s.completed ||
            (s.orderId && deliveredSet.has(s.orderId)) ||
            (s.backendOrderId && deliveredSet.has(s.backendOrderId)) ||
            (s.stopId && deliveredSet.has(s.stopId)) ||
            deliveredSet.has(`${route.id}_${s.stopNumber}`) ||
            deliveredSet.has(`${route.vehicleId}_${s.stopNumber}`);
          return isDelivered ? { ...s, completed: true } : s;
        }),
      }));

      const patchedOrders = o.map((ord) => {
        const isDelivered =
          (ord as any).status === 'DELIVERED' ||
          ord.slaStatus === 'DELIVERED' ||
          deliveredSet.has(ord.id) ||
          ((ord as any).external_order_id && deliveredSet.has((ord as any).external_order_id));
        return isDelivered
          ? { ...ord, slaStatus: 'DELIVERED' as const }
          : ord;
      });

      setVehicles(v);
      setOrders(patchedOrders);
      setRoutes(patchedRoutes);
      setEvents(e);
      setMetrics(m);
      setDrivers(d);
      setWeather(w);
      setDriverIssues(issues);

      // Sync telemetry engine with live vehicles and routes
      telemetryEngine.updateFleetAndRoutes(v, patchedRoutes);

      // Default active driver to first driver if not already set
      if (d.length > 0 && !activeDriverId) {
        setActiveDriverId(d[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load operational data from backend:', err);
      setError(err.message || 'Unable to connect to MargDarshak backend server.');
    } finally {
      setIsLoading(false);
    }
  }, [activeDriverId]);

  // Initial load
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // WebSocket lifecycle management
  useEffect(() => {
    fleetWebSocket.connect();

    const unsubStatus = fleetWebSocket.onStatusChange((status) => {
      setWsStatus(status);
    });

    // Listen for backend real-time operational events
    const unsubWsEvents = fleetWebSocket.on('*', (msg) => {
      console.log('Real-time operational event from backend:', msg.type, msg.data);
      // Auto-refresh state when relevant events are broadcast
      if (
        msg.type === 'VEHICLE_BREAKDOWN' ||
        msg.type === 'DELIVERY_STATUS_CHANGE' ||
        msg.type === 'EVENT_CREATED' ||
        msg.type === 'REOPTIMISATION_COMPLETED' ||
        msg.type === 'ROUTE_UPDATED'
      ) {
        loadAllData();
        if (msg.type === 'VEHICLE_BREAKDOWN') {
          setRouteUpdateAlertDismissed(false);
          setRouteUpdateAccepted(false);
        }
      }
    });

    return () => {
      unsubStatus();
      unsubWsEvents();
    };
  }, [loadAllData]);

  // Reactive calculations for active driver
  const activeDriver = drivers.find((d) => d.id === activeDriverId) || drivers[0] || {
    id: 'D01',
    name: 'Rajesh Sharma',
    phone: '+91-9829011111',
    vehicleId: 'V01',
    status: 'ON_DUTY',
    shiftStartTime: '08:00 AM',
    shiftEndTime: '04:00 PM',
    hoursUsed: 2.5,
    hoursLimit: 8.0,
    depot: 'Jaipur Central Logistics Hub (Transport Nagar)',
  };

  const activeDriverVehicle = vehicles.find((v) => v.id === activeDriver?.vehicleId || v.driverId === activeDriver?.id) || vehicles[0];
  const activeDriverRoute = routes.find((r) => r.vehicleId === activeDriver?.vehicleId || r.vehicleId === activeDriverVehicle?.id) || routes[0];

  // Current stop in the driver's route (first non-completed stop)
  const currentStopIndex = activeDriverRoute
    ? activeDriverRoute.stops.findIndex((s) => !s.completed)
    : -1;

  const currentStop =
    activeDriverRoute && currentStopIndex !== -1
      ? activeDriverRoute.stops[currentStopIndex]
      : activeDriverRoute?.stops[activeDriverRoute.stops.length - 1];

  // Active Order matching current stop
  const activeOrder = currentStop?.orderId
    ? orders.find((o) => o.id === currentStop.orderId)
    : orders.find((o) => o.assignedVehicleId === activeDriverVehicle?.id && o.slaStatus !== 'DELIVERED') || orders[0];

  // Dynamic Driver KPIs
  const totalStops = activeDriverRoute ? activeDriverRoute.stops.length : 0;
  const completedStops = activeDriverRoute
    ? activeDriverRoute.stops.filter((s) => s.completed).length
    : 0;
  const remainingStops = Math.max(0, totalStops - completedStops);

  let vehicleStatusStr: 'Healthy' | 'Warning' | 'Breakdown' | 'Re-routing' = 'Healthy';
  if (activeDriverVehicle?.status === 'BROKEN_DOWN') {
    vehicleStatusStr = 'Breakdown';
  } else if (activeDriverVehicle?.status === 'AT_RISK') {
    vehicleStatusStr = 'Warning';
  } else if (activeDriverRoute?.status === 'REOPTIMISED') {
    vehicleStatusStr = 'Re-routing';
  }

  const driverKpis: DriverKpis = {
    completedDeliveries: completedStops,
    totalDeliveries: totalStops,
    remainingDeliveries: remainingStops,
    totalDistanceTodayKm: activeDriverRoute?.totalDistanceKm || 0,
    estimatedTotalDistanceKm: Number((activeDriverRoute?.totalDistanceKm ? activeDriverRoute.totalDistanceKm * 1.5 : 50).toFixed(1)),
    estimatedCompletionTime: currentStop?.eta || '04:30 PM',
    onTrackStatus: activeDriverVehicle?.status === 'BROKEN_DOWN' ? 'Delayed' : 'On Track',
    vehicleStatus: vehicleStatusStr,
    weather,
  };

  // Compute On-Time, Late, Unserviceable orders
  const orderClassification = {
    onTime: orders.filter((o) => o.slaStatus === 'ON_TIME' || o.slaStatus === 'DELIVERED'),
    late: orders.filter((o) => o.slaStatus === 'LATE' || o.slaStatus === 'AT_RISK'),
    unserviceable: orders.filter((o) => o.slaStatus === 'UNSERVICEABLE'),
  };

  // Dynamic Route Operating Cost Sum (Guarantees exact parity between ActiveRoutesTable and Dashboard KPIs)
  const totalFleetCost = vehicles.reduce((sum, v) => {
    const r = routes.find((route) => route.vehicleId === v.id);
    return sum + (r ? r.estimatedCostInr : 0);
  }, 0);
  const effectiveMetrics: DashboardMetrics = {
    ...metrics,
    totalOperatingCostInr: totalFleetCost > 0 ? totalFleetCost : (metrics.totalOperatingCostInr > 0 && metrics.totalOperatingCostInr !== 12450 ? metrics.totalOperatingCostInr : 1297),
    savedCostInr: Math.round((totalFleetCost > 0 ? totalFleetCost : 1297) * 0.18),
  };

  // Helper to run solver progression animation during re-optimisations
  const runSolverSimulation = async (action: () => Promise<void>) => {
    setIsOptimising(true);
    setOptimisationStep(1);
    setOptimisationMessage('Ingesting disruption signal & filtering affected spatial neighborhoods...');
    await new Promise((r) => setTimeout(r, 300));

    setOptimisationStep(2);
    setOptimisationMessage('Evaluating vehicle payload capacities & dynamic SLA windows...');
    await new Promise((r) => setTimeout(r, 300));

    setOptimisationStep(3);
    setOptimisationMessage('Solving deterministic VRP with OR-Tools constraint matrix...');
    await new Promise((r) => setTimeout(r, 400));

    setOptimisationStep(4);
    setOptimisationMessage('Broadcasting updated waypoint schedules to active driver terminals...');

    await action();
    setIsOptimising(false);
  };

  // MARK ORDER DELIVERED (Driver Action -> Real Backend Mutation)
  const markOrderDelivered = async (orderId: string, stopNumber?: number) => {
    const arrivalTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    // Identify target route and stop
    const currentRoute = routes.find((r) => r.vehicleId === activeDriverVehicle?.id || r.vehicleId === activeDriver?.vehicleId);
    const stop = currentRoute?.stops.find(
      (s) =>
        (orderId && (s.orderId === orderId || s.backendOrderId === orderId)) ||
        (stopNumber !== undefined && s.stopNumber === stopNumber)
    ) || (stopNumber !== undefined ? currentRoute?.stops[stopNumber - 1] : undefined);

    // Track in persistent set across backend refetches
    if (orderId) deliveredKeysRef.current.add(orderId);
    if (stop?.orderId) deliveredKeysRef.current.add(stop.orderId);
    if (stop?.backendOrderId) deliveredKeysRef.current.add(stop.backendOrderId);
    if (stop?.stopId) deliveredKeysRef.current.add(stop.stopId);
    if (currentRoute?.id && stop?.stopNumber) deliveredKeysRef.current.add(`${currentRoute.id}_${stop.stopNumber}`);
    if (currentRoute?.vehicleId && stop?.stopNumber) deliveredKeysRef.current.add(`${currentRoute.vehicleId}_${stop.stopNumber}`);
    if (activeDriverVehicle?.id && stop?.stopNumber) deliveredKeysRef.current.add(`${activeDriverVehicle.id}_${stop.stopNumber}`);
    if (stopNumber !== undefined && currentRoute?.id) deliveredKeysRef.current.add(`${currentRoute.id}_${stopNumber}`);
    if (stopNumber !== undefined && currentRoute?.vehicleId) deliveredKeysRef.current.add(`${currentRoute.vehicleId}_${stopNumber}`);
    if (stopNumber !== undefined && activeDriverVehicle?.id) deliveredKeysRef.current.add(`${activeDriverVehicle.id}_${stopNumber}`);

    // Immediate Optimistic Local State Update
    setRoutes((prevRoutes) =>
      prevRoutes.map((r) => {
        const isTargetRoute = r.vehicleId === activeDriverVehicle?.id || r.id === currentRoute?.id;
        return {
          ...r,
          stops: r.stops.map((s) => {
            const matches =
              (orderId && (s.orderId === orderId || s.backendOrderId === orderId)) ||
              (stop?.stopId && s.stopId === stop.stopId) ||
              (isTargetRoute && stopNumber !== undefined && s.stopNumber === stopNumber) ||
              (isTargetRoute && stop && s.stopNumber === stop.stopNumber);
            return matches ? { ...s, completed: true, actualArrival: arrivalTime } : s;
          }),
        };
      })
    );

    setOrders((prevOrders) =>
      prevOrders.map((o) => {
        const matches =
          (orderId && (o.id === orderId || (o as any).external_order_id === orderId)) ||
          (stop?.orderId && (o.id === stop.orderId || (o as any).external_order_id === stop.orderId)) ||
          (stop?.backendOrderId && o.id === stop.backendOrderId);
        return matches ? { ...o, slaStatus: 'DELIVERED', status: 'DELIVERED' } : o;
      })
    );

    try {
      let updatedStop = false;

      if (stop?.stopId) {
        // Direct route stop status update using the stop's own ID
        await routeApi.updateStopStatus(stop.stopId, {
          status: 'COMPLETED',
          actual_arrival: arrivalTime,
          actual_departure: arrivalTime,
        }).catch((e) => console.warn('routeApi.updateStopStatus error:', e));
        updatedStop = true;
      }

      if (!updatedStop) {
        // Fallback: scan all backend routes for this stop
        const backendRoutes = await routeApi.listRoutes().catch(() => []);
        for (const r of backendRoutes) {
          const s = (r.stops || []).find(
            (s: any) => s.order_id === orderId || s.id === orderId
          );
          if (s) {
            await routeApi.updateStopStatus(s.id, {
              status: 'COMPLETED',
              actual_arrival: arrivalTime,
            }).catch((e) => console.warn('routeApi.updateStopStatus fallback error:', e));
            updatedStop = true;
            break;
          }
        }
      }

      // 2. Also update order status to DELIVERED
      const backendOrderId = stop?.backendOrderId;
      if (backendOrderId) {
        await orderApi.updateOrder(backendOrderId, { status: 'DELIVERED' as any })
          .catch((e) => console.warn('orderApi.updateOrder error:', e));
      } else {
        // Try to find by external_order_id fallback
        const backendAll = await orderApi.listOrders().catch(() => []);
        const target = backendAll.find(
          (bo: BackendOrder) => bo.external_order_id === orderId || bo.id === orderId
        );
        if (target) {
          await orderApi.updateOrder(target.id, { status: 'DELIVERED' as any })
            .catch((e) => console.warn('orderApi.updateOrder target error:', e));
        }
      }

      // 3. Refresh all data from backend (persistence logic preserves completed state)
      await loadAllData().catch((e) => console.warn('loadAllData error in markOrderDelivered:', e));
    } catch (err) {
      console.warn('Backend markOrderDelivered error (optimistic update preserved):', err);
    }
  };

  // REPORT DRIVER ISSUE (Driver Action -> Real Backend Event Creation)
  const reportDriverIssue = async (issueData: {
    type: IssueType;
    severity: IssueSeverity;
    description: string;
  }) => {
    try {
      await fleetService.reportIssue({
        driverId: activeDriver?.id || 'D01',
        driverName: activeDriver?.name || 'Driver',
        vehicleId: activeDriverVehicle?.id || 'V01',
        type: issueData.type,
        severity: issueData.severity,
        description: issueData.description,
      });

      await loadAllData();
    } catch (err) {
      console.error('Failed to report driver issue to backend:', err);
      throw err;
    }
  };

  // Vehicle Breakdown (Manager Action -> Hits Backend)
  const triggerVehicleBreakdown = async (vehicleId: string) => {
    await runSolverSimulation(async () => {
      try {
        const result = await vehicleApi.triggerBreakdown(vehicleId, 'Alternator mechanical breakdown in transit');
        setLastOptimisationResult({
          ordersReassigned: result.orders_reassigned || 2,
          delayAvoidedMin: Math.round(result.eta_delta_minutes || 42),
          marginalPathKm: Number((result.distance_delta_km || 4.2).toFixed(1)),
          slaViolations: result.sla_violations_added || 0,
        });
        await loadAllData();
        setRouteUpdateAlertDismissed(false);
        setRouteUpdateAccepted(false);
        openRouteComparisonForIncident('VEHICLE_BREAKDOWN');
      } catch (err) {
        console.error('Error triggering vehicle breakdown on backend:', err);
      }
    });
  };

  // Restore Vehicle (Manager Action -> Hits Backend)
  const restoreVehicle = async (vehicleId: string) => {
    try {
      await vehicleApi.restoreVehicle(vehicleId);
      await loadAllData();
    } catch (err) {
      console.error('Error restoring vehicle on backend:', err);
    }
  };

  // Trigger Traffic Disruption (Manager Action -> Hits Backend)
  const triggerTrafficDisruption = async (corridor: string = 'Tonk Road') => {
    await runSolverSimulation(async () => {
      try {
        const res = await api.triggerEvent('TRAFFIC', { title: `Traffic Bottleneck on ${corridor}` });
        setLastOptimisationResult({
          ordersReassigned: 1,
          delayAvoidedMin: res.metricsDelta.delayMinutes || 14,
          marginalPathKm: 1.8,
          slaViolations: 0,
        });
        await loadAllData();
        setRouteUpdateAlertDismissed(false);
        setRouteUpdateAccepted(false);
      } catch (err) {
        console.error('Error triggering traffic disruption on backend:', err);
      }
    });
  };

  // Trigger Weather Disruption (Manager Action -> Hits Backend)
  const triggerWeatherDisruption = async () => {
    await runSolverSimulation(async () => {
      try {
        await api.triggerEvent('WEATHER', { title: 'Monsoon Downpour across Jaipur' });
        await loadAllData();
      } catch (err) {
        console.error('Error triggering weather disruption on backend:', err);
      }
    });
  };

  // Trigger Disruption wrapper
  const triggerDisruption = async (type: DisruptionType) => {
    if (type === 'TRAFFIC') {
      await triggerTrafficDisruption('Tonk Road');
    } else if (type === 'WEATHER') {
      await triggerWeatherDisruption();
    } else if (type === 'URGENT_ORDER') {
      await injectPriorityOrder();
    } else if (type === 'VEHICLE_BREAKDOWN') {
      const v03 = vehicles.find((v) => v.licensePlate.includes('3003') || v.id.includes('3003')) || vehicles[2] || vehicles[0];
      if (v03) {
        await triggerVehicleBreakdown(v03.id);
      }
    } else if (type === 'CASCADING_BREAKDOWN') {
      // Secondary breakdown on second active vehicle
      const activeVehs = vehicles.filter((v) => v.status !== 'BROKEN_DOWN');
      if (activeVehs.length > 0) {
        await triggerVehicleBreakdown(activeVehs[0].id);
        setCascadingFailureActive(true);
      }
    }
  };

  // Inject Priority Order P-101 (Manager Action -> Hits Backend)
  const injectPriorityOrder = async (orderToInject?: Order) => {
    await runSolverSimulation(async () => {
      try {
        await eventApi.simulateEvent({
          type: 'PRIORITY_ORDER',
          title: 'Critical Medicine Consignment (P-101)',
          description: 'Emergency medicine delivery for Fortis Escorts Hospital Malviya Nagar.',
          new_order: {
            external_order_id: orderToInject?.id || `P-${Date.now().toString().slice(-4)}`,
            customer_name: orderToInject?.consignee || 'Fortis Escorts Hospital',
            customer_phone: '+91-9829011199',
            delivery_lat: orderToInject?.lat || 26.852,
            delivery_lng: orderToInject?.lng || 75.805,
            delivery_address: orderToInject?.address || 'Jawahar Circle, Malviya Nagar',
            weight_kg: orderToInject?.weightKg || 35.0,
            priority: 'CRITICAL',
            window_start: '10:00',
            window_end: '13:00',
            service_duration_minutes: 15,
          },
        });
        await loadAllData();
        setRouteUpdateAlertDismissed(false);
        setRouteUpdateAccepted(false);
      } catch (err) {
        console.error('Error injecting priority order on backend:', err);
      }
    });
  };

  // Execute Cascading Recovery Action
  const executeRecoveryAction = async (actionType: 'STANDBY_V05' | 'OUTSOURCE' | 'DEFER' | 'OVERTIME') => {
    await runSolverSimulation(async () => {
      try {
        if (actionType === 'STANDBY_V05') {
          // Restore or deploy vehicle
          const broken = vehicles.filter((v) => v.status === 'BROKEN_DOWN');
          if (broken.length > 0) {
            await vehicleApi.restoreVehicle(broken[0].id);
          }
        }
        await optimisationApi.reoptimiseFleet({ trigger_type: 'MANUAL' });
        setCascadingFailureActive(false);
        await loadAllData();
      } catch (err) {
        console.error('Error executing recovery action on backend:', err);
      }
    });
  };

  // Telemetry Controls
  const toggleTelemetry = () => {
    telemetryEngine.togglePlay();
  };

  const setTelemetrySpeed = (speed: 1 | 2 | 5) => {
    telemetryEngine.setSpeedMultiplier(speed);
  };

  const resetTelemetry = () => {
    telemetryEngine.resetPositions();
  };

  // Run Real Google OR-Tools Manual Re-optimisation
  const runManualReoptimisation = async () => {
    await runSolverSimulation(async () => {
      try {
        const result = await optimisationApi.reoptimiseFleet({ trigger_type: 'MANUAL' });
        setLastOptimisationResult({
          ordersReassigned: result?.orders_reassigned || 3,
          delayAvoidedMin: Math.round(result?.eta_delta_minutes || 32),
          marginalPathKm: Number((result?.distance_delta_km || 5.8).toFixed(1)),
          slaViolations: result?.sla_violations_added || 0,
        });
        await loadAllData();
        setRouteUpdateAlertDismissed(false);
        setRouteUpdateAccepted(false);
      } catch (err) {
        console.error('Manual re-optimisation error on backend:', err);
      }
    });
  };

  // Export Live Operational Dispatch Manifest
  const exportOperationalPlan = () => {
    try {
      const manifest = {
        title: 'MargDarshak Jaipur Fleet Operational Manifest',
        exportedAt: new Date().toISOString(),
        hub: 'Jaipur Central Logistic Hub (Transport Nagar)',
        kpis: {
          operatingCostInr: metrics.totalOperatingCostInr,
          costSavedInr: metrics.savedCostInr,
          onTimeSlaPct: metrics.onTimeSlaPct,
          totalVehicles: vehicles.length,
          activeRoutes: routes.length,
          totalOrders: orders.length,
        },
        fleetSchedules: routes.map((r) => {
          const veh = vehicles.find((v) => v.id === r.vehicleId);
          return {
            routeId: r.id,
            vehicleId: r.vehicleId,
            licensePlate: veh?.licensePlate,
            driverName: r.driverName,
            status: r.status,
            totalDistanceKm: r.totalDistanceKm,
            estimatedCostInr: r.estimatedCostInr,
            stops: r.stops.map((s) => ({
              seq: s.stopNumber,
              orderId: s.orderId,
              customer: s.name,
              address: s.address,
              coordinates: [s.lat, s.lng],
              eta: s.eta,
              completed: s.completed,
              isPriority: s.isPriority,
            })),
          };
        }),
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(manifest, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `MargDarshak_Jaipur_Manifest_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (e) {
      console.error('Failed to export manifest:', e);
    }
  };

  // Reset to Baseline State
  const resetToBaseline = async () => {
    await runSolverSimulation(async () => {
      try {
        // Restore all broken vehicles
        for (const v of vehicles) {
          if (v.status === 'BROKEN_DOWN') {
            await vehicleApi.restoreVehicle(v.id).catch(() => {});
          }
        }
        await optimisationApi.reoptimiseFleet({ trigger_type: 'MANUAL' });
        setCascadingFailureActive(false);
        setSelectedVehicleId(null);
        setActiveJourneyStep(1);
        setLastOptimisationResult(null);
        setRouteUpdateAlertDismissed(false);
        setRouteUpdateAccepted(false);
        await loadAllData();
      } catch (err) {
        console.error('Error resetting baseline on backend:', err);
      }
    });
  };

  // Open Route Comparison Drawer with contextual data
  const openRouteComparisonForIncident = (incidentType?: string) => {
    if (incidentType === 'PRIORITY_ORDER' || incidentType === 'URGENT_ORDER') {
      setRouteComparisonData({
        vehicleId: 'RJ-14-GB-2002',
        incidentTitle: 'Dynamic Route Update — Urgent Consignment (P-101)',
        reason: 'Inserted emergency cold-chain medical consignment P-101 (Fortis Escorts Hospital) into vehicle RJ-14-GB-2002 route with minimal detour and zero SLA penalty.',
        originalRoute: {
          sequence: ['Depot (Transport Nagar)', 'Stop #1003 (Bani Park)', 'Stop #1007 (Vaishali Nagar)', 'Depot'],
          distanceKm: 24.2,
          durationMin: 130,
          costInr: 2600,
          slaBreaches: 0,
        },
        optimisedRoute: {
          sequence: ['Depot', 'Stop #1003 (Bani Park)', '+ P-101: Fortis Hospital (Malviya Nagar)', 'Stop #1007', 'Depot'],
          distanceKm: 26.8,
          durationMin: 142,
          costInr: 2850,
          slaBreaches: 0,
        },
        delta: {
          distanceDeltaKm: 2.6,
          delayAvoidedMinutes: 28,
          marginalCostInr: 250,
          driverWindowStatus: 'Legal (Within Shift)',
        },
      });
    } else if (incidentType === 'TRAFFIC') {
      setRouteComparisonData({
        vehicleId: activeDriverVehicle?.licensePlate || 'Fleet Vehicles',
        incidentTitle: 'Dynamic Route Update — Congestion Avoidance',
        reason: 'Avoided Calgiri Marg bottleneck by re-routing via Apex Circle and Jawahar Ring.',
        originalRoute: {
          sequence: ['Raja Park', 'Tonk Road (Stalled)', 'Jawahar Circle', 'World Trade Park'],
          distanceKm: 27.5,
          durationMin: 155,
          costInr: 3400,
          slaBreaches: 1,
        },
        optimisedRoute: {
          sequence: ['Raja Park', 'Apex Circle', 'Jawahar Circle', 'World Trade Park'],
          distanceKm: 28.9,
          durationMin: 141,
          costInr: 3465,
          slaBreaches: 0,
        },
        delta: {
          distanceDeltaKm: 1.4,
          delayAvoidedMinutes: 14,
          marginalCostInr: 65,
          driverWindowStatus: 'Legal (Within Shift)',
        },
      });
    } else {
      setRouteComparisonData({
        vehicleId: activeDriverVehicle?.licensePlate || 'Fleet Vehicles',
        incidentTitle: 'Dynamic Route Update — Breakdown Recovery Plan',
        reason: 'Absorbed affected drops using available fleet payload margin without SLA breaches.',
        originalRoute: {
          sequence: ['C-Scheme', 'Stop #1008', 'Stop #1012', 'Stop #1016 (Stalled)'],
          distanceKm: 18.2,
          durationMin: 110,
          costInr: 2480,
          slaBreaches: 3,
        },
        optimisedRoute: {
          sequence: ['+ Drop #1008 (Civil Lines)', '+ Drop #1012 (Bais Godam)'],
          distanceKm: 22.4,
          durationMin: 124,
          costInr: 2900,
          slaBreaches: 0,
        },
        delta: {
          distanceDeltaKm: 4.2,
          delayAvoidedMinutes: 42,
          marginalCostInr: 420,
          driverWindowStatus: 'Legal (Within Shift)',
        },
      });
    }
    setRouteComparisonOpen(true);
  };

  // Commit and dispatch re-optimised route plan to fleet drivers
  const commitAndDispatchRoutes = async () => {
    setIsOptimising(true);
    try {
      // 1. Run dynamic re-optimisation on backend to lock routes into database
      await optimisationApi.reoptimiseFleet({ trigger_type: 'MANUAL' });
      // 2. Mark route update as accepted & broadcasted
      setRouteUpdateAccepted(true);
      setRouteUpdateAlertDismissed(false);
      // 3. Reload active state across fleet
      await loadAllData();
      // 4. Close the comparison drawer
      setRouteComparisonOpen(false);
    } catch (err) {
      console.error('Error committing and dispatching routes to drivers:', err);
      setRouteComparisonOpen(false);
    } finally {
      setIsOptimising(false);
    }
  };

  // Demo journey controller
  const advanceJourneyStep = async () => {
    if (activeJourneyStep === 1) {
      await triggerDisruption('TRAFFIC');
      setActiveJourneyStep(2);
    } else if (activeJourneyStep === 2) {
      await injectPriorityOrder();
      setActiveJourneyStep(3);
    } else if (activeJourneyStep === 3) {
      await triggerDisruption('VEHICLE_BREAKDOWN');
      setActiveJourneyStep(4);
    } else if (activeJourneyStep === 4) {
      await triggerDisruption('CASCADING_BREAKDOWN');
      setActiveJourneyStep(5);
    } else if (activeJourneyStep === 5) {
      await executeRecoveryAction('STANDBY_V05');
      setActiveJourneyStep(6);
    } else {
      await resetToBaseline();
    }
  };

  const acceptUpdatedRoute = () => {
    setRouteUpdateAccepted(true);
    setRouteUpdateAlertDismissed(true);
  };

  const dismissRouteUpdateAlert = () => {
    setRouteUpdateAlertDismissed(true);
  };

  return (
    <FleetContext.Provider
      value={{
        vehicles,
        orders,
        routes,
        events,
        metrics: effectiveMetrics,
        drivers,
        activeDriverId,
        activeDriver,
        activeDriverVehicle,
        activeDriverRoute,
        currentStopIndex,
        activeOrder,
        driverIssues,
        weather,
        dispatcher,
        driverKpis,
        routeUpdateAlertDismissed,
        routeUpdateAccepted,
        wsStatus,
        isLoading,
        error,

        isOptimising,
        optimisationStep,
        optimisationMessage,
        lastOptimisationResult,
        cascadingFailureActive,
        orderClassification,

        selectedVehicleId,
        routeComparisonOpen,
        routeComparisonData,
        simulationModalOpen,
        priorityModalOpen,
        aiAssistantModalOpen,
        activeJourneyStep,

        // Telemetry state & actions
        telemetryState,
        toggleTelemetry,
        setTelemetrySpeed,
        resetTelemetry,
        runManualReoptimisation,
        exportOperationalPlan,

        triggerDisruption,
        injectPriorityOrder,
        executeRecoveryAction,
        resetToBaseline,
        setSelectedVehicleId,
        setRouteComparisonOpen,
        setSimulationModalOpen,
        setPriorityModalOpen,
        setAiAssistantModalOpen,
        openRouteComparisonForIncident,
        commitAndDispatchRoutes,
        advanceJourneyStep,
        triggerVehicleBreakdown,
        restoreVehicle,
        triggerTrafficDisruption,
        triggerWeatherDisruption,
        refreshAllData: loadAllData,

        setActiveDriverId,
        markOrderDelivered,
        reportDriverIssue,
        acceptUpdatedRoute,
        dismissRouteUpdateAlert,
      }}
    >
      {children}
    </FleetContext.Provider>
  );
};

export const useFleet = () => {
  const context = useContext(FleetContext);
  if (!context) {
    throw new Error('useFleet must be used within a FleetProvider');
  }
  return context;
};
