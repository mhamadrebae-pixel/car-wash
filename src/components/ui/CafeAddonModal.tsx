'use client';

import React, { useState } from 'react';
import { CafeItem, SelectedCafeItem, Vehicle } from '@/types';
import { formatIQD, getSavedCafeItems, playPosSound } from '@/lib/storage';
import {
  Coffee,
  X,
  Plus,
  Minus,
  CheckCircle2,
  Sparkles,
  ShoppingBag,
  Trash2,
} from 'lucide-react';
import { PlateDisplay } from './PlateDisplay';

interface CafeAddonModalProps {
  vehicle?: Vehicle | null;
  initialSelectedItems?: SelectedCafeItem[];
  onSave: (items: SelectedCafeItem[], totalSum: number) => void;
  onClose: () => void;
}

export const CafeAddonModal: React.FC<CafeAddonModalProps> = ({
  vehicle,
  initialSelectedItems = [],
  onSave,
  onClose,
}) => {
  const cafeItems = getSavedCafeItems();
  const [selectedItems, setSelectedItems] = useState<SelectedCafeItem[]>(initialSelectedItems);
  const [activeCategory, setActiveCategory] = useState<string>('هەمووی');

  const categories = ['هەمووی', 'خواردنەوەی گەرم', 'خواردنەوەی سارد', 'بۆندارکەر و پێداویستی'];

  const handleAddItem = (item: CafeItem) => {
    try {
      playPosSound('beep');
    } catch {}

    setSelectedItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, quantity: 1 }];
    });
  };

  const handleDecreaseItem = (itemId: string) => {
    setSelectedItems((prev) => {
      const existing = prev.find((i) => i.id === itemId);
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        return prev.filter((i) => i.id !== itemId);
      }
      return prev.map((i) =>
        i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i
      );
    });
  };

  const totalSum = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const filteredItems =
    activeCategory === 'هەمووی'
      ? cafeItems
      : cafeItems.filter((i) => i.category === activeCategory);

  return (
    <div
      className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl relative text-slate-900 dark:text-white my-auto animate-in fade-in zoom-in-95 duration-150"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center justify-center font-bold">
              <Coffee className="w-5 h-5 text-amber-700 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900 dark:text-white">
                کافێ و پێداویستی ژووری چاوەڕوانی (Lounge Cafe)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                زیادکردنی چای، قاوە و بۆندارکەر بۆ سەر پسوولەی سەیارە
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

        {/* Vehicle Badge if provided */}
        {vehicle && (
          <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl">
            <div className="flex items-center gap-2">
              <PlateDisplay plate={vehicle.plate} size="sm" />
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                {vehicle.carModel} - {vehicle.ownerName}
              </span>
            </div>
            {vehicle.currentBay && (
              <span className="text-[10px] bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded-full font-bold">
                هۆڵی {vehicle.currentBay}
              </span>
            )}
          </div>
        )}

        {/* Category Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                activeCategory === cat
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Menu Items Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto p-1">
          {filteredItems.map((item) => {
            const selected = selectedItems.find((i) => i.id === item.id);
            return (
              <div
                key={item.id}
                onClick={() => handleAddItem(item)}
                className={`p-2.5 rounded-2xl border transition cursor-pointer text-right flex flex-col justify-between active:scale-95 ${
                  selected
                    ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-400 dark:border-amber-600 shadow-2xs'
                    : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block leading-snug">
                    {item.name}
                  </span>
                  <span className="text-[11px] font-mono font-bold text-amber-800 dark:text-amber-300 block pt-0.5">
                    {formatIQD(item.price)}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">{item.category}</span>
                  {selected ? (
                    <span className="w-5 h-5 rounded-full bg-amber-600 text-white text-[10px] font-bold font-mono flex items-center justify-center">
                      {selected.quantity}
                    </span>
                  ) : (
                    <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs flex items-center justify-center">
                      +
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Items Counter Bar */}
        <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              داواکارییە هەڵبژێردراوەکان ({selectedItems.length}):
            </span>
            <span className="font-mono text-amber-900 dark:text-amber-300 text-sm font-black">
              کۆی کافێ: {formatIQD(totalSum)}
            </span>
          </div>

          {selectedItems.length === 0 ? (
            <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center py-1">
              هیچ خواردنەوە یان پێداویستییەک هەڵنەبژێردراوە. کلیک لەسەر یەکێک بکە بۆ زیادکردن.
            </p>
          ) : (
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {selectedItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between text-xs bg-white dark:bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  <span className="font-bold text-slate-800 dark:text-slate-200">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300">
                      {formatIQD(item.price * item.quantity)}
                    </span>
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() => handleDecreaseItem(item.id)}
                        className="w-5 h-5 rounded bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center text-xs font-bold cursor-pointer"
                      >
                        -
                      </button>
                      <span className="font-mono font-bold text-xs px-1 text-slate-900 dark:text-white">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() =>
                          handleAddItem({ id: item.id, name: item.name, price: item.price, category: 'خواردنەوەی گەرم' })
                        }
                        className="w-5 h-5 rounded bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center text-xs font-bold cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => {
              onSave(selectedItems, totalSum);
              onClose();
            }}
            className="flex-1 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-amber-600/20 active:scale-95 text-xs cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>تەواوکردن و دانان لەسەر پسوولە ({formatIQD(totalSum)})</span>
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
