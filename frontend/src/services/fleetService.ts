import { Vehicle } from '../types/fleet';
import { Order } from '../types/order';
import { Route } from '../types/route';
import { DisruptionEvent } from '../types/event';
import { Driver, DriverIssue, WeatherData, DispatcherContact, DriverKpis } from '../types/driver';
import { initialVehicles } from '../data/mockVehicles';
import { initialOrders, urgentOrderP101 } from '../data/mockOrders';
import { initialRoutes } from '../data/mockRoutes';
import { initialDisruptionEvents as initialEvents } from '../data/mockEvents';
import { initialDrivers, mockDispatcher, initialIssues } from '../data/mockDrivers';
import { initialWeather } from '../data/mockWeather';

export interface FleetServiceInterface {
  getVehicles(): Promise<Vehicle[]>;
  getDrivers(): Promise<Driver[]>;
  getOrders(): Promise<Order[]>;
  getRoutes(): Promise<Route[]>;
  getEvents(): Promise<DisruptionEvent[]>;
  getWeather(): Promise<WeatherData>;
  getDispatcher(): Promise<DispatcherContact>;
  getDriverIssues(): Promise<DriverIssue[]>;
  getDriverRoute(driverId: string): Promise<Route | undefined>;
  getActiveOrder(driverId: string): Promise<Order | undefined>;
  getDriverKpis(driverId: string): Promise<DriverKpis>;
  markOrderDelivered(orderId: string): Promise<{ success: boolean; orderId: string; nextOrderId?: string }>;
  reportIssue(issue: Omit<DriverIssue, 'id' | 'timestamp' | 'status'>): Promise<DriverIssue>;
  triggerVehicleBreakdown(vehicleId: string): Promise<{ vehicleId: string; status: string }>;
  triggerTrafficEvent(corridor: string): Promise<DisruptionEvent>;
  triggerWeatherEvent(condition: string, tempC: number): Promise<WeatherData>;
  addUrgentOrder(order?: Order): Promise<Order>;
}

/**
 * MockFleetService implements FleetServiceInterface using realistic client-side state.
 * In a future stage with a backend, this can be swapped with a real API service
 * making fetch('/api/...') calls without touching any UI component.
 */
class MockFleetService implements FleetServiceInterface {
  async getVehicles(): Promise<Vehicle[]> {
    return [...initialVehicles];
  }

  async getDrivers(): Promise<Driver[]> {
    return [...initialDrivers];
  }

  async getOrders(): Promise<Order[]> {
    return [...initialOrders];
  }

  async getRoutes(): Promise<Route[]> {
    return [...initialRoutes];
  }

  async getEvents(): Promise<DisruptionEvent[]> {
    return [...initialEvents];
  }

  async getWeather(): Promise<WeatherData> {
    return { ...initialWeather };
  }

  async getDispatcher(): Promise<DispatcherContact> {
    return { ...mockDispatcher };
  }

  async getDriverIssues(): Promise<DriverIssue[]> {
    return [...initialIssues];
  }

  async getDriverRoute(driverId: string): Promise<Route | undefined> {
    const driver = initialDrivers.find((d) => d.id === driverId);
    if (!driver) return undefined;
    return initialRoutes.find((r) => r.vehicleId === driver.vehicleId);
  }

  async getActiveOrder(driverId: string): Promise<Order | undefined> {
    const driver = initialDrivers.find((d) => d.id === driverId);
    if (!driver) return undefined;
    const route = initialRoutes.find((r) => r.vehicleId === driver.vehicleId);
    if (!route) return undefined;
    const currentStop = route.stops.find((s) => !s.completed);
    if (!currentStop || !currentStop.orderId) return undefined;
    return initialOrders.find((o) => o.id === currentStop.orderId);
  }

  async getDriverKpis(driverId: string): Promise<DriverKpis> {
    const route = await this.getDriverRoute(driverId);
    const total = route?.stops.length || 0;
    const completed = route?.stops.filter((s) => s.completed).length || 0;
    const remaining = total - completed;

    return {
      completedDeliveries: completed,
      totalDeliveries: total,
      remainingDeliveries: remaining,
      totalDistanceTodayKm: 48.7,
      estimatedTotalDistanceKm: 112.0,
      estimatedCompletionTime: '04:30 PM',
      onTrackStatus: 'On Track',
      vehicleStatus: 'Healthy',
      weather: { ...initialWeather },
    };
  }

  async markOrderDelivered(orderId: string): Promise<{ success: boolean; orderId: string; nextOrderId?: string }> {
    return { success: true, orderId };
  }

  async reportIssue(issue: Omit<DriverIssue, 'id' | 'timestamp' | 'status'>): Promise<DriverIssue> {
    const newIssue: DriverIssue = {
      ...issue,
      id: `ISSUE-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'OPEN',
    };
    return newIssue;
  }

  async triggerVehicleBreakdown(vehicleId: string): Promise<{ vehicleId: string; status: string }> {
    return { vehicleId, status: 'BROKEN_DOWN' };
  }

  async triggerTrafficEvent(corridor: string): Promise<DisruptionEvent> {
    return {
      id: `EV-${Date.now().toString().slice(-4)}`,
      type: 'TRAFFIC',
      title: `Traffic Congestion on ${corridor}`,
      description: 'Slow speeds logged by sensors; re-routing corridor.',
      location: corridor,
      timestamp: 'Just now',
      severity: 'WARNING',
      affectedVehicleIds: ['V04'],
      affectedOrderIds: ['#1009'],
      impactDelayMinutes: 14,
      impactCostInr: 65,
      resolved: false,
      reoptimisationTriggered: true,
    };
  }

  async triggerWeatherEvent(condition: string, tempC: number): Promise<WeatherData> {
    return {
      temperatureC: tempC,
      condition,
      impact: 'Wet surface speed caps applied to Jaipur outer ring',
      location: 'Jaipur',
      updatedAt: 'Just now',
    };
  }

  async addUrgentOrder(order: Order = urgentOrderP101): Promise<Order> {
    return { ...order };
  }
}

export const fleetService: FleetServiceInterface = new MockFleetService();
