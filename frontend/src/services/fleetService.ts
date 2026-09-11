import { Vehicle } from '../types/fleet';
import { Order } from '../types/order';
import { Route } from '../types/route';
import { DisruptionEvent } from '../types/event';
import { Driver, DriverIssue, WeatherData, DispatcherContact, DriverKpis } from '../types/driver';
import { api } from './api';
import { routeApi } from '../api/routeApi';
import { vehicleApi } from '../api/vehicleApi';
import { eventApi } from '../api/eventApi';
import { orderApi } from '../api/orderApi';

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

class BackendFleetService implements FleetServiceInterface {
  async getVehicles(): Promise<Vehicle[]> {
    return api.getFleet();
  }

  async getDrivers(): Promise<Driver[]> {
    return api.getDrivers();
  }

  async getOrders(): Promise<Order[]> {
    return api.getOrders();
  }

  async getRoutes(): Promise<Route[]> {
    return api.getRoutes();
  }

  async getEvents(): Promise<DisruptionEvent[]> {
    return api.getEvents();
  }

  async getWeather(): Promise<WeatherData> {
    return api.getWeather();
  }

  async getDispatcher(): Promise<DispatcherContact> {
    return {
      name: 'Jaipur Central Dispatch',
      role: 'Head of Operations (Jaipur Hub)',
      hub: 'Jaipur Central Logistics Hub, Transport Nagar',
      phone: '+91-9829011111',
      radioChannel: 'Channel 4 (Jaipur Fleet)',
      status: 'ONLINE',
    };
  }

  async getDriverIssues(): Promise<DriverIssue[]> {
    const events = await eventApi.listEvents({ type: 'OTHER' });
    return events.map((e) => ({
      id: e.id,
      driverId: e.event_metadata?.driver_id || 'D01',
      driverName: e.event_metadata?.driver_name || 'Rajesh Sharma',
      vehicleId: e.vehicle_id || 'V01',
      type: (e.event_metadata?.issue_type as any) || 'Vehicle Issue',
      severity: (e.severity as any) || 'Medium',
      description: e.description,
      timestamp: new Date(e.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: e.status === 'RESOLVED' ? 'RESOLVED' : 'OPEN',
    }));
  }

  async getDriverRoute(driverId: string): Promise<Route | undefined> {
    const [drivers, routes] = await Promise.all([api.getDrivers(), api.getRoutes()]);
    const driver = drivers.find((d) => d.id === driverId);
    if (!driver) return routes[0];
    return routes.find((r) => r.vehicleId === driver.vehicleId) || routes[0];
  }

  async getActiveOrder(driverId: string): Promise<Order | undefined> {
    const route = await this.getDriverRoute(driverId);
    if (!route) return undefined;
    const currentStop = route.stops.find((s) => !s.completed);
    if (!currentStop || !currentStop.orderId) return undefined;
    const orders = await api.getOrders();
    return orders.find((o) => o.id === currentStop.orderId);
  }

  async getDriverKpis(driverId: string): Promise<DriverKpis> {
    const [route, weather] = await Promise.all([
      this.getDriverRoute(driverId),
      this.getWeather(),
    ]);
    const total = route?.stops.length || 0;
    const completed = route?.stops.filter((s) => s.completed).length || 0;
    const remaining = total - completed;

    return {
      completedDeliveries: completed,
      totalDeliveries: total,
      remainingDeliveries: remaining,
      totalDistanceTodayKm: route?.totalDistanceKm || 48.7,
      estimatedTotalDistanceKm: Number(((route?.totalDistanceKm || 48.7) * 2.2).toFixed(1)),
      estimatedCompletionTime: route?.stops.find((s) => !s.completed)?.eta || '04:30 PM',
      onTrackStatus: 'On Track',
      vehicleStatus: 'Healthy',
      weather,
    };
  }

  async markOrderDelivered(orderId: string): Promise<{ success: boolean; orderId: string; nextOrderId?: string }> {
    // Find stop corresponding to order
    const backendRoutes = await routeApi.listRoutes();
    for (const r of backendRoutes) {
      const stop = (r.stops || []).find((s) => s.order_id === orderId || (s as any).external_order_id === orderId);
      if (stop) {
        await routeApi.updateStopStatus(stop.id, { status: 'COMPLETED' });
        return { success: true, orderId };
      }
    }
    // If not found in stops, update order status directly
    await orderApi.updateOrder(orderId, { status: 'DELIVERED' });
    return { success: true, orderId };
  }

  async reportIssue(issue: Omit<DriverIssue, 'id' | 'timestamp' | 'status'>): Promise<DriverIssue> {
    const created = await eventApi.createEvent({
      type: 'OTHER',
      title: `Driver Report: ${issue.type} (${issue.driverName})`,
      description: issue.description,
      vehicle_id: issue.vehicleId,
      metadata: {
        driver_id: issue.driverId,
        driver_name: issue.driverName,
        issue_type: issue.type,
      },
    });

    return {
      ...issue,
      id: created.id,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'OPEN',
    };
  }

  async triggerVehicleBreakdown(vehicleId: string): Promise<{ vehicleId: string; status: string }> {
    await vehicleApi.triggerBreakdown(vehicleId, 'Mechanical alternator failure near C-Scheme');
    return { vehicleId, status: 'BROKEN_DOWN' };
  }

  async triggerTrafficEvent(corridor: string): Promise<DisruptionEvent> {
    const res = await api.triggerEvent('TRAFFIC', { title: `Traffic Congestion on ${corridor}` });
    return res.event;
  }

  async triggerWeatherEvent(condition: string, tempC: number): Promise<WeatherData> {
    await eventApi.simulateEvent({
      type: 'WEATHER',
      title: `Weather Alert: ${condition}`,
      delay_factor: 1.4,
    });
    return {
      temperatureC: tempC,
      condition,
      impact: 'Wet surface speed caps applied to Jaipur corridors',
      location: 'Jaipur',
      updatedAt: 'Just now',
    };
  }

  async addUrgentOrder(order?: Order): Promise<Order> {
    const created = await orderApi.createOrder({
      external_order_id: order?.id || `ORD-${Date.now().toString().slice(-4)}`,
      customer_name: order?.consignee || 'Emergency Medical Consignee',
      customer_phone: '+91-9829011188',
      delivery_lat: order?.lat || 26.852,
      delivery_lng: order?.lng || 75.805,
      delivery_address: order?.address || 'Fortis Escorts Hospital, Malviya Nagar',
      weight_kg: order?.weightKg || 25.0,
      priority: 'CRITICAL',
      window_start: order?.timeWindowStart || '10:00',
      window_end: order?.timeWindowEnd || '13:00',
    });
    return {
      id: created.external_order_id,
      consignee: created.customer_name,
      address: created.delivery_address,
      zone: 'Jaipur',
      pincode: '302001',
      lat: created.delivery_lat,
      lng: created.delivery_lng,
      weightKg: created.weight_kg,
      priority: 'CRITICAL',
      loadType: 'GENERAL',
      timeWindowStart: created.window_start,
      timeWindowEnd: created.window_end,
      eta: '11:15 AM',
      slaStatus: 'ON_TIME',
      slaBufferMinutes: 15,
      assignedVehicleId: '',
    };
  }
}

export const fleetService: FleetServiceInterface = new BackendFleetService();
