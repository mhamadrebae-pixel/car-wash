'use client';

import React, { useState } from 'react';
import { Expense } from '@/types';
import { formatIQD, normalizeDigits, playPosSound } from '@/lib/storage';
import {
  X,
  DollarSign,
  AlertCircle,
  Receipt,
  User,
  Tag,
  CheckCircle2,
  Wallet,
  Sparkles,
} from 'lucide-react';

interface PettyCashModalProps {
  onSave: (expense: Expense) => void;
  onClose: () => void;
}

const QUICK_REASONS = [
  { title: 'خواردن و چای بۆ کارمەندان', category: 'خەرجی تر' as const },
  { title: 'سەفەری ئاوی تەنکەر', category: 'ئاو و کارەبا و مۆلیدە' as const },
  { title: 'شامپۆ یان کەفی بەپەلە', category: 'مەواد و شامپۆ' as const },
  { title: 'چاککردنەوەی جۆگە یان پەمپ', category: 'چاککردنەوە' as const },
  { title: 'کڕینی خاولی و دەستەسڕ', category: 'مەواد و شامپۆ' as const },
  { title: 'بەنزین یان گازی مۆلیدە', category: 'ئاو و کارەبا و مۆلیدە' as const },
];

export const PettyCashModal: React.FC<PettyCashModalProps> = ({ onSave, onClose }) => {
  const [amountInput, setAmountInput] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Expense['category']>('خەرجی تر');
  const [paidTo, setPaidTo] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const numericAmount = Number(normalizeDigits(amountInput.replace(/,/g, ''))) || 0;

  const handleSelectQuickReason = (item: (typeof QUICK_REASONS)[0]) => {
    setTitle(item.title);
    setCategory(item.category);
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numericAmount <= 0) {
      setError('تکایە بڕی پارەی کێشراوە بنووسە!');
      return;
    }
    if (!title.trim()) {
      setError('تکایە هۆکاری کێشانەوەی پارە دیاری بکە!');
      return;
    }

    const newExpense: Expense = {
      id: `petty-${Date.now()}`,
      title: title.trim(),
      category,
      amount: numericAmount,
      date: new Date().toISOString(),
      isPettyCash: true,
      paidTo: paidTo.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    onSave(newExpense);
    try {
      playPosSound('cash');
    } catch {}
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl relative text-slate-900 dark:text-white my-auto animate-in fade-in zoom-in-95 duration-150"
        dir="rtl"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center justify-center font-bold">
              <Wallet className="w-5 h-5 text-amber-700 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900 dark:text-white">
                کێشانەوەی پارە لە سندووق (Petty Cash)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                تۆمارکردنی خەرجی بەپەلەی ڕۆژانە ڕاستەوخۆ لە کاشی سندووق
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-xl transition cursor-pointer"
            title="داخستن (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-200 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Quick Reasons Chips */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1.5 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              هۆکارە باوەکان (هەڵبژاردنی خێرا):
            </label>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_REASONS.map((qr, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectQuickReason(qr)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                    title === qr.title
                      ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700 shadow-2xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {qr.title}
                </button>
              ))}
            </div>
          </div>

          {/* Amount Input */}
          <div className="bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 rounded-2xl p-3 space-y-1.5">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
              بڕی پارەی کێشراوە لە سندووق (دینار IQD):
            </label>
            <div className="relative">
              <input
                type="text"
                autoFocus
                value={amountInput}
                onChange={(e) => {
                  setAmountInput(e.target.value);
                  setError('');
                }}
                placeholder="بۆ نموونە: 10,000"
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-base font-black text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 font-mono"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">
                IQD
              </span>
            </div>
            {numericAmount > 0 && (
              <p className="text-[11px] font-mono font-bold text-amber-800 dark:text-amber-300">
                بڕ: {formatIQD(numericAmount)}
              </p>
            )}
          </div>

          {/* Title & Reason */}
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1">
              هۆکار / کڕینی چی بوو:
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setError('');
              }}
              placeholder="بۆ نموونە: کڕینی پێداویستی بەپەلە، خواردنی نیوەڕۆ..."
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Category & Paid To */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1">پۆلێنی خەرجی:</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Expense['category'])}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
              >
                <option value="خەرجی تر">خەرجی تر</option>
                <option value="مەواد و شامپۆ">مەواد و شامپۆ</option>
                <option value="ئاو و کارەبا و مۆلیدە">ئاو و کارەبا و مۆلیدە</option>
                <option value="مووچەی کارمەندان">مووچەی کارمەندان (پێشەکی)</option>
                <option value="چاککردنەوە">چاککردنەوە و ئامێر</option>
                <option value="کرێی شوێن">کرێی شوێن</option>
              </select>
            </div>

            <div>
              <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1">پارەکە درا بە کێ:</label>
              <input
                type="text"
                value={paidTo}
                onChange={(e) => setPaidTo(e.target.value)}
                placeholder="ناوی کەس / وەستا (ئارەزوومەندانە)"
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1">تێبینی زیاتر (ئارەزوومەندانە):</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ژمارەی پسوولەی کڕین، شوێنی کڕین..."
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Info Badge */}
          <div className="p-2.5 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800 rounded-xl text-[11px] text-blue-900 dark:text-blue-200 space-y-0.5">
            <p className="font-bold">💡 تێبینی کارگێڕی سندووق:</p>
            <p className="text-blue-700 dark:text-blue-300">
              ئەم بڕە پارەیە ڕاستەوخۆ لە کاشی چاوەڕوانکراوی ئەمڕۆ لە ڕاپۆرتی Z-Report کەمدەکرێتەوە
              تا سندووقی کاشێر ١٠٠٪ تەبا و بێ هەڵە بێت.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              className="flex-1 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-amber-600/20 active:scale-95 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>پاشەکەوت و کێشانەوە لە سندووق</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition cursor-pointer"
            >
              داخستن
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
