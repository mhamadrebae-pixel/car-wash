'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { TabKey } from '@/components/layout/Sidebar';
import { AuthUser } from '@/types';
import {
  Monitor,
  Car,
  LayoutDashboard,
  DollarSign,
  MoreHorizontal,
  Users,
  Wrench,
  Settings,
  Tv,
  BookOpen,
  Smartphone,
  LogOut,
  X,
  Sparkles,
  ChevronLeft,
  ShieldCheck,
  PackageCheck,
  Warehouse,
} from 'lucide-react';

interface MobileAppDockProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  activeCarsInBay: number;
  freeReadyCount: number;
  setupCount?: number;
  lowInventoryCount?: number;
  userRole?: 'admin' | 'cashier';
  carWashName?: string;
  currentUser?: AuthUser | null;
  onLogout?: () => void;
}

export const MobileAppDock: React.FC<MobileAppDockProps> = ({
  activeTab,
  onTabChange,
  activeCarsInBay,
  freeReadyCount,
  setupCount = 0,
  lowInventoryCount = 0,
  userRole = 'admin',
  carWashName = 'غەسلی ئۆتۆمبێل',
  currentUser,
  onLogout,
}) => {
  const [isMoreSheetOpen, setIsMoreSheetOpen] = useState(false);

  const primaryTabs: {
    id: TabKey;
    label: string;
    icon: any;
    badge?: number | string;
    badgeColor?: string;
  }[] = [
    {
      id: 'cashier',
      label: 'هۆڵەکان',
      icon: Monitor,
      badge: activeCarsInBay > 0 ? activeCarsInBay : undefined,
      badgeColor: 'bg-blue-600 text-white animate-pulse',
    },
    {
      id: 'vehicles',
      label: 'سەیارەکان',
      icon: Car,
      badge: freeReadyCount > 0 ? `${freeReadyCount} Free` : undefined,
      badgeColor: 'bg-emerald-600 text-white',
    },
    {
      id: 'analytics',
      label: 'داشبۆرد',
      icon: LayoutDashboard,
    },
    {
      id: 'expenses',
      label: 'خەرجی',
      icon: DollarSign,
    },
  ];

  // If cashier, limit primary tabs if needed
  const visibleTabs =
    userRole === 'cashier'
      ? primaryTabs.filter((t) => ['cashier', 'vehicles'].includes(t.id))
      : primaryTabs;

  const handleSelectTab = (tab: TabKey) => {
    onTabChange(tab);
    setIsMoreSheetOpen(false);
  };

  const isMoreActive = ['staff', 'setup', 'docs', 'settings', 'garage', 'inventory'].includes(activeTab);

  return (
    <>
      {/* ============================================================= */}
      {/* NATIVE APP BOTTOM DOCK (FIXED AT SCREEN BOTTOM)               */}
      {/* ============================================================= */}
      <nav
        dir="rtl"
        aria-label="مۆبایل ئەپ دۆک"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200/90 dark:border-slate-800 backdrop-blur-xl shadow-[0_-4px_24px_rgba(0,0,0,0.08)] select-none"
        style={{
          paddingBottom: 'max(8px, env(safe-area-inset-bottom, 8px))',
          paddingTop: '6px',
        }}
      >
        <div className="flex items-center justify-around px-2 max-w-lg mx-auto">
          {visibleTabs.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectTab(item.id)}
                className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200 active:scale-90 cursor-pointer ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400 font-black'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-medium'
                }`}
              >
                {/* Active indicator pill behind/above icon */}
                <div
                  className={`relative p-1 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-950/60 shadow-xs ring-1 ring-blue-500/20'
                      : 'bg-transparent'
                  }`}
                >
                  <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />

                  {/* Badge */}
                  {item.badge !== undefined && (
                    <span
                      className={`absolute -top-1.5 -right-2 px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold shadow-xs ${
                        item.badgeColor || 'bg-blue-600 text-white'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>

                <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[62px]">
                  {item.label}
                </span>
              </button>
            );
          })}

          {/* 5th Tab: "زیاتر (More / Menu)" - Native Bottom Sheet Trigger */}
          <button
            type="button"
            onClick={() => setIsMoreSheetOpen(true)}
            className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200 active:scale-90 cursor-pointer ${
              isMoreActive || isMoreSheetOpen
                ? 'text-blue-600 dark:text-blue-400 font-black'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-medium'
            }`}
          >
            <div
              className={`p-1 rounded-xl transition-all duration-200 ${
                isMoreActive || isMoreSheetOpen
                  ? 'bg-blue-50 dark:bg-blue-950/60 shadow-xs ring-1 ring-blue-500/20'
                  : 'bg-transparent'
              }`}
            >
              <MoreHorizontal className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">زیاتر</span>
          </button>
        </div>
      </nav>

      {/* ============================================================= */}
      {/* IOS-STYLE NATIVE BOTTOM SHEET (FOR "MORE / زیاتر")             */}
      {/* ============================================================= */}
      {isMoreSheetOpen && (
        <div
          dir="rtl"
          className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end animate-fade-in"
          onClick={() => setIsMoreSheetOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 rounded-t-[32px] shadow-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto animate-slide-up"
            style={{
              paddingBottom: 'max(24px, env(safe-area-inset-bottom, 24px))',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Grab Handle */}
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto" />

            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-blue-500/20">
                  {currentUser?.avatar || '👑'}
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {currentUser?.name || carWashName}
                  </h3>
                  <span className="text-[11px] text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    {userRole === 'admin' ? 'بەڕێوەبەری گشتی (Admin)' : 'کاشێری دەوام (Cashier)'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsMoreSheetOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center transition hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Secondary Modules Grid */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              {/* Garage & Parking */}
              <button
                type="button"
                onClick={() => handleSelectTab('garage')}
                className={`p-3.5 rounded-2xl border text-right transition flex flex-col justify-between cursor-pointer ${
                  activeTab === 'garage'
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 text-amber-700 dark:text-amber-300'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center shadow-xs">
                  <Warehouse className="w-4 h-4" />
                </div>
                <div className="mt-2.5">
                  <span className="text-xs font-black block">گەراج و پارکیک</span>
                  <span className="text-[10px] text-slate-400">٣٠ شوێن • ١,٠٠٠ دینار</span>
                </div>
              </button>

              {/* Staff */}
              <button
                type="button"
                onClick={() => handleSelectTab('staff')}
                className={`p-3.5 rounded-2xl border text-right transition flex flex-col justify-between cursor-pointer ${
                  activeTab === 'staff'
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 text-blue-700 dark:text-blue-300'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center shadow-xs">
                  <Users className="w-4 h-4" />
                </div>
                <div className="mt-2.5">
                  <span className="text-xs font-black block">وەستاکان و مووچە</span>
                  <span className="text-[10px] text-slate-400">کاتی دەوام و کۆمیسیۆن</span>
                </div>
              </button>

              {/* Setup CapEx */}
              <button
                type="button"
                onClick={() => handleSelectTab('setup')}
                className={`p-3.5 rounded-2xl border text-right transition flex flex-col justify-between cursor-pointer ${
                  activeTab === 'setup'
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 text-blue-700 dark:text-blue-300'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shadow-xs">
                  <Wrench className="w-4 h-4" />
                </div>
                <div className="mt-2.5">
                  <span className="text-xs font-black block">کەرەستە (CapEx)</span>
                  <span className="text-[10px] text-slate-400">{setupCount} ئامێری کڕدراو</span>
                </div>
              </button>

              {/* Inventory & Chemicals */}
              <button
                type="button"
                onClick={() => handleSelectTab('inventory')}
                className={`p-3.5 rounded-2xl border text-right transition flex flex-col justify-between cursor-pointer ${
                  activeTab === 'inventory'
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 text-blue-700 dark:text-blue-300'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center shadow-xs">
                  <PackageCheck className="w-4 h-4" />
                </div>
                <div className="mt-2.5">
                  <span className="text-xs font-black block">عەمبار و مەواد</span>
                  <span className="text-[10px] text-slate-400">
                    {lowInventoryCount > 0 ? `${lowInventoryCount} هۆشداری` : 'کۆنترۆڵی مەواد'}
                  </span>
                </div>
              </button>

              {/* TV Screen Link */}
              <Link
                href="/tv"
                target="_blank"
                onClick={() => setIsMoreSheetOpen(false)}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition flex flex-col justify-between"
              >
                <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center shadow-xs">
                  <Tv className="w-4 h-4" />
                </div>
                <div className="mt-2.5">
                  <span className="text-xs font-black block flex items-center gap-1">
                    شاشەی TV ↗
                  </span>
                  <span className="text-[10px] text-slate-400">ژووری چاوەڕوانی کڕیار</span>
                </div>
              </Link>

              {/* Settings */}
              {userRole === 'admin' && (
                <button
                  type="button"
                  onClick={() => handleSelectTab('settings')}
                  className={`p-3.5 rounded-2xl border text-right transition flex flex-col justify-between cursor-pointer ${
                    activeTab === 'settings'
                      ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 text-blue-700 dark:text-blue-300'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center shadow-xs">
                    <Settings className="w-4 h-4" />
                  </div>
                  <div className="mt-2.5">
                    <span className="text-xs font-black block">ڕێکخستنەکان</span>
                    <span className="text-[10px] text-slate-400">نرخ، تابلۆ و ستاف</span>
                  </div>
                </button>
              )}

              {/* Docs */}
              <button
                type="button"
                onClick={() => handleSelectTab('docs')}
                className={`p-3.5 rounded-2xl border text-right transition flex flex-col justify-between cursor-pointer ${
                  activeTab === 'docs'
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 text-blue-700 dark:text-blue-300'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 flex items-center justify-center shadow-xs">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="mt-2.5">
                  <span className="text-xs font-black block">ڕێنمایی و نەخشە</span>
                  <span className="text-[10px] text-slate-400">یاساکانی کارکردن</span>
                </div>
              </button>

              {/* Install PWA Trigger */}
              <button
                type="button"
                onClick={() => {
                  setIsMoreSheetOpen(false);
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('open-pwa-install'));
                  }
                }}
                className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 text-right transition flex flex-col justify-between cursor-pointer active:scale-95"
              >
                <div className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center shadow-xs">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div className="mt-2.5">
                  <span className="text-xs font-black block">دابەزاندن بۆ شاشە</span>
                  <span className="text-[10px] text-blue-100">Add to Home Screen 📱</span>
                </div>
              </button>
            </div>

            {/* Logout Row */}
            {onLogout && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsMoreSheetOpen(false);
                    onLogout();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 text-xs font-bold transition flex items-center justify-center gap-2 border border-rose-200 dark:border-rose-900 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>چوونەدەرەوە لە سیستەم (Logout)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
