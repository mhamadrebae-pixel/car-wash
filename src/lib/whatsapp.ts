import { Vehicle, ServiceItem, AppSettings } from '@/types';
import { formatIQD, normalizeDigits } from './storage';

// Clean Iraqi phone numbers to international standard 964...
export function cleanIraqiPhoneNumber(phone: string): string {
  if (!phone) return '';
  // Normalize Kurdish/Arabic digits first
  const normalized = normalizeDigits(phone);
  // Remove spaces, dashes, parentheses, plus
  let cleaned = normalized.replace(/[\s\-\(\)\+]/g, '');

  // If starts with 07... (e.g. 07701234567) -> 9647701234567
  if (cleaned.startsWith('07')) {
    cleaned = '964' + cleaned.substring(1);
  } else if (cleaned.startsWith('7')) {
    cleaned = '964' + cleaned;
  }

  return cleaned;
}

// Helper to get dynamic customer portal base URL
export function getPortalBaseUrl(settings?: AppSettings): string {
  if (settings?.systemUrl && settings.systemUrl.trim().length > 0) {
    return settings.systemUrl.trim().replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin;
  }
  return 'http://localhost:3000';
}

// Generate Wash Completion Message
export function generateWashCompletionMessage(
  vehicle: Vehicle,
  service: ServiceItem,
  isFree: boolean,
  settings: AppSettings,
  chargedPrice?: number,
  paymentMethod?: string
): string {
  const plateText =
    vehicle.plate.type === 'unified'
      ? `${vehicle.plate.provinceCode} | ${vehicle.plate.letter} ${vehicle.plate.number} (${vehicle.plate.provinceName})`
      : `${vehicle.plate.oldCityName} / ${vehicle.plate.oldNumber}`;

  const targetWashes = settings.washesNeededForFree || 4;
  const current = vehicle.currentCycleWashes || 0;
  const filled = Math.min(Math.max(0, current), targetWashes);
  const empty = Math.max(0, targetWashes - filled);
  const visualMeter = '🟩'.repeat(filled) + '⬜'.repeat(empty);

  let loyaltyText = '';
  if (isFree) {
    loyaltyText = `🎉 *پیرۆزە! ئەم شۆردنەت ١٠٠٪ بەخۆڕایی بوو (FREE)*\n[${visualMeter}] خولێکی نوێ بۆ سەیارەکەت دەستی پێکرد.`;
  } else {
    const left = Math.max(0, targetWashes - current);
    loyaltyText =
      left === 0
        ? `✨ *ئاگاداری دڵخۆشکەر:* [${visualMeter}]\nشۆردنی داهاتووت بەخۆڕاییە (FREE 🎁)!`
        : `🔹 لۆیەڵتی سەیارەکەت: [${visualMeter}] *${current}* لە ${targetWashes}\nتەنها *${left}* شۆردنی ترت ماوە بۆ شۆردنی بێبەرامبەر!`;
  }

  const portalUrl = `${getPortalBaseUrl(settings)}/nfc/${vehicle.id}`;
  const actualPrice = chargedPrice !== undefined ? chargedPrice : service.price;

  let paymentLabel = 'نەقد (کاش)';
  if (paymentMethod === 'fastpay') paymentLabel = 'FastPay 📱';
  else if (paymentMethod === 'fib') paymentLabel = 'FIB بانکی 🏦';
  else if (paymentMethod === 'debt') paymentLabel = 'قەرز (ماوەتەوە) ⚠️';

  return `سڵاو بەڕێز ${vehicle.ownerName} 🌸

سوپاس بۆ سەردانیکردنی *${settings.carWashName}*! ئۆتۆمبێلەکەت شۆردرا و ئامادەیە بۆ وەرگرتنەوە 🚗✨

📋 *وردەکاری پسوولەی دیجیتاڵی:*
• ئۆتۆمبێل: ${vehicle.carModel} (${vehicle.color})
• تابلۆ: ${plateText}
• خزمەتگوزاری: ${service.name}
• بڕی پارە: ${isFree ? '0 دینار (بێبەرامبەر - Free)' : formatIQD(actualPrice)}
• شێوازی پارەدان: ${isFree ? '🎁 پاداشتی لۆیەڵتی' : paymentLabel}

🎁 *کارت و خاڵەکانی لۆیەڵتی:*
${loyaltyText}
• کۆی گشتی سەردانەکانت: ${vehicle.totalWashes} جار

🔗 *بینینی کارتی VIP و مێژووی شۆردن لە مۆبایلت:*
${portalUrl}

📞 پەیوەندی: ${settings.carWashPhone}
📍 ناونیشان: ${settings.carWashAddress}
پاکوخاوێنی ئۆتۆمبێلەکەت شانازی ئێمەیە!`;
}

