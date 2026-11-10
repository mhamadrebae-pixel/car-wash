'use client';

import React, { useState } from 'react';
import { Vehicle, VipSubscription, PaymentMethod, AppSettings } from '@/types';
import { formatIQD, playPosSound } from '@/lib/storage';
import {
  Crown,
  X,
  CheckCircle2,
  Calendar,
  Sparkles,
  ShieldCheck,
  CreditCard,
  DollarSign,
} from 'lucide-react';
import { PlateDisplay } from './PlateDisplay';

interface SubscriptionModalProps {
  vehicle: Vehicle;
  settings: AppSettings;
  onSubscribe: (updatedVehicle: Vehicle, amountPaid: number, paymentMethod: PaymentMethod) => void;
  onClose: () => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  vehicle,
  settings,
  onSubscribe,
  onClose,
}) => {
  const monthlyPrice = settings.vipMonthlyPlanPrice || 50000;
  const quarterlyPrice = settings.vipQuarterlyPlanPrice || 130000;

  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'quarterly'>('monthly');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');

  const plans = [
    {
      id: 'monthly' as const,
      name: 'ئابوونەی VIP مانگانە (١ مانگ بێسنوور)',
      durationDays: 30,
      price: monthlyPrice,
      desc: 'شۆردنی بێسنووری تەواوی ئۆتۆمبێل بۆ ماوەی ٣٠ ڕۆژ',
      badge: 'باوترین هەڵبژاردن',
    },
    {
      id: 'quarterly' as const,
      name: 'ئابوونەی VIP وەرزانە (٣ مانگ بێسنوور)',
      durationDays: 90,
      price: quarterlyPrice,
      desc: 'شۆردنی بێسنوور بۆ ماوەی ٩٠ ڕۆژ بە داشکاندنی تایبەت',
      badge: 'داشکاندنی %15',
    },
  ];

  const currentPlan = plans.find((p) => p.id === selectedPlan)!;

  const handleConfirm = () => {
    const startDate = new Date().toISOString();
    const endDateObj = new Date();
    endDateObj.setDate(endDateObj.getDate() + currentPlan.durationDays);
    const endDate = endDateObj.toISOString();

    const subscription: VipSubscription = {
      planId: currentPlan.id,
      planName: currentPlan.name,
      startDate,
      endDate,
      pricePaid: currentPlan.price,
      status: 'active',
    };

    const updatedVehicle: Vehicle = {
      ...vehicle,
      subscription,
    };

    try {
      playPosSound('cash');
    } catch {}

    onSubscribe(updatedVehicle, currentPlan.price, paymentMethod);
    onClose();
  };

  const isAlreadyActive =
    vehicle.subscription &&
    vehicle.subscription.status === 'active' &&
    new Date(vehicle.subscription.endDate) > new Date();

  return (
    <div
      className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl relative text-slate-900 dark:text-white my-auto animate-in fade-in zoom-in-95 duration-150"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center justify-center font-bold">
              <Crown className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900 dark:text-white">
                بەشداریکردنی مانگانەی بێسنوور (VIP Unlimited)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                شۆردنی بێسنووری ئۆتۆمبێل بە کارتی ئەندامێتی
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Vehicle Badge */}
        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl">
          <div className="flex items-center gap-2.5">
            <PlateDisplay plate={vehicle.plate} size="sm" />
            <div className="text-right">
              <span className="text-xs font-black text-slate-900 dark:text-white block">{vehicle.ownerName}</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">{vehicle.carModel} ({vehicle.color})</span>
            </div>
          </div>
          {isAlreadyActive && (
            <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 px-2 py-0.5 rounded-full font-bold">
              ئابوونەی چالاکە
            </span>
          )}
        </div>

        {/* Plans Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
            پاکێجی بەشداریکردن هەڵبژێرە:
          </label>
          <div className="space-y-2">
            {plans.map((plan) => {
              const isSelected = selectedPlan === plan.id;
              return (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`p-3.5 rounded-2xl border-2 transition cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-500 dark:border-amber-500 shadow-sm'
                      : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-xs text-slate-900 dark:text-white">{plan.name}</span>
                      <span className="text-[9px] bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 px-1.5 py-0.2 rounded-full font-bold">
                        {plan.badge}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">{plan.desc}</p>
                  </div>
                  <div className="text-left font-mono shrink-0">
                    <span className="text-sm font-black text-amber-900 dark:text-amber-300">{formatIQD(plan.price)}</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-sans">بۆ {plan.durationDays} ڕۆژ</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Method */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">شێوازی وەرگرتنی پارەی ئابوونە:</label>
          <div className="grid grid-cols-3 gap-2 text-xs">
            {[
              { id: 'cash' as const, label: '💵 نەقد' },
              { id: 'fastpay' as const, label: '📱 FastPay' },
              { id: 'fib' as const, label: '🏦 FIB' },
            ].map((pm) => (
              <button
                key={pm.id}
                type="button"
                onClick={() => setPaymentMethod(pm.id)}
                className={`py-2 rounded-xl border font-bold transition text-center cursor-pointer ${
                  paymentMethod === pm.id
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {pm.label}
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800 rounded-2xl text-[11px] text-amber-900 dark:text-amber-200 space-y-1">
          <div className="flex items-center gap-1.5 font-bold">
            <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>سوودەکانی ئەندامێتی VIP مانگانە:</span>
          </div>
          <p className="text-amber-800 dark:text-amber-300 leading-relaxed">
            کڕیار لە ماوەی بەشداریکردنەکەدا هەر کاتێک بێت پارەی لێ وەرناگیرێت (0 IQD) و پێشینەی سەرەکی
            پێدەدرێت لە هۆڵەکاندا.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={handleConfirm}
            className="flex-1 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-amber-600/20 active:scale-95 text-xs cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>تەواوکردن و چالاککردنی ئەندامێتی ({formatIQD(currentPlan.price)})</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer"
          >
            داخستن
          </button>
        </div>
      </div>
    </div>
  );
};
