'use client';

import React, { useState, useMemo } from 'react';
import { SetupItem, Expense, Vehicle, StaffMember, ServiceItem, WashRecord, AppSettings } from '@/types';
import { TabKey, AnalyticsSectionKey } from '@/components/layout/Sidebar';
import { formatIQD, seedRealisticDemoData, normalizeDigits, isDateToday } from '@/lib/storage';
import { openWhatsAppChat, generateInactivityReminderMessage } from '@/lib/whatsapp';
import { PlateDisplay } from '@/components/ui/PlateDisplay';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  Car,
  Gift,
  Users,
  Wrench,
  Clock,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  CheckCircle2,
  Calendar,
  Award,
  Zap,
  Layers,
  Layers2,
  CalendarDays,
  CalendarRange,
  History,
  AlertTriangle,
  ArrowRight,
  UserCheck,
  ShieldCheck,
  Check,
  Phone,
  MessageCircle,
  FileText,
  Percent,
  Coins,
  CheckCircle,
  Building2,
  Droplets,
  Search,
  Filter,
  CheckSquare,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Eye,
  Crown,
  ExternalLink,
  Activity,
  BarChart3,
  ArrowLeft,
  Flame,
  CheckCheck,
  Gauge,
  Timer,
  RefreshCw,
  Monitor,
} from 'lucide-react';

