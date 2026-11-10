'use client';

import React, { useState } from 'react';
import { Vehicle, StaffMember, AppSettings, DailyZReport, PaymentMethod, Expense } from '@/types';
import { formatIQD, normalizeDigits, getSavedExpenses, isDateToday } from '@/lib/storage';
import { openWhatsAppChat } from '@/lib/whatsapp';
import {
  X,
  Printer,
  CheckCircle2,
  DollarSign,
  AlertTriangle,
  Users,
  Coins,
  Sparkles,
  Wallet,
  Receipt,
  FileSpreadsheet,
  MessageCircle,
  Send,
} from 'lucide-react';

interface ZReportModalProps {
  vehicles: Vehicle[];
  staff: StaffMember[];
  settings: AppSettings;
  expenses?: Expense[];
  onClose: () => void;
  onSaveReport: (report: DailyZReport) => void;
}

export const ZReportModal: React.FC<ZReportModalProps> = ({
  vehicles,
  staff,
  settings,
  expenses,
  onClose,
  onSaveReport,
}) => {
  const [actualCashInput, setActualCashInput] = useState('');
  const [notes, setNotes] = useState('');

  const todayISO = new Date().toISOString().split('T')[0];
  const nowFormatted = new Date().toLocaleDateString('ku', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // 1. Direct wash records from today
  const todayWashes = vehicles.flatMap((v) =>
    (v.washHistory || [])
      .filter((w) => isDateToday(w.date))
      .map((w) => ({ vehicle: v, wash: w }))
  );

  // 2. Recovered debts collected TODAY from previous dates (paidAt is today, wash date is in past)
  const todayRecoveredDebts = vehicles.flatMap((v) =>
    (v.washHistory || [])
      .filter(
        (w) =>
          isDateToday(w.paidAt) &&
          !isDateToday(w.date) &&
          w.paymentStatus === 'paid'
      )
      .map((w) => ({ vehicle: v, wash: w }))
  );

  const totalCars = todayWashes.length;

  // Direct cash from today's washes
  const directCashTotal = todayWashes
    .filter(
      (x) =>
        (x.wash.paymentMethod === 'cash' || !x.wash.paymentMethod) &&
        x.wash.paymentStatus !== 'unpaid' &&
        !x.wash.isFree
    )
    .reduce((sum, x) => sum + (Number(x.wash.price) || 0), 0);

  // Cash recovered from past debts today
  const recoveredDebtCash = todayRecoveredDebts
    .filter((x) => x.wash.paymentMethod === 'cash' || !x.wash.paymentMethod)
    .reduce((sum, x) => sum + (Number(x.wash.price) || 0), 0);

  // Electronic recovered from past debts today
  const recoveredDebtElectronic = todayRecoveredDebts
    .filter((x) => x.wash.paymentMethod === 'fastpay' || x.wash.paymentMethod === 'fib')
    .reduce((sum, x) => sum + (Number(x.wash.price) || 0), 0);

  const totalRecoveredDebt = recoveredDebtCash + recoveredDebtElectronic;

  // Total gross cash received into the drawer today
  const grossDrawerCash = directCashTotal + recoveredDebtCash;

  // Today's Petty Cash Withdrawn from Drawer
  const allExpenses = expenses || getSavedExpenses();
  const todayPettyCashExpenses = (allExpenses || []).filter(
    (e) => isDateToday(e.date) && e.isPettyCash
  );
  const pettyCashTotal = todayPettyCashExpenses.reduce(
    (sum, e) => sum + (Number(e.amount) || 0),
    0
  );
  const netExpectedCash = Math.max(0, grossDrawerCash - pettyCashTotal);

  const fastpayDirect = todayWashes
    .filter(
      (x) =>
        x.wash.paymentMethod === 'fastpay' &&
        x.wash.paymentStatus !== 'unpaid' &&
        !x.wash.isFree
    )
    .reduce((sum, x) => sum + (Number(x.wash.price) || 0), 0);

  const fibDirect = todayWashes
    .filter(
      (x) =>
        x.wash.paymentMethod === 'fib' &&
        x.wash.paymentStatus !== 'unpaid' &&
        !x.wash.isFree
    )
    .reduce((sum, x) => sum + (Number(x.wash.price) || 0), 0);

  const fastpayTotal = fastpayDirect + (todayRecoveredDebts.filter(x => x.wash.paymentMethod === 'fastpay').reduce((sum, x) => sum + (Number(x.wash.price) || 0), 0));
  const fibTotal = fibDirect + (todayRecoveredDebts.filter(x => x.wash.paymentMethod === 'fib').reduce((sum, x) => sum + (Number(x.wash.price) || 0), 0));

  // New unpaid debt incurred today
  const newDebtTotal = todayWashes
    .filter((x) => x.wash.paymentMethod === 'debt' || x.wash.paymentStatus === 'unpaid')
    .reduce((sum, x) => sum + (Number(x.wash.price) || 0), 0);

  const freeWashesCount = todayWashes.filter((x) => x.wash.isFree).length;
  const totalCollectedRevenue = grossDrawerCash + fastpayDirect + fibDirect;

  // Dynamic Staff Commissions based on each worker's individual commission settings
  const staffCommissions = staff.map((st) => {
    const workerWashes = todayWashes.filter(
      (x) => x.wash.staffId === st.id || x.wash.staffName === st.name
    );
    const count = workerWashes.length;
    let commission = 0;

    if (st.commissionType === 'percentage') {
      const pct = (st.commissionValue || 20) / 100;
      commission = workerWashes.reduce(
        (sum, x) => sum + Math.round((Number(x.wash.price) || 0) * pct),
        0
      );
    } else if (st.commissionType === 'none') {
      commission = 0;
    } else {
      // Default: fixed amount per wash (e.g. 2,000 IQD)
      const perWash = st.commissionValue !== undefined ? st.commissionValue : 2000;
      commission = count * perWash;
    }

    return {
      staff: st,
      count,
      commission,
    };
  });
  const totalWorkerCommissions = staffCommissions.reduce((sum, s) => sum + s.commission, 0);

  // Cash discrepancy (actual counted vs net expected cash)
  const countedCash = Number(normalizeDigits(actualCashInput)) || 0;
  const discrepancy = actualCashInput ? countedCash - netExpectedCash : 0;

  const handlePrintZReport = () => {
    window.print();
  };

  const handleSendOwnerBriefing = () => {
    const targetPhone = settings.ownerPhone || settings.carWashPhone;
    if (!targetPhone) {
      alert('ژمارەی مۆبایلی خاوەنکار لە ڕێکخستنەکان تۆمار نەکراوە!');
      return;
    }

    const message = `📊 *ڕاپۆرتی کورتەی داخستنی سندووق (Z-REPORT)*
🏛 *${settings.carWashName}*
🗓 بەروار و کات: ${nowFormatted}
👤 کارگێڕ / کاشێر: سەرپەرشتیار

🚗 کۆی سەیارەی ئەمڕۆ: *${totalCars} سەیارە*
🎁 شۆردنی دیاری (FREE): *${freeWashesCount} سەیارە*

💰 *شیکاری داهاتی وەرگیراو:*
• 💵 کاش (نەقد): *${formatIQD(grossDrawerCash)}*
• 📱 FastPay: *${formatIQD(fastpayTotal)}*
• 🏦 FIB: *${formatIQD(fibTotal)}*
${newDebtTotal > 0 ? `• ⚠️ قەرزی نوێی ئەمڕۆ: *${formatIQD(newDebtTotal)}*\n` : ''}💎 کۆی داهاتی کۆکراوە: *${formatIQD(totalCollectedRevenue)}*

💸 *کێشانەوە لە سندووق (Petty Cash):*
• کۆی پارەی کێشراوە: *-${formatIQD(pettyCashTotal)}*

💼 *دۆخی کۆتایی کاشی سندووق:*
• کاشی چاوەڕوانکراو لە دەست: *${formatIQD(netExpectedCash)}*
${actualCashInput ? `• کاشی ژمێردراوی فیعلی: *${formatIQD(countedCash)}*
• ${discrepancy === 0 ? '✅ دۆخی سندووق: ١٠٠٪ تەبا و بێ جیاوازییە (0 IQD)' : `⚠️ جیاوازی سندووق: ${discrepancy > 0 ? '+' : ''}${formatIQD(discrepancy)}`}` : ''}

پەیامی خۆکاری سیستەمی غەسل ✨`;

    openWhatsAppChat(targetPhone, message);
  };

  const handleSave = () => {
    const report: DailyZReport = {
      id: `z-${Date.now()}`,
      date: todayISO,
      closedAt: new Date().toISOString(),
      closedBy: 'کاشێر / کارگێڕ',
      totalCars,
      cashTotal: grossDrawerCash,
      fastpayTotal,
      fibTotal,
      debtTotal: newDebtTotal,
      recoveredDebtTotal: totalRecoveredDebt,
      newDebtTotal,
      freeWashesCount,
      totalRevenue: totalCollectedRevenue,
      workerCommissionsTotal: totalWorkerCommissions,
      pettyCashTotal,
      expectedCash: netExpectedCash,
      actualCashCounted: countedCash,
      discrepancy,
      notes,
    };
    onSaveReport(report);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl relative text-slate-900 dark:text-white my-auto">
        {/* Header (No print) */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 no-print">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center font-bold">
              <Receipt className="w-5 h-5 text-emerald-700 dark:text-emerald-300" />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900 dark:text-white">
                داخستنی سندووقی ئەمڕۆ (Z-Report)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                کورتەی داهات، شێوازی پارەدان، و پشکی وەستاکان
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

        {/* ---------------- PRINTABLE Z-REPORT (THERMAL 80mm) ---------------- */}
        <div
          id="printable-zreport"
          className="bg-white text-slate-900 p-5 rounded-2xl border-2 border-dashed border-slate-300 font-mono text-xs space-y-3 relative select-none"
          dir="rtl"
        >
          {/* Slip Header */}
          <div className="text-center space-y-1 border-b-2 border-dashed border-slate-300 pb-3">
            <h2 className="text-base font-black text-slate-950 font-sans tracking-tight">
              {settings.carWashName}
            </h2>
            <div className="text-[11px] font-bold text-slate-800 font-sans bg-slate-100 px-2 py-0.5 rounded inline-block">
              ڕاپۆرتی داخستنی ڕۆژانەی سندووق (Z-REPORT)
            </div>
            <p className="text-[10px] text-slate-500 font-mono">بەروار و کات: {nowFormatted}</p>
          </div>

          {/* Core Volume Metrics */}
          <div className="space-y-1.5 text-xs border-b-2 border-dashed border-slate-300 pb-3 font-sans">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">سەیارەی شۆردراو:</span>
              <span className="font-extrabold text-slate-900 font-mono text-sm">
                {totalCars} سەیارە
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">شۆردنی بەخۆڕایی (FREE 🎁):</span>
              <span className="font-bold text-emerald-700 font-mono">
                {freeWashesCount} سەیارە (0 IQD)
              </span>
            </div>
          </div>

          {/* Revenue Breakdown by Payment Method */}
          <div className="space-y-1.5 text-xs border-b-2 border-dashed border-slate-300 pb-3 font-sans">
            <div className="font-bold text-[11px] text-slate-900 pb-0.5">
              شیکاری وەرگرتنی پارە (Payment Breakdown):
            </div>
            <div className="flex justify-between items-center text-slate-700">
              <span>💵 کاشی شۆردنی ئەمڕۆ:</span>
              <span className="font-bold font-mono text-slate-900">{formatIQD(directCashTotal)}</span>
            </div>
            {recoveredDebtCash > 0 && (
              <div className="flex justify-between items-center text-emerald-800 bg-emerald-50 px-2 py-1 rounded-lg">
                <span>💰 قەرزی وەرگیراوەی کۆن (کاش):</span>
                <span className="font-bold font-mono text-emerald-900">+{formatIQD(recoveredDebtCash)}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-slate-900 font-bold bg-slate-50 px-2 py-1 rounded-lg">
              <span>کۆی گشتی کاشی هاتووە بۆ کشۆ:</span>
              <span className="font-mono text-emerald-950 font-black">{formatIQD(grossDrawerCash)}</span>
            </div>
            {pettyCashTotal > 0 && (
              <div className="p-2 bg-amber-50/70 rounded-xl border border-amber-200/60 my-1 space-y-1">
                <div className="flex justify-between items-center text-amber-900 font-bold">
                  <span>💸 کێشانەوەی سندووق (Petty Cash):</span>
                  <span className="font-mono text-rose-700 font-bold">-{formatIQD(pettyCashTotal)}</span>
                </div>
                {todayPettyCashExpenses.slice(0, 3).map((pe) => (
                  <div key={pe.id} className="flex justify-between text-[10px] text-amber-800/80 pr-2">
                    <span>• {pe.title}:</span>
                    <span className="font-mono">-{formatIQD(pe.amount)}</span>
                  </div>
                ))}
                {todayPettyCashExpenses.length > 3 && (
                  <p className="text-[9px] text-amber-700 font-bold pr-2">
                    + {todayPettyCashExpenses.length - 3} خەرجی تری کێشراوە لە سندووق
                  </p>
                )}
                <div className="flex justify-between items-center pt-1 border-t border-amber-200/60 text-[11px] font-black text-amber-950">
                  <span>کاشی چاوەڕوانکراوی سندووق (Net):</span>
                  <span className="font-mono text-emerald-800">{formatIQD(netExpectedCash)}</span>
                </div>
              </div>
            )}
            <div className="flex justify-between items-center text-slate-700">
              <span>📱 FastPay:</span>
              <span className="font-bold font-mono text-slate-900">{formatIQD(fastpayTotal)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-700">
              <span>🏦 FIB (بانکی):</span>
              <span className="font-bold font-mono text-slate-900">{formatIQD(fibTotal)}</span>
            </div>
            {newDebtTotal > 0 && (
              <div className="flex justify-between items-center text-rose-700">
                <span>⚠️ قەرزی نوێی ئەمڕۆ (ماوەتەوە):</span>
                <span className="font-bold font-mono">{formatIQD(newDebtTotal)}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-1.5 border-t border-slate-200 font-black text-slate-950 text-sm">
              <span>کۆی داهاتی وەرگیراو (کاش + ئەلیکترۆنی):</span>
              <span className="font-mono text-emerald-700">{formatIQD(totalCollectedRevenue)}</span>
            </div>
          </div>

          {/* Staff Commissions Summary */}
          {staffCommissions.some((s) => s.count > 0) && (
            <div className="space-y-1 text-xs border-b-2 border-dashed border-slate-300 pb-2.5 font-sans">
              <div className="font-bold text-[11px] text-slate-900">پشکی وەستاکان (Commissions):</div>
              {staffCommissions
                .filter((s) => s.count > 0)
                .map((s) => (
                  <div key={s.staff.id} className="flex justify-between text-[11px] text-slate-600">
                    <span>
                      {s.staff.name} ({s.count} سەیارە):
                    </span>
                    <span className="font-bold font-mono text-slate-900">
                      {formatIQD(s.commission)}
                    </span>
                  </div>
                ))}
              <div className="flex justify-between pt-1 border-t border-slate-100 font-bold text-slate-900 text-[11px]">
                <span>کۆی پاداشتی کرێکاران:</span>
                <span className="font-mono text-blue-700">{formatIQD(totalWorkerCommissions)}</span>
              </div>
            </div>
          )}

          {/* Physical Cash Reconciliation */}
          {actualCashInput && (
            <div className="space-y-1 text-xs font-sans bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-600">کاشی هاتووە بۆ کشۆ:</span>
                <span className="font-bold font-mono">{formatIQD(grossDrawerCash)}</span>
              </div>
              {pettyCashTotal > 0 && (
                <div className="flex justify-between text-rose-700">
                  <span>خەرجی سندووق (Petty Cash):</span>
                  <span className="font-bold font-mono">-{formatIQD(pettyCashTotal)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-slate-900 border-t border-slate-100 pt-1">
                <span>کاشی پێشبینیکراوی ماوە لە سندووق:</span>
                <span className="font-mono text-emerald-700">{formatIQD(netExpectedCash)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">کاشی ژمێردراوی دەستی:</span>
                <span className="font-bold font-mono">{formatIQD(countedCash)}</span>
              </div>
              <div
                className={`flex justify-between font-bold pt-1 border-t border-slate-200 ${
                  discrepancy === 0
                    ? 'text-emerald-700'
                    : discrepancy > 0
                    ? 'text-sky-700'
                    : 'text-rose-700'
                }`}
              >
                <span>جیاوازی سندووق:</span>
                <span className="font-mono">
                  {discrepancy === 0
                    ? '✓ تەواو ڕێکە (0)'
                    : `${discrepancy > 0 ? '+' : ''}${formatIQD(discrepancy)}`}
                </span>
              </div>
            </div>
          )}

          {/* Slip Footer */}
          <div className="text-center text-[10px] text-slate-400 font-sans pt-1">
            <p>واژووی کاشێر: ................................</p>
          </div>
        </div>

        {/* ---------------- INTERACTIVE CONTROLS (NO PRINT) ---------------- */}
        <div className="space-y-3 no-print pt-1">
          {/* Cash counting input */}
          <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              ژماردنی فیعلی پارەی سندووق (کاش لە دەست):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={actualCashInput}
                onChange={(e) => setActualCashInput(e.target.value)}
                placeholder={`بۆ نموونە: ${netExpectedCash.toLocaleString()}`}
                className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setActualCashInput(netExpectedCash.toString())}
                className="px-3 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer"
              >
                کاشی تەواو (Match)
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <button
              onClick={handlePrintZReport}
              className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
            >
              <Printer className="w-4 h-4 text-slate-300" />
              <span>پرینت (Thermal 80mm)</span>
            </button>

            <button
              onClick={handleSendOwnerBriefing}
              className="py-3 px-3.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-700/20 active:scale-95"
              title="ناردنی کورتەی دەستبەجێ بۆ مۆبایلی خاوەنکار"
            >
              <MessageCircle className="w-4 h-4" />
              <span>ناردن بۆ خاوەنکار (WhatsApp)</span>
            </button>

            <button
              onClick={handleSave}
              className="py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>داخستن</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};