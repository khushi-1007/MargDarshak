import React from 'react';
import { useFleet } from '../context/FleetContext';
import { StatCard } from '../components/ui/StatCard';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  Route as RouteIcon,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
} from 'lucide-react';

export const Analytics: React.FC = () => {
  const { metrics, routes } = useFleet();

  const plannedVsActualData = [
    { corridor: 'North (Vidhyadhar)', plannedKm: 31.8, actualKm: 33.2, plannedMins: 170, actualMins: 175 },
    { corridor: 'Central (C-Scheme)', plannedKm: 18.2, actualKm: 24.6, plannedMins: 110, actualMins: 145 },
    { corridor: 'South-West (Mansarovar)', plannedKm: 24.6, actualKm: 28.8, plannedMins: 145, actualMins: 165 },
    { corridor: 'East (Raja Park/Malviya)', plannedKm: 27.5, actualKm: 31.7, plannedMins: 155, actualMins: 168 },
    { corridor: 'Industrial (Sitapura)', plannedKm: 14.0, actualKm: 15.2, plannedMins: 60, actualMins: 65 },
  ];

  const costBreakdownData = [
    { day: 'Mon', fuel: 4800, wages: 3600, tolls: 450, penalties: 0 },
    { day: 'Tue', fuel: 5100, wages: 3800, tolls: 480, penalties: 200 },
    { day: 'Wed', fuel: 4950, wages: 3700, tolls: 460, penalties: 0 },
    { day: 'Thu', fuel: 6100, wages: 4200, tolls: 520, penalties: 400 },
    { day: 'Fri', fuel: 6864, wages: 4800, tolls: 786, penalties: 0 },
  ];

  const hourlySlaTrend = [
    { hour: '09:00', sla: 100 },
    { hour: '10:00', sla: 98 },
    { hour: '11:00', sla: 96 },
    { hour: '12:00', sla: 92 },
    { hour: '13:00', sla: 95 },
    { hour: '14:00', sla: 97 },
    { hour: '15:00', sla: 98 },
  ];

  return (
    <div className="p-6 max-w-[1720px] mx-auto w-full flex flex-col gap-5 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-main p-5 rounded-2xl border border-border-subtle shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-mono text-[11px] font-bold">
              LOGISTICS TELEMETRY
            </span>
            <span className="text-xs font-medium text-text-muted">• Historical Performance Audit</span>
          </div>
          <h1 className="text-xl font-bold text-deep-navy tracking-tight mt-1">
            Fleet Intelligence & Operational Analytics
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Planned vs actual path deviations, per-delivery cost economics, and recurring spatial bottlenecks
          </p>
        </div>

        <button
          onClick={() => alert('Generating full Logistics Cost Manifest CSV export...')}
          className="h-8 px-3.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-deep-navy text-xs font-semibold transition-colors flex items-center gap-1.5"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Export Analytics Manifest</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Cost Per Delivery"
          value="₹622"
          badge="15% Lower vs Manual"
          badgeType="success"
          trendText="₹720 industry avg"
          trendDirection="up"
          icon={<DollarSign className="w-3.5 h-3.5" />}
        />

        <StatCard
          label="Total Distance Traversed"
          value={`${metrics.totalDistanceKm} km`}
          badge="34 km detour saved"
          badgeType="info"
          trendText="4 active routes"
          trendDirection="up"
          icon={<RouteIcon className="w-3.5 h-3.5" />}
        />

        <StatCard
          label="Mean Solver Latency"
          value="1.8s"
          badge="OR-Tools v9.6"
          badgeType="neutral"
          trendText="Real-time re-solver"
          trendDirection="up"
          icon={<Clock className="w-3.5 h-3.5" />}
        />

        <StatCard
          label="SLA Compliance Rate"
          value={`${metrics.onTimeSlaPct}%`}
          badge="98% Weekly Target"
          badgeType="success"
          trendText="+3.2% vs last month"
          trendDirection="up"
          progressPct={metrics.onTimeSlaPct}
          progressColor="bg-status-success"
          icon={<CheckCircle2 className="w-3.5 h-3.5" />}
        />
      </div>

      {/* Planned vs Actual Route Comparison Chart (Recharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 bg-surface-main p-5 rounded-2xl border border-border-subtle shadow-xs flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
            <div>
              <h2 className="text-sm font-bold text-deep-navy">Planned vs Actual Distance (Km)</h2>
              <p className="text-[11px] text-text-muted">
                Highlights detours induced by Tonk Road closure and C-Scheme vehicle reassignments
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-text-secondary">
                <span className="w-3 h-3 rounded bg-primary-container" /> Planned
              </span>
              <span className="flex items-center gap-1.5 text-text-secondary">
                <span className="w-3 h-3 rounded bg-ai-intelligence" /> Actual Traversed
              </span>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={plannedVsActualData} barGap={6}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="corridor" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} unit=" km" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B1220', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="plannedKm" fill="#2563EB" radius={[4, 4, 0, 0]} name="Planned Distance" />
                <Bar dataKey="actualKm" fill="#7C3AED" radius={[4, 4, 0, 0]} name="Actual Traversed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hourly SLA Compliance Curve */}
        <div className="lg:col-span-4 bg-surface-main p-5 rounded-2xl border border-border-subtle shadow-xs flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
            <h2 className="text-sm font-bold text-deep-navy">Intra-Day SLA Trend</h2>
            <span className="text-[11px] font-mono text-status-success font-bold">95.0% Net</span>
          </div>

          <p className="text-xs text-text-secondary">
            Reflects 10:30 AM disruption recovery when V01 absorbed C-Scheme drops.
          </p>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlySlaTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis domain={[80, 100]} tick={{ fontSize: 10, fill: '#64748B' }} unit="%" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B1220', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="sla" stroke="#16A34A" fill="#DCFCE7" strokeWidth={2.5} name="SLA %" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Multi-Day Cost Trend (Fuel vs Wages vs Tolls) */}
      <div className="bg-surface-main p-5 rounded-2xl border border-border-subtle shadow-xs flex flex-col gap-3">
        <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
          <div>
            <h2 className="text-sm font-bold text-deep-navy">Weekly Fleet Expenditure Composition (₹)</h2>
            <p className="text-[11px] text-text-muted">Breakdown across Fuel burn, Shift wages, and Toll penalties</p>
          </div>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={costBreakdownData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748B' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748B' }} unit=" ₹" />
              <Tooltip
                contentStyle={{ backgroundColor: '#0B1220', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="fuel" stackId="a" fill="#0058be" name="Fuel Burn" />
              <Bar dataKey="wages" stackId="a" fill="#2563eb" name="Driver Wages" />
              <Bar dataKey="tolls" stackId="a" fill="#0ea5e9" name="Toll Roadways" />
              <Bar dataKey="penalties" stackId="a" fill="#dc2626" name="SLA Penalties" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
