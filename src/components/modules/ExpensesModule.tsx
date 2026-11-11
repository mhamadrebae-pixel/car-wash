'use client';

import React, { useState, useMemo } from 'react';
import { Expense, AppSettings } from '@/types';
import { formatIQD, normalizeDigits } from '@/lib/storage';
import {
  DollarSign,
  Plus,
  Trash2,
  Calendar,
  Search,
  Filter,
  Building2,
  Zap,
  Droplets,
  Wrench,
  Package,
  Sparkles,
  Info,
  Edit3,
  TrendingDown,
  UserCheck,
  CheckCircle2,
  X,
} from 'lucide-react';

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
  const [showModal, setShowModal] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Expense['category']>('مەواد و شامپۆ');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [paidTo, setPaidTo] = useState('');

  // Month & Filter states
  const currentYearMonth = new Date().toISOString().slice(0, 7); // e.g. "2026-11"
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>(currentYearMonth);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Generate available list of unique months
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    set.add(currentYearMonth);
    expenses.forEach((e) => {
      if (e.date && e.date.length >= 7) {
        set.add(e.date.slice(0, 7));
      }
    });
    return Array.from(set).sort().reverse();
  }, [expenses, currentYearMonth]);

  const getKurdishMonthName = (yearMonth: string) => {
    const [year, month] = yearMonth.split('-');
    const monthNames: Record<string, string> = {
      '01': 'کانوونی دووەم (١)',
      '02': 'شوبات (٢)',
      '03': 'ئازار (٣)',
      '04': 'نیسان (٤)',
      '05': 'ئایار (٥)',
      '06': 'حوزەیران (٦)',
      '07': 'تەممووز (٧)',
      '08': 'ئاب (٨)',
      '09': 'ئەیلوول (٩)',
      '10': 'تشرینی یەکەم (١٠)',
      '11': 'تشرینی دووەم (١١)',
      '12': 'کانوونی یەکەم (١٢)',
    };
    return `${monthNames[month] || `مانگی ${month}`} ${year}`;
  };

  // Filtered expenses based on Month, Search & Category
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      // Month match
      const matchesMonth =
        selectedMonthFilter === 'all' ||
        (e.date && e.date.startsWith(selectedMonthFilter));

      // Category match
      const matchesCategory =
        filterCategory === 'all' || e.category === filterCategory;

      // Search match
      const searchLower = search.toLowerCase();
      const matchesSearch =
        !search ||
        e.title.toLowerCase().includes(searchLower) ||
        (e.notes && e.notes.toLowerCase().includes(searchLower)) ||
        (e.paidTo && e.paidTo.toLowerCase().includes(searchLower));

      return matchesMonth && matchesCategory && matchesSearch;
    });
  }, [expenses, selectedMonthFilter, filterCategory, search]);

  // Calculations for the selected view
  const viewExpenses = useMemo(() => {
    if (selectedMonthFilter === 'all') return expenses;
    return expenses.filter((e) => e.date && e.date.startsWith(selectedMonthFilter));
  }, [expenses, selectedMonthFilter]);

  const viewTotal = viewExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // Breakdown by key overheads in the selected period
  const rentTotal = viewExpenses
    .filter((e) => e.category === 'کرێی شوێن')
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const utilitiesTotal = viewExpenses
    .filter((e) => e.category === 'ئاو و کارەبا و مۆلیدە')
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const materialsTotal = viewExpenses
    .filter((e) => e.category === 'مەواد و شامپۆ')
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const othersTotal = viewExpenses
    .filter((e) => !['کرێی شوێن', 'ئاو و کارەبا و مۆلیدە', 'مەواد و شامپۆ'].includes(e.category))
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // Quick Preset Opener
  const openQuickPreset = (
    presetTitle: string,
    presetCategory: Expense['category'],
    presetAmount?: number,
    presetNotes?: string,
    presetPaidTo?: string
  ) => {
    setEditingExpenseId(null);
    setTitle(presetTitle);
    setCategory(presetCategory);
    setAmount(presetAmount ? String(presetAmount) : '');
    setExpenseDate(new Date().toISOString().split('T')[0]);
    setNotes(presetNotes || '');
    setPaidTo(presetPaidTo || '');
    setShowModal(true);
  };

  const handleEditClick = (exp: Expense) => {
    setEditingExpenseId(exp.id);
    setTitle(exp.title);
    setCategory(exp.category);
    setAmount(String(exp.amount));
    setExpenseDate(exp.date);
    setNotes(exp.notes || '');
    setPaidTo(exp.paidTo || '');
    setShowModal(true);
  };

  const handleSaveExpense = (e: React.FormEvent) => {
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

    if (editingExpenseId) {
      // Update existing
      const updated = expenses.map((exp) => {
        if (exp.id === editingExpenseId) {
          return {
            ...exp,
            title: cleanTitle,
            category,
            amount: parsedAmount,
            date: expenseDate || new Date().toISOString().split('T')[0],
            notes: notes.trim(),
            paidTo: paidTo.trim() || undefined,
          };
        }
        return exp;
      });
      onUpdateExpenses(updated);
      onNotify('خەرجییەکە بە سەرکەوتوویی دەستکاری کرا.');
    } else {
      // Add new
      const newExp: Expense = {
        id: `exp-${Date.now()}`,
        title: cleanTitle,
        category,
        amount: parsedAmount,
        date: expenseDate || new Date().toISOString().split('T')[0],
        notes: notes.trim(),
        paidTo: paidTo.trim() || undefined,
      };
      onUpdateExpenses([newExp, ...expenses]);
      onNotify('خەرجی نوێ بە سەرکەوتوویی تۆمارکرا.');
    }

    setShowModal(false);
    setEditingExpenseId(null);
    setTitle('');
    setAmount('');
    setNotes('');
    setPaidTo('');
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

  const getCategoryBadgeColor = (cat: Expense['category']) => {
    switch (cat) {
      case 'کرێی شوێن':
        return 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'ئاو و کارەبا و مۆلیدە':
        return 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'مەواد و شامپۆ':
        return 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'مووچەی کارمەندان':
        return 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'چاککردنەوە':
        return 'bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" dir="rtl">
      {/* ---------------- TOP HEADER ---------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-600 flex items-center justify-center text-white shadow-md shadow-rose-500/20 shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              خەرجییە مانگانە و فیعلییەکان (Monthly Expenses)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              تۆمارکردنی خەرجییە گۆڕاوەکانی هەموو مانگێک بەپێی بەکارهێنان (کرێ، کارەبا، مۆلیدە، ئاو، مەواد).
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setEditingExpenseId(null);
            setTitle('');
            setCategory('مەواد و شامپۆ');
            setAmount('');
            setNotes('');
            setPaidTo('');
            setExpenseDate(new Date().toISOString().split('T')[0]);
            setShowModal(true);
          }}
          className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md shadow-rose-500/20 transition hover:scale-[1.02] active:scale-[0.98] self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          تۆمارکردنی خەرجی نوێ
        </button>
      </div>

      {/* ---------------- INFORMATIONAL GUIDANCE BANNER ---------------- */}
      <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 border border-amber-200 dark:border-amber-900/60 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <strong className="font-extrabold text-amber-950 dark:text-amber-100 block mb-0.5">
              خەرجییەکان مانگ بە مانگ دەگۆڕێن و ئاڵوگۆڕ دەکەن!
            </strong>
            <span className="text-[11px] text-amber-800 dark:text-amber-300/90 leading-relaxed">
              لە واقیعدا تێچووی هیچ مانگێک وەک ئەوی تر نییە؛ مانگێک کارەبا زیاتر بەکاردێت، مانگێک ئاو کەمترە، یان کرێ بەرز دەبێتەوە. لێرە هەموو پسوڵە و پارەدانەکان لە کاتی خۆیدا تۆمار بکە. سیستەمەکە ڕاستەوخۆ لە بەشی «داشبۆرد و شیکاری» بەپێی مانگی خۆی قازانجی پوختەت بۆ لێکدەداتەوە.
            </span>
          </div>
        </div>
      </div>

      {/* ---------------- QUICK MONTHLY BILL TEMPLATES ---------------- */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            دوگمەی خێرای پسوڵە باوەکان (Quick Templates):
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">
            کلیک بکە بۆ پڕکردنەوەی ئۆتۆماتیکی پۆلێن و ناونیشان
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
          {/* 1. Monthly Rent */}
          <button
            type="button"
            onClick={() =>
              openQuickPreset(
                `کرێی شوێن (${getKurdishMonthName(currentYearMonth)})`,
                'کرێی شوێن',
                settings?.monthlyRent || 600000,
                'کرێی مانگانەی شوێنی غەسل، گەراج و شوشتنگەی فەرش (١,٠٧٠ م²)',
                'خاوەن موڵک'
              )
            }
            className="p-3 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-950/50 border border-amber-200 dark:border-amber-800/80 rounded-2xl flex flex-col items-center gap-1.5 transition text-center group cursor-pointer"
          >
            <Building2 className="w-5 h-5 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-slate-900 dark:text-white">کرێی مانگانە</span>
            <span className="text-[10px] font-mono font-medium text-amber-700 dark:text-amber-400">
              {formatIQD(settings?.monthlyRent || 600000)}
            </span>
          </button>

          {/* 2. National Electricity */}
          <button
            type="button"
            onClick={() =>
              openQuickPreset(
                `پسوڵەی کارەبای نیشتمانی (${getKurdishMonthName(currentYearMonth)})`,
                'ئاو و کارەبا و مۆلیدە',
                undefined,
                'پسوڵەی کارەبای دەوڵەت بۆ پەمپ و ئامێرەکان',
                'فەرمانگەی کارەبا'
              )
            }
            className="p-3 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30 dark:hover:bg-blue-950/50 border border-blue-200 dark:border-blue-800/80 rounded-2xl flex flex-col items-center gap-1.5 transition text-center group cursor-pointer"
          >
            <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-slate-900 dark:text-white">کارەبای نیشتمانی</span>
            <span className="text-[10px] text-blue-700 dark:text-blue-400">پسوڵەی مانگانە</span>
          </button>

          {/* 3. Generator */}
          <button
            type="button"
            onClick={() =>
              openQuickPreset(
                `پارەی مۆلیدەی ئەهلی (${getKurdishMonthName(currentYearMonth)})`,
                'ئاو و کارەبا و مۆلیدە',
                undefined,
                'پشکی ئەمپێری مۆلیدەی ئەهلی بۆ غەسل',
                'مۆلیدەی گەڕەک'
              )
            }
            className="p-3 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:hover:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/80 rounded-2xl flex flex-col items-center gap-1.5 transition text-center group cursor-pointer"
          >
            <Zap className="w-5 h-5 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-slate-900 dark:text-white">مۆلیدەی ئەهلی</span>
            <span className="text-[10px] text-indigo-700 dark:text-indigo-400">ئەمپێری مانگانە</span>
          </button>

          {/* 4. Water / Tanker */}
          <button
            type="button"
            onClick={() =>
              openQuickPreset(
                `پارەی ئاو و کڕینی تانکەر (${getKurdishMonthName(currentYearMonth)})`,
                'ئاو و کارەبا و مۆلیدە',
                undefined,
                'تێچووی کڕینی تانکەری ئاو یان پسوڵەی ئاو',
                'تانکەری ئاو'
              )
            }
            className="p-3 bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-950/30 dark:hover:bg-cyan-950/50 border border-cyan-200 dark:border-cyan-800/80 rounded-2xl flex flex-col items-center gap-1.5 transition text-center group cursor-pointer"
          >
            <Droplets className="w-5 h-5 text-cyan-600 dark:text-cyan-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-slate-900 dark:text-white">ئاو و تانکەر</span>
            <span className="text-[10px] text-cyan-700 dark:text-cyan-400">تێچووی ئاوی شۆردن</span>
          </button>

          {/* 5. Washing Supplies & Shampoo */}
          <button
            type="button"
            onClick={() =>
              openQuickPreset(
                'کڕینی مەواد و شامپۆی شۆردن',
                'مەواد و شامپۆ',
                undefined,
                'کڕینی کەف، واکس، بۆندارکەر، و مەوادی پاککەرەوە'
              )
            }
            className="p-3 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl flex flex-col items-center gap-1.5 transition text-center group cursor-pointer"
          >
            <Package className="w-5 h-5 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-slate-900 dark:text-white">مەواد و شامپۆ</span>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400">کڕینی پێداویستی</span>
          </button>

          {/* 6. Repairs & Maintenance */}
          <button
            type="button"
            onClick={() =>
              openQuickPreset(
                'چاککردنەوە و چاکسازی ئامێرەکان',
                'چاککردنەوە',
                undefined,
                'چاککردنەوەی پەمپ، سۆندە، یان کارەبایی'
              )
            }
            className="p-3 bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/30 dark:hover:bg-orange-950/50 border border-orange-200 dark:border-orange-800/80 rounded-2xl flex flex-col items-center gap-1.5 transition text-center group cursor-pointer"
          >
            <Wrench className="w-5 h-5 text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-slate-900 dark:text-white">چاککردنەوە و وەستا</span>
            <span className="text-[10px] text-orange-700 dark:text-orange-400">چاکسازی ئامێر</span>
          </button>
        </div>
      </div>

      {/* ---------------- MONTHLY SNAPSHOT METRICS CARDS ---------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Total for selected month */}
        <div className="col-span-2 sm:col-span-1 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 rounded-3xl p-4 shadow-xs">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold block">
            کۆی گشتی ({selectedMonthFilter === 'all' ? 'هەموو کاتەکان' : getKurdishMonthName(selectedMonthFilter)})
          </span>
          <span className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 font-mono tracking-tight block mt-1">
            {formatIQD(viewTotal)}
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-1 block">
            {viewExpenses.length} پسوڵەی خەرجی تۆمارکراو
          </span>
        </div>

        {/* Rent */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 shadow-xs">
          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold block flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5" />
            کرێی شوێن
          </span>
          <span className="text-lg font-black text-slate-900 dark:text-white font-mono block mt-1">
            {formatIQD(rentTotal)}
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-1 block">
            {rentTotal > 0 ? 'دراوە لەم مانگەدا' : 'هێشتا نەدراوە'}
          </span>
        </div>

        {/* Utilities */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 shadow-xs">
          <span className="text-[11px] text-blue-600 dark:text-blue-400 font-bold block flex items-center gap-1">
            <Zap className="w-3.5 h-3.5" />
            ئاو، کارەبا و مۆلیدە
          </span>
          <span className="text-lg font-black text-slate-900 dark:text-white font-mono block mt-1">
            {formatIQD(utilitiesTotal)}
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-1 block">
            بەپێی پێوانەی مانگانە
          </span>
        </div>

        {/* Materials */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 shadow-xs">
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold block flex items-center gap-1">
            <Package className="w-3.5 h-3.5" />
            مەواد و شامپۆ
          </span>
          <span className="text-lg font-black text-slate-900 dark:text-white font-mono block mt-1">
            {formatIQD(materialsTotal)}
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-1 block">
            پێداویستی بەکارهاتوو
          </span>
        </div>

        {/* Other / Repairs */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 shadow-xs">
          <span className="text-[11px] text-orange-600 dark:text-orange-400 font-bold block flex items-center gap-1">
            <Wrench className="w-3.5 h-3.5" />
            چاککردنەوە و تر
          </span>
          <span className="text-lg font-black text-slate-900 dark:text-white font-mono block mt-1">
            {formatIQD(othersTotal)}
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-1 block">
            تێچووی لەناکاو و وەستا
          </span>
        </div>
      </div>

      {/* ---------------- FILTER BAR: MONTH, CATEGORY & SEARCH ---------------- */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-3 sm:p-4 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Month Selector */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl px-3 py-2.5">
            <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <select
              value={selectedMonthFilter}
              onChange={(e) => setSelectedMonthFilter(e.target.value)}
              className="w-full bg-transparent text-slate-900 dark:text-white outline-none text-xs font-bold cursor-pointer [&>option]:bg-white [&>option]:dark:bg-slate-900 [&>option]:text-slate-900 [&>option]:dark:text-white"
            >
              <option value={currentYearMonth}>ئەم مانگە: {getKurdishMonthName(currentYearMonth)}</option>
              {availableMonths
                .filter((m) => m !== currentYearMonth)
                .map((m) => (
                  <option key={m} value={m}>
                    {getKurdishMonthName(m)}
                  </option>
                ))}
              <option value="all">هەموو مانگەکان (مێژووی تەواو)</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl px-3 py-2.5">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full bg-transparent text-slate-900 dark:text-white outline-none text-xs cursor-pointer font-bold [&>option]:bg-white [&>option]:dark:bg-slate-900 [&>option]:text-slate-900 [&>option]:dark:text-white"
            >
              <option value="all">هەموو پۆلێنەکان</option>
              <option value="کرێی شوێن">🏢 کرێی شوێن</option>
              <option value="ئاو و کارەبا و مۆلیدە">⚡ ئاو و کارەبا و مۆلیدە</option>
              <option value="مەواد و شامپۆ">🧴 مەواد و شامپۆ</option>
              <option value="مووچەی کارمەندان">👥 مووچەی کارمەندان</option>
              <option value="چاککردنەوە">🔧 چاککردنەوە و چاکسازی</option>
              <option value="خەرجی تر">📦 خەرجی تر</option>
            </select>
          </div>

          {/* Search Input */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl px-3 py-2.5">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="گەڕان بەدوای ناونیشان، تێبینی یان وەرگر..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none text-xs font-medium"
            />
          </div>
        </div>
      </div>

      {/* ---------------- EXPENSES TABLE ---------------- */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs sm:text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 text-xs font-bold">
              <tr>
                <th className="p-4">بەروار</th>
                <th className="p-4">ناونیشانی خەرجی</th>
                <th className="p-4">پۆلێن</th>
                <th className="p-4">بڕی پارە (IQD)</th>
                <th className="p-4">دراوە بە (وەرگر)</th>
                <th className="p-4">تێبینی</th>
                <th className="p-4 text-center">کردار</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                    هیچ خەرجییەک نەدۆزرایەوە بۆ ئەم مانگە یان بەم فلتەرە.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                    <td className="p-4 text-slate-500 dark:text-slate-400 font-mono">{exp.date}</td>
                    <td className="p-4 font-extrabold text-slate-900 dark:text-white">
                      {exp.title}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${getCategoryBadgeColor(exp.category)}`}>
                        {exp.category}
                      </span>
                    </td>
                    <td className="p-4 font-mono font-bold text-rose-600 dark:text-rose-400">
                      {formatIQD(exp.amount)}
                    </td>
                    <td className="p-4 text-xs text-slate-600 dark:text-slate-400 font-semibold">
                      {exp.paidTo || '-'}
                    </td>
                    <td className="p-4 text-xs text-slate-500 dark:text-slate-400 max-w-xs truncate">
                      {exp.notes || '-'}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleEditClick(exp)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition cursor-pointer"
                          title="دەستکاریکردن"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteExpense(exp.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition cursor-pointer"
                          title="سڕینەوە بە کۆدی بەڕێوەبەر"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ---------------- ADD / EDIT EXPENSE MODAL ---------------- */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-slate-900 dark:text-white animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-rose-600" />
                {editingExpenseId ? 'دەستکاریکردنی تۆماری خەرجی' : 'تۆمارکردنی خەرجی نوێ'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-700 dark:text-slate-300 block mb-1 font-bold">
                  ناونیشانی خەرجی:
                </label>
                <input
                  type="text"
                  required
                  placeholder="وەک: پسوڵەی کارەبای مانگی فڵان، کرێ، کڕینی تانکەر..."
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
                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-rose-500 font-bold [&>option]:bg-white [&>option]:dark:bg-slate-900 [&>option]:text-slate-900 [&>option]:dark:text-white"
                  >
                    <option value="کرێی شوێن">🏢 کرێی شوێن</option>
                    <option value="ئاو و کارەبا و مۆلیدە">⚡ ئاو و کارەبا و مۆلیدە</option>
                    <option value="مەواد و شامپۆ">🧴 مەواد و شامپۆ</option>
                    <option value="مووچەی کارمەندان">👥 مووچەی کارمەندان</option>
                    <option value="چاککردنەوە">🔧 چاککردنەوە</option>
                    <option value="خەرجی تر">📦 خەرجی تر</option>
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
                  placeholder="نموونە: 350000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono focus:outline-none focus:border-rose-500 text-sm font-bold"
                />
              </div>

              <div>
                <label className="text-slate-700 dark:text-slate-300 block mb-1 font-bold">
                  دراوە بە (وەرگری پارە - ئیختیاری):
                </label>
                <input
                  type="text"
                  placeholder="وەک: خاوەن موڵک، مۆلیدەی ئەهلی، فەرمانگەی کارەبا..."
                  value={paidTo}
                  onChange={(e) => setPaidTo(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-rose-500 font-medium"
                />
              </div>

              <div>
                <label className="text-slate-700 dark:text-slate-300 block mb-1 font-bold">تێبینی:</label>
                <input
                  type="text"
                  placeholder="وردەکاری زیاتر دەربارەی ئەم خەرجییە..."
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
                  {editingExpenseId ? 'نوێکردنەوەی خەرجی' : 'پاشەکەوتکردن'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
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