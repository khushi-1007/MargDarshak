/**
 * MargDarshak High-Fidelity Real-Time Fleet Telemetry & GPS Simulator Engine.
 * 
 * Drives simulated vehicles along real Jaipur GIS waypoints with realistic:
 * - Velocity & smooth interpolation (35-48 km/h with micro-fluctuations)
 * - Bearing / heading angle calculations
 * - Stop arrival detection & dwell time simulation (unloading package)
 * - Dynamic ETA & distance-to-next-stop countdowns
 * - Multi-speed playback (1x, 2x, 5x) and Pause/Play toggles
 */

import { Route, RouteStop } from '../types/route';
import { Vehicle } from '../types/fleet';

export interface VehicleTelemetry {
  vehicleId: string;
  licensePlate: string;
  status: 'IN_TRANSIT' | 'AT_STOP' | 'BROKEN_DOWN' | 'IDLE';
  currentLat: number;
  currentLng: number;
  headingDegrees: number;
  speedKmh: number;
  currentStopIndex: number;
  nextStopName: string;
  distanceToNextStopMeters: number;
  etaMinutesToNextStop: number;
  isDelivering: boolean;
  completedStopsCount: number;
  totalStopsCount: number;
}

export interface FleetTelemetryState {
  isPlaying: boolean;
  speedMultiplier: 1 | 2 | 5;
  activeVehiclesCount: number;
  vehicles: Map<string, VehicleTelemetry>;
  timestamp: number;
}

type TelemetryListener = (state: FleetTelemetryState) => void;

