import fs from 'fs';
import path from 'path';

const now = new Date();
const todayYMD = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

function getTodayTimeISO(hours, minutes) {
  const d = new Date(now);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
}

function getPastDaysISO(daysAgo, hours, minutes) {
  const d = new Date(now);
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
}

const dbPath = path.resolve('data/carwash-db.json');
let db = {};
if (fs.existsSync(dbPath)) {
  try {
    db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  } catch (e) {
    db = {};
  }
}

// 1. Vehicles with today's completed washes & active bays
const vehicles = [
  {
    id: "v-1",
    plate: { type: "unified", provinceCode: "21", provinceName: "سلێمانی", letter: "A", number: "5500" },
    ownerName: "کاک ڕێبوار کەریم",
    phone: "07701452233",
    carModel: "Toyota Land Cruiser GXR 2023",
    color: "ڕەش",
    size: "suv",
    nfcTagId: "NFC-21A-5500",
    hasNfcSticker: true,
    customerPin: "2233",
    totalWashes: 6,
    currentCycleWashes: 1,
    freeWashesClaimed: 1,
    lastVisitDate: getTodayTimeISO(11, 40),
    registeredDate: getPastDaysISO(60, 9, 0),
    status: "active",
    // Finished earlier today
    washHistory: [
      {
        id: `w-${Date.now()}-1`,
        date: getTodayTimeISO(11, 40),
        serviceId: "srv-2",
        serviceName: "شۆردنی تەواو VIP",
        price: 30000,
        isFree: false,
        vehicleSize: "suv",
        staffId: "staff-1",
        staffName: "وەستا ڕێبوار عەلی",
        bayNumber: 1,
        paymentMethod: "cash",
        paymentStatus: "paid"
      },
      {
        id: `w-${Date.now()}-1b`,
        date: getPastDaysISO(4, 14, 0),
        serviceId: "srv-1",
        serviceName: "شۆردنی ئاسایی",
        price: 13000,
        isFree: false,
        vehicleSize: "suv",
        staffName: "وەستا کاروان فەتاح",
        bayNumber: 2,
        paymentMethod: "cash",
        paymentStatus: "paid"
      }
    ]
  },
  {
    id: "v-2",
    plate: { type: "unified", provinceCode: "22", provinceName: "هەولێر", letter: "B", number: "1234" },
    ownerName: "د. ئارام بەختیار",
    phone: "07504218899",
    carModel: "BMW 530i M-Sport 2022",
    color: "سپی سەدەفی",
    size: "sedan",
    nfcTagId: "NFC-22B-1234",
    hasNfcSticker: true,
    customerPin: "8899",
    totalWashes: 8,
    currentCycleWashes: 3,
    freeWashesClaimed: 1,
    lastVisitDate: getTodayTimeISO(12, 10),
    registeredDate: getPastDaysISO(90, 10, 0),
    status: "active",
    // Currently Active in Bay 1!
    currentBay: 1,
    bayEntryTime: getTodayTimeISO(12, 10),
    washStage: "کەفڕێژکردن",
    assignedWorkerId: "staff-1",
    assignedWorkerName: "وەستا ڕێبوار عەلی",
    washHistory: [
      {
        id: `w-${Date.now()}-2`,
        date: getTodayTimeISO(9, 15),
        serviceId: "srv-1",
        serviceName: "شۆردنی ئاسایی (دەرەوە + ناوەوە)",
        price: 10000,
        isFree: false,
        vehicleSize: "sedan",
        staffId: "staff-2",
        staffName: "وەستا کاروان فەتاح",
        bayNumber: 1,
        paymentMethod: "fastpay",
        paymentStatus: "paid"
      },
      {
        id: `w-${Date.now()}-2b`,
        date: getPastDaysISO(3, 10, 0),
        serviceId: "srv-1",
        serviceName: "شۆردنی ئاسایی",
        price: 10000,
        isFree: false,
        vehicleSize: "sedan",
        staffName: "وەستا ڕێبوار عەلی",
        paymentMethod: "cash",
        paymentStatus: "paid"
      }
    ]
  },
  {
    id: "v-3",
    plate: { type: "unified", provinceCode: "24", provinceName: "دهۆک", letter: "H", number: "7788" },
    ownerName: "هەڵگورد ناسیح",
    phone: "07513324455",
    carModel: "Kia Sportage 2024",
    color: "خۆڵەمێشی",
    size: "suv",
    nfcTagId: "NFC-24H-7788",
    hasNfcSticker: true,
    totalWashes: 4,
    currentCycleWashes: 4,
    freeWashesClaimed: 0,
    lastVisitDate: getTodayTimeISO(10, 30),
    registeredDate: getPastDaysISO(30, 8, 0),
    status: "active",
    // Currently in Queue
    washHistory: [
      {
        id: `w-${Date.now()}-3`,
        date: getTodayTimeISO(10, 30),
        serviceId: "srv-1",
        serviceName: "شۆردنی ئاسایی (دەرەوە + ناوەوە)",
        price: 13000,
        isFree: false,
        vehicleSize: "suv",
        staffId: "staff-3",
        staffName: "وەستا هەڵمەت محەمەد",
        bayNumber: 2,
        paymentMethod: "cash",
        paymentStatus: "paid"
      }
    ]
  },
  {
    id: "v-4",
    plate: { type: "old", oldCityName: "سلێمانی", oldCategory: "تایبەت", oldNumber: "88990" },
    ownerName: "کاک سامان عەزیز",
    phone: "07709988776",
    carModel: "Hyundai Tucson 2021",
    color: "مارۆنی",
    size: "suv",
    nfcTagId: "NFC-SLM-88990",
    hasNfcSticker: true,
    totalWashes: 9,
    currentCycleWashes: 0,
    freeWashesClaimed: 2,
    lastVisitDate: getTodayTimeISO(12, 18),
    registeredDate: getPastDaysISO(120, 9, 0),
    status: "active",
    // Currently Active in Bay 2!
    currentBay: 2,
    bayEntryTime: getTodayTimeISO(12, 18),
    washStage: "وشککردنەوە و پۆلیش",
    assignedWorkerId: "staff-2",
    assignedWorkerName: "وەستا کاروان فەتاح",
    washHistory: [
      {
        id: `w-${Date.now()}-4`,
        date: getTodayTimeISO(10, 0),
        serviceId: "srv-2",
        serviceName: "شۆردنی تەواو VIP",
        price: 30000,
        isFree: false,
        vehicleSize: "suv",
        staffId: "staff-2",
        staffName: "وەستا کاروان فەتاح",
        bayNumber: 2,
        paymentMethod: "fib",
        paymentStatus: "paid"
      }
    ]
  },
  {
    id: "v-5",
    plate: { type: "unified", provinceCode: "21", provinceName: "سلێمانی", letter: "M", number: "4411" },
    ownerName: "ئەندازیار بەڵێن",
    phone: "07714567890",
    carModel: "Mercedes-Benz E300 2023",
    color: "ڕەش ماتی",
    size: "sedan",
    nfcTagId: "NFC-21M-4411",
    hasNfcSticker: true,
    totalWashes: 5,
    currentCycleWashes: 0,
    freeWashesClaimed: 1,
    lastVisitDate: getTodayTimeISO(9, 45),
    registeredDate: getPastDaysISO(45, 10, 0),
    status: "active",
    washHistory: [
      {
        id: `w-${Date.now()}-5`,
        date: getTodayTimeISO(9, 45),
        serviceId: "srv-1",
        serviceName: "شۆردنی ئاسایی (دەرەوە + ناوەوە)",
        price: 0,
        isFree: true,
        freeReason: "loyalty",
        vehicleSize: "sedan",
        staffId: "staff-1",
        staffName: "وەستا ڕێبوار عەلی",
        bayNumber: 1,
        paymentMethod: "cash",
        paymentStatus: "paid"
      }
    ]
  },
  {
    id: "v-6",
    plate: { type: "unified", provinceCode: "22", provinceName: "هەولێر", letter: "L", number: "3300" },
    ownerName: "مامۆستا دلێر کەمال",
    phone: "07501122334",
    carModel: "Toyota Hilux Pickup 2024",
    color: "سپی",
    size: "truck",
    nfcTagId: "NFC-22L-3300",
    hasNfcSticker: true,
    totalWashes: 3,
    currentCycleWashes: 3,
    freeWashesClaimed: 0,
    lastVisitDate: getTodayTimeISO(8, 45),
    registeredDate: getPastDaysISO(20, 8, 0),
    status: "active",
    washHistory: [
      {
        id: `w-${Date.now()}-6`,
        date: getTodayTimeISO(8, 45),
        serviceId: "srv-1",
        serviceName: "شۆردنی ئاسایی پیکاب",
        price: 15000,
        isFree: false,
        vehicleSize: "truck",
        staffId: "staff-3",
        staffName: "وەستا هەڵمەت محەمەد",
        bayNumber: 3,
        paymentMethod: "cash",
        paymentStatus: "paid"
      }
    ]
  },
  {
    id: "v-7",
    plate: { type: "unified", provinceCode: "21", provinceName: "سلێمانی", letter: "C", number: "9090" },
    ownerName: "کاک پێشەوا عومەر",
    phone: "07705544332",
    carModel: "Chevrolet Tahoe 2022",
    color: "ڕەساسی",
    size: "suv",
    nfcTagId: "NFC-21C-9090",
    hasNfcSticker: true,
    totalWashes: 7,
    currentCycleWashes: 2,
    freeWashesClaimed: 1,
    lastVisitDate: getTodayTimeISO(11, 10),
    registeredDate: getPastDaysISO(75, 11, 0),
    status: "active",
    washHistory: [
      {
        id: `w-${Date.now()}-7`,
        date: getTodayTimeISO(11, 10),
        serviceId: "srv-polish-1",
        serviceName: "شۆردن و پۆلیشی سەرتاسەری",
        price: 45000,
        isFree: false,
        vehicleSize: "suv",
        staffId: "staff-1",
        staffName: "وەستا ڕێبوار عەلی",
        bayNumber: 3,
        paymentMethod: "cash",
        paymentStatus: "paid"
      }
    ]
  },
  {
    id: "v-8",
    plate: { type: "old", oldCityName: "هەولێر", oldCategory: "تایبەت", oldNumber: "55432" },
    ownerName: "کاک زانا نەجمەدین",
    phone: "07507788990",
    carModel: "Nissan Patrol Platinum 2020",
    color: "سپی بەفری",
    size: "suv",
    nfcTagId: "NFC-ERB-55432",
    hasNfcSticker: true,
    totalWashes: 4,
    currentCycleWashes: 4,
    freeWashesClaimed: 0,
    lastVisitDate: getTodayTimeISO(12, 0),
    registeredDate: getPastDaysISO(50, 10, 0),
    status: "active",
    washHistory: [
      {
        id: `w-${Date.now()}-8`,
        date: getTodayTimeISO(12, 0),
        serviceId: "srv-2",
        serviceName: "شۆردنی تەواو VIP",
        price: 30000,
        isFree: false,
        vehicleSize: "suv",
        staffId: "staff-2",
        staffName: "وەستا کاروان فەتاح",
        bayNumber: 1,
        paymentMethod: "debt",
        paymentStatus: "unpaid",
        debtNote: "پارەکەی ئێوارە دەهێنێت"
      }
    ]
  }
];

