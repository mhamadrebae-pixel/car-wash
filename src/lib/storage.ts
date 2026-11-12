import {
  SetupItem,
  Expense,
  ServiceItem,
  Vehicle,
  StaffMember,
  AppSettings,
  LicensePlate,
  RoadmapItem,
  InventoryItem,
  MaterialPurchase,
  DailyZReport,
  AuthUser,
  AuthSession,
  PaymentMethod,
  WashRecord,
  CafeItem,
  ParkingRecord,
  Branch,
} from '@/types';
import {
  defaultSetupItems,
  defaultExpenses,
  defaultServices,
  defaultVehicles,
  defaultStaffMembers,
  defaultSettings,
  defaultRoadmapItems,
  defaultInventoryItems,
  defaultMaterialPurchases,
  defaultParkingRecords,
  defaultBranches,
} from '@/constants/initialData';

export const KEYS = {
  SETUP: 'carwash_v1_setup',
  EXPENSES: 'carwash_v1_expenses',
  SERVICES: 'carwash_v1_services',
  VEHICLES: 'carwash_v1_vehicles',
  STAFF: 'carwash_v1_staff',
  SETTINGS: 'carwash_v1_settings',
  ROADMAP: 'carwash_v1_roadmap',
  INVENTORY: 'carwash_v1_inventory',
  MATERIAL_PURCHASES: 'carwash_v1_material_purchases',
  CAFE_ITEMS: 'carwash_v1_cafe_items',
  ZREPORTS: 'carwash_v1_zreports',
  AUTH_SESSION: 'carwash_v1_auth_session',
  PARKING: 'carwash_v1_parking',
  BRANCHES: 'carwash_v1_branches',
  ACTIVE_BRANCH: 'carwash_v1_active_branch',
  LAST_SYNC_TS: 'carwash_v1_last_sync_ts',
};

// Cross-tab instantaneous Realtime BroadcastChannel
const realtimeChannel =
  typeof window !== 'undefined' && 'BroadcastChannel' in window
    ? new BroadcastChannel('carwash_realtime_sync')
    : null;

export function broadcastLocalChange(keyName?: string): void {
  try {
    realtimeChannel?.postMessage({
      type: 'LOCAL_DATA_MUTATED',
      key: keyName || 'general',
      timestamp: Date.now(),
    });
  } catch {}
}

// Safe storage helper with quota guard
export function safeStorageSet(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.error('Storage quota error:', key, e);
  }
}

// Web Audio API POS Sound Effects (Native browser audio, no external assets needed)
export function playPosSound(type: 'success' | 'beep' | 'warning' | 'cash' = 'success'): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (type === 'success' || type === 'cash') {
      // Crisp 2-tone melodic chime: C5 (523Hz) -> G5 (784Hz)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(type === 'cash' ? 659.25 : 523.25, now);
      osc.frequency.setValueAtTime(type === 'cash' ? 880 : 783.99, now + 0.08);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'beep') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === 'warning') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(320, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.start(now);
      osc.stop(now + 0.25);
    }
  } catch {
    // Autoplay policy or sound blocked
  }
}

export function formatIQD(amount: number): string {
  const safe = typeof amount === 'number' && !isNaN(amount) ? amount : Number(amount) || 0;
  return `${safe.toLocaleString('en-US')} دینار`;
}

// Normalize Kurdish and Arabic numerals to English ASCII digits (0-9)
export function normalizeDigits(str: string): string {
  if (!str) return '';
  return str
    .replace(/[٠-٩]/g, (d) => (d.charCodeAt(0) - 0x0660).toString())
    .replace(/[۰-۹]/g, (d) => (d.charCodeAt(0) - 0x06f0).toString());
}

