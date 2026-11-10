'use client';

import React, { useState } from 'react';
import { Vehicle, AppSettings } from '@/types';
import { PlateDisplay } from './PlateDisplay';
import {
  Wifi,
  Sparkles,
  QrCode,
  RotateCw,
  Car,
  Gift,
  ShieldCheck,
  Check,
  Smartphone,
  ExternalLink,
} from 'lucide-react';
import { getPortalBaseUrl } from '@/lib/whatsapp';

// Realistic Golden EMV Smart Chip Graphic
function EmvChipSvg() {
  return (
    <svg className="w-11 h-9 rounded-md shadow-inner" viewBox="0 0 44 36" fill="none">
      <rect width="44" height="36" rx="5" fill="url(#chipGold)" stroke="#CA8A04" strokeWidth="1" />
      {/* Circuit lines */}
      <path d="M0 12 H16 V24 H0" stroke="#854D0E" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M44 12 H28 V24 H44" stroke="#854D0E" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M16 18 H28" stroke="#854D0E" strokeWidth="1.2" />
      <path d="M22 0 V12" stroke="#854D0E" strokeWidth="1.2" />
      <path d="M22 24 V36" stroke="#854D0E" strokeWidth="1.2" />
      <rect x="17" y="13" width="10" height="10" rx="2" fill="#EAB308" stroke="#A16207" strokeWidth="0.8" />
      <defs>
        <linearGradient id="chipGold" x1="0" y1="0" x2="44" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FACC15" />
          <stop offset="0.5" stopColor="#EAB308" />
          <stop offset="1" stopColor="#CA8A04" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// Contactless NFC Waves Graphic
function ContactlessWaveSvg({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M8.5 16.5a6 6 0 0 1 0-9" opacity="0.6" />
      <path d="M12 19a10 10 0 0 1 0-14" opacity="0.85" />
      <path d="M15.5 21.5a14 14 0 0 1 0-19" />
    </svg>
  );
}

interface NfcPassCardProps {
  vehicle: Vehicle;
  settings?: AppSettings;
  className?: string;
  showFlipButton?: boolean;
  interactive?: boolean;
}

export const NfcPassCard: React.FC<NfcPassCardProps> = ({
  vehicle,
  settings,
  className = '',
  showFlipButton = true,
  interactive = true,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const carWashName = settings?.carWashName || 'Royal Car Wash';
  const portalUrl = `${getPortalBaseUrl(settings)}/nfc/${vehicle.id}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(portalUrl)}&margin=1`;

  const isNextFree = (vehicle.currentCycleWashes || 0) >= (settings?.washesNeededForFree || 4);
  const completedWashes = vehicle.currentCycleWashes || 0;
  const neededWashes = settings?.washesNeededForFree || 4;

  return (
    <div className={`relative select-none perspective-1000 ${className}`}>
      {/* 3D Perspective Card Container */}
      <div
        className={`relative w-full max-w-[420px] mx-auto aspect-[1.586/1] rounded-[24px] transition-transform duration-700 transform-style-3d shadow-2xl cursor-pointer ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
        onClick={() => {
          if (interactive) setIsFlipped(!isFlipped);
        }}
      >
        {/* ============================================================== */}
        {/* FRONT SIDE: LUXURY METALLIC VIP NFC MEMBERSHIP PASS            */}
        {/* ============================================================== */}
        <div
          className={`absolute inset-0 w-full h-full rounded-[24px] p-5 sm:p-6 overflow-hidden backface-hidden flex flex-col justify-between border border-cyan-400/30 bg-gradient-to-br from-[#0a0f1d] via-[#10182b] to-[#060913] text-white shadow-[0_20px_50px_rgba(8,15,35,0.85),0_0_20px_rgba(59,130,246,0.15)] group ${
            isFlipped ? 'pointer-events-none' : ''
          }`}
        >
          {/* Subtle Dynamic Metallic Sheen / Iridescent Foil Overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-blue-500/[0.08] to-purple-500/[0.08] pointer-events-none" />
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

          {/* Micro Grid Watermark Pattern */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
              backgroundSize: '16px 16px',
            }}
          />

          {/* 1. TOP ROW: Brand Emblem, VIP Pass Pill & NFC Waves */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-md shadow-blue-500/25 border border-blue-400/40">
                <Car className="w-4 h-4" />
              </div>
              <div className="text-right">
                <span className="font-black text-xs tracking-tight text-slate-100 block drop-shadow-sm">
                  {carWashName}
                </span>
                <span className="text-[9px] font-mono tracking-widest text-cyan-400 font-bold block uppercase">
                  VIP NFC SMART PASS
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Contactless waves symbol */}
              <div className="text-cyan-400/80 hover:text-cyan-300 transition-colors" title="NFC Contactless">
                <ContactlessWaveSvg className="w-5 h-5 rotate-90" />
              </div>

              {/* Status pill */}
              <div
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1 border shadow-xs ${
                  isNextFree
                    ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-400/40 animate-pulse'
                    : 'bg-gradient-to-r from-amber-500/15 to-yellow-500/10 text-amber-300 border-amber-400/30'
                }`}
              >
                <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                <span>{isNextFree ? 'FREE 0 IQD' : 'لۆیەڵتی ٤ + ١'}</span>
              </div>
            </div>
          </div>

          {/* 2. MIDDLE ROW: EMV Chip + Vehicle License Plate Display */}
          <div className="relative z-10 my-auto py-1 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <EmvChipSvg />
              <div className="hidden sm:block text-right">
                <span className="text-[9px] text-slate-400 font-mono block">NFC CHIP ID</span>
                <span className="text-[11px] font-mono font-bold text-slate-200 tracking-wider">
                  {vehicle.nfcTagId || `NFC-${vehicle.id.slice(0, 6)}`}
                </span>
              </div>
            </div>

            {/* Recessed Chrome Bezel Plate Container */}
            <div className="p-1 rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-md">
              <PlateDisplay plate={vehicle.plate} size="sm" />
            </div>
          </div>

          {/* 3. BOTTOM ROW: Customer Name, Car Model & Loyalty Mini Progress */}
          <div className="relative z-10 flex items-end justify-between border-t border-slate-800/80 pt-2.5">
            <div className="text-right">
              <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-semibold">
                خاوەنی کارتی ڤی ئای پی
              </span>
              <strong className="text-sm font-black text-white tracking-tight block">
                {vehicle.ownerName || 'کڕیاری بەڕێز'}
              </strong>
              <span className="text-[10px] text-slate-300 font-medium">
                {vehicle.carModel} • <span className="text-slate-400">{vehicle.color}</span>
              </span>
            </div>

            {/* Loyalty Tokens Progress */}
            <div className="text-left flex flex-col items-end gap-1">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4].map((step) => {
                  const done = completedWashes >= step;
                  return (
                    <div
                      key={step}
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold border transition-all ${
                        done
                          ? 'bg-gradient-to-tr from-blue-500 to-cyan-400 text-slate-950 border-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.5)]'
                          : 'bg-slate-900/90 text-slate-500 border-slate-700'
                      }`}
                    >
                      {done ? '✓' : step}
                    </div>
                  );
                })}
                {/* 5th Gift Wash */}
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] border transition-all ${
                    isNextFree
                      ? 'bg-gradient-to-tr from-emerald-400 to-teal-300 text-slate-950 border-emerald-200 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]'
                      : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  }`}
                  title="شۆردنی بەخۆڕایی"
                >
                  🎁
                </div>
              </div>

              <span className="text-[9px] font-mono text-cyan-300/90 font-bold">
                {completedWashes} / {neededWashes} شۆردن
              </span>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* BACK SIDE: QR CODE + WINDSHIELD STICKER FORMAT                 */}
        {/* ============================================================== */}
        <div
          className={`absolute inset-0 w-full h-full rounded-[24px] p-5 sm:p-6 overflow-hidden backface-hidden rotate-y-180 flex flex-col justify-between border border-cyan-400/30 bg-gradient-to-br from-[#060913] via-[#0d1526] to-[#080e1c] text-white shadow-2xl ${
            !isFlipped ? 'pointer-events-none' : ''
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
              <QrCode className="w-4 h-4 text-cyan-400" />
              <span>ستیكەری فەرمی جامی پێشەوە (NFC & QR)</span>
            </div>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-500/30">
              TAP OR SCAN
            </span>
          </div>

          {/* Center QR Code + Scan Instructions */}
          <div className="my-auto py-1 flex items-center justify-center gap-4 sm:gap-6">
            <div className="p-2 bg-white rounded-2xl shadow-xl shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrImageUrl}
                alt={`QR Code for ${vehicle.ownerName}`}
                className="w-20 h-20 sm:w-24 sm:h-24 object-contain rounded-lg"
              />
            </div>

            <div className="text-right space-y-1 max-w-[200px]">
              <div className="inline-flex items-center gap-1 text-[11px] font-black text-amber-300">
                <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                <span>تەپ بکە یان سکانی بکە</span>
              </div>
              <p className="text-[10px] text-slate-300 leading-tight">
                مۆبایلەکەت لەم ستیكەرە نزیک بکەرەوە بۆ بینینی خاڵەکانی لۆیەڵتی و کاتی شۆردن.
              </p>
              <div className="text-[9px] font-mono text-slate-400 truncate pt-1">
                {portalUrl.replace(/^https?:\/\//, '')}
              </div>
            </div>
          </div>

          {/* Footer of Back Card */}
          <div className="flex items-center justify-between border-t border-slate-800/80 pt-2 text-[10px] text-slate-400">
            <span className="flex items-center gap-1 text-slate-300 font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              {carWashName}
            </span>
            <span className="font-mono text-cyan-400">NFC Pass #{vehicle.id}</span>
          </div>
        </div>
      </div>

      {/* Floating Flip Hint Button */}
      {showFlipButton && (
        <div className="flex justify-center mt-3">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsFlipped(!isFlipped);
            }}
            className="px-3.5 py-1 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-[11px] font-bold text-slate-300 hover:text-white transition flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <RotateCw className="w-3 h-3 text-cyan-400" />
            <span>{isFlipped ? 'پیشاندانی پێشەوەی کارت' : 'پیشاندانی ستیكەر و QR کۆد'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
