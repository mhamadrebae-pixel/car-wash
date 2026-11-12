'use client';

import React, { useState, useEffect } from 'react';
import { X, Share, PlusSquare, Smartphone, CheckCircle2 } from 'lucide-react';

export const InstallPwaPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showIosModal, setShowIosModal] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            reg.update();
            console.log('[PWA] Service Worker registered and updated:', reg.scope);
          })
          .catch((err) => {
            console.log('[PWA] Service Worker registration failed:', err);
          });
      });
    }

    // 2. Check if already installed in standalone mode
    const checkStandalone = () => {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (navigator as any).standalone === true ||
        document.referrer.includes('android-app://');
      setIsInstalled(isStandalone);
      return isStandalone;
    };

    if (checkStandalone()) {
      return;
    }

    // 3. Detect iOS device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);

    // 4. Android / Chrome: Capture beforeinstallprompt (manual install only)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Automatic popup banner disabled completely per user request
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 5. Listen for manual trigger (e.g. from Sidebar or Header button)
    const handleManualOpen = () => {
      if (isIosDevice) {
        setShowIosModal(true);
      } else if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult: any) => {
          if (choiceResult.outcome === 'accepted') {
            setIsInstalled(true);
          }
          setDeferredPrompt(null);
        });
      } else {
        // Fallback info modal
        setShowIosModal(true);
      }
    };

    window.addEventListener('open-pwa-install', handleManualOpen);

    // Listen for appinstalled
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('open-pwa-install', handleManualOpen);
    };
  }, [deferredPrompt]);

  if (isInstalled) return null;

  return (
    <>
      {/* iOS Safari / Manual Installation Instructions Modal (Only shown on explicit manual click) */}
      {showIosModal && (
        <div
          dir="rtl"
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
        >
          <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl max-w-sm w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">دابەزاندن بۆ Home Screen</h3>
                  <span className="text-xs text-blue-400 font-bold">بۆ کارکردن وەک ئەپی مۆبایل</span>
                </div>
              </div>
              <button
                onClick={() => setShowIosModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <p className="text-slate-200 font-medium">
                بۆ ئەوەی سیستەمەکە وەک ئەپێکی ڕاستەقینە بخرێتە سەر شاشەی مۆبایلەکەت، ئەم ٣ هەنگاوە جێبەجێ بکە:
              </p>

              {/* Step 1 */}
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                <div className="w-7 h-7 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center font-mono font-bold shrink-0">
                  ١
                </div>
                <div>
                  <span className="font-bold text-white block">کلیک لە دوگمەی Share بکە:</span>
                  <span className="text-slate-400">
                    لە خوارەوەی وێبگەڕی Safari کلیک لە دوگمەی هاوبەشکردن (
                    <Share className="w-3.5 h-3.5 inline mx-1 text-blue-400" />
                    Share) بکە.
                  </span>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                <div className="w-7 h-7 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center font-mono font-bold shrink-0">
                  ٢
                </div>
                <div>
                  <span className="font-bold text-white block">Add to Home Screen هەڵبژێرە:</span>
                  <span className="text-slate-400">
                    کەمێک بڕۆ خوارەوە و کلیک لەسەر (
                    <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-emerald-400" />
                    Add to Home Screen / زیادکردن بۆ شاشەی سەرەکی) بکە.
                  </span>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                <div className="w-7 h-7 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center font-mono font-bold shrink-0">
                  ٣
                </div>
                <div>
                  <span className="font-bold text-white block">کلیک لە Add (زیادکردن) بکە:</span>
                  <span className="text-slate-400">
                    لە گۆشەی سەرەوەی ڕاست دوگمەی Add دابگرە. ئایکۆنی ئەپەکە دەکەوێتە سەر شاشەی سەرەکی!
                  </span>
                </div>
              </div>

              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-2 text-emerald-300 font-bold">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>پاش دابەزاندن، تەواوی ناونیشانی وێب دەشاردرێتەوە و بە قەبارەی تەواوی شاشە وەک ئەپی ئەسڵی کار دەکات.</span>
              </div>
            </div>

            <button
              onClick={() => setShowIosModal(false)}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition cursor-pointer shadow-lg shadow-blue-500/20"
            >
              تێگەیشتم ✓
            </button>
          </div>
        </div>
      )}
    </>
  );
};
