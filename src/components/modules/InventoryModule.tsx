'use client';

import React, { useState } from 'react';
import { InventoryItem, Expense } from '@/types';
import { formatIQD } from '@/lib/storage';
import {
  Package,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  TrendingDown,
  RefreshCw,
  Edit3,
  Trash2,
  Droplets,
  DollarSign,
  Layers,
  Sparkles,
  ArrowUpRight,
  X,
  Boxes,
} from 'lucide-react';

interface InventoryModuleProps {
  inventory: InventoryItem[];
  onUpdateInventory: (items: InventoryItem[]) => void;
  onAddExpense?: (expense: Expense) => void;
  onNotify?: (msg: string) => void;
}

export const InventoryModule: React.FC<InventoryModuleProps> = ({
  inventory,
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
  const [formQuantity, setFormQuantity] = useState<number>(10);
  const [formUnit, setFormUnit] = useState<InventoryItem['unit']>('لیتر');
  const [formMinAlert, setFormMinAlert] = useState<number>(5);
  const [formCost, setFormCost] = useState<number>(5000);
  const [formNotes, setFormNotes] = useState('');

  // Restock form states
  const [restockQty, setRestockQty] = useState<number>(10);
  const [recordExpenseOnRestock, setRecordExpenseOnRestock] = useState(true);

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
    setFormQuantity(10);
    setFormUnit('لیتر');
    setFormMinAlert(5);
    setFormCost(5000);
    setFormNotes('');
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
    setIsAddModalOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert('تکایە ناوی مەواد بنووسە!');
      return;
    }

    if (editingItem) {
      const updated = inventory.map((item) =>
        item.id === editingItem.id
          ? {
              ...item,
              name: formName.trim(),
              category: formCategory,
              quantity: Number(formQuantity) || 0,
              unit: formUnit,
              minAlertLevel: Number(formMinAlert) || 0,
              costPerUnit: Number(formCost) || 0,
              notes: formNotes.trim(),
            }
          : item
      );
      onUpdateInventory(updated);
      onNotify?.(`زانیارییەکانی ${formName} بە سەرکەوتوویی نوێکرانەوە.`);
    } else {
      const newItem: InventoryItem = {
        id: `inv-${Date.now()}`,
        name: formName.trim(),
        category: formCategory,
        quantity: Number(formQuantity) || 0,
        unit: formUnit,
        minAlertLevel: Number(formMinAlert) || 0,
        costPerUnit: Number(formCost) || 0,
        lastRestocked: new Date().toISOString().split('T')[0],
        notes: formNotes.trim(),
      };
      onUpdateInventory([newItem, ...inventory]);
      onNotify?.(`مەوادی نوێ (${formName}) زیادکرا بۆ عەمبار.`);
    }

    setIsAddModalOpen(false);
  };

  const handleDeleteItem = (id: string, name: string) => {
    if (!confirm(`ئایا دڵنیایت لە سڕینەوەی (${name}) لە عەمبار؟`)) return;
    const updated = inventory.filter((item) => item.id !== id);
    onUpdateInventory(updated);
    onNotify?.(`(${name}) لە عەمبار سڕایەوە.`);
  };

  const handleRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockItem) return;
    const addedQty = Number(restockQty) || 0;
    if (addedQty <= 0) {
      alert('تکایە بڕێکی دروست بنووسە!');
      return;
    }

    const updated = inventory.map((item) => {
      if (item.id === restockItem.id) {
        return {
          ...item,
          quantity: Number((item.quantity + addedQty).toFixed(2)),
          lastRestocked: new Date().toISOString().split('T')[0],
        };
      }
      return item;
    });

    onUpdateInventory(updated);

    // If record expense is enabled, automatically log in expenses!
    if (recordExpenseOnRestock && onAddExpense) {
      const totalExpenseCost = addedQty * restockItem.costPerUnit;
      if (totalExpenseCost > 0) {
        const newExpense: Expense = {
          id: `exp-${Date.now()}`,
          title: `کڕینی مەوادی عەمبار (${addedQty} ${restockItem.unit} ${restockItem.name})`,
          category: 'مەواد و شامپۆ',
          amount: totalExpenseCost,
          date: new Date().toISOString().split('T')[0],
          notes: `پڕکردنەوەی عەمبار بۆ ${restockItem.name}`,
        };
        onAddExpense(newExpense);
      }
    }

    onNotify?.(`بڕی ${addedQty} ${restockItem.unit} لە (${restockItem.name}) زیادکرا بۆ عەمبار.`);
    setRestockItem(null);
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
                  عەمبار و کۆنتڕۆڵی مەوادی کیمیایی (Chemicals & Stock)
                </h2>
                {lowStockItems.length > 0 && (
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 flex items-center gap-1 font-mono animate-pulse">
                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                    {lowStockItems.length} مەواد کەمی ماوە
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                چاودێری بڕی شامپۆ، فۆم، واکس، و نانۆ لەگەڵ کەمکردنەوەی ئۆتۆماتیکی لە کاتی هەر شۆردنێکدا
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="py-2.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 active:scale-95 transition cursor-pointer self-start sm:self-auto shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>زیادکردنی مەوادی نوێ</span>
          </button>
        </div>

        {/* 4 KPI Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-1">
          {/* Card 1: Total Items */}
          <div className="p-4 rounded-2xl bg-[#F8FAFC] dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 space-y-1">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold block">کۆی مەوادەکان</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
              {totalItemsCount} <span className="text-xs font-normal text-slate-400">جۆر</span>
            </div>
            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium block">تۆمارکراو لە سیستەم</span>
          </div>

          {/* Card 2: Low Stock Alerts */}
          <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 space-y-1">
            <span className="text-[11px] text-amber-800 dark:text-amber-300 font-bold block">ئاگاداری کەمی مەواد</span>
            <div className="text-2xl font-black text-amber-900 dark:text-amber-200 font-mono tracking-tight">
              {lowStockItems.length} <span className="text-xs font-normal text-amber-700 dark:text-amber-400">مەواد</span>
            </div>
            <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium block">پێویستی بە پڕکردنەوەیە</span>
          </div>

          {/* Card 3: Out of Stock */}
          <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-800/60 space-y-1">
            <span className="text-[11px] text-rose-800 dark:text-rose-300 font-bold block">تەواو بووە (Out of Stock)</span>
            <div className="text-2xl font-black text-rose-900 dark:text-rose-200 font-mono tracking-tight">
              {outOfStockItems.length} <span className="text-xs font-normal text-rose-700 dark:text-rose-400">مەواد</span>
            </div>
            <span className="text-[10px] text-rose-700 dark:text-rose-400 font-medium block">بڕی بەردەست سفرە</span>
          </div>

          {/* Card 4: Inventory Asset Value */}
          <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 space-y-1">
            <span className="text-[11px] text-emerald-800 dark:text-emerald-300 font-bold block">بەهای سەرمایەی کۆگا</span>
            <div className="text-2xl font-black text-emerald-900 dark:text-emerald-200 font-mono tracking-tight">
              {formatIQD(totalInventoryValue)}
            </div>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium block">نرخی مەوادی ناو عەمبار</span>
          </div>
        </div>
      </div>

      {/* 2. SEARCH & CATEGORY FILTER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="گەڕان بەدوای شامپۆ، واکس، نانۆ..."
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

      {/* 3. INVENTORY ITEMS LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <Boxes className="w-8 h-8" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">هیچ مەوادێک نەدۆزرایەوە</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mx-auto">
              دەتوانیت گەڕانەکەت بگۆڕیت یان مەوادی نوێ زیاد بکەیت بۆ بەڕێوەبردنی عەمباری غەسل.
            </p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isOutOfStock = item.quantity <= 0;
            const isLowStock = item.quantity <= item.minAlertLevel && !isOutOfStock;
            const maxRef = Math.max(item.minAlertLevel * 3, 50);
            const stockPct = Math.min(100, Math.round((Math.max(0, item.quantity) / maxRef) * 100));

            return (
              <div
                key={item.id}
                className={`bg-white dark:bg-slate-900 rounded-3xl p-5 border transition-all flex flex-col justify-between space-y-4 hover:shadow-md ${
                  isOutOfStock
                    ? 'border-rose-300 dark:border-rose-700/60 ring-1 ring-rose-200 dark:ring-rose-800/40 bg-rose-50/20 dark:bg-rose-950/20'
                    : isLowStock
                    ? 'border-amber-300 dark:border-amber-700/60 ring-1 ring-amber-200 dark:ring-amber-800/40 bg-amber-50/20 dark:bg-amber-950/20'
                    : 'border-slate-200/80 dark:border-slate-800'
                }`}
              >
                <div>
                  {/* Card Header: Category & Status */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
                      {item.category}
                    </span>

                    {isOutOfStock ? (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1 font-mono">
                        <AlertTriangle className="w-3 h-3" />
                        تەواو بووە
                      </span>
                    ) : isLowStock ? (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1 font-mono">
                        <AlertTriangle className="w-3 h-3" />
                        کەمی ماوە
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        بەردەستە
                      </span>
                    )}
                  </div>

                  {/* Title & Quantity */}
                  <div className="mt-3">
                    <h3 className="font-black text-sm text-slate-900 leading-tight">{item.name}</h3>
                    {item.notes && <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{item.notes}</p>}
                  </div>

                  {/* Big Quantity Display */}
                  <div className="mt-4 p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-baseline justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">بڕی بەردەست:</span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span
                          className={`text-2xl font-black font-mono ${
                            isOutOfStock ? 'text-rose-600' : isLowStock ? 'text-amber-700' : 'text-slate-900'
                          }`}
                        >
                          {item.quantity}
                        </span>
                        <span className="text-xs font-bold text-slate-500">{item.unit}</span>
                      </div>
                    </div>

                    <div className="text-left">
                      <span className="text-[10px] text-slate-400 block font-bold">ئاستی ئاگاداری:</span>
                      <span className="text-xs font-mono font-bold text-slate-600">
                        {item.minAlertLevel} {item.unit}
                      </span>
                    </div>
                  </div>

                  {/* Stock Bar */}
                  <div className="mt-3 space-y-1">
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        style={{ width: `${stockPct}%` }}
                        className={`h-full rounded-full transition-all duration-300 ${
                          isOutOfStock ? 'bg-rose-500' : isLowStock ? 'bg-amber-500' : 'bg-blue-600'
                        }`}
                      ></div>
                    </div>
                  </div>

                  {/* Unit Cost & Total Value */}
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span>نرخی دانە: {formatIQD(item.costPerUnit)}</span>
                    <strong className="text-slate-800 font-bold">
                      کۆ: {formatIQD(item.quantity * item.costPerUnit)}
                    </strong>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setRestockItem(item);
                      setRestockQty(10);
                      setRecordExpenseOnRestock(true);
                    }}
                    className="flex-1 py-1.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center gap-1 border border-blue-200/80 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>پڕکردنەوە (+Stock)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openEditModal(item)}
                    className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                    title="دەستکاری"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteItem(item.id, item.name)}
                    className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition cursor-pointer"
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
      {/* MODAL 1: ADD / EDIT INVENTORY ITEM                            */}
      {/* ============================================================= */}
      {isAddModalOpen && (
        <div
          dir="rtl"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-slate-900 dark:text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {editingItem ? 'دەستکاریکردنی مەواد' : 'زیادکردنی مەوادی نوێ بۆ عەمبار'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-3.5 text-xs text-slate-700 dark:text-slate-300">
              <div>
                <label className="font-bold block mb-1">ناوی مەواد / بەرهەم:</label>
                <input
                  type="text"
                  required
                  placeholder="بۆ نموونە: شامپۆی بەفر (Snow Foam)"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">بەش (Category):</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium outline-none focus:border-blue-500"
                  >
                    <option value="شامپۆ و کەف">شامپۆ و کەف</option>
                    <option value="واکس و پۆڵیش">واکس و پۆڵیش</option>
                    <option value="نانۆ و پارێزەر">نانۆ و پارێزەر</option>
                    <option value="ڕۆن و هایدرۆلیک">ڕۆن و هایدرۆلیک</option>
                    <option value="پێداویستی تر">پێداویستی تر</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold block mb-1">یەکە (Unit):</label>
                  <select
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium outline-none focus:border-blue-500"
                  >
                    <option value="لیتر">لیتر</option>
                    <option value="دانە">دانە</option>
                    <option value="کیلۆ">کیلۆ</option>
                    <option value="کارتۆن">کارتۆن</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">بڕی ئێستا لە عەمبار:</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1">ئاستی هۆشداری کەمی:</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={formMinAlert}
                    onChange={(e) => setFormMinAlert(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">تێچووی کڕینی یەک دانە (IQD):</label>
                <input
                  type="number"
                  step="500"
                  required
                  value={formCost}
                  onChange={(e) => setFormCost(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">تێبینی (ئارەزوومەندانە):</label>
                <input
                  type="text"
                  placeholder="بۆ نموونە: گالۆنی ۲۰ لیتری لە کۆمپانیای کاروان"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  پاشەکەوتکردن ✓
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
                >
                  پاشگەزبوونەوە
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 2: RESTOCK MODAL (WITH OPTIONAL EXPENSE LOGGING)        */}
      {/* ============================================================= */}
      {restockItem && (
        <div
          dir="rtl"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in"
          onClick={() => setRestockItem(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-slate-900 dark:text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">پڕکردنەوەی عەمبار (+Restock)</h3>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">{restockItem.name}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRestockItem(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRestockSubmit} className="space-y-4 text-xs text-slate-700 dark:text-slate-300">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">بڕی ئێستا لە عەمبار:</span>
                  <span className="text-base font-black text-slate-900 font-mono">
                    {restockItem.quantity} {restockItem.unit}
                  </span>
                </div>
                <div className="text-left">
                  <span className="text-[10px] text-slate-400 block font-bold">نرخی کڕین / {restockItem.unit}:</span>
                  <span className="text-xs font-black text-blue-700 font-mono">
                    {formatIQD(restockItem.costPerUnit)}
                  </span>
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">بڕی زیادکراو ({restockItem.unit}):</label>
                <input
                  type="number"
                  step="0.5"
                  required
                  min="0.1"
                  value={restockQty}
                  onChange={(e) => setRestockQty(Number(e.target.value))}
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-mono font-black text-base text-blue-600 outline-none focus:border-blue-500"
                />
              </div>

              {/* Total cost calculated */}
              <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-2xl flex items-center justify-between">
                <span className="font-bold text-blue-900">کۆی تێچووی کڕین:</span>
                <span className="font-mono font-black text-blue-900 text-sm">
                  {formatIQD(restockQty * restockItem.costPerUnit)}
                </span>
              </div>

              {/* Auto expense checkbox */}
              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={recordExpenseOnRestock}
                  onChange={(e) => setRecordExpenseOnRestock(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="font-bold text-slate-800">
                  ڕاستەوخۆ وەک پسوولەی خەرجی لە (خەرجییەکان) تۆمار بکرێت
                </span>
              </label>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  پڕکردنەوەی عەمبار ✓
                </button>
                <button
                  type="button"
                  onClick={() => setRestockItem(null)}
                  className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
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
