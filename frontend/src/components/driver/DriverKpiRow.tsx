import React from 'react';
import { Package, Compass, Clock, Truck, CloudSun, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useFleet } from '../../context/FleetContext';
import { useTranslation } from '../../context/LanguageContext';

export const DriverKpiRow: React.FC = () => {
  const { driverKpis } = useFleet();
  const { t } = useTranslation();

  const getVehicleStatusColor = (status: string) => {
    switch (status) {
      case 'Healthy':
        return 'text-status-success bg-status-success/10 border-status-success/20';
      case 'Breakdown':
        return 'text-status-critical bg-status-critical/10 border-status-critical/20';
      case 'Warning':
      case 'Re-routing':
        return 'text-status-warning bg-status-warning/10 border-status-warning/20';
      default:
        return 'text-primary bg-primary/10 border-primary/20';
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 w-full">
      {/* CARD 1: Today's Deliveries */}
      <div className="bg-surface-main p-3.5 rounded-xl border border-border-subtle shadow-xs flex flex-col justify-between transition-all hover:border-slate-300">
        <div className="flex items-center justify-between text-text-secondary">
          <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
            {t('driver.todaysDeliveries', "Today's Deliveries")}
          </span>
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-primary-container flex items-center justify-center">
            <Package className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-deep-navy tracking-tight">
            {driverKpis.completedDeliveries} / {driverKpis.totalDeliveries}
          </span>
          <span className="text-xs font-semibold text-text-muted">
            {driverKpis.remainingDeliveries} {t('driver.remaining', 'remaining')}
          </span>
        </div>
        {/* Progress bar */}
        <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
          <div
            className="bg-primary-container h-1.5 rounded-full transition-all duration-500"
            style={{
              width: `${
                driverKpis.totalDeliveries > 0
                  ? (driverKpis.completedDeliveries / driverKpis.totalDeliveries) * 100
                  : 0
              }%`,
            }}
          />
        </div>
      </div>

      {/* CARD 2: Total Distance (Today) */}
      <div className="bg-surface-main p-3.5 rounded-xl border border-border-subtle shadow-xs flex flex-col justify-between transition-all hover:border-slate-300">
        <div className="flex items-center justify-between text-text-secondary">
          <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
            {t('driver.totalDistanceToday', 'Total Distance (Today)')}
          </span>
          <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Compass className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-deep-navy tracking-tight">
            {driverKpis.totalDistanceTodayKm} km
          </span>
          <span className="text-xs font-semibold text-text-muted">
            {t('driver.est', 'est.')} {driverKpis.estimatedTotalDistanceKm} km
          </span>
        </div>
        <div className="text-[11px] text-text-muted mt-2 font-medium">
          Route Corridor: Jaipur Urban Ring
        </div>
      </div>

      {/* CARD 3: Estimated Completion */}
      <div className="bg-surface-main p-3.5 rounded-xl border border-border-subtle shadow-xs flex flex-col justify-between transition-all hover:border-slate-300">
        <div className="flex items-center justify-between text-text-secondary">
          <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
            {t('driver.estCompletion', 'Est. Completion')}
          </span>
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-deep-navy tracking-tight">
            {driverKpis.estimatedCompletionTime}
          </span>
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
              driverKpis.onTrackStatus === 'On Track'
                ? 'bg-status-success/10 text-status-success border-status-success/20'
                : 'bg-status-critical/10 text-status-critical border-status-critical/20'
            }`}
          >
            {driverKpis.onTrackStatus === 'On Track' ? t('driver.onTrack', 'On Track') : driverKpis.onTrackStatus}
          </span>
        </div>
        <div className="text-[11px] text-text-muted mt-2 font-medium">
          Shift Limit: 05:00 PM (+2.5h Buffer)
        </div>
      </div>

      {/* CARD 4: Vehicle Status */}
      <div className="bg-surface-main p-3.5 rounded-xl border border-border-subtle shadow-xs flex flex-col justify-between transition-all hover:border-slate-300">
        <div className="flex items-center justify-between text-text-secondary">
          <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
            {t('driver.vehicleStatus', 'Vehicle Status')}
          </span>
          <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
            <Truck className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-deep-navy tracking-tight">
            {driverKpis.vehicleStatus === 'Healthy'
              ? t('driver.healthy', 'Healthy')
              : driverKpis.vehicleStatus === 'Breakdown'
              ? t('status.BROKEN_DOWN', 'Breakdown')
              : driverKpis.vehicleStatus}
          </span>
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${getVehicleStatusColor(
              driverKpis.vehicleStatus
            )}`}
          >
            {driverKpis.vehicleStatus === 'Healthy' ? t('status.ACTIVE', 'Active') : t('status.ALERT', 'Alert')}
          </span>
        </div>
        <div className="text-[11px] text-text-muted mt-2 font-medium truncate">
          {driverKpis.vehicleStatus === 'Breakdown'
            ? t('driver.mechanicalHalt', 'Mechanical Halt')
            : t('driver.telemetrySynced', 'Telemetry Synced')}
        </div>
      </div>

      {/* CARD 5: Weather (Jaipur) */}
      <div className="col-span-2 sm:col-span-1 bg-surface-main p-3.5 rounded-xl border border-border-subtle shadow-xs flex flex-col justify-between transition-all hover:border-slate-300">
        <div className="flex items-center justify-between text-text-secondary">
          <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
            {t('driver.weather')} ({driverKpis.weather.location})
          </span>
          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <CloudSun className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-deep-navy tracking-tight">
            {driverKpis.weather.temperatureC}°C
          </span>
          <span className="text-xs font-semibold text-text-muted truncate">
            {driverKpis.weather.condition}
          </span>
        </div>
        <div className="text-[11px] text-text-muted mt-2 font-medium truncate">
          {driverKpis.weather.impact}
        </div>
      </div>
    </div>
  );
};
