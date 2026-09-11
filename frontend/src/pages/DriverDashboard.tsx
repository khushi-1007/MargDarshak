import React, { useState } from 'react';
import { useFleet } from '../context/FleetContext';
import { DriverHeader } from '../components/driver/DriverHeader';
import { DriverKpiRow } from '../components/driver/DriverKpiRow';
import { RouteUpdateBanner } from '../components/driver/RouteUpdateBanner';
import { TodaysRoute } from '../components/driver/TodaysRoute';
import { DriverMap } from '../components/driver/DriverMap';
import { CurrentStopCard } from '../components/driver/CurrentStopCard';
import { ActiveOrderCard } from '../components/driver/ActiveOrderCard';
import { RecentUpdates } from '../components/driver/RecentUpdates';
import { DriverActionFooter } from '../components/driver/DriverActionFooter';
import { ReportIssueModal } from '../components/driver/ReportIssueModal';
import { DispatcherModal } from '../components/driver/DispatcherModal';
import { DriverMenu } from '../components/driver/DriverMenu';
import { FullRouteModal } from '../components/driver/FullRouteModal';
import { RouteComparisonDrawer } from '../components/routes/RouteComparisonDrawer';
import { Users, ChevronDown } from 'lucide-react';

export const DriverDashboard: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [reportIssueOpen, setReportIssueOpen] = useState<boolean>(false);
  const [dispatcherOpen, setDispatcherOpen] = useState<boolean>(false);
  const [fullRouteOpen, setFullRouteOpen] = useState<boolean>(false);

  const { drivers, vehicles, activeDriverId, setActiveDriverId, activeDriver, activeDriverVehicle } = useFleet();

  return (
    <div className="min-h-screen bg-bg-canvas text-deep-navy flex flex-col selection:bg-primary-container selection:text-white">
      {/* 1. Driver Dashboard Header */}
      <DriverHeader onOpenMenu={() => setMenuOpen(true)} />

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto px-4 sm:px-6 pt-20 pb-8 flex flex-col gap-4">

        {/* Driver Switcher Bar — lets judges see any driver's live console */}
        {drivers.length > 1 && (
          <div className="bg-[#0B1220] rounded-xl border border-slate-700/60 px-4 py-2.5 flex items-center gap-3 shadow-sm select-none">
            <div className="flex items-center gap-1.5 text-slate-400 shrink-0">
              <Users className="w-3.5 h-3.5" />
              <span className="text-[11px] font-semibold uppercase tracking-wider">Pilot Terminal</span>
            </div>
            <div className="h-4 w-px bg-slate-700 shrink-0" />
            <div className="flex items-center gap-2 flex-wrap">
              {drivers.map((d) => {
                const vehicle = vehicles.find((v) => v.id === d.vehicleId || v.driverId === d.id);
                const isActive = d.id === activeDriverId || (!activeDriverId && d.id === drivers[0]?.id);
                return (
                  <button
                    key={d.id}
                    onClick={() => setActiveDriverId(d.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-primary text-white shadow-xs'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60'
                    }`}
                    title={`Switch to ${d.name}`}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: vehicle?.color || '#2563eb' }}
                    />
                    <span>{vehicle?.shortId || 'V??'}</span>
                    <span className="hidden sm:inline opacity-70">• {d.name.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
            {activeDriver && activeDriverVehicle && (
              <div className="ml-auto hidden md:flex items-center gap-1.5 text-slate-400 text-[11px] shrink-0">
                <span className="font-mono text-emerald-400 font-bold">{activeDriverVehicle.shortId}</span>
                <span>·</span>
                <span>{activeDriverVehicle.licensePlate}</span>
                <span>·</span>
                <span className="text-slate-300 font-semibold">{activeDriver.name}</span>
              </div>
            )}
          </div>
        )}

        {/* 2. Top Dynamic Route Alert Banner (if re-routed/disrupted) */}
        <RouteUpdateBanner />

        {/* 3. Top 5 KPI Cards Row */}
        <DriverKpiRow />

        {/* 4. Main 3-Column Layout: Left (Route Timeline) | Center (Map & Current Stop) | Right (Active Order & Updates) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start w-full">
          {/* LEFT: Today's Route (Col 3 on xl, Col 4 on lg) */}
          <div className="lg:col-span-4 xl:col-span-3 w-full">
            <TodaysRoute onOpenFullRoute={() => setFullRouteOpen(true)} />
          </div>

          {/* CENTER: Map & Below Map: Current Stop Details (Col 5 on xl, Col 4 on lg) */}
          <div className="lg:col-span-4 xl:col-span-5 w-full flex flex-col gap-4">
            <DriverMap />
            <CurrentStopCard />
          </div>

          {/* RIGHT: Active Order + Recent Updates + Actions (Col 4 on xl & lg) */}
          <div className="lg:col-span-4 xl:col-span-4 w-full flex flex-col gap-4">
            <ActiveOrderCard />
            <RecentUpdates />
            <DriverActionFooter
              onOpenReportIssue={() => setReportIssueOpen(true)}
              onOpenDispatcher={() => setDispatcherOpen(true)}
            />
          </div>
        </div>
      </main>

      {/* Interactive Modals and Drawers */}
      <DriverMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        onOpenFullRoute={() => {
          setMenuOpen(false);
          setFullRouteOpen(true);
        }}
        onOpenDispatcher={() => {
          setMenuOpen(false);
          setDispatcherOpen(true);
        }}
      />

      <ReportIssueModal
        isOpen={reportIssueOpen}
        onClose={() => setReportIssueOpen(false)}
      />

      <DispatcherModal
        isOpen={dispatcherOpen}
        onClose={() => setDispatcherOpen(false)}
      />

      <FullRouteModal
        isOpen={fullRouteOpen}
        onClose={() => setFullRouteOpen(false)}
      />

      {/* Global Route Comparison Drawer (accessible when reviewing dynamic re-routes) */}
      <RouteComparisonDrawer />
    </div>
  );
};
