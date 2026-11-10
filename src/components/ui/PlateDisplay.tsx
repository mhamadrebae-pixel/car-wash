'use client';

import React from 'react';
import { LicensePlate } from '@/types';
import { OFFICIAL_PROVINCES } from '@/constants/provinces';

interface PlateDisplayProps {
  plate: LicensePlate;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCityBadge?: boolean;
  className?: string;
}

export const PlateDisplay: React.FC<PlateDisplayProps> = ({
  plate,
  size = 'md',
  showCityBadge = false,
  className = '',
}) => {
  const isUnified = plate.type === 'unified';

  const provinceName = isUnified
    ? plate.provinceName ||
      OFFICIAL_PROVINCES.find((p) => p.code === plate.provinceCode)?.nameKu ||
      'کوردستان'
    : plate.oldCityName || 'هەولێر';

  // Sizing definitions precisely matching the official Iraqi / Kurdistan unified plate standard (Images 1 & 2)
  const sizeStyles = {
    sm: {
      container: 'h-8 rounded-[6px] border-[1.5px] border-black',
      leftBox: 'w-6 py-0.5 border-r-[1.5px] border-black',
      irqText: 'text-[6px] tracking-tight leading-[1.05]',
      krText: 'text-[6.5px] leading-none',
      code: 'text-sm',
      seal: 'w-2.5 h-2.5 rounded-[1.5px]',
      sealCore: 'w-1.5 h-1.5',
      letter: 'text-sm',
      spacer: 'w-1.5',
      number: 'text-sm',
      contentPad: 'px-2 gap-1.5',
      cityBadge: 'text-[10px] px-1.5 py-0.5',
    },
    md: {
      container: 'h-11 rounded-[8px] border-2 border-black shadow-xs',
      leftBox: 'w-8 py-1 border-r-2 border-black',
      irqText: 'text-[8.5px] tracking-tight leading-[1.05]',
      krText: 'text-[9.5px] leading-none',
      code: 'text-xl',
      seal: 'w-3.5 h-3.5 rounded-[2.5px]',
      sealCore: 'w-2 h-2',
      letter: 'text-xl',
      spacer: 'w-2.5',
      number: 'text-xl',
      contentPad: 'px-3 gap-2',
      cityBadge: 'text-xs px-2 py-0.5',
    },
    lg: {
      container: 'h-16 rounded-[10px] border-[2.5px] border-black shadow-md',
      leftBox: 'w-12 py-1.5 border-r-[2.5px] border-black',
      irqText: 'text-[11px] tracking-tight leading-[1.05]',
      krText: 'text-[12px] leading-none',
      code: 'text-3xl',
      seal: 'w-5 h-5 rounded-[3.5px]',
      sealCore: 'w-3 h-3',
      letter: 'text-3xl',
      spacer: 'w-4',
      number: 'text-3xl',
      contentPad: 'px-4 gap-3',
      cityBadge: 'text-xs px-2.5 py-1',
    },
    xl: {
      container: 'h-20 rounded-[12px] border-[3px] border-black shadow-lg',
      leftBox: 'w-15 py-2 border-r-[3px] border-black',
      irqText: 'text-sm tracking-tight leading-[1.05]',
      krText: 'text-sm leading-none',
      code: 'text-4xl',
      seal: 'w-6.5 h-6.5 rounded-[4.5px]',
      sealCore: 'w-4 h-4',
      letter: 'text-4xl',
      spacer: 'w-5',
      number: 'text-4xl',
      contentPad: 'px-5 gap-4',
      cityBadge: 'text-sm px-3 py-1',
    },
  }[size];

  // -------------------------------------------------------------------
  // OFFICIAL UNIFIED KURDISTAN LICENSE PLATE (وەک وێنەی فەرمی تابلۆکە)
  // [ I R Q / KR ]  [ 21 ]  [ ■ Seal ]  [ E ]     [ 2112 ]
  // Pure white plate, sharp black border, left box with vertical IRQ + KR,
  // square holographic security seal, and authentic FE-Schrift font.
  // -------------------------------------------------------------------
  if (isUnified) {
    const isKurdistan = ['21', '22', '23', '24', '25'].includes(plate.provinceCode || '21');

    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <div
          data-plate="true"
          className={`license-plate inline-flex items-center select-none overflow-hidden ${sizeStyles.container}`}
          dir="ltr"
          style={{
            backgroundColor: '#FFFFFF',
            color: '#000000',
            fontFamily: "'FE-Font', 'JetBrains Mono', monospace",
          }}
        >
          {/* 1. LEFT BOX: Vertical "I R Q" and "KR" (White background, black text, black right border) */}
          <div
            className={`h-full flex flex-col justify-between items-center shrink-0 ${sizeStyles.leftBox}`}
            style={{ backgroundColor: '#FFFFFF', color: '#000000' }}
          >
            {/* Vertical IRQ */}
            <div
              className={`flex flex-col items-center justify-center font-black font-sans ${sizeStyles.irqText}`}
              style={{ color: '#000000' }}
            >
              <span>I</span>
              <span>R</span>
              <span>Q</span>
            </div>

            {/* Region code: KR (Kurdistan) or IRQ */}
            <div
              className={`font-black font-sans ${sizeStyles.krText}`}
              style={{ color: '#000000' }}
            >
              {isKurdistan ? 'KR' : 'IQ'}
            </div>
          </div>

          {/* 2. MAIN REGISTRATION SECTION: [ 21 ] [ ■ Seal ] [ E ] [   ] [ 2112 ] */}
          <div
            className={`h-full flex items-center ${sizeStyles.contentPad}`}
            style={{ backgroundColor: '#FFFFFF', color: '#000000' }}
          >
            {/* 2-Digit Province Code (e.g. 21, 22) */}
            <span
              className={`font-bold leading-none tracking-normal ${sizeStyles.code}`}
              style={{ color: '#000000' }}
            >
              {plate.provinceCode || '21'}
            </span>

            {/* Official Square Holographic Security Seal (وەک وێنە نمونەیەکە) */}
            <div
              className={`bg-gradient-to-tr from-slate-200 via-sky-100 to-emerald-100 border border-slate-400/80 shadow-[inset_0_1px_1px_rgba(0,0,0,0.1)] flex items-center justify-center shrink-0 ${sizeStyles.seal}`}
              title="مۆری فەرمی ئاسایش (Holographic Security Seal)"
            >
              <div
                className={`rounded-full bg-gradient-to-tr from-sky-600 to-cyan-400 border border-sky-700/60 flex items-center justify-center shadow-2xs ${sizeStyles.sealCore}`}
              >
                <div className="w-[35%] h-[35%] rounded-full bg-white/90"></div>
              </div>
            </div>

            {/* Series Letter (e.g. E, A, B) */}
            <span
              className={`font-bold leading-none tracking-normal ${sizeStyles.letter}`}
              style={{ color: '#000000' }}
            >
              {plate.letter || 'E'}
            </span>

            {/* Gap separator before the main registration digits */}
            <div className={sizeStyles.spacer} />

            {/* Registration Digits (e.g. 2112, 8989) */}
            <span
              className={`font-bold leading-none tracking-normal ${sizeStyles.number}`}
              style={{ color: '#000000' }}
            >
              {plate.number || '2112'}
            </span>
          </div>
        </div>

        {/* Optional Province Name Tag */}
        {showCityBadge && provinceName && (
          <span
            className={`rounded-lg bg-slate-800 text-slate-300 border border-slate-700 font-bold font-sans ${sizeStyles.cityBadge}`}
          >
            {provinceName}
          </span>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------------
  // CLASSIC PLATE: Kurdish Classic Plate (تایبەت / هەولێر / 258569 / KR)
  // For older cars in Kurdistan
  // -------------------------------------------------------------------
  const categoryColor =
    plate.oldCategory === 'کرێ'
      ? 'bg-amber-400 text-slate-950 font-black'
      : plate.oldCategory === 'حکومی'
      ? 'bg-slate-900 text-white'
      : plate.oldCategory === 'بارهەڵگر'
      ? 'bg-blue-600 text-white'
      : plate.oldCategory === 'کشتوکاڵی' || plate.oldCategory === 'بیناسازی'
      ? 'bg-emerald-600 text-white'
      : plate.oldCategory === 'ماتۆڕسکیل'
      ? 'bg-purple-600 text-white'
      : 'bg-rose-600 text-white';

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div
        data-plate="true"
        className={`license-plate inline-flex items-center border-2 border-black rounded-lg select-none overflow-hidden relative shadow-xs ${sizeStyles.container}`}
        dir="rtl"
        style={{
          backgroundColor: '#FFFFFF',
          color: '#000000',
          fontFamily: "'FE-Font', 'JetBrains Mono', monospace",
        }}
      >
        {/* Category Tag */}
        {plate.oldCategory && (
          <div
            className={`h-full font-bold flex items-center justify-center font-sans border-l border-black px-2 ${categoryColor} text-xs`}
          >
            {plate.oldCategory}
          </div>
        )}

        {/* City Name in Kurdish */}
        <div
          className="h-full font-black border-l border-slate-300 flex items-center justify-center font-sans px-2.5 text-xs"
          style={{ backgroundColor: '#F8FAFC', color: '#000000' }}
        >
          {plate.oldCityName || 'هەولێر'}
        </div>

        {/* Digits */}
        <div
          className="h-full font-bold flex items-center justify-center px-3 text-sm tracking-wider"
          style={{ backgroundColor: '#FFFFFF', color: '#000000' }}
          dir="ltr"
        >
          {plate.oldNumber || '258569'}
        </div>

        {/* Kurdistan Region Stamp */}
        <div
          className="h-full font-black font-mono border-r border-slate-300 flex items-center justify-center text-[10px] px-2 font-bold"
          style={{ backgroundColor: '#F1F5F9', color: '#334155' }}
          dir="ltr"
        >
          KR
        </div>
      </div>
    </div>
  );
};
