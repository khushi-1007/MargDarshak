import React, { useState } from 'react';
import { useFleet } from '../../context/FleetContext';
import {
  Layers,
  Maximize2,
  Minimize2,
  Navigation,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Zap,
  MapPin,
  Clock,
  Sparkles,
} from 'lucide-react';

export const FleetMap: React.FC = () => {
  const {
    vehicles,
    orders,
    routes,
    events,
    selectedVehicleId,
    setSelectedVehicleId,
    openRouteComparisonForIncident,
    cascadingFailureActive,
  } = useFleet();

  const [showTraffic, setShowTraffic] = useState<boolean>(true);
  const [showReroutes, setShowReroutes] = useState<boolean>(true);
  const [showIncidents, setShowIncidents] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Selected vehicle details
  const activeVehicle = vehicles.find((v) => v.id === selectedVehicleId);

  return (
    <div className="bg-surface-main rounded-xl border border-border-subtle shadow-sm overflow-hidden flex flex-col relative select-none">
      {/* Map Header Controls Bar */}
      <div className="px-4 py-2.5 bg-surface-container-low border-b border-border-subtle flex flex-wrap items-center justify-between gap-3 z-20">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-status-success animate-pulse" />
          <span className="text-xs font-bold text-deep-navy">
            Jaipur Central Operations Geo-Canvas
          </span>
          <span className="font-mono text-[10px] text-text-muted bg-white px-2 py-0.5 rounded border border-border-subtle">
            EPSG:4326 • 26.9124° N, 75.7873° E
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
            <span>Incidents ({events.filter((e) => !e.resolved).length})</span>
          </button>

          <div className="h-4 w-px bg-border-subtle mx-1" />

          {/* Quick Focus Vehicle */}
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
        </div>
      </div>

      {/* Primary Cartographic Canvas */}
      <div className="relative w-full h-[520px] bg-[#0b1329] overflow-hidden">
        {/* SVG Vector Map Canvas (Jaipur Arterial Grid + Real Roads) */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 1000 600"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="cityGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.75" strokeOpacity="0.6" />
            </pattern>
            <filter id="glow-purple" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Base Grid */}
          <rect width="1000" height="600" fill="#0b1329" />
          <rect width="1000" height="600" fill="url(#cityGrid)" />

          {/* Major Jaipur Arterial Roads */}
          {/* JLN Marg (South to Central) */}
          <path d="M 680,590 C 650,420 540,300 480,240" fill="none" stroke="#334155" strokeWidth="10" strokeLinecap="round" />
          <path d="M 680,590 C 650,420 540,300 480,240" fill="none" stroke="#1e293b" strokeWidth="6" strokeLinecap="round" />

          {/* Ajmer Road (Southwest to Center) */}
          <path d="M 50,480 C 220,430 360,370 480,310" fill="none" stroke="#334155" strokeWidth="12" strokeLinecap="round" />
          <path d="M 50,480 C 220,430 360,370 480,310" fill="none" stroke="#1e293b" strokeWidth="8" strokeLinecap="round" />

          {/* Sikar Road (Northwest to Vidhyadhar Nagar) */}
          <path d="M 470,20 C 460,110 470,180 490,260" fill="none" stroke="#334155" strokeWidth="8" strokeLinecap="round" />

          {/* Tonk Road Arterial (Affected Segment) */}
          <path
            d="M 540,590 C 530,470 510,380 490,270"
            fill="none"
            stroke={showIncidents ? '#dc2626' : '#334155'}
            strokeWidth="6"
            strokeDasharray={showIncidents ? '8 4' : 'none'}
            strokeOpacity={showIncidents ? '0.85' : '0.5'}
          />

          {/* Jaipur Bypass connecting Jagatpura & Sitapura */}
          <path d="M 620,590 C 720,530 850,470 920,380" fill="none" stroke="#1e293b" strokeWidth="6" />
          <path d="M 120,200 C 280,210 390,230 500,260" fill="none" stroke="#1e293b" strokeWidth="6" />

          {/* TONK ROAD CLOSURE RESTRICTED ZONE OVERLAY */}
          {showIncidents && (
            <g className="transition-opacity duration-300">
              <rect x="502" y="330" width="46" height="150" rx="8" fill="#dc2626" fillOpacity="0.2" />
              <path d="M 505,340 L 545,465" stroke="#dc2626" strokeWidth="2" strokeDasharray="6 4" strokeOpacity="0.6" />
              <circle cx="525" cy="405" r="14" fill="#dc2626" fillOpacity="0.9" />
              <text x="525" y="410" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="bold">✕</text>
            </g>
          )}

          {/* CALGIRI MARG TRAFFIC BOTTLENECK AMBER OVERLAY */}
          {showTraffic && (
            <g>
              <path d="M 630,410 Q 660,425 700,415" fill="none" stroke="#f59e0b" strokeWidth="8" strokeLinecap="round" strokeOpacity="0.6" />
              <circle cx="665" cy="420" r="10" fill="#f59e0b" fillOpacity="0.8" />
              <text x="665" y="424" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">!</text>
            </g>
          )}

          {/* ACTIVE ROUTE POLYLINES */}
          {/* V01 Active Route (Mansarovar -> Sodala -> C-Scheme rescue segment): Emerald Green */}
          <path
            d="M 260,460 L 330,405 L 400,345 L 450,305"
            fill="none"
            stroke="#16a34a"
            strokeWidth={selectedVehicleId === 'V01' ? 6 : 4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* V01 Re-route tail taking Orders #1008 & #1012: Glowing Purple Dashed Line */}
          {showReroutes && (
            <path
              d="M 450,305 C 470,295 490,290 530,285"
              fill="none"
              stroke="#7c3aed"
              strokeWidth="4"
              strokeDasharray="6 4"
              filter="url(#glow-purple)"
              className="animate-pulse"
            />
          )}

          {/* V02 Active Route (Vaishali Nagar -> Vidhyadhar Nagar): Blue */}
          <path
            d="M 220,270 L 290,245 L 390,205 L 440,140 L 460,80"
            fill="none"
            stroke="#2563eb"
            strokeWidth={selectedVehicleId === 'V02' ? 6 : 4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* V03 INTERRUPTED / BROKEN DOWN ROUTE */}
          <path
            d="M 490,270 L 520,320 L 535,400"
            fill="none"
            stroke="#dc2626"
            strokeWidth="3.5"
            strokeDasharray="4 6"
            strokeOpacity="0.6"
          />

          {/* V04 Active Route (Raja Park -> Malviya Nagar): Purple */}
          <path
            d="M 680,280 L 640,335 L 630,410"
            fill="none"
            stroke="#9333ea"
            strokeWidth={selectedVehicleId === 'V04' ? 6 : 4}
            strokeLinecap="round"
          />
          {showReroutes && (
            <path
              d="M 630,410 C 670,440 720,465 780,480"
              fill="none"
              stroke="#7c3aed"
              strokeWidth="3.5"
              strokeDasharray="5 3"
            />
          )}

          {/* V05 Standby Recovery Route if Deployed */}
          {!cascadingFailureActive && vehicles.find((v) => v.id === 'V05')?.status === 'ON_ROUTE' && (
            <path
              d="M 850,560 L 780,480 L 680,420 L 530,320"
              fill="none"
              stroke="#0ea5e9"
              strokeWidth="5"
              strokeDasharray="6 3"
              className="animate-pulse"
            />
          )}

          {/* DELIVERY STOPS WAYPOINTS */}
          {/* Stop 1: Mansarovar */}
          <circle cx="260" cy="460" r="5" fill="#16a34a" stroke="#ffffff" strokeWidth="1.5" />
          {/* Stop 2: Sodala */}
          <circle cx="400" cy="345" r="5" fill="#16a34a" stroke="#ffffff" strokeWidth="1.5" />
          {/* Stop 3: Vaishali Nagar Hub */}
          <circle cx="220" cy="270" r="5" fill="#2563eb" stroke="#ffffff" strokeWidth="1.5" />
          {/* Stop 4: Vidhyadhar Nagar Depot */}
          <circle cx="460" cy="80" r="5" fill="#2563eb" stroke="#ffffff" strokeWidth="1.5" />
          {/* Stop 5: Raja Park */}
          <circle cx="680" cy="280" r="5" fill="#9333ea" stroke="#ffffff" strokeWidth="1.5" />
          {/* Stop 6: Malviya Nagar Sector 4 */}
          <circle cx="630" cy="410" r="5" fill="#9333ea" stroke="#ffffff" strokeWidth="1.5" />

          {/* Disrupted Stops reassigned */}
          <circle cx="530" cy="285" r="6" fill="#7c3aed" stroke="#ffffff" strokeWidth="1.5" />
          <text x="542" y="289" fill="#e9d5ff" fontSize="10" fontWeight="600" fontFamily="Inter">
            #1008 (Civil Lines)
          </text>

          <circle cx="520" cy="320" r="6" fill="#7c3aed" stroke="#ffffff" strokeWidth="1.5" />
          <text x="532" y="324" fill="#e9d5ff" fontSize="10" fontWeight="600" fontFamily="Inter">
            #1012 (Bais Godam)
          </text>

          {/* Priority Order #1021 / P-101 Star Stop in Jagatpura/Malviya */}
          <circle cx="780" cy="480" r="14" fill="#bc4800" fillOpacity="0.25" className="animate-ping" />
          <circle cx="780" cy="480" r="7" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
          <text x="792" y="484" fill="#fef08a" fontSize="10" fontWeight="bold" fontFamily="Inter">
            P-101 (Fortis Escorts)
          </text>

          {/* Central Sitapura Depot Point */}
          <circle cx="850" cy="560" r="8" fill="#0ea5e9" stroke="#ffffff" strokeWidth="2" />
          <text x="864" y="564" fill="#bae6fd" fontSize="11" fontWeight="bold" fontFamily="Inter">
            Sitapura Depot
          </text>
        </svg>

        {/* District Geographical Badges Overlay */}
        <div className="absolute top-6 left-12 px-2 py-0.5 rounded bg-slate-950/80 text-slate-300 text-[10px] font-mono pointer-events-none">
          VIDHYADHAR NAGAR
        </div>
        <div className="absolute top-44 left-6 px-2 py-0.5 rounded bg-slate-950/80 text-slate-300 text-[10px] font-mono pointer-events-none">
          VAISHALI NAGAR
        </div>
        <div className="absolute bottom-24 left-20 px-2 py-0.5 rounded bg-slate-950/80 text-slate-300 text-[10px] font-mono pointer-events-none">
          MANSAROVAR
        </div>
        <div className="absolute top-36 left-72 px-2 py-0.5 rounded bg-slate-950/80 text-slate-300 text-[10px] font-mono pointer-events-none">
          SODALA
        </div>
        <div className="absolute top-32 right-64 px-2 py-0.5 rounded bg-slate-950/80 text-slate-300 text-[10px] font-mono pointer-events-none">
          RAJA PARK
        </div>
        <div className="absolute bottom-32 right-56 px-2 py-0.5 rounded bg-slate-950/80 text-slate-300 text-[10px] font-mono pointer-events-none">
          MALVIYA NAGAR
        </div>
        <div className="absolute bottom-12 right-20 px-2 py-0.5 rounded bg-slate-950/80 text-slate-300 text-[10px] font-mono pointer-events-none">
          JAGATPURA / SITAPURA
        </div>

        {/* Interactive Tonk Road Incident Banner */}
        {showIncidents && (
          <div
            onClick={() => openRouteComparisonForIncident('ROAD_CLOSURE')}
            className="absolute top-64 left-[490px] -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-1 rounded bg-status-critical/95 text-white text-xs font-semibold shadow-lg animate-bounce cursor-pointer hover:scale-105 transition-transform"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Tonk Rd Closed 11:00 AM – 3:00 PM</span>
          </div>
        )}

        {/* VEHICLE PINS OVERLAY */}
        {/* Vehicle 1: V01 (Tata 407) */}
        <div
          onClick={() => setSelectedVehicleId('V01')}
          className="absolute top-56 left-80 -translate-x-1/2 -translate-y-1/2 group cursor-pointer z-10"
        >
          <div className="relative flex items-center justify-center">
            <div className={`w-8 h-8 rounded-full bg-status-success text-white flex items-center justify-center shadow-lg text-[11px] font-bold border-2 border-white transition-transform ${selectedVehicleId === 'V01' ? 'ring-4 ring-status-success scale-110' : 'group-hover:scale-110'}`}>
              V01
            </div>
            <Navigation className="w-3 h-3 text-white absolute -top-1 -right-1 bg-slate-900 rounded-full p-0.5" />
          </div>
          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col bg-slate-950/95 text-white p-2 rounded shadow-xl min-w-[170px] z-30 border border-slate-800">
            <span className="font-semibold text-xs text-status-success">V01 • Rajesh Kumar</span>
            <span className="text-[11px] text-slate-300">Mansarovar → Sodala</span>
            <span className="font-mono text-[10px] text-purple-300 mt-1">Cap: 920kg free • 38 km/h</span>
          </div>
        </div>

        {/* Vehicle 2: V02 (Mahindra Bolero) */}
        <div
          onClick={() => setSelectedVehicleId('V02')}
          className="absolute top-24 left-80 -translate-x-1/2 -translate-y-1/2 group cursor-pointer z-10"
        >
          <div className="relative flex items-center justify-center">
            <div className={`w-8 h-8 rounded-full bg-primary-container text-white flex items-center justify-center shadow-lg text-[11px] font-bold border-2 border-white transition-transform ${selectedVehicleId === 'V02' ? 'ring-4 ring-primary-container scale-110' : 'group-hover:scale-110'}`}>
              V02
            </div>
            <Navigation className="w-3 h-3 text-white absolute -top-1 -right-1 bg-slate-900 rounded-full p-0.5" />
          </div>
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col bg-slate-950/95 text-white p-2 rounded shadow-xl min-w-[170px] z-30 border border-slate-800">
            <span className="font-semibold text-xs text-primary-container">V02 • Amit Sharma</span>
            <span className="text-[11px] text-slate-300">Vaishali → Vidhyadhar</span>
            <span className="font-mono text-[10px] text-slate-400 mt-1">Cap: 210kg free • On Track</span>
          </div>
        </div>

        {/* Vehicle 3: V03 (Ashok Leyland Dost - CRITICAL BREAKDOWN TARGET) */}
        <div
          onClick={() => openRouteComparisonForIncident('VEHICLE_BREAKDOWN')}
          className="absolute top-48 left-[490px] -translate-x-1/2 -translate-y-1/2 group cursor-pointer z-20"
        >
          <div className="relative flex items-center justify-center">
            <span className="absolute w-12 h-12 rounded-full bg-status-critical/40 animate-ping" />
            <div className="w-9 h-9 rounded-full bg-status-critical text-white flex items-center justify-center shadow-2xl text-[11px] font-bold border-2 border-white animate-pulse">
              V03
            </div>
            <AlertTriangle className="w-3.5 h-3.5 text-status-critical absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow" />
          </div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 flex flex-col bg-slate-950/95 text-white p-2.5 rounded shadow-2xl min-w-[220px] border border-status-critical/50 z-30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-status-critical flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Breakdown Stall
              </span>
              <span className="font-mono text-[10px] text-slate-400">10:30 AM</span>
            </div>
            <span className="text-xs text-slate-200 mt-1">Suresh Meena · Near C-Scheme</span>
            <span className="text-[11px] text-status-warning mt-0.5">3 Orders at risk (#1008, #1012, #1016)</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                openRouteComparisonForIncident('VEHICLE_BREAKDOWN');
              }}
              className="mt-2 w-full py-1 bg-ai-intelligence hover:bg-purple-700 text-white rounded text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors"
            >
              <span>Inspect Re-assignment</span>
            </button>
          </div>
        </div>

        {/* Vehicle 4: V04 (Tata Ace Gold) */}
        <div
          onClick={() => setSelectedVehicleId('V04')}
          className="absolute bottom-40 right-72 -translate-x-1/2 -translate-y-1/2 group cursor-pointer z-10"
        >
          <div className="relative flex items-center justify-center">
            <div className={`w-8 h-8 rounded-full bg-ai-intelligence text-white flex items-center justify-center shadow-lg text-[11px] font-bold border-2 border-white transition-transform ${selectedVehicleId === 'V04' ? 'ring-4 ring-ai-intelligence scale-110' : 'group-hover:scale-110'}`}>
              V04
            </div>
            <Navigation className="w-3 h-3 text-white absolute -top-1 -right-1 bg-slate-900 rounded-full p-0.5" />
          </div>
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col bg-slate-950/95 text-white p-2 rounded shadow-xl min-w-[170px] z-30 border border-slate-800">
            <span className="font-semibold text-xs text-purple-300">V04 • Imran Khan</span>
            <span className="text-[11px] text-slate-300">Raja Park → Malviya Nagar</span>
            <span className="font-mono text-[10px] text-purple-300 mt-1">Absorbed Order #1016</span>
          </div>
        </div>

        {/* Vehicle 5: Standby V05 at Sitapura */}
        <div
          onClick={() => setSelectedVehicleId('V05')}
          className="absolute bottom-16 right-36 -translate-x-1/2 -translate-y-1/2 group cursor-pointer z-10"
        >
          <div className="relative flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-sky-600 text-white flex items-center justify-center shadow-lg text-[11px] font-bold border-2 border-white">
              V05
            </div>
            <Zap className="w-3 h-3 text-white absolute -top-1 -right-1 bg-slate-900 rounded-full p-0.5" />
          </div>
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col bg-slate-950/95 text-white p-2 rounded shadow-xl min-w-[180px] z-30 border border-slate-800">
            <span className="font-semibold text-xs text-sky-400">V05 • Deepak Verma</span>
            <span className="text-[11px] text-slate-300">Sitapura Depot Standby Reserve</span>
            <span className="font-mono text-[10px] text-sky-300 mt-1">2,500kg Capacity Available</span>
          </div>
        </div>

        {/* Map Legend Strip */}
        <div className="absolute bottom-3 left-4 bg-nav-command/90 backdrop-blur-md px-3 py-1.5 rounded-lg flex items-center gap-4 text-white text-[11px] border border-slate-800 pointer-events-none">
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
            <span>AI Dynamic Reroute</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-status-critical/60" />
            <span>Road Closure</span>
          </div>
        </div>

        {/* Selected Vehicle Focus Floating Overlay */}
        {activeVehicle && (
          <div className="absolute top-4 right-4 bg-surface-main/95 backdrop-blur-md border border-border-subtle p-3 rounded-xl shadow-xl w-64 z-30">
            <div className="flex items-center justify-between pb-1 border-b border-border-subtle">
              <span className="text-xs font-bold text-deep-navy">{activeVehicle.name}</span>
              <button
                onClick={() => setSelectedVehicleId(null)}
                className="text-text-muted hover:text-deep-navy text-xs font-bold"
              >
                ✕
              </button>
            </div>
            <div className="mt-2 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-text-secondary">Pilot:</span>
                <span className="font-semibold text-deep-navy">{activeVehicle.driverName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Current Zone:</span>
                <span className="text-deep-navy truncate max-w-[120px]">{activeVehicle.currentZone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Capacity:</span>
                <span className="font-mono">{activeVehicle.currentLoadKg} / {activeVehicle.capacityKg} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Speed:</span>
                <span className="font-mono text-status-success">{activeVehicle.currentSpeedKmh} km/h</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
