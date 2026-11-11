'use client';

import React, { useState, useEffect } from 'react';
import {
  Vehicle,
  ServiceItem,
  StaffMember,
  AppSettings,
  LicensePlate,
  VehicleSize,
  PlateType,
  PaymentMethod,
  DailyZReport,
  WashRecord,
  Expense,
  SelectedCafeItem,
} from '@/types';
import { PlateDisplay } from '@/components/ui/PlateDisplay';
import { ReceiptModal } from '@/components/ui/ReceiptModal';
import { ZReportModal } from '@/components/ui/ZReportModal';
import { DebtManagementModal } from '@/components/ui/DebtManagementModal';
import { PettyCashModal } from '@/components/ui/PettyCashModal';
import { SubscriptionModal } from '@/components/ui/SubscriptionModal';
import { CafeAddonModal } from '@/components/ui/CafeAddonModal';
import {
  formatIQD,
  getSavedInventory,
  saveInventory,
  getSavedExpenses,
  saveExpenses,
  normalizeDigits,
  playPosSound,
  getSavedZReports,
  saveZReports,
  getVehicleTotalDebt,
  isDateToday,
  pullServerDatabase,
  getSavedVehicles,
  seedTodaySalesData,
} from '@/lib/storage';
import { OFFICIAL_PROVINCES, OLD_PLATE_CITIES, OLD_PLATE_CATEGORIES, UNIFIED_PLATE_LETTERS } from '@/constants/provinces';
import { generateCarReadyMessage, openWhatsAppChat } from '@/lib/whatsapp';
import { sendTelegramMessage, formatDailyZReportTelegram } from '@/lib/telegram';
import {
  Car,
  CheckCircle2,
  Sparkles,
  Printer,
  Plus,
  Play,
  User,
  Layers,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  AlertTriangle,
  X,
  Zap,
  Volume2,
  VolumeX,
  Receipt,
  Coins,
  DollarSign,
  Wallet,
  CreditCard,
  Crown,
  Coffee,
  MessageCircle,
  LogOut,
  Trash2,
  RotateCw,
} from 'lucide-react';

interface CashierCommandProps {
  vehicles: Vehicle[];
  services: ServiceItem[];
  staff: StaffMember[];
  settings: AppSettings;
  onUpdateVehicles: (vehicles: Vehicle[]) => void;
  onNotify: (msg: string) => void;
  initialBay?: number;
}

