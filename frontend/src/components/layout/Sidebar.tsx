import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Radio,
  Package,
  Truck,
  Route as RouteIcon,
  FlaskConical,
  BarChart3,
  Smartphone,
  Settings,
  ShieldAlert,
} from 'lucide-react';
import { useFleet } from '../../context/FleetContext';
import { useTranslation } from '../../context/LanguageContext';

export const Sidebar: React.FC = () => {
  const { cascadingFailureActive } = useFleet();
  const { t } = useTranslation();

  const navItems = [
    { to: '/', label: t('nav.dashboard'), icon: LayoutDashboard },
    { to: '/operations', label: t('nav.operations'), icon: Radio },
    { to: '/fleet', label: t('nav.fleetAssets'), icon: Truck },
    { to: '/orders', label: t('nav.ordersSla'), icon: Package },
    { to: '/routes', label: t('nav.routesWaypoints'), icon: RouteIcon },
    { to: '/what-if', label: t('nav.whatIfSimulator'), icon: FlaskConical },
    { to: '/analytics', label: t('nav.analytics'), icon: BarChart3 },
    { to: '/driver', label: t('nav.driverDashboard'), icon: Smartphone, highlight: true },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-nav-command z-50 flex flex-col justify-between border-r border-slate-800/80 select-none">
      <div className="flex flex-col">
        {/* Brand Header with MargDarshak Emblem */}
        <div className="h-16 flex items-center gap-3 px-4 border-b border-slate-800/80">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" className="h-8 w-8 shrink-0" fill="none">
            <rect width="40" height="40" rx="8" fill="#1E293B" />
            <path d="M10 30L20 10L30 30L20 23L10 30Z" fill="#2563EB" stroke="#60A5FA" strokeWidth="1.5" strokeLinejoin="round" />
            <circle cx="20" cy="19" r="2.5" fill="#FFFFFF" />
            <circle cx="28" cy="14" r="2" fill="#10B981" />
            <path d="M20 10L28 14" stroke="#10B981" strokeWidth="1.5" strokeDasharray="2 2" />
          </svg>
          <div className="flex flex-col min-w-0 leading-tight">
            <span className="text-white font-semibold text-sm tracking-tight truncate flex items-center gap-1.5">
              MargDarshak
              {cascadingFailureActive && (
                <span className="h-2 w-2 rounded-full bg-status-critical animate-ping" title="Cascading Incident Active" />
              )}
            </span>
            <span className="text-text-muted text-[11px] truncate">{t('nav.intelligentSolver')}</span>
          </div>
        </div>

        {/* Primary Navigation Rail */}
        <nav className="flex flex-col gap-1 px-2.5 pt-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-primary-container text-white shadow-sm font-semibold'
                      : item.highlight
                      ? 'text-status-info hover:bg-slate-800/80 hover:text-white'
                      : 'text-text-muted hover:bg-slate-800/60 hover:text-white'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
                {item.highlight && (
                  <span className="ml-auto text-[9px] px-1.5 py-0.2 rounded bg-status-info/20 text-status-info font-bold">
                    {t('nav.cabTag')}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer System Status & Dispatch Info */}
      <div className="p-3 flex flex-col gap-2 border-t border-slate-800/80 text-xs">
        {/* Real-time Telemetry & Solver Link */}
        <div className="flex items-center justify-between px-2.5 py-1.5 rounded bg-slate-900/90 border border-slate-800 text-text-muted">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`h-2 w-2 rounded-full shrink-0 ${cascadingFailureActive ? 'bg-status-critical animate-ping' : 'bg-status-success animate-pulse'}`} />
            <span className="text-[11px] truncate">
              {cascadingFailureActive ? t('nav.degradedFleet') : t('nav.solverSync')}
            </span>
          </div>
          <span className="font-mono text-[10px] text-slate-400">14ms</span>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-1">
          <div className="flex items-center gap-1.5">
            <Settings className="w-3.5 h-3.5 text-slate-500" />
            <span>Jaipur Hub</span>
          </div>
          <span className="font-mono text-[10px]">v4.9-OR</span>
        </div>
      </div>
    </aside>
  );
};
