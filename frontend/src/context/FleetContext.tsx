import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
import { initialDrivers, mockDispatcher, initialIssues } from '../data/mockDrivers';
import { initialWeather } from '../data/mockWeather';
import { urgentOrderP101 } from '../data/mockOrders';

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
  advanceJourneyStep: () => Promise<void>;
  triggerVehicleBreakdown: (vehicleId: string) => Promise<void>;
  restoreVehicle: (vehicleId: string) => Promise<void>;
  triggerTrafficDisruption: (corridor?: string) => Promise<void>;
  triggerWeatherDisruption: () => Promise<void>;

  // Driver Console Actions
  setActiveDriverId: (driverId: string) => void;
  markOrderDelivered: (orderId: string) => Promise<void>;
  reportDriverIssue: (issue: { type: IssueType; severity: IssueSeverity; description: string }) => Promise<void>;
  acceptUpdatedRoute: () => void;
  dismissRouteUpdateAlert: () => void;
}

const FleetContext = createContext<FleetContextType | undefined>(undefined);

export const FleetProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [events, setEvents] = useState<DisruptionEvent[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>(initialDrivers);
  const [activeDriverId, setActiveDriverId] = useState<string>('D01');
  const [driverIssues, setDriverIssues] = useState<DriverIssue[]>(initialIssues);
  const [weather, setWeather] = useState<WeatherData>(initialWeather);
  const [dispatcher] = useState<DispatcherContact>(mockDispatcher);

  const [routeUpdateAlertDismissed, setRouteUpdateAlertDismissed] = useState<boolean>(false);
  const [routeUpdateAccepted, setRouteUpdateAccepted] = useState<boolean>(false);

  const [metrics, setMetrics] = useState<DashboardMetrics>({
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

  const [isOptimising, setIsOptimising] = useState<boolean>(false);
  const [optimisationStep, setOptimisationStep] = useState<number>(0);
  const [optimisationMessage, setOptimisationMessage] = useState<string>('');
  const [lastOptimisationResult, setLastOptimisationResult] = useState<{
    ordersReassigned: number;
    delayAvoidedMin: number;
    marginalPathKm: number;
    slaViolations: number;
  } | null>({
    ordersReassigned: 3,
    delayAvoidedMin: 42,
    marginalPathKm: 4.2,
    slaViolations: 0,
  });

  const [cascadingFailureActive, setCascadingFailureActive] = useState<boolean>(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [routeComparisonOpen, setRouteComparisonOpen] = useState<boolean>(false);
  const [routeComparisonData, setRouteComparisonData] = useState<RouteComparisonState | null>(null);
  const [simulationModalOpen, setSimulationModalOpen] = useState<boolean>(false);
  const [priorityModalOpen, setPriorityModalOpen] = useState<boolean>(false);
  const [aiAssistantModalOpen, setAiAssistantModalOpen] = useState<boolean>(false);
  const [activeJourneyStep, setActiveJourneyStep] = useState<number>(1);

  // Load initial data
  useEffect(() => {
    async function load() {
      const [v, o, r, e, m] = await Promise.all([
        api.getFleet(),
        api.getOrders(),
        api.getRoutes(),
        api.getEvents(),
        api.getDashboardMetrics(),
      ]);
      setVehicles(v);
      setOrders(o);
      setRoutes(r);
      setEvents(e);
      setMetrics(m);
    }
    load();
  }, []);

  // Reactive calculations for the active driver
  const activeDriver = drivers.find((d) => d.id === activeDriverId) || drivers[0];
  const activeDriverVehicle = vehicles.find((v) => v.id === activeDriver?.vehicleId);
  const activeDriverRoute = routes.find((r) => r.vehicleId === activeDriver?.vehicleId);

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
    : orders.find(
        (o) => o.assignedVehicleId === activeDriver?.vehicleId && o.slaStatus !== 'DELIVERED'
      ) || orders[0];

  // Dynamic Driver KPIs
  const totalStops = activeDriverRoute ? activeDriverRoute.stops.length : 8;
  const completedStops = activeDriverRoute
    ? activeDriverRoute.stops.filter((s) => s.completed).length
    : 6;
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
    totalDistanceTodayKm: activeDriverRoute?.totalDistanceKm || 48.7,
    estimatedTotalDistanceKm: Number((activeDriverRoute?.totalDistanceKm ? activeDriverRoute.totalDistanceKm * 2.2 : 112.0).toFixed(1)),
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

  // Helper to run solver progression animation
  const runSolverSimulation = async (callback: () => void) => {
    setIsOptimising(true);
    setOptimisationStep(1);
    setOptimisationMessage('Ingesting disruption signal & filtering affected spatial neighborhoods...');
    await new Promise((r) => setTimeout(r, 400));

    setOptimisationStep(2);
    setOptimisationMessage('Evaluating vehicle payload capacities & dynamic SLA windows...');
    await new Promise((r) => setTimeout(r, 400));

    setOptimisationStep(3);
    setOptimisationMessage('Solving deterministic VRP with OR-Tools constraint matrix...');
    await new Promise((r) => setTimeout(r, 450));

    setOptimisationStep(4);
    setOptimisationMessage('Broadcasting updated waypoint schedules to active driver terminals...');
    await new Promise((r) => setTimeout(r, 300));

    callback();
    setIsOptimising(false);
  };

  // MARK ORDER DELIVERED (Driver Action -> Updates Manager & Driver)
  const markOrderDelivered = async (orderId: string) => {
    // 1. Update orders
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, slaStatus: 'DELIVERED' } : o))
    );

    // 2. Mark stop completed in driver's route
    setRoutes((prev) =>
      prev.map((r) => {
        const stopIndex = r.stops.findIndex((s) => s.orderId === orderId);
        if (stopIndex !== -1) {
          const updatedStops = [...r.stops];
          updatedStops[stopIndex] = { ...updatedStops[stopIndex], completed: true };
          return {
            ...r,
            stops: updatedStops,
          };
        }
        return r;
      })
    );

    // 3. Add delivery event to shared events feed
    const deliveryEvent: DisruptionEvent = {
      id: `EV-DELIV-${Date.now().toString().slice(-4)}`,
      type: 'URGENT_ORDER',
      title: `Delivered Order ${orderId}`,
      description: `Consignment delivered successfully by ${activeDriver?.name || 'Driver'} (${activeDriver?.vehicleId}).`,
      location: activeOrder?.address || 'Jaipur Destination',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      severity: 'INFO',
      affectedVehicleIds: [activeDriver?.vehicleId || 'V01'],
      affectedOrderIds: [orderId],
      impactDelayMinutes: 0,
      impactCostInr: 0,
      resolved: true,
      reoptimisationTriggered: false,
    };
    setEvents((prev) => [deliveryEvent, ...prev]);

    // 4. Update metrics
    setMetrics((m) => ({
      ...m,
      pendingPickupCount: Math.max(0, m.pendingPickupCount - 1),
      onTimeSlaPct: Math.min(100, Number((m.onTimeSlaPct + 0.3).toFixed(1))),
    }));
  };

  // REPORT DRIVER ISSUE (Driver Action -> Updates Manager & Driver)
  const reportDriverIssue = async (issueData: {
    type: IssueType;
    severity: IssueSeverity;
    description: string;
  }) => {
    const newIssue: DriverIssue = {
      id: `ISSUE-${Date.now().toString().slice(-4)}`,
      driverId: activeDriver?.id || 'D01',
      driverName: activeDriver?.name || 'Rajesh Kumar',
      vehicleId: activeDriver?.vehicleId || 'V01',
      type: issueData.type,
      severity: issueData.severity,
      description: issueData.description,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'OPEN',
    };
    setDriverIssues((prev) => [newIssue, ...prev]);

    const issueEvent: DisruptionEvent = {
      id: `EV-ISSUE-${Date.now().toString().slice(-4)}`,
      type: issueData.type === 'Vehicle Issue' ? 'VEHICLE_BREAKDOWN' : 'ROAD_CLOSURE',
      title: `Driver Issue: ${issueData.type} (${issueData.severity})`,
      description: `${activeDriver?.name || 'Pilot'} (${activeDriver?.vehicleId}): ${issueData.description}`,
      location: activeOrder?.address || 'Jaipur Corridor',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      severity:
        issueData.severity === 'Critical'
          ? 'CRITICAL'
          : issueData.severity === 'High'
          ? 'WARNING'
          : 'INFO',
      affectedVehicleIds: [activeDriver?.vehicleId || 'V01'],
      affectedOrderIds: activeOrder ? [activeOrder.id] : [],
      impactDelayMinutes: issueData.severity === 'Critical' ? 25 : 10,
      impactCostInr: 0,
      resolved: false,
      reoptimisationTriggered: true,
    };
    setEvents((prev) => [issueEvent, ...prev]);
  };

  // Vehicle Breakdown (Manager Action -> Updates Driver & Manager)
  const triggerVehicleBreakdown = async (vehicleId: string) => {
    await runSolverSimulation(() => {
      setVehicles((prev) =>
        prev.map((v) =>
          v.id === vehicleId ? { ...v, status: 'BROKEN_DOWN', currentSpeedKmh: 0 } : v
        )
      );

      // Reassignment logic: if vehicle is V03 or V02, reassign orders to V01 & V04
      if (vehicleId === 'V03' || vehicleId === 'V02') {
        const donorId = vehicleId;
        setOrders((prev) =>
          prev.map((o) => {
            if (o.assignedVehicleId === donorId) {
              return {
                ...o,
                assignedVehicleId: 'V01',
                reassigned: true,
                originalVehicleId: donorId,
                slaStatus: 'ON_TIME',
              };
            }
            return o;
          })
        );

        setRoutes((prev) =>
          prev.map((r) => {
            if (r.vehicleId === donorId) {
              return { ...r, status: 'DISRUPTED' };
            }
            if (r.vehicleId === 'V01') {
              return {
                ...r,
                status: 'REOPTIMISED',
                totalDistanceKm: Number((r.totalDistanceKm + 4.2).toFixed(1)),
                totalDurationMinutes: r.totalDurationMinutes + 20,
                updatedReason: `Absorbed orders from stalled unit ${donorId}`,
                stops: [
                  ...r.stops,
                  {
                    stopNumber: r.stops.length + 1,
                    orderId: '#1008',
                    name: 'Apex Healthcare',
                    address: 'C-Scheme Sector 4',
                    lat: 26.9112,
                    lng: 75.8011,
                    eta: '12:15 PM',
                    completed: false,
                    absorbedFromVehicleId: donorId,
                    isPriority: true,
                  },
                  {
                    stopNumber: r.stops.length + 2,
                    orderId: '#1012',
                    name: 'Raj Cold Storage',
                    address: 'Bais Godam',
                    lat: 26.9038,
                    lng: 75.7915,
                    eta: '12:45 PM',
                    completed: false,
                    absorbedFromVehicleId: donorId,
                  },
                ],
              };
            }
            return r;
          })
        );
      }

      setMetrics((m) => ({
        ...m,
        disruptedVehiclesCount: m.disruptedVehiclesCount + 1,
        activeVehiclesCount: Math.max(1, m.activeVehiclesCount - 1),
        reoptimisationsCount: m.reoptimisationsCount + 1,
      }));

      const breakdownEvent: DisruptionEvent = {
        id: `EV-BRK-${Date.now().toString().slice(-4)}`,
        type: 'VEHICLE_BREAKDOWN',
        title: `Mechanical Breakdown on Vehicle ${vehicleId}`,
        description: `Transmission stall detected; automatic solver re-distributed consignments to V01.`,
        location: 'C-Scheme, Jaipur',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        severity: 'CRITICAL',
        affectedVehicleIds: [vehicleId, 'V01'],
        affectedOrderIds: ['#1008', '#1012'],
        impactDelayMinutes: 42,
        impactCostInr: 420,
        resolved: false,
        reoptimisationTriggered: true,
      };
      setEvents((prev) => [breakdownEvent, ...prev]);

      // Show alert on driver console
      setRouteUpdateAlertDismissed(false);
      setRouteUpdateAccepted(false);
      openRouteComparisonForIncident('VEHICLE_BREAKDOWN');
    });
  };

  // Restore Vehicle
  const restoreVehicle = async (vehicleId: string) => {
    setVehicles((prev) =>
      prev.map((v) => (v.id === vehicleId ? { ...v, status: 'AVAILABLE', currentSpeedKmh: 35 } : v))
    );
    setMetrics((m) => ({
      ...m,
      disruptedVehiclesCount: Math.max(0, m.disruptedVehiclesCount - 1),
      activeVehiclesCount: m.activeVehiclesCount + 1,
    }));
  };

  // Trigger Traffic Disruption
  const triggerTrafficDisruption = async (corridor: string = 'Tonk Road') => {
    await runSolverSimulation(() => {
      setRoutes((prev) =>
        prev.map((r) =>
          r.vehicleId === 'V01' || r.vehicleId === 'V04'
            ? {
                ...r,
                status: 'REOPTIMISED',
                totalDurationMinutes: r.totalDurationMinutes - 6,
                updatedReason: `Rerouted via Gopalpura Bypass around ${corridor} jam`,
              }
            : r
        )
      );

      const trafficEvent: DisruptionEvent = {
        id: `EV-TRF-${Date.now().toString().slice(-4)}`,
        type: 'TRAFFIC',
        title: `Heavy Traffic Congestion on ${corridor}`,
        description: `Sensors logged 8 km/h speeds. Rerouted via Gopalpura / MI Road to avoid 26 min delay.`,
        location: `${corridor}, Jaipur`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        severity: 'WARNING',
        affectedVehicleIds: ['V01', 'V04'],
        affectedOrderIds: ['#1008', '#1009'],
        impactDelayMinutes: 14,
        impactCostInr: 65,
        resolved: false,
        reoptimisationTriggered: true,
      };
      setEvents((prev) => [trafficEvent, ...prev]);

      setRouteUpdateAlertDismissed(false);
      setRouteUpdateAccepted(false);
    });
  };

  // Trigger Weather Disruption
  const triggerWeatherDisruption = async () => {
    await runSolverSimulation(() => {
      const newWeather: WeatherData = {
        temperatureC: 22,
        condition: 'Sudden Monsoon Downpour • Speed -35%',
        impact: 'Wet tarmac braking limits applied. Speed caps active across outer Jaipur corridors.',
        location: 'Jaipur',
        updatedAt: 'Just now',
      };
      setWeather(newWeather);

      const weatherEvent: DisruptionEvent = {
        id: `EV-WTH-${Date.now().toString().slice(-4)}`,
        type: 'WEATHER',
        title: 'Monsoon Flash Downpour in Jaipur',
        description: 'Heavy precipitation reduced corridor speeds. Delivery windows extended +15m for safety.',
        location: 'Jaipur Metropolitan',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        severity: 'WARNING',
        affectedVehicleIds: ['V01', 'V02', 'V03', 'V04'],
        affectedOrderIds: [],
        impactDelayMinutes: 20,
        impactCostInr: 110,
        resolved: false,
        reoptimisationTriggered: true,
      };
      setEvents((prev) => [weatherEvent, ...prev]);
    });
  };

  // Trigger Disruption wrapper
  const triggerDisruption = async (type: DisruptionType) => {
    if (type === 'TRAFFIC') {
      await triggerTrafficDisruption('Tonk Road');
    } else if (type === 'WEATHER') {
      await triggerWeatherDisruption();
    } else if (type === 'URGENT_ORDER') {
      await injectPriorityOrder(urgentOrderP101);
    } else if (type === 'VEHICLE_BREAKDOWN') {
      await triggerVehicleBreakdown('V03');
    } else if (type === 'CASCADING_BREAKDOWN') {
      // Break V01 as secondary breakdown
      await runSolverSimulation(() => {
        setVehicles((prev) =>
          prev.map((v) =>
            v.id === 'V01' || v.id === 'V03' ? { ...v, status: 'BROKEN_DOWN', currentSpeedKmh: 0 } : v
          )
        );
        setCascadingFailureActive(true);
        setOrders((prev) =>
          prev.map((o, idx) => {
            if (idx === 12 || idx === 13 || idx === 14) {
              return { ...o, slaStatus: 'UNSERVICEABLE', notes: 'No vehicle capacity available within time window' };
            }
            if (idx === 7 || idx === 8 || idx === 9 || idx === 10) {
              return { ...o, slaStatus: 'LATE', eta: 'Delayed +45m' };
            }
            return o;
          })
        );
        setMetrics((m) => ({
          ...m,
          activeVehiclesCount: 2,
          disruptedVehiclesCount: 2,
          lateOrdersCount: 4,
          onTimeSlaPct: 72.0,
          reoptimisationsCount: m.reoptimisationsCount + 1,
        }));
      });
    }
  };

  // Inject Priority Order P-101
  const injectPriorityOrder = async (orderToInject: Order = urgentOrderP101) => {
    await runSolverSimulation(() => {
      setOrders((prev) => {
        if (prev.some((o) => o.id === orderToInject.id)) return prev;
        return [orderToInject, ...prev];
      });

      // Insert into V01 (Rajesh Kumar's route) if cold chain or V04
      const targetVehicle = 'V01';
      setRoutes((prev) =>
        prev.map((r) => {
          if (r.vehicleId === targetVehicle) {
            return {
              ...r,
              status: 'REOPTIMISED',
              totalDistanceKm: Number((r.totalDistanceKm + 2.8).toFixed(1)),
              estimatedCostInr: r.estimatedCostInr + 140,
              updatedReason: 'Dynamically injected critical order P-101',
              stops: [
                r.stops[0],
                {
                  stopNumber: 2,
                  orderId: orderToInject.id,
                  name: orderToInject.consignee,
                  address: orderToInject.address,
                  lat: orderToInject.lat,
                  lng: orderToInject.lng,
                  eta: orderToInject.eta,
                  completed: false,
                  isPriority: true,
                },
                ...r.stops.slice(1).map((s, i) => ({ ...s, stopNumber: i + 3 })),
              ],
            };
          }
          return r;
        })
      );

      setVehicles((prev) =>
        prev.map((v) =>
          v.id === targetVehicle ? { ...v, currentLoadKg: v.currentLoadKg + orderToInject.weightKg } : v
        )
      );

      setMetrics((m) => ({
        ...m,
        totalOrdersCount: m.totalOrdersCount + 1,
        totalOperatingCostInr: m.totalOperatingCostInr + 140,
        reoptimisationsCount: m.reoptimisationsCount + 1,
      }));

      const urgentEvent: DisruptionEvent = {
        id: `EV-URG-${Date.now().toString().slice(-4)}`,
        type: 'URGENT_ORDER',
        title: `Critical Medicine Consignment Injected (${orderToInject.id})`,
        description: `Assigned to ${targetVehicle} without violating cold chain constraints.`,
        location: orderToInject.address,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        severity: 'CRITICAL',
        affectedVehicleIds: [targetVehicle],
        affectedOrderIds: [orderToInject.id],
        impactDelayMinutes: 18,
        impactCostInr: 140,
        resolved: true,
        reoptimisationTriggered: true,
      };
      setEvents((prev) => [urgentEvent, ...prev]);

      setRouteUpdateAlertDismissed(false);
      setRouteUpdateAccepted(false);
    });
  };

  // Execute Cascading Failure Recovery Action
  const executeRecoveryAction = async (
    actionType: 'STANDBY_V05' | 'OUTSOURCE' | 'DEFER' | 'OVERTIME'
  ) => {
    await runSolverSimulation(() => {
      if (actionType === 'STANDBY_V05') {
        setVehicles((prev) =>
          prev.map((v) =>
            v.id === 'V05'
              ? {
                  ...v,
                  status: 'ON_ROUTE',
                  currentZone: 'Sitapura → Central Recovery Corridor',
                  currentSpeedKmh: 45,
                  currentLoadKg: 850,
                }
              : v
          )
        );
        setOrders((prev) =>
          prev.map((o) =>
            o.slaStatus === 'UNSERVICEABLE' || o.slaStatus === 'LATE'
              ? {
                  ...o,
                  slaStatus: 'ON_TIME',
                  assignedVehicleId: 'V05',
                  notes: 'Serviced by deployed Standby V05',
                }
              : o
          )
        );
        setCascadingFailureActive(false);
        setMetrics((m) => ({
          ...m,
          activeVehiclesCount: 3,
          lateOrdersCount: 0,
          onTimeSlaPct: 98.2,
          totalOperatingCostInr: m.totalOperatingCostInr + 340,
          reoptimisationsCount: m.reoptimisationsCount + 1,
        }));
      } else if (actionType === 'OUTSOURCE') {
        setOrders((prev) =>
          prev.map((o) =>
            o.slaStatus === 'UNSERVICEABLE'
              ? { ...o, slaStatus: 'ON_TIME', notes: 'Outsourced to partner carrier 3PL' }
              : o
          )
        );
        setCascadingFailureActive(false);
        setMetrics((m) => ({
          ...m,
          totalOperatingCostInr: m.totalOperatingCostInr + 750,
          onTimeSlaPct: 92.0,
        }));
      }
    });
  };

  // Reset to Baseline State
  const resetToBaseline = async () => {
    const [v, o, r, e, m] = await Promise.all([
      api.getFleet(),
      api.getOrders(),
      api.getRoutes(),
      api.getEvents(),
      api.getDashboardMetrics(),
    ]);
    setVehicles(v);
    setOrders(o);
    setRoutes(r);
    setEvents(e);
    setMetrics(m);
    setWeather(initialWeather);
    setDrivers(initialDrivers);
    setCascadingFailureActive(false);
    setSelectedVehicleId(null);
    setActiveJourneyStep(1);
    setLastOptimisationResult(null);
    setRouteUpdateAlertDismissed(false);
    setRouteUpdateAccepted(false);
  };

  // Open Route Comparison Drawer with contextual data
  const openRouteComparisonForIncident = (incidentType?: string) => {
    if (incidentType === 'TRAFFIC') {
      setRouteComparisonData({
        vehicleId: 'V01 & V04',
        incidentTitle: 'Route Update — Tonk Road Congestion',
        reason: 'Avoided Calgiri Marg choke-point by re-routing via Apex Circle and Jawahar Ring.',
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
        vehicleId: 'V01 & V04',
        incidentTitle: 'Route Update — V03 Breakdown Disruption',
        reason: 'V01 was selected for Orders #1008 & #1012 because it has refrigeration spec, had 340kg remaining capacity, and 2.4h shift window remaining.',
        originalRoute: {
          sequence: ['V03: C-Scheme', 'Stop #1008', 'Stop #1012', 'Stop #1016 (Stalled)'],
          distanceKm: 18.2,
          durationMin: 110,
          costInr: 2480,
          slaBreaches: 3,
        },
        optimisedRoute: {
          sequence: ['V01: + #1008 (Civil Lines) & #1012 (Bais Godam)', 'V04: + #1016 (Jacob Rd)'],
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

  // Step-by-step hackathon demo journey controller
  const advanceJourneyStep = async () => {
    if (activeJourneyStep === 1) {
      await triggerDisruption('TRAFFIC');
      setActiveJourneyStep(2);
    } else if (activeJourneyStep === 2) {
      await injectPriorityOrder(urgentOrderP101);
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
        metrics,
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
        advanceJourneyStep,
        triggerVehicleBreakdown,
        restoreVehicle,
        triggerTrafficDisruption,
        triggerWeatherDisruption,
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
