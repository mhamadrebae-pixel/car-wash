import fs from 'fs';
import path from 'path';
import {
  Vehicle,
  Expense,
  SetupItem,
  StaffMember,
  ServiceItem,
  AppSettings,
  InventoryItem,
  RoadmapItem,
  DailyZReport,
  CafeItem,
  ParkingRecord,
} from '@/types';
import {
  defaultVehicles,
  defaultExpenses,
  defaultSetupItems,
  defaultStaffMembers,
  defaultServices,
  defaultSettings,
  defaultInventoryItems,
  defaultRoadmapItems,
  defaultCafeItems,
  defaultParkingRecords,
} from '@/constants/initialData';

export interface DatabasePayload {
  vehicles: Vehicle[];
  expenses: Expense[];
  setupItems: SetupItem[];
  staff: StaffMember[];
  services: ServiceItem[];
  settings: AppSettings;
  inventory: InventoryItem[];
  roadmap: RoadmapItem[];
  cafeItems: CafeItem[];
  zreports: DailyZReport[];
  parkingRecords?: ParkingRecord[];
  lastUpdated: string;
  version: string;
}

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'carwash-db.json');

// Ensure database directory exists
function ensureDbDir() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
}

// Get initial payload if database does not exist (Clean Production State)
export function getInitialDatabasePayload(): DatabasePayload {
  return {
    vehicles: [],
    expenses: [],
    setupItems: [],
    staff: defaultStaffMembers,
    services: defaultServices,
    settings: defaultSettings,
    inventory: defaultInventoryItems,
    roadmap: defaultRoadmapItems,
    cafeItems: defaultCafeItems,
    zreports: [],
    parkingRecords: defaultParkingRecords,
    lastUpdated: new Date().toISOString(),
    version: '2026-production-v1',
  };
}

// Read database from disk
export function readServerDatabase(): DatabasePayload {
  ensureDbDir();
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initial = getInitialDatabasePayload();
      writeServerDatabase(initial);
      return initial;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return {
      vehicles: Array.isArray(parsed.vehicles) ? parsed.vehicles : [],
      expenses: Array.isArray(parsed.expenses) ? parsed.expenses : [],
      setupItems: Array.isArray(parsed.setupItems) ? parsed.setupItems : [],
      staff: Array.isArray(parsed.staff) ? parsed.staff : defaultStaffMembers,
      services: Array.isArray(parsed.services) ? parsed.services : defaultServices,
      settings: parsed.settings || defaultSettings,
      inventory: Array.isArray(parsed.inventory) ? parsed.inventory : defaultInventoryItems,
      roadmap: Array.isArray(parsed.roadmap) ? parsed.roadmap : defaultRoadmapItems,
      cafeItems: Array.isArray(parsed.cafeItems) ? parsed.cafeItems : defaultCafeItems,
      zreports: Array.isArray(parsed.zreports) ? parsed.zreports : [],
      parkingRecords: Array.isArray(parsed.parkingRecords) ? parsed.parkingRecords : defaultParkingRecords,
      lastUpdated: parsed.lastUpdated || new Date().toISOString(),
      version: parsed.version || '2026-production-v1',
    };
  } catch (error) {
    console.error('Error reading server database, falling back to default:', error);
    return getInitialDatabasePayload();
  }
}

// Write database to disk safely
export function writeServerDatabase(data: Partial<DatabasePayload>): DatabasePayload {
  ensureDbDir();
  try {
    let current: DatabasePayload;
    if (fs.existsSync(DB_FILE)) {
      try {
        current = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      } catch {
        current = getInitialDatabasePayload();
      }
    } else {
      current = getInitialDatabasePayload();
    }

    const updated: DatabasePayload = {
      vehicles: data.vehicles !== undefined ? data.vehicles : current.vehicles,
      expenses: data.expenses !== undefined ? data.expenses : current.expenses,
      setupItems: data.setupItems !== undefined ? data.setupItems : current.setupItems,
      staff: data.staff !== undefined ? data.staff : current.staff,
      services: data.services !== undefined ? data.services : current.services,
      settings: data.settings !== undefined ? data.settings : current.settings,
      inventory: data.inventory !== undefined ? data.inventory : current.inventory,
      roadmap: data.roadmap !== undefined ? data.roadmap : current.roadmap,
      cafeItems: data.cafeItems !== undefined ? data.cafeItems : current.cafeItems || defaultCafeItems,
      zreports: data.zreports !== undefined ? data.zreports : current.zreports,
      parkingRecords: data.parkingRecords !== undefined ? data.parkingRecords : (current.parkingRecords || defaultParkingRecords),
      lastUpdated: new Date().toISOString(),
      version: '2026-11-09-v1',
    };

    // Atomic write via temp file
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(updated, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);

    return updated;
  } catch (error) {
    console.error('Error writing server database:', error);
    throw error;
  }
}
