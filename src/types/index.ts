export type PlateType = 'unified' | 'old';

// Branch & Location Management (فرە لقی - Multi-Branch)
export interface Branch {
  id: string; // e.g. "branch-1", "branch-2"
  name: string; // e.g. "لقی ١ (سەرەکی)", "لقی ٢"
  code: string; // e.g. "B1", "B2"
  address: string;
  phone: string;
  numberOfBays: number;
  managerName?: string;
  isMain?: boolean;
}

// User Authentication & Roles
export type UserRole = 'admin' | 'cashier';

export interface AuthUser {
  id: string;
  name: string;
  role: UserRole;
  pin: string;
  avatar?: string;
}

export interface AuthSession {
  currentUser: AuthUser;
  loginTime: string;
}

export interface LicensePlate {
  type: PlateType;
  // For unified:
  provinceCode?: string; // e.g. "21", "22", "11"
  provinceName?: string; // e.g. "سلێمانی", "هەولێر"
  letter?: string; // e.g. "A", "B", "M"
  number?: string; // e.g. "4589"
  // For old plates:
  oldCityName?: string; // e.g. "هەولێر", "سلێمانی"
  oldCategory?: string; // e.g. "تایبەت", "کرێ", "حکومی"
  oldNumber?: string; // e.g. "258569"
}

// Every item in Setup is already purchased as requested
export interface SetupItem {
  id: string;
  name: string;
  category: 'ئامێرەکان' | 'کەرەستە و پێداویستی' | 'بیناسازی و حەوز' | 'کارەبا و ڕووناکی' | 'ڕیکلام و دیکۆر';
  cost: number; // IQD (نرخی کڕین)
  quantity: number;
  unit: string;
  purchaseDate: string;
  notes?: string;
}

export interface Expense {
  id: string;
  title: string;
  category: 'کرێی شوێن' | 'مەواد و شامپۆ' | 'ئاو و کارەبا و مۆلیدە' | 'مووچەی کارمەندان' | 'چاککردنەوە' | 'خەرجی تر';
  amount: number; // IQD
  date: string;
  notes?: string;
  isPettyCash?: boolean;
  paidTo?: string;
  branchId?: string; // شوناسی لق (بۆ جیاکردنەوەی خەرجی لقی ١ و لقی ٢)
}

export type VehicleSize = 'sedan' | 'suv' | 'truck';
export type PaymentMethod = 'cash' | 'fastpay' | 'fib' | 'debt';

export interface CafeItem {
  id: string;
  name: string;
  price: number; // IQD
  category: 'خواردنەوەی گەرم' | 'خواردنەوەی سارد' | 'بۆندارکەر و پێداویستی' | 'شیرینی و سووکەژەم';
}

export interface SelectedCafeItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface CustomerReview {
  id: string;
  rating: number; // 1 to 5
  feedback?: string;
  date: string;
}

export interface VipSubscription {
  planId: string;
  planName: string;
  startDate: string; // ISO
  endDate: string; // ISO
  pricePaid: number;
  status: 'active' | 'expired';
}

export interface ServiceItem {
  id: string;
  name: string;
  category?: 'سەیارە' | 'پۆڵیش و نانۆ سێرامیک' | 'شۆردنی فەرش' | 'شۆردنی قەنەفە' | 'خزمەتگوزاری تر';
  unit?: string; // 'سەیارە', 'مەتر دووجا (م²)', 'تەخم', 'دانە'
  price: number; // IQD (بنەڕەتی - سەیارەی بچووک)
  pricesBySize?: {
    sedan?: number;
    suv?: number;
    truck?: number;
  };
  description: string;
  durationMinutes: number;
}

export interface VehicleDamageInspection {
  hasScratches?: boolean;
  hasDents?: boolean;
  brokenParts?: boolean;
  notes?: string;
  inspectedAt?: string;
}

export interface CarpetSpecs {
  areaSquareMeters: number; // ڕووبەر بە مەتر دووجا (م²)
  piecesCount: number; // ژمارەی فەرش یان پارچە
  ratePerSquareMeter: number; // نرخی ١ مەتر دووجا (IQD)
  length?: number; // درێژایی (مەتر)
  width?: number; // پانی (مەتر)
  carpetType?: string; // جۆری فەرش (ئاسایی، ئاوریشم، قەنەفە)
  readyDate?: string; // بەرواری چاوەڕوانکراوی تەواوبوون
  notes?: string;
}

