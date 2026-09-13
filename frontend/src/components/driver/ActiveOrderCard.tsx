import React, { useState } from 'react';
import {
  Package,
  Phone,
  Clock,
  MapPin,
  FileText,
  AlertCircle,
  Check,
  ThermometerSnowflake,
  ShieldCheck,
} from 'lucide-react';
import { useFleet } from '../../context/FleetContext';
import { useTranslation } from '../../context/LanguageContext';

export const ActiveOrderCard: React.FC = () => {
  const { activeOrder, activeDriverRoute, currentStopIndex } = useFleet();
  const { t } = useTranslation();

  const [callModalOpen, setCallModalOpen] = useState<boolean>(false);
  const [copiedPhone, setCopiedPhone] = useState<boolean>(false);

  // Dynamic customer contact from order or realistic fallback
  const customerPhone = '+91 98291 55420';

  if (!activeOrder) {
    return (
      <div className="bg-surface-main p-4 rounded-2xl border border-border-subtle shadow-xs text-xs text-text-muted text-center">
        {t('driver.noActiveOrders')}
      </div>
    );
  }

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(customerPhone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  return (
    <div className="bg-surface-main rounded-2xl border border-border-subtle shadow-xs p-4 flex flex-col gap-3 select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
        <div className="flex items-center gap-1.5">
          <Package className="w-4 h-4 text-primary-container" />
          <h3 className="text-xs font-bold text-deep-navy uppercase tracking-wider">
            {t('driver.activeOrder')}
          </h3>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-status-info/15 text-status-info font-mono text-[10px] font-bold uppercase tracking-wide">
          {activeOrder.slaStatus === 'DELIVERED' ? t('statuses.delivered') : t('orders.outForDelivery')}
        </span>
      </div>

      {/* Order ID & Priority */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-base font-extrabold text-deep-navy">
          {activeOrder.id}
        </span>
        <span
          className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
            activeOrder.priority === 'CRITICAL'
              ? 'bg-status-critical/15 text-status-critical'
              : activeOrder.priority === 'HIGH'
              ? 'bg-status-warning/15 text-status-warning'
              : 'bg-surface-container text-deep-navy'
          }`}
        >
          {activeOrder.priority} {t('driver.priority')}
        </span>
      </div>

      {/* Field Details */}
      <div className="flex flex-col gap-2.5 text-xs">
        {/* Customer */}
        <div>
          <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
            {t('driver.customer')}
          </div>
          <div className="font-bold text-deep-navy text-sm mt-0.5">
            {activeOrder.consignee}
          </div>
        </div>

        {/* Address */}
        <div>
          <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
            {t('driver.address', 'Address')}
          </div>
          <div className="text-text-secondary mt-0.5 leading-snug">
            {activeOrder.address}, {activeOrder.zone}, Jaipur - {activeOrder.pincode}
          </div>
        </div>

        {/* Items & Cold Chain */}
        <div>
          <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
            {t('driver.consignmentItems', 'Consignment Items')}
          </div>
          <div className="flex items-center gap-1.5 font-semibold text-deep-navy mt-0.5">
            {activeOrder.loadType === 'COLD_CHAIN' ? (
              <span className="inline-flex items-center gap-1 text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                <ThermometerSnowflake className="w-3.5 h-3.5 text-cyan-600" />
                <span>5 boxes • Cold Chain (2°-8°C) • {activeOrder.weightKg} kg</span>
              </span>
            ) : (
              <span>4 cartons • General Freight • {activeOrder.weightKg} kg</span>
            )}
          </div>
        </div>

        {/* Time Window */}
        <div className="grid grid-cols-2 gap-2 p-2 rounded-xl bg-surface-container-low border border-border-subtle">
          <div>
            <div className="text-[10px] text-text-muted font-medium">{t('driver.timeWindow', 'Delivery Window')}</div>
            <div className="font-mono font-bold text-deep-navy text-xs mt-0.5">
              {activeOrder.timeWindowStart} – {activeOrder.timeWindowEnd}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-text-muted font-medium">{t('driver.estimatedArrival', 'Estimated Arrival')}</div>
            <div className="font-mono font-bold text-status-success text-xs mt-0.5">
              {activeOrder.eta}
            </div>
          </div>
        </div>

        {/* Special Instructions */}
        <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80">
          <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1">
            <FileText className="w-3 h-3" /> {t('driver.specialInstructions', 'Special Instructions')}
          </div>
          <p className="text-[11px] text-amber-900 mt-1 leading-relaxed">
            {activeOrder.notes ||
              'Call consignee before arrival. Verify temperature logger with reception security at Gate #2.'}
          </p>
        </div>
      </div>

      {/* Call Customer Button */}
      <button
        onClick={() => setCallModalOpen(true)}
        type="button"
        className="mt-1 w-full py-2.5 px-3 rounded-xl bg-surface-container-high hover:bg-surface-container text-deep-navy text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-98 shadow-xs"
      >
        <Phone className="w-3.5 h-3.5 text-primary-container" />
        <span>{t('driver.callCustomer', 'Call Customer')} ({customerPhone})</span>
      </button>

      {/* Call Customer Modal */}
      {callModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-surface-main w-full max-w-sm rounded-2xl shadow-xl border border-border-subtle p-5 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-primary-container flex items-center justify-center">
                <Phone className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-deep-navy">{t('driver.contactConsignee')}</h4>
                <p className="text-xs text-text-muted">{activeOrder.consignee}</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-text-muted">{t('driver.directPhoneLine')}</span>
                <div className="font-mono font-bold text-sm text-deep-navy">{customerPhone}</div>
              </div>
              <button
                onClick={handleCopyPhone}
                className="px-2.5 py-1 rounded bg-white hover:bg-slate-100 border border-border-subtle text-xs font-semibold text-deep-navy transition-colors flex items-center gap-1"
              >
                {copiedPhone ? (
                  <>
                    <Check className="w-3 h-3 text-status-success" />
                    <span>{t('common.copied')}</span>
                  </>
                ) : (
                  <span>{t('common.copy')}</span>
                )}
              </button>
            </div>

            <a
              href={`tel:${customerPhone}`}
              className="w-full py-2.5 rounded-xl bg-primary-container hover:bg-primary text-white text-xs font-bold text-center shadow-xs transition-colors"
            >
              {t('driver.dialNow')}
            </a>

            <button
              onClick={() => setCallModalOpen(false)}
              className="w-full py-2 text-xs font-semibold text-text-muted hover:text-deep-navy transition-colors"
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