export function calculateDaysSince(dateStr: string): number {
  if (!dateStr) return 0;
  const past = new Date(dateStr).getTime();
  const now = new Date().getTime();
  const diffTime = Math.max(0, now - past);
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

export function isNfcExpired(lastVisitDate: string, limitDays = 15): boolean {
  return calculateDaysSince(lastVisitDate) > limitDays;
}

export function getTodayLocalDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isDateToday(dateStr?: string): boolean {
  if (!dateStr) return false;
  const todayLocal = getTodayLocalDateString();
  if (dateStr.startsWith(todayLocal)) return true;
  try {
    const d = new Date(dateStr);
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  } catch {
    return false;
  }
}

export function formatPlateDisplay(plate: LicensePlate): string {
  if (plate.type === 'unified') {
    return `${plate.provinceCode || ''} | ${plate.letter || ''} ${plate.number || ''} (${plate.provinceName || ''})`;
  }
  return `${plate.oldCityName || ''} / ${plate.oldNumber || ''} ${plate.oldCategory ? `[${plate.oldCategory}]` : ''}`;
}

// LocalStorage loaders and savers
export function getSavedSetupItems(): SetupItem[] {
  if (typeof window === 'undefined') return [];
  const d = localStorage.getItem(KEYS.SETUP);
  if (d === null) {
    localStorage.setItem(KEYS.SETUP, JSON.stringify([]));
    return [];
  }
  try {
    const parsed: any[] = JSON.parse(d);
    return Array.isArray(parsed)
      ? parsed.map((item) => ({
          ...item,
          cost: Number(item.cost ?? item.actualCost ?? item.estimatedCost ?? 0) || 0,
          quantity: Number(item.quantity) || 1,
        }))
      : [];
  } catch {
    return [];
  }
}

export function saveSetupItems(items: SetupItem[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(KEYS.SETUP, JSON.stringify(items));
    triggerServerSync();
  }
}

export function getSavedExpenses(): Expense[] {
  if (typeof window === 'undefined') return [];
  const d = localStorage.getItem(KEYS.EXPENSES);
  if (d === null) {
    localStorage.setItem(KEYS.EXPENSES, JSON.stringify([]));
    return [];
  }
  try {
    const parsed = JSON.parse(d);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed;
  } catch {
    return [];
  }
}

export function saveExpenses(items: Expense[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(KEYS.EXPENSES, JSON.stringify(items));
    triggerServerSync();
  }
}

export function getSavedServices(): ServiceItem[] {
  if (typeof window === 'undefined') return defaultServices;
  const d = localStorage.getItem(KEYS.SERVICES);
  if (d === null) {
    localStorage.setItem(KEYS.SERVICES, JSON.stringify(defaultServices));
    return defaultServices;
  }
  try {
    const parsed = JSON.parse(d);
    return Array.isArray(parsed) ? parsed : defaultServices;
  } catch {
    return defaultServices;
  }
}

export function saveServices(items: ServiceItem[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(KEYS.SERVICES, JSON.stringify(items));
    triggerServerSync();
  }
}

export function getSavedVehicles(): Vehicle[] {
  if (typeof window === 'undefined') return [];
  const d = localStorage.getItem(KEYS.VEHICLES);
  if (d === null) {
    localStorage.setItem(KEYS.VEHICLES, JSON.stringify([]));
    return [];
  }
  try {
    const parsed = JSON.parse(d);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.map((v: any) => ({
      ...v,
      currentCycleWashes: Number(v.currentCycleWashes) || 0,
      totalWashes: Number(v.totalWashes) || 0,
      freeWashesClaimed: Number(v.freeWashesClaimed) || 0,
      washHistory: Array.isArray(v.washHistory) ? v.washHistory : [],
    }));
  } catch {
    return [];
  }
}

export function saveVehicles(items: Vehicle[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(KEYS.VEHICLES, JSON.stringify(items));
    triggerServerSync();
  }
}

export function getSavedStaff(): StaffMember[] {
  if (typeof window === 'undefined') return defaultStaffMembers;
  const d = localStorage.getItem(KEYS.STAFF);
  if (d === null) {
    localStorage.setItem(KEYS.STAFF, JSON.stringify(defaultStaffMembers));
    return defaultStaffMembers;
  }
  try {
    const parsed = JSON.parse(d);
    if (!Array.isArray(parsed)) {
      return defaultStaffMembers;
    }
    return parsed.map((w: any) => ({
      id: w.id || `staff-${Date.now()}-${Math.random()}`,
      name: w.name || 'وەستا',
      role: w.role || 'وەستای غەسل',
      phone: w.phone || '',
      salaryType: w.salaryType === 'daily' ? 'daily' : 'monthly',
      baseSalary: Number(w.baseSalary) || 0,
      commissionType: w.commissionType || 'fixed',
      commissionValue: Number(w.commissionValue !== undefined ? w.commissionValue : 2000),
      workHours: w.workHours || '08:00 AM - 06:00 PM',
      startDate: w.startDate || '2026-05-10',
      endDate: w.endDate || undefined,
      status: w.status === 'archived' ? 'archived' : 'active',
      absentRecords: Array.isArray(w.absentRecords)
        ? w.absentRecords.map((a: any) => ({
            id: a.id || `abs-${Date.now()}-${Math.random()}`,
            date: a.date || new Date().toISOString().split('T')[0],
            reason: a.reason || 'ئامادەنەبوو',
          }))
        : [],
      deductions: Array.isArray(w.deductions)
        ? w.deductions.map((ded: any) => ({
            id: ded.id || `ded-${Date.now()}-${Math.random()}`,
            date: ded.date || new Date().toISOString().split('T')[0],
            amount: Number(ded.amount) || 0,
            reason: ded.reason || 'غەرامە',
          }))
        : [],
    }));
  } catch {
    return defaultStaffMembers;
  }
}

export function saveStaff(items: StaffMember[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(KEYS.STAFF, JSON.stringify(items));
    triggerServerSync();
  }
}

export function getSavedRoadmap(): RoadmapItem[] {
  if (typeof window === 'undefined') return defaultRoadmapItems;
  const d = localStorage.getItem(KEYS.ROADMAP);
  if (d === null) {
    localStorage.setItem(KEYS.ROADMAP, JSON.stringify(defaultRoadmapItems));
    return defaultRoadmapItems;
  }
  try {
    const parsed = JSON.parse(d);
    return Array.isArray(parsed) ? parsed : defaultRoadmapItems;
  } catch {
    return defaultRoadmapItems;
  }
}

export function saveRoadmap(items: RoadmapItem[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(KEYS.ROADMAP, JSON.stringify(items));
    triggerServerSync();
  }
}

export function getSavedInventory(): InventoryItem[] {
  if (typeof window === 'undefined') return defaultInventoryItems;
  const d = localStorage.getItem(KEYS.INVENTORY);
  if (d === null) {
    localStorage.setItem(KEYS.INVENTORY, JSON.stringify(defaultInventoryItems));
    return defaultInventoryItems;
  }
  try {
    const parsed = JSON.parse(d);
    if (Array.isArray(parsed)) {
      // Ensure Koch-Chemie Protector Wax (Pw) 1L is present at the top if missing
      const hasKoch = parsed.some((item: any) => item?.name && item.name.toLowerCase().includes('koch'));
      if (!hasKoch) {
        const kochItem: InventoryItem = defaultInventoryItems[0];
        parsed.unshift(kochItem);
        localStorage.setItem(KEYS.INVENTORY, JSON.stringify(parsed));
      }
      return parsed;
    }
    return defaultInventoryItems;
  } catch {
    return defaultInventoryItems;
  }
}

export function saveInventory(items: InventoryItem[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(KEYS.INVENTORY, JSON.stringify(items));
    triggerServerSync();
  }
}

export function getSavedMaterialPurchases(): MaterialPurchase[] {
  if (typeof window === 'undefined') return defaultMaterialPurchases;
  const d = localStorage.getItem(KEYS.MATERIAL_PURCHASES);
  if (d === null) {
    localStorage.setItem(KEYS.MATERIAL_PURCHASES, JSON.stringify(defaultMaterialPurchases));
    return defaultMaterialPurchases;
  }
  try {
    const parsed = JSON.parse(d);
    return Array.isArray(parsed) ? parsed : defaultMaterialPurchases;
  } catch {
    return defaultMaterialPurchases;
  }
}

export function saveMaterialPurchases(items: MaterialPurchase[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(KEYS.MATERIAL_PURCHASES, JSON.stringify(items));
    triggerServerSync();
  }
}

export const defaultCafeItems: CafeItem[] = [
  { id: 'c-1', name: 'چای کوردی خەست', price: 1000, category: 'خواردنەوەی گەرم' },
  { id: 'c-2', name: 'قاوەی ئیسپرێسۆ', price: 2000, category: 'خواردنەوەی گەرم' },
  { id: 'c-3', name: 'قاوەی تورکی', price: 1500, category: 'خواردنەوەی گەرم' },
  { id: 'c-4', name: 'ئاوی کانزایی سارد', price: 500, category: 'خواردنەوەی سارد' },
  { id: 'c-5', name: 'ڕیدبوڵ / وزەبەخش', price: 2500, category: 'خواردنەوەی سارد' },
  { id: 'c-6', name: 'شەربەتی میوەی سارد', price: 2000, category: 'خواردنەوەی سارد' },
  { id: 'c-7', name: 'دار بۆنداری سەیارە (Little Trees)', price: 1500, category: 'بۆندارکەر و پێداویستی' },
  { id: 'c-8', name: 'بۆنی دڵۆپەیی ئەڵمانی', price: 4000, category: 'بۆندارکەر و پێداویستی' },
  { id: 'c-9', name: 'کلێنسی تەڕی فافۆن تایبەت بە داشبۆرد', price: 2500, category: 'بۆندارکەر و پێداویستی' },
];

export function getSavedCafeItems(): CafeItem[] {
  if (typeof window === 'undefined') return defaultCafeItems;
  const d = localStorage.getItem(KEYS.CAFE_ITEMS);
  if (d === null) {
    localStorage.setItem(KEYS.CAFE_ITEMS, JSON.stringify(defaultCafeItems));
    return defaultCafeItems;
  }
  try {
    const parsed = JSON.parse(d);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultCafeItems;
  } catch {
    return defaultCafeItems;
  }
}

export function saveCafeItems(items: CafeItem[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(KEYS.CAFE_ITEMS, JSON.stringify(items));
    triggerServerSync();
  }
}

export function getSavedSettings(): AppSettings {
  if (typeof window === 'undefined') return defaultSettings;
  const d = localStorage.getItem(KEYS.SETTINGS);
  if (!d) {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(defaultSettings));
    return defaultSettings;
  }
  try {
    const parsed = JSON.parse(d);
    const merged: AppSettings = { ...defaultSettings, ...parsed };
    if (!merged.branches || merged.branches.length === 0) {
      merged.branches = defaultBranches;
    }
    if (!merged.activeBranchId) {
      merged.activeBranchId = 'branch-1';
    }
    return merged;
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(settings: AppSettings): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
    broadcastLocalChange(KEYS.SETTINGS);
    triggerServerSync();
  }
}

