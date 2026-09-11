import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  RefreshCw,
  AlertTriangle,
  Bell,
  User,
  Zap,
  CheckCircle2,
  Smartphone,
} from 'lucide-react';
import { useFleet } from '../../context/FleetContext';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const {
    isOptimising,
    cascadingFailureActive,
    setSimulationModalOpen,
    openRouteComparisonForIncident,
    triggerDisruption,
    events,
    activeDriver,
    wsStatus,
  } = useFleet();

  const criticalCount = events.filter((e) => e.severity === 'CRITICAL' && !e.resolved).length;

  return (
    <header className="fixed top-0 left-60 right-0 h-16 bg-surface-main/95 backdrop-blur border-b border-border-subtle z-40 px-4 sm:px-6 select-none">
      <div className="h-16 w-full flex items-center justify-between gap-3 min-w-0">
        {/* Hub & Context Breadcrumb */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex flex-col leading-tight">
            <div className="flex items-center gap-1.5 text-xs text-text-secondary whitespace-nowrap">
              <span className="font-bold text-deep-navy">MargDarshak</span>
              <span>•</span>
              <span className="font-semibold text-deep-navy hidden sm:inline">Rajasthan Logistics</span>
              <span className="hidden sm:inline">•</span>
              <span className="text-text-muted">Jaipur Hub</span>
            </div>
            <span className="text-[11px] text-text-muted font-mono hidden md:inline">Zones North, West & South-East</span>
          </div>
        </div>

        {/* Global Search Bar (compact and collapsible) */}
        <div className="hidden xl:block max-w-[200px] 2xl:max-w-xs w-full min-w-0">
          <div className="relative flex items-center">
            <Search className="absolute left-2.5 text-text-secondary w-3.5 h-3.5" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full h-8 pl-8 pr-9 rounded-lg border border-border-subtle bg-bg-canvas text-deep-navy placeholder:text-text-muted text-xs focus:outline-none focus:ring-2 focus:ring-primary-container focus:bg-white transition-all"
            />
            <kbd className="absolute right-2 px-1.5 py-0.5 rounded border border-border-subtle bg-white font-mono text-[9px] text-text-muted shadow-xs">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Quick Actions & Dispatch Controls (Always Fully Visible) */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Live Sync Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded bg-surface-container-low border border-border-subtle whitespace-nowrap" title={`WebSocket Status: ${wsStatus}`}>
            <span className={`h-2 w-2 rounded-full ${wsStatus === 'CONNECTED' ? 'bg-status-success animate-ping' : wsStatus === 'RECONNECTING' ? 'bg-amber-500 animate-pulse' : 'bg-red-500'}`} />
            <span className={`text-[10px] font-semibold uppercase tracking-wider ${wsStatus === 'CONNECTED' ? 'text-status-success' : wsStatus === 'RECONNECTING' ? 'text-amber-600' : 'text-red-500'}`}>
              {wsStatus === 'CONNECTED' ? 'LIVE WS SYNC' : wsStatus === 'RECONNECTING' ? 'RECONNECTING' : 'WS OFFLINE'}
            </span>
          </div>

          {/* Critical Alerts Pill */}
          {criticalCount > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-error-container text-status-critical text-xs font-semibold whitespace-nowrap">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>{criticalCount} Critical</span>
            </div>
          )}

          {/* Quick Switcher to Driver App */}
          <button
            onClick={() => navigate('/driver')}
            className="h-8 px-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-primary-container font-semibold text-xs transition-colors flex items-center gap-1.5 border border-blue-200 shadow-xs whitespace-nowrap"
            type="button"
            title="Open Driver Dashboard (Rajesh - V01)"
          >
            <Smartphone className="w-3.5 h-3.5 text-primary shrink-0" />
            <span>Driver App</span>
          </button>

          {/* Simulate Event CTA */}
          <button
            onClick={() => setSimulationModalOpen(true)}
            className="h-8 px-2.5 rounded-lg bg-surface-container-high hover:bg-surface-container text-deep-navy text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap"
            type="button"
          >
            <Zap className="w-3.5 h-3.5 text-ai-intelligence shrink-0" />
            <span className="hidden lg:inline">Simulate Disruption</span>
            <span className="lg:hidden">Simulate</span>
          </button>

          {/* Run Re-optimisation Action */}
          <button
            onClick={() => triggerDisruption('TRAFFIC')}
            disabled={isOptimising}
            className="h-8 px-3 rounded-lg bg-primary-container hover:bg-primary text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-75 whitespace-nowrap"
            type="button"
          >
            <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${isOptimising ? 'animate-spin' : ''}`} />
            <span>{isOptimising ? 'Solving...' : 'Re-optimise'}</span>
          </button>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => openRouteComparisonForIncident()}
              aria-label="Notifications"
              className="p-1.5 rounded-lg hover:bg-surface-container text-text-secondary hover:text-deep-navy transition-colors"
            >
              <Bell className="w-4 h-4" />
            </button>
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-status-critical text-white font-mono text-[9px] font-bold flex items-center justify-center">
              {events.length}
            </span>
          </div>

          <div className="h-5 w-px bg-border-subtle" />

          {/* Dispatcher Profile */}
          <div className="flex items-center gap-2">
            <div className="flex flex-col text-right leading-tight hidden 2xl:flex whitespace-nowrap">
              <span className="text-xs font-semibold text-deep-navy">Rajesh Sharma</span>
              <span className="text-[10px] text-text-muted">Chief Dispatcher</span>
            </div>
            <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center shrink-0 font-semibold text-xs shadow-xs" title="Rajesh Sharma (Chief Dispatcher)">
              <User className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
