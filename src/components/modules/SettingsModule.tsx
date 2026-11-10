'use client';

import React, { useRef, useState } from 'react';
import { AppSettings, ServiceItem, VehicleSize } from '@/types';
import {
  getSavedSetupItems,
  saveSetupItems,
  getSavedExpenses,
  saveExpenses,
  getSavedServices,
  saveServices,
  getSavedVehicles,
  saveVehicles,
  getSavedStaff,
  saveStaff,
  getSavedSettings,
  saveSettings,
  getSavedRoadmap,
  saveRoadmap,
  getSavedInventory,
  saveInventory,
  formatIQD,
  normalizeDigits,
  seedRealisticDemoData,
  resetToCleanProduction,
} from '@/lib/storage';
import { defaultSettings } from '@/constants/initialData';
import { BackupManagerModal } from '@/components/ui/BackupManagerModal';
import { sendTelegramMessage } from '@/lib/telegram';
import {
  Settings,
  Shield,
  Sparkles,
  Download,
  Upload,
  FileSpreadsheet,
  Globe,
  Database,
  CheckCircle2,
  AlertCircle,
  Building2,
  Droplets,
  Coins,
  Car,
  Plus,
  Trash2,
  Save,
  X,
  Clock,
  Printer,
  Phone,
  MapPin,
  RotateCcw,
  KeyRound,
  Percent,
  MessageSquare,
  Layers,
  Lock,
  Eye,
  Check,
  AlertTriangle,
  FileText,
  Sun,
  Moon,
  Palette,
  Laptop,
} from 'lucide-react';

interface SettingsModuleProps {
  settings: AppSettings;
  services?: ServiceItem[];
  onUpdateSettings: (settings: AppSettings) => void;
  onUpdateServices?: (services: ServiceItem[]) => void;
  onNotify: (msg: string) => void;
  onDataImported?: () => void;
  currentTheme?: 'light' | 'dark';
  onToggleTheme?: (theme?: 'light' | 'dark') => void;
}

