import React, { useState } from 'react';
import { useFleet } from '../context/FleetContext';
import {
  Navigation,
  Compass,
  Clock,
  MapPin,
  Phone,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Volume2,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';

export const DriverConsole: React.FC = () => {
  const { openRouteComparisonForIncident } = useFleet();

  const [routeAccepted, setRouteAccepted] = useState<boolean>(false);
  const [arrived, setArrived] = useState<boolean>(false);
  const [alertDismissed, setAlertDismissed] = useState<boolean>(false);

  return (
    <div className="p-4 sm:p-6 max-w-xl mx-auto w-full flex flex-col gap-4 select-none">
      {/* Driver Cockpit Top Card */}
      <div className="bg-surface-main p-4 rounded-2xl border border-border-subtle shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-sm shadow-xs">
            V01
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-bold text-deep-navy">Pilot: Rajesh Kumar</h1>
              <span className="px-1.5 py-0.2 rounded bg-status-success/15 text-status-success font-mono text-[10px] font-bold">
                ON DUTY
              </span>
            </div>
            <p className="text-[11px] text-text-muted">
              Tata 407 SFC (RJ-14-UB-2041) • MargDarshak Dynamic Nav
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container text-xs font-mono text-deep-navy">
            <Clock className="w-3.5 h-3.5 text-text-muted" />
            <span>5.4h Shift Left</span>
          </div>
        </div>
      </div>

      {/* DYNAMIC ROUTE UPDATE ALERT BANNER (If not dismissed) */}
      {!alertDismissed && (
        <div className="bg-ai-intelligence text-white p-4 rounded-2xl shadow-md flex flex-col gap-3 relative overflow-hidden transition-all animate-in fade-in">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-5 h-5 text-white animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded">
                    ROUTE UPDATED
                  </span>
                  <span className="text-[10px] text-purple-200">Dispatcher Sync</span>
                </div>
                <p className="text-xs font-semibold text-white mt-1">
                  Reason: Heavy congestion on Tonk Road + Absorbed urgent medicine payload from stalled unit V03.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 p-2 bg-white/10 rounded-xl text-xs">
            <div className="flex items-center gap-1.5 font-bold text-emerald-300">
              <CheckCircle2 className="w-4 h-4" />
              <span>Saves 12 mins</span>
            </div>
            <div className="flex items-center gap-1.5 text-purple-200">
              <span>+2 Absorbed Consignments</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => {
                setRouteAccepted(true);
                alert('Updated route accepted! Turn-by-turn navigation resequenced.');
              }}
              className="py-2 px-3 rounded-xl bg-white hover:bg-slate-100 text-ai-intelligence text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{routeAccepted ? 'Route Accepted ✓' : 'Accept Route (-12m)'}</span>
            </button>
            <button
              onClick={() => openRouteComparisonForIncident('VEHICLE_BREAKDOWN')}
              className="py-2 px-3 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              <span>View Route Diff</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* TURN-BY-TURN HERO NAVIGATION CARD */}
      <div className="bg-surface-main p-5 rounded-2xl border border-border-subtle shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-primary text-white text-[10px] font-bold">
              NEXT STOP (3 OF 6)
            </span>
            <span className="px-2 py-0.5 rounded-full bg-error-container text-status-critical text-[10px] font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-status-critical animate-ping" />
              Cold Chain (2°–8°C)
            </span>
          </div>
          <span className="font-mono text-xs text-text-muted">Order #1008</span>
        </div>

        {/* Directional Maneuver */}
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center shrink-0 shadow-md">
            <Navigation className="w-7 h-7 transform rotate-45" />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-primary tracking-tight">In 350m</span>
              <span className="text-xs text-text-secondary font-medium">Turn Right</span>
            </div>
            <h2 className="text-base font-bold text-deep-navy truncate mt-0.5">
              Jan Path toward Statue Circle
            </h2>
            <p className="text-xs text-text-muted truncate mt-0.5">
              Apex Healthcare • C-Scheme Sector 4, Jaipur
            </p>
          </div>
        </div>

        {/* Big Glanceable Driver Metrics */}
        <div className="grid grid-cols-3 gap-2 p-3 bg-surface-container-low rounded-xl text-center">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-text-muted">ETA Arrival</span>
            <span className="text-base font-bold font-mono text-deep-navy mt-0.5">12:15 PM</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-text-muted">Time to Dest</span>
            <span className="text-base font-bold font-mono text-status-success mt-0.5">14 min</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-text-muted">Distance</span>
            <span className="text-base font-bold font-mono text-deep-navy mt-0.5">4.8 km</span>
          </div>
        </div>

        {/* Quick Driver Action Buttons */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <button
            onClick={() => alert('Audio navigation prompt: "In 350 meters, turn right on Jan Path toward Statue Circle."')}
            className="py-3 px-2 rounded-xl bg-primary hover:bg-secondary text-white text-xs font-semibold shadow-xs flex flex-col items-center justify-center gap-1 transition-colors"
          >
            <Volume2 className="w-5 h-5" />
            <span>Voice GPS</span>
          </button>

          <a
            href="tel:+919829044102"
            className="py-3 px-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-deep-navy text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-colors"
          >
            <Phone className="w-5 h-5 text-secondary" />
            <span>Call Clinic</span>
          </a>

          <button
            onClick={() => {
              setArrived(true);
              alert('Stop marked arrived! Delivery signature requested.');
            }}
            className="py-3 px-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-status-success text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-colors"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>{arrived ? 'Arrived ✓' : 'Mark Arrived'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