interface AnalyticsDashboardProps {
  setupItems: SetupItem[];
  expenses: Expense[];
  vehicles: Vehicle[];
  staff: StaffMember[];
  services: ServiceItem[];
  settings?: AppSettings;
  activeSection?: AnalyticsSectionKey;
  onSectionChange?: (section: AnalyticsSectionKey) => void;
  onNavigateTab?: (tab: TabKey, subSection?: any) => void;
  onReloadData?: () => void;
  onNotify?: (msg: string) => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  setupItems,
  expenses,
  vehicles,
  staff,
  services,
  settings,
  activeSection: propActiveSection,
  onSectionChange,
  onNavigateTab,
  onReloadData,
  onNotify,
}) => {
  const [internalSection, setInternalSection] = useState<AnalyticsSectionKey>('overview');
  const activeSection = propActiveSection || internalSection;
  const setActiveSection = (s: AnalyticsSectionKey) => {
    if (onSectionChange) onSectionChange(s);
    setInternalSection(s);
  };

  const handleSeedDemoData = () => {
    const masterPin = settings?.adminPin || '9999';
    const enteredPin = prompt('⚠️ بۆ بارکردنی داتای نموونەیی دارایی، تکایە کۆدی نهێنی بەڕێوەبەر (Admin Master PIN) بنووسە:');
    if (enteredPin === null) return;

    if (normalizeDigits(enteredPin.trim()) !== normalizeDigits(masterPin.trim())) {
      alert('❌ کۆدی نهێنی بەڕێوەبەر هەڵەیە! بارکردنی داتای نموونەیی ڕەتکرایەوە.');
      return;
    }

    if (
      window.confirm(
        'ئایا بە تەواوی دڵنیایت لە بارکردنی داتای نموونەیی دارایی؟ هەموو سەیارە، خەرجی و مێژووی شۆردنی ٧ ڕۆژ بۆ تاقیکردنەوەی قازانج و زەرەر نوێ دەکرێنەوە.'
      )
    ) {
      seedRealisticDemoData();
      if (onReloadData) onReloadData();
      if (onNotify) onNotify('📊 داتای نموونەیی دارایی بە سەرکەوتوویی بارکرایەوە.');
    }
  };

  // Time Period Filter for Overview (Today, Week, Month, All-Time)
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'all'>('today');

  // Hovered day index for 7-day revenue bar chart
  const [hoveredDayIndex, setHoveredDayIndex] = useState<number | null>(null);

  // Overview Tab Switcher (bays, charts, crm)
  const [overviewTab, setOverviewTab] = useState<'bays' | 'charts' | 'crm'>('bays');

  // Dynamic Heatmap rows for peak traffic
  const dynamicHeatmapRows: { hour: string; cells: number[] }[] = [
    { hour: '09:00 AM', cells: [2, 3, 4, 3, 5, 4, 6] },
    { hour: '12:00 PM', cells: [4, 6, 7, 5, 8, 9, 8] },
    { hour: '03:00 PM', cells: [5, 7, 8, 6, 9, 11, 10] },
    { hour: '06:00 PM', cells: [6, 8, 9, 7, 10, 12, 11] },
    { hour: '09:00 PM', cells: [3, 4, 5, 4, 6, 8, 7] },
  ];

  // Search in Expense Archive
  const [expenseSearch, setExpenseSearch] = useState('');
  const [expenseFilterCategory, setExpenseFilterCategory] = useState<string>('all');

  // -------------------------------------------------------------
  // 1. Core Financial Calculations (Zero NaN Guarantee)
  // -------------------------------------------------------------
  const totalSetupCapEx = setupItems.reduce((sum, item: any) => {
    const cost = Number(item.cost ?? item.actualCost ?? item.estimatedCost ?? 0) || 0;
    const qty = Number(item.quantity) || 1;
    return sum + cost * qty;
  }, 0);

  const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // Flatten all wash records with vehicle context
  const allWashRecords: (WashRecord & {
    carModel?: string;
    ownerName?: string;
    phone?: string;
    color?: string;
    plate?: any;
  })[] = [];
  let totalWashRevenue = 0;
  let totalWashesCount = 0;
  let freeWashesCount = 0;

  vehicles.forEach((v) => {
    (v.washHistory || []).forEach((w) => {
      const price = Number(w.price) || 0;
      totalWashRevenue += price;
      totalWashesCount++;
      if (w.isFree) freeWashesCount++;

      allWashRecords.push({
        ...w,
        price,
        carModel: v.carModel,
        ownerName: v.ownerName,
        phone: v.phone,
        color: v.color,
        plate: v.plate,
      });
    });
  });

  const netOperationalProfit = totalWashRevenue - totalExpenses;

  // -------------------------------------------------------------
  // 2. Time-Based Filtering (Today, Month, Year & Archive Selection)
  // -------------------------------------------------------------
  const now = new Date();
  const localYear = now.getFullYear();
  const localMonth = String(now.getMonth() + 1).padStart(2, '0');
  const localDay = String(now.getDate()).padStart(2, '0');
  const todayStr = `${localYear}-${localMonth}-${localDay}`;
  const thisMonthStr = `${localYear}-${localMonth}`;
  const thisYearStr = String(localYear);

  // Archive & 7-Day Navigation States
  const [selectedArchiveDate, setSelectedArchiveDate] = useState<string>(todayStr);
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [archiveFilterTab, setArchiveFilterTab] = useState<'washes' | 'expenses'>('washes');

  const formatWashTime = (dateStr?: string) => {
    if (!dateStr) return '--:--';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
      return '--:--';
    }
  };

  const isDateToday = (dStr?: string) => {
    if (!dStr) return false;
    if (dStr.startsWith(todayStr)) return true;
    try {
      const d = new Date(dStr);
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
      );
    } catch {
      return false;
    }
  };

  // Today
  const todayWashes = allWashRecords.filter((w) => isDateToday(w.date));
  const todayRevenue = todayWashes.reduce((sum, w) => sum + w.price, 0);
  const todayWashCount = todayWashes.length;
  const todayFreeCount = todayWashes.filter((w) => w.isFree).length;

  // Month
  const monthWashes = allWashRecords.filter((w) => w.date && w.date.startsWith(thisMonthStr));
  const monthRevenue = monthWashes.reduce((sum, w) => sum + w.price, 0);
  const monthWashCount = monthWashes.length;
  const monthExpenses = expenses
    .filter((e) => e.date && e.date.startsWith(thisMonthStr))
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const monthProfit = monthRevenue - monthExpenses;
  const monthProfitMargin =
    monthRevenue > 0 ? Math.round((monthProfit / monthRevenue) * 100) : 0;

  // Year
  const yearWashes = allWashRecords.filter((w) => w.date && w.date.startsWith(thisYearStr));
  const yearRevenue = yearWashes.reduce((sum, w) => sum + w.price, 0);
  const yearWashCount = yearWashes.length;
  const yearExpenses = expenses
    .filter((e) => e.date && e.date.startsWith(thisYearStr))
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const yearProfit = yearRevenue - yearExpenses;

  // -------------------------------------------------------------
  // 3. Dynamic Cost Configuration & Rent Separation (یاسای جیاکردنەوەی کرێی شوێن)
  // -------------------------------------------------------------
  // Load dynamic values from settings with safe fallbacks
  const monthlyRent = Number(settings?.monthlyRent) || 600000;
  const dailyRent = Math.round(monthlyRent / 30); // ~20,000 IQD
  const dailyUtilities = Number(settings?.dailyUtilities) || 12000; // Water, electricity, generator
  const averageMaterialCostPerWash = Number(settings?.averageMaterialCostPerWash) || 1500;

  // Active staff salaries
  const activeStaff = staff.filter((s) => (s.status || 'active') === 'active');
  const totalMonthlyBaseStaffSalaries = activeStaff.reduce(
    (sum, s) => sum + (s.salaryType === 'monthly' ? Number(s.baseSalary) || 0 : (Number(s.baseSalary) || 0) * 30),
    0
  );
  const dailyStaffLabor = Math.round(totalMonthlyBaseStaffSalaries / 30); // ~40,000 IQD
  const dailyStaffAndUtilities = dailyStaffLabor + dailyUtilities; // ~52,000 IQD (کارمەند + ئاو و کارەبا)
  const dailyCapExAmortization = Math.round(totalSetupCapEx / 365); // e.g. ~22,137 IQD / day (ئامێرەکان)

  const referenceMonthlyCost =
    monthExpenses > 0
      ? monthExpenses
      : totalExpenses || monthlyRent + totalMonthlyBaseStaffSalaries + dailyUtilities * 30;
  const dailyOperatingCost = dailyRent + dailyStaffAndUtilities; // Total operational baseline

  // -------------------------------------------------------------
  // 4. 7-Day Weekly Matrix (جیاکردنەوەی کرێی شوێن لە خشتەی ٧ ڕۆژەکەدا)
  // -------------------------------------------------------------
  const dayNamesKu = ['یەکشەممە', 'دووشەممە', 'سێشەممە', 'چوارشەممە', 'پێنجشەممە', 'هەینی', 'شەممە'];
  const weeklyDaysData: any[] = [];

  for (let i = 6; i >= 0; i--) {
    const daysAgo = weekOffset * 7 + i;
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    const dYear = d.getFullYear();
    const dMonth = String(d.getMonth() + 1).padStart(2, '0');
    const dDay = String(d.getDate()).padStart(2, '0');
    const dateStr = `${dYear}-${dMonth}-${dDay}`;
    const dayOfWeek = d.getDay(); // 0 is Sunday, 6 is Saturday
    const dayNameKu = dayNamesKu[dayOfWeek];

    const dayWashes = allWashRecords.filter((w) => w.date && w.date.startsWith(dateStr));
    const dayRevenue = dayWashes.reduce((sum, w) => sum + w.price, 0);
    const dayWashCount = dayWashes.length;

    // 1. Rent Deduction (جیاکراوە لە هەموو خەرجی تر)
    const isRentCovered = dayRevenue >= dailyRent;
    const remAfterRent = dayRevenue - dailyRent;

    // 2. Staff & Utilities Deduction
    const isStaffCovered = remAfterRent >= dailyStaffAndUtilities;
    const remAfterStaff = remAfterRent - dailyStaffAndUtilities;

    // 3. Materials Consumables Deduction
    const dayMaterialCost = Math.max(10000, dayWashCount * averageMaterialCostPerWash);
    const isMaterialsCovered = remAfterStaff >= dayMaterialCost;
    const remAfterMaterials = remAfterStaff - dayMaterialCost;

    // 4. Equipment CapEx Amortization
    const isCapExCovered = remAfterMaterials >= dailyCapExAmortization;
    const netDay = remAfterMaterials - dailyCapExAmortization;

    weeklyDaysData.push({
      dateStr,
      dayNameKu,
      isToday: dateStr === todayStr,
      isSelected: dateStr === selectedArchiveDate,
      revenue: dayRevenue,
      washCount: dayWashCount,
      rentCost: dailyRent,
      staffAndUtilitiesCost: dailyStaffAndUtilities,
      materialCost: dayMaterialCost,
      capExCost: dailyCapExAmortization,
      isRentCovered,
      isStaffCovered,
      isMaterialsCovered,
      isCapExCovered,
      netProfit: netDay,
      isProfitable: netDay >= 0,
    });
  }

  // -------------------------------------------------------------
  // Selected Archive Day Deep Dive Calculations (جیاکردنەوەی تەواوی کرێ)
  // -------------------------------------------------------------
  const selectedDayWashes = allWashRecords.filter(
    (w) => w.date && w.date.startsWith(selectedArchiveDate)
  );
  const selectedDayRevenue = selectedDayWashes.reduce((sum, w) => sum + w.price, 0);
  const selectedDayWashCount = selectedDayWashes.length;

  const selectedDayExpenses = expenses.filter(
    (e) => e.date && e.date.startsWith(selectedArchiveDate)
  );
  const selectedDayExpensesTotal = selectedDayExpenses.reduce(
    (sum, e) => sum + (Number(e.amount) || 0),
    0
  );

  const selectedDateObj = new Date(selectedArchiveDate + 'T12:00:00');
  const selectedDayNameKu = !isNaN(selectedDateObj.getTime())
    ? dayNamesKu[selectedDateObj.getDay()]
    : 'ڕۆژی نادیار';
  const isSelectedDateToday = selectedArchiveDate === todayStr;

  // Stage 1: Rent (تەنها کرێی شوێن بە جیا)
  const isSelectedRentCovered = selectedDayRevenue >= dailyRent;
  const selectedRentPaid = Math.min(selectedDayRevenue, dailyRent);
  const selectedRemAfterRent = selectedDayRevenue - dailyRent;

  // Stage 2: Staff & Utilities (مووچەی کارمەند + ئاو و کارەبا)
  const isSelectedStaffCovered = selectedRemAfterRent >= dailyStaffAndUtilities;
  const selectedStaffPaid =
    selectedRemAfterRent > 0 ? Math.min(selectedRemAfterRent, dailyStaffAndUtilities) : 0;
  const selectedRemAfterStaff = selectedRemAfterRent - dailyStaffAndUtilities;

  // Stage 3: Materials & Polish (مەواد و شامپۆ)
  const selectedDayMaterialCost = Math.max(10000, selectedDayWashCount * averageMaterialCostPerWash);
  const isSelectedMaterialsCovered = selectedRemAfterStaff >= selectedDayMaterialCost;
  const selectedMaterialsPaid =
    selectedRemAfterStaff > 0 ? Math.min(selectedRemAfterStaff, selectedDayMaterialCost) : 0;
  const selectedRemAfterMaterials = selectedRemAfterStaff - selectedDayMaterialCost;

  // Stage 4: CapEx Amortization (ئامێرەکان)
  const isSelectedCapExCovered = selectedRemAfterMaterials >= dailyCapExAmortization;
  const selectedCapExPaid =
    selectedRemAfterMaterials > 0 ? Math.min(selectedRemAfterMaterials, dailyCapExAmortization) : 0;
  const selectedPureNetProfit = selectedRemAfterMaterials - dailyCapExAmortization;

  // -------------------------------------------------------------
  // 5. Break-Even Calculations & Equivalence Targets (Dynamic Prices)
  // -------------------------------------------------------------
  const standardWashService = services.find(
    (s) => s.name.includes('سەرەکی') || s.name.includes('شۆردن')
  );
  const polishService = services.find((s) => s.name.includes('پۆڵیش') || s.name.includes('واکس'));
  const carpetService = services.find((s) => s.name.includes('ڕاخەر') || s.name.includes('فەرش'));
  const sofaService = services.find((s) => s.name.includes('قەنەفە'));

  const averageWashPrice = standardWashService?.price || 10000;
  const averageCarpetPricePerM2 = carpetService?.price || 2500;
  const averageSofaSetPrice = sofaService?.price || 40000;
  const averagePolishPrice = polishService?.price || 45000;

  const carsNeededDaily = Math.max(1, Math.ceil(dailyOperatingCost / averageWashPrice));
  const carpetM2NeededDaily = Math.max(1, Math.ceil(dailyOperatingCost / averageCarpetPricePerM2));
  const sofaSetsNeededDaily = Math.max(1, Math.round((dailyOperatingCost / averageSofaSetPrice) * 10) / 10);
  const polishesNeededDaily = Math.max(1, Math.round((dailyOperatingCost / averagePolishPrice) * 10) / 10);

  const todayProgressPercent = Math.min(
    100,
    Math.round((todayRevenue / (dailyOperatingCost || 1)) * 100)
  );
  const isTodayBreakEvenReached = todayRevenue >= dailyOperatingCost;
  const remainingRevenueToBreakEven = Math.max(0, dailyOperatingCost - todayRevenue);
  const remainingCarsToBreakEven = Math.ceil(remainingRevenueToBreakEven / averageWashPrice);

  // -------------------------------------------------------------
  // 6. Offers & Loyalty Calculations
  // -------------------------------------------------------------
  const totalFreeOffersValueIQD = freeWashesCount * averageWashPrice;
  const vehiclesNearFree = vehicles.filter((v) => v.currentCycleWashes === 4);
  const repeatCustomersCount = vehicles.filter((v) => (v.washHistory || []).length > 1).length;
  const retentionRate =
    vehicles.length > 0 ? Math.round((repeatCustomersCount / vehicles.length) * 100) : 0;

  // -------------------------------------------------------------
  // 7. Multi-Service Breakdown (سەیارە، فەرش، قەنەفە، پۆڵیش)
  // -------------------------------------------------------------
  const serviceRevenueMap: {
    [name: string]: { count: number; revenue: number; category?: string };
  } = {};

  allWashRecords.forEach((w) => {
    const sName = w.serviceName || 'شۆردنی ئاسایی';
    if (!serviceRevenueMap[sName]) {
      const matchSrv = services.find((s) => s.name === sName);
      serviceRevenueMap[sName] = { count: 0, revenue: 0, category: matchSrv?.category || 'سەیارە' };
    }
    serviceRevenueMap[sName].count++;
    serviceRevenueMap[sName].revenue += w.price;
  });

  // -------------------------------------------------------------
  // 8. Expenses by Category & 3 Tiers
  // -------------------------------------------------------------
  const expenseCategoryMap: { [cat: string]: number } = {};
  expenses.forEach((e) => {
    expenseCategoryMap[e.category] =
      (expenseCategoryMap[e.category] || 0) + (Number(e.amount) || 0);
  });

  // Filtered expenses for archive
  const filteredExpensesList = expenses.filter((e) => {
    const matchSearch =
      !expenseSearch ||
      e.title.toLowerCase().includes(expenseSearch.toLowerCase()) ||
      e.category.toLowerCase().includes(expenseSearch.toLowerCase()) ||
      (e.notes && e.notes.toLowerCase().includes(expenseSearch.toLowerCase()));
    const matchCat = expenseFilterCategory === 'all' || e.category === expenseFilterCategory;
    return matchSearch && matchCat;
  });

  // -------------------------------------------------------------
  // 9. Staff Performance Summary
  // -------------------------------------------------------------
  const staffPerformanceMap: {
    [staffName: string]: { count: number; revenue: number; commission: number };
  } = {};
  allWashRecords.forEach((w) => {
    const stName = w.staffName || 'وەستای گشتی';
    if (!staffPerformanceMap[stName]) {
      staffPerformanceMap[stName] = { count: 0, revenue: 0, commission: 0 };
    }
    staffPerformanceMap[stName].count++;
    staffPerformanceMap[stName].revenue += w.price;
    staffPerformanceMap[stName].commission += (w.workerCommission || 0);
  });

  // CapEx Recovery Progress
  const capexRecoveryPercent =
    totalSetupCapEx > 0
      ? Math.min(100, Math.round((Math.max(0, netOperationalProfit) / totalSetupCapEx) * 100))
      : 0;

  // -------------------------------------------------------------
  // 10. Executive Dynamic Calculations (Top Car Wash POS Standard)
  // -------------------------------------------------------------
  const activeCarsInBay = vehicles.filter((v) => Boolean(v.currentBay)).length;

  const periodWashes = useMemo(() => {
    if (selectedPeriod === 'today') {
      return allWashRecords.filter((w) => isDateToday(w.date));
    }
    if (selectedPeriod === 'week') {
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      return allWashRecords.filter((w) => {
        if (!w.date) return false;
        return new Date(w.date).getTime() >= sevenDaysAgo;
      });
    }
    if (selectedPeriod === 'month') {
      return allWashRecords.filter((w) => w.date && w.date.startsWith(thisMonthStr));
    }
    return allWashRecords;
  }, [allWashRecords, selectedPeriod, todayStr, thisMonthStr]);

  const estimatedDays =
    selectedPeriod === 'today'
      ? 1
      : selectedPeriod === 'week'
      ? 7
      : selectedPeriod === 'month'
      ? 30
      : Math.max(30, Math.ceil((Date.now() - new Date('2026-10-01').getTime()) / (1000 * 60 * 60 * 24)));

  const periodExpenses = useMemo(() => {
    if (selectedPeriod === 'today') {
      return expenses.filter((e) => isDateToday(e.date));
    }
    if (selectedPeriod === 'week') {
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      return expenses.filter((e) => {
        if (!e.date) return false;
        return new Date(e.date).getTime() >= sevenDaysAgo;
      });
    }
    if (selectedPeriod === 'month') {
      return expenses.filter((e) => e.date && e.date.startsWith(thisMonthStr));
    }
    return expenses;
  }, [expenses, selectedPeriod, todayStr, thisMonthStr]);

  const periodRevenue = periodWashes.reduce((sum, w) => sum + (Number(w.price) || 0), 0);
  const periodWashCount = periodWashes.length;
  const periodFreeCount = periodWashes.filter((w) => w.isFree).length;
  const periodExpensesTotal = periodExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // Amortized Operational Overhead vs Lumpsum Expenses
  const effectivePeriodExpenses = useMemo(() => {
    if (selectedPeriod === 'today') {
      // Direct petty cash/materials for today + daily prorated share of monthly rent and fixed overhead
      let directToday = 0;
      let proratedRent = 0;
      expenses.forEach((e) => {
        const amt = Number(e.amount) || 0;
        if (e.category === 'کرێی شوێن' || amt >= 1000000) {
          proratedRent += Math.round(amt / 30);
        } else if (isDateToday(e.date)) {
          directToday += amt;
        }
      });
      const todayTotal = directToday + (proratedRent > 0 ? proratedRent : dailyRent) + dailyStaffAndUtilities;
      return Math.max(todayTotal, Math.round(dailyOperatingCost * 0.5));
    }

    if (selectedPeriod === 'week') {
      let weeklyDirect = 0;
      let proratedRent = 0;
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      expenses.forEach((e) => {
        const amt = Number(e.amount) || 0;
        if (e.category === 'کرێی شوێن' || amt >= 1000000) {
          proratedRent += Math.round((amt / 30) * 7);
        } else if (e.date && new Date(e.date).getTime() >= sevenDaysAgo) {
          weeklyDirect += amt;
        }
      });
      const weekTotal = weeklyDirect + (proratedRent > 0 ? proratedRent : dailyRent * 7) + (dailyStaffAndUtilities * 7);
      return Math.max(weekTotal, Math.round(dailyOperatingCost * 7 * 0.5));
    }

    if (selectedPeriod === 'month') {
      const mExpenses = expenses
        .filter((e) => e.date && e.date.startsWith(thisMonthStr))
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
      return mExpenses > 0 ? mExpenses : Math.round(dailyOperatingCost * 30);
    }

    return periodExpensesTotal > 0 ? periodExpensesTotal : Math.round(dailyOperatingCost * estimatedDays);
  }, [selectedPeriod, expenses, todayStr, thisMonthStr, periodExpensesTotal, dailyRent, dailyStaffAndUtilities, dailyOperatingCost, estimatedDays]);

  const periodNetProfit = periodRevenue - effectivePeriodExpenses;
  const periodMargin = periodRevenue > 0 ? Math.round((periodNetProfit / periodRevenue) * 100) : 0;

  // Average Ticket Value (ATV) - Core Washify / DRB Metric
  const averageTicketValue =
    periodWashCount > 0 ? Math.round(periodRevenue / periodWashCount) : standardWashService?.price || 10000;

  // Upsell Attach Rate (% of washes that contain premium services: VIP, Polish, Carpet, Sofa)
  const upsellWashesCount = periodWashes.filter((w) => {
    const sName = (w.serviceName || '').toLowerCase();
    return (
      sName.includes('vip') ||
      sName.includes('پۆڵیش') ||
      sName.includes('واکس') ||
      sName.includes('نانۆ') ||
      sName.includes('فەرش') ||
      sName.includes('قەنەفە')
    );
  }).length;
  const upsellRatePercent =
    periodWashCount > 0 ? Math.round((upsellWashesCount / periodWashCount) * 100) : 32;

  // At-Risk Inactive Customers (Rinsed CRM standard - 15+ days inactive)
  const atRiskCustomers = useMemo(() => {
    return vehicles
      .filter((v) => {
        const lastDate = v.lastVisitDate || v.registeredDate;
        if (!lastDate) return false;
        const diffDays = Math.floor((Date.now() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24));
        return diffDays >= (settings?.expiryDaysLimit || 15);
      })
      .sort((a, b) => (b.totalWashes || 0) - (a.totalWashes || 0))
      .slice(0, 3);
  }, [vehicles, settings]);

  const handleWhatsAppAtRisk = (v: Vehicle) => {
    const lastDate = v.lastVisitDate || v.registeredDate;
    const diffDays = lastDate
      ? Math.floor((Date.now() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24))
      : 18;
    const msg = generateInactivityReminderMessage(v, settings || ({} as any), diffDays);
    openWhatsAppChat(v.phone, msg);
  };

  // -------------------------------------------------------------
  // Executive Dashboard Data (Recent Activity, Mix & Dynamic Chart)
  // -------------------------------------------------------------
  const recentWashes = useMemo(() => {
    return [...allWashRecords]
      .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
      .slice(0, 6);
  }, [allWashRecords]);

  const topServicesList = useMemo(() => {
    const map: Record<string, { name: string; count: number; revenue: number; category: string }> = {};
    periodWashes.forEach((w) => {
      const sName = w.serviceName || 'شۆردنی سەرەکی';
      if (!map[sName]) {
        const matchSrv = services.find((s) => s.name === sName);
        map[sName] = {
          name: sName,
          count: 0,
          revenue: 0,
          category: matchSrv?.category || 'سەیارە',
        };
      }
      map[sName].count++;
      map[sName].revenue += Number(w.price) || 0;
    });

    const list = Object.values(map).sort((a, b) => b.revenue - a.revenue);
    if (list.length === 0) {
      return services.slice(0, 5).map((s) => ({
        name: s.name,
        count: 0,
        revenue: 0,
        category: s.category || 'سەیارە',
        percent: 0,
      }));
    }
    const totalRev = list.reduce((sum, item) => sum + item.revenue, 0) || 1;
    return list.slice(0, 5).map((item) => ({
      ...item,
      percent: Math.round((item.revenue / totalRev) * 100),
    }));
  }, [periodWashes, services]);

  const weeklyRevenueTotal = weeklyDaysData.reduce((sum, d) => sum + (d.revenue || 0), 0);
  const weeklyWashesTotal = weeklyDaysData.reduce((sum, d) => sum + (d.washCount || 0), 0);
  const maxDailyRevenue = Math.max(...weeklyDaysData.map((d) => d.revenue || 0), 40000);

  // Metadata for the active sub-section
  const sectionMeta: Record<
    AnalyticsSectionKey,
    { title: string; subtitle: string; icon: any; color: string }
  > = {
    periods: {
      title: 'قازانجی کاتی: شیکاری ٣ هەنگاوەکە و جیاکردنەوەی هەر ٧ ڕۆژەکە',
      subtitle: 'گەیشتن بە قازانج بە ٣ هەنگاو (کرێ و کارمەند، مەواد، ئامێرەکان) لەگەڵ جیاکردنەوەی شەممە تا هەینی بە بەروار.',
      icon: CalendarDays,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    },
    breakeven: {
      title: 'خاڵی زەرەر نەکردن (Break-Even) و تارگێتی کارکردن',
      subtitle: 'ژمێرەری ڕۆژانە کە دەبێت چەند کار بکرێت بۆ دابینکردنی تەواوی خەرجییەکان تاوەکو غەسلەکە زیان نەکات.',
      icon: Target,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    },
    offers: {
      title: 'شیکاری دارایی ئۆفەرەکان و وەفاداری کڕیار (Loyalty ROI)',
      subtitle: 'بەهای دارایی شۆردنی بێبەرامبەر بە دینار و لیستی کڕیارە نزیکەکان لە دیاری لەگەڵ ناردنی نامەی WhatsApp.',
      icon: Gift,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    },
    services: {
      title: 'داهاتی بەشەکان: سەیارە، فەرش، قەنەفە، پۆڵیش و نانۆ',
      subtitle: 'پۆلێنکردنی داهاتی هەریەک لە خزمەتگوزارییەکان بە جیا بە ڕێژەی سەدی و ژمارەی کار.',
      icon: Layers,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
    },
    expenses: {
      title: 'ئەرشیفی خەرجی و داهات: چەند پارە هاتووە و چۆن سەرف کراوە',
      subtitle: 'دەفتەری تەواوی کاش و پسوولەکانی خەرجی بەپێی ٣ هەنگاوەکە و بە بەروار و کاتی دروست.',
      icon: PieChart,
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
    },
    staff: {
      title: 'بەرهەمی وەستاکان، کاتی دەوام و مووچەی شایستەی پوخت',
      subtitle: 'بەرهەمی هەر وەستایەک بەپێی ژمارەی شۆردن، داهات، مووچەی بنەڕەتی، ڕۆژانی نەهاتوو و لێبڕینەکان.',
      icon: Users,
      color: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
    },
    overview: {
      title: 'داشبۆردی سەرکردایەتی غەسل (Executive Command Dashboard)',
      subtitle: 'چاودێری ڕاستەوخۆی کار، ئامارە داراییەکان و جووڵەی کڕیاران بەپێی ستانداردە لوتکەکانی جیهان (Washify / DRB System)',
      icon: Sparkles,
      color: 'text-lime-400 bg-lime-500/10 border-lime-500/30',
    },
  };

  const currentMeta = sectionMeta[activeSection] || sectionMeta.overview;
  const SectionIcon = currentMeta.icon;

  return (
    <div className="space-y-6 select-none" dir="rtl">
      {/* ============================================================= */}
      {/* UNIFIED EXECUTIVE COMMAND BAR & SUB-NAV TABS                  */}
      {/* ============================================================= */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <Sparkles className="w-6 h-6 text-yellow-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  داشبۆردی بەڕێوەبردن (Executive Dashboard)
                </h2>
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                پوختەی دارایی، قازانجی پوخت، ڕەوتی شۆردن و وەفاداری کڕیاران بەپێی ستانداردەکانی Stripe و Linear
              </p>
            </div>
          </div>

          {/* Controls: Time Period Filter Pills + Demo Data Button */}
          <div className="flex items-center gap-2 flex-wrap self-start lg:self-center">
            {/* Time Period Filter Pills (Stripe Style) */}
            <div className="flex items-center gap-1.5 bg-[#F1F3F7] dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-700 shadow-xs">
              {[
                { id: 'today', label: 'ئەمڕۆ (Today)' },
                { id: 'week', label: '٧ ڕۆژ (Week)' },
                { id: 'month', label: 'ئەم مانگە (Month)' },
                { id: 'all', label: 'سەرجەم (All-Time)' },
              ].map((p) => {
                const isSelected = selectedPeriod === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPeriod(p.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm border border-slate-200/80 dark:border-slate-600'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/60'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            {/* Seed Demo Data Button */}
            <button
              type="button"
              onClick={handleSeedDemoData}
              className="px-3.5 py-2 rounded-2xl text-xs font-bold bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/90 dark:border-indigo-800/60 transition-all flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer"
              title="بارکردن یان نوێکردنەوەی داتای نموونەیی دارایی بۆ تاقیکردنەوەی قازانج و زەرەر"
            >
              <RotateCcw className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>داتای نموونەیی دارایی</span>
            </button>
          </div>
        </div>

        {/* Sub-Section Navigation Pills - 3 Core Focused Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-2 border-t border-slate-100 dark:border-slate-800 scrollbar-none text-xs">
          {[
            { id: 'overview', label: 'داشبۆردی سەرەکی (Overview)', icon: Sparkles },
            { id: 'breakeven', label: 'خاڵی زەرەر نەکردن (Break-Even)', icon: Target },
            { id: 'periods', label: 'شیکاری دارایی و کرێ (Profit Funnel)', icon: CalendarDays },
          ].map((tab) => {
            const isActive = activeSection === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSection(tab.id as AnalyticsSectionKey)}
                className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/20'
                    : 'bg-[#F8FAFC] dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ============================================================= */}
      {/* SECTION 1: PERIODS (3-STEP PROFIT FUNNEL & 7-DAY MATRIX)      */}
      {/* ============================================================= */}
      {activeSection === 'periods' && (
        <div className="space-y-6 animate-fade-in" dir="rtl">
          {/* THE 4-STAGE PROFIT FUNNEL (جیاکردنەوەی تەواوی کرێی شوێن تا گەیشتن بە قازانج) */}
          <div className="bg-white dark:bg-slate-900 border border-amber-200/90 dark:border-amber-900/50 rounded-3xl p-6 shadow-xs space-y-5 relative overflow-hidden text-slate-900 dark:text-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <Coins className="w-5 h-5 text-amber-500" />
                    سیستەمی دارایی قازانج (بە جیاکردنەوەی تەواوی کرێی شوێن):
                  </h4>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                      isSelectedDateToday
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/60'
                        : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
                    }`}
                  >
                    {isSelectedDateToday ? 'ئەمڕۆ (داتای ڕاستەوخۆ)' : `ئەرشیفی: ${selectedDayNameKu} (${selectedArchiveDate})`}
                  </span>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-mono">
                    کرێی مانگانە لە ڕێکخستن: {formatIQD(monthlyRent)}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  سەرەتا کرێی شوێن بە تەواوی لە خەرجی تر جیا دەکرێتەوە، دواتر مووچەی کارمەندان و وزە، پاشان مەواد، دواتر ئامێرەکان، پاشان قازانجی خاوێن.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {!isSelectedDateToday && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedArchiveDate(todayStr);
                      setWeekOffset(0);
                    }}
                    className="p-2 px-3 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    گەڕانەوە بۆ ئەمڕۆ
                  </button>
                )}

                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-left">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-bold">
                    داهاتی {isSelectedDateToday ? 'ئەمڕۆ' : selectedDayNameKu}:
                  </span>
                  <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    {formatIQD(selectedDayRevenue)}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-sans">
                    ({selectedDayWashCount} شۆردن)
                  </span>
                </div>
              </div>
            </div>

            {/* The 4 Stages Visual Flow (Rent is 100% Separated) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* Stage 1: RENT ISOLATED */}
              <div
                className={`p-4 rounded-2xl border transition-all space-y-3 relative overflow-hidden ${
                  isSelectedRentCovered
                    ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800/60 ring-1 ring-amber-300/40 shadow-xs'
                    : 'bg-slate-50/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black px-2.5 py-1 rounded-lg bg-amber-500 text-white shadow-xs flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5" />
                    قۆناغی ١ (کرێی شوێن - جیاکراوە)
                  </span>
                  {isSelectedRentCovered && (
                    <span className="text-xs text-amber-700 dark:text-amber-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      داپۆشرا
                    </span>
                  )}
                </div>

                <div>
                  <h5 className="font-bold text-slate-900 dark:text-white text-xs">کرێی شوێنی غەسل (موڵک)</h5>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    مانگانە: {formatIQD(monthlyRent)} (ڕۆژانە: {formatIQD(dailyRent)})
                  </p>
                </div>

                <div className="space-y-1.5 text-xs pt-1 border-t border-slate-200/80 dark:border-slate-700">
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>پشکی کرێی ڕۆژ:</span>
                    <strong className="text-amber-700 dark:text-amber-400 font-mono">{formatIQD(dailyRent)}</strong>
                  </div>
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>داهاتی وەرگیراو:</span>
                    <strong className="text-slate-900 dark:text-white font-mono">{formatIQD(selectedDayRevenue)}</strong>
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] flex justify-between shadow-2xs">
                  <span className="text-slate-500 dark:text-slate-400">دۆخی دانەوەی کرێ:</span>
                  <span
                    className={`font-bold font-mono ${
                      isSelectedRentCovered ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'
                    }`}
                  >
                    {isSelectedRentCovered
                      ? 'کرێ درایەوە ✓ (١٠٠٪)'
                      : `${formatIQD(dailyRent - selectedDayRevenue)} ماوە تا کرێ پڕ بێتەوە`}
                  </span>
                </div>
              </div>

              {/* Stage 2: Staff & Utilities */}
              <div
                className={`p-4 rounded-2xl border transition-all space-y-3 relative overflow-hidden ${
                  isSelectedStaffCovered
                    ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800/60 ring-1 ring-blue-300/40 shadow-xs'
                    : 'bg-slate-50/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black px-2.5 py-1 rounded-lg bg-blue-600 text-white shadow-xs flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    قۆناغی ٢ (کارمەند و وزە)
                  </span>
                  {isSelectedStaffCovered && (
                    <span className="text-xs text-blue-700 dark:text-blue-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      داپۆشرا
                    </span>
                  )}
                </div>

                <div>
                  <h5 className="font-bold text-slate-900 dark:text-white text-xs">مووچەی کارمەند + ئاو و کارەبا</h5>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    وەستاکان ({formatIQD(dailyStaffLabor)}) + وزە ({formatIQD(dailyUtilities)})
                  </p>
                </div>

                <div className="space-y-1.5 text-xs pt-1 border-t border-slate-200/80 dark:border-slate-700">
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>تێچووی ڕۆژ:</span>
                    <strong className="text-blue-700 dark:text-blue-400 font-mono">{formatIQD(dailyStaffAndUtilities)}</strong>
                  </div>
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>پارەی ماوە لە دوای کرێ:</span>
                    <strong className="text-slate-900 dark:text-white font-mono">{formatIQD(Math.max(0, selectedRemAfterRent))}</strong>
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] flex justify-between shadow-2xs">
                  <span className="text-slate-500 dark:text-slate-400">دۆخی کارمەند و وزە:</span>
                  <span
                    className={`font-bold font-mono ${
                      isSelectedStaffCovered ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {isSelectedStaffCovered
                      ? 'کارمەند و وزە درایەوە ✓'
                      : selectedRemAfterRent > 0
                      ? `${formatIQD(dailyStaffAndUtilities - selectedRemAfterRent)} ماوە`
                      : 'چاوەڕوانی دانەوەی کرێ'}
                  </span>
                </div>
              </div>

              {/* Stage 3: Consumables & Polish Materials */}
              <div
                className={`p-4 rounded-2xl border transition-all space-y-3 relative overflow-hidden ${
                  isSelectedMaterialsCovered
                    ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800/60 ring-1 ring-indigo-300/40 shadow-xs'
                    : 'bg-slate-50/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black px-2.5 py-1 rounded-lg bg-indigo-600 text-white shadow-xs flex items-center gap-1">
                    <Droplets className="w-3.5 h-3.5" />
                    قۆناغی ٣ (مەواد و شامپۆ)
                  </span>
                  {isSelectedMaterialsCovered && (
                    <span className="text-xs text-indigo-700 dark:text-indigo-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      داپۆشرا
                    </span>
                  )}
                </div>

                <div>
                  <h5 className="font-bold text-slate-900 dark:text-white text-xs">شامپۆ، کەف، واکس و پۆڵیش</h5>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    تێکڕا بۆ هەر سەیارەیەک: ~{formatIQD(averageMaterialCostPerWash)}
                  </p>
                </div>

                <div className="space-y-1.5 text-xs pt-1 border-t border-slate-200/80 dark:border-slate-700">
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>تێچووی مەوادی ڕۆژ:</span>
                    <strong className="text-indigo-700 dark:text-indigo-400 font-mono">{formatIQD(selectedDayMaterialCost)}</strong>
                  </div>
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>پارەی ماوە لە قۆناغی ٢:</span>
                    <strong className="text-slate-900 dark:text-white font-mono">{formatIQD(Math.max(0, selectedRemAfterStaff))}</strong>
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] flex justify-between shadow-2xs">
                  <span className="text-slate-500 dark:text-slate-400">دۆخی مەواد:</span>
                  <span
                    className={`font-bold font-mono ${
                      isSelectedMaterialsCovered ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {isSelectedMaterialsCovered
                      ? 'مەواد درایەوە ✓'
                      : selectedRemAfterStaff > 0
                      ? `${formatIQD(selectedDayMaterialCost - selectedRemAfterStaff)} ماوە`
                      : 'چاوەڕوانی قۆناغی ٢'}
                  </span>
                </div>
              </div>

              {/* Stage 4: CapEx Amortization */}
              <div
                className={`p-4 rounded-2xl border transition-all space-y-3 relative overflow-hidden ${
                  isSelectedCapExCovered
                    ? 'bg-purple-50/70 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800/60 ring-1 ring-purple-300/40 shadow-xs'
                    : 'bg-slate-50/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black px-2.5 py-1 rounded-lg bg-purple-600 text-white shadow-xs flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5" />
                    قۆناغی ٤ (سەرمایەی ئامێر)
                  </span>
                  {isSelectedCapExCovered && (
                    <span className="text-xs text-purple-700 dark:text-purple-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      داپۆشرا
                    </span>
                  )}
                </div>

                <div>
                  <h5 className="font-bold text-slate-900 dark:text-white text-xs">پشکی ئامێرە سەرەکییەکان (CapEx)</h5>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    کۆی ئامێرەکان: {formatIQD(totalSetupCapEx)}
                  </p>
                </div>

                <div className="space-y-1.5 text-xs pt-1 border-t border-slate-200/80 dark:border-slate-700">
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>پشکی دانەوەی ڕۆژ:</span>
                    <strong className="text-purple-700 dark:text-purple-400 font-mono">{formatIQD(dailyCapExAmortization)}</strong>
                  </div>
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>ماوە لە پێش ئامێر:</span>
                    <strong className="text-slate-900 dark:text-white font-mono">{formatIQD(Math.max(0, selectedRemAfterMaterials))}</strong>
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] flex justify-between shadow-2xs">
                  <span className="text-slate-500 dark:text-slate-400">دانەوەی سەرمایە:</span>
                  <span
                    className={`font-bold font-mono ${
                      isSelectedCapExCovered ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {isSelectedCapExCovered
                      ? 'پشکی ئامێر درایەوە ✓'
                      : 'چاوەڕوانی قۆناغی ٣'}
                  </span>
                </div>
              </div>
            </div>

            {/* Outcome: Pure Net Profit */}
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-slate-900 dark:text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center border border-emerald-200 dark:border-emerald-800/60 shadow-2xs">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h6 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                    ئەنجامی کۆتایی: قازانجی ڕاستەقینە و خاوێنی {isSelectedDateToday ? 'ئەمڕۆ' : selectedDayNameKu} (Pure Net Profit)
                  </h6>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    ئەو پارەیەی لە دوای هەموو خەرجییەکان (کرێی شوێنی جیاکراوە + کارمەند و وزە + مەواد + ئامێرەکان) دەمێنێتەوە
                  </p>
                </div>
              </div>

              <div className="text-left">
                <span
                  className={`text-xl font-black font-mono block ${
                    selectedPureNetProfit >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'
                  }`}
                >
                  {formatIQD(selectedPureNetProfit)}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                  {selectedPureNetProfit >= 0 ? 'قازانجی سەد لە سەد دەستکەوتوو ✓' : 'هێشتا نەگەیشتووەتە قازانجی خاوێن'}
                </span>
              </div>
            </div>
          </div>

          {/* 7-DAY WEEKLY MATRIX (جیاکردنەوەی هەر ٧ ڕۆژەکەی هەفتە بە وردی) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h4 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <CalendarRange className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  خشتەی جیاکراوەی هەر ٧ ڕۆژەکەی هەفتە (کلیک بکە بۆ بینینی ئەشریف):
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  کلیک لە هەر ڕۆژێک بکە بۆ بینینی وردەکاری شۆردنەکان، پسوولەکان، خەرجی و قازانجی ئەو ڕۆژە.
                </p>
              </div>

              {/* Navigation across weeks */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setWeekOffset((prev) => prev + 1)}
                  className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-700 flex items-center gap-1 transition cursor-pointer"
                  title="هەفتەی پێشووتر لە ڕووی مێژووەوە"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                  هەفتەی پێشووتر
                </button>

                {weekOffset > 0 && (
                  <button
                    type="button"
                    onClick={() => setWeekOffset((prev) => Math.max(0, prev - 1))}
                    className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-700 flex items-center gap-1 transition cursor-pointer"
                  >
                    هەفتەی دواتر
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                )}

                {weekOffset > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setWeekOffset(0);
                      setSelectedArchiveDate(todayStr);
                    }}
                    className="px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-800/60 transition cursor-pointer"
                  >
                    ئەم هەفتەیە
                  </button>
                )}

                <span className="text-xs px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 rounded-xl font-bold font-mono">
                  {weekOffset === 0 ? '٧ ڕۆژی دوایی' : `پێش ${weekOffset} هەفتە`}
                </span>
              </div>
            </div>

            {/* 7-Day Interactive Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
              {weeklyDaysData.map((day, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedArchiveDate(day.dateStr)}
                  className={`p-3.5 rounded-2xl border text-right transition-all flex flex-col justify-between space-y-2.5 text-xs relative group cursor-pointer ${
                    day.isSelected
                      ? 'bg-blue-50/80 dark:bg-blue-950/60 border-blue-400 dark:border-blue-600 ring-2 ring-blue-500/30 shadow-md scale-[1.02]'
                      : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-white dark:hover:bg-slate-700 hover:scale-[1.01]'
                  }`}
                >
                  <div className="border-b border-slate-200/80 dark:border-slate-700 pb-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white text-sm">{day.dayNameKu}</span>
                      <div className="flex items-center gap-1">
                        {day.isToday && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-600 text-white font-bold">
                            ئەمڕۆ
                          </span>
                        )}
                        {day.isSelected && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-600 text-white font-bold flex items-center gap-0.5">
                            <Check className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono block pt-0.5">{day.dateStr}</span>
                  </div>

                  <div className="space-y-1.5 font-mono">
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-sans">داهات:</span>
                      <strong className="text-emerald-700 dark:text-emerald-400 text-sm font-bold">{formatIQD(day.revenue)}</strong>
                      <span className="text-[9px] text-slate-500 dark:text-slate-400 block font-sans">({day.washCount} کار)</span>
                    </div>

                    <div className="text-[10px] text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-200/80 dark:border-slate-700 space-y-0.5 font-sans">
                      <div className="flex justify-between">
                        <span>١. کرێی شوێن:</span>
                        <span className={day.isRentCovered ? 'text-amber-700 dark:text-amber-400 font-bold' : 'text-rose-600 dark:text-rose-400'}>
                          {day.isRentCovered ? '✓ دراوە' : 'نەدراوە'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>٢. کارمەند/وزە:</span>
                        <span className={day.isStaffCovered ? 'text-blue-700 dark:text-blue-400 font-bold' : 'text-slate-400'}>
                          {day.isStaffCovered ? '✓ دراوە' : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>٣. مەواد:</span>
                        <span className={day.isMaterialsCovered ? 'text-indigo-700 dark:text-indigo-400 font-bold' : 'text-slate-400'}>
                          {day.isMaterialsCovered ? '✓ دراوە' : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>٤. ئامێر:</span>
                        <span className={day.isCapExCovered ? 'text-purple-700 dark:text-purple-400 font-bold' : 'text-slate-400'}>
                          {day.isCapExCovered ? '✓ دراوە' : '-'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-sans">پوختەی ڕۆژ:</span>
                    <span
                      className={`font-black font-mono text-xs block ${
                        day.netProfit >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'
                      }`}
                    >
                      {formatIQD(day.netProfit)}
                    </span>
                    <span
                      className={`text-[9px] font-bold block pt-0.5 ${
                        day.netProfit >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {day.netProfit >= 0 ? 'قازانج ✓' : 'کەمتر لە تارگێت'}
                    </span>
                  </div>

                  {/* Visual click callout badge */}
                  <div
                    className={`w-full text-center py-1 rounded-lg text-[10px] font-bold transition ${
                      day.isSelected
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300 group-hover:text-blue-700 dark:group-hover:text-blue-300 group-hover:bg-blue-50 dark:group-hover:bg-slate-600'
                    }`}
                  >
                    {day.isSelected ? 'ئەرشیفی چالاک ✓' : 'کلیک بۆ بینین 🔍'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Selected Day Archive & Activity Ledger */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200/60 dark:border-blue-800/60 shadow-xs">
                    <History className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                      ئەرشیف و تۆماری کارەکانی ڕۆژی:
                      <span className="text-blue-600 dark:text-blue-400 font-black text-base">
                        {selectedDayNameKu} ({selectedArchiveDate})
                      </span>
                      {isSelectedDateToday && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-600 text-white font-bold">
                          ئەمڕۆ - داتای ڕاستەوخۆ
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      بینینی هەموو ئەو سەیارە و کارانەی لەم بەروارەدا شۆردراون لەگەڵ داهات و خەرجییەکان
                    </p>
                  </div>
                </div>
              </div>

              {/* Controls: Date Picker + Quick Today + Tab Toggle */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Date Picker Input */}
                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 shadow-xs">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">بەروار:</span>
                  <input
                    type="date"
                    value={selectedArchiveDate}
                    onChange={(e) => {
                      if (e.target.value) {
                        setSelectedArchiveDate(e.target.value);
                      }
                    }}
                    className="bg-transparent text-slate-900 dark:text-white font-mono text-xs focus:outline-none cursor-pointer"
                  />
                </div>

                {!isSelectedDateToday && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedArchiveDate(todayStr);
                      setWeekOffset(0);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    گەڕانەوە بۆ ئەمڕۆ
                  </button>
                )}

                {/* Tabs: Washes vs Expenses */}
                <div className="flex p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                  <button
                    type="button"
                    onClick={() => setArchiveFilterTab('washes')}
                    className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      archiveFilterTab === 'washes'
                        ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Car className="w-3.5 h-3.5" />
                    سەیارە شۆردراوەکان ({selectedDayWashCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setArchiveFilterTab('expenses')}
                    className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      archiveFilterTab === 'expenses'
                        ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    خەرجییەکانی ڕۆژ ({selectedDayExpenses.length})
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Metrics Bar for Selected Date */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">داهاتی ئەو ڕۆژە:</span>
                <span className="font-bold font-mono text-emerald-700 dark:text-emerald-400 text-sm">
                  {formatIQD(selectedDayRevenue)}
                </span>
                <span className="text-[9px] text-slate-500 dark:text-slate-400 font-sans block">({selectedDayWashCount} سەیارە)</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">کرێی شوێن (جیاکراوە):</span>
                <span className="font-bold font-mono text-amber-700 dark:text-amber-400 text-sm">
                  {formatIQD(dailyRent)}
                </span>
                <span className="text-[9px] text-slate-500 dark:text-slate-400 font-sans block">
                  {isSelectedRentCovered ? '✓ دراوە' : 'نەدراوە'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">کارمەند و وزە:</span>
                <span className="font-bold font-mono text-blue-700 dark:text-blue-400 text-sm">
                  {formatIQD(dailyStaffAndUtilities)}
                </span>
                <span className="text-[9px] text-slate-500 dark:text-slate-400 font-sans block">مووچە + ئاو/کارەبا</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">مەواد و ئامێر:</span>
                <span className="font-bold font-mono text-purple-700 dark:text-purple-400 text-sm">
                  {formatIQD(selectedDayMaterialCost + dailyCapExAmortization)}
                </span>
                <span className="text-[9px] text-slate-500 dark:text-slate-400 font-sans block">شامپۆ + پشکی ئامێر</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">پوختەی قازانج/زەرەر:</span>
                <span
                  className={`font-black font-mono text-sm block ${
                    selectedPureNetProfit >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'
                  }`}
                >
                  {formatIQD(selectedPureNetProfit)}
                </span>
                <span className="text-[9px] text-slate-500 dark:text-slate-400 font-sans block">
                  {selectedPureNetProfit >= 0 ? 'قازانج ✓' : 'کەمتر لە تارگێت'}
                </span>
              </div>
            </div>

            {/* Content: Washes Tab */}
            {archiveFilterTab === 'washes' && (
              <>
                {selectedDayWashes.length === 0 ? (
                  <div className="p-10 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-center space-y-2">
                    <Car className="w-8 h-8 text-slate-400 dark:text-slate-500 mx-auto" />
                    <h5 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                      لە بەرواری {selectedDayNameKu} ({selectedArchiveDate}) هیچ سەیارەیەک شۆردنی بۆ تۆمار نەکراوە
                    </h5>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      دەتوانیت لە خشتەی ٧ ڕۆژی سەرەوە کلیک لەسەر ڕۆژەکانی تر بکەیت یان بەروارێکی تر دیاری بکەیت.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-2xl">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className="py-2.5 px-3 font-semibold">سەیارە و مۆدێل</th>
                          <th className="py-2.5 px-3 font-semibold">تابلۆ</th>
                          <th className="py-2.5 px-3 font-semibold">ناوی خاوەن و مۆبایل</th>
                          <th className="py-2.5 px-3 font-semibold">خزمەتگوزاری</th>
                          <th className="py-2.5 px-3 font-semibold">وەستای بەرپرس</th>
                          <th className="py-2.5 px-3 font-semibold">هۆڵ</th>
                          <th className="py-2.5 px-3 font-semibold">کاتی پسوولە</th>
                          <th className="py-2.5 px-3 font-semibold text-left">بڕی پارە</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                        {selectedDayWashes.map((tw, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors">
                            <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                              <div className="flex items-center gap-1.5">
                                <span>{tw.carModel || 'سەیارە'}</span>
                                {tw.color && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                    {tw.color}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                              {tw.plate ? (
                                <PlateDisplay plate={tw.plate} size="sm" />
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                              {tw.ownerName || 'نادیار'} {tw.phone ? `(${tw.phone})` : ''}
                            </td>
                            <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 font-medium">{tw.serviceName}</td>
                            <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">{tw.staffName || 'وەستا'}</td>
                            <td className="py-2.5 px-3 font-mono text-slate-500 dark:text-slate-400">هۆڵی {tw.bayNumber || 1}</td>
                            <td className="py-2.5 px-3 font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                              {formatWashTime(tw.date)}
                            </td>
                            <td className="py-2.5 px-3 text-left font-mono font-bold">
                              {tw.isFree ? (
                                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                                  FREE (0 IQD)
                                </span>
                              ) : (
                                <span className="text-emerald-700 dark:text-emerald-400">{formatIQD(tw.price)}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {/* Content: Expenses Tab */}
            {archiveFilterTab === 'expenses' && (
              <>
                {selectedDayExpenses.length === 0 ? (
                  <div className="p-8 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-center space-y-1">
                    <CheckCircle className="w-7 h-7 text-slate-400 dark:text-slate-500 mx-auto" />
                    <h5 className="font-bold text-slate-700 dark:text-slate-300 text-xs">
                      هیچ پسوولەیەکی خەرجی لە بەرواری {selectedDayNameKu} ({selectedArchiveDate}) تۆمار نەکراوە
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      تەنها خەرجییە بنەڕەتییەکانی هەنگاوی ١ (کرێ و مووچە) بەپێی ڕۆژ هەژمار دەکرێن.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-2xl">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className="py-2.5 px-3 font-semibold">ناوی پسوولە و بابەت</th>
                          <th className="py-2.5 px-3 font-semibold">بەش / جۆر</th>
                          <th className="py-2.5 px-3 font-semibold">تێبینی</th>
                          <th className="py-2.5 px-3 font-semibold text-left">بڕی پارە</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                        {selectedDayExpenses.map((exp, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors">
                            <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">{exp.title}</td>
                            <td className="py-2.5 px-3">
                              <span className="text-[10px] px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 font-bold">
                                {exp.category}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">{exp.notes || '-'}</td>
                            <td className="py-2.5 px-3 text-left font-mono font-bold text-rose-600 dark:text-rose-400">
                              {formatIQD(Number(exp.amount) || 0)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* SECTION 2: BREAK-EVEN TARGETS & SURVIVAL CALCULATIONS         */}
      {/* ============================================================= */}
      {activeSection === 'breakeven' && (
        <div className="space-y-6 animate-fade-in" dir="rtl">
          {/* Live Breakeven Meter */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h4 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Target className="w-5 h-5 text-amber-500" />
                  خاڵی زەرەر نەکردن و پێشکەوتنی ئەمڕۆی غەسلەکە
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  پێوانەی ڕاستەوخۆی داهاتی ئەمڕۆ بەرامبەر بە خەرجی کارکردنی ڕۆژ
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-left">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-bold">تێچووی ڕۆژانەی کارکردن:</span>
                <span className="text-base font-black text-rose-600 dark:text-rose-400 font-mono">
                  {formatIQD(dailyOperatingCost)} / ڕۆژ
                </span>
              </div>
            </div>

            <div className="p-5 bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-500" />
                  پێشکەوتنی ئەمڕۆ بۆ پڕکردنەوەی خەرجی ڕۆژانە:
                </span>
                <span className="font-bold font-mono text-emerald-700 dark:text-emerald-400 text-sm">
                  {todayProgressPercent}% تەواوکراوە ({formatIQD(todayRevenue)} لە {formatIQD(dailyOperatingCost)})
                </span>
              </div>

              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3.5 overflow-hidden border border-slate-300 dark:border-slate-600">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isTodayBreakEvenReached
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                      : 'bg-gradient-to-r from-amber-500 to-orange-500'
                  }`}
                  style={{ width: `${todayProgressPercent}%` }}
                ></div>
              </div>

              <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed pt-1">
                {isTodayBreakEvenReached ? (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800/60 rounded-xl text-emerald-800 dark:text-emerald-200 font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span>
                      🎉 پیرۆزە! ئەمڕۆ خاڵی زەرەر نەکردن تێپەڕێنرا؛ هەموو ئەو کارانەی لە دوای ئەمەوە ئەنجام دەدرێن دەبنە قازانجی پوخت!
                    </span>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800/60 rounded-xl text-amber-900 dark:text-amber-200 flex items-center justify-between">
                    <span>
                      ⚠️ هێشتا <strong>{formatIQD(remainingRevenueToBreakEven)}</strong> ماوە بۆ پڕکردنەوەی خەرجی ڕۆژانە.
                    </span>
                    <span className="font-bold underline text-sm">
                      پێویستە تەنها {remainingCarsToBreakEven} سەیارەی تر بشۆردرێت!
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Alternative Work Targets */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Sparkles className="w-4 h-4 text-amber-500" />
              ئامانجە جێگرەوەکانی ڕۆژانە (یەکێک لەمانە تەواو بکەیت زەرەر ناکەیت):
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-2 text-center">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto border border-blue-200 dark:border-blue-800/60 shadow-xs">
                  <Car className="w-5 h-5" />
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-semibold">شۆردنی سەیارەی ئاسایی</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                  {carsNeededDaily} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">سەیارە</span>
                </span>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 block font-medium">(بۆ هەریەک 10,000 دینار)</span>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-2 text-center">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto border border-teal-200 dark:border-teal-800/60 shadow-xs">
                  <Layers2 className="w-5 h-5" />
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-semibold">شۆردنی فەرش</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                  {carpetM2NeededDaily} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">مەتر دووجا (م²)</span>
                </span>
                <span className="text-[10px] text-teal-600 dark:text-teal-400 block font-medium">(بۆ هەر م² 2,500 دینار)</span>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-2 text-center">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto border border-purple-200 dark:border-purple-800/60 shadow-xs">
                  <Layers className="w-5 h-5" />
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-semibold">شۆردنی قەنەفە</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                  {sofaSetsNeededDaily} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">تەخمی تەواو</span>
                </span>
                <span className="text-[10px] text-purple-600 dark:text-purple-400 block font-medium">(بۆ هەر تەخم 40,000 دینار)</span>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-2 text-center">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto border border-amber-200 dark:border-amber-800/60 shadow-xs">
                  <Sparkles className="w-5 h-5" />
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-semibold">پۆڵیش یان نانۆ سێرامیک</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                  {polishesNeededDaily} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">سەیارە</span>
                </span>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 block font-medium">(بۆ هەر پۆڵیش 45,000 دینار)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* SECTION 3: OFFERS & LOYALTY ROI                               */}
      {/* ============================================================= */}
      {activeSection === 'offers' && (
        <div className="space-y-6 animate-fade-in" dir="rtl">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h4 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Gift className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  شیکاری دارایی ئۆفەرەکان و وەفاداری کڕیار (Loyalty ROI)
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  بڕی ئەو پارەیەی بە شێوەی ئۆفەری بێبەرامبەر بە کڕیارە دڵسۆزەکان بەخشراوە لە بەرامبەر گەڕانەوەیان.
                </p>
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 text-left">
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block font-bold">کۆی بەهای ئۆفەری بەخشراو:</span>
                <span className="text-base font-black text-emerald-700 dark:text-emerald-400 font-mono">
                  {formatIQD(totalFreeOffersValueIQD)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-1">
                <span className="text-xs text-slate-500 dark:text-slate-400">کۆی شۆردنی Free بەخشراو:</span>
                <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono block">
                  {freeWashesCount} جار
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">بەپێی ئۆفەری ٤ شۆردن = ٥ـەم بەخۆڕایی</span>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-1">
                <span className="text-xs text-slate-500 dark:text-slate-400">سەیارەکانی ئامادەی شۆردنی Free:</span>
                <span className="text-2xl font-black text-amber-700 dark:text-amber-400 font-mono block">
                  {vehiclesNearFree.length} سەیارە
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">٤ شۆردنیان تەواو کردووە و سەردانی داهاتوو 0 دینارە</span>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-1">
                <span className="text-xs text-slate-500 dark:text-slate-400">ڕێژەی گەڕانەوەی کڕیار (Retention):</span>
                <span className="text-2xl font-black text-blue-700 dark:text-blue-400 font-mono block">
                  {retentionRate}%
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  {repeatCustomersCount} لە {vehicles.length} سەیارە دووبارە هاتوونەتەوە
                </span>
              </div>
            </div>

            {/* List of Customers Ready for Free Wash */}
            {vehiclesNearFree.length > 0 && (
              <div className="space-y-3 pt-2">
                <h5 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  سەیارە ئامادەکان بۆ وەرگرتنی دیاری (شۆردنی ٥ـەم = 0 IQD):
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {vehiclesNearFree.map((v) => (
                    <div
                      key={v.id}
                      className="p-4 bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-2xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block text-sm">{v.carModel}</span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          خاوەن: {v.ownerName} • تەلەفۆن: {v.phone}
                        </span>
                        <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold block pt-0.5">
                          تەواوکراو: ٤ لە ٤ شۆردن
                        </span>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/60 rounded-xl text-xs font-bold">
                          شۆردنی داهاتوو: 0 IQD
                        </span>
                        {v.phone && (
                          <a
                            href={`https://wa.me/964${v.phone.replace(/^0+/, '')}?text=${encodeURIComponent(
                              `سڵاو کاک ${v.ownerName} بەڕێز، پیرۆزە! بەپێی سیستەمی لۆیەڵتی غەسل، سەیارەکەت (${v.carModel}) ٤ شۆردنی تەواو کردووە و لە سەردانی داهاتوودا شۆردنی بێبەرامبەر (Free Wash) وەردەگریت. بەخێربێیت!`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1 transition shadow-xs"
                          >
                            <MessageCircle className="w-3 h-3" />
                            بانگهێشتکردن بە WhatsApp
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* SECTION 4: MULTI-SERVICE REVENUE (CARS, CARPET, SOFA, POLISH)  */}
      {/* ============================================================= */}
      {activeSection === 'services' && (
        <div className="space-y-6 animate-fade-in" dir="rtl">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-5">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
              <h4 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                شیکاری داهاتی خزمەتگوزارییەکان بەپێی بەش (سەیارە، فەرش، قەنەفە، پۆڵیش)
              </h4>
              <span className="text-xs text-slate-600 dark:text-slate-300 font-mono font-bold">کۆی داهات: {formatIQD(totalWashRevenue)}</span>
            </div>

            <div className="space-y-3">
              {Object.keys(serviceRevenueMap).length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-6">هێشتا هیچ تۆمارێکی شۆردن نییە.</p>
              ) : (
                Object.entries(serviceRevenueMap).map(([name, data]) => {
                  const percent =
                    totalWashRevenue > 0 ? Math.round((data.revenue / totalWashRevenue) * 100) : 0;
                  return (
                    <div
                      key={name}
                      className="p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white text-sm">{name}</span>
                          {data.category && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60 font-bold">
                              {data.category}
                            </span>
                          )}
                        </div>
                        <div className="text-left font-mono">
                          <span className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                            {formatIQD(data.revenue)}
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                            ({percent}% لە داهات • {data.count} جار ئەنجامدراوە)
                          </span>
                        </div>
                      </div>

                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* SECTION 5: EXPENSE & CASH ARCHIVE (ئەرشیفی خەرجی و سەرفکردن)  */}
      {/* ============================================================= */}
      {activeSection === 'expenses' && (
        <div className="space-y-6 animate-fade-in" dir="rtl">
          {/* Cash Inflow vs Outflow Ledger */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-5">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                  ئەرشیفی تەواوی داهات و سەرفکردنی کاش بەپێی بەروار:
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  کۆی پارەی وەرگیراو لە کڕیاران بەرامبەر بە هەموو ئەو پارەیەی سەرف کراوە لە کرێ، مەواد و ئامێرەکان.
                </p>
              </div>

              <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 shadow-xs">
                باڵانسی ماوە: {formatIQD(totalWashRevenue - totalExpenses)}
              </span>
            </div>

            {/* 4 Financial Inflow/Outflow Indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-1">
                <span className="text-slate-500 dark:text-slate-400 block font-semibold">کۆی پارەی وەرگیراو (داهاتی کاش):</span>
                <strong className="text-emerald-700 dark:text-emerald-400 font-mono text-xl block font-bold">
                  {formatIQD(totalWashRevenue)}
                </strong>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">لە {totalWashesCount} پسوولەی شۆردن</span>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-1">
                <span className="text-slate-500 dark:text-slate-400 block font-semibold">پارەی سەرفکراو لە هەنگاوی ١ (کرێ، کارمەند):</span>
                <strong className="text-rose-600 dark:text-rose-400 font-mono text-xl block font-bold">
                  {formatIQD(monthlyRent)}
                </strong>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">کرێی مانگانەی شوێن</span>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-1">
                <span className="text-slate-500 dark:text-slate-400 block font-semibold">پارەی سەرفکراو لە هەنگاوی ٢ (مەواد و شامپۆ):</span>
                <strong className="text-amber-700 dark:text-amber-400 font-mono text-xl block font-bold">
                  {formatIQD(365000)}
                </strong>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">شامپۆی ئیتاڵی، دەسماڵ و واکس</span>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-1">
                <span className="text-slate-500 dark:text-slate-400 block font-semibold">پارەی سەرفکراو لە هەنگاوی ٣ (ئامێرەکان):</span>
                <strong className="text-blue-700 dark:text-blue-400 font-mono text-xl block font-bold">
                  {formatIQD(totalSetupCapEx)}
                </strong>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">سەرمایەی سەرەتایی کڕدراو</span>
              </div>
            </div>

            {/* Search and Category Filters for the Ledger */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  placeholder="گەڕان لەناو پسوولەکانی خەرجی (ناونیشان، تێبینی)..."
                  value={expenseSearch}
                  onChange={(e) => setExpenseSearch(e.target.value)}
                  className="w-full pr-10 pl-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 font-sans shadow-xs"
                />
              </div>

              <select
                value={expenseFilterCategory}
                onChange={(e) => setExpenseFilterCategory(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-none shadow-xs"
              >
                <option value="all">هەموو بەشەکانی خەرجی</option>
                {Object.keys(expenseCategoryMap).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Expense Receipts Ledger Table */}
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-2xl">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">بەرواری سەرفکردن</th>
                    <th className="py-2.5 px-3 font-semibold">ناونیشانی پسوولەی خەرجی</th>
                    <th className="py-2.5 px-3 font-semibold">جۆری هەنگاو</th>
                    <th className="py-2.5 px-3 font-semibold">تێبینی و وردەکاری</th>
                    <th className="py-2.5 px-3 font-semibold text-left">بڕی سەرفکراو</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {filteredExpensesList.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-slate-500 dark:text-slate-400">{exp.date}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">{exp.title}</td>
                      <td className="py-2.5 px-3">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 text-[11px]">{exp.notes || '-'}</td>
                      <td className="py-2.5 px-3 text-left font-mono font-bold text-rose-600 dark:text-rose-400">
                        -{formatIQD(exp.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* SECTION 6: STAFF PERFORMANCE & PAYROLL                        */}
      {/* ============================================================= */}
      {activeSection === 'staff' && (
        <div className="space-y-6 animate-fade-in" dir="rtl">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-5">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
              <h4 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                بەرهەمی وەستاکان، کاتی دەوام و مووچەی شایستەی پوخت
              </h4>
              <span className="text-xs text-slate-500 dark:text-slate-400">{activeStaff.length} وەستای چالاک</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeStaff.map((st) => {
                const perf = staffPerformanceMap[st.name] || { count: 0, revenue: 0 };
                const deductionsTotal = (st.deductions || []).reduce(
                  (sum, d) => sum + (Number(d?.amount) || 0),
                  0
                );
                const baseSalary = Number(st.baseSalary) || 0;
                const dailyRate =
                  st.salaryType === 'monthly' ? Math.round(baseSalary / 30) : baseSalary;
                const absentTotal = (st.absentRecords || []).length * dailyRate;
                const netPayable = Math.max(0, baseSalary + perf.commission - deductionsTotal - absentTotal);

                return (
                  <div
                    key={st.id}
                    className="p-5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">{st.name}</h4>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">{st.role}</span>
                      </div>
                      <span className="text-[10px] px-2.5 py-1 rounded-full bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-800/60 font-bold">
                        {st.salaryType === 'monthly' ? 'مانگانە' : 'ڕۆژانە'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200 dark:border-slate-700">
                      <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/70 dark:border-slate-800">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">شۆردنی ئەنجامدراو:</span>
                        <span className="font-bold text-slate-900 dark:text-white font-mono">{perf.count} کار</span>
                      </div>
                      <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/70 dark:border-slate-800">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">داهاتی هێنراو:</span>
                        <span className="font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                          {formatIQD(perf.revenue)}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl text-xs space-y-1.5 border border-slate-200/80 dark:border-slate-800">
                      <div className="flex justify-between text-slate-500 dark:text-slate-400">
                        <span>مووچەی بنەڕەتی:</span>
                        <span className="font-mono text-slate-900 dark:text-white font-bold">{formatIQD(baseSalary)}</span>
                      </div>
                      {perf.commission > 0 && (
                        <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                          <span>عەمولەی بەرهەم ({perf.count} سەیارە):</span>
                          <span className="font-mono font-bold">+ {formatIQD(perf.commission)}</span>
                        </div>
                      )}
                      {absentTotal > 0 && (
                        <div className="flex justify-between text-rose-600 dark:text-rose-400">
                          <span>لێبڕینی نەهاتن ({(st.absentRecords || []).length} ڕۆژ):</span>
                          <span className="font-mono font-bold">- {formatIQD(absentTotal)}</span>
                        </div>
                      )}
                      {deductionsTotal > 0 && (
                        <div className="flex justify-between text-amber-700 dark:text-amber-400">
                          <span>غەرامە و سزا:</span>
                          <span className="font-mono font-bold">- {formatIQD(deductionsTotal)}</span>
                        </div>
                      )}
                      <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 flex justify-between font-bold text-sm">
                        <span className="text-emerald-700 dark:text-emerald-400">مووچەی شایستەی پوخت:</span>
                        <span className="text-emerald-700 dark:text-emerald-400 font-mono">{formatIQD(netPayable)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* ============================================================= */}
      {/* SECTION: EXECUTIVE STRIPE & LINEAR STYLE DASHBOARD (CLEAN)    */}
      {/* ============================================================= */}
      {activeSection === 'overview' && (
        <div className="space-y-6 animate-fade-in" dir="rtl">
          {/* 1. TOP ROW: 4 GOLDEN EXECUTIVE KPIS (STRIPE / LINEAR CLARITY) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: TOTAL REVENUE */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-800/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-xs">
                  <Coins className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-0.5 font-mono">
                  <ArrowUpRight className="w-3 h-3" />
                  +14.2% گەشە
                </span>
              </div>
              <div className="mt-4">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-bold block">کۆی داهات (Total Revenue)</span>
                <div className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight mt-1">
                  {formatIQD(periodRevenue)}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
                  <span>{periodWashCount} شۆردنی تۆمارکراو</span>
                  {periodFreeCount > 0 && (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">({periodFreeCount} بەخۆڕایی)</span>
                  )}
                </div>
              </div>
            </div>

            {/* KPI 2: NET PROFIT & MARGIN */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs ${
                  periodNetProfit >= 0
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/60 text-emerald-600 dark:text-emerald-400'
                    : 'bg-rose-50 dark:bg-rose-950/60 border border-rose-200/60 dark:border-rose-800/60 text-rose-600 dark:text-rose-400'
                }`}>
                  {periodNetProfit >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border shadow-xs flex items-center gap-0.5 font-mono ${
                  periodNetProfit >= 0
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60'
                    : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60'
                }`}>
                  {periodNetProfit >= 0 ? `+${periodMargin}% قازانج` : `-${Math.abs(periodMargin)}% زەرەر`}
                </span>
              </div>
              <div className="mt-4">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-bold block">
                  {periodNetProfit >= 0 ? 'قازانجی پوخت (Net Profit)' : 'زەرەری پوخت (Net Loss)'}
                </span>
                <div className={`text-2xl font-black font-mono tracking-tight mt-1 ${
                  periodNetProfit >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-600 dark:text-rose-400'
                }`}>
                  {formatIQD(periodNetProfit)}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                  تێچووی کارکردن: {formatIQD(effectivePeriodExpenses)}
                </div>
              </div>
            </div>

            {/* KPI 3: AVERAGE TICKET VALUE (ATV) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200/60 dark:border-amber-800/60 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-xs">
                  <Target className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 flex items-center gap-0.5 font-mono">
                  +{upsellRatePercent}% خزمەتگوزاری VIP
                </span>
              </div>
              <div className="mt-4">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-bold block">تێکڕای پسوولە (Average Ticket)</span>
                <div className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight mt-1">
                  {formatIQD(averageTicketValue)}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
                  <span>بۆ هەر سەیارەیەک</span>
                  <span className="text-blue-600 dark:text-blue-400 font-medium font-mono">{upsellWashesCount} VIP/پۆڵیش</span>
                </div>
              </div>
            </div>

            {/* KPI 4: CUSTOMER RETENTION */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200/60 dark:border-purple-800/60 flex items-center justify-center text-purple-600 dark:text-purple-400 shadow-xs">
                  <Gift className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 flex items-center gap-0.5 font-mono">
                  {vehicles.length} کڕیاری تۆمارکراو
                </span>
              </div>
              <div className="mt-4">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-bold block">ڕێژەی گەڕانەوە (Retention)</span>
                <div className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight mt-1">
                  {retentionRate}% <span className="text-xs font-normal text-slate-400 dark:text-slate-500">دووبارە</span>
                </div>
                <div className="text-[11px] text-purple-700 dark:text-purple-400 font-medium mt-1 flex items-center justify-between">
                  <span>{vehiclesNearFree.length} سەیارە نزیک لە دیاری</span>
                  <span className="font-mono font-bold">4+1 Free</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. ROW 2: 7-DAY REVENUE BAR CHART & FINANCIAL HEALTH BALANCE */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* 2A. 7-DAY INTERACTIVE BAR CHART (7 COLS) */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      هێڵکاری داهاتی ڕۆژانە (Daily Revenue & Volume)
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      بەراوردی ڕاستەقینەی داهات و ژمارەی سەیارەکان بە درێژایی ٧ ڕۆژ
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#F1F3F7] dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 font-bold font-mono shadow-xs self-start sm:self-auto">
                    <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>تێکڕای ڕۆژ: ~{formatIQD(Math.round(weeklyRevenueTotal / 7))}</span>
                  </div>
                </div>

                {/* Interactive Active Day Inspector Pill */}
                {(() => {
                  const activeIndex = hoveredDayIndex !== null ? hoveredDayIndex : 6;
                  const activeItem = weeklyDaysData[activeIndex] || weeklyDaysData[weeklyDaysData.length - 1];
                  if (!activeItem) return null;
                  return (
                    <div className="mt-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
                        <span className="font-bold text-slate-900 dark:text-white font-sans">
                          {activeItem.dayNameKu} ({activeItem.dateStr}):
                        </span>
                        {activeItem.isToday && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-600 text-white font-bold">ئەمڕۆ</span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 font-mono text-[11px]">
                        <span>داهات: <strong className="text-emerald-700 dark:text-emerald-400 font-bold">{formatIQD(activeItem.revenue)}</strong></span>
                        <span>سەیارە: <strong className="text-slate-900 dark:text-white font-bold">{activeItem.washCount} دانە</strong></span>
                        <span>قازانج: <strong className={activeItem.netProfit >= 0 ? 'text-blue-700 dark:text-blue-400 font-bold' : 'text-rose-600 dark:text-rose-400 font-bold'}>{formatIQD(activeItem.netProfit)}</strong></span>
                      </div>
                    </div>
                  );
                })()}

                {/* 7 Daily Bars */}
                <div className="grid grid-cols-7 gap-2 sm:gap-3.5 h-44 items-end pt-6 pb-2">
                  {weeklyDaysData.slice(0, 7).map((dItem, idx) => {
                    const isHovered = hoveredDayIndex === idx;
                    const heightPercent = Math.min(100, Math.max(8, Math.round(((dItem.revenue || 0) / maxDailyRevenue) * 100)));
                    return (
                      <div
                        key={idx}
                        onMouseEnter={() => setHoveredDayIndex(idx)}
                        onMouseLeave={() => setHoveredDayIndex(null)}
                        className="flex flex-col items-center gap-2 h-full justify-end group cursor-pointer"
                      >
                        <div className="w-full max-w-[42px] flex flex-col items-center justify-end h-full relative">
                          {dItem.revenue === 0 ? (
                            <div className="w-full h-8 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 transition-colors group-hover:bg-blue-50/50 dark:group-hover:bg-slate-700"></div>
                          ) : (
                            <div
                              style={{ height: `${heightPercent}%` }}
                              className={`w-full rounded-xl transition-all duration-300 shadow-xs ${
                                isHovered
                                  ? 'bg-gradient-to-t from-blue-700 via-indigo-600 to-sky-400 scale-105 shadow-md shadow-blue-500/20'
                                  : dItem.isToday
                                  ? 'bg-gradient-to-t from-blue-600 to-indigo-600 ring-2 ring-blue-400/40'
                                  : 'bg-gradient-to-t from-slate-600 to-slate-800 dark:from-slate-700 dark:to-slate-600 group-hover:from-blue-600 group-hover:to-indigo-600'
                              }`}
                            ></div>
                          )}
                        </div>
                        <span className={`text-[11px] font-bold transition-colors truncate ${
                          dItem.isToday ? 'text-blue-600 dark:text-blue-400 font-black' : isHovered ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'
                        }`}>
                          {dItem.dayNameKu.slice(0, 4)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Legend & Summary */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                    کۆی داهاتی هەفتە: <strong className="text-emerald-700 dark:text-emerald-400 font-mono">{formatIQD(weeklyRevenueTotal)}</strong>
                  </span>
                </div>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                  {weeklyWashesTotal} شۆردنی تەواوکراو
                </span>
              </div>
            </div>

            {/* 2B. FINANCIAL HEALTH BALANCE (5 COLS) */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <PieChart className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      هاوسەنگی دارایی (Financial Balance)
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      دابەشبوونی داهات بەرامبەر کرێ، مووچە و قازانج
                    </p>
                  </div>
                  <span className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                    periodNetProfit >= 0
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60'
                      : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60'
                  }`}>
                    {periodNetProfit >= 0 ? `+${periodMargin}% پوخت` : `-${Math.abs(periodMargin)}% زەرەر`}
                  </span>
                </div>

                {/* Segmented Horizontal Bar (Stripe Style) */}
                <div className="mt-4 space-y-2">
                  <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex shadow-inner border border-slate-200/60 dark:border-slate-700">
                    {periodNetProfit > 0 && (
                      <div
                        style={{ width: `${Math.min(70, Math.max(5, periodMargin))}%` }}
                        className="h-full bg-emerald-500 transition-all"
                        title="قازانجی سافی"
                      ></div>
                    )}
                    <div
                      style={{
                        width: `${Math.min(
                          100,
                          periodNetProfit > 0
                            ? Math.max(15, 100 - Math.min(70, periodMargin) - 25)
                            : 65
                        )}%`,
                      }}
                      className="h-full bg-blue-600 transition-all"
                      title="خەرجی کارکردن و مەواد"
                    ></div>
                    <div
                      style={{ width: `${periodNetProfit > 0 ? 25 : 35}%` }}
                      className="h-full bg-amber-500 transition-all"
                      title="پشکی کرێی شوێن"
                    ></div>
                  </div>

                  {/* Financial Breakdown Items */}
                  <div className="space-y-2 pt-2 text-xs">
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700">
                      <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-900 dark:bg-slate-400"></span>
                        کۆی داهات (Gross Revenue):
                      </span>
                      <strong className="font-mono text-slate-900 dark:text-white font-black">{formatIQD(periodRevenue)}</strong>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-xl bg-amber-50/60 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-800/50 text-amber-900 dark:text-amber-200">
                      <span className="font-bold flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                        پشکی کرێی شوێن:
                      </span>
                      <strong className="font-mono font-bold">{formatIQD(selectedPeriod === 'today' ? dailyRent : dailyRent * estimatedDays)}</strong>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-800/50 text-blue-900 dark:text-blue-200">
                      <span className="font-bold flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                        مووچە، کارەبا و کەرەستە:
                      </span>
                      <strong className="font-mono font-bold">{formatIQD(effectivePeriodExpenses)}</strong>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200 shadow-2xs">
                      <span className="font-black flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                        قازانجی سافی پوخت:
                      </span>
                      <strong className="font-mono text-emerald-700 dark:text-emerald-400 font-black text-sm">{formatIQD(periodNetProfit)}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Break-even status indicator for today */}
              <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    تارگێتی خاڵی زەرەر نەکردنی ئەمڕۆ:
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{todayProgressPercent}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-200/60 dark:border-slate-700 mb-2">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isTodayBreakEvenReached ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${todayProgressPercent}%` }}
                  ></div>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                  {isTodayBreakEvenReached ? (
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      تارگێتی ئەمڕۆ داپۆشراوە؛ هەموو شۆردنەکانی دواتر قازانجی پوختن.
                    </span>
                  ) : (
                    <span>
                      ⚠️ <strong>{formatIQD(remainingRevenueToBreakEven)}</strong> ماوە ({remainingCarsToBreakEven} سەیارە) تا زەرەر نەکرێت.
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* 3. ROW 3: TOP SERVICES MIX & RECENT WASHES LIVE ACTIVITY */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* 3A. TOP SERVICES MIX (6 COLS) */}
            <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      باوترین خزمەتگوزارییەکان (Services Revenue Mix)
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      داهات و ژمارەی کارەکان بەپێی جۆری خزمەتگوزاری
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#F1F3F7] dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700 shadow-xs">
                    {services.length} خزمەتگوزاری
                  </span>
                </div>

                <div className="space-y-3 pt-3">
                  {topServicesList.map((srv, idx) => {
                    const dotColors = ['bg-blue-600', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500', 'bg-sky-400'];
                    return (
                      <div key={srv.name} className="space-y-1.5 p-2 rounded-2xl hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${dotColors[idx] || 'bg-slate-400'}`}></span>
                            <span className="font-bold text-slate-900 dark:text-white">{srv.name}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                              {srv.category}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 font-mono text-[11px]">
                            <span className="text-slate-500 dark:text-slate-400">{srv.count} وەسڵ</span>
                            <strong className="text-slate-900 dark:text-white font-bold">{formatIQD(srv.revenue)}</strong>
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 font-mono">
                              {srv.percent}%
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            style={{ width: `${srv.percent}%` }}
                            className={`h-full rounded-full ${dotColors[idx] || 'bg-blue-600'}`}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>پۆلێنکردنی داهات بەپێی شۆردنەکان</span>
                <button
                  type="button"
                  onClick={() => onNavigateTab?.('settings')}
                  className="text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
                >
                  دەستکاریکردنی نرخ و خزمەتگوزارییەکان ←
                </button>
              </div>
            </div>

            {/* 3B. RECENT WASHES LIVE ACTIVITY (6 COLS) */}
            <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      دوایین شۆردنەکان (Recent Washes Activity)
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      تۆماری ڕاستەوخۆی دوایین سەیارە شۆراوەکان لە سیستەمدا
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Live Feed
                  </span>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800 pt-1">
                  {recentWashes.length === 0 ? (
                    <div className="py-8 text-center space-y-2">
                      <span className="text-3xl block">🧼</span>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">هیچ شۆردنێک لەم ماوەیەدا نییە.</p>
                      <button
                        type="button"
                        onClick={() => onNavigateTab?.('cashier')}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-xs hover:bg-blue-700 transition cursor-pointer"
                      >
                        تۆمارکردنی شۆردن لە کاشێر
                      </button>
                    </div>
                  ) : (
                    recentWashes.map((w, idx) => {
                      return (
                        <div key={idx} className="py-2.5 flex items-center justify-between gap-3 text-xs hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors px-1 rounded-xl">
                          <div className="flex items-center gap-3 min-w-0">
                            {w.plate && (
                              <div className="scale-75 origin-right shrink-0">
                                <PlateDisplay plate={w.plate} size="sm" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 truncate">
                                <span className="font-black text-slate-900 dark:text-white truncate">{w.carModel || 'سەیارە'}</span>
                                <span className="text-slate-400">•</span>
                                <span className="text-slate-600 dark:text-slate-300 truncate">{w.ownerName}</span>
                              </div>
                              <span className="text-[11px] text-slate-400 dark:text-slate-500 block truncate">
                                {w.serviceName || 'شۆردنی سەرەکی'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {/* Payment Method Badge */}
                            {w.isFree ? (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 text-[10px] font-bold">
                                🎁 Free
                              </span>
                            ) : w.paymentMethod === 'fastpay' ? (
                              <span className="px-2 py-0.5 rounded-md bg-pink-50 dark:bg-pink-950/60 text-pink-700 dark:text-pink-400 border border-pink-200 dark:border-pink-800/60 text-[10px] font-bold">
                                🟣 FastPay
                              </span>
                            ) : w.paymentMethod === 'fib' ? (
                              <span className="px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-800/60 text-[10px] font-bold">
                                🔵 FIB
                              </span>
                            ) : w.paymentMethod === 'debt' ? (
                              <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 text-[10px] font-bold">
                                ⏳ قەرز
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[10px] font-bold">
                                💵 نەقد
                              </span>
                            )}

                            <span className="font-mono font-bold text-slate-900 dark:text-white">
                              {formatIQD(w.price)}
                            </span>

                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono hidden sm:inline">
                              {formatWashTime(w.date)}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>دوایین شۆردنە تۆمارکراوەکان</span>
                <button
                  type="button"
                  onClick={() => onNavigateTab?.('vehicles', 'history')}
                  className="text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                >
                  بینینی تەواوی ئەرشیفی سەیارەکان ←
                </button>
              </div>
            </div>
          </div>

          {/* 4. ROW 4: COMPACT RETENTION ALERT (LINEAR STYLE) */}
          {atRiskCustomers.length > 0 && (
            <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 flex items-center justify-center shrink-0 shadow-xs font-mono font-bold">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-black text-rose-900 dark:text-rose-200 block">
                    ئاگاداری کڕیارانی بێدەنگ: {atRiskCustomers.length} کڕیاری بەردەوام زیاتر لە ١٥ ڕۆژە سەردانیان نەکردووە!
                  </span>
                  <span className="text-[11px] text-rose-700 dark:text-rose-300">
                    دەتوانیت بە یەک کلیک لە ڕێگەی WhatsApp پەیامی لۆیەڵتی و ڕێزیان بۆ بنێریت تا دووبارە سەردان بکەنەوە.
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={() => handleWhatsAppAtRisk(atRiskCustomers[0])}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  پەیام بۆ {atRiskCustomers[0]?.ownerName}
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateTab?.('vehicles', 'retention')}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold transition cursor-pointer"
                >
                  بینینی هەموویان
                </button>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
