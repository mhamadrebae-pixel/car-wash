'use client';

import React, { useState } from 'react';
import { Vehicle, AppSettings } from '@/types';
import { NfcPassCard } from './NfcPassCard';
import { PlateDisplay } from './PlateDisplay';
import {
  X,
  Printer,
  MessageCircle,
  Copy,
  Check,
  ExternalLink,
  Wifi,
  Sparkles,
  Smartphone,
  ShieldCheck,
  QrCode,
} from 'lucide-react';
import { getPortalBaseUrl, openWhatsAppChat } from '@/lib/whatsapp';

interface NfcStickerModalProps {
  vehicle: Vehicle;
  settings?: AppSettings;
  onClose: () => void;
  onNotify?: (msg: string) => void;
}

export const NfcStickerModal: React.FC<NfcStickerModalProps> = ({
  vehicle,
  settings,
  onClose,
  onNotify,
}) => {
  const [copied, setCopied] = useState(false);
  const [printFormat, setPrintFormat] = useState<'card' | 'windshield'>('windshield');

  const carWashName = settings?.carWashName || 'Royal Car Wash';
  const portalUrl = `${getPortalBaseUrl(settings)}/nfc/${vehicle.id}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(portalUrl)}&margin=1`;

  const handleCopy = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(portalUrl);
      setCopied(true);
      if (onNotify) onNotify('🔗 بەستەری پۆرتاڵی NFC کۆپی کرا!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleWhatsApp = () => {
    if (!vehicle.phone) {
      if (onNotify) onNotify('تکایە سەرەتا ژمارە مۆبایلی کڕیار تۆمار بکە!');
      return;
    }
    const msg = `سڵاو بەڕێز ${vehicle.ownerName}،\nئەمە بەستەری کارتی زیرەکی VIP و لۆیەڵتی سەیارەکەتە لە ${carWashName}:\n${portalUrl}\nدەتوانیت سەیری مێژووی شۆردنەکانت و شۆردنی دیاری (٤ + ١ بەخۆڕایی) بکەیت.`;
    openWhatsAppChat(vehicle.phone, msg);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=600,height=700');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ku">
      <head>
        <meta charset="utf-8">
        <title>ستیكەری NFC - ${vehicle.ownerName}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }
          body { background: #fff; padding: 20px; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
          .sticker {
            width: 320px;
            border: 2px dashed #0f172a;
            border-radius: 20px;
            padding: 16px;
            text-align: center;
            background: #ffffff;
          }
          .brand { font-size: 16px; font-weight: 900; color: #0f172a; margin-bottom: 2px; }
          .sub { font-size: 10px; color: #64748b; font-weight: 700; margin-bottom: 12px; }
          .qr-box {
            display: inline-block;
            padding: 8px;
            background: #fff;
            border: 1px solid #e2e8f0;
            border-radius: 14px;
            margin-bottom: 10px;
          }
          .qr-box img { width: 140px; height: 140px; display: block; }
          .plate { margin: 8px 0; font-size: 14px; font-weight: 900; }
          .car-info { font-size: 12px; font-weight: 700; color: #1e293b; margin-bottom: 4px; }
          .nfc-badge {
            display: inline-block;
            background: #0f172a;
            color: #fff;
            font-size: 10px;
            font-family: monospace;
            padding: 4px 10px;
            border-radius: 20px;
            margin-bottom: 8px;
          }
          .instructions {
            font-size: 10px;
            color: #475569;
            font-weight: 600;
            border-top: 1px solid #e2e8f0;
            padding-top: 8px;
          }
          @media print {
            body { padding: 0; }
            .sticker { border: 2px solid #000; }
          }
        </style>
      </head>
      <body>
        <div class="sticker">
          <div class="brand">${carWashName}</div>
          <div class="sub">ستیكەری فەرمی جامی پێشەوە (NFC & QR)</div>
          <div class="qr-box">
            <img src="${qrImageUrl}" alt="QR" />
          </div>
          <div class="nfc-badge">NFC TAG: ${vehicle.nfcTagId || vehicle.id}</div>
          <div class="car-info">${vehicle.carModel} • ${vehicle.color}</div>
          <div class="plate">خاوەن: ${vehicle.ownerName}</div>
          <div class="instructions">تەپ بکە بە مۆبایل یان کامێراکەت ڕابگرە بۆ بینینی کارتی لۆیەڵتی</div>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.close();
            }, 500);
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 animate-fadeIn" dir="rtl">
      <div className="bg-[#0b101d] border border-cyan-500/30 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl text-slate-100 space-y-4 relative overflow-hidden">
        {/* Glow Accents */}
        <div className="absolute -top-24 right-1/2 translate-x-1/2 w-80 h-32 bg-cyan-500/10 blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
              <Wifi className="w-4 h-4 rotate-90" />
            </div>
            <div>
              <h3 className="font-black text-sm text-white">کارتی زیرەکی NFC و ستیكەر</h3>
              <p className="text-[10px] text-slate-400">
                پۆرتاڵی VIP، ستیكەری جامی پێشەوە، و پاداشتی لۆیەڵتی
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* The Luxury 3D Card Preview */}
        <div className="py-1">
          <NfcPassCard vehicle={vehicle} settings={settings} interactive={true} />
        </div>

        {/* Action Buttons Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
          {/* 1. Print Sticker */}
          <button
            type="button"
            onClick={handlePrint}
            className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold flex flex-col items-center justify-center gap-1 shadow-md shadow-blue-600/25 transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span className="text-[11px]">چاپکردنی ستیكەر</span>
          </button>

          {/* 2. WhatsApp */}
          <button
            type="button"
            onClick={handleWhatsApp}
            className="py-2.5 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 hover:border-emerald-500 font-bold flex flex-col items-center justify-center gap-1 transition cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            <span className="text-[11px]">ناردن بە WhatsApp</span>
          </button>

          {/* 3. Copy Link */}
          <button
            type="button"
            onClick={handleCopy}
            className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 font-bold flex flex-col items-center justify-center gap-1 transition cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
            <span className="text-[11px]">{copied ? 'کۆپی کرا!' : 'کۆپیکردنی لینک'}</span>
          </button>

          {/* 4. Open in New Tab */}
          <a
            href={portalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 font-bold flex flex-col items-center justify-center gap-1 transition text-center"
          >
            <ExternalLink className="w-4 h-4 text-cyan-400" />
            <span className="text-[11px]">کردنەوەی پەڕە</span>
          </a>
        </div>

        {/* Footer info note */}
        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-1 text-slate-300 font-medium">
            <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
            پشتگیری هەموو مۆبایلەکانی iPhone و Android دەکات بە NFC یان QR.
          </span>
          <span className="font-mono text-cyan-300 font-bold">NFC Active</span>
        </div>
      </div>
    </div>
  );
};
