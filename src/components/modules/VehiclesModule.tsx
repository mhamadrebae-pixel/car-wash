'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Vehicle,
  LicensePlate,
  PlateType,
  AppSettings,
  VehicleSize,
  ServiceItem,
  StaffMember,
  WashRecord,
} from '@/types';
import { VehicleSectionKey } from '@/components/layout/Sidebar';
import { PlateDisplay } from '@/components/ui/PlateDisplay';
import { ReceiptModal } from '@/components/ui/ReceiptModal';
import { NfcStickerModal } from '@/components/ui/NfcStickerModal';
import { SubscriptionModal } from '@/components/ui/SubscriptionModal';
import {
  OFFICIAL_PROVINCES,
  OLD_PLATE_CITIES,
  OLD_PLATE_CATEGORIES,
} from '@/constants/provinces';
import {
  formatIQD,
  isNfcExpired,
  calculateDaysSince,
  normalizeDigits,
  getVehicleTotalDebt,
  settleVehicleDebt,
} from '@/lib/storage';
import {
  generateInactivityReminderMessage,
  openWhatsAppChat,
} from '@/lib/whatsapp';
import {
  Car,
  Plus,
  Trash2,
  Search,
  ExternalLink,
  Sparkles,
  Phone,
  User,
  Clock,
  MessageCircle,
  Edit,
  SlidersHorizontal,
  Table as TableIcon,
  LayoutGrid,
  ArrowUpDown,
  Filter,
  CheckCircle2,
  ShieldCheck,
  ChevronDown,
  X,
  Share2,
  History,
  Gift,
  AlertTriangle,
  ArrowRight,
  Printer,
  Check,
  Star,
  RefreshCw,
  Award,
  Zap,
  Wifi,
  Coins,
  Crown,
} from 'lucide-react';

interface VehiclesModuleProps {
  vehicles: Vehicle[];
  settings: AppSettings;
  services?: ServiceItem[];
  staff?: StaffMember[];
  activeSection?: VehicleSectionKey;
  onSectionChange?: (section: VehicleSectionKey) => void;
  onUpdateVehicles: (vehicles: Vehicle[]) => void;
  onNotify: (msg: string) => void;
}

