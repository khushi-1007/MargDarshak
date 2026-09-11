import React from 'react';
import { useFleet } from '../context/FleetContext';
import { StatCard } from '../components/ui/StatCard';
import { FleetMap } from '../components/map/FleetMap';
import { ActiveRoutesTable } from '../components/routes/ActiveRoutesTable';
import { EventStream } from '../components/events/EventStream';
import { AIInsightCard } from '../components/ai/AIInsightCard';
import {
  DollarSign,
  Clock,
  Truck,
  Package,
  Route as RouteIcon,
  RefreshCw,
  PlusCircle,
  Zap,
  Download,
  CheckCircle,
  AlertTriangle,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const {
    metrics,
    isOptimising,
    triggerDisruption,
    setPriorityModalOpen,
    setSimulationModalOpen,
    openRouteComparisonForIncident,
    cascadingFailureActive,
  } = useFleet();

  return (
    <div className="flex flex-col w-full min-h-screen">
      {/* Operational Sub-Header & Command Bar */}
      <section className="bg-surface-main px-6 py-3.5 border-b border-border-subtle shadow-xs select-none">
        <div className="max-w-[1720px] mx-auto flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-status-success animate-pulse" />
              <h1 className="text-base font-bold text-deep-navy tracking-tight">
                MargDarshak Control Tower — Jaipur Real-Time Operations
              </h1>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-surface-container text-secondary text-xs font-medium">
              <span className="text-ai-intelligence font-mono text-[11px] font-bold">PROMPT #2</span>
              <span>• "When reality changes, the route changes with it."</span>
            </div>
          </div>

          {/* Quick Action Commands */}
          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={() => triggerDisruption('TRAFFIC')}
              disabled={isOptimising}
              className="h-8 px-3 rounded-lg bg-primary-container hover:bg-primary text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-75"
              type="button"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isOptimising ? 'animate-spin' : ''}`} />
              <span>Run Re-optimisation</span>
            </button>

            <button
              onClick={() => triggerDisruption('URGENT_ORDER')}
              className="h-8 px-3 rounded-lg bg-surface-container-high hover:bg-surface-container text-deep-navy text-xs font-semibold transition-colors flex items-center gap-1.5"
              type="button"
            >
              <PlusCircle className="w-3.5 h-3.5 text-status-warning" />
              <span>Add Priority Order (P-101)</span>
            </button>

            <button
              onClick={() => setSimulationModalOpen(true)}
              className="h-8 px-3 rounded-lg bg-surface-container-high hover:bg-surface-container text-deep-navy text-xs font-semibold transition-colors flex items-center gap-1.5"
              type="button"
            >
              <Zap className="w-3.5 h-3.5 text-ai-intelligence" />
              <span>Simulate Event</span>
            </button>

            <button
              onClick={() => alert('Exporting Jaipur Operational Manifest (PDF & GeoJSON)...')}
              className="h-8 px-3 rounded-lg bg-white hover:bg-surface-container text-text-secondary hover:text-deep-navy text-xs font-semibold border border-border-subtle transition-colors flex items-center gap-1.5"
              type="button"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Plan</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <div className="max-w-[1720px] w-full mx-auto px-6 py-4 flex flex-col gap-4">
        {/* 5 High-Density KPI Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <StatCard
            label="Operating Cost"
            value={`₹${metrics.totalOperatingCostInr.toLocaleString()}`}
            badge={`₹${metrics.savedCostInr} Saved`}
            badgeType="success"
            trendText="15% fuel eff."
            trendDirection="up"
            progressPct={78}
            progressColor="bg-ai-intelligence"
            icon={<DollarSign className="w-3.5 h-3.5" />}
          />

          <StatCard
            label="On-Time SLA"
            value={`${metrics.onTimeSlaPct}%`}
            badge={metrics.onTimeSlaPct > 90 ? 'Nominal' : 'At Risk'}
            badgeType={metrics.onTimeSlaPct > 90 ? 'success' : 'danger'}
            trendText={metrics.onTimeSlaPct > 90 ? '↑ 4% vs last run' : '↓ Degraded'}
            trendDirection={metrics.onTimeSlaPct > 90 ? 'up' : 'down'}
            progressPct={metrics.onTimeSlaPct}
            progressColor={metrics.onTimeSlaPct > 90 ? 'bg-status-success' : 'bg-status-critical'}
            icon={<Clock className="w-3.5 h-3.5" />}
          />

          <StatCard
            label="Active Fleet"
            value={`${metrics.activeVehiclesCount} / ${metrics.totalVehiclesCount}`}
            badge={metrics.disruptedVehiclesCount > 0 ? `${metrics.disruptedVehiclesCount} Disrupted` : '100% Deployed'}
            badgeType={metrics.disruptedVehiclesCount > 0 ? 'danger' : 'success'}
            trendText={metrics.disruptedVehiclesCount > 0 ? 'V03 near C-Scheme' : '4 Operational'}
            trendDirection={metrics.disruptedVehiclesCount > 0 ? 'down' : 'up'}
            progressPct={(metrics.activeVehiclesCount / metrics.totalVehiclesCount) * 100}
            progressColor={metrics.disruptedVehiclesCount > 0 ? 'bg-status-critical' : 'bg-primary-container'}
            icon={<Truck className="w-3.5 h-3.5" />}
          />

          <StatCard
            label="Total Orders"
            value={metrics.totalOrdersCount}
            badge="3 High Priority"
            badgeType="warning"
            trendText={`+${metrics.pendingPickupCount} in queue`}
            trendDirection="neutral"
            progressPct={85}
            progressColor="bg-primary-container"
            icon={<Package className="w-3.5 h-3.5" />}
          />

          <StatCard
            label="Total Distance"
            value={`${metrics.totalDistanceKm} km`}
            badge="Optimised"
            badgeType="info"
            trendText="↓ 18% vs manual"
            trendDirection="up"
            progressPct={72}
            progressColor="bg-secondary-container"
            icon={<RouteIcon className="w-3.5 h-3.5" />}
          />
        </div>

        {/* Centerpiece Split Layout (70% Interactive Cartographic Hub + 30% Live Operations & AI Layer) */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
          {/* 70% Cartographic Telemetry Canvas */}
          <div className="xl:col-span-8 flex flex-col gap-2.5">
            <FleetMap />

            {/* Quick Status Sub-Strip for Dispatch Clusters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="bg-surface-main p-2.5 rounded-xl border border-border-subtle flex items-center justify-between">
                <div className="flex flex-col leading-tight">
                  <span className="text-[11px] text-text-muted">North Sector SLA</span>
                  <span className="text-xs font-bold text-deep-navy font-mono mt-0.5">98.2%</span>
                </div>
                <CheckCircle className="w-4 h-4 text-status-success" />
              </div>

              <div className="bg-surface-main p-2.5 rounded-xl border border-border-subtle flex items-center justify-between">
                <div className="flex flex-col leading-tight">
                  <span className="text-[11px] text-text-muted">Central & C-Scheme</span>
                  <span className="text-xs font-bold text-status-critical font-mono mt-0.5">
                    {cascadingFailureActive ? 'Severe Stall' : 'Re-routed (Saved)'}
                  </span>
                </div>
                <AlertTriangle className="w-4 h-4 text-status-critical" />
              </div>

              <div className="bg-surface-main p-2.5 rounded-xl border border-border-subtle flex items-center justify-between">
                <div className="flex flex-col leading-tight">
                  <span className="text-[11px] text-text-muted">South Industrial</span>
                  <span className="text-xs font-bold text-deep-navy font-mono mt-0.5">Nominal</span>
                </div>
                <CheckCircle className="w-4 h-4 text-status-info" />
              </div>

              <div className="bg-surface-main p-2.5 rounded-xl border border-border-subtle flex items-center justify-between">
                <div className="flex flex-col leading-tight">
                  <span className="text-[11px] text-text-muted">Weather Ingestion</span>
                  <span className="text-xs font-bold text-status-warning font-mono mt-0.5">Rain: 2 PM</span>
                </div>
                <Clock className="w-4 h-4 text-status-warning" />
              </div>
            </div>
          </div>

          {/* 30% Live Operations Hub & AI Diagnostic Layer */}
          <div className="xl:col-span-4 flex flex-col gap-3">
            <AIInsightCard />
            <EventStream />
          </div>
        </div>

        {/* Bottom Section: Active Routes Manifest Table & Reassignment Audit */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
          <div className="xl:col-span-7">
            <ActiveRoutesTable />
          </div>

          {/* Incident Reassignment Ledger (Right 5 cols) */}
          <div className="xl:col-span-5 bg-surface-main p-4 rounded-xl border border-border-subtle shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2.5 border-b border-border-subtle">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-deep-navy">
                    Incident Order Reassignment Audit
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded bg-purple-100 text-ai-intelligence text-[10px] font-bold">
                  OR-Tools Matched
                </span>
              </div>

              <div className="mt-2.5 space-y-2">
                {/* Order 1008 */}
                <div className="p-2.5 rounded-xl bg-surface-container-low border border-border-subtle flex items-center justify-between">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-deep-navy text-xs">#1008</span>
                      <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 text-[10px] font-bold">
                        Medical Supplies
                      </span>
                    </div>
                    <span className="text-[11px] text-text-secondary mt-0.5">
                      Apex Healthcare • C-Scheme Sector 4
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-ai-intelligence text-xs">V03 → V01</div>
                    <span className="text-[10px] text-status-success font-semibold flex items-center gap-0.5 justify-end">
                      <CheckCircle className="w-3 h-3" /> SLA Preserved (12:15 PM)
                    </span>
                  </div>
                </div>

                {/* Order 1012 */}
                <div className="p-2.5 rounded-xl bg-surface-container-low border border-border-subtle flex items-center justify-between">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-deep-navy text-xs">#1012</span>
                      <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-900 text-[10px] font-semibold">
                        Cold Storage Frozen
                      </span>
                    </div>
                    <span className="text-[11px] text-text-secondary mt-0.5">
                      Raj Cold Storage • Bais Godam
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-ai-intelligence text-xs">V03 → V01</div>
                    <span className="text-[10px] text-status-success font-semibold flex items-center gap-0.5 justify-end">
                      <CheckCircle className="w-3 h-3" /> Delay -28 min
                    </span>
                  </div>
                </div>

                {/* Order 1016 */}
                <div className="p-2.5 rounded-xl bg-surface-container-low border border-border-subtle flex items-center justify-between">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-deep-navy text-xs">#1016</span>
                      <span className="px-1.5 py-0.2 rounded bg-rose-100 text-status-critical text-[10px] font-semibold">
                        Gourmet Perishables
                      </span>
                    </div>
                    <span className="text-[11px] text-text-secondary mt-0.5">
                      Civil Lines Gourmet • Jacob Road
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-ai-intelligence text-xs">V03 → V04</div>
                    <span className="text-[10px] text-status-success font-semibold flex items-center gap-0.5 justify-end">
                      <CheckCircle className="w-3 h-3" /> Delay -14 min
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-border-subtle flex items-center justify-between text-[11px] text-text-muted">
              <span>Capacity delta absorbed: 220kg + 110kg</span>
              <button
                onClick={() => openRouteComparisonForIncident('VEHICLE_BREAKDOWN')}
                className="text-primary font-semibold hover:underline flex items-center gap-0.5"
              >
                <span>View Mathematical Delta</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
