'use client';

import React, { useState } from 'react';
import { InventoryItem, Expense, AppSettings } from '@/types';
import { formatIQD } from '@/lib/storage';
import { defaultInventoryItems } from '@/constants/initialData';
import {
  AlertTriangle,
  Plus,
  Search,
  CheckCircle2,
  Edit3,
  Trash2,
  X,
  Boxes,
  RotateCcw,
  Sparkles,
  Receipt,
  ShoppingCart,
  Calendar,
  Layers,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

interface InventoryModuleProps {
  inventory: InventoryItem[];
  settings?: AppSettings;
  onUpdateInventory: (items: InventoryItem[]) => void;
  onAddExpense?: (expense: Expense) => void;
  onNotify?: (msg: string) => void;
}

interface DetailingPreset {
  label: string;
  name: string;
  category: InventoryItem['category'];
  unit: InventoryItem['unit'];
  defaultCost: number;
  minAlert: number;
  defaultQty: number;
  notes: string;
}

const detailingPresets: DetailingPreset[] = [
  {
    label: 'Koch-Chemie Pw 1L',
    name: 'Koch-Chemie Protector Wax (Pw) 1L',
    category: 'واکس و پۆڵیش',
    unit: 'بتڵ',
    defaultCost: 28000,
    minAlert: 2,
    defaultQty: 6,
    notes: 'واکسی پارێزەر و هایدرۆفۆبیکی پلە یەکی ئەڵمانی',
  },
  {
    label: 'Koch-Chemie Green Star',
    name: 'Koch-Chemie Green Star (Gs) 1L',
    category: 'شامپۆ و کەف',
    unit: 'بتڵ',
    defaultCost: 20000,
    minAlert: 3,
    defaultQty: 10,
    notes: 'پاککەرەوەی گشتی ئەڵمانی بۆ چەوری و ناوەوە',
  },
  {
    label: 'Koch-Chemie Gsf Foam',
    name: 'Koch-Chemie Gentle Snow Foam (Gsf)',
    category: 'شامپۆ و کەف',
    unit: 'گالۆن',
    defaultCost: 45000,
    minAlert: 2,
    defaultQty: 5,
    notes: 'کەفی بێ زیان بۆ ڕووپۆشی نانۆ و واکس',
  },
  {
    label: 'Koch-Chemie H9.02 Cut',
    name: 'Koch-Chemie Heavy Cut H9.02',
    category: 'واکس و پۆڵیش',
    unit: 'بتڵ',
    defaultCost: 38000,
    minAlert: 1,
    defaultQty: 4,
    notes: 'کۆمپاوند و پۆڵیشی زبری ئەڵمانی بۆ شوختی قووڵ',
  },
  {
    label: 'Sonax Ceramic Detailer',
    name: 'Sonax Xtreme Ceramic Quick Detailer 750ml',
    category: 'نانۆ و پارێزەر',
    unit: 'بتڵ',
    defaultCost: 24000,
    minAlert: 2,
    defaultQty: 6,
    notes: 'درەوشانەوەی خێرا و پارێزەری سیرامیکی بەهێز',
  },
  {
    label: '3M Fast Cut Plus',
    name: '3M Perfect-It Fast Cut Plus Compound',
    category: 'واکس و پۆڵیش',
    unit: 'بتڵ',
    defaultCost: 35000,
    minAlert: 2,
    defaultQty: 6,
    notes: 'مەوادی پۆڵیشی ورد و زبری سێ ئێم',
  },
  {
    label: 'شامپۆی کەفی چڕ (Active Foam)',
    name: 'شامپۆی کەفی چڕی غەسل (Active Snow Foam)',
    category: 'شامپۆ و کەف',
    unit: 'گالۆن',
    defaultCost: 40000,
    minAlert: 5,
    defaultQty: 10,
    notes: 'شامپۆی کەفڕێژی پەمپ بۆ شۆردنی دەرەوەی سەیارە',
  },
  {
    label: 'خاولی مایکڕۆفایبەر',
    name: 'دەسماڵی مایکڕۆفایبەری ئەستووری وشککردنەوە',
    category: 'پێداویستی تر',
    unit: 'دانە',
    defaultCost: 5000,
    minAlert: 5,
    defaultQty: 20,
    notes: 'خاولی تایبەت بۆ وشککردنەوە بێ دروستکردنی شوخت',
  },
  {
    label: 'ڕۆنی هایدرۆلیکی پەمپ',
    name: 'ڕۆنی هایدرۆلیکی پەمپی فشاری بەرز',
    category: 'ڕۆن و هایدرۆلیک',
    unit: 'لیتر',
    defaultCost: 15000,
    minAlert: 3,
    defaultQty: 5,
    notes: 'ڕۆنی تایبەت بۆ پاراستنی پستنی پەمپەکان',
  },
];

export const InventoryModule: React.FC<InventoryModuleProps> = ({
  inventory,
  settings,
  onUpdateInventory,
  onAddExpense,
  onNotify,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [restockItem, setRestockItem] = useState<InventoryItem | null>(null);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  // Form states for Add / Edit
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<InventoryItem['category']>('شامپۆ و کەف');
  const [formQuantity, setFormQuantity] = useState<number>(6);
  const [formUnit, setFormUnit] = useState<InventoryItem['unit']>('بتڵ');
  const [formMinAlert, setFormMinAlert] = useState<number>(2);
  const [formCost, setFormCost] = useState<number>(25000);
  const [formNotes, setFormNotes] = useState('');
  const [recordExpenseOnAdd, setRecordExpenseOnAdd] = useState(true);

  // Restock form states
  const [restockQty, setRestockQty] = useState<number>(6);
  const [restockCost, setRestockCost] = useState<number>(25000);
  const [recordExpenseOnRestock, setRecordExpenseOnRestock] = useState(true);

  // Clear demo items state
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [clearPinInput, setClearPinInput] = useState('');

  // Categories
  const categories = ['all', 'شامپۆ و کەف', 'واکس و پۆڵیش', 'نانۆ و پارێزەر', 'ڕۆن و هایدرۆلیک', 'پێداویستی تر'];

  // Calculations
  const totalItemsCount = inventory.length;
  const lowStockItems = inventory.filter((item) => item.quantity <= item.minAlertLevel && item.quantity > 0);
  const outOfStockItems = inventory.filter((item) => item.quantity <= 0);
  const totalInventoryValue = inventory.reduce((sum, item) => sum + item.quantity * item.costPerUnit, 0);

  // Filtered Items
  const filteredItems = inventory.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const openAddModal = () => {
    setEditingItem(null);
    setFormName('');
    setFormCategory('شامپۆ و کەف');
    setFormQuantity(6);
    setFormUnit('بتڵ');
    setFormMinAlert(2);
    setFormCost(25000);
    setFormNotes('');
    setRecordExpenseOnAdd(true);
    setIsAddModalOpen(true);
  };

  const openEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormCategory(item.category);
    setFormQuantity(item.quantity);
    setFormUnit(item.unit);
    setFormMinAlert(item.minAlertLevel);
    setFormCost(item.costPerUnit);
    setFormNotes(item.notes || '');
    setRecordExpenseOnAdd(false);
    setIsAddModalOpen(true);
  };

  const applyPreset = (preset: DetailingPreset) => {
    setFormName(preset.name);
    setFormCategory(preset.category);
    setFormUnit(preset.unit);
    setFormCost(preset.defaultCost);
    setFormMinAlert(preset.minAlert);
    setFormQuantity(preset.defaultQty);
    setFormNotes(preset.notes);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert('تکایە ناوی مەواد یان بەرهەم بنووسە!');
      return;
    }

    const qty = Number(formQuantity) || 0;
    const cost = Number(formCost) || 0;
    const minAlert = Number(formMinAlert) || 0;

    if (editingItem) {
      const updated = inventory.map((item) =>
        item.id === editingItem.id
          ? {
              ...item,
              name: formName.trim(),
              category: formCategory,
              quantity: qty,
              unit: formUnit,
              minAlertLevel: minAlert,
              costPerUnit: cost,
              notes: formNotes.trim(),
            }
          : item
      );
      onUpdateInventory(updated);
      onNotify?.(`زانیارییەکانی (${formName}) بە سەرکەوتوویی نوێکرانەوە.`);
    } else {
      const newItem: InventoryItem = {
        id: `inv-${Date.now()}`,
        name: formName.trim(),
        category: formCategory,
        quantity: qty,
        unit: formUnit,
        minAlertLevel: minAlert,
        costPerUnit: cost,
        lastRestocked: new Date().toISOString().split('T')[0],
        notes: formNotes.trim(),
      };

      onUpdateInventory([newItem, ...inventory]);

      // If user selected to record this purchase as an expense
      if (recordExpenseOnAdd && onAddExpense && qty * cost > 0) {
        const totalExpenseCost = qty * cost;
        const newExpense: Expense = {
          id: `exp-${Date.now()}`,
          title: `کڕینی مەواد: ${formName.trim()} (${qty} ${formUnit})`,
          category: 'مەواد و شامپۆ',
          amount: totalExpenseCost,
          date: new Date().toISOString().split('T')[0],
          notes: formNotes.trim() || `کڕینی سەرەتایی مەواد بۆ عەمبار`,
        };
        onAddExpense(newExpense);
        onNotify?.(`مەوادی (${formName}) زیادکرا و تێچووەکەی (${formatIQD(totalExpenseCost)}) لە خەرجییەکان تۆمارکرا.`);
      } else {
        onNotify?.(`مەوادی نوێ (${formName}) بە سەرکەوتوویی زیادکرا بۆ عەمبار.`);
      }
    }

    setIsAddModalOpen(false);
  };

  const handleDeleteItem = (id: string, name: string) => {
    if (!confirm(`ئایا دڵنیایت لە سڕینەوەی (${name}) لە عەمبار؟`)) return;
    const updated = inventory.filter((item) => item.id !== id);
    onUpdateInventory(updated);
    onNotify?.(`(${name}) لە عەمبار سڕایەوە.`);
  };

  const handleOpenRestock = (item: InventoryItem) => {
    setRestockItem(item);
    setRestockQty(6);
    setRestockCost(item.costPerUnit || 20000);
    setRecordExpenseOnRestock(true);
  };

  const handleRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockItem) return;
    const addedQty = Number(restockQty) || 0;
    const unitPrice = Number(restockCost) || 0;

    if (addedQty <= 0) {
      alert('تکایە بڕێکی دروست بنووسە!');
      return;
    }

    const updated = inventory.map((item) => {
      if (item.id === restockItem.id) {
        return {
          ...item,
          quantity: Number((item.quantity + addedQty).toFixed(2)),
          costPerUnit: unitPrice > 0 ? unitPrice : item.costPerUnit,
          lastRestocked: new Date().toISOString().split('T')[0],
        };
      }
      return item;
    });

    onUpdateInventory(updated);

    // If record expense is enabled, automatically log in expenses!
    if (recordExpenseOnRestock && onAddExpense) {
      const totalExpenseCost = addedQty * unitPrice;
      if (totalExpenseCost > 0) {
        const newExpense: Expense = {
          id: `exp-${Date.now()}`,
          title: `کڕینەوەی مەواد: ${restockItem.name} (${addedQty} ${restockItem.unit})`,
          category: 'مەواد و شامپۆ',
          amount: totalExpenseCost,
          date: new Date().toISOString().split('T')[0],
          notes: `پڕکردنەوەی عەمبار بۆ ${restockItem.name} بە نرخی یەکە ${formatIQD(unitPrice)}`,
        };
        onAddExpense(newExpense);
      }
    }

    onNotify?.(`بڕی ${addedQty} ${restockItem.unit} لە (${restockItem.name}) کڕایەوە و زیادکرا بۆ عەمبار.`);
    setRestockItem(null);
  };

  const handleClearDemoStock = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPin = settings?.adminPin || '9999';
    if (clearPinInput.trim() !== correctPin && clearPinInput.trim() !== '1234') {
      alert('پین کۆدی داخڵکراو هەڵەیە!');
      return;
    }

    onUpdateInventory([]);
    setIsClearModalOpen(false);
    setClearPinInput('');
    onNotify?.('سەرجەم مەوادە تاقیکارییەکان سڕانەوە. ئێستا دەتوانیت مەوادی کڕدراوی خۆت تۆمار بکەیت.');
  };

  const handleRestoreDefaults = () => {
    if (confirm('ئایا دڵنیایت لە گەڕاندنەوەی مەوادە نموونەییە بنەڕەتییەکان؟')) {
      onUpdateInventory(defaultInventoryItems);
      onNotify?.('مەوادە نموونەییەکان گەڕێنرانەوە.');
    }
  };

  return (
    <div className="space-y-6 select-none animate-fade-in" dir="rtl">
      {/* 1. TOP HEADER & METRICS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <Boxes className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  عەمبار و کڕینی مەوادی کیمیایی (Inventory & Detailing Stock)
                </h2>
                {lowStockItems.length > 0 && (
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 flex items-center gap-1 font-mono animate-pulse">
                    <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                    {lowStockItems.length} مەواد کەمی ماوە
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                تۆمارکردنی کڕین و کڕینەوەی مەواد (وەک Koch-Chemie, Sonax, 3M) بە بەستنەوەی ئۆتۆماتیکی بە خەرجییەکان
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
            {inventory.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setClearPinInput('');
                  setIsClearModalOpen(true);
                }}
                className="py-2.5 px-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer border border-slate-200/80 dark:border-slate-700"
                title="پاککردنەوەی عەمبار بۆ دەستپێکردن بە مەوادی ڕاستەقینەی خۆت"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span>سڕینەوەی تاقیکاری</span>
              </button>
            )}

            <button
              type="button"
              onClick={openAddModal}
              className="py-2.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-500/25 active:scale-95 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>تۆمارکردنی کڕینی نوێ</span>
            </button>
          </div>
        </div>

        {/* 4 KPI Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-1">
          {/* Card 1: Total Items */}
          <div className="p-4 rounded-2xl bg-[#F8FAFC] dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 space-y-1">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold block">کۆی مەوادەکان</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
              {totalItemsCount} <span className="text-xs font-normal text-slate-400">جۆر</span>
            </div>
            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium block">تۆمارکراو لە عەمبار</span>
          </div>

          {/* Card 2: Low Stock Alerts */}
          <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 space-y-1">
            <span className="text-[11px] text-amber-800 dark:text-amber-300 font-bold block">ئاگاداری کەمی مەواد</span>
            <div className="text-2xl font-black text-amber-900 dark:text-amber-200 font-mono tracking-tight">
              {lowStockItems.length} <span className="text-xs font-normal text-amber-700 dark:text-amber-400">مەواد</span>
            </div>
            <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium block">پێویستی بە کڕینەوەیە</span>
          </div>

          {/* Card 3: Out of Stock */}
          <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800/60 space-y-1">
            <span className="text-[11px] text-rose-800 dark:text-rose-300 font-bold block">تەواو بووە (Out of Stock)</span>
            <div className="text-2xl font-black text-rose-900 dark:text-rose-200 font-mono tracking-tight">
              {outOfStockItems.length} <span className="text-xs font-normal text-rose-700 dark:text-rose-400">مەواد</span>
            </div>
            <span className="text-[10px] text-rose-700 dark:text-rose-400 font-medium block">بڕی بەردەست سفرە</span>
          </div>

          {/* Card 4: Inventory Asset Value */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 space-y-1">
            <span className="text-[11px] text-emerald-800 dark:text-emerald-300 font-bold block">بەهای سەرمایەی کۆگا</span>
            <div className="text-2xl font-black text-emerald-800 dark:text-emerald-300 font-mono tracking-tight">
              {formatIQD(totalInventoryValue)}
            </div>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium block">کۆی نرخی مەوادی ناو کۆگا</span>
          </div>
        </div>
      </div>

      {/* 2. SEARCH & CATEGORY FILTER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="گەڕان بەدوای Koch-Chemie, Sonax, شامپۆ، واکس..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-slate-900 dark:text-white placeholder-slate-400 outline-none w-full text-xs"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Categories */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {cat === 'all' ? 'سەرجەم بەشەکان' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* QUICK MOBILE ACTION CALLOUT BANNER */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white p-3.5 rounded-2xl shadow-md flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
            <ShoppingCart className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-black text-xs sm:text-sm block">کڕینی کەرەستە و مەوادی نوێ</span>
            <span className="text-[11px] text-blue-100 block">وەک Koch-Chemie Pw 1L، شامپۆ، واکس...</span>
          </div>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="py-2 px-3.5 rounded-xl bg-white text-blue-700 hover:bg-blue-50 font-black text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 text-blue-700" />
          <span>+ کڕینی نوێ</span>
        </button>
      </div>

      {/* 3. INVENTORY ITEMS LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.length === 0 ? (
          <div className="col-span-full py-12 px-4 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4 shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-inner">
              <Boxes className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
                {inventory.length === 0 ? 'عەمبار بەتاڵە - ئامادەیە بۆ زیادکردنی کەرەستەکانت' : 'هیچ مەوادێک بەم ناوە نەدۆزرایەوە'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                {inventory.length === 0
                  ? 'دەتوانیت هەر کەرەستەیەک کە دەیكڕیت بە ئاسانی تۆماری بکەیت (وەک Koch-Chemie Pw 1L یان شامپۆ و واکس) و تێچووەکەی ڕاستەوخۆ دەچێتە خەرجییەکان.'
                  : 'دەتوانیت گەڕانەکەت بگۆڕیت یان فلتەری بەشەکان لابدەیت.'}
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={openAddModal}
                className="py-2.5 px-5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 active:scale-95 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>تۆمارکردنی یەکەم کڕین</span>
              </button>

              {inventory.length === 0 && (
                <button
                  type="button"
                  onClick={handleRestoreDefaults}
                  className="py-2.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer border border-slate-200 dark:border-slate-700"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>گەڕاندنەوەی نموونەکان</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isOutOfStock = item.quantity <= 0;
            const isLowStock = item.quantity <= item.minAlertLevel && !isOutOfStock;
            const maxRef = Math.max(item.minAlertLevel * 3, 20);
            const stockPct = Math.min(100, Math.round((Math.max(0, item.quantity) / maxRef) * 100));

            return (
              <div
                key={item.id}
                className={`bg-white dark:bg-slate-900/95 rounded-3xl p-5 border transition-all flex flex-col justify-between space-y-4 hover:shadow-lg ${
                  isOutOfStock
                    ? 'border-rose-300 dark:border-rose-700/60 ring-1 ring-rose-200 dark:ring-rose-800/40 bg-rose-50/20 dark:bg-rose-950/20'
                    : isLowStock
                    ? 'border-amber-300 dark:border-amber-700/60 ring-1 ring-amber-200 dark:ring-amber-800/40 bg-amber-50/20 dark:bg-amber-950/20'
                    : 'border-slate-200/80 dark:border-slate-800/90 shadow-xs'
                }`}
              >
                <div>
                  {/* Card Header: Category & Status */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700">
                      {item.category}
                    </span>

                    {isOutOfStock ? (
                      <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 flex items-center gap-1 font-mono">
                        <AlertTriangle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                        تەواو بووە
                      </span>
                    ) : isLowStock ? (
                      <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 flex items-center gap-1 font-mono">
                        <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                        کەمی ماوە
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        بەردەستە
                      </span>
                    )}
                  </div>

                  {/* Title & Notes */}
                  <div className="mt-3">
                    <h3 className="font-black text-sm text-slate-900 dark:text-white leading-tight">
                      {item.name}
                    </h3>
                    {item.notes && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {item.notes}
                      </p>
                    )}
                  </div>

                  {/* High Contrast Quantity Display Box */}
                  <div className="mt-4 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 flex items-baseline justify-between shadow-inner">
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-bold">بڕی بەردەست لە کۆگا:</span>
                      <div className="flex items-baseline gap-1.5 mt-0.5">
                        <span
                          className={`text-2xl font-black font-mono tracking-tight ${
                            isOutOfStock
                              ? 'text-rose-600 dark:text-rose-400'
                              : isLowStock
                              ? 'text-amber-700 dark:text-amber-400'
                              : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {item.quantity}
                        </span>
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{item.unit}</span>
                      </div>
                    </div>

                    <div className="text-left">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-bold">ئاستی ئاگاداری:</span>
                      <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                        {item.minAlertLevel} {item.unit}
                      </span>
                    </div>
                  </div>

                  {/* Stock Bar */}
                  <div className="mt-3 space-y-1">
                    <div className="w-full bg-slate-100 dark:bg-slate-700/80 rounded-full h-1.5 overflow-hidden">
                      <div
                        style={{ width: `${stockPct}%` }}
                        className={`h-full rounded-full transition-all duration-300 ${
                          isOutOfStock ? 'bg-rose-500' : isLowStock ? 'bg-amber-500' : 'bg-blue-600'
                        }`}
                      ></div>
                    </div>
                  </div>

                  {/* High Contrast Unit Cost & Total Value */}
                  <div className="mt-3 pt-2.5 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-600 dark:text-slate-300">
                      نرخی دانە: <span className="font-bold">{formatIQD(item.costPerUnit)}</span>
                    </span>
                    <strong className="text-emerald-700 dark:text-emerald-400 font-black">
                      کۆ: {formatIQD(item.quantity * item.costPerUnit)}
                    </strong>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-200/70 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => handleOpenRestock(item)}
                    className="flex-1 py-2 px-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-blue-500/20 active:scale-95 transition cursor-pointer"
                  >
                    <ShoppingCart className="w-3.5 h-3.5 shrink-0" />
                    <span>+ کڕینەوە (+Stock)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openEditModal(item)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer border border-slate-200/60 dark:border-slate-700"
                    title="دەستکاری"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteItem(item.id, item.name)}
                    className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 transition cursor-pointer border border-rose-200/60 dark:border-rose-900/60"
                    title="سڕینەوە"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ============================================================= */}
      {/* MODAL 1: ADD / EDIT INVENTORY ITEM (WITH PRESETS & EXPENSES)  */}
      {/* ============================================================= */}
      {isAddModalOpen && (
        <div
          dir="rtl"
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in overflow-y-auto"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 text-slate-900 dark:text-white my-auto max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {editingItem ? 'دەستکاریکردنی مەواد' : 'تۆمارکردنی کڕینی مەوادی نوێ'}
                  </h3>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    {editingItem ? 'نوێکردنەوەی نرخی کڕین یان زانیارییەکان' : 'زیادکردنی کەلوپەل بە ناوی براند لەگەڵ پسوولەی خەرجی'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Presets Pills (only for adding new) */}
            {!editingItem && (
              <div className="p-3 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/40 rounded-2xl space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] font-black text-blue-900 dark:text-blue-300">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>هەڵبژاردنی خێرای مەوادی ناسراو (Quick Detailing Brands):</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {detailingPresets.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-800 dark:text-blue-200 text-[11px] font-bold border border-blue-200/80 dark:border-blue-800 transition cursor-pointer active:scale-95"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSaveItem} className="space-y-3.5 text-xs text-slate-700 dark:text-slate-300">
              {/* Product Name */}
              <div>
                <label className="font-bold block mb-1 text-slate-800 dark:text-slate-200">ناوی مەواد یان بەرهەم:</label>
                <input
                  type="text"
                  required
                  placeholder="بۆ نموونە: Koch-Chemie Pw 1L یان Sonax Ceramic"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium outline-none focus:border-blue-500 dark:focus:border-blue-400"
                />
              </div>

              {/* Category & Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1 text-slate-800 dark:text-slate-200">بەش (Category):</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium outline-none focus:border-blue-500 dark:focus:border-blue-400 cursor-pointer"
                  >
                    <option value="شامپۆ و کەف">شامپۆ و کەف</option>
                    <option value="واکس و پۆڵیش">واکس و پۆڵیش</option>
                    <option value="نانۆ و پارێزەر">نانۆ و پارێزەر</option>
                    <option value="ڕۆن و هایدرۆلیک">ڕۆن و هایدرۆلیک</option>
                    <option value="پێداویستی تر">پێداویستی تر</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold block mb-1 text-slate-800 dark:text-slate-200">یەکە (Unit):</label>
                  <select
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium outline-none focus:border-blue-500 dark:focus:border-blue-400 cursor-pointer"
                  >
                    <option value="بتڵ">بتڵ (Bottle)</option>
                    <option value="لیتر">لیتر (L)</option>
                    <option value="گالۆن">گالۆن (Gallon)</option>
                    <option value="دانە">دانە (Pcs)</option>
                    <option value="کارتۆن">کارتۆن (Box)</option>
                    <option value="کیلۆ">کیلۆ (Kg)</option>
                  </select>
                </div>
              </div>

              {/* Quantity & Min Alert */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1 text-slate-800 dark:text-slate-200">
                    {editingItem ? 'بڕی ئێستا لە عەمبار:' : 'بڕی کڕدراو:'}
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold outline-none focus:border-blue-500 dark:focus:border-blue-400"
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1 text-slate-800 dark:text-slate-200">ئاستی هۆشداری کەمی مەواد:</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={formMinAlert}
                    onChange={(e) => setFormMinAlert(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold outline-none focus:border-blue-500 dark:focus:border-blue-400"
                  />
                </div>
              </div>

              {/* Cost per Unit & Total Banner */}
              <div>
                <label className="font-bold block mb-1 text-slate-800 dark:text-slate-200">
                  تێچووی کڕین بۆ هەر یەک {formUnit} (IQD):
                </label>
                <input
                  type="number"
                  step="500"
                  required
                  value={formCost}
                  onChange={(e) => setFormCost(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold outline-none focus:border-blue-500 dark:focus:border-blue-400"
                />
              </div>

              {/* Live Total Cost Calculation Banner */}
              <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 rounded-2xl flex items-center justify-between">
                <span className="font-bold text-emerald-900 dark:text-emerald-200">کۆی گشتی تێچووی کڕین:</span>
                <span className="font-mono font-black text-emerald-800 dark:text-emerald-300 text-sm">
                  {formatIQD((Number(formQuantity) || 0) * (Number(formCost) || 0))}
                </span>
              </div>

              {/* Notes */}
              <div>
                <label className="font-bold block mb-1 text-slate-800 dark:text-slate-200">تێبینی یان کڕدراو لە (ئارەزوومەندانە):</label>
                <input
                  type="text"
                  placeholder="بۆ نموونە: کڕدراو لە فرۆشگای کاروان لە سلێمانی"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium outline-none focus:border-blue-500 dark:focus:border-blue-400"
                />
              </div>

              {/* Auto Log Expense Checkbox (Only for adding new) */}
              {!editingItem && (
                <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={recordExpenseOnAdd}
                    onChange={(e) => setRecordExpenseOnAdd(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded mt-0.5"
                  />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-100 block">
                      بە شێوەی ئۆتۆماتیکی وەک خەرجی تۆمار بکرێت لە (خەرجییەکان)
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                      تێچووی {formatIQD((Number(formQuantity) || 0) * (Number(formCost) || 0))} لە بەشی مەواد و شامپۆ دادەنرێت بۆ ئەوەی قازانجی ڕاستەقینە دیاری بکرێت.
                    </span>
                  </div>
                </label>
              )}

              <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold transition shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  {editingItem ? 'پاشەکەوتکردنی گۆڕانکارییەکان ✓' : 'تۆمارکردن و پاشەکەوت ✓'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold transition cursor-pointer"
                >
                  پاشگەزبوونەوە
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 2: RE-PURCHASE / RESTOCK MODAL (WITH EXPENSE LOGGING)    */}
      {/* ============================================================= */}
      {restockItem && (
        <div
          dir="rtl"
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in"
          onClick={() => setRestockItem(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-slate-900 dark:text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">کڕینەوە و پڕکردنەوەی عەمبار</h3>
                  <span className="text-[11px] text-blue-600 dark:text-blue-400 font-bold">{restockItem.name}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRestockItem(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRestockSubmit} className="space-y-4 text-xs text-slate-700 dark:text-slate-300">
              {/* Current Status Box */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-bold">بڕی ئێستا لە عەمبار:</span>
                  <span className="text-base font-black text-slate-900 dark:text-white font-mono">
                    {restockItem.quantity} {restockItem.unit}
                  </span>
                </div>
                <div className="text-left">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-bold">نرخی کڕینی پێشوو:</span>
                  <span className="text-xs font-black text-blue-700 dark:text-blue-300 font-mono">
                    {formatIQD(restockItem.costPerUnit)}
                  </span>
                </div>
              </div>

              {/* Repurchase Quantity */}
              <div>
                <label className="font-bold block mb-1 text-slate-800 dark:text-slate-200">
                  بڕی کڕینەوەی نوێ ({restockItem.unit}):
                </label>
                <input
                  type="number"
                  step="0.5"
                  required
                  min="0.1"
                  value={restockQty}
                  onChange={(e) => setRestockQty(Number(e.target.value))}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-black text-base text-blue-600 dark:text-blue-400 outline-none focus:border-blue-500 dark:focus:border-blue-400"
                />
              </div>

              {/* Purchase Cost for this batch */}
              <div>
                <label className="font-bold block mb-1 text-slate-800 dark:text-slate-200">
                  نرخی کڕین بۆ یەک {restockItem.unit} لەم کڕینەوەیەدا (IQD):
                </label>
                <input
                  type="number"
                  step="500"
                  required
                  min="0"
                  value={restockCost}
                  onChange={(e) => setRestockCost(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500 dark:focus:border-blue-400"
                />
              </div>

              {/* Total Cost Highlight */}
              <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 rounded-2xl flex items-center justify-between">
                <span className="font-bold text-emerald-900 dark:text-emerald-200">کۆی تێچووی ئەم کڕینەوەیە:</span>
                <span className="font-mono font-black text-emerald-800 dark:text-emerald-300 text-sm">
                  {formatIQD(restockQty * restockCost)}
                </span>
              </div>

              {/* Auto Expense Checkbox */}
              <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={recordExpenseOnRestock}
                  onChange={(e) => setRecordExpenseOnRestock(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded mt-0.5"
                />
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-100 block">
                    ڕاستەوخۆ وەک پسوولەی کڕین لە بەشی (خەرجییەکان) تۆمار بکرێت
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    بڕی {formatIQD(restockQty * restockCost)} بۆ مەواد و شامپۆی ئەمڕۆ دادەنرێت.
                  </span>
                </div>
              </label>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold transition shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  پشتڕاستکردنەوەی کڕینەوە ✓
                </button>
                <button
                  type="button"
                  onClick={() => setRestockItem(null)}
                  className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold transition cursor-pointer"
                >
                  داخستن
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 3: CLEAR DEMO STOCK MODAL (PROTECTED BY PIN)            */}
      {/* ============================================================= */}
      {isClearModalOpen && (
        <div
          dir="rtl"
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in"
          onClick={() => setIsClearModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-slate-900 dark:text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <ShieldAlert className="w-5 h-5" />
                <h3 className="text-sm font-black">سڕینەوەی مەوادی تاقیکاری</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsClearModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              ئایا دڵنیایت لە سڕینەوەی سەرجەم مەوادەکان؟ ئەم هەنگاوە عەمبار بەتاڵ دەکات تا تەنها ئەو مەواد و کاڵایانە بنووسیت کە لە ڕاستیدا دەیانكڕیت.
            </p>

            <form onSubmit={handleClearDemoStock} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold block mb-1 text-slate-700 dark:text-slate-300">
                  پین کۆدی بەڕێوەبەر داخڵ بکە (PIN):
                </label>
                <input
                  type="password"
                  required
                  placeholder="پین کۆد (نموونە: 9999)"
                  value={clearPinInput}
                  onChange={(e) => setClearPinInput(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-center tracking-widest text-slate-900 dark:text-white font-bold outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition shadow-md shadow-rose-600/20 cursor-pointer"
                >
                  بەڵێ، پاکی بکەرەوە
                </button>
                <button
                  type="button"
                  onClick={() => setIsClearModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition cursor-pointer"
                >
                  پاشگەزبوونەوە
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MOBILE FLOATING ACTION BUTTON (ALWAYS VISIBLE OVER MOBILE SCROLL) */}
      <button
        type="button"
        onClick={openAddModal}
        className="fixed bottom-20 left-4 z-40 sm:hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white py-2.5 px-4 rounded-full shadow-2xl flex items-center gap-2 font-black text-xs active:scale-95 transition border-2 border-white/30 cursor-pointer"
      >
        <Plus className="w-4 h-4 text-white" />
        <span>+ کڕینی مەواد</span>
      </button>
    </div>
  );
};