export const VehiclesModule: React.FC<VehiclesModuleProps> = ({
  vehicles,
  settings,
  services = [],
  staff = [],
  activeSection,
  onSectionChange,
  onUpdateVehicles,
  onNotify,
}) => {
  // Internal active section fallback if not controlled from parent
  const [internalSection, setInternalSection] = useState<VehicleSectionKey>('registry');
  const currentSection = activeSection || internalSection;

  const setCurrentSection = (sec: VehicleSectionKey) => {
    if (onSectionChange) {
      onSectionChange(sec);
    } else {
      setInternalSection(sec);
    }
  };

  // View mode in Registry: 'table' vs 'cards'
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Search & Filters in Registry
  const [search, setSearch] = useState('');
  const [sizeFilter, setSizeFilter] = useState<'all' | 'sedan' | 'suv' | 'truck'>('all');
  const [loyaltyFilter, setLoyaltyFilter] = useState<'all' | 'free_ready' | 'debt' | 'active' | 'expired'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'washes' | 'name'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // History Tab Filter & Search
  const [historySearch, setHistorySearch] = useState('');
  const [historyTypeFilter, setHistoryTypeFilter] = useState<'all' | 'free' | 'paid'>('all');

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [nfcModalVehicle, setNfcModalVehicle] = useState<Vehicle | null>(null);
  const [subscriptionVehicle, setSubscriptionVehicle] = useState<Vehicle | null>(null);

  // Reprint Receipt Modal State (History)
  const [receiptVehicle, setReceiptVehicle] = useState<Vehicle | null>(null);
  const [receiptRecord, setReceiptRecord] = useState<WashRecord | null>(null);

  // Form State (Add / Edit)
  const [plateType, setPlateType] = useState<PlateType>('unified');
  const [provinceCode, setProvinceCode] = useState('21');
  const [plateLetter, setPlateLetter] = useState('A');
  const [plateNumber, setPlateNumber] = useState('');
  const [oldCity, setOldCity] = useState('هەولێر');
  const [oldCategory, setOldCategory] = useState('تایبەت');
  const [oldNumber, setOldNumber] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [carModel, setCarModel] = useState('');
  const [color, setColor] = useState('');
  const [vehicleSize, setVehicleSize] = useState<VehicleSize>('sedan');
  const [hasNfcSticker, setHasNfcSticker] = useState(true);
  const [customerPin, setCustomerPin] = useState('');

  // Open Edit Modal
  const handleOpenEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setPlateType(vehicle.plate.type);
    if (vehicle.plate.type === 'unified') {
      setProvinceCode(vehicle.plate.provinceCode || '21');
      setPlateLetter(vehicle.plate.letter || 'A');
      setPlateNumber(vehicle.plate.number || '');
    } else {
      setOldCity(vehicle.plate.oldCityName || 'هەولێر');
      setOldCategory(vehicle.plate.oldCategory || 'تایبەت');
      setOldNumber(vehicle.plate.oldNumber || '');
    }
    setOwnerName(vehicle.ownerName);
    setPhone(vehicle.phone);
    setCarModel(vehicle.carModel);
    setColor(vehicle.color);
    setVehicleSize(vehicle.size || 'sedan');
    setHasNfcSticker(vehicle.hasNfcSticker);
    setCustomerPin(vehicle.customerPin || (vehicle.phone ? vehicle.phone.slice(-4) : '1234'));
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVehicle) return;

    let updatedPlate: LicensePlate;
    const cleanPlateNumber = normalizeDigits(plateNumber.trim());
    const cleanOldNumber = normalizeDigits(oldNumber.trim());
    const cleanPhone = normalizeDigits(phone.trim());

    if (plateType === 'unified') {
      if (!cleanPlateNumber) return;
      const prov = OFFICIAL_PROVINCES.find((p) => p.code === provinceCode);
      updatedPlate = {
        type: 'unified',
        provinceCode,
        provinceName: prov?.nameKu || '',
        letter: plateLetter.toUpperCase(),
        number: cleanPlateNumber,
      };
    } else {
      if (!cleanOldNumber) return;
      updatedPlate = {
        type: 'old',
        oldCityName: oldCity,
        oldCategory,
        oldNumber: cleanOldNumber,
      };
    }

    // Check if plate matches another existing vehicle (prevent duplicate plates on edit)
    const duplicateVehicle = vehicles.find((v) => {
      if (v.id === editingVehicle.id) return false;
      if (updatedPlate.type === 'unified' && v.plate.type === 'unified') {
        return (
          v.plate.provinceCode === updatedPlate.provinceCode &&
          v.plate.letter?.toUpperCase() === updatedPlate.letter?.toUpperCase() &&
          normalizeDigits(v.plate.number || '') === normalizeDigits(updatedPlate.number || '')
        );
      }
      if (updatedPlate.type === 'old' && v.plate.type === 'old') {
        return (
          v.plate.oldCityName === updatedPlate.oldCityName &&
          normalizeDigits(v.plate.oldNumber || '') === normalizeDigits(updatedPlate.oldNumber || '')
        );
      }
      return false;
    });

    if (duplicateVehicle) {
      alert(`⚠️ ئەم تابلۆیە پێشتر لەسەر سەیارەیەکی تر بە ناوی (${duplicateVehicle.ownerName || 'نادیار'}) تۆمارکراوە!`);
      return;
    }

    const updated = vehicles.map((v) => {
      if (v.id === editingVehicle.id) {
        return {
          ...v,
          plate: updatedPlate,
          ownerName: ownerName.trim() || 'نادیار',
          phone: cleanPhone,
          carModel: carModel.trim() || 'ئۆتۆمبێل',
          color: color.trim() || 'دیاری نەکراو',
          size: vehicleSize,
          hasNfcSticker,
          customerPin: customerPin.trim() || (cleanPhone ? cleanPhone.slice(-4) : '1234'),
        };
      }
      return v;
    });

    onUpdateVehicles(updated);
    setEditingVehicle(null);
    onNotify('زانیارییەکانی سەیارەکە بە سەرکەوتوویی نوێکرانەوە.');
  };

  const handleAddVehicle = (e: React.FormEvent) => {
    e.preventDefault();

    let newPlate: LicensePlate;
    let nfcTag = '';
    const cleanPlateNumber = normalizeDigits(plateNumber.trim());
    const cleanOldNumber = normalizeDigits(oldNumber.trim());
    const cleanPhone = normalizeDigits(phone.trim());

    if (plateType === 'unified') {
      if (!cleanPlateNumber) return;
      const prov = OFFICIAL_PROVINCES.find((p) => p.code === provinceCode);
      newPlate = {
        type: 'unified',
        provinceCode,
        provinceName: prov?.nameKu || '',
        letter: plateLetter.toUpperCase(),
        number: cleanPlateNumber,
      };
      nfcTag = `NFC-${provinceCode}${plateLetter.toUpperCase()}-${cleanPlateNumber}`;
    } else {
      if (!cleanOldNumber) return;
      newPlate = {
        type: 'old',
        oldCityName: oldCity,
        oldCategory,
        oldNumber: cleanOldNumber,
      };
      nfcTag = `NFC-${oldCity}-${cleanOldNumber}`;
    }

    // Check if plate already exists in the system (Duplicate Plate Guard)
    const existingVehicle = vehicles.find((v) => {
      if (newPlate.type === 'unified' && v.plate.type === 'unified') {
        return (
          v.plate.provinceCode === newPlate.provinceCode &&
          v.plate.letter?.toUpperCase() === newPlate.letter?.toUpperCase() &&
          normalizeDigits(v.plate.number || '') === normalizeDigits(newPlate.number || '')
        );
      }
      if (newPlate.type === 'old' && v.plate.type === 'old') {
        return (
          v.plate.oldCityName === newPlate.oldCityName &&
          normalizeDigits(v.plate.oldNumber || '') === normalizeDigits(newPlate.oldNumber || '')
        );
      }
      return false;
    });

    if (existingVehicle) {
      alert(`⚠️ ئەم تابلۆیە پێشتر بە ناوی (${existingVehicle.ownerName || 'نادیار'}) تۆمارکراوە! ناتوانیت هەمان تابلۆ دووبارە زیاد بکەیتەوە.`);
      return;
    }

    const newV: Vehicle = {
      id: `v-${Date.now()}`,
      plate: newPlate,
      ownerName: ownerName.trim() || 'نادیار',
      phone: cleanPhone,
      carModel: carModel.trim() || 'ئۆتۆمبێل',
      color: color.trim() || 'دیاری نەکراو',
      size: vehicleSize,
      nfcTagId: nfcTag,
      hasNfcSticker,
      customerPin: customerPin.trim() || (cleanPhone ? cleanPhone.slice(-4) : '1234'),
      totalWashes: 0,
      currentCycleWashes: 0,
      freeWashesClaimed: 0,
      lastVisitDate: new Date().toISOString(),
      registeredDate: new Date().toISOString(),
      status: 'active',
      washHistory: [],
    };

    const updated = [newV, ...vehicles];
    onUpdateVehicles(updated);
    setShowAddModal(false);
    onNotify('سەیارەی نوێ بە سەرکەوتوویی زیادکرا.');

    setPlateNumber('');
    setOldNumber('');
    setOwnerName('');
    setPhone('');
    setCarModel('');
    setColor('');
    setCustomerPin('');
  };

  const handleDeleteVehicle = (id: string) => {
    const enteredPin = prompt('⚠️ بۆ سڕینەوەی ئەم سەیارەیە، تکایە کۆدی نهێنی بەڕێوەبەر (Admin Master PIN) بنووسە:');
    if (enteredPin === null) return; // user cancelled

    const masterPin = settings.adminPin || '9999';
    if (normalizeDigits(enteredPin.trim()) !== normalizeDigits(masterPin.trim())) {
      alert('❌ کۆدی نهێنی بەڕێوەبەر هەڵەیە! سڕینەوەی سەیارەکە ڕەتکرایەوە.');
      return;
    }

    if (confirm('دڵنیایت لە سڕینەوەی یەکجارەکیی ئەم سەیارەیە لە سیستەم؟ ئەم کردارە ناگەڕێتەوە.')) {
      const updated = vehicles.filter((v) => v.id !== id);
      onUpdateVehicles(updated);
      onNotify('سەیارەکە بە سەرکەوتوویی لە سیستەم سڕایەوە.');
    }
  };

  const handleSendReminder = (vehicle: Vehicle, daysPassed: number) => {
    if (!vehicle.phone) {
      alert('ژمارەی مۆبایل بۆ ئەم سەیارەیە تۆمار نەکراوە!');
      return;
    }
    const message = generateInactivityReminderMessage(vehicle, settings, daysPassed);
    openWhatsAppChat(vehicle.phone, message);
  };

  // Filtered Vehicles for Registry
  const filteredVehicles = vehicles
    .filter((v) => {
      const rawQ = search.trim().toLowerCase();
      const cleanQ = normalizeDigits(rawQ);

      const matchesSearch =
        !rawQ ||
        v.ownerName.toLowerCase().includes(rawQ) ||
        normalizeDigits(v.phone || '').includes(cleanQ) ||
        v.carModel.toLowerCase().includes(rawQ) ||
        normalizeDigits(v.nfcTagId.toLowerCase()).includes(cleanQ) ||
        (v.plate.type === 'unified'
          ? normalizeDigits(v.plate.number || '').includes(cleanQ) ||
            (v.plate.letter || '').toLowerCase().includes(rawQ) ||
            (v.plate.provinceName || '').includes(rawQ)
          : normalizeDigits(v.plate.oldNumber || '').includes(cleanQ) ||
            (v.plate.oldCityName || '').includes(rawQ));

      const matchesSize = sizeFilter === 'all' || v.size === sizeFilter;

      const isExpired = isNfcExpired(v.lastVisitDate, settings.expiryDaysLimit);
      const isFreeReady = v.currentCycleWashes >= settings.washesNeededForFree;
      const vehicleDebt = getVehicleTotalDebt(v);
      const hasDebt = vehicleDebt > 0;

      let matchesLoyalty = true;
      if (loyaltyFilter === 'free_ready') matchesLoyalty = isFreeReady;
      else if (loyaltyFilter === 'debt') matchesLoyalty = hasDebt;
      else if (loyaltyFilter === 'active') matchesLoyalty = !isExpired;
      else if (loyaltyFilter === 'expired') matchesLoyalty = isExpired;

      return matchesSearch && matchesSize && matchesLoyalty;
    })
    .sort((a, b) => {
      if (sortBy === 'washes') {
        return sortOrder === 'desc'
          ? b.totalWashes - a.totalWashes
          : a.totalWashes - b.totalWashes;
      }
      if (sortBy === 'name') {
        return sortOrder === 'desc'
          ? b.ownerName.localeCompare(a.ownerName)
          : a.ownerName.localeCompare(b.ownerName);
      }
      const dateA = new Date(a.lastVisitDate || a.registeredDate).getTime();
      const dateB = new Date(b.lastVisitDate || b.registeredDate).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

  // Global Counts
  const totalVehiclesCount = vehicles.length;
  const sedanCount = vehicles.filter((v) => !v.size || v.size === 'sedan').length;
  const suvCount = vehicles.filter((v) => v.size === 'suv').length;
  const truckCount = vehicles.filter((v) => v.size === 'truck').length;

  const freeReadyVehicles = vehicles.filter(
    (v) => v.currentCycleWashes >= settings.washesNeededForFree
  );
  const freeReadyCount = freeReadyVehicles.length;

  const expiredVehicles = vehicles.filter((v) =>
    isNfcExpired(v.lastVisitDate, settings.expiryDaysLimit)
  );
  const expiredCount = expiredVehicles.length;
  const activeCount = totalVehiclesCount - expiredCount;

  const debtVehicles = vehicles.filter((v) => getVehicleTotalDebt(v) > 0);
  const debtCarsCount = debtVehicles.length;
  const totalDebtSum = vehicles.reduce((sum, v) => sum + getVehicleTotalDebt(v), 0);

  const handleSettleSingleDebt = (vehicleId: string, washId: string) => {
    const updated = settleVehicleDebt(vehicleId, washId, 'cash');
    onUpdateVehicles(updated);
    onNotify('قەرزەکە بە سەرکەوتوویی پاکتاوکرا و گۆڕدرا بۆ نەقد (Paid).');
  };

  // Loyalty Funnel Groups
  const stage4Vehicles = freeReadyVehicles;
  const stage3Vehicles = vehicles.filter((v) => v.currentCycleWashes === 3);
  const stage2Vehicles = vehicles.filter((v) => v.currentCycleWashes === 2);
  const stage1Vehicles = vehicles.filter((v) => v.currentCycleWashes === 1);

  // VIP Repeat Visitors (10+ washes)
  const vipVehicles = vehicles
    .filter((v) => v.totalWashes >= 10)
    .sort((a, b) => b.totalWashes - a.totalWashes);

  // Aggregate Wash History from all vehicles
  const allWashLogs = vehicles
    .flatMap((v) =>
      (v.washHistory || []).map((w) => ({
        ...w,
        vehicle: v,
      }))
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredHistory = allWashLogs.filter((item) => {
    const rawQ = historySearch.trim().toLowerCase();
    const cleanQ = normalizeDigits(rawQ);

    const matchesSearch =
      !rawQ ||
      item.vehicle.ownerName.toLowerCase().includes(rawQ) ||
      item.serviceName.toLowerCase().includes(rawQ) ||
      (item.vehicle.plate.type === 'unified'
        ? normalizeDigits(item.vehicle.plate.number || '').includes(cleanQ)
        : normalizeDigits(item.vehicle.plate.oldNumber || '').includes(cleanQ));

    let matchesType = true;
    if (historyTypeFilter === 'free') matchesType = item.isFree;
    else if (historyTypeFilter === 'paid') matchesType = !item.isFree;

    return matchesSearch && matchesType;
  });

  const totalHistoryRevenue = allWashLogs.reduce((sum, item) => sum + (item.price || 0), 0);
  const totalFreeWashesGiven = allWashLogs.filter((item) => item.isFree).length;

  // Partitioned Sub-Sections
  const sectionsList: {
    id: VehicleSectionKey;
    label: string;
    sublabel: string;
    icon: any;
    badge?: number;
    badgeColor?: string;
  }[] = [
    {
      id: 'registry',
      label: 'هەموو سەیارەکان',
      sublabel: 'تۆماری گشتی و دۆخی لۆیەڵتی',
      icon: Car,
      badge: totalVehiclesCount,
      badgeColor: 'bg-slate-100 text-slate-700',
    },
    {
      id: 'loyalty',
      label: 'شۆردنی دیاری (Free)',
      sublabel: 'ئەوانەی ٤ شۆردنیان تەواو کردووە',
      icon: Gift,
      badge: freeReadyCount > 0 ? freeReadyCount : undefined,
      badgeColor: 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold',
    },
    {
      id: 'retention',
      label: 'کڕیاری ناچالاک (+١٥)',
      sublabel: 'ئاگادارکردنەوە بە واتسئاپ',
      icon: Clock,
      badge: expiredCount > 0 ? expiredCount : undefined,
      badgeColor: 'bg-rose-50 text-rose-700 border border-rose-200 font-bold',
    },
    {
      id: 'history',
      label: 'مێژووی شۆردنەکان',
      sublabel: 'ئەرشیفی پسوولە و لۆگەکان',
      icon: History,
      badge: allWashLogs.length,
      badgeColor: 'bg-blue-50 text-blue-700 border border-blue-200',
    },
  ];

  return (
    <div className="space-y-6" dir="rtl">
      {/* ============================================================== */}
      {/* 1. MASTER HEADER CARD & DEDICATED PARTITION TABS               */}
      {/* ============================================================== */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs shrink-0">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  ناوەندی سەیارە و کڕیاران
                </h2>
                <span className="text-[11px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                  {totalVehiclesCount} سەیارە
                </span>
                {freeReadyCount > 0 && (
                  <span className="text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    {freeReadyCount} شۆردنی دیاری (Free)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                بەڕێوەبردنی سەیارەکان، بەدواداچوونی لۆیەڵتی و ئەرشیفی پسوولە
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setPlateNumber('');
              setOldNumber('');
              setOwnerName('');
              setPhone('');
              setCarModel('');
              setColor('');
              setShowAddModal(true);
            }}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition hover:scale-[1.01] active:scale-[0.98] self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            سەیارەی نوێ +
          </button>
        </div>

        {/* Responsive Segmented Switcher: 2x2 grid on mobile so nothing cuts off, single row on tablet/desktop */}
        <div className="grid grid-cols-2 sm:flex sm:flex-row items-center gap-1.5 p-1.5 bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-2xl">
          {sectionsList.map((sec) => {
            const Icon = sec.icon;
            const isSecActive = currentSection === sec.id;

            return (
              <button
                key={sec.id}
                onClick={() => setCurrentSection(sec.id)}
                className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer select-none ${
                  isSecActive
                    ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs border border-slate-200/80 dark:border-slate-600 ring-1 ring-blue-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-750'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isSecActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                <span className="truncate">{sec.label}</span>
                {typeof sec.badge !== 'undefined' && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold shrink-0 ${
                      isSecActive
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                        : 'bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {sec.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Contextual description note for active tab */}
        <div className="flex items-center justify-between px-1 text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block shrink-0" />
            {currentSection === 'registry' && 'تۆماری گشتی سەیارەکان لەگەڵ دۆخی لۆیەڵتی (٤ + ١) بۆ هەر سەیارەیەک'}
            {currentSection === 'loyalty' && 'سەیارە ئامادەکان بۆ وەرگرتنی شۆردنی ٥ەمی بەخۆڕایی (Free Wash)'}
            {currentSection === 'retention' && 'ئەو کڕیارانەی زیاتر لە ١٥ ڕۆژە سەردانیان نەکردووە بۆ ناردنی نامەی واتسئاپ'}
            {currentSection === 'history' && 'ئەرشیفی تەواوی پسوولەکانی شۆردن بە کات و بەروار'}
          </span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. SUB-SECTION: 1. REGISTRY (تۆماری سەیارەکان)                 */}
      {/* ============================================================== */}
      {currentSection === 'registry' && (
        <div className="space-y-4">
          {/* Top Quick Stats Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">سەیارەی سالۆن</span>
                <span className="text-base font-black text-slate-900 dark:text-white font-mono">{sedanCount}</span>
              </div>
              <span className="text-[11px] text-sky-700 dark:text-sky-300 font-bold bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded-lg border border-sky-200/60 dark:border-sky-800/60">
                🚗 Sedan
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">سەیارەی جیپ (SUV)</span>
                <span className="text-base font-black text-slate-900 dark:text-white font-mono">{suvCount}</span>
              </div>
              <span className="text-[11px] text-purple-700 dark:text-purple-300 font-bold bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-lg border border-purple-200/60 dark:border-purple-800/60">
                🚙 4x4
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">پیکاب و بارهەڵگر</span>
                <span className="text-base font-black text-slate-900 dark:text-white font-mono">{truckCount}</span>
              </div>
              <span className="text-[11px] text-amber-700 dark:text-amber-300 font-bold bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-lg border border-amber-200/60 dark:border-amber-800/60">
                🚐 Truck
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">کۆی سەردانەکان</span>
                <span className="text-base font-black text-slate-900 dark:text-white font-mono">
                  {vehicles.reduce((sum, v) => sum + (v.totalWashes || 0), 0)}
                </span>
              </div>
              <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-200/60 dark:border-emerald-800/60">
                شۆردن
              </span>
            </div>
          </div>

          {/* Integrated Filter & View-Mode Toolbar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-2.5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="گەڕان بەپێی تابلۆ، کڕیار، مۆدێل، مۆبایل..."
                className="w-full pr-9 pl-7 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all font-medium"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Size Filter */}
              <select
                value={sizeFilter}
                onChange={(e) => setSizeFilter(e.target.value as any)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer focus:border-blue-500"
              >
                <option value="all">هەموو قەبارەکان</option>
                <option value="sedan">سالۆن (Sedan)</option>
                <option value="suv">جیپ (SUV / 4x4)</option>
                <option value="truck">پیکاب / بارهەڵگر</option>
              </select>

              {/* Status Filter */}
              <select
                value={loyaltyFilter}
                onChange={(e) => setLoyaltyFilter(e.target.value as any)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer focus:border-blue-500"
              >
                <option value="all">هەموو دۆخەکان</option>
                <option value="free_ready">🎁 شۆردنی FREE ({freeReadyCount})</option>
                <option value="debt">💳 قەرزە نەدراوەکان ({debtCarsCount})</option>
                <option value="active">چالاک (Active)</option>
                <option value="expired">⚠️ بێدەنگ ١٥+ ڕۆژ ({expiredCount})</option>
              </select>

              {/* Sort Order */}
              <div className="flex items-center bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-700 dark:text-slate-200">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer text-xs"
                >
                  <option value="date">دواین بەروار</option>
                  <option value="washes">ژمارەی شۆردن</option>
                  <option value="name">ناوی کڕیار</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-xs font-mono font-bold mr-1 cursor-pointer"
                  title="گۆڕینی ڕیزبەندی"
                >
                  {sortOrder === 'desc' ? '↓' : '↑'}
                </button>
              </div>

              {/* View Switcher: Table vs Grid */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/80 dark:border-slate-700">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 px-2 rounded-md text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="نیشاندان وەک خشتە"
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  خشتە
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`p-1.5 px-2 rounded-md text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                    viewMode === 'cards'
                      ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="نیشاندان وەک کارت"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  کارتەکان
                </button>
              </div>
            </div>
          </div>

          {/* Table or Cards Display */}
          {viewMode === 'table' ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto scrollbar-none">
                <table className="w-full text-right text-xs border-collapse">
                  <thead className="bg-slate-50/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-700 text-[11px] font-bold tracking-wider select-none">
                    <tr>
                      <th className="py-2.5 px-3">
                        <div className="flex items-center gap-1 cursor-pointer" onClick={() => setSortBy('name')}>
                          <span>ئۆتۆمبێل و مۆدێل</span>
                          <ArrowUpDown className="w-3 h-3 text-slate-400" />
                        </div>
                      </th>
                      <th className="py-2.5 px-3">تابلۆی فەرمی</th>
                      <th className="py-2.5 px-3">خاوەن و مۆبایل</th>
                      <th className="py-2.5 px-3">قەبارە</th>
                      <th className="py-2.5 px-3">
                        <div className="flex items-center gap-1 cursor-pointer" onClick={() => setSortBy('washes')}>
                          <span>لۆیەڵتی (٤ + ١)</span>
                          <ArrowUpDown className="w-3 h-3 text-slate-400" />
                        </div>
                      </th>
                      <th className="py-2.5 px-3">
                        <div className="flex items-center gap-1 cursor-pointer" onClick={() => setSortBy('date')}>
                          <span>دواین سەردان / دۆخ</span>
                          <ArrowUpDown className="w-3 h-3 text-slate-400" />
                        </div>
                      </th>
                      <th className="py-2.5 px-3 text-center">کردارەکان</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredVehicles.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Car className="w-8 h-8 opacity-30" />
                            <span>هیچ سەیارەیەک بەم مەرجانە نەدۆزرایەوە.</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredVehicles.map((vehicle) => {
                        const isExpired = isNfcExpired(vehicle.lastVisitDate, settings.expiryDaysLimit);
                        const daysPassed = calculateDaysSince(vehicle.lastVisitDate);
                        const isNextFree = vehicle.currentCycleWashes >= settings.washesNeededForFree;
                        const vehicleDebt = getVehicleTotalDebt(vehicle);

                        return (
                          <tr key={vehicle.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors group">
                            {/* Column 1: Model & Color */}
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-800/60 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs shrink-0">
                                  <Car className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-slate-900 dark:text-white text-xs truncate">
                                    {vehicle.carModel} <span className="text-[10px] text-slate-400 font-normal">({vehicle.color})</span>
                                  </div>
                                  <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono truncate">
                                    {vehicle.nfcTagId}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Column 2: License Plate */}
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <PlateDisplay plate={vehicle.plate} size="sm" />
                            </td>

                            {/* Column 3: Owner & Contact */}
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <div className="font-bold text-slate-900 dark:text-white text-xs leading-tight">
                                {vehicle.ownerName}
                              </div>
                              {vehicle.phone ? (
                                <button
                                  onClick={() => {
                                    const msg = `سڵاو بەڕێز ${vehicle.ownerName}، لە ${settings.carWashName}ـەوە پەیوەندیت پێوە دەکەین.`;
                                    openWhatsAppChat(vehicle.phone, msg);
                                  }}
                                  className="text-[10px] font-mono text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline mt-0.5 cursor-pointer"
                                  title="کلیک بکە بۆ ناردنی نامەی WhatsApp"
                                >
                                  <Phone className="w-2.5 h-2.5 text-emerald-600" />
                                  {vehicle.phone}
                                </button>
                              ) : (
                                <span className="text-[9px] text-slate-400">بێ ژمارە</span>
                              )}
                              {vehicleDebt > 0 && (
                                <div className="mt-1">
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-md">
                                    💳 قەرز: {formatIQD(vehicleDebt)}
                                  </span>
                                </div>
                              )}
                            </td>

                            {/* Column 4: Category / Size */}
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              {vehicle.size === 'suv' ? (
                                <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200/80 text-[10px] font-bold">
                                  🚙 جیپ
                                </span>
                              ) : vehicle.size === 'truck' ? (
                                <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/80 text-[10px] font-bold">
                                  🚐 پیکاب
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200/80 text-[10px] font-bold">
                                  🚗 سالۆن
                                </span>
                              )}
                            </td>

                            {/* Column 5: Loyalty Progress */}
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              {(() => {
                                const isVipActive = vehicle.subscription?.status === 'active' && new Date(vehicle.subscription.endDate) > new Date();
                                const vipDaysLeft = isVipActive ? Math.max(0, Math.ceil((new Date(vehicle.subscription!.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;
                                if (isVipActive) {
                                  return (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-300 font-extrabold text-[10px] shadow-2xs">
                                      <Crown className="w-3 h-3 text-amber-500" />
                                      VIP ({vipDaysLeft} ڕۆژ)
                                    </span>
                                  );
                                }
                                return isNextFree ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 font-extrabold text-[10px]">
                                    <Sparkles className="w-3 h-3 text-emerald-600" />
                                    دیاری (0 IQD FREE)
                                  </span>
                                ) : (
                                  <div className="flex items-center gap-1.5">
                                    <div className="flex gap-1 items-center">
                                      {[1, 2, 3, 4].map((step) => (
                                        <span
                                          key={step}
                                          className={`w-2 h-2 rounded-full ${
                                            vehicle.currentCycleWashes >= step
                                              ? 'bg-blue-600'
                                              : 'bg-slate-200'
                                          }`}
                                        />
                                      ))}
                                    </div>
                                    <span className="text-xs font-bold font-mono text-slate-900">
                                      {vehicle.currentCycleWashes}/4
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      ({vehicle.totalWashes} جار)
                                    </span>
                                  </div>
                                );
                              })()}
                            </td>

                            {/* Column 6: Last Visit / Inactivity */}
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-mono font-medium text-slate-700">
                                  {vehicle.lastVisitDate ? vehicle.lastVisitDate.split('T')[0] : 'تازە'}
                                </span>
                                {isExpired ? (
                                  <span
                                    className="inline-flex items-center gap-0.5 text-[9px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded"
                                    title={`${daysPassed} ڕۆژە نەهاتووە`}
                                  >
                                    <Clock className="w-2.5 h-2.5" />
                                    {daysPassed}ڕ
                                  </span>
                                ) : (
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" title="چالاک"></span>
                                )}
                              </div>
                            </td>

                            {/* Column 7: Actions */}
                            <td className="py-2.5 px-3 whitespace-nowrap text-center">
                              <div className="flex items-center justify-center gap-1">
                                {vehicle.phone && (
                                  <button
                                    onClick={() => {
                                      if (isExpired) {
                                        handleSendReminder(vehicle, daysPassed);
                                      } else {
                                        const msg = `سڵاو بەڕێز ${vehicle.ownerName}، لە ${settings.carWashName}ـەوە پەیوەندیت پێوە دەکەین. خزمەتگوزاری نوێ و دیاری لۆیەڵتیمان بۆ ئامادە کردوویت!`;
                                        openWhatsAppChat(vehicle.phone, msg);
                                      }
                                    }}
                                    className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg transition cursor-pointer"
                                    title={isExpired ? 'ناردنی نامەی یادخستنەوە' : 'پەیوەندی بە WhatsApp'}
                                  >
                                    <MessageCircle className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {/* VIP Subscription Modal Button */}
                                <button
                                  onClick={() => setSubscriptionVehicle(vehicle)}
                                  className={`p-1.5 rounded-lg border transition cursor-pointer flex items-center gap-1 shadow-xs ${
                                    vehicle.subscription?.status === 'active' && new Date(vehicle.subscription.endDate) > new Date()
                                      ? 'bg-purple-100 hover:bg-purple-200 text-purple-900 border-purple-300'
                                      : 'bg-purple-50 hover:bg-purple-100 text-purple-800 border-purple-200'
                                  }`}
                                  title="ئابوونەی VIP بێسنوور"
                                >
                                  <Crown className="w-3.5 h-3.5 text-amber-500" />
                                  <span className="text-[10px] font-bold hidden xl:inline">VIP</span>
                                </button>

                                {/* NFC VIP Card & Windshield Sticker Modal Button */}
                                <button
                                  onClick={() => setNfcModalVehicle(vehicle)}
                                  className="p-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-blue-700 border border-blue-200/80 rounded-lg transition cursor-pointer flex items-center gap-1 shadow-xs"
                                  title="کارتی زیرەکی VIP و ستیكەری NFC"
                                >
                                  <Wifi className="w-3.5 h-3.5 rotate-90 text-blue-600" />
                                  <span className="text-[10px] font-bold hidden xl:inline">کارتی NFC</span>
                                </button>

                                {vehicleDebt > 0 && (
                                  <button
                                    onClick={() => {
                                      const unpaidWash = (vehicle.washHistory || []).find((w) => w.paymentStatus === 'unpaid' || w.paymentMethod === 'debt');
                                      if (unpaidWash && confirm(`ئایا دڵنیایت لە وەرگرتنی پارە و پاکتاوکردنی قەرزی ${formatIQD(unpaidWash.price)} بۆ سەیارەی ${vehicle.ownerName}؟`)) {
                                        handleSettleSingleDebt(vehicle.id, unpaidWash.id);
                                      }
                                    }}
                                    className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-lg transition cursor-pointer flex items-center gap-1 shadow-2xs"
                                    title={`دانەوە و پاکتاوکردنی قەرز (${formatIQD(vehicleDebt)})`}
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5 text-rose-600" />
                                    <span className="text-[10px] font-bold hidden md:inline">دانەوەی قەرز</span>
                                  </button>
                                )}

                                <Link
                                  href={`/nfc/${vehicle.id}`}
                                  target="_blank"
                                  className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg transition"
                                  title="پەڕەی تایبەتی کڕیار (NFC Portal)"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </Link>

                                <button
                                  onClick={() => handleOpenEdit(vehicle)}
                                  className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg transition cursor-pointer"
                                  title="دەستکاریکردن"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() => handleDeleteVehicle(vehicle.id)}
                                  className="p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-200 rounded-lg transition cursor-pointer"
                                  title="سڕینەوە"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Footer */}
              <div className="bg-slate-50/80 px-4 py-2.5 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2">
                <span>
                  نیشاندانی <strong className="text-slate-900">{filteredVehicles.length}</strong> لە کۆی{' '}
                  <strong className="text-slate-900">{totalVehiclesCount}</strong> سەیارە
                </span>
                <span className="font-mono text-[11px] text-slate-400">
                  سیستەمی لۆیەڵتی (٤ + ١ شۆردنی بەخۆڕایی)
                </span>
              </div>
            </div>
          ) : (
            /* Cards Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredVehicles.map((vehicle) => {
                const isExpired = isNfcExpired(vehicle.lastVisitDate, settings.expiryDaysLimit);
                const daysPassed = calculateDaysSince(vehicle.lastVisitDate);
                const isNextFree = vehicle.currentCycleWashes >= settings.washesNeededForFree;
                const vehicleDebt = getVehicleTotalDebt(vehicle);

                return (
                  <div
                    key={vehicle.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <PlateDisplay plate={vehicle.plate} size="sm" />
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(vehicle)}
                            className="p-1 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg transition cursor-pointer"
                            title="دەستکاریکردن"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          {isExpired ? (
                            <span className="text-[10px] px-2 py-0.5 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 rounded-full font-bold">
                              بێدەنگ ({daysPassed} ڕ)
                            </span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 rounded-full font-bold">
                              چالاک ✓
                            </span>
                          )}
                        </div>
                      </div>

                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-xs">
                          {vehicle.carModel} <span className="text-slate-400 font-normal">({vehicle.color})</span>
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                          <User className="w-3 h-3 text-slate-400" />
                          خاوەن: <strong className="text-slate-800 dark:text-slate-200">{vehicle.ownerName}</strong>
                        </p>
                        {vehicle.phone && (
                          <p className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {vehicle.phone}
                          </p>
                        )}
                      </div>

                      {/* Outstanding Debt Alert in Card */}
                      {vehicleDebt > 0 && (
                        <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between text-xs text-rose-900">
                          <div className="flex items-center gap-1.5">
                            <Coins className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            <span className="font-bold">قەرز: {formatIQD(vehicleDebt)}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const unpaidWash = (vehicle.washHistory || []).find((w) => w.paymentStatus === 'unpaid' || w.paymentMethod === 'debt');
                              if (unpaidWash && confirm(`ئایا دڵنیایت لە وەرگرتنی پارە و پاکتاوکردنی قەرزی ${formatIQD(unpaidWash.price)} بۆ سەیارەی ${vehicle.ownerName}؟`)) {
                                handleSettleSingleDebt(vehicle.id, unpaidWash.id);
                              }
                            }}
                            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold shadow-xs cursor-pointer"
                          >
                            دانەوە
                          </button>
                        </div>
                      )}

                      {/* Loyalty Visual */}
                      <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-2.5 space-y-1.5">
                        {vehicle.subscription?.status === 'active' && new Date(vehicle.subscription.endDate) > new Date() ? (
                          <div className="flex items-center justify-between text-[11px] text-purple-900 font-extrabold">
                            <span className="flex items-center gap-1">
                              <Crown className="w-3.5 h-3.5 text-amber-500" />
                              <span>ئابوونەی VIP بێسنوور</span>
                            </span>
                            <span className="text-[10px] bg-purple-200 px-2 py-0.5 rounded-full font-mono">
                              ماوە: {Math.max(0, Math.ceil((new Date(vehicle.subscription.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} ڕۆژ
                            </span>
                          </div>
                        ) : (
                          <>
                            <div className="flex justify-between text-[11px]">
                              <span className="text-slate-600 font-bold">خول: {vehicle.currentCycleWashes} لە ٤</span>
                              {isNextFree ? (
                                <span className="text-emerald-700 font-bold flex items-center gap-1 text-[10px]">
                                  <Sparkles className="w-3 h-3 text-emerald-600" />
                                  شۆردنی دواتر FREE
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[10px]">ماوە: {4 - vehicle.currentCycleWashes} شۆردن</span>
                              )}
                            </div>
                            <div className="flex gap-1">
                              {[1, 2, 3, 4].map((step) => (
                                <div
                                  key={step}
                                  className={`flex-1 h-1.5 rounded-full transition-all ${
                                    vehicle.currentCycleWashes >= step ? 'bg-blue-600' : 'bg-slate-200'
                                  }`}
                                />
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5">
                      <button
                        onClick={() => setSubscriptionVehicle(vehicle)}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 border transition cursor-pointer ${
                          vehicle.subscription?.status === 'active' && new Date(vehicle.subscription.endDate) > new Date()
                            ? 'bg-purple-100 hover:bg-purple-200 text-purple-900 border-purple-300'
                            : 'bg-purple-50 hover:bg-purple-100 text-purple-800 border-purple-200'
                        }`}
                        title="ئابوونەی VIP بێسنوور"
                      >
                        <Crown className="w-3.5 h-3.5 text-amber-500" />
                        <span>VIP</span>
                      </button>
                      <button
                        onClick={() => setNfcModalVehicle(vehicle)}
                        className="flex-1 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-blue-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1 border border-blue-200/80 transition cursor-pointer"
                        title="کارتی زیرەکی VIP و ستیكەری NFC"
                      >
                        <Wifi className="w-3.5 h-3.5 text-blue-600 rotate-90" />
                        <span>کارتی NFC</span>
                      </button>
                      <Link
                        href={`/nfc/${vehicle.id}`}
                        target="_blank"
                        className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold flex items-center justify-center border border-slate-200 transition"
                        title="پەڕەی پۆرتاڵ"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                      </Link>
                      {vehicle.phone && (
                        <button
                          onClick={() => {
                            const msg = `سڵاو بەڕێز ${vehicle.ownerName}، لە ${settings.carWashName}ـەوە پەیوەندیت پێوە دەکەین.`;
                            openWhatsAppChat(vehicle.phone, msg);
                          }}
                          className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg transition cursor-pointer"
                          title="نامەی WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteVehicle(vehicle.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="سڕینەوە"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. SUB-SECTION: 2. LOYALTY (لۆیەڵتی ٤ + ١ و بەخۆڕایی)          */}
      {/* ============================================================== */}
      {currentSection === 'loyalty' && (
        <div className="space-y-5">
          {/* Celebratory Banner for Ready to Claim Free Washes */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl p-5 shadow-xs relative overflow-hidden">
            <div className="relative z-10 space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold backdrop-blur-sm">
                <Sparkles className="w-3.5 h-3.5" />
                شۆردنی دیاری بەخۆڕایی (Free Wash Ready)
              </div>
              <h3 className="text-lg sm:text-xl font-black">
                {freeReadyCount > 0
                  ? `${freeReadyCount} سەیارە ٤ شۆردنیان تەواو کردووە و ئامادەی وەرگرتنی شۆردنی 0 دینارن!`
                  : 'سیستەمی لۆیەڵتی ٤ + ١ بەردەوامە'}
              </h3>
              <p className="text-xs text-emerald-100 max-w-2xl leading-relaxed">
                بەپێی یاسای لۆیەڵتی (٤ + ١ بەخۆڕایی)، لە کاتی هاتنی هەر یەکێک لەم سەیارانە سیستەمی کاشێر نرخەکەی دەکاتە 0 دینار بەشێوەی ئۆتۆماتیکی.
              </p>
            </div>
          </div>

          {/* Grid of Vehicles Ready for Free Wash */}
          {freeReadyCount > 0 ? (
            <div className="space-y-3">
              <h4 className="font-bold text-xs text-slate-800 flex items-center gap-2">
                <Gift className="w-3.5 h-3.5 text-emerald-600" />
                سەیارە شایستەکان بۆ شۆردنی بەخۆڕایی ({freeReadyCount} سەیارە):
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {freeReadyVehicles.map((vehicle) => (
                  <div
                    key={vehicle.id}
                    className="bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700/60 rounded-2xl p-4 shadow-xs ring-2 ring-emerald-500/10 space-y-3 relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 bg-emerald-600 text-white text-[9px] font-black px-2.5 py-0.5 rounded-br-xl">
                      FREE READY
                    </div>
                    <div className="pt-1">
                      <PlateDisplay plate={vehicle.plate} size="sm" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900 dark:text-white">
                        {vehicle.carModel} ({vehicle.color})
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">خاوەن: {vehicle.ownerName}</div>
                      {vehicle.phone && (
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">{vehicle.phone}</div>
                      )}
                    </div>

                    <div className="p-2.5 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 rounded-xl flex items-center justify-between text-xs">
                      <span className="font-bold text-emerald-800 dark:text-emerald-300 text-[11px]">شۆردنی تەواوبوو:</span>
                      <span className="font-mono font-black text-emerald-700 dark:text-emerald-400 text-xs">٤ لە ٤ (تەواوە)</span>
                    </div>

                    {vehicle.phone && (
                      <button
                        onClick={() => {
                          const msg = `سڵاو بەڕێز ${vehicle.ownerName}، پیرۆزە لە ${settings.carWashName}ـەوە! تۆ ٤ شۆردنت لە سیستەمی لۆیەڵتیدا تەواو کردووە و سەردانی داهاتووت شۆردنی بەخۆڕاییە (0 دینار). بەخێربێیت لە هەر کاتێکدا!`;
                          openWhatsAppChat(vehicle.phone, msg);
                        }}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        ناردنی مژدە لە WhatsApp
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-8 text-center text-slate-500 dark:text-slate-400 space-y-2">
              <Gift className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <div className="font-bold text-xs text-slate-800 dark:text-slate-200">لە ئێستادا هیچ سەیارەیەک لە قۆناغی ٤/٤ نییە</div>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                کاتێک کڕیارەکان دەگەنە ٤ شۆردن لەم خولەدا، لێرەدا دەردەکەون بۆ ئەوەی بەخۆڕایی بشۆردرێن.
              </p>
            </div>
          )}

          {/* Loyalty Funnel Stages Overview */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
            <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              دابەشبوونی کڕیاران بەپێی قۆناغەکانی خول (Loyalty Funnel):
            </h4>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
              <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-800 dark:text-emerald-300 text-[11px]">قۆناغی ٤ (FREE)</span>
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                </div>
                <div className="text-xl font-black text-emerald-700 dark:text-emerald-400 font-mono">{stage4Vehicles.length}</div>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400">شۆردنی داهاتوو 0 دینار</p>
              </div>

              <div className="p-3 bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/60 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-800 dark:text-blue-300 text-[11px]">قۆناغی ٣ (نزیک)</span>
                  <Zap className="w-3 h-3 text-blue-600" />
                </div>
                <div className="text-xl font-black text-blue-700 dark:text-blue-400 font-mono">{stage3Vehicles.length}</div>
                <p className="text-[10px] text-blue-600 dark:text-blue-400">١ شۆردن ماوە بۆ بەخۆڕایی</p>
              </div>

              <div className="p-3 bg-purple-50/50 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-800/60 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-800 dark:text-purple-300 text-[11px]">قۆناغی ٢ (نیوەی خول)</span>
                  <Clock className="w-3 h-3 text-purple-600" />
                </div>
                <div className="text-xl font-black text-purple-700 dark:text-purple-400 font-mono">{stage2Vehicles.length}</div>
                <p className="text-[10px] text-purple-600 dark:text-purple-400">٢ شۆردن ماوە بۆ خول</p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">قۆناغی ١ (دەستپێک)</span>
                  <Car className="w-3 h-3 text-slate-600 dark:text-slate-400" />
                </div>
                <div className="text-xl font-black text-slate-800 dark:text-slate-100 font-mono">{stage1Vehicles.length}</div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">تازە خولی دەستپێکردووە</p>
              </div>
            </div>
          </div>

          {/* VIP Customers Table (10+ washes) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                <Star className="w-3.5 h-3.5 text-amber-500" />
                کڕیارانی بەردەوام و VIP (زیاتر لە ١٠ جار شۆردن):
              </h4>
              <span className="text-[11px] px-2 py-0.5 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 rounded-full font-bold">
                داشکاندنی تایبەت {settings.vipDiscountPercent || 10}%
              </span>
            </div>

            {vipVehicles.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">
                هێشتا هیچ سەیارەیەک نەگەیشتووەتە ١٠ سەردان.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="text-[11px] text-slate-400 border-b border-slate-100">
                    <tr>
                      <th className="py-2 px-3">سەیارە و تابلۆ</th>
                      <th className="py-2 px-3">خاوەن و مۆبایل</th>
                      <th className="py-2 px-3">کۆی سەردان</th>
                      <th className="py-2 px-3">شۆردنی بەخۆڕایی وەرگیراو</th>
                      <th className="py-2 px-3 text-center">پەیوەندی</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {vipVehicles.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <PlateDisplay plate={v.plate} size="sm" />
                            <span className="font-bold text-slate-900 text-xs">{v.carModel}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-800 text-xs">{v.ownerName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{v.phone || 'بێ ژمارە'}</div>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-blue-600 text-xs">
                          {v.totalWashes} جار
                        </td>
                        <td className="py-2.5 px-3 font-mono text-emerald-700 font-bold text-xs">
                          {v.freeWashesClaimed || 0} جار Free
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {v.phone && (
                            <button
                              onClick={() => {
                                const msg = `سڵاو لە بەڕێز ${v.ownerName} کڕیاری تایبەتی غەسلی ${settings.carWashName}! سوپاس بۆ وەفاداریت و سەردانی بەردەوامت.`;
                                openWhatsAppChat(v.phone, msg);
                              }}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold inline-flex items-center gap-1 transition cursor-pointer"
                            >
                              <MessageCircle className="w-3 h-3" />
                              WhatsApp
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. SUB-SECTION: 3. RETENTION (گەڕاندنەوەی کڕیارە بێدەنگەکان)      */}
      {/* ============================================================== */}
      {currentSection === 'retention' && (
        <div className="space-y-5">
          {/* Retention Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-1">
              <span className="text-xs text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-rose-500" />
                سەیارە بێدەنگەکان (١٥+ ڕۆژە نەهاتوون)
              </span>
              <div className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono pt-0.5">{expiredCount}</div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">کڕیار لە مەترسی بەسەرچوونی خاڵەکانن</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-1">
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                کڕیارانی چالاک (سەردانیان بەردەوامە)
              </span>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono pt-0.5">{activeCount}</div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">سەیارە لە ماوەی یاسایی لۆیەڵتیدان</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-1">
              <span className="text-xs text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 text-blue-500" />
                ڕێژەی وەفاداری (Retention Rate)
              </span>
              <div className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono pt-0.5">
                {totalVehiclesCount > 0 ? ((activeCount / totalVehiclesCount) * 100).toFixed(0) : 0}%
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">ڕێژەی ئەو سەیارانەی دەگەڕێنەوە</p>
            </div>
          </div>

          {/* Retention Inactive Vehicles Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                  لیستی کڕیارە بێدەنگەکان بۆ ڕاکێشانەوە:
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  بە کلیک لەسەر دوگمەی سەوز نامەیەکی جوان لە ڕێگەی واتسئاپ بۆ کڕیارەکە ئامادە دەبێت تا سەردان بکاتەوە.
                </p>
              </div>
              <span className="text-xs px-2.5 py-0.5 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 rounded-full font-bold">
                {expiredCount} کڕیار
              </span>
            </div>

            {expiredVehicles.length === 0 ? (
              <div className="text-center py-8 text-emerald-600 dark:text-emerald-400 space-y-1.5">
                <CheckCircle2 className="w-7 h-7 mx-auto" />
                <div className="font-bold text-xs">دەستخۆش! هیچ کڕیارێکی بێدەنگت نییە.</div>
                <p className="text-xs text-slate-400 dark:text-slate-500">تەواوی سەیارەکان لە ماوەی کەمتر لە ١٥ ڕۆژدا سەردانیان کردووە.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="text-[11px] text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                    <tr>
                      <th className="py-2.5 px-3">سەیارە و تابلۆ</th>
                      <th className="py-2.5 px-3">خاوەن و مۆبایل</th>
                      <th className="py-2.5 px-3">دواین بەروار</th>
                      <th className="py-2.5 px-3">ماوەی بێدەنگی</th>
                      <th className="py-2.5 px-3">خاڵ لە مەترسیدا</th>
                      <th className="py-2.5 px-3 text-center">نامەی گەڕاندنەوە</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {expiredVehicles.map((v) => {
                      const daysPassed = calculateDaysSince(v.lastVisitDate);

                      return (
                        <tr key={v.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50">
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2">
                              <PlateDisplay plate={v.plate} size="sm" />
                              <span className="font-bold text-slate-900 dark:text-white text-xs">{v.carModel}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-800 dark:text-slate-200 text-xs">{v.ownerName}</div>
                            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{v.phone || 'بێ ژمارە'}</div>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400 text-xs">
                            {v.lastVisitDate ? v.lastVisitDate.split('T')[0] : 'نادیار'}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold font-mono">
                              {daysPassed} ڕۆژە نەهاتووە
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-amber-700 text-xs">
                            {v.currentCycleWashes} شۆردن
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {v.phone ? (
                              <button
                                onClick={() => handleSendReminder(v, daysPassed)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                                title="ناردنی نامەی یادخستنەوە بۆ کڕیار"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                ناردنی نامەی واتسئاپ
                              </button>
                            ) : (
                              <span className="text-slate-400 text-[10px]">بێ مۆبایل</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. SUB-SECTION: 4. HISTORY & LOGS (مێژووی تەواوی شۆردنەکان)    */}
      {/* ============================================================== */}
      {currentSection === 'history' && (
        <div className="space-y-5">
          {/* History Metrics Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-1">
              <span className="text-xs text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-blue-500" />
                کۆی شۆردنە تۆمارکراوەکان
              </span>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono pt-0.5">
                {allWashLogs.length}
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">لۆگی تەواوی سەیارەکان لە سەرەتاوە</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-1">
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                شۆردنی بەخۆڕایی بەخشراو (Free)
              </span>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono pt-0.5">
                {totalFreeWashesGiven}
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">شۆردنی 0 دینار وەک پاداشتی لۆیەڵتی</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-1">
              <span className="text-xs text-purple-600 dark:text-purple-400 font-bold flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-purple-500" />
                کۆی داهاتی وەرگیراو لە شۆردن
              </span>
              <div className="text-xl font-black text-slate-900 dark:text-white font-mono pt-0.5 truncate">
                {formatIQD(totalHistoryRevenue)}
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">کۆی گشتی داهاتی تۆمارکراوی کاشێر</p>
            </div>
          </div>

          {/* History Search & Filter Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-2.5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="گەڕان لەناو مێژوودا بەپێی تابلۆ، ناوی کڕیار، ناوی خزمەتگوزاری..."
                className="w-full pr-9 pl-7 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900"
              />
              {historySearch && (
                <button
                  onClick={() => setHistorySearch('')}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-slate-400 text-xs">جۆر:</span>
              <select
                value={historyTypeFilter}
                onChange={(e) => setHistoryTypeFilter(e.target.value as any)}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
              >
                <option value="all">هەموو شۆردنەکان</option>
                <option value="paid">شۆردنی پارەدار</option>
                <option value="free">شۆردنی بەخۆڕایی (Free)</option>
              </select>
            </div>
          </div>

          {/* Complete History Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            {filteredHistory.length === 0 ? (
              <div className="text-center py-10 text-slate-400 dark:text-slate-500 space-y-1.5">
                <History className="w-7 h-7 opacity-30 mx-auto" />
                <div className="font-bold text-xs">هیچ مێژوویەکی شۆردن نەدۆزرایەوە بەم مەرجانە.</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold">
                    <tr>
                      <th className="py-2.5 px-3">بەروار و کات</th>
                      <th className="py-2.5 px-3">تابلۆی سەیارە</th>
                      <th className="py-2.5 px-3">خاوەن و مۆدێل</th>
                      <th className="py-2.5 px-3">خزمەتگوزاری</th>
                      <th className="py-2.5 px-3">نرخ (IQD)</th>
                      <th className="py-2.5 px-3">هۆڵ / وەستا</th>
                      <th className="py-2.5 px-3 text-center">پسوولە</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredHistory.map((item) => {
                      const formattedDate = new Date(item.date).toLocaleString('ku', {
                        year: 'numeric',
                        month: 'numeric',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      });

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-2 px-3 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                            {formattedDate}
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            <PlateDisplay plate={item.vehicle.plate} size="sm" />
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            <div className="font-bold text-slate-900 text-xs">{item.vehicle.ownerName}</div>
                            <div className="text-[10px] text-slate-400">
                              {item.vehicle.carModel} ({item.vehicle.color})
                            </div>
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            <span className="font-bold text-slate-800 text-xs">{item.serviceName}</span>
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            {item.isFree ? (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full font-bold text-[10px]">
                                FREE (0 IQD)
                              </span>
                            ) : (
                              <span className="font-mono font-bold text-emerald-700 text-xs">
                                {formatIQD(item.price)}
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap text-slate-600 text-xs">
                            <div>{item.bayNumber ? `هۆڵی ${item.bayNumber}` : '—'}</div>
                            <div className="text-[10px] text-slate-400">{item.staffName || '—'}</div>
                          </td>
                          <td className="py-2 px-3 text-center whitespace-nowrap">
                            <button
                              onClick={() => {
                                setReceiptVehicle(item.vehicle);
                                setReceiptRecord(item);
                              }}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 transition cursor-pointer"
                              title="چاپکردنەوەی پسوولەی کاشێر"
                            >
                              <Printer className="w-3 h-3 text-blue-600" />
                              پسوولە
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* EDIT VEHICLE MODAL (LIGHT STUDIO)                              */}
      {/* ============================================================== */}
      {editingVehicle && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto text-slate-900 dark:text-white">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Edit className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                دەستکاریکردنی زانیاری سەیارە
              </h3>
              <button
                onClick={() => setEditingVehicle(null)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              {/* Plate Switcher */}
              <div>
                <label className="text-slate-700 dark:text-slate-300 block mb-1 font-bold">جۆری تابلۆ:</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPlateType('unified')}
                    className={`flex-1 py-2 rounded-xl font-bold transition border ${
                      plateType === 'unified'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    تابلۆی نوێ (کوردستان / عێراق)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlateType('old')}
                    className={`flex-1 py-2 rounded-xl font-bold transition border ${
                      plateType === 'old'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    تابلۆی کۆن
                  </button>
                </div>
              </div>

              {/* Unified Plate Fields */}
              {plateType === 'unified' ? (
                <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <div>
                    <label className="text-slate-500 block mb-1 font-medium">کۆدی شار:</label>
                    <select
                      value={provinceCode}
                      onChange={(e) => setProvinceCode(e.target.value)}
                      className="w-full px-2 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white"
                    >
                      {OFFICIAL_PROVINCES.map((p) => (
                        <option key={p.code} value={p.code}>
                          {p.code} - {p.nameKu}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-1 font-medium">پیت (Letter):</label>
                    <input
                      type="text"
                      maxLength={2}
                      value={plateLetter}
                      onChange={(e) => setPlateLetter(e.target.value.toUpperCase())}
                      className="w-full px-2 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono uppercase text-center font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-1 font-medium">ژمارەی تابلۆ:</label>
                    <input
                      type="text"
                      required
                      placeholder="8966"
                      value={plateNumber}
                      onChange={(e) => setPlateNumber(e.target.value)}
                      className="w-full px-2 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-slate-900 dark:text-white text-center"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <div>
                    <label className="text-slate-500 block mb-1 font-medium">شار:</label>
                    <select
                      value={oldCity}
                      onChange={(e) => setOldCity(e.target.value)}
                      className="w-full px-2 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white"
                    >
                      {OLD_PLATE_CITIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-1 font-medium">پۆڵێن:</label>
                    <select
                      value={oldCategory}
                      onChange={(e) => setOldCategory(e.target.value)}
                      className="w-full px-2 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white"
                    >
                      {OLD_PLATE_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-1 font-medium">ژمارە:</label>
                    <input
                      type="text"
                      required
                      placeholder="258569"
                      value={oldNumber}
                      onChange={(e) => setOldNumber(e.target.value)}
                      className="w-full px-2 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-slate-900 dark:text-white text-center"
                    />
                  </div>
                </div>
              )}

              {/* Owner and Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1 font-bold">ناوی کڕیار:</label>
                  <input
                    type="text"
                    required
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:bg-white dark:focus:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-bold">ژمارەی مۆبایل (WhatsApp):</label>
                  <input
                    type="text"
                    placeholder="07501234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white text-left focus:bg-white dark:focus:bg-slate-900"
                  />
                </div>
              </div>

              {/* Car Model, Color & Size */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1 font-bold">مۆدێلی سەیارە:</label>
                  <input
                    type="text"
                    required
                    value={carModel}
                    onChange={(e) => setCarModel(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:bg-white dark:focus:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-bold">ڕەنگ:</label>
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-bold">قەبارەی سەیارە:</label>
                  <select
                    value={vehicleSize}
                    onChange={(e) => setVehicleSize(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:bg-white dark:focus:bg-slate-900"
                  >
                    <option value="sedan">سالۆن (بچووک)</option>
                    <option value="suv">جیپ (SUV / 4x4)</option>
                    <option value="truck">بارهەڵگر / پیکاب</option>
                  </select>
                </div>
              </div>

              {/* Customer PIN & NFC Sticker */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1 font-bold">کۆدی نهێنی کڕیار (PIN 4-ژمارە):</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={customerPin}
                    onChange={(e) => setCustomerPin(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-center tracking-widest text-slate-900 dark:text-white font-bold focus:bg-white dark:focus:bg-slate-900"
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="editNfcSticker"
                    checked={hasNfcSticker}
                    onChange={(e) => setHasNfcSticker(e.target.checked)}
                    className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                  />
                  <label htmlFor="editNfcSticker" className="text-slate-700 font-bold cursor-pointer">
                    ستیکەری لۆیەڵتی NFC بەستراوە
                  </label>
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition shadow-xs"
                >
                  پاشەکەوتکردنی گۆڕانکارییەکان
                </button>
                <button
                  type="button"
                  onClick={() => setEditingVehicle(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition"
                >
                  داخستن
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ADD VEHICLE MODAL (LIGHT STUDIO)                               */}
      {/* ============================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto text-slate-900 dark:text-white">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600" />
                تۆمارکردنی سەیارەی نوێ و لۆیەڵتی
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddVehicle} className="space-y-3.5 text-xs">
              {/* Plate Switcher */}
              <div>
                <label className="text-slate-700 block mb-1 font-bold">جۆری تابلۆ:</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPlateType('unified')}
                    className={`flex-1 py-2 rounded-xl font-bold transition border ${
                      plateType === 'unified'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    تابلۆی نوێ (کوردستان / عێراق)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlateType('old')}
                    className={`flex-1 py-2 rounded-xl font-bold transition border ${
                      plateType === 'old'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    تابلۆی کۆن
                  </button>
                </div>
              </div>

              {/* Unified Plate Fields */}
              {plateType === 'unified' ? (
                <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <div>
                    <label className="text-slate-500 block mb-1 font-medium">کۆدی شار:</label>
                    <select
                      value={provinceCode}
                      onChange={(e) => setProvinceCode(e.target.value)}
                      className="w-full px-2 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white"
                    >
                      {OFFICIAL_PROVINCES.map((p) => (
                        <option key={p.code} value={p.code}>
                          {p.code} - {p.nameKu}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-1 font-medium">پیت (Letter):</label>
                    <input
                      type="text"
                      maxLength={2}
                      value={plateLetter}
                      onChange={(e) => setPlateLetter(e.target.value.toUpperCase())}
                      className="w-full px-2 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono uppercase text-center font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-1 font-medium">ژمارەی تابلۆ:</label>
                    <input
                      type="text"
                      required
                      placeholder="8966"
                      value={plateNumber}
                      onChange={(e) => setPlateNumber(e.target.value)}
                      className="w-full px-2 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-slate-900 dark:text-white text-center"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <div>
                    <label className="text-slate-500 block mb-1 font-medium">شار:</label>
                    <select
                      value={oldCity}
                      onChange={(e) => setOldCity(e.target.value)}
                      className="w-full px-2 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white"
                    >
                      {OLD_PLATE_CITIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-1 font-medium">پۆڵێن:</label>
                    <select
                      value={oldCategory}
                      onChange={(e) => setOldCategory(e.target.value)}
                      className="w-full px-2 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white"
                    >
                      {OLD_PLATE_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-1 font-medium">ژمارە:</label>
                    <input
                      type="text"
                      required
                      placeholder="258569"
                      value={oldNumber}
                      onChange={(e) => setOldNumber(e.target.value)}
                      className="w-full px-2 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-slate-900 dark:text-white text-center"
                    />
                  </div>
                </div>
              )}

              {/* Owner and Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1 font-bold">ناوی کڕیار:</label>
                  <input
                    type="text"
                    required
                    placeholder="کاک کاروان..."
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:bg-white dark:focus:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-bold">ژمارەی مۆبایل (WhatsApp):</label>
                  <input
                    type="text"
                    placeholder="07501234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white text-left focus:bg-white dark:focus:bg-slate-900"
                  />
                </div>
              </div>

              {/* Car Model, Color & Size */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1 font-bold">مۆدێلی سەیارە:</label>
                  <input
                    type="text"
                    required
                    placeholder="Toyota Camry"
                    value={carModel}
                    onChange={(e) => setCarModel(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:bg-white dark:focus:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-bold">ڕەنگ:</label>
                  <input
                    type="text"
                    placeholder="سپی، ڕەش..."
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-bold">قەبارەی سەیارە:</label>
                  <select
                    value={vehicleSize}
                    onChange={(e) => setVehicleSize(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:bg-white dark:focus:bg-slate-900"
                  >
                    <option value="sedan">سالۆن (بچووک)</option>
                    <option value="suv">جیپ (SUV / 4x4)</option>
                    <option value="truck">بارهەڵگر / پیکاب</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition shadow-xs"
                >
                  تۆمارکردن و دروستکردنی لۆیەڵتی
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition"
                >
                  داخستن
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* REPRINT RECEIPT MODAL                                          */}
      {/* ============================================================== */}
      {receiptVehicle && receiptRecord && (
        <ReceiptModal
          vehicle={receiptVehicle}
          service={{
            id: receiptRecord.serviceId,
            name: receiptRecord.serviceName,
            price: receiptRecord.price,
            description: '',
            durationMinutes: 30,
          }}
          staffName={receiptRecord.staffName || 'وەستای بەرپرس'}
          isFree={receiptRecord.isFree}
          freeReason={receiptRecord.freeReason}
          isSubscriptionWash={receiptRecord.isSubscriptionWash}
          cafeItems={receiptRecord.cafeItems}
          cafeTotal={receiptRecord.cafeTotal}
          paymentMethod={receiptRecord.paymentMethod}
          isDebt={receiptRecord.paymentStatus === 'unpaid' || receiptRecord.paymentMethod === 'debt'}
          settings={settings}
          chargedPrice={receiptRecord.price}
          vehicleSize={receiptRecord.vehicleSize}
          onClose={() => {
            setReceiptVehicle(null);
            setReceiptRecord(null);
          }}
        />
      )}

      {/* ============================================================== */}
      {/* NFC VIP PASS & WINDSHIELD STICKER MODAL                        */}
      {/* ============================================================== */}
      {nfcModalVehicle && (
        <NfcStickerModal
          vehicle={nfcModalVehicle}
          settings={settings}
          onClose={() => setNfcModalVehicle(null)}
          onNotify={onNotify}
        />
      )}

      {/* ============================================================== */}
      {/* VIP UNLIMITED SUBSCRIPTION MODAL                               */}
      {/* ============================================================== */}
      {subscriptionVehicle && (
        <SubscriptionModal
          vehicle={subscriptionVehicle}
          settings={settings}
          onClose={() => setSubscriptionVehicle(null)}
          onSubscribe={(updated: Vehicle, amountPaid: number) => {
            onUpdateVehicles(vehicles.map((v) => (v.id === updated.id ? updated : v)));
            setSubscriptionVehicle(null);
            onNotify(`👑 ئابوونەی VIP بۆ ${updated.ownerName} نوێکرایەوە (${formatIQD(amountPaid)})!`);
          }}
        />
      )}
    </div>
  );
};