export interface WashRecord {
  id: string;
  date: string;
  serviceId: string;
  serviceName: string;
  price: number; // IQD
  isFree: boolean;
  freeReason?: 'loyalty' | 'rain_warranty' | 'courtesy' | 'promo';
  vehicleSize?: VehicleSize;
  staffId?: string;
  staffName?: string;
  bayNumber?: number;
  paymentMethod?: PaymentMethod;
  paymentStatus?: 'paid' | 'unpaid';
  paidAt?: string;
  discountAmount?: number;
  discountReason?: string;
  workerCommission?: number;
  debtNote?: string;
  damageInspection?: VehicleDamageInspection;
  cafeItems?: SelectedCafeItem[];
  cafeTotal?: number;
  isSubscriptionWash?: boolean;
  itemType?: 'car' | 'carpet';
  carpetSpecs?: CarpetSpecs;
  branchId?: string;
  branchName?: string;
}

export interface DailyZReport {
  id: string;
  date: string; // YYYY-MM-DD
  closedAt: string; // ISO
  closedBy: string;
  branchId?: string;
  branchName?: string;
  totalCars: number;
  cashTotal: number;
  fastpayTotal: number;
  fibTotal: number;
  debtTotal: number;
  recoveredDebtTotal?: number; // Total collected today from previous debts
  newDebtTotal?: number; // Total new debt incurred today
  freeWashesCount: number;
  totalRevenue: number;
  workerCommissionsTotal: number;
  actualCashCounted: number;
  discrepancy: number; // actualCashCounted - cashTotal
  notes?: string;
  pettyCashTotal?: number;
  expectedCash?: number;
}

export interface OwnerSocialLinks {
  whatsapp?: string;
  snapchat?: string;
  instagram?: string;
  tiktok?: string;
  telegram?: string;
  facebook?: string;
  website?: string;
}

export interface Vehicle {
  id: string;
  plate: LicensePlate;
  ownerName: string;
  phone: string;
  carModel: string;
  color: string;
  size?: VehicleSize;
  nfcTagId: string;
  hasNfcSticker: boolean;
  customerPin?: string; // 4-digit PIN for car owner
  ownerBio?: string;
  socialLinks?: OwnerSocialLinks;
  isLoyaltyPrivate?: boolean; // When true (default), loyalty card and wash history are locked behind PIN
  totalWashes: number;
  currentCycleWashes: number; // 0 to 4 (5th is free)
  freeWashesClaimed: number;
  lastVisitDate: string; // ISO string
  registeredDate: string;
  status: 'active' | 'expired';
  currentBay?: number;
  currentBayBranchId?: string; // شوناسی لقی ئەکتیڤ کە سەیارەکەی تێدایە لەناو هۆڵ
  bayEntryTime?: string; // ISO string when admitted to current bay
  washStage?: 'چاوەڕوانی' | 'کەفڕێژکردن' | 'شۆردنی دەرەوە' | 'ناوەوە و کوشن' | 'وشککردنەوە و پۆلیش' | 'تەواوبوو';
  assignedWorkerId?: string;
  assignedWorkerName?: string;
  damageInspection?: VehicleDamageInspection;
  subscription?: VipSubscription;
  reviews?: CustomerReview[];
  itemType?: 'car' | 'carpet';
  carpetSpecs?: CarpetSpecs;
  branchId?: string;
  branchName?: string;
  washHistory: WashRecord[];
}

export interface AbsentRecord {
  id: string;
  date: string;
  reason?: string;
}

export interface StaffDeduction {
  id: string;
  date: string;
  amount: number; // IQD
  reason: string;
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  phone: string;
  salaryType: 'monthly' | 'daily';
  baseSalary: number; // IQD
  commissionType?: 'fixed' | 'percentage' | 'none';
  commissionValue?: number; // e.g. 2000 IQD per wash or 25%
  workHours: string; // e.g. "08:00 AM - 06:00 PM"
  startDate: string; // Date joined
  endDate?: string; // Date left if archived
  status: 'active' | 'archived';
  branchId?: string; // شوناسی لقێک کە ئەم کارمەندەی لێ کاردەکات
  absentRecords: AbsentRecord[];
  deductions: StaffDeduction[];
}

export interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  targetVersion: string;
  completed: boolean;
  notes?: string;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'شامپۆ و کەف' | 'واکس و پۆڵیش' | 'نانۆ و پارێزەر' | 'ڕۆن و هایدرۆلیک' | 'پێداویستی تر';
  quantity: number;
  unit: 'لیتر' | 'دانە' | 'بتڵ' | 'گالۆن' | 'کیلۆ' | 'کارتۆن';
  minAlertLevel: number;
  costPerUnit: number; // IQD
  lastRestocked?: string;
  notes?: string;
}

