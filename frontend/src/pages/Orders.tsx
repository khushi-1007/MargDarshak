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
} from 'lucide-react';
import { Order } from '../types/order';

export const Orders: React.FC = () => {
  const {
    orders,
    injectPriorityOrder,
    openRouteComparisonForIncident,
  } = useFleet();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterSla, setFilterSla] = useState<string>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

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

  const activeFocusOrder = selectedOrder || orders.find((o) => o.id === '#1008') || orders[0];

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
            className="h-8 px-3.5 rounded-lg bg-primary-container hover:bg-primary text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
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
            className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
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

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-surface-container-low text-text-secondary font-semibold uppercase text-[11px] border-b border-border-subtle">
                  <th className="py-2.5 px-3">Order ID</th>
                  <th className="py-2.5 px-3">Consignee</th>
                  <th className="py-2.5 px-3">Destination / Zone</th>
                  <th className="py-2.5 px-3 text-right">Payload</th>
                  <th className="py-2.5 px-3">Window</th>
                  <th className="py-2.5 px-3">Vehicle</th>
                  <th className="py-2.5 px-3">ETA</th>
                  <th className="py-2.5 px-3">SLA Status</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
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
                      className={`hover:bg-surface-container-low cursor-pointer transition-colors ${
                        isSelected ? 'bg-primary/5' : isUnserviceable ? 'bg-error-container/20' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 font-mono font-bold text-deep-navy">
                        <div className="flex items-center gap-1">
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
                            <span className="text-[10px] text-ai-intelligence font-bold">
                              Cold Chain (2°–8°C)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-text-secondary truncate max-w-[140px]">
                        {ord.address}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-deep-navy">
                        {ord.weightKg} kg
                      </td>
                      <td className="py-2.5 px-3 font-mono text-text-secondary text-[11px]">
                        {ord.timeWindowStart} – {ord.timeWindowEnd}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-primary">
                        {ord.assignedVehicleId}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-deep-navy">
                        {ord.eta}
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge status={ord.slaStatus} type="sla" />
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOrder(ord);
                          }}
                          className="p-1 rounded hover:bg-surface-container text-primary"
                        >
                          <Eye className="w-3.5 h-3.5" />
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
              <span className="px-2 py-0.5 rounded bg-surface-container text-status-success text-xs font-semibold">
                Stable
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
                    className="text-status-success"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeDasharray="95, 100"
                    strokeLinecap="round"
                    strokeWidth="3.5"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-base font-bold text-deep-navy font-mono">95%</span>
                  <span className="text-[9px] text-text-muted">On-Time</span>
                </div>
              </div>

              <div className="flex flex-col gap-1 flex-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-text-muted">On-Time Dispatches:</span>
                  <span className="font-mono font-bold text-status-success">14 / 15</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">At-Risk Corridors:</span>
                  <span className="font-mono font-bold text-status-warning">1 (Tonk Rd)</span>
                </div>
                <span className="text-[10px] text-text-muted mt-1 leading-tight">
                  Dynamic re-routes protected 3 potential delivery breaches today.
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

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-text-muted text-[11px] block">Consignee & Destination:</span>
                  <strong className="text-deep-navy text-xs">{activeFocusOrder.consignee}</strong>
                  <p className="text-[11px] text-text-secondary">{activeFocusOrder.address}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="p-2 rounded-lg bg-surface-container-low">
                    <span className="text-[10px] text-text-muted uppercase block">Delivery Window</span>
                    <span className="font-mono font-bold text-deep-navy text-xs">
                      {activeFocusOrder.timeWindowStart} – {activeFocusOrder.timeWindowEnd}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-surface-container-low">
                    <span className="text-[10px] text-text-muted uppercase block">Assigned Unit</span>
                    <span className="font-mono font-bold text-primary text-xs">
                      Vehicle {activeFocusOrder.assignedVehicleId}
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

              <div className="pt-2 border-t border-border-subtle flex items-center justify-end">
                <button
                  onClick={() => openRouteComparisonForIncident('VEHICLE_BREAKDOWN')}
                  className="w-full py-1.5 rounded-lg bg-primary-container hover:bg-primary text-white text-xs font-bold shadow-xs transition-colors"
                >
                  View Route Comparison Delta
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
