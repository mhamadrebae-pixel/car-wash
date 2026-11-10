import { DailyZReport, AppSettings } from '@/types';
import { formatIQD } from './storage';

/**
 * Send an HTML-formatted message to Telegram using Bot API
 */
export async function sendTelegramMessage(
  token: string,
  chatId: string,
  htmlText: string
): Promise<{ success: boolean; message?: string }> {
  if (!token || !chatId) {
    return { success: false, message: 'تۆکن یان چات ئایدی دیاری نەکراوە.' };
  }

  try {
    const url = `https://api.telegram.org/bot${token.trim()}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId.trim(),
        text: htmlText,
        parse_mode: 'HTML',
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.ok) {
      return {
        success: false,
        message: data.description || 'هەڵە لە ناردنی پەیام بۆ تێلێگرام',
      };
    }

    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'کێشەی پەیوەندی بە تێلێگرامەوە ڕوویدا',
    };
  }
}

/**
 * Format a daily Z-report into a clean, luxury Kurdish Telegram notification
 */
export function formatDailyZReportTelegram(
  report: DailyZReport,
  settings: AppSettings
): string {
  const timestamp = new Date(report.closedAt || Date.now());
  const formattedTime = timestamp.toLocaleTimeString('ku', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const lines = [
    `📊 <b>ڕاپۆرتی ڕۆژانەی Z - ${settings.carWashName}</b>`,
    `📅 بەروار: <code>${report.date}</code> (کات: ${formattedTime})`,
    `👤 کاشێر / لێپرسراو: <b>${report.closedBy || 'کاشێر'}</b>`,
    `━━━━━━━━━━━━━━━━━━━`,
    `🚗 <b>شۆردن و سەیارەکان:</b>`,
    `• کۆی گشتی سەیارە: <b>${report.totalCars}</b> دانە`,
    `• شۆردنی بێبەرامبەر (Free): <b>${report.freeWashesCount || 0}</b> دانە`,
    ``,
    `💰 <b>داهات و شێوازەکانی وەرگرتن:</b>`,
    `• پارەی نەقد (Cash): <b>${formatIQD(report.cashTotal)}</b>`,
    `• فاست پەی (FastPay): <b>${formatIQD(report.fastpayTotal)}</b>`,
    `• بانکی FIB: <b>${formatIQD(report.fibTotal)}</b>`,
    `• کۆی گشتی داهات: <b>${formatIQD(report.totalRevenue)}</b>`,
    ``,
    `🏦 <b>حساباتی سندوق و قەرزەکان:</b>`,
    `• قەرزی نوێی ئەمڕۆ: <b>${formatIQD(report.newDebtTotal || report.debtTotal || 0)}</b>`,
    `• قەرزی وەرگیراوەی ئەمڕۆ: <b>${formatIQD(report.recoveredDebtTotal || 0)}</b>`,
    `• نەقدی ژمێردراوی سندوق: <b>${formatIQD(report.actualCashCounted)}</b>`,
  ];

  if (report.discrepancy !== 0) {
    const diffText =
      report.discrepancy > 0
        ? `زیادە (+${formatIQD(report.discrepancy)})`
        : `کورتهێنان (${formatIQD(report.discrepancy)})`;
    lines.push(`⚠️ جیاوازی سندوق: <b>${diffText}</b>`);
  }

  lines.push(`━━━━━━━━━━━━━━━━━━━`);
  lines.push(`💼 <b>پاداشتی وەستاکان:</b> <b>${formatIQD(report.workerCommissionsTotal)}</b>`);

  if (report.notes) {
    lines.push(`📝 تێبینی: <i>${report.notes}</i>`);
  }

  lines.push(``);
  lines.push(`📍 <i>${settings.carWashAddress}</i>`);
  lines.push(`📱 سیستەمی چاودێری زیرەکی غەسل`);

  return lines.join('\n');
}
