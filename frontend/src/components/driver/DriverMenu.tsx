import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  LayoutDashboard,
  Route as RouteIcon,
  Package,
  Bell,
  User,
  LogOut,
  Truck,
  MapPin,
  Clock,
  ShieldCheck,
  ArrowLeftRight,
} from 'lucide-react';
import { useFleet } from '../../context/FleetContext';
import { useTranslation } from '../../context/LanguageContext';

interface DriverMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFullRoute: () => void;
  onOpenDispatcher: () => void;
}

export const DriverMenu: React.FC<DriverMenuProps> = ({
  isOpen,
  onClose,
  onOpenFullRoute,
  onOpenDispatcher,
}) => {
  const navigate = useNavigate();
  const {
    activeDriver,
    activeDriverVehicle,
    activeDriverRoute,
    driverKpis,
    drivers,
    setActiveDriverId,
  } = useFleet();
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end animate-in fade-in select-none">
      <div className="w-full max-w-xs bg-surface-main h-full shadow-2xl flex flex-col justify-between border-l border-border-subtle animate-in slide-in-from-right duration-200">
        <div className="flex flex-col">
          {/* Header */}
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary-container flex items-center justify-center font-bold text-xs">
                MD
              </div>
              <span className="font-bold text-sm">MargDarshak {t('driver.driverApp')}</span>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Pilot Profile Card */}
          <div className="p-4 bg-surface-container-low border-b border-border-subtle">
            <div className="flex items-center gap-3">
              <img
                src={
                  activeDriver.avatarUrl ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'
                }
                alt={activeDriver.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-primary-container"
              />
              <div className="flex flex-col">
                <span className="font-bold text-deep-navy text-sm">{activeDriver.name}</span>
                <span className="text-xs font-mono text-text-muted">ID: {activeDriver.id}</span>
                <span className="text-[11px] text-text-secondary mt-0.5">
                  {t('vehicle.unit')}: <strong className="text-deep-navy">{activeDriverVehicle?.id || 'V01'}</strong> ({activeDriverVehicle?.licensePlate || 'RJ-14-UB-2041'})
                </span>
              </div>
            </div>

            {/* Shift hours indicator */}
            <div className="mt-3 p-2 rounded-lg bg-white border border-border-subtle flex items-center justify-between text-xs font-mono">
              <span className="text-text-muted">{t('driver.dutyShift')}</span>
              <span className="font-bold text-status-success">
                {activeDriver.hoursUsed}h / {activeDriver.hoursLimit}h (Compliant)
              </span>
            </div>

            {/* Driver switcher for demo / testing */}
            <div className="mt-2 text-[10px] text-text-muted flex items-center justify-between">
              <span>{t('driver.switchPilotProfile')}:</span>
              <select
                value={activeDriver.id}
                onChange={(e) => setActiveDriverId(e.target.value)}
                className="font-semibold text-deep-navy bg-white border border-border-subtle rounded px-1.5 py-0.5 text-[10px]"
              >
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.vehicleId})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 flex flex-col gap-1 text-xs font-semibold">
            <button
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-blue-50 text-primary-container transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>{t('navigation.driverDashboard')}</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenFullRoute();
              }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-deep-navy hover:bg-slate-100 transition-colors"
            >
              <RouteIcon className="w-4 h-4 text-text-secondary" />
              <span>{t('driver.myRouteManifest')}</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenFullRoute();
              }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-deep-navy hover:bg-slate-100 transition-colors"
            >
              <Package className="w-4 h-4 text-text-secondary" />
              <span>{t('driver.todaysDeliveries')} ({driverKpis.completedDeliveries}/{driverKpis.totalDeliveries})</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenDispatcher();
              }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-deep-navy hover:bg-slate-100 transition-colors"
            >
              <Bell className="w-4 h-4 text-text-secondary" />
              <span>{t('driver.dispatchNotifications')}</span>
            </button>
          </nav>
        </div>

        {/* Footer / Switch Role */}
        <div className="p-4 border-t border-border-subtle bg-slate-50 flex flex-col gap-2">
          <button
            onClick={() => {
              onClose();
              navigate('/');
            }}
            className="w-full py-2.5 px-3 rounded-xl bg-primary-container hover:bg-primary text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs"
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>{t('driver.switchFleetManager')}</span>
          </button>

          <button
            onClick={() => {
              onClose();
              navigate('/');
            }}
            className="w-full py-2 text-xs font-semibold text-text-muted hover:text-deep-navy text-center"
          >
            {t('driver.signOut')}
          </button>
        </div>
      </div>
    </div>
  );
};
