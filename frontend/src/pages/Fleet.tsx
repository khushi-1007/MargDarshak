import React, { useState } from 'react';
import { useFleet } from '../context/FleetContext';
import { Badge } from '../components/ui/Badge';
import { StatCard } from '../components/ui/StatCard';
import {
  Truck,
  BatteryCharging,
  Gauge,
  Clock,
  Phone,
  AlertTriangle,
  Zap,
  CheckCircle2,
  ShieldCheck,
  User,
  Fuel,
  Wrench,
  Search,
} from 'lucide-react';
import { Vehicle } from '../types/fleet';

export const Fleet: React.FC = () => {
  const {
    vehicles,
    executeRecoveryAction,
    openRouteComparisonForIncident,
    isOptimising,
  } = useFleet();

  const [selectedDetailVehicle, setSelectedDetailVehicle] = useState<Vehicle | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const filteredVehicles = vehicles.filter((v) => {
    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'ON_ROUTE') return v.status === 'ON_ROUTE';
    if (filterStatus === 'BROKEN_DOWN') return v.status === 'BROKEN_DOWN';
    if (filterStatus === 'STANDBY') return v.status === 'STANDBY';
    return true;
  });

  return (
    <div className="p-6 max-w-[1720px] mx-auto w-full flex flex-col gap-5 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-main p-5 rounded-2xl border border-border-subtle shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-mono text-[11px] font-bold">
              ASSET REGISTRY v4.9
            </span>
            <span className="text-xs font-semibold text-status-success flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
              CAN-Bus Telemetry Stream: 100% Synced
            </span>
          </div>
          <h1 className="text-xl font-bold text-deep-navy tracking-tight mt-1">
            Fleet Assets & Telematics Control
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            5 registered units across Jaipur Hub • Real-time fuel burn, driver shift compliance, payload saturation
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-8 px-3 rounded-lg border border-border-subtle bg-white text-xs text-deep-navy font-medium focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Vehicles ({vehicles.length})</option>
            <option value="ON_ROUTE">On Route</option>
            <option value="BROKEN_DOWN">Breakdown Stalls</option>
            <option value="STANDBY">Standby Reserves</option>
          </select>
        </div>
      </div>

      {/* Fleet Overview Telemetry Bento */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Operational Fleet SLA"
          value="80.0%"
          badge="4 of 5 Deployed"
          badgeType="success"
          trendText="+4.2% fidelity"
          trendDirection="up"
          progressPct={80}
          progressColor="bg-status-success"
          icon={<ShieldCheck className="w-3.5 h-3.5" />}
        />

        <StatCard
          label="Payload Saturation"
          value="75.7%"
          badge="Balanced"
          badgeType="info"
          trendText="3,180 / 4,200 kg"
          trendDirection="neutral"
          progressPct={75.7}
          progressColor="bg-primary-container"
          icon={<Truck className="w-3.5 h-3.5" />}
        />

        <StatCard
          label="Mean Fuel Economy"
          value="14.2"
          unit="km/L"
          badge="₹17.1 / km"
          badgeType="neutral"
          trendText="Low idle penalty"
          trendDirection="up"
          icon={<Fuel className="w-3.5 h-3.5" />}
        />

        <StatCard
          label="Distance Traversed Today"
          value="312.4"
          unit="km"
          badge="Jaipur Grid"
          badgeType="info"
          trendText="4,820 kg-km torque"
          trendDirection="neutral"
          icon={<Gauge className="w-3.5 h-3.5" />}
        />
      </div>

      {/* Vehicle Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredVehicles.map((v) => {
          const isBroken = v.status === 'BROKEN_DOWN';
          const isStandby = v.status === 'STANDBY';
          const loadPct = (v.currentLoadKg / v.capacityKg) * 100;

          return (
            <div
              key={v.id}
              className={`bg-surface-main p-5 rounded-2xl border transition-all flex flex-col justify-between gap-4 ${
                isBroken
                  ? 'border-status-critical/60 shadow-md bg-error-container/10'
                  : 'border-border-subtle shadow-xs hover:shadow-md'
              }`}
            >
              {/* Card Top */}
              <div>
                <div className="flex items-start justify-between pb-3 border-b border-border-subtle">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-xs"
                      style={{ backgroundColor: v.color }}
                    >
                      {v.id}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-xs font-bold text-deep-navy">{v.name}</h3>
                        <span className="font-mono text-[10px] bg-surface-container px-1.5 py-0.2 rounded text-text-secondary font-semibold">
                          {v.licensePlate}
                        </span>
                      </div>
                      <p className="text-[11px] text-text-muted mt-0.5">
                        Pilot: <strong className="text-deep-navy">{v.driverName}</strong> ({v.driverId})
                      </p>
                    </div>
                  </div>
                  <Badge status={v.status} type="vehicle" />
                </div>

                {/* Capacity Saturation Meter */}
                <div className="mt-3.5 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-muted font-medium">Payload Saturation</span>
                    <span className="font-mono font-bold text-deep-navy">
                      {v.currentLoadKg} / {v.capacityKg} kg ({Math.round(loadPct)}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        loadPct > 90 ? 'bg-status-critical' : loadPct > 75 ? 'bg-status-warning' : 'bg-status-success'
                      }`}
                      style={{ width: `${Math.min(100, loadPct)}%` }}
                    />
                  </div>
                </div>

                {/* Telemetry Chips Grid */}
                <div className="grid grid-cols-2 gap-2 mt-3.5">
                  <div className="p-2 rounded-xl bg-surface-container-low border border-border-subtle/70 flex flex-col">
                    <span className="text-[10px] text-text-muted uppercase">Active Corridor</span>
                    <span className="text-xs font-semibold text-deep-navy truncate mt-0.5">
                      {v.currentZone}
                    </span>
                  </div>

                  <div className="p-2 rounded-xl bg-surface-container-low border border-border-subtle/70 flex flex-col">
                    <span className="text-[10px] text-text-muted uppercase">Driver Shift Left</span>
                    <span className="text-xs font-semibold text-status-success mt-0.5">
                      {v.remainingHours}h available (Legal HOS)
                    </span>
                  </div>

                  <div className="p-2 rounded-xl bg-surface-container-low border border-border-subtle/70 flex flex-col">
                    <span className="text-[10px] text-text-muted uppercase">CAN-Bus Battery</span>
                    <span className="text-xs font-mono font-bold text-deep-navy mt-0.5">
                      {v.batteryPct}% • {v.tirePressurePsi} PSI
                    </span>
                  </div>

                  <div className="p-2 rounded-xl bg-surface-container-low border border-border-subtle/70 flex flex-col">
                    <span className="text-[10px] text-text-muted uppercase">Telemetry Speed</span>
                    <span className="text-xs font-mono font-bold text-deep-navy mt-0.5">
                      {v.currentSpeedKmh} km/h
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 border-t border-border-subtle flex items-center justify-between">
                <a
                  href={`tel:${v.driverPhone}`}
                  className="inline-flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call Pilot</span>
                </a>

                {isBroken ? (
                  <button
                    onClick={() => openRouteComparisonForIncident('VEHICLE_BREAKDOWN')}
                    className="px-3 py-1 rounded-lg bg-status-critical text-white text-xs font-bold shadow-xs hover:bg-red-700 transition-colors"
                  >
                    View Reassignment
                  </button>
                ) : isStandby ? (
                  <button
                    onClick={() => executeRecoveryAction('STANDBY_V05')}
                    disabled={isOptimising}
                    className="px-3 py-1 rounded-lg bg-ai-intelligence text-white text-xs font-bold shadow-xs hover:bg-purple-700 transition-colors flex items-center gap-1"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Deploy Reserve</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setSelectedDetailVehicle(v)}
                    className="px-3 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-deep-navy text-xs font-medium transition-colors"
                  >
                    Asset Detail
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Vehicle Asset Detail Modal */}
      {selectedDetailVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setSelectedDetailVehicle(null)}
            className="fixed inset-0 bg-nav-command/60 backdrop-blur-sm"
          />
          <div className="relative bg-surface-main rounded-2xl shadow-2xl border border-border-subtle p-6 w-full max-w-lg z-10 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: selectedDetailVehicle.color }}
                >
                  {selectedDetailVehicle.id}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-deep-navy">{selectedDetailVehicle.name}</h3>
                  <span className="font-mono text-xs text-text-muted">{selectedDetailVehicle.licensePlate}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedDetailVehicle(null)}
                className="p-1 rounded text-text-muted hover:text-deep-navy"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-border-subtle/60">
                <span className="text-text-muted">Pilot Driver:</span>
                <span className="font-semibold text-deep-navy">{selectedDetailVehicle.driverName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border-subtle/60">
                <span className="text-text-muted">Driver Contact:</span>
                <span className="font-mono text-deep-navy">{selectedDetailVehicle.driverPhone}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border-subtle/60">
                <span className="text-text-muted">Payload Capacity:</span>
                <span className="font-mono text-deep-navy">{selectedDetailVehicle.capacityKg} kg</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border-subtle/60">
                <span className="text-text-muted">Cold Chain Spec:</span>
                <span className="font-semibold text-status-success">
                  {selectedDetailVehicle.loadEligibility.includes('COLD_CHAIN') ? 'Active (2°–8°C Compatible)' : 'Standard Dry'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-border-subtle/60">
                <span className="text-text-muted">Active Order Drops:</span>
                <span className="font-mono text-primary font-bold">{selectedDetailVehicle.assignedOrderIds.join(', ')}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedDetailVehicle(null)}
                className="px-4 py-2 rounded-xl bg-surface-container text-deep-navy text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
