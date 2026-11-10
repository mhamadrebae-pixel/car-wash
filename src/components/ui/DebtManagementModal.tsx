'use client';

import React, { useState } from 'react';
import { Vehicle, PaymentMethod } from '@/types';
import { PlateDisplay } from './PlateDisplay';
import { formatIQD } from '@/lib/storage';
import { openWhatsAppChat } from '@/lib/whatsapp';
import { X, CheckCircle2, Phone, MessageCircle, AlertCircle, Coins, DollarSign } from 'lucide-react';

interface DebtManagementModalProps {
  vehicles: Vehicle[];
  onSettleDebt: (vehicleId: string, washRecordId: string, method: PaymentMethod) => void;
  onClose: () => void;
}

export const DebtManagementModal: React.FC<DebtManagementModalProps> = ({
  vehicles,
  onSettleDebt,
  onClose,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash');

  // Extract all unpaid records
  const unpaidItems = vehicles.flatMap((v) =>
    (v.washHistory || [])
      .filter((w) => w.paymentStatus === 'unpaid' || w.paymentMethod === 'debt')
      .map((w) => ({ vehicle: v, wash: w }))
  );

  const totalOutstanding = unpaidItems.reduce((sum, item) => sum + (Number(item.wash.price) || 0), 0);

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-5 sm:p-6 space-y-4 shadow-2xl relative text-slate-900 dark:text-white my-auto" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 flex items-center justify-center font-bold">
              <Coins className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900 dark:text-white">بەڕێوەبردنی قەرزەکان (Unpaid Washes)</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">چاودێری و وەرگرتنەوەی پارەی ئەو سەیارانەی ماونەتەوە</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-xl transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Total Debt Summary Banner */}
        <div className="p-3.5 bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-2xl flex items-center justify-between text-xs">
          <div>
            <span className="text-rose-700 dark:text-rose-300 font-bold block">کۆی گشتی قەرزی وەرنەگیراو:</span>
            <span className="text-lg font-black font-mono text-rose-900 dark:text-rose-200">{formatIQD(totalOutstanding)}</span>
          </div>
          <span className="text-xs px-2.5 py-1 bg-white dark:bg-slate-800 text-rose-800 dark:text-rose-300 font-bold rounded-xl border border-rose-200 dark:border-rose-800 shadow-2xs">
            {unpaidItems.length} سەیارەی نەدراو
          </span>
        </div>

        {/* Payment method selector for settlement */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-bold whitespace-nowrap">شێوازی دانەوە:</span>
          <div className="flex gap-1.5 flex-1">
            {[
              { id: 'cash', label: '💵 نەقد (کاش)' },
              { id: 'fastpay', label: '📱 FastPay' },
              { id: 'fib', label: '🏦 FIB' },
            ].map((pm) => (
              <button
                key={pm.id}
                type="button"
                onClick={() => setSelectedMethod(pm.id as any)}
                className={`py-1.5 px-3 rounded-xl font-bold transition text-xs border cursor-pointer ${
                  selectedMethod === pm.id
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                }`}
              >
                {pm.label}
              </button>
            ))}
          </div>
        </div>

        {/* List of Unpaid Cars */}
        <div className="max-h-80 overflow-y-auto space-y-2.5 pr-1">
          {unpaidItems.length === 0 ? (
            <div className="py-10 text-center space-y-2 text-slate-400 dark:text-slate-500">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 opacity-70" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">هیچ قەرزێک تۆمار نەکراوە! هەموو حساباتەکان تەواون.</p>
            </div>
          ) : (
            unpaidItems.map(({ vehicle, wash }) => (
              <div
                key={wash.id}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 hover:bg-white dark:hover:bg-slate-800 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <PlateDisplay plate={vehicle.plate} size="sm" />
                  <div>
                    <div className="font-extrabold text-slate-900 dark:text-white text-xs">
                      {vehicle.ownerName} • <span className="text-slate-500 dark:text-slate-400 font-medium">{vehicle.carModel}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                      <span>{wash.serviceName}</span>
                      <span>•</span>
                      <span>{wash.date ? wash.date.split('T')[0] : 'بەروار نادیار'}</span>
                      {wash.debtNote && (
                        <span className="text-rose-600 dark:text-rose-400 font-sans italic bg-rose-50 dark:bg-rose-950/60 px-1 rounded">
                          "{wash.debtNote}"
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <span className="font-black font-mono text-rose-700 dark:text-rose-400 text-sm whitespace-nowrap">
                    {formatIQD(wash.price)}
                  </span>

                  {vehicle.phone && (
                    <button
                      onClick={() => {
                        const msg = `سڵاو بەڕێز ${vehicle.ownerName}، لە بەڕێوەبەرایەتی غەسلی ئۆتۆمبێلەوە ئاگادارت دەکەینەوە کە بڕی ${formatIQD(wash.price)} ماوەتەوە لەسەر سەیارەکەت. سوپاس بۆ هاوکاریت.`;
                        openWhatsAppChat(vehicle.phone, msg);
                      }}
                      className="p-1.5 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 rounded-xl transition cursor-pointer"
                      title="ناردنی نامەی یادخستنەوەی قەرز لە ڕێگەی WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    onClick={() => onSettleDebt(vehicle.id, wash.id, selectedMethod)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    وەرگیرا
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer"
          >
            داخستن
          </button>
        </div>
      </div>
    </div>
  );
};
