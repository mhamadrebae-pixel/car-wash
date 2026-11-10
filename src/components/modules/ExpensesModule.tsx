'use client';

import React, { useState } from 'react';
import { Expense, AppSettings } from '@/types';
import { formatIQD, normalizeDigits } from '@/lib/storage';
import { DollarSign, Plus, Trash2, Calendar, Search, Filter } from 'lucide-react';

interface ExpensesModuleProps {
  expenses: Expense[];
  settings?: AppSettings;
  onUpdateExpenses: (expenses: Expense[]) => void;
  onNotify: (msg: string) => void;
}

export const ExpensesModule: React.FC<ExpensesModuleProps> = ({
  expenses,
  settings,
  onUpdateExpenses,
  onNotify,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Expense['category']>('مەواد و شامپۆ');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Search & Filter
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const filteredExpenses = expenses.filter((e) => {
    const matchesSearch =
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      (e.notes && e.notes.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = filterCategory === 'all' || e.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const filteredTotal = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    const parsedAmount = Number(normalizeDigits(amount)) || 0;

    if (!cleanTitle) {
      alert('تکایە ناونیشانی خەرجی بنووسە!');
      return;
    }

    if (parsedAmount <= 0) {
      alert('تکایە بڕی خەرجی بە دروستی بنووسە (دەبێت لە ٠ زیاتر بێت)!');
      return;
    }

    const newExp: Expense = {
      id: `exp-${Date.now()}`,
      title: cleanTitle,
      category,
      amount: parsedAmount,
      date: expenseDate || new Date().toISOString().split('T')[0],
      notes: notes.trim(),
    };

    const updated = [newExp, ...expenses];
    onUpdateExpenses(updated);
    setShowAddModal(false);
    onNotify('خەرجی نوێ بە سەرکەوتوویی تۆمارکرا.');

    setTitle('');
    setAmount('');
    setNotes('');
    setExpenseDate(new Date().toISOString().split('T')[0]);
  };

  const handleDeleteExpense = (id: string) => {
    const masterPin = settings?.adminPin || '9999';
    const enteredPin = prompt('⚠️ بۆ سڕینەوەی ئەم تۆماری خەرجییە، تکایە کۆدی نهێنی بەڕێوەبەر (Admin PIN) بنووسە:');
    if (enteredPin === null) return; // user cancelled

    if (normalizeDigits(enteredPin.trim()) !== normalizeDigits(masterPin.trim())) {
      alert('❌ کۆدی نهێنی بەڕێوەبەر هەڵەیە! سڕینەوەی خەرجییەکە ڕەتکرایەوە.');
      return;
    }

    if (confirm('دڵنیایت لە سڕینەوەی ئەم تۆماری خەرجییە؟ ئەم کردارە ناگەڕێتەوە.')) {
      const updated = expenses.filter((e) => e.id !== id);
      onUpdateExpenses(updated);
      onNotify('تۆماری خەرجی سڕایەوە.');
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-600 flex items-center justify-center text-white shadow-md shadow-rose-500/20 shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              خەرجییە بەردەوامەکان (کرێ، مەواد، کارەبا)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              تۆمارکردنی هەموو ئەو پارانەی مانگانە یان ڕۆژانە خەرج دەکرێن بۆ بەگەڕخستنی غەسلەکە.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md shadow-rose-500/20 transition hover:scale-[1.02] active:scale-[0.98] self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          تۆمارکردنی خەرجی نوێ
        </button>
      </div>

      {/* Metrics & Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-6 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 block font-bold">کۆی گشتی خەرجییەکان</span>
            <span className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono tracking-tight">{formatIQD(totalExpenses)}</span>
          </div>
          <div className="text-left text-xs text-slate-500 dark:text-slate-400 font-mono font-bold bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            {expenses.length} تۆمارکراو
          </div>
        </div>

        {/* Search Input */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 flex items-center gap-2 shadow-xs focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="گەڕان بەدوای ناونیشان یان تێبینی..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none text-xs font-medium"
          />
        </div>

        {/* Category Filter */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 flex items-center gap-2 shadow-xs focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full bg-transparent text-slate-900 dark:text-white outline-none text-xs cursor-pointer font-bold [&>option]:bg-white [&>option]:dark:bg-slate-900 [&>option]:text-slate-900 [&>option]:dark:text-white"
          >
            <option value="all">هەموو پۆلێنەکان</option>
            <option value="مەواد و شامپۆ">مەواد و شامپۆ</option>
            <option value="کرێی شوێن">کرێی شوێن</option>
            <option value="ئاو و کارەبا و مۆلیدە">ئاو و کارەبا و مۆلیدە</option>
            <option value="مووچەی کارمەندان">مووچەی کارمەندان</option>
            <option value="چاککردنەوە">چاککردنەوە</option>
            <option value="خەرجی تر">خەرجی تر</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs sm:text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 text-xs font-bold">
              <tr>
                <th className="p-4">بەروار</th>
                <th className="p-4">ناونیشانی خەرجی</th>
                <th className="p-4">پۆلێن</th>
                <th className="p-4">بڕی پارە (IQD)</th>
                <th className="p-4">تێبینی</th>
                <th className="p-4 text-center">کردار</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                    هیچ خەرجییەک نەدۆزرایەوە بەم فلتەرە.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                    <td className="p-4 text-slate-500 dark:text-slate-400 font-mono">{exp.date}</td>
                    <td className="p-4 font-extrabold text-slate-900 dark:text-white">{exp.title}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700">
                        {exp.category}
                      </span>
                    </td>
                    <td className="p-4 font-mono font-bold text-rose-600 dark:text-rose-400">{formatIQD(exp.amount)}</td>
                    <td className="p-4 text-xs text-slate-500 dark:text-slate-400">{exp.notes || '-'}</td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleDeleteExpense(exp.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition cursor-pointer"
                        title="سڕینەوە بە کۆدی بەڕێوەبەر"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-slate-900 dark:text-white">
            <h3 className="font-black text-lg text-slate-900 dark:text-white">تۆمارکردنی خەرجی نوێ</h3>

            <form onSubmit={handleAddExpense} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-700 dark:text-slate-300 block mb-1 font-bold">ناونیشانی خەرجی:</label>
                <input
                  type="text"
                  required
                  placeholder="وەک: کڕینی شامپۆ، کرێی مانگی فڵان..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-rose-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 dark:text-slate-300 block mb-1 font-bold">پۆلێن:</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-rose-500 font-medium [&>option]:bg-white [&>option]:dark:bg-slate-900 [&>option]:text-slate-900 [&>option]:dark:text-white"
                  >
                    <option value="مەواد و شامپۆ">مەواد و شامپۆ</option>
                    <option value="کرێی شوێن">کرێی شوێن</option>
                    <option value="ئاو و کارەبا و مۆلیدە">ئاو و کارەبا و مۆلیدە</option>
                    <option value="مووچەی کارمەندان">مووچەی کارمەندان</option>
                    <option value="چاککردنەوە">چاککردنەوە</option>
                    <option value="خەرجی تر">خەرجی تر</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 dark:text-slate-300 block mb-1 font-bold flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    بەرواری خەرجی:
                  </label>
                  <input
                    type="date"
                    required
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono focus:outline-none focus:border-rose-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 dark:text-slate-300 block mb-1 font-bold">بڕی پارە (IQD):</label>
                <input
                  type="number"
                  required
                  placeholder="نموونە: 250000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono focus:outline-none focus:border-rose-500 text-sm font-medium"
                />
              </div>

              <div>
                <label className="text-slate-700 dark:text-slate-300 block mb-1 font-bold">تێبینی:</label>
                <input
                  type="text"
                  placeholder="وردەکاری زیاتر..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-rose-500 font-medium"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-bold rounded-xl transition shadow-md shadow-rose-500/20 cursor-pointer"
                >
                  پاشەکەوتکردن
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition cursor-pointer"
                >
                  داخستن
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