// Add the other dummy vehicles if any
if (Array.isArray(db.vehicles)) {
  const existingOther = db.vehicles.filter(v => !vehicles.some(nv => nv.id === v.id));
  vehicles.push(...existingOther);
}

// 2. Today's Expenses
const expenses = [
  {
    id: `exp-${todayYMD}-1`,
    title: "نانی نیوەڕۆی ستاف و وەستاکان",
    category: "پێداویستی و خۆراک",
    amount: 15000,
    date: todayYMD,
    recordedBy: "کاشێر",
    notes: "کەباب و دۆ"
  },
  {
    id: `exp-${todayYMD}-2`,
    title: "بەنزینی مۆلیدەی کارەبا",
    category: "کارەبا و مۆلیدە",
    amount: 12000,
    date: todayYMD,
    recordedBy: "کاشێر",
    notes: "١٥ لیتر بەنزین"
  },
  ...(Array.isArray(db.expenses) ? db.expenses.filter(e => !e.date.startsWith(todayYMD)) : [])
];

db.vehicles = vehicles;
db.expenses = expenses;

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
console.log('Successfully updated carwash-db.json with fresh live data for today:', todayYMD);
console.log('Vehicles count:', vehicles.length);
console.log('Active bays: Bay 1 (v-2), Bay 2 (v-4)');