export interface MaterialPurchase {
  id: string;
  name: string;
  category: 'شامپۆ و کەف' | 'واکس و پۆڵیش' | 'نانۆ و پارێزەر' | 'ڕۆن و هایدرۆلیک' | 'پێداویستی تر';
  quantity: number;
  unit: string;
  costPerUnit: number; // IQD
  totalCost: number; // IQD
  date: string; // YYYY-MM-DD
  supplier?: string;
  notes?: string;
  expenseId?: string;
}

export interface AppSettings {
  // 1. Identity & Branding
  themeMode?: 'light' | 'dark';
  carWashName: string;
  carWashSlogan?: string;
  carWashPhone: string;
  carWashAddress: string;
  businessHours?: string;
  systemUrl?: string; // Optional custom host/domain (e.g. https://mycarwash.com)

  // 2. Receipt & Printing
  receiptPrinterSize?: '80mm' | '58mm';
  receiptFooterNote?: string;
  autoPrintReceipt?: boolean;
  showStaffOnReceipt?: boolean;

  // 3. Bays & Capacity
  numberOfBays?: number;
  dailyTargetCars?: number;

  // 4. Loyalty, Rewards & WhatsApp
  staffPin: string;
  adminPin?: string;
  expiryDaysLimit: number;
  washesNeededForFree: number;
  milestoneWashTarget: number;
  vipDiscountPercent?: number;
  enableWhatsAppNotification?: boolean;

  // 5. Overheads & Financials
  monthlyRent?: number; // بڕی کرێی مانگانەی شوێن
  dailyUtilities?: number; // تێچووی ئاو، کارەبا و مۆلیدەی ڕۆژانە
  averageMaterialCostPerWash?: number; // تێچووی مەواد بۆ هەر سەیارەیەک

  // 6. Happy Hour Off-Peak Settings
  happyHourEnabled?: boolean;
  happyHourStart?: string; // e.g. "09:00"
  happyHourEnd?: string; // e.g. "12:00"
  happyHourDiscountPercent?: number; // e.g. 15

  // 7. Google Maps Review Booster & Owner Nightly Briefing
  googleMapsReviewUrl?: string; // e.g. https://maps.app.goo.gl/...
  ownerPhone?: string; // Private phone number of car wash owner for Z-Report briefings
  enableReviewBooster?: boolean;

  // 8. VIP Unlimited Subscription Plans
  vipMonthlyPlanPrice?: number; // e.g. 50,000 IQD
  vipQuarterlyPlanPrice?: number; // e.g. 130,000 IQD

  // 9. Telegram Bot Integration
  telegramBotEnabled?: boolean;
  telegramBotToken?: string;
  telegramChatId?: string;

  // 10. Garage & Parking Management
  garageCapacity?: number; // ژمارەی شوێنی وەستانی گەراج (نموونە: ٣٠ شوێن)
  garageDailyRate?: number; // نرخی وەستانی ڕۆژانە (نموونە: ١,٠٠٠ دینار)
  garageOvernightRate?: number; // نرخی وەستانی شەوانە (نموونە: ٣,٠٠٠ دینار)
  garageMonthlyRate?: number; // نرخی ئابوونەی مانگانەی گەراج (نموونە: ٢٥,٠٠٠ دینار)

  // 11. Multi-Branch & Realtime Concurrency
  branches?: Branch[]; // لیستی هەردوو لق (لقی ١، لقی ٢ یان زیاتر)
  activeBranchId?: string; // شوناسی لقی ئەکتیڤ لەسەر ئەم ئامێرە
  autoSyncIntervalMs?: number; // ماوەی پشکنینی خێرای سێرڤەر بۆ چەند ئامێر و کاشێر (نموونە: 1500ms)
}

// ==========================================
// Garage & Parking Management Types
// ==========================================

export type ParkingRateType = 'daily' | 'hourly' | 'overnight' | 'monthly';

export interface ParkingRecord {
  id: string;
  ticketNumber: string; // e.g. "G-101"
  plate: LicensePlate;
  slotNumber: number; // 1 to 30
  entryTime: string; // ISO string
  exitTime?: string; // ISO string
  status: 'parked' | 'exited' | 'washing';
  rateType: ParkingRateType;
  fee: number; // IQD (default: 1,000 IQD)
  paymentStatus: 'paid' | 'unpaid';
  paymentMethod?: PaymentMethod;
  carModel?: string;
  ownerName?: string;
  phone?: string;
  notes?: string;
  linkedWashBay?: number;
  linkedWashVehicleId?: string;
}
