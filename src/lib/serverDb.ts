import fs from 'fs';
import path from 'path';
import { Redis } from '@upstash/redis';
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

const IS_VERCEL = !!process.env.VERCEL;
const BUNDLED_DB_FILE = path.join(process.cwd(), 'data', 'carwash-db.json');
const DB_DIR = IS_VERCEL ? '/tmp' : path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'carwash-db.json');

// Upstash / Vercel KV Redis singleton
let redisClient: Redis | null = null;
function getRedisClient(): Redis | null {
  if (redisClient) return redisClient;
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (url && token) {
    try {
      redisClient = new Redis({ url, token });
      return redisClient;
    } catch (e) {
      console.warn('Failed to initialize Redis client:', e);
    }
  }
  return null;
}

// Ensure database directory exists
function ensureDbDir() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  if (IS_VERCEL && !fs.existsSync(DB_FILE) && fs.existsSync(BUNDLED_DB_FILE)) {
    try {
      fs.copyFileSync(BUNDLED_DB_FILE, DB_FILE);
    } catch (e) {
      console.warn('Could not copy bundled DB to /tmp:', e);
    }
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

// Read database from disk (local fallback)
function readLocalDatabase(): DatabasePayload {
  ensureDbDir();
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initial = getInitialDatabasePayload();
      writeLocalDatabase(initial);
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
      inventory: Array.isArray(parsed.inventory)
        ? (parsed.inventory.some((i: any) => i?.name && i.name.toLowerCase().includes('koch'))
            ? parsed.inventory
            : [defaultInventoryItems[0], ...parsed.inventory])
        : defaultInventoryItems,
      roadmap: Array.isArray(parsed.roadmap) ? parsed.roadmap : defaultRoadmapItems,
      cafeItems: Array.isArray(parsed.cafeItems) ? parsed.cafeItems : defaultCafeItems,
      zreports: Array.isArray(parsed.zreports) ? parsed.zreports : [],
      parkingRecords: Array.isArray(parsed.parkingRecords) ? parsed.parkingRecords : defaultParkingRecords,
      lastUpdated: parsed.lastUpdated || new Date().toISOString(),
      version: parsed.version || '2026-production-v1',
    };
  } catch (error) {
    console.error('Error reading local server database, falling back to default:', error);
    return getInitialDatabasePayload();
  }
}

// Write database to disk safely (local fallback)
function writeLocalDatabase(updated: DatabasePayload): void {
  ensureDbDir();
  try {
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(updated, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (error) {
    // ignore on read-only environments
  }
}

// Read server database (Primary: Upstash Redis in Cloud | Fallback: Local Disk)
export async function readServerDatabase(): Promise<DatabasePayload> {
  const redis = getRedisClient();
  if (redis) {
    try {
      const data = await redis.get<DatabasePayload>('carwash_db');
      if (data && typeof data === 'object') {
        return {
          vehicles: Array.isArray(data.vehicles) ? data.vehicles : [],
          expenses: Array.isArray(data.expenses) ? data.expenses : [],
          setupItems: Array.isArray(data.setupItems) ? data.setupItems : [],
          staff: Array.isArray(data.staff) ? data.staff : defaultStaffMembers,
          services: Array.isArray(data.services) ? data.services : defaultServices,
          settings: data.settings || defaultSettings,
          inventory: Array.isArray(data.inventory) ? data.inventory : defaultInventoryItems,
          roadmap: Array.isArray(data.roadmap) ? data.roadmap : defaultRoadmapItems,
          cafeItems: Array.isArray(data.cafeItems) ? data.cafeItems : defaultCafeItems,
          zreports: Array.isArray(data.zreports) ? data.zreports : [],
          parkingRecords: Array.isArray(data.parkingRecords) ? data.parkingRecords : defaultParkingRecords,
          lastUpdated: data.lastUpdated || new Date().toISOString(),
          version: data.version || '2026-production-v1',
        };
      }
      // If redis is empty, seed it with the current database file from disk
      const local = readLocalDatabase();
      await redis.set('carwash_db', local);
      return local;
    } catch (error) {
      console.error('Error reading from Upstash Redis, falling back to local file:', error);
    }
  }

  return readLocalDatabase();
}

// Write server database (Primary: Upstash Redis in Cloud | Fallback: Local Disk)
export async function writeServerDatabase(data: Partial<DatabasePayload>): Promise<DatabasePayload> {
  const current = await readServerDatabase();
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

  const redis = getRedisClient();
  if (redis) {
    try {
      await redis.set('carwash_db', updated);
    } catch (error) {
      console.error('Error writing to Upstash Redis:', error);
    }
  }

  writeLocalDatabase(updated);

  return updated;
}