// Generate 15-day Inactivity Reminder Message
export function generateInactivityReminderMessage(
  vehicle: Vehicle,
  settings: AppSettings,
  daysPassed: number
): string {
  const plateText =
    vehicle.plate.type === 'unified'
      ? `${vehicle.plate.provinceCode} | ${vehicle.plate.letter} ${vehicle.plate.number}`
      : `${vehicle.plate.oldCityName} / ${vehicle.plate.oldNumber}`;

  const portalUrl = `${getPortalBaseUrl(settings)}/nfc/${vehicle.id}`;

  return `سڵاو کاک ${vehicle.ownerName}ی بەڕێز 🌸

ماوەیەکە لە *${settings.carWashName}* دیار نیت! زیاتر لە *${daysPassed} ڕۆژە* سەردانت نەکردووین 🚗

ئۆتۆمبێلە جوانەکەت (${vehicle.carModel} - ${plateText}) پێویستی بە شۆردن و درەوشاندنەوە هەیە!

🎁 *پاداشتەکەت لای ئێمە پارێزراوە:*
تۆ *${vehicle.currentCycleWashes}* شۆردنت لای ئێمە تۆمارە، دەتوانیت لە سەردانی داهاتوودا بەردەوام بیت بەرەو شۆردنی بێبەرامبەر!

🔗 *پۆرتاڵی سەیارەکەت بۆ بینینی خاڵەکانت:*
${portalUrl}

سەردانمان بکەوە، بە خۆشحاڵییەوە لە خزمەتتدا دەبین ✨
📞 پەیوەندی: ${settings.carWashPhone}
📍 ناونیشان: ${settings.carWashAddress}`;
}

// Generate Car Ready for Pickup Message
export function generateCarReadyMessage(
  vehicle: Vehicle,
  settings: AppSettings,
  bayNumber?: number
): string {
  const plateText =
    vehicle.plate.type === 'unified'
      ? `${vehicle.plate.provinceCode} | ${vehicle.plate.letter} ${vehicle.plate.number}`
      : `${vehicle.plate.oldCityName} / ${vehicle.plate.oldNumber}`;

  return `سڵاو بەڕێز ${vehicle.ownerName || 'کڕیاری بەڕێز'} 🌸

ئۆتۆمبێلە جوانەکەت (${vehicle.carModel} - ${plateText}) لە *${settings.carWashName}*${
    bayNumber ? ` لە هۆڵی ${bayNumber}` : ''
  } شۆردنی بە سەرکەوتوویی تەواو بوو و پاک و بریقەدار ئامادەیە بۆ وەرگرتنەوە! 🚗✨

سوپاس بۆ متمانەت بە ئێمە، بەخۆشحاڵییەوە چاوەڕێتانین.
📞 پەیوەندی: ${settings.carWashPhone}`;
}

// Open WhatsApp Web or App directly with prefilled text
export function openWhatsAppChat(phone: string, message: string): void {
  const cleaned = cleanIraqiPhoneNumber(phone);
  if (!cleaned) {
    alert('ژمارەی مۆبایل بە دروستی تۆمار نەکراوە!');
    return;
  }
  const encoded = encodeURIComponent(message);
  const url = `https://wa.me/${cleaned}?text=${encoded}`;
  window.open(url, '_blank');
}
