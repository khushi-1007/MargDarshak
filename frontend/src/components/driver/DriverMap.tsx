import React, { useState } from 'react';
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

export const DriverMap: React.FC = () => {
  const {
    activeDriverRoute,
    activeDriverVehicle,
    currentStopIndex,
    openRouteComparisonForIncident,
  } = useFleet();

  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [activeView, setActiveView] = useState<'ROUTE' | 'FOCUS_CURRENT'>('ROUTE');

  const stops = activeDriverRoute?.stops || [];
  const currentStop =
    currentStopIndex !== -1 && stops[currentStopIndex]
      ? stops[currentStopIndex]
      : stops[0];

  // Coordinates projection helper for Jaipur (Lat: 26.82 to 26.96, Lng: 75.72 to 75.85)
  const toSvgCoords = (lat: number, lng: number) => {
    const minLat = 26.81;
    const maxLat = 26.97;
    const minLng = 75.72;
    const maxLng = 75.85;

    const x = ((lng - minLng) / (maxLng - minLng)) * 540 + 30;
    const y = ((maxLat - lat) / (maxLat - minLat)) * 340 + 30;
    return { x: Math.round(x), y: Math.round(y) };
  };

  // Build path string for driver's route
  const waypoints = activeDriverRoute?.waypoints || [
    [26.9239, 75.8038],
    [26.915, 75.795],
    [26.9022, 75.7767],
    [26.878, 75.772],
    [26.8529, 75.7675],
    [26.868, 75.791],
    [26.8839, 75.8052],
  ];

  const pathString = waypoints
    .map((wp, i) => {
      const { x, y } = toSvgCoords(wp[0], wp[1]);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  // Driver vehicle current simulated coordinates
  const driverVehiclePos = currentStop
    ? toSvgCoords(currentStop.lat + 0.008, currentStop.lng - 0.006)
    : { x: 280, y: 200 };

  return (
    <div className="bg-surface-main rounded-2xl border border-border-subtle shadow-xs overflow-hidden flex flex-col relative select-none">
      {/* Top Corridor Status Bar */}
      <div className="px-4 py-2 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-2 z-20 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-status-success animate-ping" />
          <span className="font-bold text-xs">Live Corridor Nav</span>
          <span className="text-slate-400 font-mono text-[11px] hidden sm:inline">• 38 km/h</span>
          <span className="text-emerald-400 font-mono text-[11px] font-semibold hidden md:inline">100% Solid GPS</span>
        </div>

        {/* Dynamic corridor detour badge if route was re-optimised */}
        {activeDriverRoute?.status === 'REOPTIMISED' ? (
          <button
            onClick={() => openRouteComparisonForIncident('TRAFFIC')}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-ai-intelligence/40 hover:bg-ai-intelligence border border-purple-400/50 text-[11px] font-semibold text-purple-200 hover:text-white transition-colors"
          >
            <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
            <span>Via Gopalpura / MI Rd Bypass</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
            <Compass className="w-3.5 h-3.5 text-blue-400" />
            <span>Optimal Route Locked</span>
          </div>
        )}
      </div>

      {/* Map Interactive Canvas */}
      <div className="relative w-full h-[360px] sm:h-[400px] bg-[#EAEFF5] overflow-hidden">
        <svg
          viewBox="0 0 600 400"
          className="w-full h-full object-cover transition-transform duration-300"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          {/* Base Road Network (Jaipur Grid) */}
          <g stroke="#CBD5E1" strokeWidth="6" strokeLinecap="round" opacity="0.6">
            <line x1="60" y1="80" x2="540" y2="80" />
            <line x1="60" y1="180" x2="540" y2="180" />
            <line x1="60" y1="280" x2="540" y2="280" />
            <line x1="160" y1="40" x2="160" y2="360" />
            <line x1="300" y1="40" x2="300" y2="360" />
            <line x1="440" y1="40" x2="440" y2="360" />
            {/* Diagonal Arteries (Ajmer Rd, Tonk Rd) */}
            <line x1="80" y1="60" x2="500" y2="340" stroke="#94A3B8" strokeWidth="8" />
            <line x1="500" y1="60" x2="120" y2="320" stroke="#94A3B8" strokeWidth="7" />
          </g>

          {/* Tonk Road Traffic Congestion Highlight */}
          <g>
            <line
              x1="380"
              y1="220"
              x2="450"
              y2="280"
              stroke="#EF4444"
              strokeWidth="9"
              strokeLinecap="round"
              opacity="0.8"
            />
            <circle cx="415" cy="250" r="14" fill="#EF4444" opacity="0.25" className="animate-ping" />
          </g>

          {/* Route Polyline */}
          <path
            d={pathString}
            fill="none"
            stroke="#2563EB"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="drop-shadow-sm"
          />

          {/* Active Animated Route Dash */}
          <path
            d={pathString}
            fill="none"
            stroke="#60A5FA"
            strokeWidth="2.5"
            strokeDasharray="8 6"
            strokeLinecap="round"
            className="animate-pulse"
          />

          {/* Depot Pin (Sitapura) */}
          <g transform="translate(180, 310)">
            <rect x="-14" y="-12" width="28" height="24" rx="6" fill="#1E293B" stroke="#FFFFFF" strokeWidth="2" />
            <text x="0" y="4" fill="#FFFFFF" fontSize="10" fontWeight="bold" textAnchor="middle">
              DEP
            </text>
          </g>

          {/* Stop Markers */}
          {stops.map((stop, idx) => {
            const { x, y } = toSvgCoords(stop.lat, stop.lng);
            const isCurrent = idx === currentStopIndex;
            const isCompleted = stop.completed;
            const displayNum = idx + 1;

            return (
              <g key={`marker-${stop.orderId || idx}`} transform={`translate(${x}, ${y})`}>
                {isCurrent && (
                  <circle r="18" fill="#2563EB" opacity="0.3" className="animate-ping" />
                )}
                <circle
                  r="12"
                  fill={isCompleted ? '#16A34A' : isCurrent ? '#2563EB' : '#64748B'}
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  className="shadow-sm"
                />
                <text
                  x="0"
                  y="4"
                  fill="#FFFFFF"
                  fontSize="10"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {isCompleted ? '✓' : displayNum}
                </text>
                {/* Stop Name Label */}
                <rect
                  x="-35"
                  y="16"
                  width="70"
                  height="16"
                  rx="4"
                  fill="#FFFFFF"
                  stroke="#E2E8F0"
                  strokeWidth="1"
                  opacity="0.9"
                />
                <text
                  x="0"
                  y="28"
                  fill="#1E293B"
                  fontSize="8"
                  fontWeight="600"
                  textAnchor="middle"
                >
                  {stop.name.slice(0, 10)}..
                </text>
              </g>
            );
          })}

          {/* Current Driver Vehicle Position Pin */}
          <g transform={`translate(${driverVehiclePos.x}, ${driverVehiclePos.y})`}>
            {/* Pulsing radius */}
            <circle r="22" fill="#2563EB" opacity="0.2" className="animate-pulse" />
            {/* Pin body */}
            <rect x="-36" y="-30" width="72" height="24" rx="6" fill="#0F172A" stroke="#38BDF8" strokeWidth="1.5" />
            <text x="0" y="-14" fill="#FFFFFF" fontSize="9" fontWeight="bold" textAnchor="middle">
              {activeDriverVehicle?.id || 'V01'} • 38 km/h
            </text>
            {/* Vehicle arrow / beacon */}
            <circle cx="0" cy="0" r="10" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2" />
            <polygon points="0,-6 5,4 -5,4" fill="#FFFFFF" transform="rotate(45)" />
          </g>
        </svg>

        {/* Map Overlays: Current Stop Ahead Callout */}
        {currentStop && (
          <div className="absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur px-3 py-1.5 rounded-xl border border-border-subtle shadow-md flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-primary-container animate-pulse" />
            <span className="font-bold text-deep-navy">
              Stop {currentStopIndex + 1}: {currentStop.name}
            </span>
            <span className="font-mono text-primary font-semibold">({currentStop.eta})</span>
          </div>
        )}

        {/* Map Control Buttons (Live Location, Zoom In, Zoom Out, Center) */}
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-1.5 shadow-md">
          <button
            onClick={() => setZoomLevel((z) => Math.min(1.6, z + 0.15))}
            className="w-8 h-8 rounded-lg bg-white hover:bg-slate-50 text-deep-navy flex items-center justify-center border border-border-subtle shadow-xs transition-colors"
            title="Zoom In"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoomLevel((z) => Math.max(0.85, z - 0.15))}
            className="w-8 h-8 rounded-lg bg-white hover:bg-slate-50 text-deep-navy flex items-center justify-center border border-border-subtle shadow-xs transition-colors"
            title="Zoom Out"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoomLevel(1)}
            className="w-8 h-8 rounded-lg bg-white hover:bg-slate-50 text-primary-container flex items-center justify-center border border-border-subtle shadow-xs transition-colors"
            title="Center on Driver Position"
          >
            <Crosshair className="w-4 h-4" />
          </button>
        </div>

        {/* Map Legend */}
        <div className="absolute bottom-4 right-4 z-10 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg border border-border-subtle shadow-xs flex items-center gap-3 text-[11px] font-medium text-deep-navy">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-primary-container" />
            <span>Current</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-status-success" />
            <span>Completed</span>
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
