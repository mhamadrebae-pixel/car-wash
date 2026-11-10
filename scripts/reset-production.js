import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DB_DIR, 'carwash-db.json');

// Read existing DB to preserve services, settings, inventory, staff if already customized
let current = {};
if (fs.existsSync(DB_FILE)) {
  try {
    current = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  } catch (e) {
    current = {};
  }
}

// Clean Production Payload
const cleanDb = {
  vehicles: [],
  expenses: [],
  setupItems: [],
  staff: Array.isArray(current.staff) && current.staff.length > 0 ? current.staff : [],
  services: Array.isArray(current.services) && current.services.length > 0 ? current.services : [],
  settings: current.settings || {},
  inventory: Array.isArray(current.inventory) ? current.inventory : [],
  roadmap: Array.isArray(current.roadmap) ? current.roadmap : [],
  cafeItems: Array.isArray(current.cafeItems) ? current.cafeItems : [],
  zreports: [],
  lastUpdated: new Date().toISOString(),
  version: '2026-production-v1',
};

// If services were empty, import defaults
if (cleanDb.services.length === 0) {
  cleanDb.services = [
    {
      id: 'srv-1',
      name: 'شۆردنی ئاسایی (دەرەوە + ناوەوە)',
      category: 'سەیارە',
      unit: 'سەیارە',
      price: 10000,
      pricesBySize: { sedan: 10000, suv: 13000, truck: 15000 },
      description: 'شۆردنی تەواوی دەرەوە بە کەفی چڕ و پاککردنەوەی ناوەوە بە فڵچە و گسک',
      durationMinutes: 25,
    },
    {
      id: 'srv-2',
      name: 'شۆردنی تایبەت VIP',
      category: 'سەیارە',
      unit: 'سەیارە',
      price: 25000,
      pricesBySize: { sedan: 25000, suv: 30000, truck: 35000 },
      description: 'شۆردنی دەرەوە و ناوەوە + واکسی تایبەت + بۆندارکەری VIP + شۆردنی مەکینە بە دەرمانی ئەسڵی',
      durationMinutes: 45,
    },
    {
      id: 'srv-3',
      name: 'پۆڵیش و شەمەندانەی دەعامی و چەمەلەغ',
      category: 'پۆڵیش و نانۆ سێرامیک',
      unit: 'سەیارە',
      price: 35000,
      pricesBySize: { sedan: 35000, suv: 45000, truck: 55000 },
      description: 'لابردنی ڕووشان و پەڵە لەسەر بۆیە بە مەوادی ئەڵمانی 3M و درەوشانەوەی ئاوێنەیی',
      durationMinutes: 60,
    },
    {
      id: 'srv-4',
      name: 'شۆردنی فەرش بە مەتر دووجا (م²)',
      category: 'شۆردنی فەرش',
      unit: 'مەتر دووجا (م²)',
      price: 2000,
      description: 'شۆردنی فەرش و مافوور بە شامپۆی ئۆتۆماتیکی دژە میکرۆب و وشککردنەوەی ١٠٠٪ بە حەرارەت',
      durationMinutes: 30,
    },
    {
      id: 'srv-5',
      name: 'شۆردنی قەنەفە و تەخم مۆبیلیات بە هەڵم',
      category: 'شۆردنی قەنەفە',
      unit: 'تەخم',
      price: 35000,
      description: 'پاککردنەوە و لابردنی چەوری و پەڵەی قەنەفە بە هەڵمی گەرم و مەوادی ئیتاڵی بەبێ تێکچوونی قوماش',
      durationMinutes: 50,
    },
  ];
}

// Write to carwash-db.json
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}
fs.writeFileSync(DB_FILE, JSON.stringify(cleanDb, null, 2), 'utf-8');
console.log('✅ carwash-db.json has been reset to clean production successfully!');
