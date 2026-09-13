import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Truck, ShieldCheck, ArrowLeftRight, Wifi } from 'lucide-react';
import { useFleet } from '../../context/FleetContext';
import { useTranslation } from '../../context/LanguageContext';
import { LanguageSelector } from '../common/LanguageSelector';

interface DriverHeaderProps {
  onOpenMenu: () => void;
}

export const DriverHeader: React.FC<DriverHeaderProps> = ({ onOpenMenu }) => {
  const navigate = useNavigate();
  const { activeDriver, activeDriverVehicle, wsStatus } = useFleet();
  const { t } = useTranslation();

  return (
    <header className="fixed top-0 inset-x-0 z-40 bg-[#0B1220] border-b border-slate-800/80 text-white select-none shadow-md">
      <div className="max-w-[1720px] mx-auto h-16 px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* LEFT: MargDarshak Brand + Driver App Tag + Language Selector */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="flex items-center gap-2.5 cursor-pointer shrink-0" onClick={() => navigate('/driver')}>
            {/* MargDarshak SVG Logo Emblem */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" className="h-8 w-8 shrink-0" fill="none">
              <rect width="40" height="40" rx="8" fill="#1E293B" />
              <path d="M10 30L20 10L30 30L20 23L10 30Z" fill="#2563EB" stroke="#60A5FA" strokeWidth="1.5" strokeLinejoin="round" />
              <circle cx="20" cy="19" r="2.5" fill="#FFFFFF" />
              <circle cx="28" cy="14" r="2" fill="#10B981" />
              <path d="M20 10L28 14" stroke="#10B981" strokeWidth="1.5" strokeDasharray="2 2" />
            </svg>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight text-white leading-tight">
                MargDarshak
              </span>
              <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                {t('driver.smarterRoutes', 'Driver Console')}
              </span>
            </div>
          </div>

          <div className="hidden sm:block h-6 w-px bg-slate-800 shrink-0" />

          {/* Top-level Language Selector right at the beginning */}
          <LanguageSelector theme="dark" />
        </div>

        {/* RIGHT: Vehicle info, Pilot Identity, Online status, Fleet Manager Switcher, Hamburger menu */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Quick Switch to Fleet Manager Dashboard */}
          <button
            onClick={() => navigate('/')}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-medium border border-slate-700/80 transition-colors shadow-xs cursor-pointer"
            title="Switch to Fleet Manager Dashboard"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-status-info" />
            <span>{t('driver.switchFleetManager', 'Fleet Manager')}</span>
          </button>

          {/* Vehicle Identifier */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
            <Truck className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-bold text-white font-mono">
              {activeDriverVehicle?.shortId || (activeDriverVehicle?.id && activeDriverVehicle.id.length <= 8 ? activeDriverVehicle.id : 'V01')}
            </span>
            <span className="text-slate-400 hidden xl:inline">• {activeDriverVehicle?.licensePlate || 'RJ-14-GA-1001'}</span>
          </div>

          {/* Pilot Name & Online Status */}
          <div className="flex items-center gap-2.5 pl-1">
            <div className="relative">
              <img
                src={activeDriver.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'}
                alt={activeDriver.name}
                className="w-8 h-8 rounded-full object-cover border border-slate-700"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-status-success border-2 border-[#0B1220]" />
            </div>

            <div className="hidden lg:flex flex-col text-left leading-tight">
              <span className="text-xs font-bold text-white">{activeDriver.name}</span>
              <div className="flex items-center gap-1 text-[11px] text-emerald-400">
                <Wifi className={`w-2.5 h-2.5 ${wsStatus === 'CONNECTED' ? 'text-emerald-400' : wsStatus === 'RECONNECTING' ? 'text-amber-400 animate-pulse' : 'text-red-400'}`} />
                <span className={wsStatus === 'CONNECTED' ? 'text-emerald-400' : wsStatus === 'RECONNECTING' ? 'text-amber-400' : 'text-red-400'}>
                  {wsStatus === 'CONNECTED' ? t('driver.liveGpsSynced') : wsStatus === 'RECONNECTING' ? t('driver.reconnecting') : t('driver.offline')}
                </span>
              </div>
            </div>
          </div>

          {/* Hamburger Menu Button */}
          <button
            onClick={onOpenMenu}
            className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors border border-slate-700/80"
            aria-label="Open Driver Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
