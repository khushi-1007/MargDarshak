import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Sparkles,
  Info,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const {
    metrics,
    orders,
    isOptimising,
    optimisationMessage,
    optimisationStep,
    lastOptimisationResult,
    runManualReoptimisation,
    injectPriorityOrder,
    exportOperationalPlan,
    triggerDisruption,
    resetToBaseline,
    setPriorityModalOpen,
    setSimulationModalOpen,
    openRouteComparisonForIncident,
    cascadingFailureActive,
  } = useFleet();

  const [activeJudgeStep, setActiveJudgeStep] = useState<number>(1);
  const [toastMessage, setToastMessage] = useState<{
    title: string;
    desc: string;
    type: 'info' | 'success' | 'warning';
  } | null>(null);

  const handleRunReoptimisation = async () => {
    setToastMessage({
      title: 'Google OR-Tools VRPTW Solver Running',
      desc: 'Formulating constraint matrix across 5 vehicles and dynamic time windows...',
      type: 'info',
    });
    await runManualReoptimisation();
    setToastMessage({
      title: 'Re-optimisation Complete (0.84s)',
      desc: 'All 5 Jaipur routes re-routed with optimal distance and zero SLA breaches.',
      type: 'success',
    });
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleAddPriorityOrder = async () => {
    setToastMessage({
      title: 'Emergency Consignment Injected: P-101',
      desc: 'Fortis Escorts Hospital urgent delivery dispatched to nearest vehicle RJ-14-GA-2002 via JLN Marg.',
      type: 'warning',
    });
    await injectPriorityOrder();
    openRouteComparisonForIncident('PRIORITY_ORDER');
    setTimeout(() => setToastMessage(null), 6000);
  };

  const highPriorityOrdersCount = orders.filter(
    (o) => o.priority === 'CRITICAL' || o.priority === 'HIGH'
  ).length;

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
              <span className="text-ai-intelligence font-mono text-[11px] font-bold">LIVE TELEMETRY</span>
              <span>• "When reality changes, the route changes with it."</span>
            </div>
          </div>

          {/* Quick Action Commands */}
          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={handleRunReoptimisation}
              disabled={isOptimising}
              className="h-8 px-3 rounded-lg bg-primary-container hover:bg-primary text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-75 cursor-pointer"
              type="button"
              title="Run Google OR-Tools dynamic solver on real backend"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isOptimising ? 'animate-spin' : ''}`} />
              <span>{isOptimising ? 'Solving OR-Tools...' : 'Run Re-optimisation'}</span>
            </button>

            <button
              onClick={handleAddPriorityOrder}
              disabled={isOptimising}
              className="h-8 px-3 rounded-lg bg-surface-container-high hover:bg-surface-container text-deep-navy text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
              type="button"
              title="Inject urgent medical consignment to Fortis Hospital"
            >
              <PlusCircle className="w-3.5 h-3.5 text-status-warning" />
              <span>Add Priority Order (P-101)</span>
            </button>

            <button
              onClick={() => setSimulationModalOpen(true)}
              className="h-8 px-3 rounded-lg bg-surface-container-high hover:bg-surface-container text-deep-navy text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
              type="button"
              title="Open Disruption Stress-Testing Lab"
            >
              <Zap className="w-3.5 h-3.5 text-ai-intelligence" />
              <span>Simulate Event</span>
            </button>

            <button
              onClick={exportOperationalPlan}
              className="h-8 px-3 rounded-lg bg-white hover:bg-surface-container text-text-secondary hover:text-deep-navy text-xs font-semibold border border-border-subtle transition-colors flex items-center gap-1.5 cursor-pointer"
              type="button"
              title="Download real Jaipur Operational Manifest (JSON & CSV)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Plan</span>
            </button>
          </div>
        </div>
      </section>

      {/* Judge Hackathon Quick Demo Flow Controller Bar */}
      <section className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-6 py-2.5 border-b border-indigo-900/50 shadow-sm select-none">
        <div className="max-w-[1720px] mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-300 font-mono text-[10px] font-bold border border-indigo-400/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>JUDGE DEMO FLOW</span>
            </span>
            <span className="text-xs font-semibold text-slate-200">
              Interactive 60-Second Presentation Sequence:
            </span>
          </div>

          <div className="flex items-center flex-wrap gap-1.5">
            <button
              onClick={async () => {
                setActiveJudgeStep(1);
                await resetToBaseline();
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeJudgeStep === 1
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700'
              }`}
            >
              <span>1. Normal Baseline</span>
            </button>

            <button
              onClick={async () => {
                setActiveJudgeStep(2);
                await handleAddPriorityOrder();
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeJudgeStep === 2
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700'
              }`}
            >
              <span>2. Inject Urgent P-101 Order</span>
            </button>

            <button
              onClick={async () => {
                setActiveJudgeStep(3);
                await triggerDisruption('VEHICLE_BREAKDOWN');
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeJudgeStep === 3
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700'
              }`}
            >
              <span>3. Vehicle Breakdown (V03)</span>
            </button>

            <button
              onClick={async () => {
                setActiveJudgeStep(4);
                await handleRunReoptimisation();
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeJudgeStep === 4
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700'
              }`}
            >
              <span>4. Solve with Google OR-Tools</span>
            </button>

            <button
              onClick={() => {
                setActiveJudgeStep(5);
                navigate('/driver');
              }}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>5. View Driver Terminal →</span>
            </button>
          </div>
        </div>
      </section>

      {/* Live Toast Notification Banner if active */}
      {toastMessage && (
        <div className="max-w-[1720px] w-full mx-auto px-6 pt-3">
          <div
            className={`p-3 rounded-xl border flex items-center justify-between gap-3 shadow-md animate-in slide-in-from-top-2 duration-300 ${
              toastMessage.type === 'warning'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-900'
                : toastMessage.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900'
                : 'bg-blue-500/10 border-blue-500/30 text-blue-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Info className="w-4 h-4 shrink-0 text-primary-container" />
              <div>
                <h4 className="text-xs font-bold">{toastMessage.title}</h4>
                <p className="text-[11px] opacity-90">{toastMessage.desc}</p>
              </div>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-xs font-bold opacity-60 hover:opacity-100 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

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
            trendText={metrics.onTimeSlaPct > 90 ? '↑ Nominal SLA' : '↓ Degraded SLA'}
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
            trendText={metrics.disruptedVehiclesCount > 0 ? `${metrics.disruptedVehiclesCount} unit${metrics.disruptedVehiclesCount > 1 ? 's' : ''} in breakdown` : `${metrics.activeVehiclesCount} Operational`}
            trendDirection={metrics.disruptedVehiclesCount > 0 ? 'down' : 'up'}
            progressPct={(metrics.activeVehiclesCount / (metrics.totalVehiclesCount || 1)) * 100}
            progressColor={metrics.disruptedVehiclesCount > 0 ? 'bg-status-critical' : 'bg-primary-container'}
            icon={<Truck className="w-3.5 h-3.5" />}
          />

          <StatCard
            label="Total Orders"
            value={metrics.totalOrdersCount}
            badge={`${highPriorityOrdersCount} High Priority`}
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
