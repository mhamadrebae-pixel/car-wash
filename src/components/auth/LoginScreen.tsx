'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AppSettings, AuthUser } from '@/types';
import { validateUserPin, saveSession, playPosSound, normalizeDigits } from '@/lib/storage';
import {
  Lock,
  ShieldCheck,
  Sparkles,
  Delete,
  Tv,
  CheckCircle2,
  AlertTriangle,
  Crown,
  CreditCard,
  KeyRound,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface LoginScreenProps {
  settings: AppSettings;
  onLoginSuccess: (user: AuthUser) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ settings, onLoginSuccess }) => {
  const [pin, setPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [selectedRoleHint, setSelectedRoleHint] = useState<'all' | 'admin' | 'cashier'>('all');
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [lockoutUntil, setLockoutUntil] = useState<number>(0);

  const maxPinLength = 4;

  const isLockedOut = Date.now() < lockoutUntil;

  const handleDigit = useCallback(
    (digit: string) => {
      if (isSuccess) return;
      if (Date.now() < lockoutUntil) {
        const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000);
        setErrorMsg(`⚠️ بەهۆی هەڵەی بەردەوام، چوونەژوورەوە بۆ ${remaining} چرکە قفڵکراوە.`);
        return;
      }
      if (pin.length >= maxPinLength) return;

      playPosSound('beep');
      setErrorMsg(null);
      const nextPin = pin + digit;
      setPin(nextPin);
    },
    [pin, isSuccess, lockoutUntil]
  );

  const handleBackspace = useCallback(() => {
    if (isSuccess || Date.now() < lockoutUntil) return;
    playPosSound('beep');
    setErrorMsg(null);
    setPin((prev) => prev.slice(0, -1));
  }, [isSuccess, lockoutUntil]);

  const handleClear = useCallback(() => {
    if (isSuccess || Date.now() < lockoutUntil) return;
    playPosSound('beep');
    setErrorMsg(null);
    setPin('');
  }, [isSuccess, lockoutUntil]);

  // Check PIN whenever it reaches 4 digits
  useEffect(() => {
    if (pin.length === maxPinLength) {
      if (Date.now() < lockoutUntil) {
        const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000);
        setErrorMsg(`⚠️ چوونەژوورەوە قفڵکراوە، تکایە ${remaining} چرکە چاوەڕوان بە.`);
        setPin('');
        return;
      }

      const user = validateUserPin(pin, settings);

      if (user) {
        setIsSuccess(true);
        playPosSound('success');
        saveSession({
          currentUser: user,
          loginTime: new Date().toISOString(),
        });

        const timer = setTimeout(() => {
          onLoginSuccess(user);
        }, 550);
        return () => clearTimeout(timer);
      } else {
        playPosSound('warning');
        setIsShaking(true);
        const nextFailed = failedAttempts + 1;
        setFailedAttempts(nextFailed);

        if (nextFailed >= 5) {
          setLockoutUntil(Date.now() + 60000);
          setErrorMsg('⚠️ ٥ جار کۆدی هەڵە لێدرا! چوونەژوورەوە بۆ ماوەی ٦٠ چرکە قفڵکرا.');
        } else {
          setErrorMsg(`کۆدی نهێنی هەڵەیە! (${5 - nextFailed} هەوڵ ماوە)`);
        }

        const timer = setTimeout(() => {
          setIsShaking(false);
          setPin('');
        }, 650);
        return () => clearTimeout(timer);
      }
    }
  }, [pin, settings, onLoginSuccess, failedAttempts, lockoutUntil]);

  // Physical Keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape' || e.key === 'Delete') {
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDigit, handleBackspace, handleClear]);

  return (
    <div
      className="min-h-screen w-full bg-[#0B0F19] text-white flex flex-col justify-between items-center relative overflow-hidden font-sans p-4 sm:p-6 select-none"
      dir="rtl"
    >
      {/* Background Ambient Glow Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Header / Brand Bar */}
      <header className="w-full max-w-md flex items-center justify-between z-10 pt-2 sm:pt-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 p-0.5 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-white/95">
              {settings.carWashName || 'غەسلی شاژنی ئۆتۆمبێل'}
            </h1>
            <p className="text-[10px] text-slate-400 font-medium">سیستەمی کارگێڕیی و پێشوازی POS</p>
          </div>
        </div>

        <a
          href="/tv"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-[11px] font-bold text-slate-300 hover:text-white transition shadow-xs"
        >
          <Tv className="w-3.5 h-3.5 text-blue-400" />
          <span>شاشەی TV</span>
        </a>
      </header>

      {/* Center Interactive Login Box */}
      <main className="w-full max-w-sm flex flex-col items-center z-10 my-auto py-4">
        {/* Shield & Greeting */}
        <div className="relative mb-5 flex flex-col items-center">
          <div
            className={`w-16 h-16 rounded-3xl flex items-center justify-center shadow-xl transition-all duration-300 ${
              isSuccess
                ? 'bg-emerald-500 text-white shadow-emerald-500/30 scale-105'
                : isShaking
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-rose-500/20'
                : 'bg-gradient-to-tr from-slate-800 to-slate-900 border border-slate-700/80 text-indigo-400 shadow-indigo-500/10'
            }`}
          >
            {isSuccess ? (
              <CheckCircle2 className="w-8 h-8 animate-bounce" />
            ) : isShaking ? (
              <AlertTriangle className="w-8 h-8 animate-pulse" />
            ) : (
              <Lock className="w-8 h-8" />
            )}
          </div>
          <h2 className="text-xl font-black mt-3 text-white tracking-tight">چوونەژوورەوەی سیستەم</h2>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">
            تکایە کۆدی نهێنی ٤ ژمارەیی (PIN) لێبدە
          </p>
        </div>

        {/* Role Quick Reference Pills */}
        <div className="grid grid-cols-2 gap-2 w-full mb-6">
          <div
            onClick={() => setSelectedRoleHint('cashier')}
            className={`p-2.5 rounded-2xl border transition cursor-pointer flex items-center gap-2.5 ${
              selectedRoleHint === 'cashier'
                ? 'bg-blue-950/60 border-blue-500/80 shadow-md shadow-blue-500/10'
                : 'bg-slate-900/60 hover:bg-slate-800/60 border-slate-800 text-slate-300'
            }`}
          >
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0">
              <CreditCard className="w-4 h-4" />
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-white">کاشێر (Cashier)</div>
              <div className="text-[10px] text-blue-400/90 font-medium">وەرگرتن و دەرکردنی پسوولە</div>
            </div>
          </div>

          <div
            onClick={() => setSelectedRoleHint('admin')}
            className={`p-2.5 rounded-2xl border transition cursor-pointer flex items-center gap-2.5 ${
              selectedRoleHint === 'admin'
                ? 'bg-purple-950/60 border-purple-500/80 shadow-md shadow-purple-500/10'
                : 'bg-slate-900/60 hover:bg-slate-800/60 border-slate-800 text-slate-300'
            }`}
          >
            <div className="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center shrink-0">
              <Crown className="w-4 h-4" />
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-white">بەڕێوەبەر (Admin)</div>
              <div className="text-[10px] text-purple-400/90 font-medium">داشبۆرد، حسابات و ڕێکخستن</div>
            </div>
          </div>
        </div>

        {/* PIN Dots Display */}
        <div
          className={`flex items-center justify-center gap-3.5 mb-6 py-2 transition-transform duration-200 ${
            isShaking ? 'translate-x-[-8px]' : ''
          }`}
        >
          {[0, 1, 2, 3].map((index) => {
            const hasDigit = pin.length > index;
            return (
              <div
                key={index}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  isSuccess
                    ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50 scale-125'
                    : isShaking
                    ? 'bg-rose-500 shadow-lg shadow-rose-500/50 scale-110'
                    : hasDigit
                    ? 'bg-gradient-to-r from-blue-400 to-indigo-400 shadow-lg shadow-indigo-500/50 scale-110'
                    : 'bg-slate-800 border-2 border-slate-700/80'
                }`}
              />
            );
          })}
        </div>

        {/* Error Notification Alert */}
        {errorMsg && (
          <div className="w-full mb-3 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center justify-center gap-1.5 animate-fadeIn">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Interactive Numeric Keypad (Touch & Click) */}
        <div className="w-full grid grid-cols-3 gap-2.5">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              className="h-14 sm:h-16 rounded-2xl bg-slate-900/80 hover:bg-slate-800 active:scale-95 border border-slate-800 hover:border-slate-700 text-xl font-bold font-mono text-white flex items-center justify-center transition shadow-sm cursor-pointer"
            >
              {digit}
            </button>
          ))}

          {/* Clear Button */}
          <button
            type="button"
            onClick={handleClear}
            className="h-14 sm:h-16 rounded-2xl bg-slate-900/40 hover:bg-rose-950/40 active:scale-95 border border-slate-800/80 hover:border-rose-900/60 text-xs font-bold text-slate-400 hover:text-rose-400 flex items-center justify-center transition cursor-pointer"
          >
            پاککردنەوە
          </button>

          {/* Zero Button */}
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-14 sm:h-16 rounded-2xl bg-slate-900/80 hover:bg-slate-800 active:scale-95 border border-slate-800 hover:border-slate-700 text-xl font-bold font-mono text-white flex items-center justify-center transition shadow-sm cursor-pointer"
          >
            0
          </button>

          {/* Backspace Button */}
          <button
            type="button"
            onClick={handleBackspace}
            aria-label="سڕینەوە"
            className="h-14 sm:h-16 rounded-2xl bg-slate-900/40 hover:bg-slate-800 active:scale-95 border border-slate-800/80 hover:border-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <Delete className="w-5 h-5 rotate-180" />
          </button>
        </div>
      </main>

      {/* Footer Instructions / Security note */}
      <footer className="w-full max-w-sm text-center z-10 pb-2">
        <p className="text-[11px] text-slate-500 font-medium flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/70" />
          <span>سیستەمی پارێزراوی کارمەندان • بەردەست بە شێوازی ئۆفلاین</span>
        </p>
      </footer>
    </div>
  );
};
