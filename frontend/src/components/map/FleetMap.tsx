import React, { useState, useMemo, useEffect } from 'react';
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
import { useFleet } from '../../context/FleetContext';
import { Vehicle } from '../../types/fleet';
import { RouteStop } from '../../types/route';
import { DisruptionEvent } from '../../types/event';
import {
  AlertTriangle,
  Sparkles,
  Zap,
  Navigation,
  CheckCircle2,
  RefreshCw,
  Crosshair,
  MapPin,
  Clock,
  Layers,
} from 'lucide-react';

const JAIPUR_DEPOT: [number, number] = [26.9124, 75.7873];

// Helper to pan/fly camera
function MapViewController({
  center,
  zoom,
}: {
  center: [number, number];
  zoom: number;
}) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.0 });
  }, [center, zoom, map]);
  return null;
}

// Custom Leaflet Icons with Live Telemetry
const getVehicleIcon = (
  vehicle: Vehicle,
  isSelected: boolean,
  speedKmh = 40,
  isDelivering = false,
  heading = 0
) => {
  const isBroken = vehicle.status === 'BROKEN_DOWN';
  const bgColor = isBroken ? '#dc2626' : vehicle.color || '#16a34a';
  const labelText = isBroken
    ? `${vehicle.shortId || vehicle.id} • STALLED`
    : isDelivering
    ? `${vehicle.shortId || vehicle.id} • DELIVERING 📦`
    : `${vehicle.shortId || vehicle.id} • ${speedKmh} km/h`;

  const labelBg = isBroken
    ? '#7f1d1d'
    : isDelivering
    ? '#065f46'
    : '#0f172a';

  return L.divIcon({
    className: 'custom-leaflet-div-icon',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer;">
        <!-- Floating Live Telemetry Pill -->
        <div style="display: flex; align-items: center; gap: 3px; background-color: ${labelBg}; color: #ffffff; border: 1.5px solid ${isBroken ? '#f87171' : isDelivering ? '#34d399' : '#38bdf8'}; border-radius: 9999px; padding: 1px 7px; font-size: 9px; font-weight: 800; font-family: 'JetBrains Mono', monospace; box-shadow: 0 4px 10px rgba(0,0,0,0.5); margin-bottom: 2px; white-space: nowrap; z-index: 20;">
          <span style="width: 5px; height: 5px; border-radius: 9999px; background-color: ${isBroken ? '#ef4444' : isDelivering ? '#10b981' : '#38bdf8'}; animation: ping 1s infinite;"></span>
          ${labelText}
        </div>

        <!-- Radar Pulse -->
        <span style="position: absolute; bottom: 0; width: 44px; height: 44px; border-radius: 9999px; background-color: ${isBroken ? 'rgba(239, 68, 68, 0.4)' : 'rgba(56, 189, 248, 0.3)'}; animation: ping 1.4s cubic-bezier(0, 0, 0.2, 1) infinite; z-index: 5;"></span>

        <!-- Vehicle Body & Directional Arrow -->
        <div style="width: 32px; height: 32px; border-radius: 9999px; background-color: ${bgColor}; color: white; display: flex; align-items: center; justify-content: center; border: 2.5px solid #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.5); z-index: 10; position: relative;">
          ${
            isBroken
              ? '<span style="font-size: 13px; font-weight: 900;">✕</span>'
              : `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="transform: rotate(${heading}deg); transition: transform 0.4s ease-out;"><polygon points="12 2 19 21 12 17 5 21 12 2"/></svg>`
          }
        </div>
      </div>
    `,
    iconSize: [120, 60],
    iconAnchor: [60, 48],
    popupAnchor: [0, -42],
  });
};

const getDepotIcon = () => {
  return L.divIcon({
    className: 'custom-leaflet-div-icon',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 38px; height: 38px; cursor: pointer;">
        <div style="width: 34px; height: 34px; border-radius: 10px; background: #0284c7; color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 900; border: 2px solid #ffffff; box-shadow: 0 4px 14px rgba(2, 132, 199, 0.6); font-family: Inter, sans-serif;">
          HUB
        </div>
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -20],
  });
};

const getStopIcon = (
  stopNumber: number,
  isCompleted: boolean,
  isPriority: boolean,
  color = '#2563eb'
) => {
  const bg = isCompleted ? '#16a34a' : isPriority ? '#f59e0b' : color;
  return L.divIcon({
    className: 'custom-leaflet-div-icon',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 26px; height: 26px; cursor: pointer;">
        ${
          isPriority
            ? '<span style="position: absolute; width: 32px; height: 32px; border-radius: 9999px; background-color: rgba(245, 158, 11, 0.4); animation: ping 1.5s infinite;"></span>'
            : ''
        }
        <div style="width: 20px; height: 20px; border-radius: 9999px; background-color: ${bg}; color: white; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; border: 1.5px solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.5); font-family: Inter, sans-serif;">
          ${isCompleted ? '✓' : stopNumber}
        </div>
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -14],
  });
};

const getIncidentIcon = (severity: string) => {
  const isCritical = severity === 'CRITICAL';
  const color = isCritical ? '#dc2626' : '#f59e0b';
  return L.divIcon({
    className: 'custom-leaflet-div-icon',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; cursor: pointer;">
        <span style="position: absolute; width: 42px; height: 42px; border-radius: 9999px; background-color: ${color}40; animation: ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
        <div style="width: 28px; height: 28px; border-radius: 9999px; background-color: ${color}; color: white; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 900; border: 2px solid #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.6);">
          ⚠
        </div>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18],
  });
};

export const FleetMap: React.FC = () => {
  const {
    vehicles,
    orders,
    routes,
    events,
    selectedVehicleId,
    setSelectedVehicleId,
    openRouteComparisonForIncident,
    telemetryState,
    toggleTelemetry,
    setTelemetrySpeed,
    resetTelemetry,
  } = useFleet();

  const [showTraffic, setShowTraffic] = useState<boolean>(true);
  const [showReroutes, setShowReroutes] = useState<boolean>(true);
  const [showIncidents, setShowIncidents] = useState<boolean>(true);
  const [mapCenter, setMapCenter] = useState<[number, number]>(JAIPUR_DEPOT);
  const [mapZoom, setMapZoom] = useState<number>(12);

  // Selected vehicle details
  const activeVehicle = vehicles.find((v) => v.id === selectedVehicleId);

  // Derive coordinates for each vehicle dynamically from live telemetry engine
  const vehicleLocations = useMemo(() => {
    return vehicles.map((v, idx) => {
      const route = routes.find((r) => r.vehicleId === v.id);
      const tel = telemetryState?.vehicles?.get(v.id);

      let lat = tel?.currentLat ?? v.currentLat;
      let lng = tel?.currentLng ?? v.currentLng;

      // If coordinates are default depot or missing, locate along route or depot
      if (!lat || !lng || (lat === JAIPUR_DEPOT[0] && lng === JAIPUR_DEPOT[1])) {
        if (route && route.stops.length > 0) {
          const nextStop = route.stops.find((s) => !s.completed) || route.stops[0];
          lat = Number(((JAIPUR_DEPOT[0] + nextStop.lat) / 2).toFixed(4));
          lng = Number(((JAIPUR_DEPOT[1] + nextStop.lng) / 2).toFixed(4));
        } else {
          lat = JAIPUR_DEPOT[0] + (idx - 2) * 0.0035;
          lng = JAIPUR_DEPOT[1] + (idx - 2) * 0.0035;
        }
      }

      // If vehicle is broken down, check if there is an active breakdown event
      if (v.status === 'BROKEN_DOWN') {
        const bdEvent = events.find(
          (e) => !e.resolved && (e.type === 'VEHICLE_BREAKDOWN' || e.title.toLowerCase().includes('breakdown'))
        );
        if (bdEvent && bdEvent.lat && bdEvent.lng) {
          lat = bdEvent.lat;
          lng = bdEvent.lng;
        }
      }

      return {
        vehicle: v,
        position: [lat, lng] as [number, number],
        heading: tel?.headingDegrees || 0,
        speedKmh: tel?.speedKmh || v.currentSpeedKmh || 40,
        isDelivering: tel?.isDelivering || false,
        nextStopName: tel?.nextStopName || 'En route',
        distanceMeters: tel?.distanceToNextStopMeters || 0,
        route,
      };
    });
  }, [vehicles, routes, events, telemetryState]);

  // Handle camera centering when vehicle is selected
  useEffect(() => {
    if (selectedVehicleId) {
      const match = vehicleLocations.find((vl) => vl.vehicle.id === selectedVehicleId);
      if (match) {
        setMapCenter(match.position);
        setMapZoom(14);
      }
    }
  }, [selectedVehicleId, vehicleLocations]);

  // Active critical/high events for alert banner
  const activeCriticalEvent = useMemo(() => {
    return events.find(
      (e) => !e.resolved && (e.severity === 'CRITICAL' || e.severity === 'WARNING')
    );
  }, [events]);

  const activeIncidentsCount = events.filter((e) => !e.resolved).length;

  return (
    <div id="fleet-telemetry-map" className="bg-surface-main rounded-xl border border-border-subtle shadow-sm overflow-hidden flex flex-col relative select-none">
      {/* Live Telemetry Floating Command Bar */}
      <div className="px-4 py-2 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 text-xs border-b border-slate-800 z-30">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
                telemetryState?.isPlaying ? 'bg-emerald-400 opacity-75' : 'bg-amber-400 opacity-75'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                telemetryState?.isPlaying ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
          </span>
          <span className="font-bold tracking-wide uppercase text-[11px] text-emerald-400 font-mono">
            {telemetryState?.isPlaying ? 'LIVE GPS TELEMETRY ACTIVE' : 'GPS SIMULATION PAUSED'}
          </span>
          <span className="text-slate-400 font-mono text-[11px] hidden sm:inline">
            • {telemetryState?.activeVehiclesCount || 5} Vehicles Moving • 41 km/h Avg
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Play / Pause Toggle */}
          <button
            onClick={toggleTelemetry}
            className={`px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              telemetryState?.isPlaying
                ? 'bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40'
                : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
            }`}
          >
            {telemetryState?.isPlaying ? '⏸ Pause GPS' : '▶ Play GPS'}
          </button>

          {/* Speed Multipliers */}
          <div className="flex items-center bg-slate-800 rounded p-0.5 border border-slate-700">
            {([1, 2, 5] as const).map((speed) => (
              <button
                key={`spd-${speed}`}
                onClick={() => setTelemetrySpeed(speed)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                  telemetryState?.speedMultiplier === speed
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>

          <button
            onClick={resetTelemetry}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium border border-slate-700 transition-colors cursor-pointer"
            title="Reset Vehicles to Jaipur Depot"
          >
            Reset
          </button>
        </div>
      </div>
      {/* Map Header Controls Bar */}
      <div className="px-4 py-2.5 bg-surface-container-low border-b border-border-subtle flex flex-wrap items-center justify-between gap-3 z-20">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-status-success animate-pulse" />
          <span className="text-xs font-bold text-deep-navy">
            Jaipur Central Operations GIS Map
          </span>
          <span className="font-mono text-[10px] text-text-muted bg-white px-2 py-0.5 rounded border border-border-subtle">
            EPSG:4326 • {JAIPUR_DEPOT[0]}° N, {JAIPUR_DEPOT[1]}° E
          </span>
        </div>

        {/* Map Layer Toggles */}
        <div className="flex items-center gap-1.5 text-xs">
          <button
            onClick={() => setShowTraffic(!showTraffic)}
            className={`px-2.5 py-1 rounded font-medium flex items-center gap-1.5 transition-colors ${
              showTraffic
                ? 'bg-status-warning/20 text-status-warning font-semibold border border-status-warning/40'
                : 'bg-white text-text-secondary border border-border-subtle'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-status-warning" />
            <span>Traffic</span>
          </button>

          <button
            onClick={() => setShowReroutes(!showReroutes)}
            className={`px-2.5 py-1 rounded font-medium flex items-center gap-1.5 transition-colors ${
              showReroutes
                ? 'bg-ai-intelligence text-white font-semibold shadow-xs'
                : 'bg-white text-text-secondary border border-border-subtle'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>Reroute Deltas</span>
          </button>

          <button
            onClick={() => setShowIncidents(!showIncidents)}
            className={`px-2.5 py-1 rounded font-medium flex items-center gap-1.5 transition-colors ${
              showIncidents
                ? 'bg-error-container text-status-critical font-semibold border border-error-container'
                : 'bg-white text-text-secondary border border-border-subtle'
            }`}
          >
            <AlertTriangle className="w-3 h-3 text-status-critical" />
            <span>Incidents ({activeIncidentsCount})</span>
          </button>

          <div className="h-4 w-px bg-border-subtle mx-1" />

          {/* Quick Focus Vehicle Dropdown */}
          <select
            value={selectedVehicleId || ''}
            onChange={(e) => setSelectedVehicleId(e.target.value || null)}
            className="h-7 px-2 rounded border border-border-subtle bg-white text-xs text-deep-navy focus:outline-none cursor-pointer"
          >
            <option value="">Focus Vehicle (All)</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.id} ({v.driverName}) — {v.status}
              </option>
            ))}
          </select>

          {/* Reset Camera Button */}
          <button
            onClick={() => {
              setSelectedVehicleId(null);
              setMapCenter(JAIPUR_DEPOT);
              setMapZoom(12);
            }}
            className="p-1 rounded border border-border-subtle bg-white hover:bg-slate-50 text-text-secondary"
            title="Reset Map View"
          >
            <Crosshair className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Primary Cartographic Canvas with Leaflet */}
      <div className="relative w-full h-[540px] bg-[#0b1329] overflow-hidden">
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          scrollWheelZoom={true}
          className="dark-map"
          style={{ height: '100%', width: '100%' }}
          attributionControl={false}
        >
          <MapViewController center={mapCenter} zoom={mapZoom} />

          {/* High-Contrast OpenStreetMap Basemap (Zero Watermark) */}
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
            subdomains="abc"
          />

          {/* Central Logistics Hub / Depot */}
          <Marker position={JAIPUR_DEPOT} icon={getDepotIcon()}>
            <Popup>
              <div className="p-3 bg-slate-900 text-white rounded-lg min-w-[200px] font-sans">
                <div className="flex items-center gap-2 pb-1 border-b border-slate-700">
                  <span className="w-2 h-2 rounded-full bg-sky-400" />
                  <span className="font-bold text-xs text-sky-400">Jaipur Central Hub</span>
                </div>
                <p className="text-[11px] text-slate-300 mt-1.5">
                  Transport Nagar Central Depot
                </p>
                <div className="mt-2 text-[10px] text-slate-400 font-mono">
                  Base Depot • Fleet Dispatch Origin
                </div>
              </div>
            </Popup>
          </Marker>

          {/* DYNAMIC ROUTE POLYLINES FROM BACKEND ROUTES */}
          {routes.map((route) => {
            const vehicle = vehicles.find((v) => v.id === route.vehicleId);
            const isSelected = selectedVehicleId === route.vehicleId;
            const isBroken = vehicle?.status === 'BROKEN_DOWN';
            const isReoptimised = route.status === 'REOPTIMISED';

            // Coordinates path: Depot -> Stop 1 -> Stop 2 -> ...
            const pathCoords: [number, number][] = [
              JAIPUR_DEPOT,
              ...(route.stops || []).map((s): [number, number] => [s.lat, s.lng]),
            ];

            if (pathCoords.length < 2) return null;

            // Colors
            const routeColor = isBroken
              ? '#dc2626'
              : isReoptimised && showReroutes
              ? '#9333ea'
              : vehicle?.color || '#2563eb';

            const lineWeight = isSelected ? 6 : selectedVehicleId ? 2 : 4;
            const lineOpacity = selectedVehicleId && !isSelected ? 0.35 : 0.85;

            return (
              <React.Fragment key={`route-group-${route.id}`}>
                <Polyline
                  positions={pathCoords}
                  pathOptions={{
                    color: routeColor,
                    weight: lineWeight,
                    opacity: lineOpacity,
                    dashArray: isBroken ? '6, 8' : isReoptimised ? '8, 6' : undefined,
                    lineCap: 'round',
                    lineJoin: 'round',
                  }}
                />
              </React.Fragment>
            );
          })}

          {/* DYNAMIC DELIVERY STOPS WAYPOINTS */}
          {routes.map((route) => {
            const vehicle = vehicles.find((v) => v.id === route.vehicleId);
            const isSelected = selectedVehicleId === route.vehicleId;
            const isVisible = !selectedVehicleId || isSelected;

            if (!isVisible) return null;

            return (route.stops || []).map((stop, sIdx) => {
              const order = orders.find((o) => o.id === stop.orderId);
              const isPriority = stop.isPriority || order?.priority === 'CRITICAL' || order?.priority === 'HIGH';

              return (
                <Marker
                  key={`stop-${route.id}-${stop.orderId || sIdx}`}
                  position={[stop.lat, stop.lng]}
                  icon={getStopIcon(
                    stop.stopNumber || sIdx + 1,
                    stop.completed,
                    Boolean(isPriority),
                    vehicle?.color
                  )}
                >
                  <Popup>
                    <div className="p-3 bg-slate-900 text-white rounded-lg min-w-[220px] font-sans">
                      <div className="flex items-center justify-between pb-1 border-b border-slate-700">
                        <span className="font-bold text-xs text-sky-400">
                          Stop #{stop.stopNumber} • {stop.orderId || `ORD-${sIdx + 1}`}
                        </span>
                        {stop.completed ? (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                            DELIVERED
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[10px] font-bold">
                            PENDING
                          </span>
                        )}
                      </div>
                      <div className="mt-2 text-xs font-semibold text-slate-200">
                        {stop.name}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">
                        {stop.address}
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-300 font-mono">
                        <span>ETA: {stop.eta}</span>
                        <span>Vehicle: {route.vehicleId}</span>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            });
          })}

          {/* DYNAMIC DISRUPTION INCIDENT ZONES & MARKERS */}
          {showIncidents &&
            events
              .filter((e) => !e.resolved && e.lat !== undefined && e.lng !== undefined)
              .map((evt) => {
                const isCritical = evt.severity === 'CRITICAL';
                const circleColor = isCritical ? '#dc2626' : '#f59e0b';
                const radiusMeters = (evt.radiusKm || 1.5) * 1000;
                const lat = evt.lat as number;
                const lng = evt.lng as number;

                return (
                  <React.Fragment key={`event-map-${evt.id}`}>
                    <Circle
                      center={[lat, lng]}
                      radius={radiusMeters}
                      pathOptions={{
                        color: circleColor,
                        fillColor: circleColor,
                        fillOpacity: 0.2,
                        weight: 2,
                        dashArray: '6, 6',
                      }}
                    />
                    <Marker
                      position={[lat, lng]}
                      icon={getIncidentIcon(evt.severity)}
                    >
                      <Popup>
                        <div className="p-3 bg-slate-900 text-white rounded-lg min-w-[240px] font-sans border border-slate-700">
                          <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">
                              {evt.type.replace(/_/g, ' ')}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                isCritical
                                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                  : 'bg-amber-950 text-amber-300 border border-amber-800'
                              }`}
                            >
                              {evt.severity}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-white mt-1.5">{evt.title}</h4>
                          <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                            {evt.description}
                          </p>
                          <div className="mt-2 text-[10px] text-slate-400 font-mono">
                            Radius: {evt.radiusKm || 1.5} km • Delay: +{evt.impactDelayMinutes}m
                          </div>
                          <button
                            onClick={() => openRouteComparisonForIncident(evt.type)}
                            className="mt-2.5 w-full py-1.5 bg-ai-intelligence hover:bg-purple-700 text-white rounded text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Inspect AI Re-routing</span>
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  </React.Fragment>
                );
              })}

          {/* DYNAMIC VEHICLE MARKERS FROM BACKEND VEHICLES WITH LIVE GPS TELEMETRY */}
          {vehicleLocations.map(({ vehicle, position, heading, speedKmh, isDelivering, nextStopName, distanceMeters, route }) => {
            const isSelected = selectedVehicleId === vehicle.id;
            const isBroken = vehicle.status === 'BROKEN_DOWN';

            return (
              <Marker
                key={`veh-${vehicle.id}`}
                position={position}
                icon={getVehicleIcon(vehicle, isSelected, speedKmh, isDelivering, heading)}
                eventHandlers={{
                  click: () => {
                    setSelectedVehicleId(vehicle.id);
                  },
                }}
              >
                <Popup>
                  <div className="p-3 bg-slate-900 text-white rounded-lg min-w-[250px] font-sans border border-slate-700 shadow-xl">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isBroken ? 'bg-status-critical animate-ping' : 'bg-status-success'
                          }`}
                        />
                        <span className="font-bold text-xs text-white">{vehicle.id}</span>
                        <span className="text-[11px] text-slate-400 font-mono">({vehicle.licensePlate})</span>
                      </div>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                          isBroken
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : isDelivering
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-blue-950 text-blue-300 border border-blue-800'
                        }`}
                      >
                        {isBroken ? 'STALLED' : isDelivering ? 'DELIVERING' : 'CRUISING'}
                      </span>
                    </div>

                    <div className="mt-2 text-xs font-semibold text-slate-200">
                      Pilot: {vehicle.driverName}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Heading towards: <span className="text-sky-300 font-medium">{nextStopName}</span>
                    </div>

                    <div className="mt-2 grid grid-cols-2 gap-1.5 text-[10px] font-mono bg-slate-950/70 p-2 rounded border border-slate-800">
                      <div>
                        <span className="text-slate-500">Live GPS:</span>{' '}
                        <span className="text-emerald-400 font-bold">{speedKmh} km/h</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Dist to Stop:</span>{' '}
                        <span className="text-sky-400 font-bold">{(distanceMeters / 1000).toFixed(1)} km</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Stops:</span>{' '}
                        <span>{route?.stops?.length || vehicle.currentStopsCount} total</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Battery:</span>{' '}
                        <span>{vehicle.batteryPct}%</span>
                      </div>
                    </div>

                    {isBroken && (
                      <button
                        onClick={() => openRouteComparisonForIncident('VEHICLE_BREAKDOWN')}
                        className="mt-2.5 w-full py-1.5 bg-status-critical hover:bg-red-700 text-white rounded text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-md"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Inspect Re-assignment</span>
                      </button>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Dynamic Interactive Incident Banner for Active Critical Disruption */}
        {showIncidents && activeCriticalEvent && (
          <div
            onClick={() => openRouteComparisonForIncident(activeCriticalEvent.type)}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-3 py-1.5 rounded-full bg-status-critical/95 text-white text-xs font-semibold shadow-xl border border-red-400/40 cursor-pointer hover:scale-105 transition-transform"
          >
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 animate-bounce" />
            <span className="truncate max-w-[320px] sm:max-w-md">
              {activeCriticalEvent.title} • {activeCriticalEvent.description.slice(0, 50)}...
            </span>
            <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-mono">
              Inspect Reroute →
            </span>
          </div>
        )}

        {/* Selected Vehicle Floating Telemetry Card */}
        {activeVehicle && (
          <div className="absolute top-4 right-4 bg-slate-900/95 backdrop-blur-md border border-slate-700 p-3 rounded-xl shadow-2xl w-64 z-30 text-white font-sans">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-700">
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    activeVehicle.status === 'BROKEN_DOWN'
                      ? 'bg-status-critical animate-ping'
                      : 'bg-status-success'
                  }`}
                />
                <span className="text-xs font-bold text-white">{activeVehicle.name}</span>
              </div>
              <button
                onClick={() => setSelectedVehicleId(null)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>
            <div className="mt-2 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Pilot:</span>
                <span className="font-semibold text-slate-200">{activeVehicle.driverName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span
                  className={`font-semibold ${
                    activeVehicle.status === 'BROKEN_DOWN'
                      ? 'text-status-critical'
                      : 'text-emerald-400'
                  }`}
                >
                  {activeVehicle.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Capacity:</span>
                <span className="font-mono text-slate-200">
                  {activeVehicle.currentLoadKg} / {activeVehicle.capacityKg} kg
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Speed:</span>
                <span className="font-mono text-emerald-400">
                  {activeVehicle.currentSpeedKmh} km/h
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Map Legend Strip */}
        <div className="absolute bottom-3 left-4 bg-slate-950/90 backdrop-blur-md px-3 py-1.5 rounded-lg flex items-center gap-4 text-white text-[11px] border border-slate-800 pointer-events-none z-30">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-status-success" />
            <span>Active En Route</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-status-critical" />
            <span>Breakdown / Stalled</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-ai-intelligence border-b border-dashed border-ai-intelligence" />
            <span>AI Reroute</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-status-critical/60" />
            <span>Disruption Zone</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-sky-600" />
            <span>Central Hub</span>
          </div>
        </div>
      </div>
    </div>
  );
};
