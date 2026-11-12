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
  MaterialPurchase,
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
  defaultMaterialPurchases,
  defaultRoadmapItems,
  defaultCafeItems,
  defaultParkingRecords,
  defaultBranches,
} from '@/constants/initialData';

export interface DatabasePayload {
  vehicles: Vehicle[];
  expenses: Expense[];
  setupItems: SetupItem[];
  staff: StaffMember[];
  services: ServiceItem[];
  settings: AppSettings;
  inventory: InventoryItem[];
  materialPurchases?: MaterialPurchase[];
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
    materialPurchases: defaultMaterialPurchases,
    roadmap: defaultRoadmapItems,
    cafeItems: defaultCafeItems,
    zreports: [],
    parkingRecords: defaultParkingRecords,
    lastUpdated: new Date().toISOString(),
    version: '2026-production-v1',
  };
}

// Intelligent Concurrency Merging for Multi-User & Multi-Device
function mergeVehicles(incoming?: Vehicle[], current?: Vehicle[]): Vehicle[] {
  if (!incoming) return current || [];
  if (!current || current.length === 0) return incoming;

  const currentMap = new Map<string, Vehicle>();
  current.forEach((v) => currentMap.set(v.id, v));

  const incomingIds = new Set<string>();
  const mergedList: Vehicle[] = incoming.map((inc) => {
    incomingIds.add(inc.id);
    const curr = currentMap.get(inc.id);
    if (!curr) {
      return {
        ...inc,
        updatedAt: inc.updatedAt || new Date().toISOString(),
      };
    }

    // Merge wash histories by unique wash ID so past records from other devices are never lost
    const washMap = new Map<string, any>();
    (curr.washHistory || []).forEach((w) => washMap.set(w.id, w));
    (inc.washHistory || []).forEach((w) => washMap.set(w.id, w));
    const mergedWashes = Array.from(washMap.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // The incoming vehicle is authoritative for active user state (bays, stage, edits)
    return {
      ...curr,
      ...inc,
      washHistory: mergedWashes,
      totalWashes: Math.max(inc.totalWashes || 0, mergedWashes.length),
      updatedAt: inc.updatedAt || new Date().toISOString(),
    };
  });

  // Preserve any vehicles that were registered on another device within the last 5 minutes
  // but allow actual deliberate deletions of older vehicles
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  current.forEach((curr) => {
    if (!incomingIds.has(curr.id)) {
      const regTime = new Date(curr.registeredDate || 0).getTime();
      const updTime = new Date(curr.updatedAt || 0).getTime();
      if (regTime > fiveMinutesAgo || updTime > fiveMinutesAgo) {
        mergedList.push(curr);
      }
    }
  });

  return mergedList;
}

function mergeEntitiesById<T extends { id: string }>(incoming?: T[], current?: T[]): T[] {
  if (!incoming) return current || [];
  if (!current) return incoming;
  const map = new Map<string, T>();
  current.forEach((item) => {
    if (item && item.id) map.set(item.id, item);
  });
  incoming.forEach((item) => {
    if (item && item.id) map.set(item.id, item);
  });
  return Array.from(map.values());
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
    const parsedSettings = parsed.settings || defaultSettings;
    if (!parsedSettings.branches || parsedSettings.branches.length === 0) {
      parsedSettings.branches = defaultBranches;
    }
    return {
      vehicles: Array.isArray(parsed.vehicles) ? parsed.vehicles : [],
      expenses: Array.isArray(parsed.expenses) ? parsed.expenses : [],
      setupItems: Array.isArray(parsed.setupItems) ? parsed.setupItems : [],
      staff: Array.isArray(parsed.staff) ? parsed.staff : defaultStaffMembers,
      services: Array.isArray(parsed.services) ? parsed.services : defaultServices,
      settings: parsedSettings,
      inventory: Array.isArray(parsed.inventory)
        ? (parsed.inventory.some((i: any) => i?.name && i.name.toLowerCase().includes('koch'))
            ? parsed.inventory
            : [defaultInventoryItems[0], ...parsed.inventory])
        : defaultInventoryItems,
      materialPurchases: Array.isArray(parsed.materialPurchases) ? parsed.materialPurchases : defaultMaterialPurchases,
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
        const settings = data.settings || defaultSettings;
        if (!settings.branches || settings.branches.length === 0) {
          settings.branches = defaultBranches;
        }
        return {
          vehicles: Array.isArray(data.vehicles) ? data.vehicles : [],
          expenses: Array.isArray(data.expenses) ? data.expenses : [],
          setupItems: Array.isArray(data.setupItems) ? data.setupItems : [],
          staff: Array.isArray(data.staff) ? data.staff : defaultStaffMembers,
          services: Array.isArray(data.services) ? data.services : defaultServices,
          settings,
          inventory: Array.isArray(data.inventory) ? data.inventory : defaultInventoryItems,
          materialPurchases: Array.isArray(data.materialPurchases) ? data.materialPurchases : defaultMaterialPurchases,
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

  const mergedVehiclesList = data.vehicles !== undefined
    ? mergeVehicles(data.vehicles, current.vehicles)
    : current.vehicles;

  const mergedExpenses = data.expenses !== undefined
    ? mergeEntitiesById(data.expenses, current.expenses)
    : current.expenses;

  const mergedSetupItems = data.setupItems !== undefined
    ? mergeEntitiesById(data.setupItems, current.setupItems)
    : current.setupItems;

  const mergedStaff = data.staff !== undefined
    ? mergeEntitiesById(data.staff, current.staff)
    : current.staff;

  const mergedServices = data.services !== undefined
    ? mergeEntitiesById(data.services, current.services)
    : current.services;

  const mergedSettings = data.settings !== undefined
    ? {
        ...current.settings,
        ...data.settings,
        branches: (data.settings.branches && data.settings.branches.length > 0)
          ? data.settings.branches
          : (current.settings.branches || defaultBranches),
      }
    : current.settings;

  const mergedInventory = data.inventory !== undefined
    ? mergeEntitiesById(data.inventory, current.inventory)
    : current.inventory;

  const mergedRoadmap = data.roadmap !== undefined
    ? mergeEntitiesById(data.roadmap, current.roadmap)
    : current.roadmap;

  const mergedCafeItems = data.cafeItems !== undefined
    ? mergeEntitiesById(data.cafeItems, current.cafeItems || defaultCafeItems)
    : (current.cafeItems || defaultCafeItems);

  const mergedZReports = data.zreports !== undefined
    ? mergeEntitiesById(data.zreports, current.zreports)
    : current.zreports;

  const mergedParking = data.parkingRecords !== undefined
    ? mergeEntitiesById(data.parkingRecords, current.parkingRecords || defaultParkingRecords)
    : (current.parkingRecords || defaultParkingRecords);

  const updated: DatabasePayload = {
    vehicles: mergedVehiclesList,
    expenses: mergedExpenses,
    setupItems: mergedSetupItems,
    staff: mergedStaff,
    services: mergedServices,
    settings: mergedSettings,
    inventory: mergedInventory,
    roadmap: mergedRoadmap,
    cafeItems: mergedCafeItems,
    zreports: mergedZReports,
    parkingRecords: mergedParking,
    lastUpdated: new Date().toISOString(),
    version: '2026-production-v1',
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