// Helper: Haversine distance in meters
function haversineDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // metres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Helper: Calculate bearing in degrees from point A to point B
function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const y = Math.sin(((lon2 - lon1) * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.cos(((lon2 - lon1) * Math.PI) / 180);
  const θ = Math.atan2(y, x);
  return (θ * 180) / Math.PI + 360 % 360;
}

interface VehicleProgressState {
  segmentIndex: number; // which waypoint pair we're travelling between
  segmentProgress: number; // 0.0 to 1.0 along current segment
  currentSpeedKmh: number;
  dwellSecondsRemaining: number;
  currentStopIndex: number;
  completedStopIndices: Set<number>;
}

class TelemetryEngine {
  private isPlaying = true;
  private speedMultiplier: 1 | 2 | 5 = 1;
  private intervalId: any = null;
  private listeners: Set<TelemetryListener> = new Set();
  
  private routes: Route[] = [];
  private vehicles: Vehicle[] = [];
  private progressMap: Map<string, VehicleProgressState> = new Map();
  private latestState: FleetTelemetryState = {
    isPlaying: true,
    speedMultiplier: 1,
    activeVehiclesCount: 0,
    vehicles: new Map(),
    timestamp: Date.now(),
  };

  constructor() {
    this.startLoop();
  }

  public updateFleetAndRoutes(vehicles: Vehicle[], routes: Route[]) {
    this.vehicles = vehicles;
    this.routes = routes;

    // Initialize progress for any new vehicles
    vehicles.forEach((v, idx) => {
      if (!this.progressMap.has(v.id)) {
        // Offset starting segment progress slightly so vehicles don't clump
        const staggeredStart = (idx * 0.15) % 0.8;
        this.progressMap.set(v.id, {
          segmentIndex: 0,
          segmentProgress: staggeredStart,
          currentSpeedKmh: 38 + Math.floor(Math.random() * 8),
          dwellSecondsRemaining: 0,
          currentStopIndex: 0,
          completedStopIndices: new Set(),
        });
      }
    });

    this.tick();
  }

  public togglePlay() {
    this.isPlaying = !this.isPlaying;
    this.latestState.isPlaying = this.isPlaying;
    this.notify();
  }

  public setPlaying(play: boolean) {
    this.isPlaying = play;
    this.latestState.isPlaying = this.isPlaying;
    this.notify();
  }

  public setSpeedMultiplier(mult: 1 | 2 | 5) {
    this.speedMultiplier = mult;
    this.latestState.speedMultiplier = mult;
    this.notify();
  }

  public resetPositions() {
    this.progressMap.forEach((val, key) => {
      val.segmentIndex = 0;
      val.segmentProgress = 0;
      val.dwellSecondsRemaining = 0;
      val.currentStopIndex = 0;
      val.completedStopIndices.clear();
    });
    this.tick();
  }

  public subscribe(listener: TelemetryListener): () => void {
    this.listeners.add(listener);
    listener(this.latestState);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getLatestState(): FleetTelemetryState {
    return this.latestState;
  }

  public getVehicleTelemetry(vehicleId: string): VehicleTelemetry | undefined {
    return this.latestState.vehicles.get(vehicleId);
  }

  private startLoop() {
    if (this.intervalId) clearInterval(this.intervalId);
    // 1-second simulation tick
    this.intervalId = setInterval(() => {
      if (this.isPlaying) {
        this.advanceSimulationStep(1.0);
      }
    }, 1000);
  }

  private advanceSimulationStep(deltaSeconds: number) {
    const effectiveDelta = deltaSeconds * this.speedMultiplier;

    this.vehicles.forEach((vehicle) => {
      const isBroken = vehicle.status === 'BROKEN_DOWN';
      const progress = this.progressMap.get(vehicle.id);
      if (!progress) return;

      if (isBroken) {
        progress.currentSpeedKmh = 0;
        return;
      }

      // If dwelling at a delivery stop, count down
      if (progress.dwellSecondsRemaining > 0) {
        progress.dwellSecondsRemaining -= effectiveDelta;
        progress.currentSpeedKmh = 0;
        return;
      }

      // Find route path
      const route = this.routes.find((r) => r.vehicleId === vehicle.id);
      const waypoints = this.getRouteWaypoints(route, vehicle);

      if (waypoints.length < 2) return;

      // Realistic speed fluctuation (36-46 km/h)
      const baseSpeed = 40 + (Math.sin(Date.now() / 3000 + waypoints.length) * 5);
      progress.currentSpeedKmh = Math.round(baseSpeed);

      // Distance to cover in this step: speed (km/h) / 3600 * 1000 * effectiveDelta (meters)
      const distanceCoveredMeters = (progress.currentSpeedKmh / 3.6) * effectiveDelta;

      let currentSegIdx = progress.segmentIndex;
      if (currentSegIdx >= waypoints.length - 1) {
        // Loop route or restart from depot
        currentSegIdx = 0;
        progress.segmentIndex = 0;
        progress.segmentProgress = 0;
      }

      const pA = waypoints[currentSegIdx];
      const pB = waypoints[currentSegIdx + 1] || waypoints[0];

      const segLengthMeters = Math.max(10, haversineDistanceMeters(pA[0], pA[1], pB[0], pB[1]));
      const progressFraction = distanceCoveredMeters / segLengthMeters;

      progress.segmentProgress += progressFraction;

      if (progress.segmentProgress >= 1.0) {
        // Arrived at waypoint / stop!
        progress.segmentProgress = 0;
        progress.segmentIndex = (progress.segmentIndex + 1) % (waypoints.length - 1);

        // Check if this waypoint is a customer delivery stop
        const matchedStopIndex = this.findMatchingStopIndex(route, waypoints[progress.segmentIndex]);
        if (matchedStopIndex !== -1 && !progress.completedStopIndices.has(matchedStopIndex)) {
          progress.completedStopIndices.add(matchedStopIndex);
          progress.currentStopIndex = Math.min(matchedStopIndex + 1, (route?.stops.length || 1) - 1);
          // Pause for 3.5 seconds to simulate dropoff
          progress.dwellSecondsRemaining = 3.5;
        }
      }
    });

    this.tick();
  }

  private findMatchingStopIndex(route?: Route, coord?: [number, number]): number {
    if (!route || !coord) return -1;
    return route.stops.findIndex(
      (s) => Math.abs(s.lat - coord[0]) < 0.001 && Math.abs(s.lng - coord[1]) < 0.001
    );
  }

  private getRouteWaypoints(route?: Route, vehicle?: Vehicle): [number, number][] {
    const JAIPUR_DEPOT: [number, number] = [26.9124, 75.7873];
    if (route && route.stops && route.stops.length > 0) {
      return [
        JAIPUR_DEPOT,
        ...route.stops.map((s): [number, number] => [s.lat, s.lng]),
        JAIPUR_DEPOT,
      ];
    }
    // Default circular corridor around Jaipur for fallback
    return [
      JAIPUR_DEPOT,
      [26.852, 75.805], // Jawahar Circle / Malviya Nagar
      [26.891, 75.828], // Apex Circle
      [26.906, 75.802], // Tonk Road
      [26.918, 75.795], // C-Scheme
      JAIPUR_DEPOT,
    ];
  }

  private tick() {
    const JAIPUR_DEPOT: [number, number] = [26.9124, 75.7873];
    const telemetryMap = new Map<string, VehicleTelemetry>();

    this.vehicles.forEach((v, idx) => {
      const progress = this.progressMap.get(v.id) || {
        segmentIndex: 0,
        segmentProgress: 0,
        currentSpeedKmh: 40,
        dwellSecondsRemaining: 0,
        currentStopIndex: 0,
        completedStopIndices: new Set<number>(),
      };

      const isBroken = v.status === 'BROKEN_DOWN';
      const route = this.routes.find((r) => r.vehicleId === v.id);
      const waypoints = this.getRouteWaypoints(route, v);

      const pA = waypoints[progress.segmentIndex] || JAIPUR_DEPOT;
      const pB = waypoints[progress.segmentIndex + 1] || waypoints[0];

      // Interpolate current lat & lng
      const currentLat = pA[0] + (pB[0] - pA[0]) * progress.segmentProgress;
      const currentLng = pA[1] + (pB[1] - pA[1]) * progress.segmentProgress;

      const heading = isBroken ? 0 : calculateBearing(pA[0], pA[1], pB[0], pB[1]);
      const distanceToNextStopMeters = Math.round(
        haversineDistanceMeters(currentLat, currentLng, pB[0], pB[1])
      );

      const speedKmh = isBroken ? 0 : progress.dwellSecondsRemaining > 0 ? 0 : progress.currentSpeedKmh;
      const etaMin = speedKmh > 0 ? Math.ceil((distanceToNextStopMeters / 1000 / speedKmh) * 60) : 1;

      const currentStop = route?.stops[progress.currentStopIndex];
      const nextStopName = currentStop?.name || `Stop #${progress.currentStopIndex + 1}`;

      telemetryMap.set(v.id, {
        vehicleId: v.id,
        licensePlate: v.licensePlate,
        status: isBroken
          ? 'BROKEN_DOWN'
          : progress.dwellSecondsRemaining > 0
          ? 'AT_STOP'
          : 'IN_TRANSIT',
        currentLat: Number(currentLat.toFixed(5)),
        currentLng: Number(currentLng.toFixed(5)),
        headingDegrees: Math.round(heading),
        speedKmh,
        currentStopIndex: progress.currentStopIndex,
        nextStopName,
        distanceToNextStopMeters,
        etaMinutesToNextStop: Math.max(1, etaMin),
        isDelivering: progress.dwellSecondsRemaining > 0,
        completedStopsCount: progress.completedStopIndices.size,
        totalStopsCount: route?.stops.length || 4,
      });
    });

    this.latestState = {
      isPlaying: this.isPlaying,
      speedMultiplier: this.speedMultiplier,
      activeVehiclesCount: this.vehicles.filter((v) => v.status !== 'BROKEN_DOWN').length,
      vehicles: telemetryMap,
      timestamp: Date.now(),
    };

    this.notify();
  }

  private notify() {
    this.listeners.forEach((l) => l(this.latestState));
  }
}

export const telemetryEngine = new TelemetryEngine();
