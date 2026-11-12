'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  TrendingUp,
  Monitor,
  Car,
  Users,
  Wrench,
  DollarSign,
  BookOpen,
  Settings,
  Sparkles,
  ShieldCheck,
  Target,
  Gift,
  Layers,
  PieChart,
  CalendarDays,
  History,
  ChevronDown,
  ChevronUp,
  PanelRightClose,
  PanelRightOpen,
  MoreHorizontal,
  X,
  Calendar,
  Briefcase,
  Clock,
  Smartphone,
  LogOut,
  Sun,
  Moon,
  PackageCheck,
  Warehouse,
} from 'lucide-react';
import { AuthUser } from '@/types';

export type TabKey =
  | 'analytics'
  | 'cashier'
  | 'garage'
  | 'vehicles'
  | 'inventory'
  | 'staff'
  | 'setup'
  | 'expenses'
  | 'docs'
  | 'settings';

export type AnalyticsSectionKey =
  | 'overview'
  | 'periods'
  | 'breakeven'
  | 'offers'
  | 'services'
  | 'expenses'
  | 'staff';

export type VehicleSectionKey =
  | 'registry'
  | 'loyalty'
  | 'retention'
  | 'history';

interface SidebarProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  activeAnalyticsSection?: AnalyticsSectionKey;
  onAnalyticsSectionChange?: (section: AnalyticsSectionKey) => void;
  activeVehicleSection?: VehicleSectionKey;
  onVehicleSectionChange?: (section: VehicleSectionKey) => void;
  carWashName: string;
  activeCarsCount: number;
  parkedCarsCount?: number;
  setupCount: number;
  freeReadyCount?: number;
  expiredCount?: number;
  lowInventoryCount?: number;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
  userRole?: 'admin' | 'cashier';
  currentUser?: AuthUser | null;
  onLogout?: () => void;
  currentTheme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  activeAnalyticsSection = 'overview',
  onAnalyticsSectionChange,
  activeVehicleSection = 'registry',
  onVehicleSectionChange,
  carWashName,
  activeCarsCount,
  parkedCarsCount = 0,
  setupCount,
  freeReadyCount = 0,
  expiredCount = 0,
  lowInventoryCount = 0,
  isMobileOpen = false,
  onMobileClose,
  userRole = 'admin',
  currentUser,
  onLogout,
  currentTheme = 'light',
  onToggleTheme,
}) => {
  // Collapsible state (Matching Collapsible Sidebar UI Upgrade)
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isAnalyticsDropdownOpen, setIsAnalyticsDropdownOpen] = useState<boolean>(activeTab === 'analytics');
  const [isVehiclesDropdownOpen, setIsVehiclesDropdownOpen] = useState<boolean>(activeTab === 'vehicles');

  // Auto-expand active module dropdown while keeping others clean
  useEffect(() => {
    if (activeTab === 'analytics') {
      setIsAnalyticsDropdownOpen(true);
    } else if (activeTab === 'vehicles') {
      setIsVehiclesDropdownOpen(true);
    }
  }, [activeTab]);

  // Sync collapsed state with localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('carwash_sidebar_collapsed');
      if (saved !== null) {
        setIsCollapsed(saved === 'true');
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const handleToggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    try {
      localStorage.setItem('carwash_sidebar_collapsed', String(next));
    } catch {
      // Ignore storage errors
    }
  };

  // Main Navigation Modules (Matching ProPanel structure)
  const menuItems: {
    id: TabKey;
    label: string;
    icon: any;
    badge?: number | string;
    badgeColor?: string;
    hasDropdown?: boolean;
  }[] = [
    {
      id: 'cashier',
      label: 'کاشێر و فرۆشتن',
      icon: Monitor,
      badge: activeCarsCount > 0 ? activeCarsCount : undefined,
      badgeColor: 'bg-blue-100 text-blue-700 border border-blue-200/60',
    },
    {
      id: 'vehicles',
      label: 'سەیارەکان و لۆیەڵتی تابلۆ',
      icon: Car,
      hasDropdown: true,
    },
    {
      id: 'analytics',
      label: 'داشبۆرد و شیکاری (Dashboard)',
      icon: LayoutDashboard,
      hasDropdown: true,
    },
    {
      id: 'staff',
      label: 'وەستاکان و کاتی دەوام',
      icon: Users,
    },
    {
      id: 'expenses',
      label: 'خەرجییەکان (Expenses)',
      icon: DollarSign,
    },
    {
      id: 'inventory',
      label: 'عەمبار و مەواد (Inventory)',
      icon: PackageCheck,
      badge: lowInventoryCount > 0 ? `${lowInventoryCount} کەمە` : undefined,
      badgeColor: 'bg-rose-50 text-rose-700 border border-rose-200/80 animate-pulse',
    },
    {
      id: 'docs',
      label: 'نەخشەی کار و ڕێنمایی',
      icon: BookOpen,
    },
    {
      id: 'settings',
      label: 'ڕێکخستنەکان (Settings)',
      icon: Settings,
    },
  ];

  const cashierAllowedTabs: TabKey[] = ['cashier', 'vehicles', 'docs'];
  const visibleMenuItems =
    userRole === 'cashier'
      ? menuItems.filter((item) => cashierAllowedTabs.includes(item.id))
      : menuItems;

  // Dashboard Sub-Sections (Streamlined Modern Executive Suite)
  const dashboardSubSections: {
    id: AnalyticsSectionKey;
    label: string;
    icon: any;
  }[] = [
    {
      id: 'overview',
      label: 'داشبۆردی سەرەکی (Overview)',
      icon: Sparkles,
    },
    {
      id: 'breakeven',
      label: 'خاڵی زەرەر نەکردن (Break-Even)',
      icon: Target,
    },
    {
      id: 'periods',
      label: 'شیکاری دارایی و کرێ (Profit Funnel)',
      icon: CalendarDays,
    },
  ];

  // Vehicles Sub-Sections (Rendered under Vehicles dropdown)
  const vehicleSubSections: {
    id: VehicleSectionKey;
    label: string;
    icon: any;
    badge?: number;
    badgeColor?: string;
  }[] = [
    {
      id: 'registry',
      label: 'هەموو سەیارەکان (Registry)',
      icon: Car,
    },
    {
      id: 'loyalty',
      label: 'شۆردنی دیاری و لۆیەڵتی (Loyalty)',
      icon: Gift,
      badge: freeReadyCount,
      badgeColor: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80',
    },
    {
      id: 'retention',
      label: 'کڕیاری ناچالاک (Retention)',
      icon: Clock,
      badge: expiredCount,
      badgeColor: 'bg-rose-50 text-rose-700 border border-rose-200/80',
    },
    {
      id: 'history',
      label: 'مێژووی شۆردنەکان (Logs)',
      icon: History,
    },
  ];

  const handleSelectTab = (id: TabKey) => {
    onTabChange(id);
    if (id === 'analytics') {
      setIsAnalyticsDropdownOpen(true);
    }
    if (id === 'vehicles') {
      setIsVehiclesDropdownOpen(true);
    }
    if (onMobileClose && window.innerWidth < 1024) {
      onMobileClose();
    }
  };

  const handleSelectSubSection = (id: AnalyticsSectionKey) => {
    if (onAnalyticsSectionChange) {
      onAnalyticsSectionChange(id);
    }
    if (onMobileClose && window.innerWidth < 1024) {
      onMobileClose();
    }
  };

  const handleSelectVehicleSubSection = (id: VehicleSectionKey) => {
    onTabChange('vehicles');
    if (onVehicleSectionChange) {
      onVehicleSectionChange(id);
    }
    if (onMobileClose && window.innerWidth < 1024) {
      onMobileClose();
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={onMobileClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 right-0 h-screen bg-white dark:bg-slate-900 border-l border-slate-200/80 dark:border-slate-800 flex flex-col justify-between shrink-0 select-none z-50 transition-all duration-300 ease-in-out shadow-xl lg:shadow-xs ${
          isMobileOpen
            ? 'translate-x-0 w-72 sm:w-80'
            : isCollapsed
            ? 'translate-x-full lg:translate-x-0 lg:w-16'
            : 'translate-x-full lg:translate-x-0 lg:w-56 xl:w-60'
        }`}
        dir="rtl"
      >
        {/* 1. BRAND HEADER (Matching ProPanel with Clean Collapse Toggle) */}
        <div className="p-2.5 sm:p-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          {isCollapsed ? (
            /* When collapsed: single perfectly centered toggle button with purple gradient */
            <button
              onClick={handleToggleCollapse}
              className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#6366F1] via-[#7C3AED] to-[#8B5CF6] flex items-center justify-center text-white shadow-md shadow-indigo-500/25 mx-auto hover:scale-105 transition-transform group"
              title="فراوانکردنی مینیۆ (Expand)"
            >
              <PanelRightOpen className="w-4 h-4 text-white transition-transform group-hover:scale-110" />
            </button>
          ) : (
            /* When expanded: brand logo + name on right, toggle button on left */
            <>
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#6366F1] via-[#7C3AED] to-[#8B5CF6] flex items-center justify-center text-white shadow-md shadow-indigo-500/25 shrink-0">
                  <Layers className="w-4 h-4 text-white" />
                </div>

                <div className="overflow-hidden animate-fade-in">
                  <h1 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 truncate tracking-tight">
                    {carWashName || 'ProPanel'}
                  </h1>
                  <span className={`text-[10px] font-bold block truncate ${userRole === 'cashier' ? 'text-blue-600 dark:text-blue-400' : 'text-purple-600 dark:text-purple-400'}`}>
                    {userRole === 'cashier' ? 'شیفتی کاشێر (Cashier)' : 'بەڕێوەبەری سیستەم'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={handleToggleCollapse}
                  className="hidden lg:flex w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 items-center justify-center transition shadow-xs border border-purple-200/50 dark:border-purple-800/50"
                  title="کورتکردنەوەی مینیۆ (Collapse)"
                >
                  <PanelRightClose className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={onMobileClose}
                  className="lg:hidden w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition"
                  title="داخستنی مینیۆ"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>

        {/* 2. NAVIGATION BODY */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto scrollbar-none">
          {!isCollapsed && (
            <div className="px-2.5 pt-1.5 pb-0.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
              MENU • مینیۆ
            </div>
          )}

          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isAnalytics = item.id === 'analytics';
            const isVehicles = item.id === 'vehicles';
            const isDividerNeeded = item.id === 'docs';

            return (
              <React.Fragment key={item.id}>
                {isDividerNeeded && !isCollapsed && (
                  <div className="border-t border-slate-100 my-1.5 pt-1" />
                )}

                <div className="space-y-1">
                  <button
                    onClick={() => {
                      if (isAnalytics && isActive) {
                        setIsAnalyticsDropdownOpen(!isAnalyticsDropdownOpen);
                      } else if (isVehicles && isActive) {
                        setIsVehiclesDropdownOpen(!isVehiclesDropdownOpen);
                      } else {
                        handleSelectTab(item.id);
                      }
                    }}
                    title={isCollapsed ? item.label : undefined}
                    className={`w-full flex items-center justify-between py-2 px-2.5 rounded-xl text-xs font-bold transition-all group ${
                      isActive
                        ? 'bg-gradient-to-r from-[#6366F1] via-[#7C3AED] to-[#8B5CF6] text-white shadow-md shadow-indigo-500/25'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    } ${isCollapsed ? 'justify-center px-0' : ''}`}
                  >
                    <div className={`flex items-center ${isCollapsed ? 'justify-center w-full' : 'gap-2.5'}`}>
                      <Icon
                        className={`w-4 h-4 transition-transform group-hover:scale-110 shrink-0 ${
                          isActive ? 'text-white' : 'text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-400'
                        }`}
                      />
                      {!isCollapsed && <span className="text-right truncate text-xs">{item.label}</span>}
                    </div>

                    {!isCollapsed && (
                      <div className="flex items-center gap-1">
                        {typeof item.badge !== 'undefined' && item.badge !== 0 && (
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold font-mono shadow-xs ${
                              isActive
                                ? 'bg-white/20 text-white'
                                : item.badgeColor || 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}

                        {item.hasDropdown && (
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform duration-200 ${
                              isActive ? 'text-white' : 'text-slate-400'
                            } ${
                              (isAnalytics && isAnalyticsDropdownOpen) || (isVehicles && isVehiclesDropdownOpen)
                                ? 'rotate-180'
                                : ''
                            }`}
                          />
                        )}
                      </div>
                    )}
                  </button>

                  {/* Smooth Nested Dropdown (Matching "Overview / Performance" in ProPanel shot) */}
                  {isAnalytics && isActive && isAnalyticsDropdownOpen && !isCollapsed && (
                    <div className="mr-3 pr-2 border-r-2 border-purple-100 dark:border-purple-900/60 space-y-0.5 my-1 animate-fade-in">
                      {dashboardSubSections.map((sub) => {
                        const SubIcon = sub.icon;
                        const isSubActive = activeAnalyticsSection === sub.id;

                        return (
                          <button
                            key={sub.id}
                            onClick={() => handleSelectSubSection(sub.id)}
                            className={`w-full text-right px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-2 text-xs font-semibold cursor-pointer ${
                              isSubActive
                                ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold border border-purple-200/60 dark:border-purple-800/60 shadow-xs'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isSubActive ? 'bg-purple-600 dark:bg-purple-400' : 'bg-slate-300 dark:bg-slate-600'
                              } shrink-0`}
                            ></span>
                            <span className="truncate leading-tight text-[11px]">{sub.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Smooth Nested Dropdown for Vehicles */}
                  {isVehicles && isActive && isVehiclesDropdownOpen && !isCollapsed && (
                    <div className="mr-3 pr-2 border-r-2 border-purple-100 dark:border-purple-900/60 space-y-0.5 my-1 animate-fade-in">
                      {vehicleSubSections.map((sub) => {
                        const SubIcon = sub.icon;
                        const isSubActive = activeVehicleSection === sub.id;

                        return (
                          <button
                            key={sub.id}
                            onClick={() => handleSelectVehicleSubSection(sub.id)}
                            className={`w-full text-right px-2.5 py-1.5 rounded-lg transition-all flex items-center justify-between text-xs font-semibold cursor-pointer ${
                              isSubActive
                                ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold border border-purple-200/60 dark:border-purple-800/60 shadow-xs'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isSubActive ? 'bg-purple-600 dark:bg-purple-400' : 'bg-slate-300 dark:bg-slate-600'
                                } shrink-0`}
                              ></span>
                              <span className="truncate leading-tight text-[11px]">{sub.label}</span>
                            </div>
                            {typeof sub.badge === 'number' && sub.badge > 0 && (
                              <span
                                className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold font-mono ${
                                  sub.badgeColor || 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                                }`}
                              >
                                {sub.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </React.Fragment>
            );
          })}
        </nav>

        {/* 3. FOOTER: USER PROFILE CARD (Matching "Alex Morgan - Pro Member" in the shot) */}
        <div className="p-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5 bg-slate-50/50 dark:bg-slate-900/50">
          {/* Quick Install Mobile App button */}
          {!isCollapsed && (
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('open-pwa-install'));
                }
              }}
              className="w-full py-1.5 px-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800 hover:from-blue-100 hover:to-indigo-100 dark:hover:bg-slate-750 text-blue-800 dark:text-blue-300 rounded-xl text-[11px] font-bold flex items-center justify-between border border-blue-200/80 dark:border-slate-700 shadow-xs transition group cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                <span className="text-[10px]">دابەزاندنی ئەپ (Mobile App)</span>
              </div>
              <span className="text-[9px] text-blue-700 dark:text-blue-300 font-bold bg-blue-100/70 dark:bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                Install 📱
              </span>
            </button>
          )}



          {/* Theme Toggle (Dark / Light Mode) */}
          {onToggleTheme && (
            <button
              type="button"
              onClick={() => onToggleTheme?.()}
              className={`w-full py-1.5 px-2 rounded-xl text-[11px] font-bold flex items-center ${
                isCollapsed ? 'justify-center p-2' : 'justify-between'
              } border shadow-xs transition group cursor-pointer ${
                currentTheme === 'dark'
                  ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/40 ring-1 ring-amber-400/20'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200/80'
              }`}
              title={
                currentTheme === 'dark'
                  ? 'گۆڕین بۆ دۆخی ڕووناک (Light Mode)'
                  : 'گۆڕین بۆ دۆخی تاریک (Dark Mode)'
              }
            >
              <div className="flex items-center gap-1.5">
                {currentTheme === 'dark' ? (
                  <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
                ) : (
                  <Moon className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                )}
                {!isCollapsed && (
                  <span className="text-[10px]">
                    {currentTheme === 'dark' ? 'دۆخی شەوانە چالاکە' : 'دۆخی ڕۆژ چالاکە'}
                  </span>
                )}
              </div>
              {!isCollapsed && (
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                    currentTheme === 'dark'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : 'bg-indigo-50 text-indigo-600 border-indigo-200'
                  }`}
                >
                  {currentTheme === 'dark' ? 'تاریک 🌙' : 'ڕووناک ☀️'}
                </span>
              )}
            </button>
          )}

          {/* User Profile Box & Logout (Moving Logout into this spot as requested) */}
          <div
            className={`p-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-xs flex items-center ${
              isCollapsed ? 'flex-col gap-1.5 p-1.5' : 'justify-between'
            }`}
          >
            <div className="flex items-center gap-2 overflow-hidden">
              {/* Avatar Circle */}
              <div
                className={`w-7 h-7 rounded-lg ${
                  currentUser?.role === 'admin'
                    ? 'bg-gradient-to-tr from-[#6366F1] to-[#8B5CF6]'
                    : 'bg-gradient-to-tr from-blue-600 to-cyan-600'
                } text-white flex items-center justify-center font-bold text-[11px] shadow-sm shrink-0`}
                title={currentUser?.name || (currentUser?.role === 'admin' ? 'بەڕێوەبەری سیستەم' : 'کاشێری سەرەکی')}
              >
                {currentUser?.avatar || (currentUser?.role === 'admin' ? '👑' : 'CW')}
              </div>

              {!isCollapsed && (
                <div className="text-right overflow-hidden">
                  <div className="text-xs font-extrabold text-slate-900 dark:text-slate-100 truncate">
                    {currentUser?.name || (currentUser?.role === 'admin' ? 'بەڕێوەبەری سیستەم' : 'کاشێری سەرەکی')}
                  </div>
                  <div className="text-[9px] text-purple-600 dark:text-purple-400 font-bold truncate">
                    {currentUser?.role === 'admin' ? 'بەڕێوەبەر (Admin)' : 'کاشێر (Cashier)'}
                  </div>
                </div>
              )}
            </div>

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className={`rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center transition shrink-0 cursor-pointer ${
                  isCollapsed ? 'w-7 h-7' : 'px-2 py-1 gap-1 text-xs font-bold'
                }`}
                title="چوونەدەرەوە لە سیستەم"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-500" />
                {!isCollapsed && <span className="text-[10px] text-rose-600 font-bold">دەرچوون</span>}
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
