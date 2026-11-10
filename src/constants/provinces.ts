export interface ProvinceInfo {
  code: string;
  nameKu: string;
  nameAr: string;
  region: 'Kurdistan' | 'Federal';
}

export const OFFICIAL_PROVINCES: ProvinceInfo[] = [
  // هەرێمی کوردستان (IRQ - KR)
  { code: '21', nameKu: 'سلێمانی', nameAr: 'السليمانية', region: 'Kurdistan' },
  { code: '22', nameKu: 'هەولێر', nameAr: 'أربيل', region: 'Kurdistan' },
  { code: '23', nameKu: 'هەڵەبجە', nameAr: 'حلبجة', region: 'Kurdistan' },
  { code: '24', nameKu: 'دهۆک', nameAr: 'دهوك', region: 'Kurdistan' },
  { code: '25', nameKu: 'کەرکووک', nameAr: 'كركوك', region: 'Kurdistan' },

  // عێراق (IRAQ)
  { code: '11', nameKu: 'بەغداد', nameAr: 'بغداد', region: 'Federal' },
  { code: '12', nameKu: 'نەینەوا', nameAr: 'نينوى', region: 'Federal' },
  { code: '13', nameKu: 'میسان', nameAr: 'ميسان', region: 'Federal' },
  { code: '14', nameKu: 'بەسرە', nameAr: 'البصرة', region: 'Federal' },
  { code: '15', nameKu: 'ئەنبار', nameAr: 'الأنبار', region: 'Federal' },
  { code: '16', nameKu: 'قادسیە', nameAr: 'القادسية', region: 'Federal' },
  { code: '17', nameKu: 'موسەننا', nameAr: 'المثنى', region: 'Federal' },
  { code: '18', nameKu: 'بابل', nameAr: 'بابل', region: 'Federal' },
  { code: '19', nameKu: 'کەربەلا', nameAr: 'كربلاء', region: 'Federal' },
  { code: '20', nameKu: 'دیالە', nameAr: 'ديالى', region: 'Federal' },
  { code: '26', nameKu: 'سەڵاحەدین', nameAr: 'صلاح الدين', region: 'Federal' },
  { code: '27', nameKu: 'زی قار', nameAr: 'ذي قار', region: 'Federal' },
  { code: '28', nameKu: 'نەجەف', nameAr: 'النجف', region: 'Federal' },
  { code: '29', nameKu: 'واست', nameAr: 'واسط', region: 'Federal' },
];

export const OLD_PLATE_CITIES = [
  'هەولێر',
  'سلێمانی',
  'دهۆک',
  'کەرکووک',
  'هەڵەبجە',
  'بەغداد',
  'موسڵ',
  'بەسرە',
  'شارەکانی تر',
];

export const OLD_PLATE_CATEGORIES = [
  'تایبەت',
  'کرێ',
  'بارهەڵگر',
  'کشتوکاڵی',
  'بیناسازی',
  'ماتۆڕسکیل',
  'حکومی',
];

// Official Latin letters and Government series according to KRG / Iraqi Traffic Gazette
export const UNIFIED_PLATE_LETTERS = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M',
  'N', 'P', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
  'MI', 'MF', 'MH', 'ME', 'PR', 'CM', 'PA',
];
