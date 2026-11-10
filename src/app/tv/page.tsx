'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getSavedVehicles, getSavedSettings } from '@/lib/storage';
import { Vehicle, AppSettings } from '@/types';
import { PlateDisplay } from '@/components/ui/PlateDisplay';
import { Car, Clock, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

export default function TvScreenPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [settings, setSettings] = useState<AppSettings>(getSavedSettings());
  const [time, setTime] = useState<string>('');
  const [, setTick] = useState<number>(0);

  useEffect(() => {
    const load = async () => {
      setVehicles(getSavedVehicles());
      setSettings(getSavedSettings());

      try {
        const res = await fetch('/api/sync', { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            if (Array.isArray(json.data.vehicles)) {
              setVehicles(json.data.vehicles);
            }
            if (json.data.settings) {
              setSettings(json.data.settings);
            }
          }
        }
      } catch {}
    };
    load();
    const interval = setInterval(load, 3000); // Poll every 3 seconds for TV
    const timerInterval = setInterval(() => setTick((t) => t + 1), 10000); // Update live minutes every 10s

    // Real-time instantaneous update on local storage change across tabs
    const handleStorage = () => load();
    window.addEventListener('storage', handleStorage);

    return () => {
      clearInterval(interval);
      clearInterval(timerInterval);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const getElapsedMinutes = (entryTime?: string, fallbackTime?: string) => {
    const timeStr = entryTime || fallbackTime;
    if (!timeStr) return 0;
    const elapsed = Math.floor((Date.now() - new Date(timeStr).getTime()) / (1000 * 60));
    return Math.max(0, elapsed);
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleDateString('ku', {
          weekday: 'long',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const tInterval = setInterval(updateTime, 1000);
    return () => clearInterval(tInterval);
  }, []);

  // Filter cars currently in wash bays or ready
  const activeCars = vehicles.filter((v) => v.currentBay || v.washStage);

  return (
    <div
      className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-6 sm:p-10 select-none overflow-hidden"
      dir="rtl"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
            <Car className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white" suppressHydrationWarning>
              {settings.carWashName}
            </h1>
            <p className="text-sm text-blue-400 font-bold flex items-center gap-1.5 pt-0.5">
              <Sparkles className="w-4 h-4" />
              بەخێربێن بۆ ژووری چاوەڕوانی • ئاگاداری قۆناغی شۆردنی سەیارەکەت بە
            </p>
          </div>
        </div>

        <div className="text-left font-mono space-y-1">
          <div className="text-2xl sm:text-3xl font-black text-white" suppressHydrationWarning>{time}</div>
          <span className="text-xs text-slate-400">چاودێری ڕاستەوخۆی هۆڵەکان</span>
        </div>
      </div>

      {/* Main Grid: Cars being washed right now */}
      <div className="flex-1 py-8">
        {activeCars.length === 0 ? (
          <div className="h-full min-h-[420px] flex flex-col items-center justify-center text-center space-y-5 bg-[#0b1329]/80 border-2 border-slate-800 rounded-3xl p-12 shadow-2xl">
            <div className="w-24 h-24 rounded-3xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-inner">
              <Car className="w-12 h-12" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black text-white">هەموو هۆڵەکانی شۆردن بەردەستن</h2>
              <p className="text-base text-slate-400 max-w-lg mx-auto">
                بەخێربێن بۆ ژووری چاوەڕوانی. کاتێک سەیارەکەت دەچێتە هۆڵی شۆردن، زانیاری و قۆناغەکانی ڕاستەوخۆ لێرەدا پیشان دەدرێت.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900 border border-slate-800 text-amber-400 font-bold text-sm">
              <Sparkles className="w-5 h-5" />
              لۆیەڵتی NFC: هەموو ٤ شۆردنێک، شۆردنی ٥ـەم ١٠٠٪ بەخۆڕاییە!
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {activeCars.map((v) => {
              const isReady = v.washStage === 'تەواوبوو';
              const elapsedMins = getElapsedMinutes(v.bayEntryTime, v.lastVisitDate);

              return (
                <div
                  key={v.id}
                  className={`rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6 relative overflow-hidden transition-all duration-300 ${
                    isReady
                      ? 'bg-gradient-to-b from-emerald-950/60 to-[#071318] border-2 border-emerald-500 shadow-emerald-500/20 ring-2 ring-emerald-500/30'
                      : 'bg-gradient-to-b from-[#0f172a] to-[#090e1a] border-2 border-blue-500/50 shadow-blue-500/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-3.5 py-1.5 bg-blue-600 text-white rounded-xl text-sm font-black font-mono shadow-md">
                        هۆڵی {v.currentBay || '١'}
                      </span>
                      {!isReady && (
                        <span
                          className={`text-xs px-2.5 py-1 rounded-xl font-bold font-mono border flex items-center gap-1 ${
                            elapsedMins > 30
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse'
                              : elapsedMins > 15
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                              : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          {elapsedMins} خولەک
                        </span>
                      )}
                    </div>

                    {isReady ? (
                      <span className="text-sm px-4 py-1.5 bg-emerald-500 text-slate-950 rounded-xl font-black flex items-center gap-2 shadow-lg shadow-emerald-500/40 animate-pulse">
                        <CheckCircle2 className="w-5 h-5" />
                        ئامادەیە بۆ وەرگرتنەوە ✓
                      </span>
                    ) : (
                      <span className="text-xs px-3.5 py-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/50 rounded-xl font-bold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                        لە ژێر کاردایە...
                      </span>
                    )}
                  </div>

                  {/* High-legibility Plate Rendering */}
                  <div className="flex justify-center py-2">
                    <PlateDisplay plate={v.plate} size="lg" />
                  </div>

                  <div className="text-center space-y-1.5 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
                    <h3 className="text-xl font-black text-white">{v.carModel} • {v.color}</h3>
                    <p className="text-sm text-slate-300">خاوەن: <span className="font-bold text-white">{v.ownerName}</span></p>
                    {v.assignedWorkerName && (
                      <p className="text-xs text-blue-300 font-bold flex items-center justify-center gap-1">
                        وەستای بەرپرس: {v.assignedWorkerName}
                      </p>
                    )}
                  </div>

                  {/* Stage Progress Bar on TV */}
                  <div className="p-3.5 bg-black/60 rounded-2xl border border-slate-800 space-y-2 text-center">
                    <div className="flex items-center justify-between text-xs text-slate-400 font-bold px-1">
                      <span>قۆناغی شۆردن:</span>
                      {!isReady && (
                        <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                          ⏱️ {elapsedMins} خولەکە لە هۆڵدایە
                        </span>
                      )}
                    </div>
                    <span className={`text-lg sm:text-xl font-black block ${
                      isReady ? 'text-emerald-400 animate-bounce' : 'text-amber-300'
                    }`}>
                      {v.washStage || 'دەستپێکردنی شۆردن'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Banner */}
      <div className="border-t border-slate-800/80 pt-4 flex items-center justify-between text-xs text-slate-400">
        <Link href="/" className="hover:text-white flex items-center gap-1.5 transition">
          <ArrowRight className="w-4 h-4" />
          گەڕانەوە بۆ داشبۆردی کاشێر
        </Link>

        <span className="flex items-center gap-1.5 text-amber-400 font-bold">
          <Sparkles className="w-4 h-4" />
          ئۆفەری غەسل: شۆردنی ٤ لە ٤ = شۆردنی ٥ـەم بەخۆڕایی (Free)!
        </span>

        <span className="font-mono" suppressHydrationWarning>
          تەلەفۆن: {settings.carWashPhone}
        </span>
      </div>
    </div>
  );
}