export const SettingsModule: React.FC<SettingsModuleProps> = ({
  settings,
  services = [],
  onUpdateSettings,
  onUpdateServices,
  onNotify,
  onDataImported,
  currentTheme = 'light',
  onToggleTheme,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Active Tab in Settings
  const [activeTab, setActiveTab] = useState<
    'identity' | 'receipt' | 'bays' | 'rent_costs' | 'pricing' | 'loyalty' | 'backup' | 'appearance'
  >('identity');

  // Service Management State
  const [isAddingService, setIsAddingService] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceCategory, setNewServiceCategory] = useState<ServiceItem['category']>('سەیارە');
  const [newServicePrice, setNewServicePrice] = useState<number>(10000);
  const [newServiceSedanPrice, setNewServiceSedanPrice] = useState<number>(10000);
  const [newServiceSuvPrice, setNewServiceSuvPrice] = useState<number>(15000);
  const [newServiceTruckPrice, setNewServiceTruckPrice] = useState<number>(20000);
  const [newServiceDuration, setNewServiceDuration] = useState<number>(30);
  const [newServiceDesc, setNewServiceDesc] = useState('');

  // Handle generic settings change
  const handleChange = (key: keyof AppSettings, value: any) => {
    let finalVal = value;
    if (
      typeof value === 'string' &&
      (key === 'monthlyRent' ||
        key === 'dailyUtilities' ||
        key === 'averageMaterialCostPerWash' ||
        key === 'washesNeededForFree' ||
        key === 'milestoneWashTarget' ||
        key === 'expiryDaysLimit' ||
        key === 'numberOfBays' ||
        key === 'dailyTargetCars' ||
        key === 'vipDiscountPercent')
    ) {
      finalVal = Number(normalizeDigits(value)) || 0;
    }
    const updated = { ...settings, [key]: finalVal };
    onUpdateSettings(updated);
  };

  // Service update handlers
  const handleServiceChange = (id: string, field: keyof ServiceItem, value: any) => {
    if (!onUpdateServices) return;
    let finalVal = value;
    if (field === 'price' || field === 'durationMinutes') {
      finalVal = Number(normalizeDigits(String(value))) || 0;
    }
    const updated = services.map((s) => (s.id === id ? { ...s, [field]: finalVal } : s));
    onUpdateServices(updated);
  };

  const handleServicePriceBySizeChange = (id: string, size: VehicleSize, value: number) => {
    if (!onUpdateServices) return;
    const updated = services.map((s) => {
      if (s.id === id) {
        const currentPrices = s.pricesBySize || { sedan: s.price, suv: s.price, truck: s.price };
        return {
          ...s,
          pricesBySize: {
            ...currentPrices,
            [size]: Number(normalizeDigits(String(value))) || 0,
          },
        };
      }
      return s;
    });
    onUpdateServices(updated);
  };

  const handleDeleteService = (id: string, name: string) => {
    if (!onUpdateServices) return;
    if (window.confirm(`ئایا دڵنیایت لە سڕینەوەی خزمەتگوزاری «${name}»؟`)) {
      const updated = services.filter((s) => s.id !== id);
      onUpdateServices(updated);
      onNotify(`خزمەتگوزاری «${name}» سڕایەوە.`);
    }
  };

  const handleTestTelegram = async () => {
    if (!settings.telegramBotToken || !settings.telegramChatId) {
      alert('تکایە سەرەتا تۆکن (Bot Token) و چات ئایدی (Chat ID) بنووسە!');
      return;
    }
    const testMsg = `🤖 <b>تاقیکردنەوەی بۆتی تێلێگرام - ${settings.carWashName}</b>\n\nئەم پەیامە نیشانەی ئەوەیە پەیوەندی نێوان سیستەمی غەسلەکەت و تێلێگرام ١٠٠٪ بە سەرکەوتوویی کار دەکات! ✨\n📅 کات: ${new Date().toLocaleString('ku')}`;
    const res = await sendTelegramMessage(settings.telegramBotToken, settings.telegramChatId, testMsg);
    if (res.success) {
      alert('✅ پەیامی تاقیکاری بە سەرکەوتوویی بۆ تێلێگرامەکەت نێردرا!');
      onNotify('🤖 پەیامی تاقیکاری بۆ تێلێگرام نێردرا.');
    } else {
      alert(`❌ نەتوانرا بنێردرێت: ${res.message}`);
    }
  };

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateServices || !newServiceName.trim()) return;

    const baseP = Number(normalizeDigits(String(newServicePrice))) || 10000;
    const sedanP = Number(normalizeDigits(String(newServiceSedanPrice))) || baseP;
    const suvP = Number(normalizeDigits(String(newServiceSuvPrice))) || baseP + 5000;
    const truckP = Number(normalizeDigits(String(newServiceTruckPrice))) || baseP + 10000;
    const durationM = Number(normalizeDigits(String(newServiceDuration))) || 30;

    const newSrv: ServiceItem = {
      id: `srv-${Date.now()}`,
      name: newServiceName.trim(),
      category: newServiceCategory,
      unit:
        newServiceCategory === 'شۆردنی فەرش'
          ? 'مەتر دووجا (م²)'
          : newServiceCategory === 'شۆردنی قەنەفە'
          ? 'تەخم'
          : 'سەیارە',
      price: baseP,
      pricesBySize:
        newServiceCategory === 'سەیارە' || newServiceCategory === 'پۆڵیش و نانۆ سێرامیک'
          ? {
              sedan: sedanP,
              suv: suvP,
              truck: truckP,
            }
          : undefined,
      description: newServiceDesc.trim() || 'خزمەتگوزاری تۆمارکراو',
      durationMinutes: durationM,
    };

    onUpdateServices([...services, newSrv]);
    onNotify(`خزمەتگوزاری نوێ «${newSrv.name}» بە سەرکەوتوویی زیادکرا.`);

    setNewServiceName('');
    setNewServiceDesc('');
    setIsAddingService(false);
  };

  // 1. Export Complete Backup JSON
  const handleExportBackup = () => {
    const backupData = {
      system: 'Car Wash Management System',
      version: '2.5',
      exportedAt: new Date().toISOString(),
      carWashName: settings.carWashName,
      data: {
        setup: getSavedSetupItems(),
        expenses: getSavedExpenses(),
        services: getSavedServices(),
        vehicles: getSavedVehicles(),
        staff: getSavedStaff(),
        settings: getSavedSettings(),
        roadmap: getSavedRoadmap(),
        inventory: getSavedInventory(),
      },
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    const dateStr = new Date().toISOString().split('T')[0];
    downloadAnchor.setAttribute('download', `carwash-backup-${dateStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    onNotify('📁 فایلی باکئەپی تەواوی سیستم (JSON) بە سەرکەوتوویی داگیرا.');
  };

  // 2. Import Backup JSON
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsText(file, 'UTF-8');
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        if (!parsed.data) {
          alert('ئەم فایلە فایلی باکئەپی دروستی ئەم سیستەمە نییە!');
          return;
        }

        const confirmed = window.confirm(
          `ئایا دڵنیایت لە گەڕاندنەوەی باکئەپی «${parsed.carWashName || 'نەناسراو'}» کە لە بەرواری ${parsed.exportedAt || 'پێشوو'} دەرکراوە؟\n\nئەم کارە هەموو داتاکانی ئێستا نوێ دەکاتەوە.`
        );

        if (confirmed) {
          if (Array.isArray(parsed.data.setup)) saveSetupItems(parsed.data.setup);
          if (Array.isArray(parsed.data.expenses)) saveExpenses(parsed.data.expenses);
          if (Array.isArray(parsed.data.services)) {
            saveServices(parsed.data.services);
            if (onUpdateServices) onUpdateServices(parsed.data.services);
          }
          if (Array.isArray(parsed.data.vehicles)) saveVehicles(parsed.data.vehicles);
          if (Array.isArray(parsed.data.staff)) saveStaff(parsed.data.staff);
          if (parsed.data.settings) {
            saveSettings(parsed.data.settings);
            onUpdateSettings(parsed.data.settings);
          }
          if (Array.isArray(parsed.data.roadmap)) saveRoadmap(parsed.data.roadmap);
          if (Array.isArray(parsed.data.inventory)) saveInventory(parsed.data.inventory);

          onNotify('✅ باکئەپ بە سەرکەوتوویی بارکرایەوە و هەموو داتاکان نوێکرانەوە.');

          if (onDataImported) {
            onDataImported();
          } else {
            setTimeout(() => window.location.reload(), 1000);
          }
        }
      } catch {
        alert('هەڵەیەک لە خوێندنەوەی فایلی باکئەپ ڕوویدا!');
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
  };

  // 3. Export Financial Report to Excel/CSV with UTF-8 BOM
  const handleExportFinancialCSV = () => {
    const vehicles = getSavedVehicles();
    const expenses = getSavedExpenses();

    let totalRevenue = 0;
    let totalWashes = 0;
    const washRows: string[] = [];

    vehicles.forEach((v) => {
      const plate =
        v.plate.type === 'unified'
          ? `${v.plate.provinceCode || ''} | ${v.plate.letter || ''} ${v.plate.number || ''}`
          : `${v.plate.oldCityName || ''} / ${v.plate.oldNumber || ''}`;

      (v.washHistory || []).forEach((w) => {
        totalRevenue += w.price;
        totalWashes++;
        const dateStr = w.date ? new Date(w.date).toLocaleDateString('ku') : '';
        washRows.push(
          [
            `"${dateStr}"`,
            `"داهاتی شۆردن"`,
            `"${w.serviceName || 'شۆردن'}"`,
            `"${v.carModel || ''} (${v.color || ''})"`,
            `"${v.ownerName || ''}"`,
            `"${plate}"`,
            w.price,
            `"${w.isFree ? 'بێبەرامبەر (Free)' : 'دراوە'}"`,
            `"${w.staffName || ''}"`,
          ].join(',')
        );
      });
    });

    const totalExpenseAmount = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const expenseRows = expenses.map((e) => {
      const dateStr = e.date ? new Date(e.date).toLocaleDateString('ku') : '';
      return [
        `"${dateStr}"`,
        `"خەرجی"`,
        `"${e.category}"`,
        `"${e.title}"`,
        `"-"`,
        `"-"`,
        `-${e.amount}`,
        `"خەرجی غەسل"`,
        `"${e.notes || ''}"`,
      ].join(',');
    });

    const netProfit = totalRevenue - totalExpenseAmount;
    const BOM = '\uFEFF';
    const csvLines = [
      `"ڕاپۆرتی گشتی دارایی و مێژووی شۆردنی: ${settings.carWashName}"`,
      `"بەرواری ئامادەکردن: ${new Date().toLocaleDateString('ku')}"`,
      `"کۆی داهاتی شۆردن: ${totalRevenue.toLocaleString()} دینار | ژمارەی شۆردنەکان: ${totalWashes}"`,
      `"کۆی گشتی خەرجییەکان: ${totalExpenseAmount.toLocaleString()} دینار"`,
      `"قازانجی سافی (داهات - خەرجی): ${netProfit.toLocaleString()} دینار"`,
      ``,
      `"بەروار","جۆری تۆمار","خزمەتگوزاری / پۆلێن","ئۆتۆمبێل","خاوەن سەیارە","تابلۆ","بڕی پارە (دینار)","دۆخی پارەدان","وەستا / تێبینی"`,
      ...washRows,
      ...expenseRows,
    ];

    const blob = new Blob([BOM + csvLines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `carwash-financial-report-${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    onNotify('📊 ڕاپۆرتی دارایی بە فۆرماتی Excel / CSV دابەزێندرا.');
  };

  // 4. Reset Settings to Default
  const handleResetSettings = () => {
    const masterPin = settings.adminPin || '9999';
    const enteredPin = prompt('⚠️ بۆ گەڕاندنەوەی ڕێکخستنەکان بۆ دۆخی سەرەتایی، تکایە کۆدی نهێنی بەڕێوەبەر (Admin Master PIN) بنووسە:');
    if (enteredPin === null) return;

    if (normalizeDigits(enteredPin.trim()) !== normalizeDigits(masterPin.trim())) {
      alert('❌ کۆدی نهێنی بەڕێوەبەر هەڵەیە! کردارەکە ڕەتکرایەوە.');
      return;
    }

    if (window.confirm('ئایا بە تەواوی دڵنیایت لە گەڕاندنەوەی ڕێکخستنەکان بۆ باری سەرەتایی کارگە؟')) {
      onUpdateSettings(defaultSettings);
      saveSettings(defaultSettings);
      onNotify('ڕێکخستنەکان گەڕێندرانەوە بۆ باری بنەڕەتی.');
    }
  };

  // 5. Seed Realistic Demo Financial Data
  const handleSeedDemoData = () => {
    const masterPin = settings.adminPin || '9999';
    const enteredPin = prompt('⚠️ بۆ داخڵکردنی داتای نموونەیی، تکایە کۆدی نهێنی بەڕێوەبەر (Admin Master PIN) بنووسە:');
    if (enteredPin === null) return;

    if (normalizeDigits(enteredPin.trim()) !== normalizeDigits(masterPin.trim())) {
      alert('❌ کۆدی نهێنی بەڕێوەبەر هەڵەیە! کردارەکە ڕەتکرایەوە.');
      return;
    }

    if (window.confirm('ئایا دڵنیایت لە داخڵکردنی داتای نموونەیی دارایی؟ هەموو سەیارە، مێژووی شۆردن و خەرجییەکان نوێ دەکرێنەوە بۆ تاقیکردنەوەی قازانج و زەرەر.')) {
      seedRealisticDemoData();
      if (onDataImported) onDataImported();
      onNotify('📊 داتای نموونەیی دارایی بە سەرکەوتوویی داخڵکرا.');
    }
  };

  // 6. Clean Production Reset (سفرکردنەوەی تەواوی داتای تێست بۆ دەستپێکردنی کاری غەسلی حەقیقی)
  const handleCleanProductionReset = () => {
    const masterPin = settings.adminPin || '9999';
    const enteredPin = prompt('⚠️ بۆ سفرکردنەوەی تەواوی سیستەم بۆ دەستپێکردنی کاری غەسلی حەقیقی، تکایە کۆدی نهێنی بەڕێوەبەر (Admin Master PIN) بنووسە:');
    if (enteredPin === null) return;

    if (normalizeDigits(enteredPin.trim()) !== normalizeDigits(masterPin.trim())) {
      alert('❌ کۆدی نهێنی بەڕێوەبەر هەڵەیە! کردارەکە ڕەتکرایەوە.');
      return;
    }

    if (window.confirm('ئایا بە تەواوی دڵنیایت لە سفرکردنەوەی تەواوی سەیارەکان، تابلۆ تێستەکان، مێژووی شۆردن و فرۆش و خەرجییەکان؟ ئەمە تەواوی داتای تاقیکردنەوە دەسڕێتەوە و سیستەمەکە بە خاوێنی بۆ دەستپێکردنی ڕۆژی یەکەمی غەسل ئامادە دەکات.')) {
      resetToCleanProduction();
      if (onDataImported) onDataImported();
      onNotify('✨ سیستەمەکە بە سەرکەوتوویی سفر کرایەوە و ئامادەیە بۆ بەکارهێنانی حەقیقی لە غەسلدا.');
    }
  };

  // Calculations for Overheads Insight
  const monthlyRent = Number(settings.monthlyRent) || 600000;
  const dailyRent = Math.round(monthlyRent / 30);
  const dailyUtilities = Number(settings.dailyUtilities) || 12000;
  const averageMaterialCost = Number(settings.averageMaterialCostPerWash) || 1500;
  const dailyFixedCosts = dailyRent + dailyUtilities;
  const avgWashPrice = 10000;
  const marginPerWash = Math.max(1000, avgWashPrice - averageMaterialCost);
  const breakEvenCarsPerDay = Math.ceil(dailyFixedCosts / marginPerWash);

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in select-none" dir="rtl">
      {/* ---------------- TOP MASTER HEADER ---------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 rounded-3xl shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              کۆنترۆڵ و ڕێکخستنە گشتییەکانی سیستەم
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              بەڕێوەبردنی تەواوی زانیارییەکانی غەسل، پسوولەی چاپ، هۆڵەکان، لۆیەڵتی، نرخەکان و پاراستنی داتا.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            onClick={() => onNotify('✅ هەموو ڕێکخستنەکان بە سەرکەوتوویی پاشەکەوت کران.')}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl transition text-xs shadow-md shadow-blue-500/20 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Save className="w-4 h-4" />
            پاشەکەوتکردن
          </button>
        </div>
      </div>

      {/* ---------------- NAVIGATION TABS BAR ---------------- */}
      <div className="flex items-center gap-2 overflow-x-auto p-2 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
        {[
          { id: 'identity', label: '١. زانیاری و براندینگی غەسل', icon: Sparkles, color: 'text-indigo-600' },
          { id: 'receipt', label: '٢. پسوولەی چاپ و پرینتەر', icon: Printer, color: 'text-sky-600' },
          { id: 'bays', label: '٣. هۆڵەکانی شۆردن و توانا', icon: Layers, color: 'text-cyan-600' },
          { id: 'rent_costs', label: '٤. کرێ و خەرجییە نەگۆڕەکان', icon: Building2, color: 'text-amber-600' },
          { id: 'pricing', label: `٥. دەستکاریکردنی نرخ (${services.length})`, icon: Car, color: 'text-emerald-600' },
          { id: 'loyalty', label: '٦. لۆیەڵتی، PIN و ئاسایش', icon: Shield, color: 'text-purple-600' },
          { id: 'backup', label: '٧. باکئەپ و هەناردەی Excel', icon: Database, color: 'text-rose-600' },
          { id: 'appearance', label: '٨. شێوازی دەرکەوتن (Theme)', icon: Palette, color: 'text-amber-500' },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2.5 rounded-xl font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-sm border border-slate-200 dark:border-slate-600 ring-1 ring-blue-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-700/60 border border-transparent'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600 dark:text-blue-300' : tab.color}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ============================================================== */}
      {/* 1. IDENTITY & BRANDING (زانیاری و ناسنامەی غەسلەکە)             */}
      {/* ============================================================== */}
      {activeTab === 'identity' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 space-y-6 shadow-xs text-xs text-slate-900 dark:text-white">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-800">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">زانیاری فەرمی و براندینگی شوێن (Brand & Identity)</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                ئەم زانیارییانە لە سەرووی پسوولەکان، نامەی واتسئاپ و پۆرتاڵی کڕیار نیشان دەدرێن.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-slate-700 dark:text-slate-300 font-bold block text-xs">ناوی فەرمی غەسلەکە (Car Wash Name):</label>
              <input
                type="text"
                value={settings.carWashName}
                onChange={(e) => handleChange('carWashName', e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold text-sm focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-slate-700 dark:text-slate-300 font-bold block text-xs">دروشم یان سلاوگەن (Slogan):</label>
              <input
                type="text"
                placeholder="نموونە: پاکوخاوێنی ئۆتۆمبێلەکەت متمانەی ئێمەیە"
                value={settings.carWashSlogan || ''}
                onChange={(e) => handleChange('carWashSlogan', e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-700 dark:text-slate-300 font-bold block text-xs flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                ژمارەی تەلەفۆن / پەیوەندی:
              </label>
              <input
                type="text"
                value={settings.carWashPhone}
                onChange={(e) => handleChange('carWashPhone', e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-700 dark:text-slate-300 font-bold block text-xs flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                کاتی کارکردنی ڕۆژانە (Business Hours):
              </label>
              <input
                type="text"
                placeholder="08:00 AM - 10:00 PM"
                value={settings.businessHours || '08:00 AM - 10:00 PM'}
                onChange={(e) => handleChange('businessHours', e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 text-xs"
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-slate-700 dark:text-slate-300 font-bold block text-xs flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                ناونیشانی وردی غەسلەکە:
              </label>
              <input
                type="text"
                value={settings.carWashAddress}
                onChange={(e) => handleChange('carWashAddress', e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 text-xs"
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-slate-700 dark:text-slate-300 font-bold block text-xs flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                بەستەری ماڵپەڕ یان پۆرتاڵی کڕیار (System Web URL):
              </label>
              <input
                type="text"
                placeholder="وەک: https://royalcarwash.com (ئەگەر بەتاڵ بێت بەخۆکاری بەستەری کۆمپیوتەرەکەت وەردەگرێت)"
                value={settings.systemUrl || ''}
                onChange={(e) => handleChange('systemUrl', e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono text-xs focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
              />
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                ئەم بەستەرە ڕاستەوخۆ دەچێتە ناو پەیامی واتسئاپ بۆ کڕیار تا لە مۆبایلەوە دۆخی سەیارەکەی ببینێت.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. RECEIPT & PRINTER SETTINGS (پسوولەی چاپ و پرینتەر)            */}
      {/* ============================================================== */}
      {activeTab === 'receipt' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 space-y-6 shadow-xs text-xs text-slate-900 dark:text-white">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-200 dark:border-sky-800">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">ڕێکخستنی پسوولەی چاپ و پرینتەر (POS Thermal Receipt)</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                دیاریکردنی قەبارەی کاغەز، تێبینییەکانی گەرەنتی و شێوازی چاپی پسوولەکە.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Options */}
            <div className="space-y-4">
              <div>
                <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1 text-xs">قەبارەی کاغەزی پرینتەری گەرمی (Thermal Paper):</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: '80mm', label: '80mm (ستانداردی کاشێر)' },
                    { id: '58mm', label: '58mm (بچووک)' },
                  ].map((size) => (
                    <button
                      key={size.id}
                      type="button"
                      onClick={() => handleChange('receiptPrinterSize', size.id)}
                      className={`p-3 rounded-xl border font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer ${
                        (settings.receiptPrinterSize || '80mm') === size.id
                          ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Printer className="w-4 h-4" />
                      {size.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-700 dark:text-slate-300 font-bold block text-xs">
                  تێبینی و مەرجی کۆتایی پسوولە (Footer Guarantee Note):
                </label>
                <textarea
                  rows={3}
                  value={settings.receiptFooterNote || ''}
                  onChange={(e) => handleChange('receiptFooterNote', e.target.value)}
                  placeholder="وەک: سوپاس بۆ سەردانەکەت! مۆڵەت ٢٤ کاتژمێرە لە کاتی بارانباریندا بە هەمان پسوولە."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 leading-relaxed"
                />
              </div>

              {/* Toggles */}
              <div className="space-y-2.5 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-slate-700 dark:text-slate-300 font-medium">نیشاندانی ناوی وەستا لەسەر پسوولە:</span>
                  <input
                    type="checkbox"
                    checked={settings.showStaffOnReceipt !== false}
                    onChange={(e) => handleChange('showStaffOnReceipt', e.target.checked)}
                    className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-slate-700 dark:text-slate-300 font-medium">چاپکردنی خۆکاری پسوولە (Auto-Print on Pay):</span>
                  <input
                    type="checkbox"
                    checked={settings.autoPrintReceipt !== false}
                    onChange={(e) => handleChange('autoPrintReceipt', e.target.checked)}
                    className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                  />
                </label>
              </div>
            </div>

            {/* Live Mini Preview of Ticket (Keeps white paper card for authentic receipt display) */}
            <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl space-y-3">
              <span className="text-slate-700 dark:text-slate-300 font-bold block text-[11px] flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                پێشبینینی شێوازی پسوولە لەسەر کاغەز (Live Preview):
              </span>

              <div className="bg-white text-slate-900 p-4 rounded-xl font-mono text-[11px] space-y-2 border-2 border-dashed border-slate-300 max-w-[260px] mx-auto text-center shadow-md">
                <div className="border-b border-dashed border-slate-300 pb-2">
                  <h4 className="font-black text-xs font-sans">{settings.carWashName}</h4>
                  {settings.carWashSlogan && (
                    <p className="text-[9px] text-slate-500 italic font-sans">{settings.carWashSlogan}</p>
                  )}
                  <p className="text-[9px] text-slate-600 font-sans">{settings.carWashAddress}</p>
                  <p className="text-[9px] text-slate-600 font-mono">{settings.carWashPhone}</p>
                </div>

                <div className="py-1 border-b border-dashed border-slate-300 text-slate-800 font-sans text-right space-y-0.5 text-[10px]">
                  <div className="flex justify-between">
                    <span>ئۆتۆمبێل:</span>
                    <span className="font-bold">Toyota Camry</span>
                  </div>
                  <div className="flex justify-between">
                    <span>خزمەتگوزاری:</span>
                    <span className="font-bold text-emerald-700">شۆردنی تەواو</span>
                  </div>
                  {settings.showStaffOnReceipt !== false && (
                    <div className="flex justify-between">
                      <span>وەستا:</span>
                      <span className="font-bold">وەستا ڕێبوار</span>
                    </div>
                  )}
                </div>

                <div className="pt-1 text-[9px] text-slate-500 font-sans leading-tight">
                  <p className="font-bold text-slate-700">سوپاس بۆ سەردانەکەت!</p>
                  <p>{settings.receiptFooterNote || 'پەیڕەوی پاکوخاوێنی بەرزترین ستاندارد دەکەین.'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. BAYS & OPERATIONS CAPACITY (هۆڵەکانی شۆردن و توانا)          */}
      {/* ============================================================== */}
      {activeTab === 'bays' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 space-y-6 shadow-xs text-xs text-slate-900 dark:text-white">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400 flex items-center justify-center border border-cyan-200 dark:border-cyan-800">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">هۆڵەکانی شۆردن و ئامانجی ڕۆژانە (Bays & Capacity)</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                دیاریکردنی ژمارەی هۆڵە چالاکەکان و نیشاندانیان لە شاشەی کاشێر و تەلەفزیۆندا.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-2">
              <label className="text-slate-700 dark:text-slate-300 font-bold block">ژمارەی هۆڵە چالاکەکان (Active Bays):</label>
              <select
                value={settings.numberOfBays || 3}
                onChange={(e) => handleChange('numberOfBays', Number(e.target.value) || 3)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold text-sm focus:outline-none focus:border-blue-500"
              >
                <option value={1}>١ هۆڵی شۆردن</option>
                <option value={2}>٢ هۆڵی شۆردن</option>
                <option value={3}>٣ هۆڵی شۆردن (ستاندارد)</option>
                <option value={4}>٤ هۆڵی شۆردن</option>
                <option value={5}>٥ هۆڵی شۆردن</option>
                <option value={6}>٦ هۆڵی شۆردن</option>
              </select>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                لە شاشەی کاشێر و شاشەی تیڤی ئەم ژمارەیە لە هۆڵ بە ڕاستەوخۆ بەردەست دەبن.
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-2">
              <label className="text-slate-700 dark:text-slate-300 font-bold block">ئامانجی شۆردنی سەیارەی ڕۆژانە (Daily Target):</label>
              <input
                type="number"
                value={settings.dailyTargetCars || 35}
                onChange={(e) => handleChange('dailyTargetCars', Number(e.target.value) || 35)}
                className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold text-sm focus:outline-none focus:border-blue-500"
              />
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                داشبۆردی دارایی ئەم ئامانجە بەکاردەهێنێت بۆ پێوانەکردنی سەرکەوتنی کارەکە.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. RENT & OVERHEAD COSTS (کرێی شوێن و خەرجییە نەگۆڕەکان)       */}
      {/* ============================================================== */}
      {activeTab === 'rent_costs' && (
        <div className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60 rounded-3xl p-6 space-y-6 shadow-xs text-xs relative overflow-hidden text-slate-900 dark:text-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">کرێی شوێن و خەرجییە نەگۆڕەکان (Rent & Overhead Costs)</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  کرێی شوێن و وزە لە داهات لێکدەدرێتەوە تا خاڵی قازانج و زیان بە وردی دیار بێت.
                </p>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 font-mono text-left">
              <span className="text-[9px] block text-amber-700 dark:text-amber-400 font-sans font-bold">تێچووی نەگۆڕی هەر ڕۆژێک:</span>
              <strong className="text-sm font-black">{formatIQD(dailyFixedCosts)}</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Monthly Rent */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-2">
              <label className="text-slate-700 dark:text-slate-300 block font-bold text-xs flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                کرێی مانگانەی شوێن (IQD):
              </label>
              <input
                type="number"
                step="50000"
                value={settings.monthlyRent ?? 600000}
                onChange={(e) => handleChange('monthlyRent', Number(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold text-sm focus:outline-none focus:border-amber-500"
              />
              <div className="text-[10px] text-slate-500 dark:text-slate-400 flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
                <span>تێچووی ڕۆژانە (ڕووبەر ١,٠٧٠ م²):</span>
                <span className="text-amber-700 dark:text-amber-400 font-mono font-bold">{formatIQD(dailyRent)}</span>
              </div>
            </div>

            {/* Daily Energy & Utilities */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-2">
              <label className="text-slate-700 dark:text-slate-300 block font-bold text-xs flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                تێچووی ڕۆژانەی ئاو و کارەبا و مۆلیدە:
              </label>
              <input
                type="number"
                step="1000"
                value={settings.dailyUtilities ?? 12000}
                onChange={(e) => handleChange('dailyUtilities', Number(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold text-sm focus:outline-none focus:border-blue-500"
              />
              <div className="text-[10px] text-slate-500 dark:text-slate-400 flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
                <span>مەزەندەی مانگانە:</span>
                <span className="text-blue-700 dark:text-blue-400 font-mono font-bold">{formatIQD(dailyUtilities * 30)}</span>
              </div>
            </div>

            {/* Consumables Cost per Car */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-2">
              <label className="text-slate-700 dark:text-slate-300 block font-bold text-xs flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                تێچووی مەواد و شامپۆ بۆ هەر سەیارەیەک:
              </label>
              <input
                type="number"
                step="250"
                value={settings.averageMaterialCostPerWash ?? 1500}
                onChange={(e) => handleChange('averageMaterialCostPerWash', Number(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold text-sm focus:outline-none focus:border-emerald-500"
              />
              <div className="text-[10px] text-slate-500 dark:text-slate-400 flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
                <span>تێچووی مەواد بۆ ٢٠ سەیارە:</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-mono font-bold">{formatIQD(averageMaterialCost * 20)}</span>
              </div>
            </div>
          </div>

          {/* Smart Financial Insight Card */}
          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-amber-900 dark:text-amber-200">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>
                <strong>خاڵی سەرکەوتنی دارایی (Break-Even):</strong> پێویستە ڕۆژانە بەلایەنی کەمەوە{' '}
                <strong className="text-slate-900 dark:text-white text-xs font-bold">{breakEvenCarsPerDay} سەیارە</strong> بشۆیت بۆ داپۆشینی تەواوی کرێی شوێن و ئاو و کارەبا پێش ئەوەی قازانجی سافی دەستپێبکات.
              </span>
            </div>
          </div>

          {/* Garage & Parking Settings */}
          <div className="p-5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
              <Building2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                ڕێکخستنەکانی بەشی گەراج و پارکیک (Garage Settings)
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Capacity */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">
                  توانای گەراج (ژمارەی شوێن):
                </label>
                <input
                  type="number"
                  min="5"
                  max="100"
                  value={settings.garageCapacity ?? 30}
                  onChange={(e) => handleChange('garageCapacity', Number(e.target.value) || 30)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs font-bold"
                />
              </div>

              {/* Daily Rate */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">
                  نرخی وەستان (ڕۆژانە):
                </label>
                <input
                  type="number"
                  step="250"
                  value={settings.garageDailyRate ?? 1000}
                  onChange={(e) => handleChange('garageDailyRate', Number(e.target.value) || 1000)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs font-bold"
                />
              </div>

              {/* Overnight Rate */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">
                  نرخی وەستان (شەوانە):
                </label>
                <input
                  type="number"
                  step="500"
                  value={settings.garageOvernightRate ?? 3000}
                  onChange={(e) => handleChange('garageOvernightRate', Number(e.target.value) || 3000)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs font-bold"
                />
              </div>

              {/* Monthly Rate */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">
                  نرخی بەشداری مانگانە:
                </label>
                <input
                  type="number"
                  step="1000"
                  value={settings.garageMonthlyRate ?? 25000}
                  onChange={(e) => handleChange('garageMonthlyRate', Number(e.target.value) || 25000)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs font-bold"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. SERVICES & PRICING MANAGEMENT (دەستکاریکردنی نرخ)            */}
      {/* ============================================================== */}
      {activeTab === 'pricing' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 space-y-6 shadow-xs text-xs text-slate-900 dark:text-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  دەستکاریکردنی نرخی شۆردنی سەیارە و خزمەتگوزارییەکان ({services.length} خزمەتگوزاری)
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  گۆڕینی نرخی شۆردن بەپێی قەبارەی سەیارە (سالۆن، جیپ، پیکاب) و کاتی پێویست.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsAddingService(!isAddingService)}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition flex items-center gap-1.5 text-xs shadow-xs"
            >
              <Plus className="w-4 h-4" />
              {isAddingService ? 'داخستنی فۆرم' : 'زیادکردنی خزمەتگوزاری نوێ'}
            </button>
          </div>

          {/* Form: Add New Service */}
          {isAddingService && (
            <form onSubmit={handleAddService} className="p-5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-4 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  زیادکردنی خزمەتگوزاری نوێ
                </h4>
                <button type="button" onClick={() => setIsAddingService(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-700 dark:text-slate-300 font-bold block text-[11px]">ناوی خزمەتگوزاری:</label>
                  <input
                    type="text"
                    required
                    placeholder="وەک: شۆردنی VIP و کەف"
                    value={newServiceName}
                    onChange={(e) => setNewServiceName(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 dark:text-slate-300 font-bold block text-[11px]">پۆڵێن / جۆر:</label>
                  <select
                    value={newServiceCategory}
                    onChange={(e) => setNewServiceCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                  >
                    <option value="سەیارە">شۆردنی سەیارە</option>
                    <option value="پۆڵیش و نانۆ سێرامیک">پۆڵیش و نانۆ سێرامیک</option>
                    <option value="شۆردنی فەرش">شۆردنی فەرش</option>
                    <option value="شۆردنی قەنەفە">شۆردنی قەنەفە</option>
                    <option value="خزمەتگوزاری تر">خزمەتگوزاری تر</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 dark:text-slate-300 font-bold block text-[11px]">ماوەی شۆردن (خولەک):</label>
                  <input
                    type="number"
                    value={newServiceDuration}
                    onChange={(e) => setNewServiceDuration(Number(e.target.value) || 30)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                  />
                </div>
              </div>

              {/* Sized Pricing inputs */}
              {newServiceCategory === 'سەیارە' || newServiceCategory === 'پۆڵیش و نانۆ سێرامیک' ? (
                <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <span className="text-[11px] text-slate-700 dark:text-slate-300 font-bold block">نرخەکان بەپێی قەبارەی سەیارە (IQD):</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">سالۆن (بچووک):</label>
                      <input
                        type="number"
                        step="1000"
                        value={newServiceSedanPrice}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 0;
                          setNewServiceSedanPrice(val);
                          setNewServicePrice(val);
                        }}
                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono text-xs focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">جیپ (SUV / 4x4):</label>
                      <input
                        type="number"
                        step="1000"
                        value={newServiceSuvPrice}
                        onChange={(e) => setNewServiceSuvPrice(Number(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono text-xs focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">بارهەڵگر / پیکاب:</label>
                      <input
                        type="number"
                        step="1000"
                        value={newServiceTruckPrice}
                        onChange={(e) => setNewServiceTruckPrice(Number(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono text-xs focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-slate-700 dark:text-slate-300 font-bold block text-[11px]">نرخی بنەڕەتی (IQD):</label>
                  <input
                    type="number"
                    step="500"
                    value={newServicePrice}
                    onChange={(e) => setNewServicePrice(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300 font-bold block text-[11px]">وەسف و کورتەی خزمەتگوزاری:</label>
                <input
                  type="text"
                  placeholder="وەک: کەفی نانۆ، ژێرەوە و تایەر و ویل، بۆنکردن..."
                  value={newServiceDesc}
                  onChange={(e) => setNewServiceDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition text-xs shadow-xs"
              >
                تۆمارکردنی خزمەتگوزاری
              </button>
            </form>
          )}

          {/* List of Existing Services with Live Editing */}
          <div className="space-y-3">
            {services.map((srv) => {
              const hasSizes = !!srv.pricesBySize;
              return (
                <div
                  key={srv.id}
                  className="p-4 bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 rounded-2xl space-y-3 hover:border-slate-300 dark:hover:border-slate-600 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-700/80 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-bold">
                        {srv.category || 'سەیارە'}
                      </span>
                      <input
                        type="text"
                        value={srv.name}
                        onChange={(e) => handleServiceChange(srv.id, 'name', e.target.value)}
                        className="bg-transparent text-slate-900 dark:text-white font-bold text-sm focus:outline-none focus:bg-white dark:focus:bg-slate-900 px-2 py-0.5 rounded border border-transparent focus:border-slate-300 dark:focus:border-slate-600"
                      />
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                        <Clock className="w-3.5 h-3.5" />
                        <input
                          type="number"
                          value={srv.durationMinutes || 30}
                          onChange={(e) => handleServiceChange(srv.id, 'durationMinutes', Number(e.target.value) || 30)}
                          className="w-12 px-1.5 py-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-center text-slate-900 dark:text-white font-mono text-xs"
                        />
                        <span>خولەک</span>
                      </div>

                      <button
                        onClick={() => handleDeleteService(srv.id, srv.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                        title="سڕینەوەی ئەم خزمەتگوزارییە"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Pricing Inputs */}
                  {hasSizes ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-white dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div>
                        <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">سەیارەی ساڵۆن (Sedan):</label>
                        <input
                          type="number"
                          step="1000"
                          value={srv.pricesBySize?.sedan ?? srv.price}
                          onChange={(e) => handleServicePriceBySizeChange(srv.id, 'sedan', Number(e.target.value) || 0)}
                          className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-emerald-700 dark:text-emerald-400 font-mono font-bold text-xs focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">سەیارەی بەرز (SUV):</label>
                        <input
                          type="number"
                          step="1000"
                          value={srv.pricesBySize?.suv ?? srv.price + 5000}
                          onChange={(e) => handleServicePriceBySizeChange(srv.id, 'suv', Number(e.target.value) || 0)}
                          className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-emerald-700 dark:text-emerald-400 font-mono font-bold text-xs focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">پیکاب / بارهەڵگر:</label>
                        <input
                          type="number"
                          step="1000"
                          value={srv.pricesBySize?.truck ?? srv.price + 10000}
                          onChange={(e) => handleServicePriceBySizeChange(srv.id, 'truck', Number(e.target.value) || 0)}
                          className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-emerald-700 dark:text-emerald-400 font-mono font-bold text-xs focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-900/80 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">نرخی خزمەتگوزاری:</span>
                      <input
                        type="number"
                        step="500"
                        value={srv.price}
                        onChange={(e) => handleServiceChange(srv.id, 'price', Number(e.target.value) || 0)}
                        className="px-3 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-emerald-700 dark:text-emerald-400 font-mono font-bold text-xs focus:bg-white dark:focus:bg-slate-800 focus:outline-none"
                      />
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">دینار / {srv.unit || 'سەیارە'}</span>
                    </div>
                  )}

                  <div>
                    <input
                      type="text"
                      placeholder="وەسفی کورت..."
                      value={srv.description || ''}
                      onChange={(e) => handleServiceChange(srv.id, 'description', e.target.value)}
                      className="w-full text-[11px] text-slate-600 dark:text-slate-300 bg-transparent border-b border-transparent focus:border-slate-300 dark:focus:border-slate-600 focus:outline-none py-1"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 6. LOYALTY, REWARDS, PIN & WHATSAPP (لۆیەڵتی و ئاسایش)         */}
      {/* ============================================================== */}
      {activeTab === 'loyalty' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 space-y-6 shadow-xs text-xs text-slate-900 dark:text-white">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-200 dark:border-purple-800">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">یاساکانی لۆیەڵتی، پاداشت و ئاسایش (Loyalty & Security)</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                مەرجەکانی شۆردنی بەخۆڕایی، ماوەی بەسەرچوونی خاڵەکان و کۆدە نهێنییەکان.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Staff PIN */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-2xl space-y-2">
              <label className="text-slate-700 dark:text-slate-300 font-bold block flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                کۆدی نهێنی کاشێر و ستاف (Staff PIN):
              </label>
              <input
                type="text"
                maxLength={6}
                value={settings.staffPin}
                onChange={(e) => handleChange('staffPin', e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-base font-mono text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 tracking-widest text-center"
              />
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                بەکاردێت لە کاتی سکانکردنی ستیکەری NFC لەلایەن ستافەوە.
              </p>
            </div>

            {/* Admin PIN */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-2xl space-y-2">
              <label className="text-slate-700 dark:text-slate-300 font-bold block flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-rose-500" />
                کۆدی نهێنی بەڕێوەبەر (Admin Master PIN):
              </label>
              <input
                type="text"
                maxLength={6}
                value={settings.adminPin || '9999'}
                onChange={(e) => handleChange('adminPin', e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-base font-mono text-slate-900 dark:text-white focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 tracking-widest text-center"
              />
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                بۆ ڕێگریکردن لە دەستکاریکردنی نرخی شۆردن و ڕێکخستنە هەستیارەکان.
              </p>
            </div>

            {/* Expiry Days */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-2xl space-y-2">
              <label className="text-slate-700 dark:text-slate-300 font-bold block">مەرجی بەسەرچوونی لۆیەڵتی (ڕۆژ):</label>
              <input
                type="number"
                value={settings.expiryDaysLimit}
                onChange={(e) => handleChange('expiryDaysLimit', Number(e.target.value) || 15)}
                className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
              />
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                ئەگەر کڕیار زیاتر لەم ژمارە ڕۆژە سەردان نەکات، شۆردنە کەڵەکەبووەکانی بەسەردەچن.
              </p>
            </div>

            {/* Washes for Free */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-2xl space-y-2">
              <label className="text-slate-700 dark:text-slate-300 font-bold block">شۆردنی پێویست بۆ شۆردنی بەخۆڕایی:</label>
              <input
                type="number"
                value={settings.washesNeededForFree}
                onChange={(e) => handleChange('washesNeededForFree', Number(e.target.value) || 4)}
                className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
              />
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                دانانی ٤ واتە: لە ٥ـەم شۆردندا پارە وەرناگیرێت (٤+١ بەخۆڕایی).
              </p>
            </div>

            {/* VIP Discount */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-2xl space-y-2">
              <label className="text-slate-700 dark:text-slate-300 font-bold block flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                داشکاندنی تایبەت بە کڕیارانی بەردەوام (VIP Discount %):
              </label>
              <input
                type="number"
                value={settings.vipDiscountPercent || 10}
                onChange={(e) => handleChange('vipDiscountPercent', Number(e.target.value) || 0)}
                className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                داشکاندن بە ڕێژەی سەدی بۆ ئەو سەیارانەی زیاتر لە ١٠ جار شۆردراون.
              </p>
            </div>

            {/* WhatsApp Integration Toggle */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-2xl flex flex-col justify-between">
              <label className="text-slate-700 dark:text-slate-300 font-bold block flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                ناردنی پەیامی واتسئاپ لە کاتی تەواوبوون:
              </label>
              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-500 dark:text-slate-400 text-xs">پەیوەندی بە واتسئاپ کارایە</span>
                <input
                  type="checkbox"
                  checked={settings.enableWhatsAppNotification !== false}
                  onChange={(e) => handleChange('enableWhatsAppNotification', e.target.checked)}
                  className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
                />
              </div>
            </div>

            {/* Happy Hour Off-Peak Discounts Settings */}
            <div className="col-span-1 sm:col-span-2 p-5 bg-gradient-to-br from-amber-50 to-orange-50/50 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200/80 dark:border-amber-800/60 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    ⚡
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                      ئۆفەری کاتی زێڕین / کاتە کەم سەردانەکان (Happy Hour / Off-Peak Discount)
                    </h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      داشکاندنی خۆکار لە کاتە خاڵییەکاندا (بۆ نموونە پێش نیوەڕوان) بۆ ڕاکێشانی کڕیاران و پڕکردنەوەی هۆڵەکان
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.happyHourEnabled || false}
                    onChange={(e) => handleChange('happyHourEnabled', e.target.checked)}
                    className="w-5 h-5 accent-amber-600 rounded cursor-pointer"
                  />
                </label>
              </div>

              {settings.happyHourEnabled && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-amber-200/60 dark:border-amber-800/40 animate-in fade-in">
                  <div>
                    <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1">کاتی دەستپێکردن:</label>
                    <input
                      type="time"
                      value={settings.happyHourStart || '09:00'}
                      onChange={(e) => handleChange('happyHourStart', e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1">کاتی کۆتایی:</label>
                    <input
                      type="time"
                      value={settings.happyHourEnd || '12:00'}
                      onChange={(e) => handleChange('happyHourEnd', e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1">ڕێژەی داشکاندن (%):</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={settings.happyHourDiscountPercent || 15}
                        onChange={(e) => handleChange('happyHourDiscountPercent', Number(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Google Maps Review Booster & Owner Phone */}
            <div className="col-span-1 sm:col-span-2 p-5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-2xl space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center justify-center font-bold">
                  ⭐️
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                    بەرزکردنەوەی ناوبانگ لە Google Maps و مۆبایلی خاوەنکار
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    کڕیار لە کاتی شۆردندا هەڵسەنگاندن دەدات؛ ٥ ئەستێرەکان دەچنە سەر Google Mapsی غەسلەکە
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1">لینکی Google Mapsی غەسلەکەت:</label>
                  <input
                    type="url"
                    value={settings.googleMapsReviewUrl || ''}
                    onChange={(e) => handleChange('googleMapsReviewUrl', e.target.value)}
                    placeholder="https://maps.app.goo.gl/..."
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    ئەو لینکەی کڕیار بە کلیکێک دەچێتە سەر نووسینی ڕای ٥ ئەستێرە.
                  </p>
                </div>

                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1">مۆبایلی تایبەتی خاوەنکار (بۆ ڕاپۆرتی Z-Report):</label>
                  <input
                    type="tel"
                    value={settings.ownerPhone || ''}
                    onChange={(e) => handleChange('ownerPhone', e.target.value)}
                    placeholder="0770 000 0000"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    کورتەی شەوانەی سندووق ڕاستەوخۆ بە واتسئاپ بۆ ئەم ژمارەیە دەنێردرێت.
                  </p>
                </div>
              </div>
            </div>

            {/* VIP Unlimited Subscription Plans Pricing */}
            <div className="col-span-1 sm:col-span-2 p-5 bg-gradient-to-br from-purple-50 to-indigo-50/50 dark:from-purple-950/30 dark:to-indigo-950/20 border border-purple-200/80 dark:border-purple-800/60 rounded-2xl space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  👑
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                    نرخی پاکێجەکانی ئەندامێتی VIP مانگانە (Unlimited Wash Subscriptions)
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    دیاریکردنی نرخی فرۆشتنی کارتی ئەندامێتی مانگانە و وەرزانە
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1">نرخی ئابوونەی ١ مانگ (IQD):</label>
                  <input
                    type="number"
                    value={settings.vipMonthlyPlanPrice || 50000}
                    onChange={(e) => handleChange('vipMonthlyPlanPrice', Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1">نرخی ئابوونەی ٣ مانگ (وەرزانە - IQD):</label>
                  <input
                    type="number"
                    value={settings.vipQuarterlyPlanPrice || 130000}
                    onChange={(e) => handleChange('vipQuarterlyPlanPrice', Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>

            {/* Telegram Bot Automated Owner Notification */}
            <div className="col-span-1 sm:col-span-2 p-5 bg-gradient-to-br from-sky-50 to-blue-50/50 dark:from-sky-950/30 dark:to-blue-950/20 border border-sky-200/80 dark:border-sky-800/60 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    🤖
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                      بۆتی تێلێگرام بۆ ناردنی ڕاپۆرتی ڕۆژانەی Z (Telegram Auto-Report)
                    </h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      هەموو شەوێک لە کاتی داخستنی سندوق، ڕاپۆرتێکی تێروتەسەل ڕاستەوخۆ دەچێتە تێلێگرامی خاوەن غەسل
                    </p>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">چالاککردنی بۆت:</span>
                  <input
                    type="checkbox"
                    checked={settings.telegramBotEnabled || false}
                    onChange={(e) => handleChange('telegramBotEnabled', e.target.checked)}
                    className="w-5 h-5 accent-sky-600 rounded cursor-pointer"
                  />
                </label>
              </div>

              {settings.telegramBotEnabled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1">
                      تۆکنی بۆت (Bot Token لە @BotFather):
                    </label>
                    <input
                      type="text"
                      value={settings.telegramBotToken || ''}
                      onChange={(e) => handleChange('telegramBotToken', e.target.value)}
                      placeholder="123456789:ABCdefGHIjk-lmn..."
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      تۆکنی بۆتی خۆت لە @BotFather وەربگرە.
                    </p>
                  </div>

                  <div>
                    <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1">
                      چات ئایدی (Chat ID یان کەناڵ):
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={settings.telegramChatId || ''}
                        onChange={(e) => handleChange('telegramChatId', e.target.value)}
                        placeholder="123456789 یان @channel_id"
                        className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                      />
                      <button
                        type="button"
                        onClick={handleTestTelegram}
                        className="px-3 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        تاقیکردنەوە
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      ئایدی هەژماری تێلێگرامەکەت لە @userinfobot وەربگرە.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 7. BACKUP, RESTORE & DATA EXPORT (باکئەپ و هەناردەکردن)       */}
      {/* ============================================================== */}
      {activeTab === 'backup' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 space-y-6 shadow-xs text-xs text-slate-900 dark:text-white">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-800">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">پاراستنی داتاکان، باکئەپ و هەناردە (Backup & Data Protection)</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">بۆ ئەوەی هیچ کات مێژووی غەسلەکەت نەفەوتێت لە کاتی فۆرمات یان کڕینی کۆمپیوتەری نوێ.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowBackupModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition"
            >
              <Database className="w-4 h-4" />
              <span>هەناردەی فرە-فایلی Excel و باکئەپ</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Export JSON */}
            <div className="p-5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-2xl space-y-3 flex flex-col justify-between">
              <div>
                <span className="font-bold text-slate-900 dark:text-white text-xs block flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  ١. داگرتنی فایلی تەواوی باکئەپ (JSON):
                </span>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  هەموو سەیارەکان، مێژووی شۆردن، وەستاکان، مەخزەن، خەرجی و ڕێکخستنەکان لە یەک فایلی پارێزراودا دەپارێزرێن.
                </p>
              </div>
              <button
                onClick={handleExportBackup}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-xs"
              >
                <Download className="w-4 h-4" />
                داگرتنی باکئەپی تەواو (JSON)
              </button>
            </div>

            {/* Import JSON */}
            <div className="p-5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-2xl space-y-3 flex flex-col justify-between">
              <div>
                <span className="font-bold text-slate-900 dark:text-white text-xs block flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  ٢. گەڕاندنەوەی باکئەپ لە فایل (Restore):
                </span>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  ئەگەر کۆمپیوتەرت گۆڕی یان فۆرمات کرا، فایلی باکئەپەکە هەڵبژێرە تا هەموو داتاکان وەک خۆیان بگەڕێنەوە.
                </p>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                onChange={handleImportBackup}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-xs"
              >
                <Upload className="w-4 h-4" />
                گەڕاندنەوەی باکئەپ لە فایل
              </button>
            </div>
          </div>

          {/* Financial Excel / CSV Export */}
          <div className="p-5 bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                هەناردەکردنی ڕاپۆرتی دارایی بۆ Excel / CSV
              </span>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                ڕاپۆرتێکی گشتی و ورد لە هەموو شۆردنەکان، داهات و خەرجییەکان بۆ ژمێریاری و وردبینی بە زمانی کوردی.
              </p>
            </div>
            <button
              onClick={handleExportFinancialCSV}
              className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 shrink-0 shadow-xs"
            >
              <Download className="w-4 h-4" />
              داگرتنی فایلی Excel
            </button>
          </div>

          {/* Fresh Production Reset Card */}
          <div className="p-5 bg-gradient-to-r from-emerald-50/90 to-teal-50/90 dark:from-emerald-950/40 dark:to-teal-950/40 border-2 border-emerald-300 dark:border-emerald-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="font-bold text-emerald-950 dark:text-emerald-200 text-xs flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                سفرکردنەوە و ئامادەکردن بۆ غەسلی حەقیقی (Fresh Production Reset)
              </span>
              <p className="text-[11px] text-emerald-900/80 dark:text-emerald-300/80 leading-relaxed">
                سڕینەوەی تەواوی سەیارەکان، تابلۆ تێستەکان، مێژووی شۆردنی تاقیکردنەوە و خەرجییەکان. ئەمە سیستەمەکە دەکاتە دۆخی سپی (Clean Slate) بۆ ئەوەی غەسلەکە دەست بە تۆمارکردنی کڕیار و داهاتی حەقیقی خۆی بکات بەبێ ئەوەی نرخ و خزمەتگوزارییەکان تێکبچن.
              </p>
            </div>
            <button
              onClick={handleCleanProductionReset}
              className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 shrink-0 shadow-sm cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              سفرکردنەوە بۆ غەسلی حەقیقی
            </button>
          </div>

          {/* Demo Data Seeder */}
          <div className="p-5 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200/90 dark:border-blue-800/60 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="font-bold text-blue-950 dark:text-blue-200 text-xs flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                داخڵکردنی داتای نموونەیی دارایی و سەیارەکان (Demo Financial Data)
              </span>
              <p className="text-[11px] text-blue-900/80 dark:text-blue-300/80 leading-relaxed">
                بارکردنی پاکێجێکی گشتگیر لە ١٦ سەیارە (سلێمانی، هەولێر، دهۆک، کەرکووک)، خەرجییەکان، وەستاکان و شۆردنی ٧ ڕۆژی ڕابردوو بۆ ئەزموونکردنی ڕاستەوخۆی قازانج و زەرەر.
              </p>
            </div>
            <button
              onClick={handleSeedDemoData}
              className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 shrink-0 shadow-xs cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              داخڵکردنی داتای نموونەیی
            </button>
          </div>

          {/* Factory Reset Danger Zone */}
          <div className="p-4 bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 rounded-2xl flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <div>
                <span className="font-bold text-rose-900 dark:text-rose-200 block">گەڕاندنەوەی ڕێکخستنەکان بۆ باری سەرەتایی:</span>
                <span className="text-[10px] text-rose-700/80 dark:text-rose-300/70">ئەم بەشە تەنها ڕێکخستنەکان دەگەڕێنێتەوە باری کارگە، سەیارەکان ناسڕێتەوە.</span>
              </div>
            </div>
            <button
              onClick={handleResetSettings}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition flex items-center gap-1.5 shrink-0 shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              باری سەرەتایی
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 8. APPEARANCE & THEME (شێوازی دەرکەوتن و دارک مۆد)              */}
      {/* ============================================================== */}
      {activeTab === 'appearance' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 space-y-6 shadow-xs text-xs text-slate-900 dark:text-white">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800">
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  شێوازی دەرکەوتن و دارک مۆد (Theme & Appearance)
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  هەڵبژاردنی دۆخی ڕووناک (Light) یان تاریک (Dark Mode) بەپێی کات و ئارەزووی چاو.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Light Mode Card */}
            <div
              onClick={() => {
                if (onToggleTheme) onToggleTheme('light');
                handleChange('themeMode', 'light');
              }}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                currentTheme === 'light'
                  ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/30 shadow-md ring-2 ring-blue-500/20'
                  : 'border-slate-200/80 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100/80 dark:hover:bg-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-xs">
                    <Sun className="w-6 h-6" />
                  </div>
                  {currentTheme === 'light' ? (
                    <span className="px-3 py-1 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center gap-1 shadow-xs">
                      <Check className="w-3.5 h-3.5" />
                      چالاککراوە
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-slate-400">ناچالاک</span>
                  )}
                </div>

                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">☀️ دۆخی ڕووناک (Light Mode)</h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    ڕووکاری گەش و ڕووناک لەگەڵ ڕەنگی سپی کلاسیک، زۆر گونجاوە بۆ کارکردن لە ڕۆژدا لە هۆڵی پێشەوەی غەسل.
                  </p>
                </div>
              </div>

              <button
                type="button"
                className={`w-full py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 ${
                  currentTheme === 'light'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <Sun className="w-4 h-4" />
                {currentTheme === 'light' ? 'دۆخی هەڵبژێردراو' : 'گۆڕین بۆ دۆخی ڕووناک'}
              </button>
            </div>

            {/* Dark Mode Card */}
            <div
              onClick={() => {
                if (onToggleTheme) onToggleTheme('dark');
                handleChange('themeMode', 'dark');
              }}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                currentTheme === 'dark'
                  ? 'border-indigo-500 bg-slate-900 dark:bg-slate-800 text-white shadow-md ring-2 ring-indigo-500/30'
                  : 'border-slate-200/80 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100/80 dark:hover:bg-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-900/60 text-indigo-400 flex items-center justify-center shadow-xs border border-indigo-700/40">
                    <Moon className="w-6 h-6" />
                  </div>
                  {currentTheme === 'dark' ? (
                    <span className="px-3 py-1 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center gap-1 shadow-xs">
                      <Check className="w-3.5 h-3.5" />
                      چالاککراوە
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-slate-400">ناچالاک</span>
                  )}
                </div>

                <div>
                  <h4 className={`font-bold text-sm ${currentTheme === 'dark' ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                    🌙 دۆخی تاریک (Dark Mode)
                  </h4>
                  <p className={`text-[11px] mt-1 leading-relaxed ${currentTheme === 'dark' ? 'text-slate-300' : 'text-slate-600 dark:text-slate-300'}`}>
                    ڕووکاری شیک و ئارام بۆ چاو، کەمکردنەوەی تیشکی شاشە و ماندووبوونی چاو لە شەودا و پاشەکەوتکردنی وزەی شاشە.
                  </p>
                </div>
              </div>

              <button
                type="button"
                className={`w-full py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 ${
                  currentTheme === 'dark'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-800 dark:bg-slate-700 text-white hover:bg-slate-900 dark:hover:bg-slate-600'
                }`}
              >
                <Moon className="w-4 h-4" />
                {currentTheme === 'dark' ? 'دۆخی هەڵبژێردراو' : 'گۆڕین بۆ دۆخی تاریک'}
              </button>
            </div>
          </div>

          {/* Quick Info Alert */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-indigo-500 shrink-0" />
            <span>
              <strong>تێبینی:</strong> دەتوانیت لە هەر شوێنێک بیت بە کلیک لەسەر دوگمەی خۆر/مانگ (☀️/🌙) لە سەرەوەی شاشەکە ڕاستەوخۆ دۆخەکە بگۆڕیت بێ ئەوەی پێویست بکات بێیتە ناو ئەم ڕێکخستنە.
            </span>
          </div>
        </div>
      )}

      {/* Backup & Data Hub Modal */}
      {showBackupModal && (
        <BackupManagerModal
          settings={settings}
          onClose={() => setShowBackupModal(false)}
          onDataRestored={onDataImported}
          onNotify={onNotify}
        />
      )}
    </div>
  );
};
