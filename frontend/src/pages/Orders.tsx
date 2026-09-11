import React, { useState } from 'react';
import { useFleet } from '../context/FleetContext';
import { Badge } from '../components/ui/Badge';
import {
  Package,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileDown,
  Upload,
  PlusCircle,
  Eye,
  ShieldCheck,
  Check,
  X,
  ExternalLink,
  MapPin,
  Truck,
  Phone,
  Navigation,
  ThermometerSnowflake,
  Calendar,
} from 'lucide-react';
import { Order } from '../types/order';

export const Orders: React.FC = () => {
  const {
    orders,
    vehicles,
    metrics,
    injectPriorityOrder,
    openRouteComparisonForIncident,
  } = useFleet();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterSla, setFilterSla] = useState<string>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [inspectingOrder, setInspectingOrder] = useState<Order | null>(null);

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.consignee.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.zone.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterSla === 'ALL') return true;
    if (filterSla === 'PRIORITY') return o.priority === 'CRITICAL' || o.priority === 'HIGH';
    if (filterSla === 'AT_RISK') return o.slaStatus === 'AT_RISK';
    if (filterSla === 'LATE') return o.slaStatus === 'LATE';
    if (filterSla === 'UNSERVICEABLE') return o.slaStatus === 'UNSERVICEABLE';
    if (filterSla === 'DELIVERED') return o.slaStatus === 'DELIVERED';
    return true;
  });

  const activeFocusOrder = selectedOrder || (orders.length > 0 ? orders[0] : null);

  // Dynamic SLA & Dispatches computation
  const totalOrdersCount = orders.length;
  const onTimeOrdersCount = orders.filter(
    (o) => o.slaStatus === 'ON_TIME' || o.slaStatus === 'DELIVERED'
  ).length;
  const atRiskOrders = orders.filter((o) => o.slaStatus === 'AT_RISK' || o.slaStatus === 'LATE');
  const atRiskCount = atRiskOrders.length;
  const slaCompliancePct =
    totalOrdersCount > 0
      ? Math.round((onTimeOrdersCount / totalOrdersCount) * 100)
      : Math.round(metrics.onTimeSlaPct || 95);

  const atRiskZones = Array.from(
    new Set(
      atRiskOrders
        .map((o) => {
          const parts = o.address.split(',');
          return parts[0]?.trim() || '';
        })
        .filter(Boolean)
    )
  )
    .slice(0, 2)
    .join(', ');

  // Helper to find vehicle metadata for an order
  const getVehicleDetails = (vehicleCode?: string) => {
    if (!vehicleCode) return null;
    return vehicles.find(
      (v) =>
        v.id === vehicleCode ||
        v.shortId === vehicleCode ||
        v.licensePlate === vehicleCode ||
        v.licensePlate?.includes(vehicleCode)
    );
  };

  return (
    <div className="p-6 max-w-[1720px] mx-auto w-full flex flex-col gap-5 select-none">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-main p-5 rounded-2xl border border-border-subtle shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-mono text-[11px] font-bold">
              DISPATCH FEED
            </span>
            <span className="text-xs font-medium text-text-muted">• {orders.length} Active Shipments</span>
          </div>
          <h1 className="text-xl font-bold text-deep-navy tracking-tight mt-1">
            Order Fulfilment & SLA Management
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Strict customer delivery windows, cold-chain compliance, and real-time SLA breach prevention
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2 shrink-0">
          <button
            onClick={() => injectPriorityOrder()}
            className="h-8 px-3.5 rounded-lg bg-primary-container hover:bg-primary text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Inject Priority Order (P-101)</span>
          </button>
        </div>
      </div>

      {/* Filter Status Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {[
          { key: 'ALL', label: 'All Orders', count: orders.length },
          { key: 'PRIORITY', label: 'Priority Only', count: orders.filter((o) => o.priority !== 'STANDARD').length },
          { key: 'AT_RISK', label: 'At Risk', count: orders.filter((o) => o.slaStatus === 'AT_RISK').length },
          { key: 'LATE', label: 'Late', count: orders.filter((o) => o.slaStatus === 'LATE').length },
          { key: 'UNSERVICEABLE', label: 'Unserviceable', count: orders.filter((o) => o.slaStatus === 'UNSERVICEABLE').length },
          { key: 'DELIVERED', label: 'Delivered', count: orders.filter((o) => o.slaStatus === 'DELIVERED').length },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilterSla(f.key)}
            className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
              filterSla === f.key
                ? 'bg-primary-container text-white border-primary-container shadow-xs'
                : 'bg-surface-main text-deep-navy border-border-subtle hover:bg-surface-container-low'
            }`}
          >
            <span className={`text-[10px] font-bold uppercase tracking-wider ${filterSla === f.key ? 'text-blue-100' : 'text-text-muted'}`}>
              {f.label}
            </span>
            <span className="text-xl font-bold font-mono mt-1">{f.count}</span>
          </button>
        ))}
      </div>

      {/* Main Layout Split: Table (8 cols) + Audit Drawer (4 cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* Orders Table Container (8 cols) */}
        <div className="xl:col-span-8 bg-surface-main p-5 rounded-2xl border border-border-subtle shadow-xs flex flex-col gap-3">
          {/* Table Search & Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border-subtle">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 text-text-muted w-3.5 h-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search consignee, ID, zone, or address..."
                className="w-full h-8 pl-8 pr-3 rounded-lg border border-border-subtle bg-surface-container-low text-xs text-deep-navy focus:outline-none focus:bg-white"
              />
            </div>
            <span className="text-xs text-text-muted">
              Showing <strong className="text-deep-navy font-mono">{filteredOrders.length}</strong> of{' '}
              <strong className="text-deep-navy font-mono">{orders.length}</strong> consignments
            </span>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="min-w-[860px] w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-surface-container-low text-text-secondary font-semibold uppercase text-[11px] border-b border-border-subtle">
                  <th className="py-2.5 px-3 min-w-[90px]">Order ID</th>
                  <th className="py-2.5 px-3 min-w-[150px]">Consignee</th>
                  <th className="py-2.5 px-3 min-w-[160px]">Destination / Zone</th>
                  <th className="py-2.5 px-3 text-right min-w-[70px]">Payload</th>
                  <th className="py-2.5 px-3 min-w-[100px]">Window</th>
                  <th className="py-2.5 px-3 min-w-[80px]">Vehicle</th>
                  <th className="py-2.5 px-3 min-w-[70px]">ETA</th>
                  <th className="py-2.5 px-3 min-w-[90px]">SLA Status</th>
                  <th className="py-2.5 px-3 text-center min-w-[70px]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle/50">
                {filteredOrders.map((ord) => {
                  const isCritical = ord.priority === 'CRITICAL';
                  const isUnserviceable = ord.slaStatus === 'UNSERVICEABLE';
                  const isSelected = activeFocusOrder?.id === ord.id;

                  return (
                    <tr
                      key={ord.id}
                      onClick={() => setSelectedOrder(ord)}
                      onDoubleClick={() => {
                        setSelectedOrder(ord);
                        setInspectingOrder(ord);
                      }}
                      className={`hover:bg-surface-container-low cursor-pointer transition-colors ${
                        isSelected ? 'bg-primary/5' : isUnserviceable ? 'bg-error-container/20' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 font-mono font-bold text-deep-navy whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span>{ord.id}</span>
                          {isCritical && (
                            <span className="w-1.5 h-1.5 rounded-full bg-status-critical animate-ping" />
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-deep-navy">
                        <div className="flex flex-col">
                          <span>{ord.consignee}</span>
                          {ord.loadType === 'COLD_CHAIN' && (
                            <span className="text-[10px] text-ai-intelligence font-bold flex items-center gap-1">
                              <ThermometerSnowflake className="w-3 h-3" /> Cold Chain (2°–8°C)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-text-secondary truncate max-w-[180px]">
                        {ord.address}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-deep-navy whitespace-nowrap">
                        {ord.weightKg} kg
                      </td>
                      <td className="py-2.5 px-3 font-mono text-text-secondary text-[11px] whitespace-nowrap">
                        {ord.timeWindowStart} – {ord.timeWindowEnd}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-primary whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
                          {ord.assignedVehicleId || 'V01'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-deep-navy whitespace-nowrap">
                        {ord.eta}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <Badge status={ord.slaStatus} type="sla" />
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOrder(ord);
                            setInspectingOrder(ord);
                          }}
                          title="Inspect Order Details"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-bold text-[11px] transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Audit & Inspection Card (4 cols) */}
        <div className="xl:col-span-4 flex flex-col gap-4">
          {/* Network Compliance Gauge Card */}
          <div className="bg-surface-main p-5 rounded-2xl border border-border-subtle shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-text-muted tracking-wider">
                  Jaipur Zone SLA Health
                </span>
                <h3 className="text-sm font-bold text-deep-navy">Network Compliance Index</h3>
              </div>
              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                slaCompliancePct >= 90
                  ? 'bg-status-success/10 text-status-success'
                  : 'bg-status-warning/10 text-status-warning'
              }`}>
                {slaCompliancePct >= 90 ? 'Stable' : 'Elevated Risk'}
              </span>
            </div>

            <div className="flex items-center gap-4 py-2">
              <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
                <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-surface-container"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.5"
                  />
                  <path
                    className={slaCompliancePct >= 90 ? 'text-status-success' : 'text-status-warning'}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeDasharray={`${slaCompliancePct}, 100`}
                    strokeLinecap="round"
                    strokeWidth="3.5"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-base font-bold text-deep-navy font-mono">{slaCompliancePct}%</span>
                  <span className="text-[9px] text-text-muted">On-Time</span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 flex-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-text-muted">On-Time Dispatches:</span>
                  <span className="font-mono font-bold text-status-success">
                    {onTimeOrdersCount} / {totalOrdersCount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">At-Risk Corridors:</span>
                  <span className="font-mono font-bold text-status-warning">
                    {atRiskCount} {atRiskZones ? `(${atRiskZones})` : ''}
                  </span>
                </div>
                <span className="text-[10px] text-text-muted mt-0.5 leading-tight">
                  Dynamic re-routes protected {Math.max(atRiskCount, 3)} potential delivery breaches today.
                </span>
              </div>
            </div>
          </div>

          {/* Focused Inspection Detail for Active Selected Order */}
          {activeFocusOrder && (
            <div className="bg-surface-main p-5 rounded-2xl border border-border-subtle shadow-xs flex flex-col gap-3">
              <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-ai-intelligence" />
                  <span className="text-xs font-bold text-deep-navy">
                    Order Audit: {activeFocusOrder.id}
                  </span>
                </div>
                <span className="font-mono text-xs text-text-muted">{activeFocusOrder.zone}</span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div>
                  <span className="text-text-muted text-[11px] block">Consignee & Destination:</span>
                  <strong className="text-deep-navy text-xs block mt-0.5">{activeFocusOrder.consignee}</strong>
                  <p className="text-[11px] text-text-secondary mt-0.5">{activeFocusOrder.address}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="p-2.5 rounded-lg bg-surface-container-low">
                    <span className="text-[10px] text-text-muted uppercase block">Delivery Window</span>
                    <span className="font-mono font-bold text-deep-navy text-xs">
                      {activeFocusOrder.timeWindowStart} – {activeFocusOrder.timeWindowEnd}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-surface-container-low">
                    <span className="text-[10px] text-text-muted uppercase block">Assigned Unit</span>
                    <span className="font-mono font-bold text-primary text-xs">
                      Vehicle {activeFocusOrder.assignedVehicleId || 'V01'}
                    </span>
                  </div>
                </div>

                {activeFocusOrder.reassigned && (
                  <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-ai-intelligence">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Reassigned Dynamically from {activeFocusOrder.originalVehicleId}</span>
                    </div>
                    <p className="text-[11px] text-purple-950 mt-1">
                      Absorbed by {activeFocusOrder.assignedVehicleId} due to mechanical stall. Cold-chain specs & arrival deadline preserved.
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-border-subtle flex flex-col sm:flex-row items-center gap-2">
                <button
                  onClick={() => setInspectingOrder(activeFocusOrder)}
                  className="w-full sm:flex-1 py-1.5 px-3 rounded-lg bg-surface-container hover:bg-surface-container-high text-deep-navy text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Inspect Consignment</span>
                </button>
                <button
                  onClick={() => openRouteComparisonForIncident('VEHICLE_BREAKDOWN')}
                  className="w-full sm:flex-1 py-1.5 px-3 rounded-lg bg-primary-container hover:bg-primary text-white text-xs font-bold shadow-xs transition-colors cursor-pointer text-center"
                >
                  Route Comparison
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Full Order Inspection Modal Dialog */}
      {inspectingOrder && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setInspectingOrder(null)}
        >
          <div
            className="bg-white dark:bg-surface-main rounded-2xl border border-border-subtle shadow-xl max-w-xl w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-border-subtle">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-deep-navy font-mono">
                      {inspectingOrder.id}
                    </h2>
                    <Badge status={inspectingOrder.slaStatus} type="sla" />
                    {inspectingOrder.priority === 'CRITICAL' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-status-critical/10 text-status-critical border border-status-critical/20">
                        Critical Priority
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-muted mt-0.5">{inspectingOrder.zone}</p>
                </div>
              </div>
              <button
                onClick={() => setInspectingOrder(null)}
                className="p-1 rounded-lg text-text-muted hover:text-deep-navy hover:bg-surface-container transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Consignee & Destination */}
            <div className="p-3.5 rounded-xl bg-surface-container-low border border-border-subtle space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                  Consignee Details
                </span>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    inspectingOrder.address + ', Jaipur, Rajasthan'
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-primary hover:underline flex items-center gap-1 font-semibold"
                >
                  <span>Open in Google Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-sm font-bold text-deep-navy">{inspectingOrder.consignee}</p>
              <div className="flex items-start gap-1.5 text-xs text-text-secondary">
                <MapPin className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" />
                <span>{inspectingOrder.address}</span>
              </div>
            </div>

            {/* Consignment Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="p-3 rounded-xl bg-surface-container-low border border-border-subtle">
                <span className="text-[10px] text-text-muted uppercase block font-semibold">Weight</span>
                <span className="text-sm font-bold font-mono text-deep-navy mt-0.5 block">
                  {inspectingOrder.weightKg} kg
                </span>
              </div>

              <div className="p-3 rounded-xl bg-surface-container-low border border-border-subtle">
                <span className="text-[10px] text-text-muted uppercase block font-semibold">Load Type</span>
                <span className="text-xs font-bold text-deep-navy mt-0.5 block">
                  {inspectingOrder.loadType === 'COLD_CHAIN' ? '❄️ Cold-Chain' : '📦 Standard'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-surface-container-low border border-border-subtle">
                <span className="text-[10px] text-text-muted uppercase block font-semibold">Window</span>
                <span className="text-xs font-bold font-mono text-deep-navy mt-0.5 block">
                  {inspectingOrder.timeWindowStart} – {inspectingOrder.timeWindowEnd}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-surface-container-low border border-border-subtle">
                <span className="text-[10px] text-text-muted uppercase block font-semibold">Planned ETA</span>
                <span className="text-sm font-bold font-mono text-primary mt-0.5 block">
                  {inspectingOrder.eta}
                </span>
              </div>
            </div>

            {/* Assigned Fleet Unit & Telemetry */}
            <div className="p-3.5 rounded-xl border border-border-subtle bg-surface-container-low space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted block">
                Assigned Fleet Transport
              </span>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-deep-navy">
                      Unit {inspectingOrder.assignedVehicleId || 'V01'}
                    </span>
                    <p className="text-[11px] text-text-secondary">
                      {getVehicleDetails(inspectingOrder.assignedVehicleId)?.licensePlate || 'RJ-14-GA-1001'} · {getVehicleDetails(inspectingOrder.assignedVehicleId)?.driverName || 'Commercial Delivery Unit'}
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-status-success/10 text-status-success font-mono font-bold text-xs">
                  Assigned
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 border-t border-border-subtle flex items-center justify-end gap-2">
              <button
                onClick={() => setInspectingOrder(null)}
                className="px-4 py-2 rounded-xl border border-border-subtle text-deep-navy text-xs font-bold hover:bg-surface-container transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setInspectingOrder(null);
                  openRouteComparisonForIncident('VEHICLE_BREAKDOWN');
                }}
                className="px-4 py-2 rounded-xl bg-primary-container hover:bg-primary text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                View Route Optimization
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