export function getSavedBranches(): Branch[] {
  const settings = getSavedSettings();
  return settings.branches && settings.branches.length > 0 ? settings.branches : defaultBranches;
}

export function saveBranches(branches: Branch[]): void {
  const settings = getSavedSettings();
  const updatedSettings = { ...settings, branches };
  saveSettings(updatedSettings);
}

export function getActiveBranchId(): string {
  if (typeof window === 'undefined') return 'branch-1';
  try {
    const direct = localStorage.getItem(KEYS.ACTIVE_BRANCH);
    if (direct) return direct;
  } catch {}
  const settings = getSavedSettings();
  return settings.activeBranchId || 'branch-1';
}

export function saveActiveBranchId(branchId: string): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(KEYS.ACTIVE_BRANCH, branchId);
    } catch {}
    const settings = getSavedSettings();
    const updatedSettings = { ...settings, activeBranchId: branchId };
    saveSettings(updatedSettings);
    broadcastLocalChange(KEYS.ACTIVE_BRANCH);
  }
}

export function getSavedZReports(): DailyZReport[] {
  if (typeof window === 'undefined') return [];
  const d = localStorage.getItem(KEYS.ZREPORTS);
  if (!d) return [];
  try {
    const parsed = JSON.parse(d);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveZReports(reports: DailyZReport[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(KEYS.ZREPORTS, JSON.stringify(reports));
    triggerServerSync();
  }
}

// ==========================================
// Garage & Parking Records Storage
// ==========================================

export function getSavedParkingRecords(): ParkingRecord[] {
  if (typeof window === 'undefined') return defaultParkingRecords;
  const d = localStorage.getItem(KEYS.PARKING);
  if (d === null) {
    localStorage.setItem(KEYS.PARKING, JSON.stringify(defaultParkingRecords));
    return defaultParkingRecords;
  }
  try {
    const parsed = JSON.parse(d);
    return Array.isArray(parsed) ? parsed : defaultParkingRecords;
  } catch {
    return defaultParkingRecords;
  }
}

export function saveParkingRecords(records: ParkingRecord[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(KEYS.PARKING, JSON.stringify(records));
    triggerServerSync();
  }
}

// ==========================================
// Authentication & Session Management
// ==========================================

export function getSavedSession(): AuthSession | null {
  if (typeof window === 'undefined') return null;
  const d = localStorage.getItem(KEYS.AUTH_SESSION);
  if (!d) return null;
  try {
    const parsed = JSON.parse(d);
    if (parsed && parsed.currentUser && parsed.currentUser.role) {
      return parsed as AuthSession;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveSession(session: AuthSession | null): void {
  if (typeof window === 'undefined') return;
  if (!session) {
    localStorage.removeItem(KEYS.AUTH_SESSION);
  } else {
    localStorage.setItem(KEYS.AUTH_SESSION, JSON.stringify(session));
  }
}

export function clearSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(KEYS.AUTH_SESSION);
  }
}

export function seedRealisticDemoData(): {
  vehicles: Vehicle[];
  expenses: Expense[];
  setupItems: SetupItem[];
  staff: StaffMember[];
  inventory: InventoryItem[];
  settings: AppSettings;
  parkingRecords: ParkingRecord[];
} {
  saveVehicles(defaultVehicles);
  saveExpenses(defaultExpenses);
  saveSetupItems(defaultSetupItems);
  saveStaff(defaultStaffMembers);
  saveInventory(defaultInventoryItems);
  saveSettings(defaultSettings);
  saveParkingRecords(defaultParkingRecords);

  if (typeof window !== 'undefined') {
    localStorage.setItem('carwash_demo_version', '2026-11-02-v3');
  }

  return {
    vehicles: defaultVehicles,
    expenses: defaultExpenses,
    setupItems: defaultSetupItems,
    staff: defaultStaffMembers,
    inventory: defaultInventoryItems,
    settings: defaultSettings,
    parkingRecords: defaultParkingRecords,
  };
}

export function resetToCleanProduction(): void {
  if (typeof window === 'undefined') return;
  saveVehicles([]);
  saveExpenses([]);
  saveSetupItems([]);
  saveZReports([]);
  saveParkingRecords([]);
  localStorage.setItem('carwash_v1_initialized', 'true');
  triggerServerSync();
}

export function checkAndAutoSeedDemoData(): boolean {
  if (typeof window === 'undefined') return false;
  // In production mode, we never auto-seed dummy data
  localStorage.setItem('carwash_v1_initialized', 'true');
  return false;
}

// Seed realistic today sales and active bay data
export function seedTodaySalesData(currentVehicles?: Vehicle[]): Vehicle[] {
  const baseVehicles = currentVehicles && currentVehicles.length > 0 ? currentVehicles : getSavedVehicles();
  const todayISO = (h: number, m: number) => {
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  };

  const todayWashPresets: Record<string, WashRecord[]> = {
    'v-1': [
      {
        id: 'w-today-1',
        date: todayISO(11, 40),
        serviceId: 'srv-2',
        serviceName: 'شۆردنی تەواو VIP',
        price: 30000,
        isFree: false,
        vehicleSize: 'suv',
        staffId: 'staff-1',
        staffName: 'وەستا ڕێبوار عەلی',
        bayNumber: 1,
        paymentMethod: 'cash',
        paymentStatus: 'paid',
        workerCommission: 7500,
      },
    ],
    'v-2': [
      {
        id: 'w-today-2',
        date: todayISO(9, 15),
        serviceId: 'srv-1',
        serviceName: 'شۆردنی ئاسایی (دەرەوە + ناوەوە)',
        price: 10000,
        isFree: false,
        vehicleSize: 'sedan',
        staffId: 'staff-2',
        staffName: 'وەستا کاروان فەتاح',
        bayNumber: 2,
        paymentMethod: 'cash',
        paymentStatus: 'paid',
        workerCommission: 2500,
      },
    ],
    'v-3': [
      {
        id: 'w-today-3',
        date: todayISO(10, 30),
        serviceId: 'srv-1',
        serviceName: 'شۆردنی ئاسایی (دەرەوە + ناوەوە)',
        price: 13000,
        isFree: false,
        vehicleSize: 'suv',
        staffId: 'staff-3',
        staffName: 'وەستا هەڵمەت محەمەد',
        bayNumber: 3,
        paymentMethod: 'fastpay',
        paymentStatus: 'paid',
        workerCommission: 3250,
      },
    ],
    'v-4': [
      {
        id: 'w-today-4',
        date: todayISO(10, 0),
        serviceId: 'srv-2',
        serviceName: 'شۆردنی تەواو VIP',
        price: 30000,
        isFree: false,
        vehicleSize: 'suv',
        staffId: 'staff-1',
        staffName: 'وەستا ڕێبوار عەلی',
        bayNumber: 1,
        paymentMethod: 'cash',
        paymentStatus: 'paid',
        workerCommission: 7500,
      },
    ],
    'v-5': [
      {
        id: 'w-today-5',
        date: todayISO(9, 45),
        serviceId: 'srv-1',
        serviceName: 'شۆردنی ئاسایی (دەرەوە + ناوەوە)',
        price: 0,
        isFree: true,
        freeReason: 'loyalty',
        vehicleSize: 'sedan',
        staffId: 'staff-2',
        staffName: 'وەستا کاروان فەتاح',
        bayNumber: 2,
        paymentMethod: 'cash',
        paymentStatus: 'paid',
        workerCommission: 2500,
      },
    ],
    'v-6': [
      {
        id: 'w-today-6',
        date: todayISO(8, 45),
        serviceId: 'srv-1',
        serviceName: 'شۆردنی ئاسایی (دەرەوە + ناوەوە)',
        price: 15000,
        isFree: false,
        vehicleSize: 'truck',
        staffId: 'staff-3',
        staffName: 'وەستا هەڵمەت محەمەد',
        bayNumber: 3,
        paymentMethod: 'cash',
        paymentStatus: 'paid',
        workerCommission: 3750,
      },
    ],
    'v-7': [
      {
        id: 'w-today-7',
        date: todayISO(11, 10),
        serviceId: 'srv-3',
        serviceName: 'پۆلیشی تەواو و نانۆ سیرامیک',
        price: 45000,
        isFree: false,
        vehicleSize: 'suv',
        staffId: 'staff-1',
        staffName: 'وەستا ڕێبوار عەلی',
        bayNumber: 1,
        paymentMethod: 'fib',
        paymentStatus: 'paid',
        workerCommission: 11250,
      },
    ],
    'v-8': [
      {
        id: 'w-today-8',
        date: todayISO(12, 0),
        serviceId: 'srv-2',
        serviceName: 'شۆردنی تەواو VIP',
        price: 30000,
        isFree: false,
        vehicleSize: 'suv',
        staffId: 'staff-2',
        staffName: 'وەستا کاروان فەتاح',
        bayNumber: 2,
        paymentMethod: 'cash',
        paymentStatus: 'paid',
        workerCommission: 7500,
      },
    ],
    'v-9': [
      {
        id: 'w-today-9',
        date: todayISO(12, 33),
        serviceId: 'srv-3',
        serviceName: 'پۆلیشی تەواو و نانۆ سیرامیک',
        price: 45000,
        isFree: false,
        vehicleSize: 'sedan',
        staffId: 'staff-3',
        staffName: 'وەستا هەڵمەت محەمەد',
        bayNumber: 3,
        paymentMethod: 'cash',
        paymentStatus: 'paid',
        workerCommission: 11250,
      },
    ],
  };

  const updatedVehicles = baseVehicles.map((v) => {
    const todayWashes = todayWashPresets[v.id] || [];
    const existingOtherDays = (v.washHistory || []).filter((w) => !isDateToday(w.date));
    const mergedHistory = [...todayWashes, ...existingOtherDays];

    if (v.id === 'v-2') {
      return {
        ...v,
        currentBay: 1,
        washStage: 'کەفڕێژکردن' as any,
        assignedWorkerId: 'staff-1',
        assignedWorkerName: 'وەستا ڕێبوار عەلی',
        bayEntryTime: todayISO(12, 10),
        washHistory: mergedHistory,
      };
    }
    if (v.id === 'v-4') {
      return {
        ...v,
        currentBay: 2,
        washStage: 'وشککردنەوە و پۆلیش' as any,
        assignedWorkerId: 'staff-2',
        assignedWorkerName: 'وەستا کاروان فەتاح',
        bayEntryTime: todayISO(12, 20),
        washHistory: mergedHistory,
      };
    }
    if (v.id === 'v-1') {
      return {
        ...v,
        currentBay: undefined,
        bayEntryTime: undefined,
        washStage: 'چاوەڕوانی' as any,
        washHistory: mergedHistory,
      };
    }
    return {
      ...v,
      washHistory: mergedHistory,
    };
  });

  saveVehicles(updatedVehicles);

  // Ensure realistic today's expenses exist (27,000 IQD)
  const currentExpenses = getSavedExpenses();
  const hasTodayExpenses = currentExpenses.some((e) => isDateToday(e.date));
  if (!hasTodayExpenses) {
    const todayDateStr = getTodayLocalDateString();
    const todayExpenses: Expense[] = [
      {
        id: `exp-today-1`,
        title: 'نانخواردن و خواردنەوەی ستاف (نیوەڕۆ)',
        amount: 15000,
        category: 'خەرجی تر',
        date: todayDateStr,
        isPettyCash: true,
        notes: 'نیوەڕۆ بۆ ستافی شۆردن',
      },
      {
        id: `exp-today-2`,
        title: 'گاز بۆ موەلیدە (سوتەمەنی فریاگوزاری)',
        amount: 12000,
        category: 'ئاو و کارەبا و مۆلیدە',
        date: todayDateStr,
        isPettyCash: true,
        notes: 'گاز بۆ غەسل لە کاتی بڕانی کارەبا',
      },
    ];
    saveExpenses([...todayExpenses, ...currentExpenses]);
  }

  triggerServerSync();
  return updatedVehicles;
}

// ==========================================
// Debt Management & Settlement Helpers
// ==========================================

export function getVehicleTotalDebt(v: Vehicle): number {
  if (!v || !Array.isArray(v.washHistory)) return 0;
  return v.washHistory
    .filter((w) => w.paymentStatus === 'unpaid' || w.paymentMethod === 'debt')
    .reduce((sum, w) => sum + (Number(w.price) || 0), 0);
}

export function getAllUnpaidDebts(vehicles: Vehicle[]): { vehicle: Vehicle; wash: WashRecord }[] {
  if (!Array.isArray(vehicles)) return [];
  const debts: { vehicle: Vehicle; wash: WashRecord }[] = [];
  vehicles.forEach((v) => {
    (v.washHistory || []).forEach((w) => {
      if (w.paymentStatus === 'unpaid' || w.paymentMethod === 'debt') {
        debts.push({ vehicle: v, wash: w });
      }
    });
  });
  return debts;
}

export function settleVehicleDebt(
  vehicleId: string,
  washId: string,
  method: PaymentMethod = 'cash'
): Vehicle[] {
  const currentVehicles = getSavedVehicles();
  const updated = currentVehicles.map((v) => {
    if (v.id === vehicleId) {
      return {
        ...v,
        washHistory: (v.washHistory || []).map((w) =>
          w.id === washId
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
  saveVehicles(updated);
  return updated;
}

export function validateUserPin(rawPin: string, settings: AppSettings): AuthUser | null {
  const cleanPin = normalizeDigits(rawPin.trim());
  const adminPin = normalizeDigits(settings?.adminPin || '9999');
  const staffPin = normalizeDigits(settings?.staffPin || '1234');

  if (cleanPin === adminPin) {
    return {
      id: 'admin-user',
      name: 'بەڕێوەبەری سیستەم',
      role: 'admin',
      pin: cleanPin,
      avatar: '👑',
    };
  }

  if (cleanPin === staffPin) {
    return {
      id: 'cashier-user',
      name: 'کاشێر / وەرگری پارە',
      role: 'cashier',
      pin: cleanPin,
      avatar: '💳',
    };
  }

  return null;
}

// ==========================================
// Theme Management (Light / Dark Mode)
// ==========================================

export type ThemeMode = 'light' | 'dark';

export function getSavedTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  try {
    const saved = localStorage.getItem('carwash_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    // Also check saved settings
    const settings = getSavedSettings();
    if (settings && (settings.themeMode === 'dark' || settings.themeMode === 'light')) {
      return settings.themeMode;
    }
  } catch {}
  return 'light';
}

export function saveTheme(theme: ThemeMode): void {
  if (typeof window === 'undefined') return;
  try {
    const validTheme = theme === 'dark' ? 'dark' : 'light';
    localStorage.setItem('carwash_theme', validTheme);
  } catch {}
}

export function applyTheme(theme: ThemeMode): void {
  if (typeof window === 'undefined') return;
  try {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
      if (document.body) {
        document.body.classList.add('dark');
      }
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
      if (document.body) {
        document.body.classList.remove('dark');
      }
    }
  } catch {}
}

// ==========================================
// Central Server Sync Layer (Cross-Device & Multi-User)
// ==========================================

let syncDebounceTimer: any = null;

export function triggerServerSync(immediate = false): void {
  if (typeof window === 'undefined') return;
  // Immediately inform other tabs on the same device
  broadcastLocalChange();

  if (syncDebounceTimer) clearTimeout(syncDebounceTimer);

  const doSync = async () => {
    try {
      const payload = {
        vehicles: getSavedVehicles(),
        expenses: getSavedExpenses(),
        setupItems: getSavedSetupItems(),
        staff: getSavedStaff(),
        services: getSavedServices(),
        settings: getSavedSettings(),
        inventory: getSavedInventory(),
        materialPurchases: getSavedMaterialPurchases(),
        roadmap: getSavedRoadmap(),
        cafeItems: getSavedCafeItems(),
        zreports: getSavedZReports(),
        parkingRecords: getSavedParkingRecords(),
      };
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-carwash-sync-key': 'carwash-local-sync-v1',
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data && json.data.lastUpdated) {
          localStorage.setItem(KEYS.LAST_SYNC_TS, json.data.lastUpdated);
        }
      }
    } catch {
      // Offline fallback: localStorage holds state safely
    }
  };

  if (immediate) {
    doSync();
  } else {
    // Ultra-fast 120ms debounce for rapid auto-saving without server bottleneck
    syncDebounceTimer = setTimeout(doSync, 120);
  }
}

export function forceImmediateSync(): void {
  triggerServerSync(true);
}

// Auto-sync when internet connection is restored
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    triggerServerSync(true);
  });
}

export async function pullServerDatabase(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    const res = await fetch('/api/sync', {
      cache: 'no-store',
      headers: { 'x-carwash-sync-key': 'carwash-local-sync-v1' },
    });
    if (!res.ok) return false;
    const json = await res.json();
    if (json.success && json.data) {
      const data = json.data;
      if (Array.isArray(data.vehicles)) {
        safeStorageSet(KEYS.VEHICLES, JSON.stringify(data.vehicles));
      }
      if (Array.isArray(data.expenses)) {
        safeStorageSet(KEYS.EXPENSES, JSON.stringify(data.expenses));
      }
      if (Array.isArray(data.setupItems)) {
        safeStorageSet(KEYS.SETUP, JSON.stringify(data.setupItems));
      }
      if (Array.isArray(data.staff)) {
        safeStorageSet(KEYS.STAFF, JSON.stringify(data.staff));
      }
      if (Array.isArray(data.services)) {
        safeStorageSet(KEYS.SERVICES, JSON.stringify(data.services));
      }
      if (data.settings) {
        safeStorageSet(KEYS.SETTINGS, JSON.stringify(data.settings));
      }
      if (Array.isArray(data.inventory)) {
        safeStorageSet(KEYS.INVENTORY, JSON.stringify(data.inventory));
      }
      if (Array.isArray(data.materialPurchases)) {
        safeStorageSet(KEYS.MATERIAL_PURCHASES, JSON.stringify(data.materialPurchases));
      }
      if (Array.isArray(data.roadmap)) {
        safeStorageSet(KEYS.ROADMAP, JSON.stringify(data.roadmap));
      }
      if (Array.isArray(data.cafeItems)) {
        safeStorageSet(KEYS.CAFE_ITEMS, JSON.stringify(data.cafeItems));
      }
      if (Array.isArray(data.zreports)) {
        safeStorageSet(KEYS.ZREPORTS, JSON.stringify(data.zreports));
      }
      if (Array.isArray(data.parkingRecords)) {
        safeStorageSet(KEYS.PARKING, JSON.stringify(data.parkingRecords));
      }
      if (data.lastUpdated) {
        localStorage.setItem(KEYS.LAST_SYNC_TS, data.lastUpdated);
      }
      return true;
    }
  } catch {
    // Offline or fetch failed
  }
  return false;
}

// Lightweight heartbeat to check if other devices or users made updates
export async function checkServerUpdates(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    const res = await fetch('/api/sync?checkOnly=1', { cache: 'no-store' });
    if (!res.ok) return false;
    const json = await res.json();
    if (json.success && json.lastUpdated) {
      const localTs = localStorage.getItem(KEYS.LAST_SYNC_TS) || '';
      if (json.lastUpdated !== localTs) {
        return await pullServerDatabase();
      }
    }
  } catch {}
  return false;
}

export function getLastSyncTimestamp(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(KEYS.LAST_SYNC_TS) || '';
}

export function subscribeToRealtimeSync(listener: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = () => {
    listener();
  };
  realtimeChannel?.addEventListener('message', handler);
  window.addEventListener('storage', handler);
  return () => {
    realtimeChannel?.removeEventListener('message', handler);
    window.removeEventListener('storage', handler);
  };
}

export async function fetchVehicleFromServer(id: string): Promise<{ vehicle: Vehicle; settings?: AppSettings; services?: ServiceItem[] } | null> {
  try {
    const res = await fetch(`/api/vehicles/${encodeURIComponent(id)}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const json = await res.json();
    if (json.success && json.vehicle) {
      return {
        vehicle: json.vehicle,
        settings: json.settings,
        services: json.services,
      };
    }
  } catch {
    // Fallback to local
  }
  return null;
}



