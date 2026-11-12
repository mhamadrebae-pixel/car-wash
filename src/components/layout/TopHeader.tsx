'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { formatIQD, normalizeDigits, calculateDaysSince, getSavedInventory, getSavedSettings, isDateToday } from '@/lib/storage';
import { openWhatsAppChat, generateInactivityReminderMessage } from '@/lib/whatsapp';
import { Vehicle, AuthUser, ParkingRecord } from '@/types';
import { PlateDisplay } from '@/components/ui/PlateDisplay';
import {
  DollarSign,
  Clock,
  Car,
  Menu,
  Search,
  Bell,
  X,
  Sparkles,
  AlertTriangle,
  Gift,
  CheckCheck,
  MessageCircle,
  ExternalLink,
  Layers,
  ChevronLeft,
  LogOut,
  Smartphone,
  Sun,
  Moon,
} from 'lucide-react';

interface TopHeaderProps {
  totalRevenue: number;
  activeCarsInBay: number;
  staffPin?: string;
  onToggleMobileMenu?: () => void;
  carWashName?: string;
  vehicles?: Vehicle[];
  parkingRecords?: ParkingRecord[];
  onOpenSettings?: () => void;
  onSelectVehicle?: (vehicle: Vehicle) => void;
  currentUser?: AuthUser | null;
  onLogout?: () => void;
  currentTheme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

interface NotificationItem {
  id: string;
  type: 'loyalty' | 'stock' | 'queue' | 'inactivity';
  title: string;
  description: string;
  timeText: string;
  badge: string;
  badgeColor: string;
  vehicle?: Vehicle;
  onWhatsApp?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  totalRevenue,
  activeCarsInBay,
  onToggleMobileMenu,
  vehicles = [],
  parkingRecords = [],
  onSelectVehicle,
  currentUser,
  onLogout,
  currentTheme = 'light',
  onToggleTheme,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isMounted, setIsMounted] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  // Notification Modal state
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [dismissedNotifIds, setDismissedNotifIds] = useState<string[]>([]);
  const [notifTab, setNotifTab] = useState<'all' | 'loyalty' | 'stock'>('all');
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Close notifications dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotificationOpen(false);
      }
    };
    if (isNotificationOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isNotificationOpen]);

  // Compute live notifications from system data
  const settings = getSavedSettings();
  const inventory = typeof window !== 'undefined' ? getSavedInventory() : [];

  // Calculate today's revenue (for cashier role privacy - including washes + garage parking)
  const todayRevenue = useMemo(() => {
    const washToday = vehicles.reduce((acc, v) => {
      const vehicleToday = (v.washHistory || [])
        .filter((w) => isDateToday(w.date))
        .reduce((sum, w) => sum + (w.price || 0), 0);
      return acc + vehicleToday;
    }, 0);

    const garageToday = (parkingRecords || [])
      .filter((p) => p.paymentStatus === 'paid' && isDateToday(p.entryTime))
      .reduce((sum, p) => sum + (Number(p.fee) || 0), 0);

    return washToday + garageToday;
  }, [vehicles, parkingRecords]);

  const rawNotifications: NotificationItem[] = [];

  // 1. Loyalty Free Wash Ready Alerts (4 washes completed)
  vehicles.forEach((v) => {
    if (v.currentCycleWashes >= 4) {
      rawNotifications.push({
        id: `loyalty-${v.id}`,
        type: 'loyalty',
        title: `🎉 شۆردنی دیاری (FREE) ئامادەیە!`,
        description: `کڕیار ${v.ownerName} (${v.carModel}) ٤ شۆردنی لەم خولەدا تەواو کردووە و شۆردنی داهاتووی بێبەرامبەرە.`,
        timeText: 'لۆیەڵتی NFC',
        badge: 'دیاری 0 IQD',
        badgeColor: 'bg-purple-100 text-purple-700 border-purple-200',
        vehicle: v,
        onWhatsApp: () => {
          if (!v.phone) {
            alert('ئەم سەیارەیە ژمارەی مۆبایلی بۆ تۆمار نەکراوە!');
            return;
          }
          const msg = `سڵاو بەڕێز ${v.ownerName} 🌸\nسوپاس بۆ وەفاداریت لە ${settings.carWashName}! تۆ ٤ شۆردنت تەواو کردووە و شۆردنی داهاتووت ١٠٠٪ بێبەرامبەرە (FREE) 🎉🚗✨ بەخێربێیت لە هەر کاتێکدا!`;
          openWhatsAppChat(v.phone, msg);
        },
      });
    }
  });

  // 2. Inactive Customers Reminder (15+ days since last visit)
  vehicles.forEach((v) => {
    const daysSince = calculateDaysSince(v.lastVisitDate);
    if (daysSince >= 15 && v.phone) {
      rawNotifications.push({
        id: `inact-${v.id}`,
        type: 'inactivity',
        title: `⏰ کڕیار بۆ ماوەی ${daysSince} ڕۆژە سەردانی نەکردووە`,
        description: `${v.ownerName} (${v.carModel}) - پێویستە نامەی بیری خستنەوەی لۆیەڵتی بۆ بنێردرێت.`,
        timeText: `پێش ${daysSince} ڕۆژ`,
        badge: 'بیری خستنەوە',
        badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
        vehicle: v,
        onWhatsApp: () => {
          const msg = generateInactivityReminderMessage(v, settings, daysSince);
          openWhatsAppChat(v.phone, msg);
        },
      });
    }
  });

  // 3. Low Inventory Stock Alerts
  inventory.forEach((item) => {
    if (item.quantity <= item.minAlertLevel) {
      rawNotifications.push({
        id: `stock-${item.id}`,
        type: 'stock',
        title: `⚠️ ئاگاداری کۆگا: ${item.name}`,
        description: `بڕی ماوە تەنها ${item.quantity} ${item.unit}ە (کەمتر لە ئاستی ئاگاداری ${item.minAlertLevel} ${item.unit}). پێویستی بە کڕینەوەیە.`,
        timeText: 'مەخزەن',
        badge: 'کەمی ماددە',
        badgeColor: 'bg-rose-100 text-rose-700 border-rose-200',
      });
    }
  });

  // 4. Vehicles Waiting in Queue
  const queueCars = vehicles.filter((v) => !v.currentBay && v.status === 'active');
  if (queueCars.length > 0) {
    rawNotifications.push({
      id: `queue-status`,
      type: 'queue',
      title: `🚗 سەیارە لە ڕیزی چاوەڕوانیدایە`,
      description: `لە ئێستادا ${queueCars.length} سەیارە لە نۆبەدان و لە ڕیزی چاوەڕوانیدان بۆ شۆردن.`,
      timeText: 'نۆبە',
      badge: `${queueCars.length} سەیارە`,
      badgeColor: 'bg-blue-100 text-blue-700 border-blue-200',
    });
  }

  // Filter out dismissed
  const activeNotifications = rawNotifications.filter(
    (n) => !dismissedNotifIds.includes(n.id)
  );

  const filteredNotifications = activeNotifications.filter((n) => {
    if (notifTab === 'loyalty') return n.type === 'loyalty' || n.type === 'inactivity';
    if (notifTab === 'stock') return n.type === 'stock';
    return true;
  });

  const unreadCount = activeNotifications.length;

  const handleDismissAll = () => {
    setDismissedNotifIds(rawNotifications.map((n) => n.id));
  };

  const handleDismissSingle = (id: string) => {
    setDismissedNotifIds((prev) => [...prev, id]);
  };

  // Filter matching vehicles for quick search dropdown
  const cleanQ = normalizeDigits(searchQuery.trim().toLowerCase());
  const rawQ = searchQuery.trim().toLowerCase();

  const matchedVehicles = rawQ
    ? vehicles
        .filter((v) => {
          const matchesOwner = v.ownerName.toLowerCase().includes(rawQ);
          const matchesPhone = normalizeDigits(v.phone || '').includes(cleanQ);
          const matchesModel = v.carModel.toLowerCase().includes(rawQ);
          const matchesPlateNumber =
            v.plate.type === 'unified'
              ? normalizeDigits(v.plate.number || '').includes(cleanQ) ||
                (v.plate.letter || '').toLowerCase().includes(rawQ) ||
                (v.plate.provinceName || '').includes(rawQ)
              : normalizeDigits(v.plate.oldNumber || '').includes(cleanQ) ||
                (v.plate.oldCityName || '').includes(rawQ);
          return matchesOwner || matchesPhone || matchesModel || matchesPlateNumber;
        })
        .slice(0, 5)
    : [];

  return (
    <header
      className="header-safe-top min-h-14 sm:min-h-16 h-auto pb-2 border-b border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between select-none sticky top-0 z-30 shadow-xs text-slate-800 dark:text-slate-100 w-full max-w-full overflow-hidden"
    >
      {/* Right side: Mobile Hamburger, Brand Name, Mobile Search Button, Live Desktop Search Bar & Clock */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 sm:px-3 sm:py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer hover:opacity-95 active:scale-95 transition"
            title="مینیۆی سەرەکی"
          >
            <Menu className="w-4 h-4" />
            <span className="text-[11px] font-bold hidden sm:inline">مینیۆ</span>
          </button>
        )}

        {/* Mobile Facility Title */}
        <span className="text-xs font-black text-slate-800 dark:text-white truncate max-w-[130px] font-sans block sm:hidden">
          {settings.carWashName || 'غەسلی دەریا'}
        </span>

        {/* Mobile Search Button (< md screens) */}
        <button
          onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
          className={`md:hidden p-2 rounded-xl transition flex items-center justify-center shrink-0 ${
            isMobileSearchOpen ? 'bg-blue-600 text-white shadow-xs' : 'bg-[#F1F3F7] dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
          title="گەڕان بەدوای تابلۆ یان کڕیار"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Live Search Bar (Desktop) */}
        <div className="relative hidden md:block shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-[#F1F3F7] dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 text-xs w-44 lg:w-64 max-w-[260px] focus-within:border-purple-400 focus-within:bg-white dark:focus-within:bg-slate-750 transition-all shadow-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="گەڕانی خێرا (تابلۆ، کڕیار)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none w-full text-xs font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 shrink-0"
                title="سڕینەوە"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Search Floating Results (Desktop) */}
          {rawQ.length > 0 && (
            <div className="absolute top-11 right-0 w-80 bg-white/98 dark:bg-slate-900/98 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl backdrop-blur-xl p-2 z-50 space-y-1">
              <div className="px-2 py-1 text-[10px] text-slate-500 dark:text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800 flex justify-between">
                <span>ئەنجامەکانی گەڕان ({matchedVehicles.length})</span>
                <span className="text-purple-600 dark:text-purple-400 font-mono">Royal Car Wash</span>
              </div>
              {matchedVehicles.length === 0 ? (
                <div className="p-3 text-center text-xs text-slate-400">
                  هیچ سەیارەیەک نەدۆزرایەوە بەم ناو یان تابلۆیە!
                </div>
              ) : (
                matchedVehicles.map((v) => (
                  <div
                    key={v.id}
                    onClick={() => {
                      if (onSelectVehicle) onSelectVehicle(v);
                      setSearchQuery('');
                    }}
                    className="p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between transition gap-2"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100">{v.ownerName}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        {v.carModel} • {v.color}
                      </div>
                    </div>
                    <PlateDisplay plate={v.plate} size="sm" />
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Compact Clock (Desktop) */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[#F1F3F7] dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap shrink-0">
          <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
          <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-200" suppressHydrationWarning>
            {currentTime || '...'}
          </span>
        </div>
      </div>

      {/* Left side: Live Badges, Interactive Notification Bell */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Active Bays Live Badge (Hidden on mobile < sm to save space, visible in bottom dock & dashboard) */}
        <div className="hidden sm:flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 text-xs text-blue-900 dark:text-blue-200 whitespace-nowrap shrink-0 shadow-xs">
          <Car className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
          <span className="text-blue-700 dark:text-blue-300 text-[11px] hidden md:inline">لە غەسلدا:</span>
          <strong className="text-blue-900 dark:text-blue-100 font-mono font-bold text-xs">
            {activeCarsInBay} <span className="hidden sm:inline">سەیارە</span>
          </strong>
        </div>

        {/* Total Revenue Live Badge (Hidden on mobile < sm to eliminate crowding and avoid contradicting today's sales) */}
        <div className="hidden sm:flex items-center gap-1 sm:gap-1.5 px-2 py-1.5 sm:px-3 rounded-xl sm:rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-950 dark:text-emerald-200 whitespace-nowrap shrink-0 shadow-xs">
          <DollarSign className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="text-emerald-700 dark:text-emerald-300 text-[11px] font-bold">
            {currentUser?.role === 'cashier' ? 'فرۆشی ئەمڕۆ:' : 'فرۆش و داهات:'}
          </span>
          <strong className="text-emerald-950 dark:text-emerald-100 font-mono font-black text-[11px] sm:text-xs">
            {formatIQD(currentUser?.role === 'cashier' ? todayRevenue : totalRevenue)}
          </strong>
        </div>

        {/* Network Status Badge (Hidden on mobile < sm to avoid nav bloat) */}
        <div
          className={`hidden sm:flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-2xl border text-xs font-bold transition shrink-0 shadow-xs cursor-default ${
            isOnline
              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
              : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60 ring-1 ring-amber-400/30 animate-pulse'
          }`}
          title={
            isOnline
              ? '🟢 بەستراوەتەوە بە سێرڤەر (Online)'
              : '🟠 دۆخی ئۆفلاین (Offline): ئینتەرنێت نییە، داتاکان لە ناوخۆدا پارێزراون و لە کاتی پەیدابوونەوەی ئینتەرنێت خودکار هاوکات دەبن'
          }
        >
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
            }`}
          />
          <span className="text-[11px] font-mono hidden md:inline">
            {isOnline ? 'ئۆنلاین' : 'ئۆفلاین'}
          </span>
        </div>

        {/* Desktop/Tablet Install App Button (Hidden on mobile < sm, available in bottom dock "زیاتر") */}
        <button
          type="button"
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('open-pwa-install'));
            }
          }}
          className="hidden sm:flex p-2 sm:px-3 sm:py-2 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800 hover:from-blue-100 hover:to-indigo-100 dark:hover:bg-slate-750 text-blue-800 dark:text-blue-300 border border-blue-200/80 dark:border-slate-700 shadow-xs items-center gap-1.5 transition cursor-pointer shrink-0"
          title="دابەزاندنی سیستەم وەک ئەپ بۆ سەر مۆبایل"
        >
          <Smartphone className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <span className="text-xs font-black hidden lg:inline">دابەزاندنی ئەپ</span>
        </button>

        {/* Dark / Light Mode Toggle Button */}
        <button
          type="button"
          onClick={() => onToggleTheme?.()}
          className={`p-1.5 sm:px-3 sm:py-2 rounded-xl sm:rounded-2xl border shadow-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
            currentTheme === 'dark'
              ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/40 ring-1 ring-amber-400/30'
              : 'bg-[#F1F3F7] hover:bg-slate-200 text-slate-700 border-slate-200/70'
          }`}
          title={
            currentTheme === 'dark'
              ? 'گۆڕین بۆ دۆخی ڕۆژ (Light Mode)'
              : 'گۆڕین بۆ دۆخی شەوانە (Dark Mode)'
          }
        >
          {currentTheme === 'dark' ? (
            <>
              <Sun className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
              <span className="text-xs font-bold hidden xl:inline text-amber-300">دۆخی ڕۆژ</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-indigo-600 shrink-0" />
              <span className="text-xs font-bold hidden xl:inline text-slate-700">دۆخی شەوانە</span>
            </>
          )}
        </button>

        {/* ======================================================== */}
        {/* INTERACTIVE NOTIFICATION BELL WITH FLOATING CENTER       */}
        {/* ======================================================== */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
            className={`relative p-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl transition shadow-xs flex items-center justify-center shrink-0 cursor-pointer ${
              isNotificationOpen
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'bg-[#F1F3F7] hover:bg-purple-50 text-slate-600 hover:text-purple-600 border border-slate-200/60 hover:border-purple-200'
            }`}
            title="ناوەندی ئاگادارییەکان"
          >
            <Bell className="w-4 h-4" />
            {isMounted && unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-[#8B5CF6] text-white font-mono font-bold text-[9px] flex items-center justify-center ring-2 ring-white animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Floating Notification Center Dropdown */}
          {isNotificationOpen && (
            <div
              className="absolute left-0 mt-3 w-80 sm:w-96 max-w-[calc(100vw-24px)] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-4 z-50 animate-fadeIn space-y-3 text-slate-800 dark:text-slate-100"
              dir="rtl"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">ناوەندی ئاگادارییەکان</h3>
                    <p className="text-[10px] text-slate-400 dark:text-slate-400">
                      {unreadCount > 0 ? `${unreadCount} ئاگاداری گرنگ پێویستیان بە سەرنجە` : 'هەموو کارەکان لەسەر ڕێچکەن'}
                    </p>
                  </div>
                </div>

                {unreadCount > 0 && (
                  <button
                    onClick={handleDismissAll}
                    className="text-[11px] font-bold text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-xl transition flex items-center gap-1"
                    title="سڕینەوەی هەمووی"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    هەموو پاکبکەرەوە
                  </button>
                )}
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 bg-slate-100/80 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold border border-transparent dark:border-slate-700">
                <button
                  onClick={() => setNotifTab('all')}
                  className={`flex-1 py-1 rounded-lg transition text-[11px] ${
                    notifTab === 'all'
                      ? 'bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  هەمووی ({activeNotifications.length})
                </button>
                <button
                  onClick={() => setNotifTab('loyalty')}
                  className={`flex-1 py-1 rounded-lg transition text-[11px] ${
                    notifTab === 'loyalty'
                      ? 'bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  لۆیەڵتی ({activeNotifications.filter((n) => n.type === 'loyalty' || n.type === 'inactivity').length})
                </button>
                <button
                  onClick={() => setNotifTab('stock')}
                  className={`flex-1 py-1 rounded-lg transition text-[11px] ${
                    notifTab === 'stock'
                      ? 'bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  کۆگا ({activeNotifications.filter((n) => n.type === 'stock').length})
                </button>
              </div>

              {/* Notification List */}
              <div className="max-h-80 overflow-y-auto space-y-2.5 pr-0.5">
                {filteredNotifications.length === 0 ? (
                  <div className="py-8 text-center space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-500 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-100 dark:border-emerald-800/60">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">هیچ ئاگادارییەکی نوێ نییە ✨</p>
                    <p className="text-[10px] text-slate-400">سیستەم لە دۆخێکی تەواو ئارام و بێ کێشەدایە.</p>
                  </div>
                ) : (
                  filteredNotifications.map((notif) => (
                    <div
                      key={notif.id}
                      className="p-3 rounded-2xl bg-slate-50/90 dark:bg-slate-800/80 hover:bg-slate-100/90 dark:hover:bg-slate-800 border border-slate-200/70 dark:border-slate-700 transition space-y-2 group relative"
                    >
                      {/* Top row: badge + dismiss */}
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${notif.badgeColor}`}
                        >
                          {notif.badge}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-400 font-mono">
                            {notif.timeText}
                          </span>
                          <button
                            onClick={() => handleDismissSingle(notif.id)}
                            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition"
                            title="لابردن"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Content */}
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                          {notif.title}
                        </h4>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                          {notif.description}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-1">
                        {notif.onWhatsApp && (
                          <button
                            onClick={notif.onWhatsApp}
                            className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            ناردنی واتسئاپ (WhatsApp)
                          </button>
                        )}
                        {notif.vehicle && onSelectVehicle && (
                          <button
                            onClick={() => {
                              onSelectVehicle(notif.vehicle!);
                              setIsNotificationOpen(false);
                            }}
                            className="py-1.5 px-3 bg-white dark:bg-purple-950/40 hover:bg-purple-50 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-xl text-[10px] font-bold transition flex items-center justify-center gap-1"
                          >
                            بینینی سەیارە
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar / User & Logout */}
        <div className="flex items-center gap-1.5 sm:gap-2 pr-1.5 sm:pr-2 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap shrink-0">
          <div
            className={`w-7 h-7 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl ${
              currentUser?.role === 'admin'
                ? 'bg-gradient-to-tr from-purple-600 to-indigo-600'
                : 'bg-gradient-to-tr from-blue-600 to-cyan-600'
            } text-white flex items-center justify-center text-[10px] sm:text-xs font-black shadow-xs shrink-0`}
          >
            {currentUser?.avatar || (currentUser?.role === 'admin' ? '👑' : 'CW')}
          </div>
          <div className="hidden sm:block text-right">
            <div className="text-xs font-extrabold text-slate-900 dark:text-slate-100 leading-tight">
              {currentUser?.name || (currentUser?.role === 'admin' ? 'بەڕێوەبەر' : 'کاشێر')}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              {currentUser?.role === 'admin' ? 'بەڕێوەبەر (Admin)' : 'کاشێر (Cashier)'}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Expandable Search Bar Overlay */}
      {isMobileSearchOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800 shadow-xl p-3 z-40 animate-fadeIn" dir="rtl">
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                autoFocus
                placeholder="گەڕان بەدوای تابلۆ، ناوی کڕیار، مۆدێل..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-slate-900 dark:text-white outline-none w-full text-xs font-bold"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-200">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={() => {
                setIsMobileSearchOpen(false);
                setSearchQuery('');
              }}
              className="px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl shrink-0"
            >
              داخستن
            </button>
          </div>

          {/* Mobile Search Results */}
          {rawQ.length > 0 && (
            <div className="mt-2.5 max-h-60 overflow-y-auto space-y-1 divide-y divide-slate-100 dark:divide-slate-800">
              {matchedVehicles.length === 0 ? (
                <div className="p-3 text-center text-xs text-slate-400">
                  هیچ سەیارەیەک نەدۆزرایەوە بەم ناو یان تابلۆیە!
                </div>
              ) : (
                matchedVehicles.map((v) => (
                  <div
                    key={v.id}
                    onClick={() => {
                      if (onSelectVehicle) onSelectVehicle(v);
                      setSearchQuery('');
                      setIsMobileSearchOpen(false);
                    }}
                    className="p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between transition gap-2"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">{v.ownerName}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        {v.carModel} • {v.color}
                      </div>
                    </div>
                    <PlateDisplay plate={v.plate} size="sm" />
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </header>
  );
};
