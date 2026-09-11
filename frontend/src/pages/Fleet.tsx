import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Check,
  Copy,
  ExternalLink,
  MapPin,
  ThermometerSnowflake,
  Radio,
  X,
  Package,
} from 'lucide-react';
import { Vehicle } from '../types/fleet';

export const Fleet: React.FC = () => {
  const navigate = useNavigate();
  const {
    vehicles,
    routes,
    orders,
    metrics,
    executeRecoveryAction,
    openRouteComparisonForIncident,
    isOptimising,
  } = useFleet();

  const [selectedDetailVehicle, setSelectedDetailVehicle] = useState<Vehicle | null>(null);
  const [callingPilotVehicle, setCallingPilotVehicle] = useState<Vehicle | null>(null);
  const [copiedPhone, setCopiedPhone] = useState<boolean>(false);
  const [pingSent, setPingSent] = useState<boolean>(false);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const filteredVehicles = vehicles.filter((v) => {
    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'ON_ROUTE') return v.status === 'ON_ROUTE';
    if (filterStatus === 'BROKEN_DOWN') return v.status === 'BROKEN_DOWN';
    if (filterStatus === 'STANDBY') return v.status === 'STANDBY';
    return true;
  });

  // Dynamic Fleet Telemetrics
  const totalVehiclesCount = vehicles.length;
  const activeOperationalCount = vehicles.filter((v) => v.status !== 'BROKEN_DOWN').length;
  const operationalSlaPct =
    totalVehiclesCount > 0
      ? ((activeOperationalCount / totalVehiclesCount) * 100).toFixed(1)
      : '100.0';

  const totalLoadKg = vehicles.reduce((acc, v) => acc + (v.currentLoadKg || 0), 0);
  const totalCapacityKg = vehicles.reduce((acc, v) => acc + (v.capacityKg || 0), 0);
  const payloadSaturationPct =
    totalCapacityKg > 0 ? ((totalLoadKg / totalCapacityKg) * 100).toFixed(1) : '0.0';

  const fuelVehicles = vehicles.filter((v) => v.fuelEfficiencyKmpl > 0);
  const meanFuelKmpl =
    fuelVehicles.length > 0
      ? (fuelVehicles.reduce((acc, v) => acc + v.fuelEfficiencyKmpl, 0) / fuelVehicles.length).toFixed(1)
      : '14.2';

  const costPerKm =
    metrics.totalDistanceKm > 0 && metrics.totalOperatingCostInr > 0
      ? (metrics.totalOperatingCostInr / metrics.totalDistanceKm).toFixed(1)
      : '17.1';

  const totalDistanceTraversed =
    routes.length > 0
      ? routes.reduce((acc, r) => acc + (r.totalDistanceKm || 0), 0).toFixed(1)
      : (metrics.totalDistanceKm ? metrics.totalDistanceKm.toFixed(1) : '312.4');

  // Helper to get clean Unit short code like 'V01', 'V02', etc.
  const getUnitCode = (v: Vehicle, idx: number) => {
    if (v.shortId) return v.shortId;
    if (v.id && v.id.startsWith('V0')) return v.id;
    return `V0${idx + 1}`;
  };

  // Copy phone handler
  const handleCopyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  // Dispatch ping handler
  const handleSendPing = () => {
    setPingSent(true);
    setTimeout(() => setPingSent(false), 2500);
  };

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
            {vehicles.length} registered units across Jaipur Hub • Real-time fuel burn, driver shift compliance, payload saturation
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

      {/* Fleet Overview Telemetry Bento - Fully Dynamic */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Operational Fleet SLA"
          value={`${operationalSlaPct}%`}
          badge={`${activeOperationalCount} of ${totalVehiclesCount} Operational`}
          badgeType={Number(operationalSlaPct) >= 80 ? 'success' : 'warning'}
          trendText={`+${((activeOperationalCount / Math.max(1, totalVehiclesCount)) * 4.2).toFixed(1)}% fleet fidelity`}
          trendDirection="up"
          progressPct={Number(operationalSlaPct)}
          progressColor={Number(operationalSlaPct) >= 80 ? 'bg-status-success' : 'bg-status-warning'}
          icon={<ShieldCheck className="w-3.5 h-3.5" />}
        />

        <StatCard
          label="Payload Saturation"
          value={`${payloadSaturationPct}%`}
          badge={Number(payloadSaturationPct) > 75 ? 'High Utilisation' : 'Balanced'}
          badgeType="info"
          trendText={`${totalLoadKg.toLocaleString()} / ${totalCapacityKg.toLocaleString()} kg`}
          trendDirection="neutral"
          progressPct={Number(payloadSaturationPct)}
          progressColor="bg-primary-container"
          icon={<Truck className="w-3.5 h-3.5" />}
        />

        <StatCard
          label="Mean Fuel Economy"
          value={meanFuelKmpl}
          unit="km/L"
          badge={`₹${costPerKm} / km`}
          badgeType="neutral"
          trendText="Telemetry calibrated"
          trendDirection="up"
          icon={<Fuel className="w-3.5 h-3.5" />}
        />

        <StatCard
          label="Distance Traversed Today"
          value={totalDistanceTraversed}
          unit="km"
          badge="Jaipur Active Grid"
          badgeType="info"
          trendText={`${(Number(totalDistanceTraversed) * 14.8).toFixed(0)} kg-km loadwork`}
          trendDirection="neutral"
          icon={<Gauge className="w-3.5 h-3.5" />}
        />
      </div>

      {/* Vehicle Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredVehicles.map((v, idx) => {
          const isBroken = v.status === 'BROKEN_DOWN';
          const isStandby = v.status === 'STANDBY';
          const loadPct = v.capacityKg > 0 ? (v.currentLoadKg / v.capacityKg) * 100 : 0;
          const unitCode = getUnitCode(v, idx);

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
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0"
                      style={{ backgroundColor: v.color || '#2563eb' }}
                    >
                      {unitCode}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-xs font-bold text-deep-navy">{v.name}</h3>
                        <span className="font-mono text-[10px] bg-surface-container px-1.5 py-0.5 rounded text-text-secondary font-semibold">
                          {v.licensePlate}
                        </span>
                      </div>
                      <p className="text-[11px] text-text-muted mt-0.5">
                        Pilot: <strong className="text-deep-navy">{v.driverName}</strong>
                        <span className="ml-1 text-text-secondary font-mono text-[10px]">
                          · {v.driverPhone}
                        </span>
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
                    <span className="text-[10px] text-text-muted uppercase font-semibold">Active Corridor</span>
                    <span className="text-xs font-semibold text-deep-navy truncate mt-0.5" title={v.currentZone}>
                      {v.currentZone || 'Jaipur Central Corridor'}
                    </span>
                  </div>

                  <div className="p-2 rounded-xl bg-surface-container-low border border-border-subtle/70 flex flex-col">
                    <span className="text-[10px] text-text-muted uppercase font-semibold">Driver Shift Left</span>
                    <span className="text-xs font-semibold text-status-success mt-0.5">
                      {v.remainingHours}h available (Legal HOS)
                    </span>
                  </div>

                  <div className="p-2 rounded-xl bg-surface-container-low border border-border-subtle/70 flex flex-col">
                    <span className="text-[10px] text-text-muted uppercase font-semibold">
                      {v.name.toLowerCase().includes('electric') ? 'CAN-Bus Battery' : 'Fuel / Battery'}
                    </span>
                    <span className="text-xs font-mono font-bold text-deep-navy mt-0.5">
                      {v.batteryPct}% • {v.tirePressurePsi} PSI
                    </span>
                  </div>

                  <div className="p-2 rounded-xl bg-surface-container-low border border-border-subtle/70 flex flex-col">
                    <span className="text-[10px] text-text-muted uppercase font-semibold">Telemetry Speed</span>
                    <span className="text-xs font-mono font-bold text-deep-navy mt-0.5">
                      {v.currentSpeedKmh} km/h
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 border-t border-border-subtle flex items-center justify-between">
                <button
                  onClick={() => setCallingPilotVehicle(v)}
                  className="inline-flex items-center gap-1.5 text-xs text-primary font-bold hover:underline cursor-pointer"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call Pilot</span>
                </button>

                {isBroken ? (
                  <button
                    onClick={() => openRouteComparisonForIncident('VEHICLE_BREAKDOWN')}
                    className="px-3 py-1.5 rounded-lg bg-status-critical text-white text-xs font-bold shadow-xs hover:bg-red-700 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>View Reassignment</span>
                  </button>
                ) : isStandby ? (
                  <button
                    onClick={() => executeRecoveryAction('STANDBY_V05')}
                    disabled={isOptimising}
                    className="px-3 py-1.5 rounded-lg bg-ai-intelligence text-white text-xs font-bold shadow-xs hover:bg-purple-700 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Deploy Reserve</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setSelectedDetailVehicle(v)}
                    className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-deep-navy text-xs font-bold transition-colors cursor-pointer"
                  >
                    Asset Detail
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Pilot Call & Voice Dispatch Modal */}
      {callingPilotVehicle && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setCallingPilotVehicle(null)}
        >
          <div
            className="bg-white dark:bg-surface-main rounded-2xl border border-border-subtle shadow-xl max-w-md w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-deep-navy">Pilot Voice Dispatch</h3>
                  <p className="text-xs text-text-muted">Direct telematics comms link</p>
                </div>
              </div>
              <button
                onClick={() => setCallingPilotVehicle(null)}
                className="p-1 rounded-lg text-text-muted hover:text-deep-navy hover:bg-surface-container cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-surface-container-low border border-border-subtle space-y-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-base shadow-sm"
                  style={{ backgroundColor: callingPilotVehicle.color || '#2563eb' }}
                >
                  {callingPilotVehicle.shortId || 'V01'}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-deep-navy">{callingPilotVehicle.driverName}</h4>
                  <p className="text-xs text-text-secondary">
                    Assigned: {callingPilotVehicle.name} ({callingPilotVehicle.licensePlate})
                  </p>
                  <span className="inline-flex items-center gap-1 text-[11px] text-status-success font-semibold mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-status-success animate-pulse" />
                    In-Cab Tablet Connected
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-white dark:bg-surface-main border border-border-subtle flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase text-text-muted font-bold block">Mobile Contact</span>
                  <span className="font-mono text-sm font-bold text-deep-navy">
                    {callingPilotVehicle.driverPhone}
                  </span>
                </div>
                <button
                  onClick={() => handleCopyPhone(callingPilotVehicle.driverPhone)}
                  className="px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-deep-navy transition-colors flex items-center gap-1 cursor-pointer"
                >
                  {copiedPhone ? (
                    <>
                      <Check className="w-3 h-3 text-status-success" />
                      <span className="text-status-success">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-text-muted" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              {pingSent && (
                <div className="p-2.5 rounded-lg bg-status-success/10 border border-status-success/30 text-xs text-status-success flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Dispatcher priority ping transmitted to in-cab console!</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={handleSendPing}
                className="px-3 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-deep-navy text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Send Radio Ping</span>
              </button>
              <a
                href={`tel:${callingPilotVehicle.driverPhone}`}
                className="px-4 py-2 rounded-xl bg-primary-container hover:bg-primary text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Now</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Vehicle Asset Detail Modal */}
      {selectedDetailVehicle && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setSelectedDetailVehicle(null)}
        >
          <div
            className="bg-white dark:bg-surface-main rounded-2xl border border-border-subtle shadow-xl max-w-xl w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0"
                  style={{ backgroundColor: selectedDetailVehicle.color || '#2563eb' }}
                >
                  {selectedDetailVehicle.shortId || 'V01'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-deep-navy">{selectedDetailVehicle.name}</h3>
                    <Badge status={selectedDetailVehicle.status} type="vehicle" />
                  </div>
                  <span className="font-mono text-xs text-text-muted">{selectedDetailVehicle.licensePlate}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedDetailVehicle(null)}
                className="p-1 rounded-lg text-text-muted hover:text-deep-navy hover:bg-surface-container cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Spec Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="p-3 rounded-xl bg-surface-container-low border border-border-subtle">
                <span className="text-[10px] text-text-muted uppercase block font-semibold">Speed</span>
                <span className="text-sm font-bold font-mono text-deep-navy mt-0.5 block">
                  {selectedDetailVehicle.currentSpeedKmh} km/h
                </span>
              </div>

              <div className="p-3 rounded-xl bg-surface-container-low border border-border-subtle">
                <span className="text-[10px] text-text-muted uppercase block font-semibold">Charge / Fuel</span>
                <span className="text-sm font-bold font-mono text-deep-navy mt-0.5 block">
                  {selectedDetailVehicle.batteryPct}%
                </span>
              </div>

              <div className="p-3 rounded-xl bg-surface-container-low border border-border-subtle">
                <span className="text-[10px] text-text-muted uppercase block font-semibold">Tire Pressure</span>
                <span className="text-sm font-bold font-mono text-deep-navy mt-0.5 block">
                  {selectedDetailVehicle.tirePressurePsi} PSI
                </span>
              </div>

              <div className="p-3 rounded-xl bg-surface-container-low border border-border-subtle">
                <span className="text-[10px] text-text-muted uppercase block font-semibold">Shift Hours</span>
                <span className="text-sm font-bold font-mono text-status-success mt-0.5 block">
                  {selectedDetailVehicle.remainingHours}h left
                </span>
              </div>
            </div>

            {/* Cargo & Cold Chain Specs */}
            <div className="p-3.5 rounded-xl bg-surface-container-low border border-border-subtle space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                  Payload Saturation & Specs
                </span>
                <span className="font-mono font-bold text-deep-navy">
                  {selectedDetailVehicle.currentLoadKg} / {selectedDetailVehicle.capacityKg} kg (
                  {Math.round(
                    selectedDetailVehicle.capacityKg > 0
                      ? (selectedDetailVehicle.currentLoadKg / selectedDetailVehicle.capacityKg) * 100
                      : 0
                  )}
                  %)
                </span>
              </div>

              <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-container rounded-full"
                  style={{
                    width: `${Math.min(
                      100,
                      selectedDetailVehicle.capacityKg > 0
                        ? (selectedDetailVehicle.currentLoadKg / selectedDetailVehicle.capacityKg) * 100
                        : 0
                    )}%`,
                  }}
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <span className="px-2 py-0.5 rounded bg-surface-container font-semibold text-[11px] text-deep-navy">
                  📦 General Freight
                </span>
                <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-800 font-semibold text-[11px] flex items-center gap-1">
                  <ThermometerSnowflake className="w-3 h-3" /> Cold Chain (2°–8°C)
                </span>
                <span className="px-2 py-0.5 rounded bg-purple-50 border border-purple-200 text-purple-800 font-semibold text-[11px]">
                  ⚡ Express Priority
                </span>
              </div>
            </div>

            {/* Active Order Consignments */}
            <div className="p-3.5 rounded-xl border border-border-subtle bg-surface-container-low space-y-2 text-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted block">
                Active Assigned Drops ({selectedDetailVehicle.assignedOrderIds.length})
              </span>
              {selectedDetailVehicle.assignedOrderIds.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                  {selectedDetailVehicle.assignedOrderIds.map((ordId) => {
                    const matchedOrder = orders.find(
                      (o) => o.id === ordId || o.id.includes(ordId) || ordId.includes(o.id)
                    );
                    return (
                      <div
                        key={ordId}
                        className="px-2 py-1 rounded-lg bg-white dark:bg-surface-main border border-border-subtle flex items-center gap-1.5"
                      >
                        <Package className="w-3 h-3 text-primary shrink-0" />
                        <span className="font-mono font-bold text-deep-navy">{ordId}</span>
                        {matchedOrder && (
                          <span className="text-[10px] text-text-muted truncate max-w-[120px]">
                            · {matchedOrder.consignee}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-text-muted italic">No pending drops assigned to this unit.</p>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-2 border-t border-border-subtle flex items-center justify-end gap-2">
              <button
                onClick={() => setSelectedDetailVehicle(null)}
                className="px-4 py-2 rounded-xl border border-border-subtle text-deep-navy text-xs font-bold hover:bg-surface-container transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setSelectedDetailVehicle(null);
                  navigate('/routes');
                }}
                className="px-4 py-2 rounded-xl bg-primary-container hover:bg-primary text-white text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>View Route Manifest</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
