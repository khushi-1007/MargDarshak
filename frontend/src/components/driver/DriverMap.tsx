import React, { useState, useEffect, useMemo } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  Circle,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import {
  Navigation,
  Plus,
  Minus,
  Crosshair,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Compass,
  Sparkles,
} from 'lucide-react';
import { useFleet } from '../../context/FleetContext';
import { RouteStop } from '../../types/route';

const JAIPUR_DEPOT: [number, number] = [26.9124, 75.7873];

// Camera controller for centering on driver/current stop
function DriverMapController({
  center,
  zoom,
}: {
  center: [number, number];
  zoom: number;
}) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 0.8 });
  }, [center, zoom, map]);
  return null;
}

// Custom Leaflet Icons for Driver Console with Live Telemetry
const getDriverVehicleIcon = (vehicleId: string, speedKmh: number, heading = 0) => {
  return L.divIcon({
    className: 'custom-leaflet-div-icon',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer;">
        <span style="position: absolute; width: 44px; height: 44px; border-radius: 9999px; background-color: rgba(37, 99, 235, 0.35); animation: ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
        <div style="display: flex; align-items: center; justify-content: center; background-color: #0f172a; color: #38bdf8; border: 1.5px solid #38bdf8; border-radius: 6px; padding: 1px 6px; font-size: 9px; font-weight: 700; font-family: monospace; box-shadow: 0 2px 6px rgba(0,0,0,0.5); margin-bottom: 2px; z-index: 10;">
          ${vehicleId.length > 8 ? 'V01' : vehicleId} • ${speedKmh} km/h
        </div>
        <div style="width: 26px; height: 26px; border-radius: 9999px; background-color: #2563eb; color: #ffffff; display: flex; align-items: center; justify-content: center; border: 2px solid #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.4); z-index: 10;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style="transform: rotate(${heading}deg); transition: transform 0.4s ease-out;"><polygon points="12 2 19 21 12 17 5 21 12 2"/></svg>
        </div>
      </div>
    `,
    iconSize: [80, 50],
    iconAnchor: [40, 40],
    popupAnchor: [0, -38],
  });
};

const getDriverStopIcon = (
  stopNumber: number,
  isCompleted: boolean,
  isCurrent: boolean,
  isPriority: boolean
) => {
  const bg = isCompleted ? '#16a34a' : isCurrent ? '#2563eb' : '#64748b';
  const size = isCurrent ? 30 : 24;

  return L.divIcon({
    className: 'custom-leaflet-div-icon',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: ${size}px; height: ${size}px; cursor: pointer;">
        ${
          isCurrent
            ? '<span style="position: absolute; width: 40px; height: 40px; border-radius: 9999px; background-color: rgba(37, 99, 235, 0.4); animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>'
            : isPriority
            ? '<span style="position: absolute; width: 34px; height: 34px; border-radius: 9999px; background-color: rgba(245, 158, 11, 0.4); animation: ping 1.5s infinite;"></span>'
            : ''
        }
        <div style="width: ${size}px; height: ${size}px; border-radius: 9999px; background-color: ${bg}; color: white; display: flex; align-items: center; justify-content: center; font-size: ${
      isCurrent ? '12px' : '10px'
    }; font-weight: 800; border: 2px solid #ffffff; box-shadow: 0 3px 8px rgba(0,0,0,0.3); font-family: Inter, sans-serif;">
          ${isCompleted ? '✓' : stopNumber}
        </div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 4)],
  });
};

const getDriverDepotIcon = () => {
  return L.divIcon({
    className: 'custom-leaflet-div-icon',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px;">
        <div style="width: 28px; height: 28px; border-radius: 6px; background: #1e293b; color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 800; border: 2px solid #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.3); font-family: Inter, sans-serif;">
          DEP
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

export const DriverMap: React.FC = () => {
  const {
    activeDriverRoute,
    activeDriverVehicle,
    currentStopIndex,
    events,
    openRouteComparisonForIncident,
    telemetryState,
  } = useFleet();

  const stops = activeDriverRoute?.stops || [];
  const currentStop =
    currentStopIndex !== -1 && stops[currentStopIndex]
      ? stops[currentStopIndex]
      : stops[0];

  const driverTelemetry = activeDriverVehicle
    ? telemetryState?.vehicles?.get(activeDriverVehicle.id)
    : undefined;

  // Dynamic Driver position calculation:
  // Uses real-time GPS telemetry from TelemetryEngine
  const driverPos = useMemo<[number, number]>(() => {
    if (driverTelemetry && driverTelemetry.currentLat && driverTelemetry.currentLng) {
      return [driverTelemetry.currentLat, driverTelemetry.currentLng];
    }
    if (
      activeDriverVehicle?.currentLat &&
      activeDriverVehicle?.currentLng &&
      (activeDriverVehicle.currentLat !== JAIPUR_DEPOT[0] ||
        activeDriverVehicle.currentLng !== JAIPUR_DEPOT[1])
    ) {
      return [activeDriverVehicle.currentLat, activeDriverVehicle.currentLng];
    }
    if (currentStop) {
      return [currentStop.lat + 0.003, currentStop.lng - 0.003];
    }
    return JAIPUR_DEPOT;
  }, [driverTelemetry, activeDriverVehicle, currentStop]);

  const [mapCenter, setMapCenter] = useState<[number, number]>(driverPos);
  const [mapZoom, setMapZoom] = useState<number>(14);

  // Update map center when driver position changes
  useEffect(() => {
    setMapCenter(driverPos);
  }, [driverPos]);

  // Route path coordinates from backend stops
  const routePath = useMemo<[number, number][]>(() => {
    if (stops.length === 0) return [JAIPUR_DEPOT];
    return [
      JAIPUR_DEPOT,
      ...stops.map((s): [number, number] => [s.lat, s.lng]),
    ];
  }, [stops]);

  // Active nearby disruption events in Jaipur
  const activeEvents = useMemo(() => {
    return events.filter((e) => !e.resolved && e.lat !== undefined && e.lng !== undefined);
  }, [events]);

  const isReoptimised = activeDriverRoute?.status === 'REOPTIMISED';

  return (
    <div className="bg-surface-main rounded-2xl border border-border-subtle shadow-xs overflow-hidden flex flex-col relative select-none">
      {/* Top Corridor Status Bar */}
      <div className="px-4 py-2 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-2 z-20 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-status-success animate-ping" />
          <span className="font-bold text-xs">Live Corridor Nav</span>
          <span className="text-slate-400 font-mono text-[11px] hidden sm:inline">
            • {driverTelemetry?.speedKmh || 40} km/h
          </span>
          <span className="text-sky-300 font-mono text-[11px] font-semibold hidden md:inline">
            • {driverTelemetry?.distanceToNextStopMeters || 450}m to Stop
          </span>
          <span className="text-emerald-400 font-mono text-[11px] font-semibold hidden md:inline">
            GPS Locked
          </span>
        </div>

        {/* Dynamic corridor detour badge if route was re-optimised */}
        {isReoptimised ? (
          <button
            onClick={() => openRouteComparisonForIncident('TRAFFIC')}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-ai-intelligence/40 hover:bg-ai-intelligence border border-purple-400/50 text-[11px] font-semibold text-purple-200 hover:text-white transition-colors"
          >
            <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
            <span>AI Dynamic Bypass Active</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
            <Compass className="w-3.5 h-3.5 text-blue-400" />
            <span>Optimal Route Locked</span>
          </div>
        )}
      </div>

      {/* Map Interactive Leaflet Canvas */}
      <div className="relative w-full h-[380px] sm:h-[420px] bg-[#EAEFF5] overflow-hidden">
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
          attributionControl={false}
        >
          <DriverMapController center={mapCenter} zoom={mapZoom} />

          {/* Clean Light/Crisp OpenStreetMap Tiles (Zero Watermark) */}
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
            subdomains="abc"
          />

          {/* Depot Origin Marker */}
          <Marker position={JAIPUR_DEPOT} icon={getDriverDepotIcon()}>
            <Popup>
              <div className="p-2 text-xs font-sans">
                <span className="font-bold text-slate-900">Jaipur Central Hub</span>
                <p className="text-slate-500 text-[11px]">Departure Base</p>
              </div>
            </Popup>
          </Marker>

          {/* Dynamic Active Disruption Zones */}
          {activeEvents.map((evt) => {
            const isCritical = evt.severity === 'CRITICAL';
            const color = isCritical ? '#dc2626' : '#f59e0b';
            const lat = evt.lat as number;
            const lng = evt.lng as number;

            return (
              <React.Fragment key={`driver-evt-${evt.id}`}>
                <Circle
                  center={[lat, lng]}
                  radius={(evt.radiusKm || 1) * 1000}
                  pathOptions={{
                    color,
                    fillColor: color,
                    fillOpacity: 0.25,
                    weight: 2,
                    dashArray: '4, 6',
                  }}
                />
              </React.Fragment>
            );
          })}

          {/* Route Polylines */}
          {routePath.length > 1 && (
            <>
              {/* Solid Route Line */}
              <Polyline
                positions={routePath}
                pathOptions={{
                  color: isReoptimised ? '#7c3aed' : '#2563eb',
                  weight: 6,
                  opacity: 0.85,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />
              {/* Inner Glowing Animated Line */}
              <Polyline
                positions={routePath}
                pathOptions={{
                  color: isReoptimised ? '#c084fc' : '#93c5fd',
                  weight: 2.5,
                  opacity: 0.9,
                  dashArray: '8, 8',
                }}
              />
            </>
          )}

          {/* Stop Markers */}
          {stops.map((stop, idx) => {
            const isCurrent = idx === currentStopIndex;
            const isCompleted = stop.completed;
            const isPriority = Boolean(stop.isPriority);

            return (
              <Marker
                key={`driver-stop-${stop.orderId || idx}`}
                position={[stop.lat, stop.lng]}
                icon={getDriverStopIcon(
                  stop.stopNumber || idx + 1,
                  isCompleted,
                  isCurrent,
                  isPriority
                )}
              >
                <Popup>
                  <div className="p-3 text-slate-900 rounded-lg min-w-[200px] font-sans">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                      <span className="font-bold text-xs text-blue-600">
                        Stop #{idx + 1}
                      </span>
                      {isCompleted ? (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                          Delivered ✓
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 text-[10px] font-bold">
                          Next
                        </span>
                      )}
                    </div>
                    <div className="mt-1.5 text-xs font-semibold text-slate-800">
                      {stop.name}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {stop.address}
                    </p>
                    <div className="mt-2 text-[11px] font-mono text-slate-600">
                      ETA: {stop.eta}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Live Driver Vehicle Marker */}
          <Marker
            position={driverPos}
            icon={getDriverVehicleIcon(
              activeDriverVehicle?.id || 'V01',
              driverTelemetry?.speedKmh || activeDriverVehicle?.currentSpeedKmh || 40,
              driverTelemetry?.headingDegrees || 0
            )}
          >
            <Popup>
              <div className="p-2 text-xs font-sans">
                <span className="font-bold text-slate-900">
                  {activeDriverVehicle?.name || 'Tata 407 SFC'}
                </span>
                <p className="text-slate-500 text-[11px]">
                  Pilot: {activeDriverVehicle?.driverName || 'Rajesh Kumar'}
                </p>
                <p className="font-mono text-blue-600 mt-1">
                  Speed: {driverTelemetry?.speedKmh || 40} km/h • {driverTelemetry?.distanceToNextStopMeters || 450}m to destination
                </p>
              </div>
            </Popup>
          </Marker>
        </MapContainer>

        {/* Current Stop Ahead Callout Overlay */}
        {currentStop && (
          <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur px-3 py-2 rounded-xl border border-slate-200 shadow-lg flex items-center gap-2.5 text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse shrink-0" />
            <div>
              <div className="font-bold text-slate-900">
                Stop {currentStopIndex + 1}: {currentStop.name}
              </div>
              <div className="text-[11px] text-slate-500 truncate max-w-[220px]">
                {currentStop.address}
              </div>
            </div>
            <span className="font-mono text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200 ml-1">
              {currentStop.eta}
            </span>
          </div>
        )}

        {/* Map Control Buttons (Zoom In, Zoom Out, Recenter) */}
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-1.5 shadow-md">
          <button
            onClick={() => setMapZoom((z) => Math.min(18, z + 1))}
            className="w-8 h-8 rounded-lg bg-white hover:bg-slate-50 text-slate-800 flex items-center justify-center border border-slate-200 shadow-xs transition-colors"
            title="Zoom In"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => setMapZoom((z) => Math.max(10, z - 1))}
            className="w-8 h-8 rounded-lg bg-white hover:bg-slate-50 text-slate-800 flex items-center justify-center border border-slate-200 shadow-xs transition-colors"
            title="Zoom Out"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setMapCenter(driverPos);
              setMapZoom(15);
            }}
            className="w-8 h-8 rounded-lg bg-white hover:bg-slate-50 text-blue-600 flex items-center justify-center border border-slate-200 shadow-xs transition-colors"
            title="Center on Driver Position"
          >
            <Crosshair className="w-4 h-4" />
          </button>
        </div>

        {/* Map Legend */}
        <div className="absolute bottom-4 right-4 z-20 bg-white/95 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs flex items-center gap-3 text-[11px] font-medium text-slate-700">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <span>Current</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
            <span>Done</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
            <span>Upcoming</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-blue-600 inline-block" />
            <span>Route</span>
          </div>
        </div>
      </div>
    </div>
  );
};
