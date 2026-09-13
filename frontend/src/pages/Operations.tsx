import React from 'react';
import { useFleet } from '../context/FleetContext';
import { useTranslation } from '../context/LanguageContext';
import { StatCard } from '../components/ui/StatCard';
import { Badge } from '../components/ui/Badge';
import { DisruptionType } from '../types/event';
import {
  Radio,
  AlertTriangle,
  RefreshCw,
  Zap,
  Clock,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Truck,
  Activity,
  ArrowRight,
} from 'lucide-react';

export const Operations: React.FC = () => {
  const {
    vehicles,
    orders,
    events,
    metrics,
    isOptimising,
    triggerDisruption,
    openRouteComparisonForIncident,
    setSimulationModalOpen,
  } = useFleet();
  const { t } = useTranslation();

  const atRiskOrders = orders.filter((o) => o.slaStatus === 'AT_RISK' || o.slaStatus === 'LATE');

  // Deduplicate events to eliminate identical repeated incident logs
  const distinctEvents = React.useMemo(() => {
    const seen = new Set<string>();
    const list: typeof events = [];
    for (const evt of events) {
      const cleanDesc = (evt.description || '').trim().toLowerCase();
      const cleanTitle = (evt.title || '').trim().toLowerCase();
      const sig = cleanDesc ? `${evt.type}|${cleanDesc}` : `${evt.type}|${cleanTitle}`;
      if (!seen.has(sig)) {
        seen.add(sig);
        list.push(evt);
      }
    }
    return list;
  }, [events]);

  const getCategoryBadge = (type: DisruptionType, severity: string) => {
    switch (type) {
      case 'VEHICLE_BREAKDOWN':
      case 'CASCADING_BREAKDOWN':
        return {
          label: t('events.VEHICLE_BREAKDOWN', 'BREAKDOWN'),
          bg: 'bg-status-critical text-white',
        };
      case 'TRAFFIC':
        return {
          label: t('events.TRAFFIC', 'TRAFFIC'),
          bg: 'bg-amber-600 text-white',
        };
      case 'WEATHER':
        return {
          label: t('events.WEATHER', 'WEATHER'),
          bg: 'bg-sky-600 text-white',
        };
      case 'URGENT_ORDER':
        return {
          label: t('events.URGENT_ORDER', 'PRIORITY ORDER'),
          bg: 'bg-indigo-600 text-white',
        };
      case 'ROAD_CLOSURE':
        return {
          label: t('events.ROAD_CLOSURE', 'ROAD CLOSURE'),
          bg: 'bg-orange-600 text-white',
        };
      default:
        return {
          label: severity || 'INCIDENT',
          bg: 'bg-slate-700 text-white',
        };
    }
  };

  return (
    <div className="p-6 max-w-[1720px] mx-auto w-full flex flex-col gap-5 select-none">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-main p-5 rounded-2xl border border-border-subtle shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-mono text-[11px] font-bold">
              {t('nav.operations')}
            </span>
            <span className="text-xs font-medium text-text-muted">• Telemetry Stream 100% Synced</span>
          </div>
          <h1 className="text-xl font-bold text-deep-navy tracking-tight mt-1">
            {t('nav.operations')} Command Center
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Real-time incident ingestion, solver execution telemetry, and dynamic dispatch audit log
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setSimulationModalOpen(true)}
            className="h-8 px-3.5 rounded-lg bg-surface-container-high hover:bg-surface-container text-deep-navy text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-ai-intelligence" />
            <span>{t('header.simulateDisruption')}</span>
          </button>

          <button
            onClick={() => triggerDisruption('TRAFFIC')}
            disabled={isOptimising}
            className="h-8 px-3.5 rounded-lg bg-primary-container hover:bg-primary text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isOptimising ? 'animate-spin' : ''}`} />
            <span>{t('dashboard.runReoptimisation')}</span>
          </button>
        </div>
      </div>

      {/* Operational Telemetry Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label={t('dashboard.disrupted')}
          value={distinctEvents.filter((e) => !e.resolved).length}
          badge={distinctEvents.some((e) => e.severity === 'CRITICAL') ? t('dashboard.criticalIncidents', 'Critical Incidents') : t('dashboard.monitoring', 'Monitoring')}
          badgeType={distinctEvents.some((e) => e.severity === 'CRITICAL') ? 'danger' : 'warning'}
          trendText="Road & Mechanical"
          trendDirection="neutral"
          icon={<AlertTriangle className="w-3.5 h-3.5" />}
        />

        <StatCard
          label="Solver Re-runs Today"
          value={metrics.reoptimisationsCount}
          badge="Deterministic"
          badgeType="info"
          trendText="OR-Tools v9.6"
          trendDirection="up"
          icon={<RefreshCw className="w-3.5 h-3.5" />}
        />

        <StatCard
          label={t('dashboard.atRisk')}
          value={atRiskOrders.length}
          badge={atRiskOrders.length > 0 ? t('dashboard.urgentAttention', 'Urgent Attention') : t('dashboard.protected', 'Protected')}
          badgeType={atRiskOrders.length > 0 ? 'warning' : 'success'}
          trendText="Jaipur West Corridor"
          trendDirection="neutral"
          icon={<Clock className="w-3.5 h-3.5" />}
        />

        <StatCard
          label={t('dashboard.kpiPayloadSat')}
          value={`${metrics.fleetUtilizationPct}%`}
          badge={t('dashboard.safeOperatingZone', 'Safe Operating Zone')}
          badgeType="success"
          trendText="4,120 kg allocated"
          trendDirection="up"
          progressPct={metrics.fleetUtilizationPct}
          progressColor="bg-primary-container"
          icon={<Truck className="w-3.5 h-3.5" />}
        />
      </div>

      {/* Main Operations Split (Incidents & Solver Log) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left 7 cols: Active Operational Events & Detailed Incident Audit */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="bg-surface-main p-5 rounded-2xl border border-border-subtle shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-status-critical animate-pulse" />
                <h2 className="text-sm font-bold text-deep-navy">{t('dashboard.incidentStream')}</h2>
              </div>
              <span className="text-[11px] text-text-muted font-mono">{distinctEvents.length} {t('dashboard.loggedEvents', 'Logged Events')}</span>
            </div>

            <div className="space-y-3 max-h-[660px] overflow-y-auto pr-1">
              {distinctEvents.length === 0 ? (
                <div className="p-8 text-center text-xs text-text-muted bg-surface-container-low rounded-xl border border-border-subtle">
                  No active incidents recorded. Fleet operations normal.
                </div>
              ) : (
                distinctEvents.map((evt) => {
                  const badge = getCategoryBadge(evt.type, evt.severity);
                  return (
                    <div
                      key={evt.id}
                      onClick={() => openRouteComparisonForIncident(evt.type)}
                      className="p-4 rounded-xl bg-surface-container-low hover:bg-surface-container border border-border-subtle transition-colors cursor-pointer flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${badge.bg}`}>
                            {badge.label}
                          </span>
                          <span className="text-xs font-bold text-deep-navy">{evt.title}</span>
                        </div>
                        <span className="font-mono text-[11px] text-text-muted">{evt.timestamp}</span>
                      </div>

                      <p className="text-xs text-text-secondary leading-relaxed">{evt.description}</p>

                      <div className="flex items-center justify-between pt-2 border-t border-border-subtle/70 text-xs">
                        <div className="flex items-center gap-3 text-text-muted">
                          <span>Affected Vehicles: <strong className="text-deep-navy font-mono">{(evt.affectedVehicleIds || []).join(', ') || 'Corridor wide'}</strong></span>
                          <span>{t('dashboard.delay')}: <strong className="text-status-critical font-mono">+{evt.impactDelayMinutes} min</strong></span>
                        </div>
                        <button className="text-primary font-semibold flex items-center gap-1 hover:underline cursor-pointer">
                          <span>{t('dashboard.viewMathematicalDelta')}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right 5 cols: Decision Audit Sequence & Hard Constraints Tree */}
        <div className="lg:col-span-5 flex flex-col gap-4 sticky top-6">
          <div className="bg-surface-main p-5 rounded-2xl border border-border-subtle shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-ai-intelligence" />
                <h2 className="text-sm font-bold text-deep-navy">Deterministic Solver Execution Audit</h2>
              </div>
              <span className="px-2 py-0.5 rounded bg-purple-100 text-ai-intelligence text-[10px] font-bold">
                AUDITABLE
              </span>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed">
              Every route transition in MargDarshak is mathematically proven against customer SLAs, driver hours, and capacity thresholds.
            </p>

            <div className="mt-2 space-y-3 relative pl-4 before:content-[''] before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-surface-container">
              <div className="relative flex flex-col leading-tight">
                <span className="absolute -left-4 top-1 w-2 h-2 rounded-full bg-status-critical" />
                <span className="text-xs font-semibold text-deep-navy">10:30 AM — Vehicle V03 Breakdown Signal</span>
                <span className="text-[11px] text-text-muted mt-0.5">
                  Alternator pressure drop detected on C-Scheme bypass. Telemetry ID #7781 ingested.
                </span>
              </div>

              <div className="relative flex flex-col leading-tight">
                <span className="absolute -left-4 top-1 w-2 h-2 rounded-full bg-ai-intelligence" />
                <span className="text-xs font-semibold text-deep-navy">10:31 AM — Spatial & Capacity Filter</span>
                <span className="text-[11px] text-text-muted mt-0.5">
                  Vehicles V01 and V04 selected for order rescue. Cold-chain eligibility verified.
                </span>
              </div>

              <div className="relative flex flex-col leading-tight">
                <span className="absolute -left-4 top-1 w-2 h-2 rounded-full bg-status-success" />
                <span className="text-xs font-semibold text-deep-navy">10:32 AM — Mobile Dispatch Handshake</span>
                <span className="text-[11px] text-text-muted mt-0.5">
                  Updated waypoint turn-by-turn routes pushed to Pilot Rajesh Kumar & Imran Khan tablets.
                </span>
              </div>
            </div>

            <div className="mt-4 p-3 rounded-xl bg-purple-50/70 border border-purple-200 text-xs flex items-center justify-between">
              <span className="text-purple-950 font-medium">Have questions about solver decisions?</span>
              <button
                onClick={() => openRouteComparisonForIncident()}
                className="font-bold text-ai-intelligence hover:underline cursor-pointer"
              >
                Inspect Reasoner
              </button>
            </div>
          </div>

          {/* Active System Constraints & Safety Thresholds Card */}
          <div className="bg-surface-main p-4 rounded-2xl border border-border-subtle shadow-xs flex flex-col gap-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary-container" />
                <h3 className="text-xs font-bold text-deep-navy">Active Safety & SLA Invariants</h3>
              </div>
              <span className="text-[10px] font-bold text-status-success bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                100% ENFORCED
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-surface-container-low border border-border-subtle flex items-center justify-between">
                <div>
                  <div className="font-semibold text-deep-navy text-[11px]">Jaipur Municipal Driver Window</div>
                  <div className="text-[10px] text-text-muted">Max 8.0 hrs continuous shift ceiling</div>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-status-success font-mono font-bold text-[10px]">
                  COMPLIANT
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-surface-container-low border border-border-subtle flex items-center justify-between">
                <div>
                  <div className="font-semibold text-deep-navy text-[11px]">Cold-Chain Pharma Envelope</div>
                  <div className="text-[10px] text-text-muted">Active temperature monitoring (2°C – 8°C)</div>
                </div>
                <span className="px-2 py-0.5 rounded bg-blue-100 text-primary-container font-mono font-bold text-[10px]">
                  LOCKED (4.2°C)
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-surface-container-low border border-border-subtle flex items-center justify-between">
                <div>
                  <div className="font-semibold text-deep-navy text-[11px]">Fleet Payload Headroom</div>
                  <div className="text-[10px] text-text-muted">Maximum allowable load factor 85%</div>
                </div>
                <span className="px-2 py-0.5 rounded bg-purple-100 text-ai-intelligence font-mono font-bold text-[10px]">
                  OPTIMAL
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