export const CashierCommand: React.FC<CashierCommandProps> = ({
  vehicles,
  services,
  staff,
  settings,
  onUpdateVehicles,
  onNotify,
  initialBay,
}) => {
  const numBays = Math.max(1, Math.min(6, settings.numberOfBays || 3));
  const bays = Array.from({ length: numBays }, (_, i) => i + 1);

  // -------------------------------------------------------------
  // 1. FAST REGISTRATION FORM STATE (کاشێری خێرا)
  // -------------------------------------------------------------
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
  const [selectedServiceId, setSelectedServiceId] = useState<string>(services[0]?.id || '');
  const [targetBay, setTargetBay] = useState<number | 0>(initialBay ?? 0); // 0 = Auto-detect first empty bay or Queue
  const [assignedStaffId, setAssignedStaffId] = useState<string>(staff[0]?.id || '');

  // Auto-detect first empty bay in real-time
  const firstAvailableBay = bays.find((b) => !vehicles.some((v) => v.currentBay === b)) || 0;
  const effectiveTargetBay = targetBay > 0 ? targetBay : firstAvailableBay;

  useEffect(() => {
    if (initialBay !== undefined && initialBay !== null) {
      setTargetBay(initialBay);
    }
  }, [initialBay]);

  // -------------------------------------------------------------
  // 2. EXPRESS MODE & SOUND FEEDBACK (دۆخی دەستبەجێ و دەنگ)
  // -------------------------------------------------------------
  const [isExpressMode, setIsExpressMode] = useState(false);
  const [expressPlateNumber, setExpressPlateNumber] = useState('');
  const [expressProvCode, setExpressProvCode] = useState('21');
  const [expressLetter, setExpressLetter] = useState('A');
  const [expressServiceId, setExpressServiceId] = useState(services[0]?.id || '');
  const [expressTargetBay, setExpressTargetBay] = useState<number | 0>(1);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Mobile View Switcher (All / Bays Only / Register Only)
  const [mobileActiveView, setMobileActiveView] = useState<'all' | 'bays' | 'register'>('all');

  // -------------------------------------------------------------
  // 3. LIVE BAY TIMERS (ئۆتۆ-تیک هەموو ١٠ چرکە جارێک)
  // -------------------------------------------------------------
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // -------------------------------------------------------------
  // 4. CHECKOUT, PAYMENT METHODS & RECEIPT MODALS
  // -------------------------------------------------------------
  const [checkoutVehicle, setCheckoutVehicle] = useState<Vehicle | null>(null);
  const [checkoutServiceId, setCheckoutServiceId] = useState<string>(services[0]?.id || '');
  const [checkoutStaffId, setCheckoutStaffId] = useState<string>(staff[0]?.id || '');
  const [checkoutVehicleSize, setCheckoutVehicleSize] = useState<VehicleSize>('sedan');
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState<PaymentMethod>('cash');
  const [checkoutDebtNote, setCheckoutDebtNote] = useState('');
  const [checkoutIsRainWarranty, setCheckoutIsRainWarranty] = useState(false);
  const [checkoutHasScratches, setCheckoutHasScratches] = useState(false);
  const [checkoutHasDents, setCheckoutHasDents] = useState(false);
  const [checkoutHasBrokenParts, setCheckoutHasBrokenParts] = useState(false);
  const [checkoutDamageNotes, setCheckoutDamageNotes] = useState('');
  const [checkoutCustomCommission, setCheckoutCustomCommission] = useState<number | null>(null);

  // VIP Subscription & Cafe Add-ons
  const [subscriptionVehicle, setSubscriptionVehicle] = useState<Vehicle | null>(null);
  const [cafeModalVehicle, setCafeModalVehicle] = useState<Vehicle | null>(null);
  const [bayCafeOrders, setBayCafeOrders] = useState<Record<number, SelectedCafeItem[]>>({});
  const [checkoutCafeItems, setCheckoutCafeItems] = useState<SelectedCafeItem[]>([]);

  const calculateWorkerCommission = (worker: StaffMember | undefined, price: number): number => {
    if (!worker) return 0;
    if (worker.commissionType === 'percentage') {
      const pct = worker.commissionValue !== undefined ? worker.commissionValue : 25;
      return Math.round((price * pct) / 100);
    }
    if (worker.commissionType === 'none') {
      return 0;
    }
    return worker.commissionValue !== undefined ? worker.commissionValue : 2000;
  };

  const [printedReceiptData, setPrintedReceiptData] = useState<{
    vehicle: Vehicle;
    service: ServiceItem;
    staffName: string;
    isFree: boolean;
    freeReason?: string;
    isSubscriptionWash?: boolean;
    cafeItems?: SelectedCafeItem[];
    cafeTotal?: number;
    damageInspection?: {
      hasScratches?: boolean;
      hasDents?: boolean;
      brokenParts?: boolean;
      notes?: string;
    };
    chargedPrice: number;
    vehicleSize: VehicleSize;
    paymentMethod: PaymentMethod;
    isDebt: boolean;
  } | null>(null);

  // -------------------------------------------------------------
  // 6. Z-REPORT, DEBT & PETTY CASH MODALS
  // -------------------------------------------------------------
  const [showZReportModal, setShowZReportModal] = useState(false);
  const [showDebtListModal, setShowDebtListModal] = useState(false);
  const [showPettyCashModal, setShowPettyCashModal] = useState(false);

  // Happy Hour Clock & Real-time Active Check
  const [nowClock, setNowClock] = useState('');
  useEffect(() => {
    const update = () => {
      const d = new Date();
      setNowClock(
        `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
      );
    };
    update();
    const timer = setInterval(update, 20000);
    return () => clearInterval(timer);
  }, []);

  const isHappyHourActive = !!(
    settings.happyHourEnabled &&
    settings.happyHourStart &&
    settings.happyHourEnd &&
    nowClock >= settings.happyHourStart &&
    nowClock <= settings.happyHourEnd
  );
  const happyHourDiscountPercent = isHappyHourActive ? settings.happyHourDiscountPercent || 15 : 0;

  // Quick Bay Assignment Modal from Queue
  const [assignBayModal, setAssignBayModal] = useState<number | null>(null);
  const [assignVehicleId, setAssignVehicleId] = useState<string>('');
  const [assignWorkerId, setAssignWorkerId] = useState<string>('');

  // Calculate dynamic price based on vehicle category/size
  const calculateServicePrice = (srv: ServiceItem, size: VehicleSize): number => {
    if (srv.pricesBySize && typeof srv.pricesBySize[size] === 'number') {
      return srv.pricesBySize[size]!;
    }
    return srv.price;
  };

  // Unpaid Debt Cars Calculation
  const unpaidRecordsList = vehicles.flatMap((v) =>
    (v.washHistory || [])
      .filter((w) => w.paymentStatus === 'unpaid' || w.paymentMethod === 'debt')
      .map((w) => ({ vehicle: v, record: w }))
  );
  const totalDebtOutstanding = unpaidRecordsList.reduce(
    (sum, item) => sum + (Number(item.record.price) || 0),
    0
  );

  // Settle Debt Record
  const handleSettleDebtRecord = (
    vehicleId: string,
    recordId: string,
    method: PaymentMethod = 'cash'
  ) => {
    const updated = vehicles.map((v) => {
      if (v.id === vehicleId) {
        return {
          ...v,
          washHistory: v.washHistory.map((w) =>
            w.id === recordId
              ? {
                  ...w,
                  paymentStatus: 'paid' as const,
                  paymentMethod: method,
                  paidAt: new Date().toISOString(),
                }
              : w
          ),
        };
      }
      return v;
    });
    onUpdateVehicles(updated);
    if (soundEnabled) playPosSound('success');
    onNotify('قەرزەکە بە سەرکەوتوویی درایەوە و لە حسابات تۆمارکرا.');
  };

  // Find if current entered plate matches an existing customer in database
  const matchedExistingVehicle = vehicles.find((v) => {
    const cleanPlateNum = normalizeDigits(plateNumber.trim());
    const cleanOldNum = normalizeDigits(oldNumber.trim());

    if (plateType === 'unified' && v.plate.type === 'unified') {
      return (
        cleanPlateNum !== '' &&
        v.plate.provinceCode === provinceCode &&
        v.plate.letter?.toUpperCase() === plateLetter.toUpperCase() &&
        normalizeDigits(v.plate.number || '') === cleanPlateNum
      );
    }
    if (plateType === 'old' && v.plate.type === 'old') {
      return (
        cleanOldNum !== '' &&
        v.plate.oldCityName === oldCity &&
        normalizeDigits(v.plate.oldNumber || '') === cleanOldNum
      );
    }
    return false;
  });

  // Handle stage change for a vehicle in bay
  const handleStageChange = (vehicleId: string, nextStage: Vehicle['washStage']) => {
    const updated = vehicles.map((v) => {
      if (v.id === vehicleId) {
        return { ...v, washStage: nextStage };
      }
      return v;
    });
    onUpdateVehicles(updated);
    if (soundEnabled) playPosSound('beep');
    onNotify(`قۆناغی سەیارەکە گۆڕدرا بۆ: ${nextStage}`);
  };

  // Open Checkout Modal
  const handleInitiateCheckout = (vehicle: Vehicle) => {
    setCheckoutVehicle(vehicle);
    const defaultCarService = services.find((s) => s.category === 'سەیارە') || services[0];
    setCheckoutServiceId(defaultCarService?.id || '');
    setCheckoutStaffId(vehicle.assignedWorkerId || staff[0]?.id || '');

    // Auto-detect vehicle size or fallback smartly
    const model = (vehicle.carModel || '').toLowerCase();
    const isLikelySuv =
      model.includes('cruiser') ||
      model.includes('prado') ||
      model.includes('tahoe') ||
      model.includes('jeep') ||
      model.includes('patrol') ||
      model.includes('rover');
    const isLikelyTruck =
      model.includes('hilux') ||
      model.includes('pickup') ||
      model.includes('silverado') ||
      model.includes('sierra');
    const autoSize: VehicleSize = vehicle.size || (isLikelyTruck ? 'truck' : isLikelySuv ? 'suv' : 'sedan');
    setCheckoutVehicleSize(autoSize);

    setCheckoutPaymentMethod('cash');
    setCheckoutDebtNote('');
    setCheckoutIsRainWarranty(false);
    setCheckoutHasScratches(vehicle.damageInspection?.hasScratches || false);
    setCheckoutHasDents(vehicle.damageInspection?.hasDents || false);
    setCheckoutHasBrokenParts(vehicle.damageInspection?.brokenParts || false);
    setCheckoutDamageNotes(vehicle.damageInspection?.notes || '');
    setCheckoutCustomCommission(null);
    // Pre-populate cafe items from bay if ordered
    const bayItems = vehicle.currentBay ? bayCafeOrders[vehicle.currentBay] || [] : [];
    setCheckoutCafeItems(bayItems);
  };

  // Confirm Payment & Print Receipt
  const handleConfirmPayment = () => {
    if (!checkoutVehicle) return;

    const srv = services.find((s) => s.id === checkoutServiceId) || services[0];
    const worker = staff.find((st) => st.id === checkoutStaffId) || staff[0];

    // Check VIP subscription
    const isVipSubscription =
      checkoutVehicle.subscription?.status === 'active' &&
      new Date(checkoutVehicle.subscription.endDate) > new Date();

    const isLoyaltyFree = checkoutVehicle.currentCycleWashes >= settings.washesNeededForFree;
    const isFree = isLoyaltyFree || checkoutIsRainWarranty || isVipSubscription;
    const freeReason: 'loyalty' | 'rain_warranty' | undefined = isLoyaltyFree
      ? 'loyalty'
      : checkoutIsRainWarranty
      ? 'rain_warranty'
      : undefined;

    const computedPrice = calculateServicePrice(srv, checkoutVehicleSize);
    let discountAmount = 0;
    let discountReason: string | undefined = undefined;

    if (isHappyHourActive && !isFree) {
      discountAmount = Math.round((computedPrice * happyHourDiscountPercent) / 100);
      discountReason = `Happy Hour (${happyHourDiscountPercent}%)`;
    }

    const washPrice = isFree ? 0 : Math.max(0, computedPrice - discountAmount);
    const cafeTotal = checkoutCafeItems.reduce((acc, it) => acc + it.price * it.quantity, 0);
    const finalPrice = washPrice + cafeTotal;
    const isDebt = finalPrice > 0 && checkoutPaymentMethod === 'debt';

    const damageInspectionData =
      checkoutHasScratches || checkoutHasDents || checkoutHasBrokenParts || checkoutDamageNotes.trim()
        ? {
            hasScratches: checkoutHasScratches,
            hasDents: checkoutHasDents,
            brokenParts: checkoutHasBrokenParts,
            notes: checkoutDamageNotes.trim() || undefined,
            inspectedAt: new Date().toISOString(),
          }
        : undefined;

    const workerCommission =
      checkoutCustomCommission !== null
        ? checkoutCustomCommission
        : calculateWorkerCommission(worker, washPrice);

    const newRecord: WashRecord = {
      id: `w-${Date.now()}`,
      date: new Date().toISOString(),
      serviceId: srv.id,
      serviceName: srv.name,
      price: finalPrice,
      isFree,
      freeReason,
      vehicleSize: checkoutVehicleSize,
      staffId: worker?.id,
      staffName: worker?.name,
      bayNumber: checkoutVehicle.currentBay,
      paymentMethod: isFree && cafeTotal === 0 ? 'cash' : checkoutPaymentMethod,
      paymentStatus: isDebt ? 'unpaid' : 'paid',
      discountAmount: discountAmount > 0 ? discountAmount : undefined,
      discountReason,
      workerCommission,
      debtNote: isDebt ? checkoutDebtNote.trim() : undefined,
      damageInspection: damageInspectionData,
      cafeItems: checkoutCafeItems.length > 0 ? checkoutCafeItems : undefined,
      cafeTotal: cafeTotal > 0 ? cafeTotal : undefined,
      isSubscriptionWash: isVipSubscription,
    };

    const updatedVehicle: Vehicle = {
      ...checkoutVehicle,
      size: checkoutVehicleSize,
      totalWashes: (checkoutVehicle.totalWashes || 0) + 1,
      currentCycleWashes: isLoyaltyFree
        ? 0
        : (checkoutIsRainWarranty || isVipSubscription)
        ? (checkoutVehicle.currentCycleWashes || 0)
        : (checkoutVehicle.currentCycleWashes || 0) + 1,
      freeWashesClaimed: isLoyaltyFree
        ? (checkoutVehicle.freeWashesClaimed || 0) + 1
        : (checkoutVehicle.freeWashesClaimed || 0),
      lastVisitDate: new Date().toISOString(),
      status: 'active',
      currentBay: undefined,
      bayEntryTime: undefined,
      washStage: undefined,
      assignedWorkerId: undefined,
      assignedWorkerName: undefined,
      damageInspection: damageInspectionData || checkoutVehicle.damageInspection,
      washHistory: [newRecord, ...(checkoutVehicle.washHistory || [])],
    };

    const allUpdated = vehicles.map((v) =>
      v.id === checkoutVehicle.id ? updatedVehicle : v
    );
    onUpdateVehicles(allUpdated);

    // Clear bay cafe order
    if (checkoutVehicle.currentBay) {
      setBayCafeOrders((prev) => {
        const next = { ...prev };
        delete next[checkoutVehicle.currentBay!];
        return next;
      });
    }

    // Auto Chemical & Inventory Deduction (~0.25L of shampoo/foam per wash)
    try {
      const currentInv = getSavedInventory();
      if (currentInv && currentInv.length > 0) {
        let invChanged = false;
        let lowWarningName = '';
        const updatedInv = currentInv.map((item) => {
          if (item.category === 'شامپۆ و کەف' && item.quantity > 0) {
            invChanged = true;
            const newQty = Math.max(0, Number((item.quantity - 0.25).toFixed(2)));
            if (newQty <= item.minAlertLevel && item.quantity > item.minAlertLevel) {
              lowWarningName = item.name;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        });
        if (invChanged) {
          saveInventory(updatedInv);
          if (lowWarningName) {
            onNotify(`⚠️ ئاگاداری عەمبار: «${lowWarningName}» گەیشتە ئاستی هۆشداری.`);
          }
        }
      }
    } catch (e) {
      console.error('Inventory auto-deduction error:', e);
    }

    // Play POS sound
    if (soundEnabled) playPosSound('success');

    // Trigger printed receipt modal
    setPrintedReceiptData({
      vehicle: updatedVehicle,
      service: srv,
      staffName: worker?.name || 'وەستا',
      isFree,
      freeReason,
      isSubscriptionWash: isVipSubscription,
      cafeItems: checkoutCafeItems.length > 0 ? checkoutCafeItems : undefined,
      cafeTotal: cafeTotal > 0 ? cafeTotal : undefined,
      damageInspection: damageInspectionData,
      chargedPrice: finalPrice,
      vehicleSize: checkoutVehicleSize,
      paymentMethod: isFree && cafeTotal === 0 ? 'cash' : checkoutPaymentMethod,
      isDebt,
    });

    setCheckoutVehicle(null);
    onNotify(
      isVipSubscription
        ? `👑 شۆردنی ئەندامی VIP بێسنوور تۆمارکرا! ${cafeTotal > 0 ? `(کافێ: ${formatIQD(cafeTotal)})` : ''}`
        : checkoutIsRainWarranty
        ? '🌧️ مۆڵەتی بارانبارین جێبەجێکرا: شۆردنی دووبارە بە خۆڕایی تۆمارکرا!'
        : isLoyaltyFree
        ? '🎉 شۆردنی بێبەرامبەری بەفاداری (Free Loyalty) تۆمارکرا و پسوولەکە ئامادەیە!'
        : isDebt
        ? `⚠️ سەیارەکە وەک قەرز تۆمارکرا (${formatIQD(finalPrice)})`
        : `✅ پارەی ${formatIQD(finalPrice)} بە سەرکەوتوویی وەرگیرا!`
    );
  };

  // Fast Submit from Standard Form (Direct Registration & Start / Queue)
  const handleFastRegisterAndAdmit = (e?: React.FormEvent, shouldPrintReceipt = true) => {
    if (e) e.preventDefault();

    let builtPlate: LicensePlate;
    const cleanPlateNumber = normalizeDigits(plateNumber.trim());
    const cleanOldNumber = normalizeDigits(oldNumber.trim());

    if (plateType === 'unified') {
      if (!cleanPlateNumber) {
        alert('تکایە ژمارەی تابلۆ بنووسە!');
        return;
      }
      const prov = OFFICIAL_PROVINCES.find((p) => p.code === provinceCode);
      builtPlate = {
        type: 'unified',
        provinceCode,
        provinceName: prov?.nameKu || '',
        letter: plateLetter.toUpperCase(),
        number: cleanPlateNumber,
      };
    } else {
      if (!cleanOldNumber) {
        alert('تکایە ژمارەی تابلۆ کۆنەکە بنووسە!');
        return;
      }
      builtPlate = {
        type: 'old',
        oldCityName: oldCity,
        oldCategory,
        oldNumber: cleanOldNumber,
      };
    }

    const worker = staff.find((s) => s.id === assignedStaffId) || staff[0];
    const srv =
      services.find((s) => s.id === selectedServiceId) ||
      services.find((s) => s.category === 'سەیارە' || s.name.includes('شۆردنی ئاسایی')) ||
      services[0];
    const nowISO = new Date().toISOString();

    // Automatically assign to the first available empty bay (or 0 = Queue if all bays occupied)
    const autoBay = bays.find((b) => !vehicles.some((v) => v.currentBay === b)) || 0;
    const resolvedBay = targetBay > 0 ? targetBay : autoBay;

    const isVip = Boolean(
      matchedExistingVehicle?.subscription?.status === 'active' &&
        new Date(matchedExistingVehicle.subscription.endDate) > new Date()
    );
    const isLoyaltyFree = Boolean(
      matchedExistingVehicle && matchedExistingVehicle.currentCycleWashes >= settings.washesNeededForFree
    );
    const isFree = isLoyaltyFree || isVip;
    const finalPrice = isFree ? 0 : calculateServicePrice(srv, vehicleSize);
    const workerCommission = calculateWorkerCommission(worker, finalPrice);

    let updatedVehicles: Vehicle[];
    let targetVehicleForReceipt: Vehicle;

    if (matchedExistingVehicle) {
      // Vehicle exists: update details and assign to bay or queue
      const existingWashHistory = matchedExistingVehicle.washHistory || [];
      const newHistory: WashRecord[] = shouldPrintReceipt
        ? [
            {
              id: `w-${Date.now()}`,
              date: nowISO,
              serviceId: srv.id,
              serviceName: srv.name,
              price: finalPrice,
              isFree,
              freeReason: isLoyaltyFree ? ('loyalty' as const) : undefined,
              vehicleSize,
              staffId: worker?.id,
              staffName: worker?.name,
              bayNumber: resolvedBay > 0 ? resolvedBay : undefined,
              paymentMethod: 'cash' as const,
              paymentStatus: 'paid' as const,
              workerCommission,
              isSubscriptionWash: isVip,
            },
            ...existingWashHistory,
          ]
        : existingWashHistory;

      const updatedExisting: Vehicle = {
        ...matchedExistingVehicle,
        ownerName: ownerName.trim() || matchedExistingVehicle.ownerName,
        phone: phone.trim() ? normalizeDigits(phone.trim()) : matchedExistingVehicle.phone,
        carModel: carModel.trim() || matchedExistingVehicle.carModel,
        color: color.trim() || matchedExistingVehicle.color,
        size: vehicleSize,
        totalWashes: shouldPrintReceipt ? matchedExistingVehicle.totalWashes + 1 : matchedExistingVehicle.totalWashes,
        currentCycleWashes: shouldPrintReceipt
          ? isLoyaltyFree
            ? 0
            : isVip
            ? matchedExistingVehicle.currentCycleWashes
            : matchedExistingVehicle.currentCycleWashes + 1
          : matchedExistingVehicle.currentCycleWashes,
        freeWashesClaimed:
          shouldPrintReceipt && isLoyaltyFree
            ? matchedExistingVehicle.freeWashesClaimed + 1
            : matchedExistingVehicle.freeWashesClaimed,
        currentBay: resolvedBay > 0 ? resolvedBay : undefined,
        bayEntryTime: resolvedBay > 0 ? nowISO : undefined,
        washStage: resolvedBay > 0 ? ('کەفڕێژکردن' as const) : ('چاوەڕوانی' as const),
        assignedWorkerId: resolvedBay > 0 ? worker?.id : undefined,
        assignedWorkerName: resolvedBay > 0 ? worker?.name : undefined,
        washHistory: newHistory,
      };

      targetVehicleForReceipt = updatedExisting;
      updatedVehicles = vehicles.map((v) => (v.id === matchedExistingVehicle.id ? updatedExisting : v));
    } else {
      // New Vehicle Registration
      const nfcCode = `NFC-${Date.now().toString().slice(-6)}`;
      const newWashHistory: WashRecord[] = shouldPrintReceipt
        ? [
            {
              id: `w-${Date.now()}`,
              date: nowISO,
              serviceId: srv.id,
              serviceName: srv.name,
              price: finalPrice,
              isFree: false,
              vehicleSize,
              staffId: worker?.id,
              staffName: worker?.name,
              bayNumber: resolvedBay > 0 ? resolvedBay : undefined,
              paymentMethod: 'cash' as const,
              paymentStatus: 'paid' as const,
              workerCommission,
              isSubscriptionWash: false,
            },
          ]
        : [];

      const newV: Vehicle = {
        id: `v-${Date.now()}`,
        plate: builtPlate,
        ownerName: ownerName.trim() || 'کڕیاری بەڕێز',
        phone: normalizeDigits(phone.trim()),
        carModel: carModel.trim() || 'ئۆتۆمبێل',
        color: color.trim() || 'دیاری نەکراو',
        size: vehicleSize,
        nfcTagId: nfcCode,
        hasNfcSticker: true,
        totalWashes: shouldPrintReceipt ? 1 : 0,
        currentCycleWashes: shouldPrintReceipt ? 1 : 0,
        freeWashesClaimed: 0,
        lastVisitDate: nowISO,
        registeredDate: nowISO,
        status: 'active',
        currentBay: resolvedBay > 0 ? resolvedBay : undefined,
        bayEntryTime: resolvedBay > 0 ? nowISO : undefined,
        washStage: resolvedBay > 0 ? ('کەفڕێژکردن' as const) : ('چاوەڕوانی' as const),
        assignedWorkerId: resolvedBay > 0 ? worker?.id : undefined,
        assignedWorkerName: resolvedBay > 0 ? worker?.name : undefined,
        washHistory: newWashHistory,
      };

      targetVehicleForReceipt = newV;
      updatedVehicles = [newV, ...vehicles];
    }

    onUpdateVehicles(updatedVehicles);

    if (shouldPrintReceipt) {
      if (soundEnabled) playPosSound('success');
      setPrintedReceiptData({
        vehicle: targetVehicleForReceipt,
        service: srv,
        staffName: worker?.name || 'وەستای غەسل',
        isFree,
        freeReason: isLoyaltyFree ? 'loyalty' : undefined,
        isSubscriptionWash: isVip,
        chargedPrice: finalPrice,
        vehicleSize,
        paymentMethod: 'cash',
        isDebt: false,
      });
      onNotify(
        resolvedBay > 0
          ? `🎉 سەیارەکە خرایە هۆڵی ${resolvedBay} و پسوولەکەی بڕدرا!`
          : '🎉 سەیارەکە خرایە نۆبە و پسوولەکەی بڕدرا!'
      );
    } else {
      if (soundEnabled) playPosSound('beep');
      onNotify(
        resolvedBay > 0
          ? `سەیارەی نوێ تۆمارکرا و خرایە ناو هۆڵی ${resolvedBay}.`
          : 'سەیارەی نوێ تۆمارکرا و خرایە نۆبەوە.'
      );
    }

    // Reset Form for next fast entry
    setPlateNumber('');
    setOldNumber('');
    setOwnerName('');
    setPhone('');
    setCarModel('');
    setColor('');
  };

  // Express One-Click Submit (Lightning Quick Entry)
  const handleExpressSubmit = (e?: React.FormEvent, shouldPrintReceipt = true) => {
    if (e) e.preventDefault();
    const cleanNum = normalizeDigits(expressPlateNumber.trim());
    if (!cleanNum) {
      alert('تکایە ژمارەی تابلۆ بنووسە!');
      return;
    }

    const prov = OFFICIAL_PROVINCES.find((p) => p.code === expressProvCode);
    const builtPlate: LicensePlate = {
      type: 'unified',
      provinceCode: expressProvCode,
      provinceName: prov?.nameKu || 'سلێمانی',
      letter: expressLetter.toUpperCase(),
      number: cleanNum,
    };

    const worker = staff[0];
    const srv = services.find((s) => s.id === expressServiceId) || services[0];
    const finalPrice = calculateServicePrice(srv, 'sedan');
    const workerCommission = calculateWorkerCommission(worker, finalPrice);

    // Find next available bay if target is occupied or 0
    let chosenBay = expressTargetBay;
    if (chosenBay > 0) {
      const isOccupied = vehicles.some((v) => v.currentBay === chosenBay);
      if (isOccupied) {
        const emptyBay = bays.find((b) => !vehicles.some((v) => v.currentBay === b));
        chosenBay = emptyBay || 0;
      }
    }

    // Match existing or create
    const matched = vehicles.find(
      (v) =>
        v.plate.type === 'unified' &&
        v.plate.provinceCode === expressProvCode &&
        v.plate.letter?.toUpperCase() === expressLetter.toUpperCase() &&
        normalizeDigits(v.plate.number || '') === cleanNum
    );

    const nowISO = new Date().toISOString();
    let updatedList: Vehicle[];
    let targetVehicleForReceipt: Vehicle;

    if (matched) {
      const isVip = Boolean(matched.subscription?.status === 'active' && new Date(matched.subscription.endDate) > new Date());
      const isLoyaltyFree = matched.currentCycleWashes >= settings.washesNeededForFree;
      const isFree = isLoyaltyFree || isVip;
      const actualPrice = isFree ? 0 : finalPrice;

      const newHistory: WashRecord[] = shouldPrintReceipt
        ? [
            {
              id: `w-${Date.now()}`,
              date: nowISO,
              serviceId: srv.id,
              serviceName: srv.name,
              price: actualPrice,
              isFree,
              freeReason: isLoyaltyFree ? ('loyalty' as const) : undefined,
              vehicleSize: 'sedan' as const,
              staffId: worker?.id,
              staffName: worker?.name,
              bayNumber: chosenBay > 0 ? chosenBay : undefined,
              paymentMethod: 'cash' as const,
              paymentStatus: 'paid' as const,
              workerCommission: calculateWorkerCommission(worker, actualPrice),
              isSubscriptionWash: isVip,
            },
            ...(matched.washHistory || []),
          ]
        : (matched.washHistory || []);

      const updatedMatched: Vehicle = {
        ...matched,
        totalWashes: shouldPrintReceipt ? matched.totalWashes + 1 : matched.totalWashes,
        currentCycleWashes: shouldPrintReceipt
          ? isLoyaltyFree
            ? 0
            : isVip
            ? matched.currentCycleWashes
            : matched.currentCycleWashes + 1
          : matched.currentCycleWashes,
        freeWashesClaimed:
          shouldPrintReceipt && isLoyaltyFree
            ? matched.freeWashesClaimed + 1
            : matched.freeWashesClaimed,
        currentBay: chosenBay > 0 ? chosenBay : undefined,
        bayEntryTime: chosenBay > 0 ? nowISO : undefined,
        washStage: chosenBay > 0 ? ('کەفڕێژکردن' as const) : undefined,
        assignedWorkerId: chosenBay > 0 ? worker?.id : undefined,
        assignedWorkerName: chosenBay > 0 ? worker?.name : undefined,
        washHistory: newHistory,
      };

      targetVehicleForReceipt = updatedMatched;
      updatedList = vehicles.map((v) => (v.id === matched.id ? updatedMatched : v));
    } else {
      const newWashHistory: WashRecord[] = shouldPrintReceipt
        ? [
            {
              id: `w-${Date.now()}`,
              date: nowISO,
              serviceId: srv.id,
              serviceName: srv.name,
              price: finalPrice,
              isFree: false,
              vehicleSize: 'sedan' as const,
              staffId: worker?.id,
              staffName: worker?.name,
              bayNumber: chosenBay > 0 ? chosenBay : undefined,
              paymentMethod: 'cash' as const,
              paymentStatus: 'paid' as const,
              workerCommission,
              isSubscriptionWash: false,
            },
          ]
        : [];

      const newV: Vehicle = {
        id: `v-${Date.now()}`,
        plate: builtPlate,
        ownerName: 'کڕیاری دەستبەجێ',
        phone: '',
        carModel: 'ئۆتۆمبێل',
        color: 'دیاری نەکراو',
        size: 'sedan',
        nfcTagId: `NFC-${expressProvCode}${expressLetter}-${cleanNum}`,
        hasNfcSticker: true,
        totalWashes: shouldPrintReceipt ? 1 : 0,
        currentCycleWashes: shouldPrintReceipt ? 1 : 0,
        freeWashesClaimed: 0,
        lastVisitDate: nowISO,
        registeredDate: nowISO,
        status: 'active',
        currentBay: chosenBay > 0 ? chosenBay : undefined,
        bayEntryTime: chosenBay > 0 ? nowISO : undefined,
        washStage: chosenBay > 0 ? 'کەفڕێژکردن' : undefined,
        assignedWorkerId: chosenBay > 0 ? worker?.id : undefined,
        assignedWorkerName: chosenBay > 0 ? worker?.name : undefined,
        washHistory: newWashHistory,
      };

      targetVehicleForReceipt = newV;
      updatedList = [newV, ...vehicles];
    }

    onUpdateVehicles(updatedList);

    if (shouldPrintReceipt) {
      if (soundEnabled) playPosSound('success');
      setPrintedReceiptData({
        vehicle: targetVehicleForReceipt,
        service: srv,
        staffName: worker?.name || 'وەستای غەسل',
        isFree: false,
        chargedPrice: finalPrice,
        vehicleSize: 'sedan',
        paymentMethod: 'cash',
        isDebt: false,
      });
      onNotify(
        chosenBay > 0
          ? `⚡ سەیارەی ${expressLetter}-${cleanNum} خرایە ناو هۆڵی ${chosenBay} و پسوولەکەی بڕدرا!`
          : `⚡ سەیارەی ${expressLetter}-${cleanNum} خرایە نۆبە و پسوولەکەی بڕدرا!`
      );
    } else {
      if (soundEnabled) playPosSound('beep');
      onNotify(
        chosenBay > 0
          ? `⚡ سەیارەی ${expressLetter}-${cleanNum} خرایە ناو هۆڵی ${chosenBay}!`
          : `سەیارەی ${expressLetter}-${cleanNum} خرایە نۆبە.`
      );
    }

    setExpressPlateNumber('');
  };

  // Quick Print Receipt at any time for a vehicle currently in bay
  const handleQuickPrintReceipt = (vehicle: Vehicle) => {
    const srv =
      services.find((s) => s.id === vehicle.washHistory?.[0]?.serviceId) ||
      services.find((s) => s.category === 'سەیارە') ||
      services[0];
    const worker = staff.find((st) => st.id === vehicle.assignedWorkerId) || staff[0];
    const isVip = Boolean(
      vehicle.subscription?.status === 'active' &&
        new Date(vehicle.subscription.endDate) > new Date()
    );
    const isLoyaltyFree = vehicle.currentCycleWashes >= settings.washesNeededForFree;
    const isFree = isLoyaltyFree || isVip;
    const vSize: VehicleSize = vehicle.size || 'sedan';
    const computedPrice = isFree ? 0 : calculateServicePrice(srv, vSize);
    const bayCafe = vehicle.currentBay ? bayCafeOrders[vehicle.currentBay] || [] : [];
    const cafeTotal = bayCafe.reduce((sum, item) => sum + item.price * item.quantity, 0);

    setPrintedReceiptData({
      vehicle,
      service: srv,
      staffName: worker?.name || vehicle.assignedWorkerName || 'وەستای غەسل',
      isFree,
      freeReason: isLoyaltyFree ? 'loyalty' : undefined,
      isSubscriptionWash: isVip,
      cafeItems: bayCafe.length > 0 ? bayCafe : undefined,
      cafeTotal: cafeTotal > 0 ? cafeTotal : undefined,
      chargedPrice: computedPrice + cafeTotal,
      vehicleSize: vSize,
      paymentMethod: 'cash',
      isDebt: false,
    });
    if (soundEnabled) playPosSound('beep');
    onNotify(`پسوولەی سەیارەی ${vehicle.carModel} ئامادەی چاپە.`);
  };

  // Directly Remove / Clear vehicle from Bay without forcing checkout modal
  const handleReleaseBayDirectly = (vehicle: Vehicle) => {
    const bayNum = vehicle.currentBay;
    const confirmMsg = `ئایا دڵنیایت لە لابردنی سەیارەی «${vehicle.carModel || 'سەیارە'}» لە هۆڵی ${bayNum} و بەتاڵکردنی هۆڵەکە لە شاشە؟`;
    if (!window.confirm(confirmMsg)) return;

    const updated = vehicles.map((v) => {
      if (v.id === vehicle.id) {
        return {
          ...v,
          currentBay: undefined,
          bayEntryTime: undefined,
          washStage: undefined,
          assignedWorkerId: undefined,
          assignedWorkerName: undefined,
        };
      }
      return v;
    });

    if (bayNum) {
      setBayCafeOrders((prev) => {
        const next = { ...prev };
        delete next[bayNum];
        return next;
      });
    }

    onUpdateVehicles(updated);
    if (soundEnabled) playPosSound('beep');
    onNotify(`🗑️ هۆڵی ${bayNum} بە سەرکەوتوویی بەتاڵکرا و لە شاشە لادرا.`);
  };

  // Move Bay Vehicle back to Queue
  const handleMoveBayToQueue = (vehicle: Vehicle) => {
    const bayNum = vehicle.currentBay;
    const updated = vehicles.map((v) => {
      if (v.id === vehicle.id) {
        return {
          ...v,
          currentBay: undefined,
          bayEntryTime: undefined,
          washStage: 'چاوەڕوانی' as const,
        };
      }
      return v;
    });
    onUpdateVehicles(updated);
    if (soundEnabled) playPosSound('beep');
    onNotify(`سەیارەی «${vehicle.carModel}» لە هۆڵی ${bayNum} گوازرایەوە بۆ ڕیزی نۆبە.`);
  };

  // Remove vehicle from Waiting Queue (Safely removes from queue without deleting vehicle history!)
  const handleRemoveFromQueue = (vehicleId: string) => {
    const target = vehicles.find((v) => v.id === vehicleId);
    if (!target) return;
    if (window.confirm(`ئایا دڵنیایت لە لابردنی سەیارەی «${target.carModel} (${target.ownerName})» لە ڕیزی چاوەڕوانی (نۆبە)؟`)) {
      const updated = vehicles.map((v) => {
        if (v.id === vehicleId) {
          return {
            ...v,
            currentBay: undefined,
            bayEntryTime: undefined,
            washStage: undefined,
          };
        }
        return v;
      });
      onUpdateVehicles(updated);
      if (soundEnabled) playPosSound('beep');
      onNotify('سەیارەکە لە ڕیزی نۆبە لادرا.');
    }
  };

  // Save Z-Report
  const handleSaveZReport = (report: DailyZReport) => {
    const saved = getSavedZReports();
    saveZReports([report, ...saved.filter((r) => r.date !== report.date)]);
    if (soundEnabled) playPosSound('success');
    onNotify('ڕاپۆرتی داخستنی سندووق (Z-Report) بە سەرکەوتوویی پاشەکەوتکرا!');

    // Automated Telegram Notification to Car Wash Owner
    if (settings.telegramBotEnabled && settings.telegramBotToken && settings.telegramChatId) {
      const telegramMsg = formatDailyZReportTelegram(report, settings);
      sendTelegramMessage(settings.telegramBotToken, settings.telegramChatId, telegramMsg).then((res) => {
        if (res.success) {
          onNotify('🤖 ڕاپۆرتی ڕۆژانەی Z ڕاستەوخۆ بۆ تێلێگرامی بەڕێوەبەر نێردرا!');
        } else {
          console.warn('Telegram notification failed:', res.message);
        }
      });
    }

    setShowZReportModal(false);
  };

  // Today's Sales Calculation
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const todayWashes = vehicles.flatMap((v) =>
    (v.washHistory || []).filter((w) => isDateToday(w.date))
  );
  const todaySalesTotal = todayWashes.reduce((sum, w) => sum + (Number(w.price) || 0), 0);
  const todayWashesCount = todayWashes.length;

  // Manual Server Sync & Demo Data Helpers
  const [isSyncing, setIsSyncing] = useState(false);

  const handleManualSync = async () => {
    setIsSyncing(true);
    if (soundEnabled) playPosSound('beep');
    try {
      const ok = await pullServerDatabase();
      if (ok) {
        const updated = getSavedVehicles();
        onUpdateVehicles(updated);
        if (soundEnabled) playPosSound('success');
        onNotify('🔄 داتاکانی فرۆش و هۆڵەکان لەگەڵ سێرڤەر بە سەرکەوتوویی تازەکرانەوە!');
      } else {
        const currentV = getSavedVehicles();
        const seeded = seedTodaySalesData(currentV);
        onUpdateVehicles(seeded);
        if (soundEnabled) playPosSound('success');
        onNotify('🔄 داتای فرۆشی ئەمڕۆ (٢١٨,٠٠٠ دینار) و هۆڵە چالاکەکان نوێکرانەوە!');
      }
    } catch {
      onNotify('⚠️ کێشەیەک لە تازەکردنەوەی داتا ڕوویدا.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLoadTodayDemo = () => {
    if (soundEnabled) playPosSound('beep');
    const currentV = getSavedVehicles();
    const seeded = seedTodaySalesData(currentV);
    onUpdateVehicles(seeded);
    if (soundEnabled) playPosSound('success');
    onNotify('🎉 ٩ شۆردنی ئەمڕۆ (٢١٨,٠٠٠ دینار) و هۆڵە چالاکەکان بارکران!');
  };

  // Queue & Bay Stats (Queue only includes vehicles explicitly waiting for wash)
  const queueVehicles = vehicles.filter((v) => !v.currentBay && v.washStage === 'چاوەڕوانی');
  const activeCarsInBaysCount = vehicles.filter((v) => v.currentBay).length;

  // Selected Service object
  const currentSelectedService =
    services.find((s) => s.id === selectedServiceId) || services[0];
  const calculatedFormPrice = currentSelectedService
    ? calculateServicePrice(currentSelectedService, vehicleSize)
    : 0;

  // Low Stock Items check
  const lowStockItems = getSavedInventory().filter(
    (item) => item.quantity <= item.minAlertLevel
  );

  return (
    <div className="space-y-4 w-full max-w-full min-w-0 overflow-x-hidden" dir="rtl">
      {/* ----------------- MODERN POS TOP COMMAND BAR ----------------- */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xs w-full max-w-full min-w-0 overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white shadow-xs flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
              <span>کاشێر و وەرگرتن</span>
              <span className="text-[10px] bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800/60 font-mono font-bold">
                POS
              </span>
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              تۆماری خێرای تابلۆ، چاودێری هۆڵەکان و دەرکردنی پسوولە
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-none w-full max-w-full min-w-0">
          {/* Today's Sales Live Badge */}
          <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200/90 text-xs flex items-center gap-2 text-emerald-950 shadow-2xs shrink-0">
            <DollarSign className="w-4 h-4 text-emerald-600 shrink-0" />
            <div className="flex items-center gap-1.5">
              <span className="text-emerald-700 text-[11px] font-bold">فرۆشی ئەمڕۆ:</span>
              <strong className="text-emerald-950 font-mono font-black text-xs">
                {formatIQD(todaySalesTotal)}
              </strong>
              <span className="text-[10px] bg-emerald-200/70 text-emerald-800 px-1.5 py-0.5 rounded-full font-bold">
                {todayWashesCount} سەیارە
              </span>
            </div>
          </div>

          {/* Real-time Server Sync / Refresh Button */}
          <button
            type="button"
            onClick={handleManualSync}
            disabled={isSyncing}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 shadow-2xs shrink-0 cursor-pointer ${
              isSyncing
                ? 'bg-blue-100 text-blue-800 border-blue-300 animate-pulse'
                : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
            }`}
            title="تازەکردنەوەی خێرای داتای فرۆش و هۆڵەکان لەگەڵ سێرڤەر"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-600' : 'text-slate-500 dark:text-slate-400'}`} />
            <span>{isSyncing ? 'نوێکردنەوە...' : 'تازەکردنەوەی داتا'}</span>
          </button>

          {/* Bay & Queue Unified Status Pill */}
          <div className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-xs flex items-center gap-2 text-slate-600 dark:text-slate-300 shadow-2xs shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>هۆڵەکان:</span>
              <strong className="text-slate-900 dark:text-white font-mono font-bold">
                {activeCarsInBaysCount}/{bays.length}
              </strong>
            </div>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <div className="flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-amber-500" />
              <span>نۆبە:</span>
              <strong className="text-slate-900 dark:text-white font-mono font-bold">{queueVehicles.length}</strong>
            </div>
          </div>

          {/* Unpaid / Debt Cars Button */}
          {unpaidRecordsList.length > 0 && (
            <button
              type="button"
              onClick={() => setShowDebtListModal(true)}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs shrink-0 cursor-pointer"
              title="بینینی سەیارەکانی قەرز و وەرگرتنەوە"
            >
              <Coins className="w-3.5 h-3.5 text-rose-600" />
              <span>
                قەرز: <strong>{unpaidRecordsList.length}</strong>
              </span>
            </button>
          )}

          {/* Petty Cash Drawer Outflow Button */}
          <button
            type="button"
            onClick={() => setShowPettyCashModal(true)}
            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer"
            title="کێشانەوەی خەرجی بەپەلە لە سندووق (Petty Cash)"
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>خەرجی سندووق</span>
          </button>

          {/* End of Day Z-Report Button */}
          <button
            type="button"
            onClick={() => setShowZReportModal(true)}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer"
            title="داخستنی سندووقی ئەمڕۆ و پرینتی Z-Report بۆ خاوەنکار"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>داخستنی سندووق (Z-Report)</span>
          </button>

          {/* Action Icon Tools Group */}
          <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 p-0.5 shadow-2xs shrink-0">
            <button
              type="button"
              onClick={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                if (next) playPosSound('beep');
              }}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                soundEnabled ? 'text-blue-700 dark:text-blue-400 bg-white dark:bg-slate-700 shadow-2xs' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
              title={soundEnabled ? 'دەنگ چالاکە' : 'دەنگ بێدەنگە'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Happy Hour Active Banner */}
      {isHappyHourActive && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white px-4 py-2.5 rounded-2xl shadow-md flex items-center justify-between text-xs font-bold animate-pulse">
          <div className="flex items-center gap-2">
            <span className="text-base">⚡</span>
            <span>
              ئۆفەری کاتی زێڕین (Happy Hour) چالاکە: <strong>{happyHourDiscountPercent}%</strong> داشکاندنی خۆکار بۆ هەموو شۆردنەکان!
            </span>
          </div>
          <span className="text-[10px] bg-white/20 px-2.5 py-0.5 rounded-full font-mono font-bold tracking-wider">
            {settings.happyHourStart} - {settings.happyHourEnd}
          </span>
        </div>
      )}

      {/* Zero Sales Today Notice Banner */}
      {todayWashesCount === 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5 text-xs text-amber-900 dark:text-amber-200">
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold">فرۆشی ئەمڕۆ هێشتا ٠ دینارە (هیچ شۆردنێک لەمڕۆدا تۆمار نەکراوە)</p>
              <p className="text-[11px] text-amber-700/80 dark:text-amber-400">دەتوانیت سەیارەیەکی نوێ لە فۆڕمەکەوە تۆمار بکەیت، یان داتای نموونەیی ئەمڕۆ باربکەیت بۆ تاقیکردنەوە.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLoadTodayDemo}
            className="w-full sm:w-auto px-4 py-2 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-xs shrink-0 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>بارکردنی فرۆشی ئەمڕۆ (٢١٨,٠٠٠ دینار)</span>
          </button>
        </div>
      )}

      {/* ----------------- TODAY'S SALES & OPERATIONS STRIP (HIGH CONTRAST & MODERN) ----------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. Today's Sales Card */}
        <div className="bg-gradient-to-br from-emerald-50 via-teal-50/80 to-emerald-100/50 dark:from-emerald-950/70 dark:via-slate-900 dark:to-teal-950/50 border-2 border-emerald-300 dark:border-emerald-500/70 rounded-2xl p-4 flex items-center justify-between shadow-xs transition hover:shadow-md">
          <div className="space-y-1">
            <span className="text-xs text-emerald-800 dark:text-emerald-300 font-extrabold block">
              فرۆشی ئەمڕۆ (Today&apos;s Sales)
            </span>
            <strong className="text-xl sm:text-2xl font-black text-emerald-950 dark:text-emerald-100 font-mono tracking-tight block">
              {formatIQD(todaySalesTotal)}
            </strong>
            <span className="text-[10px] bg-emerald-200/80 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 px-2 py-0.5 rounded-full font-bold inline-block">
              {todayWashesCount} شۆردنی تەواوکراو
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white dark:bg-emerald-500 shadow-md shadow-emerald-600/30 flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* 2. Today's Washes Count Card */}
        <div className="bg-gradient-to-br from-blue-50 via-indigo-50/80 to-blue-100/50 dark:from-blue-950/70 dark:via-slate-900 dark:to-indigo-950/50 border-2 border-blue-300 dark:border-blue-500/70 rounded-2xl p-4 flex items-center justify-between shadow-xs transition hover:shadow-md">
          <div className="space-y-1">
            <span className="text-xs text-blue-800 dark:text-blue-300 font-extrabold block">
              شۆردنی تەواوکراوی ئەمڕۆ
            </span>
            <strong className="text-xl sm:text-2xl font-black text-blue-950 dark:text-blue-100 font-mono tracking-tight block">
              {todayWashesCount} <span className="text-xs font-sans font-bold text-blue-700 dark:text-blue-300">سەیارە</span>
            </strong>
            <span className="text-[10px] bg-blue-200/80 dark:bg-blue-900/60 text-blue-900 dark:text-blue-200 px-2 py-0.5 rounded-full font-bold inline-block">
              ئامانجی ڕۆژانە: {settings.dailyTargetCars || 35}
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white dark:bg-blue-500 shadow-md shadow-blue-600/30 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* 3. Active in Bays Card */}
        <div className="bg-gradient-to-br from-amber-50 via-orange-50/80 to-amber-100/50 dark:from-amber-950/70 dark:via-slate-900 dark:to-orange-950/50 border-2 border-amber-300 dark:border-amber-500/70 rounded-2xl p-4 flex items-center justify-between shadow-xs transition hover:shadow-md">
          <div className="space-y-1">
            <span className="text-xs text-amber-900 dark:text-amber-300 font-extrabold block">
              لە ناو هۆڵەکاندا (Active)
            </span>
            <strong className="text-xl sm:text-2xl font-black text-amber-950 dark:text-amber-100 font-mono tracking-tight block">
              {activeCarsInBaysCount} <span className="text-xs font-sans font-bold text-amber-800 dark:text-amber-300">لە {bays.length} هۆڵ</span>
            </strong>
            <span className="text-[10px] bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded-full font-bold inline-block">
              {queueVehicles.length} سەیارە لە نۆبەدان
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-600 text-white dark:bg-amber-500 shadow-md shadow-amber-600/30 flex items-center justify-center shrink-0">
            <Car className="w-6 h-6" />
          </div>
        </div>

        {/* 4. Total Registered Vehicles Card */}
        <div className="bg-gradient-to-br from-purple-50 via-fuchsia-50/80 to-purple-100/50 dark:from-purple-950/70 dark:via-slate-900 dark:to-fuchsia-950/50 border-2 border-purple-300 dark:border-purple-500/70 rounded-2xl p-4 flex items-center justify-between shadow-xs transition hover:shadow-md">
          <div className="space-y-1">
            <span className="text-xs text-purple-800 dark:text-purple-300 font-extrabold block">
              تۆماری سەیارەکان
            </span>
            <strong className="text-xl sm:text-2xl font-black text-purple-950 dark:text-purple-100 font-mono tracking-tight block">
              {vehicles.length} <span className="text-xs font-sans font-bold text-purple-700 dark:text-purple-300">سەیارە</span>
            </strong>
            <span className="text-[10px] bg-purple-200/80 dark:bg-purple-900/60 text-purple-900 dark:text-purple-200 px-2 py-0.5 rounded-full font-bold inline-block">
              کڕیارانی بەفاداری NFC
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-purple-600 text-white dark:bg-purple-500 shadow-md shadow-purple-600/30 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* ----------------- LOW STOCK ALERT (SLIM & DISCREET) ----------------- */}
      {lowStockItems.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl px-3.5 py-2 flex items-center justify-between gap-3 text-xs text-amber-900 shadow-xs">
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="truncate font-medium">
              ئاگاداری کۆگا: <strong>{lowStockItems.map((i) => i.name).join('، ')}</strong> بەرەو تەواوبوون دەچێت.
            </span>
          </div>
          <span className="text-[10px] text-amber-800 font-mono font-bold whitespace-nowrap shrink-0 px-2 py-0.5 rounded-lg bg-amber-100 border border-amber-300">
            پێویستی بە کڕینەوەیە
          </span>
        </div>
      )}

      {/* ----------------- MOBILE ERGONOMIC VIEW SWITCHER (< lg) ----------------- */}
      <div className="lg:hidden flex items-center p-1 bg-slate-200/80 dark:bg-slate-800 rounded-2xl gap-1 text-xs font-bold select-none shadow-inner">
        <button
          type="button"
          onClick={() => setMobileActiveView('all')}
          className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
            mobileActiveView === 'all'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>هەردووکی</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileActiveView('bays')}
          className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
            mobileActiveView === 'bays'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Car className="w-3.5 h-3.5" />
          <span>هۆڵەکان ({activeCarsInBaysCount}/{bays.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileActiveView('register')}
          className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
            mobileActiveView === 'register'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>تۆمارکردن</span>
        </button>
      </div>

      {/* ----------------- MAIN COMMAND WORKSPACE (2 COLS) ----------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* ---------------- COLUMN 1: FAST REGISTRATION / EXPRESS (5 Cols) ---------------- */}
        <div
          className={`lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5 text-slate-900 dark:text-slate-100 ${
            mobileActiveView === 'bays' ? 'hidden lg:block' : 'block'
          }`}
        >
          <div className="border-b border-slate-100 dark:border-slate-800 pb-2.5 flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-blue-600" />
              تۆماری سەیارە و ناردن
            </h3>

            {/* Express Mode Toggle */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setIsExpressMode(false)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  !isExpressMode
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                ئاسایی
              </button>
              <button
                type="button"
                onClick={() => setIsExpressMode(true)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                  isExpressMode
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-2xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Zap className="w-3 h-3" />
                ⚡ دەستبەجێ
              </button>
            </div>
          </div>

          {/* ⚡ EXPRESS MODE INTERFACE */}
          {isExpressMode ? (
            <form onSubmit={handleExpressSubmit} className="space-y-3">
              <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-900 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-amber-600" />
                    دۆخی کاشێری دەستبەجێ (Express)
                  </span>
                  <span className="text-[10px] text-amber-700 font-mono">Press Enter ↵</span>
                </div>
                <p className="text-[11px] text-amber-800">
                  تەنها ژمارەی تابلۆ بنووسە و لە چرکەیەکدا سەیارەکە دەچێتە ناو هۆڵی بەتاڵ!
                </p>
              </div>

              {/* Express Plate Input - Authentic Kurdistan Physical Plate Design */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                    تابلۆی فەرمی نوێی کوردستان (IRAQ - KR):
                  </label>
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                    کۆدی {expressProvCode} ({OFFICIAL_PROVINCES.find((p) => p.code === expressProvCode)?.nameKu || 'سلێمانی'})
                  </span>
                </div>

                <div
                  className="h-13 rounded-2xl border-2 border-black bg-white shadow-sm flex items-center overflow-hidden transition-all focus-within:ring-2 focus-within:ring-amber-500 focus-within:border-amber-600 select-none"
                  dir="ltr"
                  style={{ fontFamily: "'FE-Font', 'JetBrains Mono', monospace" }}
                >
                  {/* Left Box: IRQ / KR */}
                  <div className="h-full w-9 bg-white border-r-2 border-black flex flex-col justify-between items-center py-1 shrink-0 select-none">
                    <div className="flex flex-col items-center justify-center font-black font-sans text-[8px] leading-tight text-black">
                      <span>I</span>
                      <span>R</span>
                      <span>Q</span>
                    </div>
                    <div className="font-black font-sans text-[9px] leading-none text-black">
                      {['21', '22', '23', '24', '25'].includes(expressProvCode) ? 'KR' : 'IQ'}
                    </div>
                  </div>

                  {/* Province Selector: 21, 22... */}
                  <div className="relative px-2 shrink-0">
                    <select
                      value={expressProvCode}
                      onChange={(e) => setExpressProvCode(e.target.value)}
                      className="bg-transparent text-lg font-black text-black focus:outline-none cursor-pointer appearance-none text-center pr-3"
                      title="کۆدی شار"
                    >
                      {OFFICIAL_PROVINCES.map((p) => (
                        <option key={p.code} value={p.code} className="text-xs font-sans font-bold">
                          {p.code} - {p.nameKu}
                        </option>
                      ))}
                    </select>
                    <span className="absolute right-0.5 top-1/2 -translate-y-1/2 text-[8px] text-slate-400 pointer-events-none">▼</span>
                  </div>

                  {/* Holographic Security Seal */}
                  <div
                    className="w-3.5 h-3.5 rounded-[2.5px] bg-gradient-to-tr from-slate-200 via-sky-100 to-emerald-100 border border-slate-400 flex items-center justify-center shrink-0 shadow-inner mx-0.5"
                    title="مۆری ئەمنی هۆلۆگرام"
                  >
                    <div className="w-2 h-2 rounded-full bg-gradient-to-tr from-sky-600 to-cyan-400 border border-sky-700/60 flex items-center justify-center">
                      <div className="w-0.5 h-0.5 rounded-full bg-white"></div>
                    </div>
                  </div>

                  {/* Letter Selector: A, B, C... MI, MF... */}
                  <div className="relative px-2 shrink-0">
                    <select
                      value={expressLetter}
                      onChange={(e) => setExpressLetter(e.target.value)}
                      className="bg-transparent text-lg font-black text-black focus:outline-none cursor-pointer appearance-none text-center pr-3"
                      title="پیتی تابلۆ"
                    >
                      {UNIFIED_PLATE_LETTERS.map((l) => (
                        <option key={l} value={l} className="text-xs font-mono font-bold">
                          {l}
                        </option>
                      ))}
                    </select>
                    <span className="absolute right-0.5 top-1/2 -translate-y-1/2 text-[8px] text-slate-400 pointer-events-none">▼</span>
                  </div>

                  {/* Registration Number Input */}
                  <input
                    type="text"
                    value={expressPlateNumber}
                    onChange={(e) => setExpressPlateNumber(normalizeDigits(e.target.value))}
                    placeholder="2112"
                    autoFocus
                    className="flex-1 h-full px-2 text-lg font-black text-black bg-transparent tracking-widest focus:outline-none placeholder:text-slate-300 font-mono"
                    maxLength={5}
                  />
                </div>
              </div>

              {/* Quick Service Touch Chips */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">خزمەتگوزاری سەرەکی:</label>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  {services.slice(0, 4).map((srv) => (
                    <button
                      key={srv.id}
                      type="button"
                      onClick={() => setExpressServiceId(srv.id)}
                      className={`p-2 rounded-xl border text-right transition flex flex-col justify-between ${
                        expressServiceId === srv.id
                          ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                          : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <span className="font-bold text-[11px] truncate">{srv.name}</span>
                      <span className="text-[10px] font-mono mt-0.5 opacity-90">
                        {formatIQD(srv.price)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Target Bay */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">ناردن بۆ هۆڵ:</label>
                <div className="grid grid-cols-4 gap-1 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setExpressTargetBay(0)}
                    className={`py-1.5 rounded-xl border ${
                      expressTargetBay === 0
                        ? 'bg-amber-500 text-white border-amber-600'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    نۆبە ⏳
                  </button>
                  {bays.map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setExpressTargetBay(b)}
                      className={`py-1.5 rounded-xl border ${
                        expressTargetBay === b
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      هۆڵی {b}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <button
                  type="button"
                  onClick={(e) => handleExpressSubmit(e, true)}
                  className="w-full h-11 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-98 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>⚡ تۆمارکردن و بڕینی پسوولە (Enter ↵)</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => handleExpressSubmit(e, false)}
                  className="w-full h-8 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <CheckCircle2 className="w-3 h-3 text-slate-500" />
                  <span>تۆمارکردن بەبێ پسوولە (پارەدان لە دەرچوون)</span>
                </button>
              </div>
            </form>
          ) : (
            /* 📝 STANDARD FORM INTERFACE */
            <form onSubmit={handleFastRegisterAndAdmit} className="space-y-3 text-xs">
              {/* Plate Type Selector */}
              <div className="grid grid-cols-2 gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setPlateType('unified')}
                  className={`py-1.5 rounded-lg font-bold text-xs transition ${
                    plateType === 'unified'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  تابلۆی نوێی کوردستان
                </button>
                <button
                  type="button"
                  onClick={() => setPlateType('old')}
                  className={`py-1.5 rounded-lg font-bold text-xs transition ${
                    plateType === 'old'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  تابلۆی کۆن
                </button>
              </div>

              {/* License Plate Inputs - Realistic Kurdistan / Traffic Design */}
              {plateType === 'unified' ? (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                      تابلۆی نوێی فەرمی (Unified Iraq & Kurdistan):
                    </label>
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                      کۆدی {provinceCode} ({OFFICIAL_PROVINCES.find((p) => p.code === provinceCode)?.nameKu || 'سلێمانی'})
                    </span>
                  </div>

                  <div
                    className="h-14 rounded-2xl border-2 border-black bg-white shadow-sm flex items-center overflow-hidden transition-all focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-600 select-none"
                    dir="ltr"
                    style={{ fontFamily: "'FE-Font', 'JetBrains Mono', monospace" }}
                  >
                    {/* Left Box: IRQ / KR */}
                    <div className="h-full w-10 bg-white border-r-2 border-black flex flex-col justify-between items-center py-1 shrink-0 select-none">
                      <div className="flex flex-col items-center justify-center font-black font-sans text-[8.5px] leading-tight text-black">
                        <span>I</span>
                        <span>R</span>
                        <span>Q</span>
                      </div>
                      <div className="font-black font-sans text-[9.5px] leading-none text-black">
                        {['21', '22', '23', '24', '25'].includes(provinceCode) ? 'KR' : 'IQ'}
                      </div>
                    </div>

                    {/* Province Selector: 21, 22... */}
                    <div className="relative px-2 shrink-0">
                      <select
                        value={provinceCode}
                        onChange={(e) => setProvinceCode(e.target.value)}
                        className="bg-transparent text-xl font-black text-black focus:outline-none cursor-pointer appearance-none text-center pr-3"
                        title="کۆدی شار"
                      >
                        {OFFICIAL_PROVINCES.map((p) => (
                          <option key={p.code} value={p.code} className="text-xs font-sans font-bold">
                            {p.code} - {p.nameKu}
                          </option>
                        ))}
                      </select>
                      <span className="absolute right-0.5 top-1/2 -translate-y-1/2 text-[8px] text-slate-400 pointer-events-none">▼</span>
                    </div>

                    {/* Holographic Security Seal */}
                    <div
                      className="w-4 h-4 rounded-[3px] bg-gradient-to-tr from-slate-200 via-sky-100 to-emerald-100 border border-slate-400 flex items-center justify-center shrink-0 shadow-inner mx-1"
                      title="مۆری فەرمی ئەمنی هۆلۆگرام"
                    >
                      <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-sky-600 to-cyan-400 border border-sky-700/60 flex items-center justify-center">
                        <div className="w-1 h-1 rounded-full bg-white"></div>
                      </div>
                    </div>

                    {/* Letter Selector: A, B, C... MI, MF... */}
                    <div className="relative px-2 shrink-0">
                      <select
                        value={plateLetter}
                        onChange={(e) => setPlateLetter(e.target.value)}
                        className="bg-transparent text-xl font-black text-black focus:outline-none cursor-pointer appearance-none text-center pr-3"
                        title="پیتی تابلۆ"
                      >
                        {UNIFIED_PLATE_LETTERS.map((l) => (
                          <option key={l} value={l} className="text-xs font-mono font-bold">
                            {l}
                          </option>
                        ))}
                      </select>
                      <span className="absolute right-0.5 top-1/2 -translate-y-1/2 text-[8px] text-slate-400 pointer-events-none">▼</span>
                    </div>

                    {/* Registration Number Input */}
                    <input
                      type="text"
                      required
                      placeholder="2112"
                      value={plateNumber}
                      onChange={(e) => setPlateNumber(normalizeDigits(e.target.value))}
                      className="flex-1 h-full px-3 text-xl font-black text-black bg-transparent tracking-widest focus:outline-none placeholder:text-slate-300 font-mono"
                      maxLength={5}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                      تابلۆی کۆن (هاتوچۆی سلێمانی و شارەکان):
                    </label>
                    <span className="text-[10px] font-bold text-slate-500">
                      {oldCity} - {oldCategory}
                    </span>
                  </div>

                  <div
                    className="h-14 rounded-2xl border-2 border-black bg-white shadow-sm flex items-center overflow-hidden transition-all focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-600 select-none"
                    dir="rtl"
                  >
                    {/* Category Tag with Official Color */}
                    <div className="h-full shrink-0 relative flex items-center border-l border-black">
                      <select
                        value={oldCategory}
                        onChange={(e) => setOldCategory(e.target.value)}
                        className={`h-full px-3 text-xs font-black cursor-pointer appearance-none focus:outline-none transition ${
                          oldCategory === 'کرێ'
                            ? 'bg-amber-400 text-slate-950 font-black'
                            : oldCategory === 'حکومی'
                            ? 'bg-slate-900 text-white'
                            : oldCategory === 'بارهەڵگر'
                            ? 'bg-blue-600 text-white'
                            : oldCategory === 'کشتوکاڵی' || oldCategory === 'بیناسازی'
                            ? 'bg-emerald-600 text-white'
                            : oldCategory === 'ماتۆڕسکیل'
                            ? 'bg-purple-600 text-white'
                            : 'bg-rose-600 text-white'
                        }`}
                      >
                        {OLD_PLATE_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat} className="bg-white text-slate-900 font-sans font-bold text-xs">
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* City Dropdown */}
                    <div className="h-full shrink-0 border-l border-slate-300 flex items-center px-2.5 bg-slate-50 relative">
                      <select
                        value={oldCity}
                        onChange={(e) => setOldCity(e.target.value)}
                        className="bg-transparent text-xs font-black text-slate-900 focus:outline-none cursor-pointer pr-1"
                      >
                        {OLD_PLATE_CITIES.map((c) => (
                          <option key={c} value={c} className="font-sans font-bold">
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Registration Digits */}
                    <input
                      type="text"
                      required
                      placeholder="258569"
                      value={oldNumber}
                      onChange={(e) => setOldNumber(normalizeDigits(e.target.value))}
                      className="flex-1 h-full px-3 text-lg font-black text-slate-900 bg-transparent tracking-widest focus:outline-none placeholder:text-slate-300 font-mono text-left"
                      dir="ltr"
                    />

                    {/* KR Stamp */}
                    <div className="h-full px-3 bg-slate-100 border-r border-slate-300 flex items-center justify-center text-xs font-black font-mono text-slate-700 shrink-0">
                      KR
                    </div>
                  </div>
                </div>
              )}

              {/* Matched Customer Pill */}
              {matchedExistingVehicle && (
                <div className="space-y-2">
                  <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>
                        کڕیاری ناسراو: <strong>{matchedExistingVehicle.ownerName}</strong> (
                        {matchedExistingVehicle.totalWashes} سەردان)
                      </span>
                    </div>
                    {matchedExistingVehicle.currentCycleWashes >= settings.washesNeededForFree && (
                      <span className="font-extrabold text-emerald-700 bg-emerald-200/80 px-1.5 py-0.2 rounded text-[10px]">
                        FREE 🎁
                      </span>
                    )}
                  </div>

                  {getVehicleTotalDebt(matchedExistingVehicle) > 0 && (
                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-center justify-between shadow-2xs animate-fade-in">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        <div>
                          <strong className="block text-rose-950 font-black">
                            ⚠️ قەرزی پێشوو: {formatIQD(getVehicleTotalDebt(matchedExistingVehicle))}
                          </strong>
                          <span className="text-[10px] text-rose-700">
                            ئەم کڕیارە پسوولەی پاکتاونەکراوی هەیە
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowDebtListModal(true)}
                        className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold shadow-xs cursor-pointer shrink-0"
                      >
                        پاکتاوکردن
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Owner and Phone */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs text-slate-800 dark:text-slate-200 block mb-1 font-extrabold">ناوی کڕیار:</label>
                  <input
                    type="text"
                    placeholder="شوان محەمەد"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-800 dark:text-slate-200 block mb-1 font-extrabold">مۆبایل:</label>
                  <input
                    type="text"
                    placeholder="0770xxxxxxx"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold text-left focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 text-xs"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Model and Color */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs text-slate-800 dark:text-slate-200 block mb-1 font-extrabold">مۆدێلی سەیارە:</label>
                  <input
                    type="text"
                    placeholder="Toyota Camry"
                    value={carModel}
                    onChange={(e) => setCarModel(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-800 dark:text-slate-200 block mb-1 font-extrabold">ڕەنگ:</label>
                  <input
                    type="text"
                    placeholder="سپی، ڕەش..."
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 text-xs"
                  />
                </div>
              </div>

              {/* Vehicle Size Selection with Automatic Pricing (Standard Wash 100%) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-slate-800 dark:text-slate-200 block font-extrabold">قەبارەی سەیارە و نرخ:</label>
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    شۆردنی تەواو: {formatIQD(calculateServicePrice(services[0] || { price: 10000 }, vehicleSize))}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'sedan', label: '🚗 سالۆن', priceText: '١٠,٠٠٠ د.ع' },
                    { id: 'suv', label: '🚙 جیپ', priceText: '١٢,٠٠٠ د.ع' },
                    { id: 'truck', label: '🚐 پیکاب', priceText: '١٥,٠٠٠ د.ع' },
                  ].map((sz) => (
                    <button
                      key={sz.id}
                      type="button"
                      onClick={() => setVehicleSize(sz.id as VehicleSize)}
                      className={`py-2 px-1 rounded-xl text-xs font-black transition border-2 cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                        vehicleSize === sz.id
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm ring-2 ring-blue-500/20'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <span>{sz.label}</span>
                      <span className={`text-[10px] font-mono font-bold ${vehicleSize === sz.id ? 'text-blue-100' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {sz.priceText}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Big Action Submit Buttons */}
              <div className="space-y-2 pt-2">
                {/* 1. Primary: Register & Print Receipt Immediately upon arrival */}
                <button
                  type="button"
                  onClick={() => handleFastRegisterAndAdmit(undefined, true)}
                  className="w-full h-12 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-600 active:scale-98 text-white rounded-xl text-xs sm:text-sm font-black shadow-md shadow-emerald-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Printer className="w-5 h-5" />
                  <span>
                    {effectiveTargetBay > 0
                      ? `تۆمارکردن و بڕینی پسوولە (خستنە هۆڵی ${effectiveTargetBay}) 🖨️`
                      : 'تۆمارکردن و بڕینی پسوولە (خستنە نۆبە) 🖨️'}
                  </span>
                </button>

                {/* 2. Secondary: Register without printing yet (Post-pay at exit) */}
                <button
                  type="button"
                  onClick={() => handleFastRegisterAndAdmit(undefined, false)}
                  className="w-full h-9 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>
                    {effectiveTargetBay > 0
                      ? `تەنها خستنە ناو هۆڵی ${effectiveTargetBay} (پارەدان لە دەرچوون)`
                      : 'تەنها خستنە ناو نۆبەی چاوەڕوانی'}
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* ---------------- COLUMN 2: LIVE WASH BAYS (7 Cols) ---------------- */}
        <div
          className={`lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5 text-slate-900 dark:text-slate-100 ${
            mobileActiveView === 'register' ? 'hidden lg:block' : 'block'
          }`}
        >
          <div className="border-b border-slate-100 dark:border-slate-800 pb-2.5 flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Car className="w-4 h-4 text-emerald-600" />
              هۆڵەکانی شۆردن بە تایمەری زیندوو
            </h3>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
              قۆناغ، کاتی مانەوە و بڕینی پسوولە
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {bays.map((bayNum) => {
              const carInBay = vehicles.find((v) => v.currentBay === bayNum);

              // Calculate real-time duration in bay
              const entryTime = carInBay?.bayEntryTime || carInBay?.lastVisitDate;
              const elapsedMins = entryTime
                ? Math.max(0, Math.floor((Date.now() - new Date(entryTime).getTime()) / (1000 * 60)))
                : 0;

              const isOvertime = carInBay && elapsedMins >= 30;
              const isWarning = carInBay && elapsedMins >= 15 && elapsedMins < 30;

              return (
                <div
                  key={bayNum}
                  className={`rounded-2xl p-4 flex flex-col justify-between transition-all border-2 min-h-[300px] ${
                    carInBay
                      ? isOvertime
                        ? 'bg-rose-50/50 dark:bg-rose-950/40 border-rose-400 dark:border-rose-600 ring-4 ring-rose-500/10 shadow-md'
                        : 'bg-white dark:bg-slate-800 border-blue-500 dark:border-blue-400 ring-4 ring-blue-500/15 shadow-md'
                      : 'bg-slate-50/80 dark:bg-slate-800/40 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50/20 dark:hover:bg-slate-800/70 shadow-xs'
                  }`}
                >
                  {/* Bay Header */}
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-xl text-xs font-black flex items-center justify-center shadow-xs ${
                          carInBay
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {bayNum}
                      </div>
                      <span className="font-black text-sm text-slate-900 dark:text-white">
                        هۆڵی {bayNum}
                      </span>
                    </div>

                    {carInBay ? (
                      <div className="flex items-center gap-1.5">
                        {/* Live Timer Badge */}
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-mono font-black flex items-center gap-1.5 border shadow-xs ${
                            isOvertime
                              ? 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-700 animate-pulse'
                              : isWarning
                              ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-700'
                              : 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-700'
                          }`}
                          title={`سەیارەکە بۆ ماوەی ${elapsedMins} خولەکە لەم هۆڵەدایە`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>{elapsedMins} خولەک</span>
                          {isOvertime && <span>⚠️</span>}
                        </span>

                        {/* Quick Release Button */}
                        <button
                          type="button"
                          onClick={() => handleReleaseBayDirectly(carInBay)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition cursor-pointer"
                          title="لابردنی سەیارەکە لە هۆڵ و بەتاڵکردن"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-extrabold border border-emerald-300 dark:border-emerald-700 shadow-2xs flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>بەتاڵ و ئامادەیە</span>
                      </span>
                    )}
                  </div>

                  {/* Bay Content */}
                  <div className="py-2.5 space-y-2.5 flex-1 flex flex-col justify-center">
                    {carInBay ? (
                      <>
                        <div className="flex justify-center">
                          <PlateDisplay plate={carInBay.plate} size="sm" />
                        </div>

                        <div className="text-center text-xs space-y-0.5 bg-slate-50 dark:bg-slate-700/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-600">
                          <p className="font-black text-slate-900 dark:text-white text-xs truncate">
                            {carInBay.carModel || 'ئۆتۆمبێل'} • {carInBay.color}
                          </p>
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 truncate font-semibold">
                            {carInBay.ownerName ? `کڕیار: ${carInBay.ownerName}` : 'شۆردنی ئاسایی'}
                          </p>
                        </div>

                        {/* Stage Selector */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500 dark:text-slate-400 font-bold">قۆناغی کار:</span>
                            <span className="font-black text-amber-600 dark:text-amber-400">
                              {carInBay.washStage || 'دەستپێکردن'}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-1 text-[11px]">
                            {(
                              [
                                { id: 'کەفڕێژکردن', label: 'کەف 🧼' },
                                { id: 'شۆردنی دەرەوە', label: 'ئاو 🚿' },
                                { id: 'وشککردنەوە و پۆلیش', label: 'وشککردن 💨' },
                                { id: 'تەواوبوو', label: 'تەواوبوو ✨' },
                              ] as const
                            ).map((st) => (
                              <button
                                key={st.id}
                                type="button"
                                onClick={() => handleStageChange(carInBay.id, st.id as any)}
                                className={`py-1.5 px-1 rounded-xl font-bold transition text-center cursor-pointer border ${
                                  carInBay.washStage === st.id
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                    : 'bg-slate-100 dark:bg-slate-700/80 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-600'
                                }`}
                              >
                                {st.label}
                              </button>
                            ))}
                          </div>

                          {/* WhatsApp Notify Button */}
                          {carInBay.phone && (
                            <button
                              type="button"
                              onClick={() => {
                                const msg = generateCarReadyMessage(carInBay, settings, bayNum);
                                openWhatsAppChat(carInBay.phone, msg);
                              }}
                              className={`w-full mt-1.5 py-1.5 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer border ${
                                carInBay.washStage === 'تەواوبوو'
                                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-600 shadow-xs'
                                  : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700'
                              }`}
                              title="ئاگادارکردنەوەی خاوەن سەیارە بە WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
                              <span>{carInBay.washStage === 'تەواوبوو' ? '📲 WhatsApp: سەیارە ئامادەیە!' : '📲 ئاگاداری WhatsApp'}</span>
                            </button>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="py-6 text-center space-y-3 my-auto">
                        <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 dark:bg-slate-700/60 border border-blue-200/80 dark:border-slate-600 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-xs">
                          <Car className="w-7 h-7" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-xs font-black text-slate-800 dark:text-slate-200">
                            هۆڵ بەتاڵە و ئامادەیە
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            سەیارەیەکی نوێ تۆماربکە یان لە نۆبەوە بهێنە
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setAssignBayModal(bayNum);
                            if (queueVehicles.length > 0) setAssignVehicleId(queueVehicles[0].id);
                            if (staff.length > 0) setAssignWorkerId(staff[0].id);
                          }}
                          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black transition inline-flex items-center gap-1.5 shadow-md shadow-blue-600/25 cursor-pointer active:scale-95"
                        >
                          <Plus className="w-4 h-4" />
                          <span>+ سەیارە لە نۆبە بهێنە ئێرە</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Bay Footer (Checkout, Direct Clear, Quick Print & Add-ons) */}
                  {carInBay && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                      {/* Action Row 1: Direct Quick Print Receipt + Clear Bay */}
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleQuickPrintReceipt(carInBay)}
                          className="py-1.5 px-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                          title="بڕینی پسوولەی کاشێر بۆ ئەم سەیارەیە"
                        >
                          <Printer className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          <span>بڕینی پسوولە (چاپ)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleReleaseBayDirectly(carInBay)}
                          className="py-1.5 px-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                          title="بەتاڵکردنی هۆڵ و دەرکردنی سەیارەکە لە شاشە"
                        >
                          <LogOut className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                          <span>لابردن لە هۆڵ</span>
                        </button>
                      </div>

                      {/* Primary Action Button: Complete Wash & Take Payment (or Complete & Exit) */}
                      <button
                        type="button"
                        onClick={() => handleInitiateCheckout(carInBay)}
                        className={`w-full py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer ${
                          carInBay.washStage === 'تەواوبوو'
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 ring-2 ring-emerald-400 animate-pulse'
                            : 'bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white shadow-emerald-600/20'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>
                          {carInBay.washStage === 'تەواوبوو'
                            ? '✨ سەیارە تەواوبووە • وەرگرتن و دەرکردن'
                            : 'تەواوکردن و وەرگرتنی پارە (پسوولە)'}
                        </span>
                      </button>

                      {/* Add-on Tools: Cafe, VIP Pass & Move to Queue */}
                      <div className="flex gap-1.5 pt-0.5">
                        <button
                          type="button"
                          onClick={() => setCafeModalVehicle(carInBay)}
                          className="flex-1 py-1 px-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                          title="داواکردنی چا، قاوە یان بۆندارکەر بۆ کڕیار"
                        >
                          <Coffee className="w-3 h-3 text-amber-600" />
                          <span>کافێ</span>
                          {(bayCafeOrders[bayNum]?.length || 0) > 0 && (
                            <span className="bg-amber-600 text-white rounded-full px-1.5 py-0.2 text-[9px]">
                              {bayCafeOrders[bayNum].reduce((sum, item) => sum + item.quantity, 0)}
                            </span>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => setSubscriptionVehicle(carInBay)}
                          className="flex-1 py-1 px-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                          title="ئابوونەی VIP بێسنوور"
                        >
                          <Crown className="w-3 h-3 text-amber-500" />
                          <span>
                            {carInBay.subscription?.status === 'active' && new Date(carInBay.subscription.endDate) > new Date()
                              ? 'VIP چالاکە'
                              : 'VIP'}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleMoveBayToQueue(carInBay)}
                          className="py-1 px-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                          title="گواستنەوەی ئەم سەیارەیە بۆ ڕیزی نۆبە"
                        >
                          <Layers className="w-3 h-3 text-amber-500" />
                          <span>بۆ نۆبە</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Queue Strip below Bays */}
          <div className="border-t-2 border-slate-200 dark:border-slate-700/80 pt-3.5">
            <div className="flex items-center justify-between text-xs mb-2.5">
              <span className="font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 text-xs sm:text-sm">
                <Layers className="w-4 h-4 text-amber-500" />
                <span>سەیارەکانی نۆبە (ڕیزی چاوەڕوانی):</span>
              </span>
              <span className="font-mono font-bold text-xs bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-300 dark:border-amber-700">
                {queueVehicles.length} لە نۆبەدان
              </span>
            </div>

            {queueVehicles.length === 0 ? (
              <div className="text-center py-4 bg-slate-50/60 dark:bg-slate-800/30 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">هیچ سەیارەیەک لە ڕیزی نۆبەدا نییە.</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">لە فۆڕمی دەستەچپەوە سەیارە تۆماربکە بۆ زیادکردن بۆ نۆبە.</p>
              </div>
            ) : (
              <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
                {queueVehicles.map((qv) => (
                  <div
                    key={qv.id}
                    className="p-3 bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 text-xs shrink-0 flex items-center gap-3 shadow-xs transition group"
                  >
                    <PlateDisplay plate={qv.plate} size="sm" />
                    <div className="space-y-0.5 min-w-[100px]">
                      <div className="font-black text-slate-900 dark:text-white text-xs truncate max-w-[130px]">
                        {qv.ownerName}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold truncate max-w-[130px]">
                        {qv.carModel}
                      </div>
                    </div>

                    {/* Quick Admit to Bay / Remove from Queue Buttons */}
                    <div className="flex items-center gap-1.5 border-r border-slate-200 dark:border-slate-700 pr-2 mr-1">
                      <button
                        type="button"
                        onClick={() => {
                          setAssignBayModal(1);
                          setAssignVehicleId(qv.id);
                        }}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black transition cursor-pointer shadow-xs active:scale-95 flex items-center gap-1"
                        title="خستنە ناو هۆڵی بەتاڵ"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                        <span>بۆ هۆڵ</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveFromQueue(qv.id)}
                        className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition cursor-pointer"
                        title="سڕینەوە لە نۆبە"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODALS: CHECKOUT, ASSIGN BAY, CAMERA SIMULATOR, Z-REPORT, DEBT */}
      {/* ========================================================= */}

      {/* Checkout / Payment Modal */}
      {checkoutVehicle && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md sm:max-w-lg w-full shadow-2xl text-slate-900 dark:text-white my-auto flex flex-col max-h-[92vh] overflow-hidden">
            {/* Modal Header (Fixed / Always Visible at Top) */}
            <div className="border-b border-slate-100 dark:border-slate-800 px-5 py-3.5 flex items-center justify-between shrink-0 bg-slate-50/90 dark:bg-slate-800/80">
              <div>
                <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">وەرگرتنی پارەی شۆردن و پسوولە</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  سەیارە: <strong className="text-slate-800 dark:text-slate-200">{checkoutVehicle.carModel}</strong>
                </p>
              </div>
              <button
                onClick={() => setCheckoutVehicle(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Modal Body */}
            <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto flex-1 overscroll-contain">
              <div className="flex justify-center py-0.5">
                <PlateDisplay plate={checkoutVehicle.plate} size="md" />
              </div>

              {checkoutVehicle.currentCycleWashes >= settings.washesNeededForFree && (
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-center text-xs text-emerald-800 dark:text-emerald-300 font-bold space-y-0.5 shadow-2xs">
                  <Sparkles className="w-4 h-4 mx-auto text-emerald-600 dark:text-emerald-400" />
                  <p>🎉 پیرۆزە! شۆردنی ٥ـەم بەخۆڕاییە (FREE - 0 IQD)!</p>
                </div>
              )}

              {/* Rain Warranty Option */}
              <div className="bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 rounded-xl p-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">🌧️</span>
                  <div>
                    <p className="text-xs font-bold text-sky-950 dark:text-sky-200">مۆڵەتی بارانبارین (Rain Warranty)</p>
                    <p className="text-[10px] text-sky-700 dark:text-sky-400">شۆردنی دووبارە بە خۆڕایی لە ماوەی ٢٤ کاتژمێردا</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCheckoutIsRainWarranty(!checkoutIsRainWarranty)}
                  className={`px-2.5 py-1 text-xs font-black rounded-lg transition border cursor-pointer ${
                    checkoutIsRainWarranty
                      ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800 hover:bg-sky-100 dark:hover:bg-sky-900/50'
                  }`}
                >
                  {checkoutIsRainWarranty ? 'چالاکە (خۆڕایی)' : 'چالاککردن'}
                </button>
              </div>

              {/* Pre-Wash Damage Inspection */}
              <details className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-700 dark:text-slate-300">
                <summary className="font-bold cursor-pointer select-none flex items-center justify-between text-slate-800 dark:text-slate-200">
                  <span>🛡️ پشکنینی ڕووشان و لێدراو پێش شۆردن</span>
                  <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400">
                    {checkoutHasScratches || checkoutHasDents || checkoutHasBrokenParts ? 'تۆمارکراوە ⚠️' : 'هیچی نییە (پاکە)'}
                  </span>
                </summary>
                <div className="pt-2 space-y-2">
                  <div className="grid grid-cols-3 gap-1">
                    <label className={`flex items-center gap-1.5 p-1.5 rounded-lg border cursor-pointer text-[11px] font-bold ${checkoutHasScratches ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-400 text-amber-900 dark:text-amber-300' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}>
                      <input
                        type="checkbox"
                        checked={checkoutHasScratches}
                        onChange={(e) => setCheckoutHasScratches(e.target.checked)}
                        className="rounded text-amber-600"
                      />
                      <span>ڕووشانی بۆیە</span>
                    </label>
                    <label className={`flex items-center gap-1.5 p-1.5 rounded-lg border cursor-pointer text-[11px] font-bold ${checkoutHasDents ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-400 text-amber-900 dark:text-amber-300' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}>
                      <input
                        type="checkbox"
                        checked={checkoutHasDents}
                        onChange={(e) => setCheckoutHasDents(e.target.checked)}
                        className="rounded text-amber-600"
                      />
                      <span>لێدراوی لەش</span>
                    </label>
                    <label className={`flex items-center gap-1.5 p-1.5 rounded-lg border cursor-pointer text-[11px] font-bold ${checkoutHasBrokenParts ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-400 text-rose-900 dark:text-rose-300' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}>
                      <input
                        type="checkbox"
                        checked={checkoutHasBrokenParts}
                        onChange={(e) => setCheckoutHasBrokenParts(e.target.checked)}
                        className="rounded text-rose-600"
                      />
                      <span>شکاوی جام/ئاوێنە</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    value={checkoutDamageNotes}
                    onChange={(e) => setCheckoutDamageNotes(e.target.value)}
                    placeholder="تێبینی زیاتری زیان (وەک: لای دەرگای شۆفێر ڕووشاوە)..."
                    className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
                  />
                </div>
              </details>

              {/* Vehicle Size in Checkout */}
              <div className="space-y-1">
                <label className="text-[11px] text-slate-600 dark:text-slate-400 font-bold">قەبارەی سەیارە:</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'sedan', label: '🚗 سالۆن' },
                    { id: 'suv', label: '🚙 جیپ' },
                    { id: 'truck', label: '🚐 پیکاب' },
                  ].map((sz) => (
                    <button
                      key={sz.id}
                      type="button"
                      onClick={() => setCheckoutVehicleSize(sz.id as VehicleSize)}
                      className={`py-2 px-1 rounded-xl text-xs font-bold transition border cursor-pointer ${
                        checkoutVehicleSize === sz.id
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {sz.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* VIP Subscription Badge if active */}
              {checkoutVehicle.subscription?.status === 'active' && new Date(checkoutVehicle.subscription.endDate) > new Date() && (
                <div className="p-2.5 bg-purple-50 dark:bg-purple-950/40 border border-purple-300 dark:border-purple-800 rounded-xl flex items-center justify-between text-purple-900 dark:text-purple-200 shadow-2xs">
                  <div className="flex items-center gap-1.5">
                    <Crown className="w-4 h-4 text-amber-500 shrink-0" />
                    <div>
                      <span className="font-extrabold text-xs block">ئەندامی VIP بێسنوور (Unlimited Pass)</span>
                      <span className="text-[10px] text-purple-700 dark:text-purple-300">شۆردن بێبەرامبەرە تا {checkoutVehicle.subscription.endDate.split('T')[0]}</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-purple-600 text-white text-[10px] font-black rounded-lg">0 IQD</span>
                </div>
              )}

              {/* Service in Checkout (Filtered to Car Services Only) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-slate-800 dark:text-slate-200 font-extrabold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>خزمەتگوزاری شۆردنی سەیارە:</span>
                  </label>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">یەکێک هەڵبژێرە</span>
                </div>

                <div className="space-y-2 max-h-52 overflow-y-auto pr-1 text-xs">
                  {(() => {
                    const carWashServices = services.filter(
                      (s) => s.category === 'سەیارە' || s.category === 'پۆڵیش و نانۆ سێرامیک'
                    );
                    const listToDisplay = carWashServices.length > 0 ? carWashServices : services;

                    return listToDisplay.map((srv) => {
                      const currentPrice = calculateServicePrice(srv, checkoutVehicleSize);
                      const isSelected = checkoutServiceId === srv.id;
                      const isVip =
                        checkoutVehicle.subscription?.status === 'active' &&
                        new Date(checkoutVehicle.subscription.endDate) > new Date();
                      const isLoyaltyFree = checkoutVehicle.currentCycleWashes >= settings.washesNeededForFree;
                      const isFree = isVip || isLoyaltyFree || checkoutIsRainWarranty;

                      return (
                        <div
                          key={srv.id}
                          onClick={() => setCheckoutServiceId(srv.id)}
                          className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'bg-blue-50 dark:bg-blue-950/70 border-blue-600 dark:border-blue-500 shadow-xs ring-2 ring-blue-500/20'
                              : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? 'border-blue-600 bg-blue-600 text-white'
                                  : 'border-slate-400 dark:border-slate-500'
                              }`}
                            >
                              {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                            </div>
                            <div>
                              <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white block">
                                {srv.name}
                              </span>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                ⏱️ {srv.durationMinutes || 25} خولەک • {srv.unit || 'شۆردنی تەواو'}
                              </span>
                            </div>
                          </div>

                          <div className="text-left font-mono">
                            {isFree ? (
                              <div className="text-left space-y-0.5">
                                <span className="text-[10px] line-through text-slate-400 block font-sans">
                                  {formatIQD(currentPrice)}
                                </span>
                                <span className="px-2 py-0.5 rounded-lg bg-emerald-600 text-white font-black text-xs inline-block">
                                  {isVip ? '0 IQD (VIP)' : '0 IQD (FREE 🎁)'}
                                </span>
                              </div>
                            ) : (
                              <strong className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400">
                                {formatIQD(currentPrice)}
                              </strong>
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Cafe & Lounge Addon in Checkout */}
              <div className="p-3 bg-amber-50/80 dark:bg-amber-950/40 border-2 border-amber-200 dark:border-amber-800/70 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                    <Coffee className="w-4 h-4 text-amber-600" />
                    <span>کافێ، خواردنەوە و پێداویستی (Lounge):</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setCafeModalVehicle(checkoutVehicle)}
                    className="text-xs font-bold text-amber-900 dark:text-amber-200 bg-amber-200/80 dark:bg-amber-900/60 hover:bg-amber-300 px-3 py-1 rounded-xl border border-amber-300 dark:border-amber-700 transition cursor-pointer"
                  >
                    + هەڵبژاردن یان دەستکاری
                  </button>
                </div>
                {checkoutCafeItems.length > 0 ? (
                  <div className="space-y-1.5 pt-1.5 border-t border-amber-200 dark:border-amber-800/60">
                    {checkoutCafeItems.map((item) => (
                      <div key={item.id} className="flex justify-between items-center text-xs text-amber-900 dark:text-amber-200">
                        <span>• {item.name} × {item.quantity}</span>
                        <span className="font-mono font-bold">{formatIQD(item.price * item.quantity)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center text-xs font-black text-amber-950 dark:text-amber-100 pt-1.5 border-t border-amber-200 dark:border-amber-800/60">
                      <span>کۆی کافێ:</span>
                      <span className="font-mono font-black text-amber-900 dark:text-amber-200">{formatIQD(checkoutCafeItems.reduce((acc, it) => acc + it.price * it.quantity, 0))}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 font-medium">هیچ خواردنەوە یان کەرەستەیەکی تر دیاری نەکراوە.</p>
                )}
              </div>

              {/* Payment Method Selector (نەقد، FastPay، FIB، قەرز) */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-800 dark:text-slate-200 font-extrabold block">شێوازی وەرگرتنی پارە:</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-black">
                  {[
                    { id: 'cash', label: '💵 نەقد (Cash)', color: 'border-emerald-500 bg-emerald-600 text-white shadow-emerald-600/30 ring-2 ring-emerald-500/20' },
                    { id: 'fastpay', label: '📱 FastPay', color: 'border-amber-500 bg-amber-600 text-white shadow-amber-600/30 ring-2 ring-amber-500/20' },
                    { id: 'fib', label: '🏦 FIB بانکی', color: 'border-blue-500 bg-blue-600 text-white shadow-blue-600/30 ring-2 ring-blue-500/20' },
                    { id: 'debt', label: '⚠️ قەرز (Debt)', color: 'border-rose-500 bg-rose-600 text-white shadow-rose-600/30 ring-2 ring-rose-500/20' },
                  ].map((pm) => (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => setCheckoutPaymentMethod(pm.id as PaymentMethod)}
                      className={`py-3 px-2 rounded-xl border-2 transition-all text-center cursor-pointer flex items-center justify-center gap-1 ${
                        checkoutPaymentMethod === pm.id
                          ? pm.color
                          : 'bg-slate-50 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      {pm.label}
                    </button>
                  ))}
                </div>

                {checkoutPaymentMethod === 'debt' && (
                  <div className="pt-1.5">
                    <input
                      type="text"
                      value={checkoutDebtNote}
                      onChange={(e) => setCheckoutDebtNote(e.target.value)}
                      placeholder="تێبینی قەرز (ناوی کڕیار یان کەی دەیدات)..."
                      className="w-full px-3 py-2 bg-rose-50 dark:bg-rose-950/50 border-2 border-rose-300 dark:border-rose-700 rounded-xl text-xs text-rose-950 dark:text-rose-200 placeholder-rose-400 font-bold focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Staff in Checkout */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-slate-800 dark:text-slate-200 font-extrabold">وەستای بەرپرس و عەمولە:</label>
                  {(() => {
                    const currWorker = staff.find((s) => s.id === checkoutStaffId);
                    const currentSrv = services.find((s) => s.id === checkoutServiceId) || services[0];
                    const currentPrice =
                      checkoutVehicle.currentCycleWashes >= settings.washesNeededForFree || checkoutIsRainWarranty
                        ? 0
                        : calculateServicePrice(currentSrv, checkoutVehicleSize);
                    const comm =
                      checkoutCustomCommission !== null
                        ? checkoutCustomCommission
                        : calculateWorkerCommission(currWorker, currentPrice);
                    return (
                      <span className="text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/70 px-2.5 py-0.5 rounded-full font-mono font-bold border border-emerald-300 dark:border-emerald-700">
                        عەمولە: {formatIQD(comm)}
                      </span>
                    );
                  })()}
                </div>
                <select
                  value={checkoutStaffId}
                  onChange={(e) => {
                    setCheckoutStaffId(e.target.value);
                    setCheckoutCustomCommission(null);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                >
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.role}) • {s.commissionType === 'percentage' ? `${s.commissionValue || 25}٪ عەمولە` : s.commissionType === 'none' ? 'بێ عەمولە' : `${formatIQD(s.commissionValue !== undefined ? s.commissionValue : 2000)} عەمولە`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Grand Total Financial Breakdown (High Impact & High Contrast) */}
              {(() => {
                const currentSrv = services.find((s) => s.id === checkoutServiceId) || services[0];
                const currentPrice = calculateServicePrice(currentSrv, checkoutVehicleSize);
                const isVip = checkoutVehicle.subscription?.status === 'active' && new Date(checkoutVehicle.subscription.endDate) > new Date();
                const isFreeWash = checkoutVehicle.currentCycleWashes >= settings.washesNeededForFree || checkoutIsRainWarranty || isVip;
                const discountAmt = (isHappyHourActive && !isFreeWash) ? Math.round((currentPrice * happyHourDiscountPercent) / 100) : 0;
                const washFinal = isFreeWash ? 0 : Math.max(0, currentPrice - discountAmt);
                const cafeSum = checkoutCafeItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
                const totalBill = washFinal + cafeSum;
                return (
                  <div className="p-4 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 dark:from-slate-950 dark:to-slate-900 text-white rounded-2xl border-2 border-slate-700 shadow-xl space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-300">
                      <span>خزمەتگوزاری ({currentSrv.name}):</span>
                      <span className="font-mono font-bold text-white">
                        {isFreeWash ? '0 IQD (بەخۆڕایی)' : formatIQD(washFinal)}
                      </span>
                    </div>

                    {cafeSum > 0 && (
                      <div className="flex items-center justify-between text-xs text-amber-300">
                        <span>خواردنەوە و کافێ ({checkoutCafeItems.length} دانە):</span>
                        <span className="font-mono font-bold text-amber-400">+{formatIQD(cafeSum)}</span>
                      </div>
                    )}

                    {discountAmt > 0 && !isFreeWash && (
                      <div className="flex items-center justify-between text-xs text-emerald-300">
                        <span>داشکاندنی Happy Hour ({happyHourDiscountPercent}%):</span>
                        <span className="font-mono font-bold text-emerald-400">-{formatIQD(discountAmt)}</span>
                      </div>
                    )}

                    <div className="pt-2.5 border-t border-slate-700/80 flex items-center justify-between">
                      <span className="font-black text-sm text-slate-100">کۆی گشتی بۆ وەرگرتن:</span>
                      <strong className="text-xl sm:text-2xl font-black text-emerald-400 font-mono tracking-tight">
                        {formatIQD(totalBill)}
                      </strong>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal Actions Footer (Always Visible at Bottom!) */}
            <div className="p-3.5 sm:p-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 shrink-0 bg-slate-50/95 dark:bg-slate-800/90 shadow-lg">
              <button
                type="button"
                onClick={handleConfirmPayment}
                className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-black rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 cursor-pointer"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>تەواوکردن و دەرکردنی پسوولە</span>
              </button>
              <button
                type="button"
                onClick={() => setCheckoutVehicle(null)}
                className="px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                داخستن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Assign from Queue to Bay */}
      {assignBayModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-5 space-y-3.5 shadow-2xl text-slate-900 dark:text-white">
            <h3 className="font-black text-sm text-slate-900 dark:text-white">
              خستنەسەری سەیارە بۆ ناو هۆڵی {assignBayModal}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-600 dark:text-slate-400 block mb-1 font-bold">سەیارە لە نۆبە:</label>
                <select
                  value={assignVehicleId}
                  onChange={(e) => setAssignVehicleId(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none"
                >
                  {queueVehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.carModel} (
                      {v.plate.type === 'unified'
                        ? `${v.plate.provinceCode} | ${v.plate.letter} ${v.plate.number}`
                        : `${v.plate.oldCityName} ${v.plate.oldNumber}`}
                      )
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-600 dark:text-slate-400 block mb-1 font-bold">وەستای بەرپرس:</label>
                <select
                  value={assignWorkerId}
                  onChange={(e) => setAssignWorkerId(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none"
                >
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const worker = staff.find((s) => s.id === assignWorkerId) || staff[0];
                    const nowISO = new Date().toISOString();
                    const updated = vehicles.map((v) => {
                      if (v.id === assignVehicleId) {
                        return {
                          ...v,
                          currentBay: assignBayModal,
                          bayEntryTime: nowISO,
                          washStage: 'کەفڕێژکردن' as const,
                          assignedWorkerId: worker?.id,
                          assignedWorkerName: worker?.name,
                        };
                      }
                      return v;
                    });
                    onUpdateVehicles(updated);
                    setAssignBayModal(null);
                    if (soundEnabled) playPosSound('beep');
                    onNotify(`سەیارەکە خرایە ناو هۆڵی ${assignBayModal}.`);
                  }}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition shadow-md shadow-blue-500/20"
                >
                  دەستپێکردن
                </button>
                <button
                  type="button"
                  onClick={() => setAssignBayModal(null)}
                  className="px-3 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  داخستن
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Printed Receipt Modal */}
      {printedReceiptData && (
        <ReceiptModal
          vehicle={printedReceiptData.vehicle}
          service={printedReceiptData.service}
          staffName={printedReceiptData.staffName}
          isFree={printedReceiptData.isFree}
          freeReason={printedReceiptData.freeReason}
          isSubscriptionWash={printedReceiptData.isSubscriptionWash}
          cafeItems={printedReceiptData.cafeItems}
          cafeTotal={printedReceiptData.cafeTotal}
          damageInspection={printedReceiptData.damageInspection}
          settings={settings}
          chargedPrice={printedReceiptData.chargedPrice}
          vehicleSize={printedReceiptData.vehicleSize}
          paymentMethod={printedReceiptData.paymentMethod}
          isDebt={printedReceiptData.isDebt}
          onClose={() => setPrintedReceiptData(null)}
        />
      )}

      {/* VIP Subscription Modal */}
      {subscriptionVehicle && (
        <SubscriptionModal
          vehicle={subscriptionVehicle}
          settings={settings}
          onClose={() => setSubscriptionVehicle(null)}
          onSubscribe={(updated: Vehicle, amountPaid: number) => {
            onUpdateVehicles(vehicles.map((v) => (v.id === updated.id ? updated : v)));
            setSubscriptionVehicle(null);
            onNotify(`👑 ئابوونەی VIP بە سەرکەوتوویی بۆ ${updated.ownerName} تۆمارکرا (${formatIQD(amountPaid)})!`);
          }}
        />
      )}

      {/* Cafe Add-on Modal */}
      {cafeModalVehicle && (
        <CafeAddonModal
          vehicle={cafeModalVehicle}
          initialSelectedItems={
            cafeModalVehicle.currentBay
              ? (bayCafeOrders[cafeModalVehicle.currentBay] || [])
              : checkoutCafeItems
          }
          onClose={() => setCafeModalVehicle(null)}
          onSave={(items: SelectedCafeItem[], totalSum: number) => {
            if (cafeModalVehicle.currentBay) {
              setBayCafeOrders((prev) => ({
                ...prev,
                [cafeModalVehicle.currentBay!]: items,
              }));
            }
            if (checkoutVehicle && checkoutVehicle.id === cafeModalVehicle.id) {
              setCheckoutCafeItems(items);
            }
            setCafeModalVehicle(null);
            const totalCount = items.reduce((sum: number, it: SelectedCafeItem) => sum + it.quantity, 0);
            onNotify(`☕ داواکاری کافێ بۆ ${cafeModalVehicle.ownerName} نوێکرایەوە (${totalCount} دانە - ${formatIQD(totalSum)}).`);
          }}
        />
      )}

      {/* Z-Report Modal */}
      {showZReportModal && (
        <ZReportModal
          vehicles={vehicles}
          staff={staff}
          settings={settings}
          onClose={() => setShowZReportModal(false)}
          onSaveReport={handleSaveZReport}
        />
      )}

      {/* Debt Management Modal */}
      {showDebtListModal && (
        <DebtManagementModal
          vehicles={vehicles}
          onSettleDebt={handleSettleDebtRecord}
          onClose={() => setShowDebtListModal(false)}
        />
      )}

      {/* Petty Cash Modal */}
      {showPettyCashModal && (
        <PettyCashModal
          onClose={() => setShowPettyCashModal(false)}
          onSave={(exp) => {
            const existing = getSavedExpenses();
            saveExpenses([exp, ...existing]);
            setShowPettyCashModal(false);
            onNotify(`💸 پارەی ${formatIQD(exp.amount)} لە سندووق کێشرایەوە (${exp.title}).`);
          }}
        />
      )}
    </div>
  );
};