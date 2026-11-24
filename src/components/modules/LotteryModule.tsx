'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Trophy,
  Ticket,
  Gift,
  Star,
  Sparkles,
  Play,
  RefreshCw,
  CheckCircle2,
  Phone,
  Car,
  Calendar,
  Users,
  Shuffle,
  Crown,
  Medal,
  Award,
  Settings2,
  ChevronDown,
  ChevronUp,
  Hash,
  Clock,
  TrendingUp,
  X,
  Save,
  Plus,
  Trash2,
  Eye,
} from 'lucide-react';
import {
  getSavedLotteryTickets,
  getSavedLotteryDraws,
  getLotterySettings,
  saveLotterySettings,
  saveLotteryDraws,
  conductLotteryDraw,
  formatIQD,
} from '@/lib/storage';
import {
  LotteryTicket,
  LotteryDraw,
  LotterySettings,
  LotteryPrize,
  LotteryWinner,
} from '@/types';

interface LotteryModuleProps {
  currentUserName?: string;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function getCurrentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function formatPeriod(period: string): string {
  const [year, month] = period.split('-');
  const months = [
    'کانوونی دووەم', 'شوبات', 'ئازار', 'نیسان', 'ئایار', 'حوزەیران',
    'تەمموز', 'ئاب', 'ئەیلوول', 'تشرینی یەکەم', 'تشرینی دووەم', 'کانوونی یەکەم',
  ];
  return `${months[parseInt(month) - 1]} ${year}`;
}

function prizeIcon(rank: number) {
  if (rank === 1) return <Crown className="w-5 h-5 text-yellow-500" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-slate-400" />;
  if (rank === 3) return <Award className="w-5 h-5 text-amber-600" />;
  return <Gift className="w-5 h-5 text-purple-500" />;
}

function prizeRingColor(rank: number) {
  if (rank === 1) return 'ring-2 ring-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
  if (rank === 2) return 'ring-2 ring-slate-300 bg-slate-50 dark:bg-slate-800/60';
  if (rank === 3) return 'ring-2 ring-amber-400 bg-amber-50 dark:bg-amber-900/20';
  return 'ring-2 ring-purple-300 bg-purple-50 dark:bg-purple-900/20';
}

// ─── Spinning Animation Component ─────────────────────────────────────────────

function SpinningDrum({ tickets, winner, spinning }: {
  tickets: LotteryTicket[];
  winner?: LotteryWinner;
  spinning: boolean;
}) {
  const [displayIdx, setDisplayIdx] = useState(0);

  useEffect(() => {
    if (!spinning) return;
    const interval = setInterval(() => {
      setDisplayIdx((prev) => (prev + 1) % Math.max(tickets.length, 1));
    }, 80);
    return () => clearInterval(interval);
  }, [spinning, tickets.length]);

  const displayTicket = spinning
    ? tickets[displayIdx]
    : winner
    ? tickets.find((t) => t.id === winner.ticketId) || tickets[0]
    : null;

  return (
    <div className={`relative flex flex-col items-center justify-center rounded-3xl p-8 transition-all duration-300 ${
      spinning
        ? 'bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 shadow-2xl shadow-purple-500/40'
        : winner
        ? 'bg-gradient-to-br from-yellow-500 via-amber-500 to-orange-500 shadow-2xl shadow-yellow-400/40'
        : 'bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900'
    }`}>
      {/* Stars */}
      {(spinning || winner) && (
        <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1.5 h-1.5 bg-white rounded-full opacity-60 animate-ping"
              style={{
                top: `${10 + (i * 11) % 80}%`,
                left: `${5 + (i * 13) % 90}%`,
                animationDelay: `${i * 0.15}s`,
                animationDuration: '0.8s',
              }}
            />
          ))}
        </div>
      )}

      <div className="relative z-10 text-center">
        {spinning ? (
          <>
            <div className="text-white/60 text-xs font-bold mb-2">🎰 دەکێشرێت...</div>
            <div className="text-white font-black text-5xl mb-1 font-mono tabular-nums transition-all duration-75">
              #{displayTicket?.ticketNumber ?? '?'}
            </div>
            <div className="text-white/80 text-sm font-bold truncate max-w-[180px]">
              {displayTicket?.plate || displayTicket?.customerName || '---'}
            </div>
          </>
        ) : winner ? (
          <>
            <div className="text-white/80 text-xs font-bold mb-2">🎉 بەرنتی!</div>
            <div className="text-white font-black text-5xl mb-1 font-mono">
              #{winner.ticketNumber}
            </div>
            <div className="text-white font-extrabold text-base mt-1 max-w-[180px] text-center">
              {winner.customerName || winner.plate || 'کڕیار'}
            </div>
            {winner.phone && (
              <div className="text-white/80 text-xs mt-1 font-mono">{winner.phone}</div>
            )}
          </>
        ) : (
          <div className="text-slate-500 font-bold text-sm">🎟️ ئامادەی کێشان</div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export const LotteryModule: React.FC<LotteryModuleProps> = ({ currentUserName }) => {
  const [tickets, setTickets] = useState<LotteryTicket[]>([]);
  const [draws, setDraws] = useState<LotteryDraw[]>([]);
  const [settings, setSettings] = useState<LotterySettings | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>(getCurrentPeriod());
  const [activeTab, setActiveTab] = useState<'draw' | 'tickets' | 'history' | 'settings'>('draw');
  const [spinning, setSpinning] = useState(false);
  const [currentWinnerIdx, setCurrentWinnerIdx] = useState(0);
  const [drawnResult, setDrawnResult] = useState<LotteryDraw | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [localSettings, setLocalSettings] = useState<LotterySettings | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const reload = useCallback(() => {
    setTickets(getSavedLotteryTickets());
    setDraws(getSavedLotteryDraws());
    const s = getLotterySettings();
    setSettings(s);
    setLocalSettings(JSON.parse(JSON.stringify(s)));
  }, []);

  useEffect(() => { reload(); }, [reload]);

  // ── Derived Data ─────────────────────────────────────────────────────────────

  const periodTickets = tickets.filter((t) => t.drawPeriod === selectedPeriod);
  const uniqueCustomers = new Set(periodTickets.map((t) => t.customerId)).size;
  const existingDraw = draws.find((d) => d.period === selectedPeriod);
  const currentDraw = drawnResult && drawnResult.period === selectedPeriod ? drawnResult : existingDraw ?? null;
  const currentWinner = currentDraw ? currentDraw.winners[currentWinnerIdx] ?? null : null;

  // available periods from tickets
  const allPeriods = Array.from(new Set(tickets.map((t) => t.drawPeriod))).sort().reverse();
  if (!allPeriods.includes(getCurrentPeriod())) allPeriods.unshift(getCurrentPeriod());

  // ── Draw Logic ────────────────────────────────────────────────────────────────

  async function handleDraw() {
    if (!settings || periodTickets.length === 0) return;
    setShowConfirm(false);
    setSpinning(true);
    setCurrentWinnerIdx(0);
    setDrawnResult(null);

    // Animate for 3 seconds
    await new Promise((r) => setTimeout(r, 3000));
    setSpinning(false);

    const result = conductLotteryDraw({
      period: selectedPeriod,
      prizes: settings.prizes,
      drawnBy: currentUserName,
    });
    setDrawnResult(result);
    setDraws(getSavedLotteryDraws());
  }

  function handleClaimToggle(winnerIdx: number) {
    if (!currentDraw) return;
    const winner = currentDraw.winners[winnerIdx];
    if (!winner) return;
    setClaimingId(winner.ticketId);

    setTimeout(() => {
      const updated = { ...currentDraw, winners: currentDraw.winners.map((w, i) =>
        i === winnerIdx ? { ...w, claimed: !w.claimed, claimedAt: !w.claimed ? new Date().toISOString() : undefined } : w
      )};
      const updatedDraws = draws.map((d) => d.id === updated.id ? updated : d);
      saveLotteryDraws(updatedDraws);
      setDraws(updatedDraws);
      if (drawnResult?.id === updated.id) setDrawnResult(updated);
      setClaimingId(null);
    }, 400);
  }

  function handleSaveSettings() {
    if (!localSettings) return;
    saveLotterySettings(localSettings);
    setSettings(localSettings);
    setSettingsOpen(false);
  }

  function addPrize() {
    if (!localSettings) return;
    const newPrize: LotteryPrize = {
      id: `prize-${Date.now()}`,
      rank: localSettings.prizes.length + 1,
      label: `خەڵاتی ${localSettings.prizes.length + 1}`,
      type: 'cash',
      value: 10000,
      description: '',
    };
    setLocalSettings({ ...localSettings, prizes: [...localSettings.prizes, newPrize] });
  }

  function removePrize(id: string) {
    if (!localSettings) return;
    setLocalSettings({
      ...localSettings,
      prizes: localSettings.prizes
        .filter((p) => p.id !== id)
        .map((p, i) => ({ ...p, rank: i + 1 })),
    });
  }

  function updatePrize(id: string, field: keyof LotteryPrize, value: any) {
    if (!localSettings) return;
    setLocalSettings({
      ...localSettings,
      prizes: localSettings.prizes.map((p) => p.id === id ? { ...p, [field]: value } : p),
    });
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  if (!settings) return null;

  const tabs: { id: typeof activeTab; label: string; icon: any }[] = [
    { id: 'draw', label: 'قورعە', icon: Trophy },
    { id: 'tickets', label: 'تکتەکان', icon: Ticket },
    { id: 'history', label: 'مێژوو', icon: Clock },
    { id: 'settings', label: 'ڕێکخستن', icon: Settings2 },
  ];

  return (
    <div className="space-y-5 w-full max-w-full" dir="rtl">
      {/* ── Header ── */}
      <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-2xl p-5 text-white shadow-lg">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Trophy className="w-7 h-7 text-yellow-300" />
            </div>
            <div>
              <h1 className="text-xl font-black">تیرو پشک 🎟️</h1>
              <p className="text-white/70 text-xs mt-0.5">سیستەمی دیاریدانی کڕیارەکان</p>
            </div>
          </div>
          {/* Stats pills */}
          <div className="flex flex-wrap gap-2">
            <div className="bg-white/15 rounded-xl px-3 py-1.5 text-center">
              <div className="text-lg font-black">{periodTickets.length}</div>
              <div className="text-[10px] text-white/70">تکتی ئەم مانگە</div>
            </div>
            <div className="bg-white/15 rounded-xl px-3 py-1.5 text-center">
              <div className="text-lg font-black">{uniqueCustomers}</div>
              <div className="text-[10px] text-white/70">کڕیار</div>
            </div>
            <div className="bg-white/15 rounded-xl px-3 py-1.5 text-center">
              <div className="text-lg font-black">{settings.prizes.length}</div>
              <div className="text-[10px] text-white/70">خەڵات</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Period Selector ── */}
      <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-hide">
        {allPeriods.map((p) => (
          <button
            key={p}
            onClick={() => { setSelectedPeriod(p); setDrawnResult(null); setCurrentWinnerIdx(0); }}
            className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition shrink-0 ${
              selectedPeriod === p
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30'
            }`}
          >
            {p === getCurrentPeriod() ? '📅 ' : ''}
            {formatPeriod(p)}
            {draws.find((d) => d.period === p) ? ' ✓' : ''}
          </button>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition ${
              activeTab === id
                ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB: DRAW
      ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'draw' && (
        <div className="space-y-4">
          {/* Prizes list */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {settings.prizes.map((prize) => (
              <div key={prize.id} className={`rounded-2xl p-4 ${prizeRingColor(prize.rank)}`}>
                <div className="flex items-center gap-2 mb-2">
                  {prizeIcon(prize.rank)}
                  <span className="font-black text-sm text-slate-900 dark:text-white">{prize.label}</span>
                </div>
                <div className="text-slate-700 dark:text-slate-300 text-xs font-bold">
                  {prize.type === 'cash' && `💵 ${formatIQD(prize.value)} دینار`}
                  {prize.type === 'free_wash' && '🚗 شوردنی خاوەن'}
                  {prize.type === 'discount' && `🏷️ ${prize.value}٪ داشکاندن`}
                  {prize.type === 'custom' && prize.description}
                </div>
                {prize.description && prize.type !== 'custom' && (
                  <div className="text-slate-500 dark:text-slate-400 text-[10px] mt-1">{prize.description}</div>
                )}
              </div>
            ))}
          </div>

          {/* Drum + Draw */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex flex-col lg:flex-row gap-5 items-center">
              {/* Spinning drum */}
              <div className="w-full lg:w-64 shrink-0">
                <SpinningDrum
                  tickets={periodTickets}
                  winner={currentWinner ?? undefined}
                  spinning={spinning}
                />
              </div>

              {/* Winner cards */}
              <div className="flex-1 w-full space-y-3">
                {currentDraw && currentDraw.winners.length > 0 ? (
                  <>
                    {/* Winner tabs */}
                    {currentDraw.winners.length > 1 && (
                      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                        {currentDraw.winners.map((w, i) => (
                          <button
                            key={w.ticketId}
                            onClick={() => setCurrentWinnerIdx(i)}
                            className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition ${
                              currentWinnerIdx === i
                                ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-sm'
                                : 'text-slate-500 dark:text-slate-400'
                            }`}
                          >
                            {prizeIcon(i + 1)}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Current winner card */}
                    {currentWinner && (
                      <div className={`rounded-2xl p-4 ${prizeRingColor(currentWinnerIdx + 1)}`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {prizeIcon(currentWinnerIdx + 1)}
                            <span className="font-black text-sm text-slate-900 dark:text-white">
                              {currentWinner.prizeLabel}
                            </span>
                          </div>
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                            #{currentWinner.ticketNumber}
                          </span>
                        </div>
                        <div className="space-y-1.5 text-sm">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-slate-400" />
                            <span className="font-bold text-slate-900 dark:text-white">
                              {currentWinner.customerName || 'کڕیاری نەناسراو'}
                            </span>
                          </div>
                          {currentWinner.plate && (
                            <div className="flex items-center gap-2">
                              <Car className="w-4 h-4 text-slate-400" />
                              <span className="font-mono font-bold text-slate-700 dark:text-slate-300 text-xs">{currentWinner.plate}</span>
                            </div>
                          )}
                          {currentWinner.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-slate-400" />
                              <span className="font-mono text-xs text-slate-700 dark:text-slate-300">{currentWinner.phone}</span>
                            </div>
                          )}
                          <div className="text-xs text-indigo-600 dark:text-indigo-400 font-bold mt-1">
                            {currentWinner.prizeDescription}
                          </div>
                        </div>
                        {/* Claim toggle */}
                        <button
                          onClick={() => handleClaimToggle(currentWinnerIdx)}
                          disabled={claimingId === currentWinner.ticketId}
                          className={`mt-3 w-full py-2 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition ${
                            currentWinner.claimed
                              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          {currentWinner.claimed ? '✅ خەڵاتەکەی وەرگرت' : 'وەرگرتنی خەڵات تۆمار بکە'}
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    {periodTickets.length === 0 ? (
                      <div>
                        <Ticket className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-500 dark:text-slate-400 font-bold text-sm">هیچ تکتێک نیە</p>
                        <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">
                          تکتی کڕیارەکان ئۆتۆماتیک لە کاتی شوردن زیاد دەبێت
                        </p>
                      </div>
                    ) : (
                      <div>
                        <Shuffle className="w-12 h-12 text-indigo-300 mx-auto mb-3" />
                        <p className="text-slate-600 dark:text-slate-400 font-bold text-sm">
                          {periodTickets.length} تکتی ئامادەیە
                        </p>
                        <p className="text-slate-400 text-xs mt-1">دوگمەی کێشانەوە بە کلیک بکە</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Draw button */}
            <div className="mt-4 flex flex-col sm:flex-row gap-3 items-center justify-center">
              {!currentDraw ? (
                <>
                  {!showConfirm ? (
                    <button
                      onClick={() => setShowConfirm(true)}
                      disabled={periodTickets.length === 0 || spinning}
                      className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black rounded-2xl shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2 text-sm transition"
                    >
                      <Play className="w-5 h-5" />
                      دەست پێ بکە بە کێشانەوە!
                    </button>
                  ) : (
                    <div className="flex gap-3 w-full sm:w-auto">
                      <button
                        onClick={handleDraw}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black rounded-2xl shadow-lg flex items-center justify-center gap-2 text-sm"
                      >
                        <Sparkles className="w-4 h-4" />
                        بەڵێ، بکێشەرەوە!
                      </button>
                      <button
                        onClick={() => setShowConfirm(false)}
                        className="px-4 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-2xl text-sm"
                      >
                        نەخێر
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex gap-3 items-center flex-wrap justify-center">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                    📅 کێشراوە لە {new Date(currentDraw.drawDate).toLocaleDateString('ar-IQ')}
                  </span>
                  <button
                    onClick={() => {
                      if (!confirm('دووبارە کێشانەوە? ئەمە ئەنجامی پێشوو دەسڕێتەوە!')) return;
                      saveLotteryDraws(draws.filter((d) => d.id !== currentDraw.id));
                      setDraws(getSavedLotteryDraws());
                      setDrawnResult(null);
                      setCurrentWinnerIdx(0);
                    }}
                    className="px-4 py-2 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded-xl font-bold text-xs flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    دووبارە کێشانەوە
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB: TICKETS
      ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'tickets' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Ticket className="w-4 h-4 text-indigo-600" />
              تکتەکانی {formatPeriod(selectedPeriod)}
            </h3>
            <span className="text-xs font-bold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-xl">
              {periodTickets.length} تکتی
            </span>
          </div>

          {periodTickets.length === 0 ? (
            <div className="text-center py-10">
              <Ticket className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 font-bold text-sm">هیچ تکتێک نیە بۆ ئەم مانگە</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {[...periodTickets].sort((a, b) => a.ticketNumber - b.ticketNumber).map((t) => {
                const isWinner = currentDraw?.winners.some((w) => w.ticketId === t.id);
                return (
                  <div
                    key={t.id}
                    className={`flex items-center gap-3 p-3 rounded-xl transition ${
                      isWinner
                        ? 'bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400'
                        : 'bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm font-mono shrink-0 ${
                      isWinner
                        ? 'bg-yellow-400 text-yellow-900'
                        : 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
                    }`}>
                      #{t.ticketNumber}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                        {t.customerName || 'کڕیار'} {isWinner && '🏆'}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">
                        {t.plate || t.phone || t.customerId}
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono shrink-0">
                      {new Date(t.createdAt).toLocaleDateString('ar-IQ')}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB: HISTORY
      ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'history' && (
        <div className="space-y-3">
          {draws.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-10 text-center shadow-sm">
              <Clock className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 font-bold text-sm">هیچ قورعەیەک نەکێشراوە هێشتا</p>
            </div>
          ) : (
            [...draws].sort((a, b) => b.period.localeCompare(a.period)).map((draw) => (
              <div key={draw.id} className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    <span className="font-black text-sm text-slate-900 dark:text-white">{formatPeriod(draw.period)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-bold">
                      {draw.totalTickets} تکتی
                    </span>
                    <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                      کێشراوە
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  {draw.winners.map((w, i) => (
                    <div key={w.ticketId} className={`flex items-center gap-3 p-2.5 rounded-xl ${prizeRingColor(i + 1)}`}>
                      {prizeIcon(i + 1)}
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                          {w.customerName || w.plate || 'کڕیار'} — {w.prizeLabel}
                        </div>
                        {w.phone && <div className="text-[10px] text-slate-500 font-mono">{w.phone}</div>}
                      </div>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        w.claimed
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                          : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                      }`}>
                        {w.claimed ? '✅ وەرگیرا' : '⏳ چاوەڕوانە'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB: SETTINGS
      ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'settings' && localSettings && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-5">
          <h3 className="font-black text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-indigo-600" />
            ڕێکخستنەکانی تیرو پشک
          </h3>

          {/* Enable toggle */}
          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">چالاکی سیستەمی تیرو پشک</span>
            <button
              onClick={() => setLocalSettings({ ...localSettings, enabled: !localSettings.enabled })}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                localSettings.enabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'
              }`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${
                localSettings.enabled ? 'right-0.5' : 'left-0.5'
              }`} />
            </button>
          </div>

          {/* Prizes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-black text-slate-900 dark:text-slate-100">خەڵاتەکان</span>
              <button
                onClick={addPrize}
                className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition"
              >
                <Plus className="w-3.5 h-3.5" /> خەڵاتی نوێ
              </button>
            </div>

            {localSettings.prizes.map((prize) => (
              <div key={prize.id} className={`p-3 rounded-xl space-y-2 ${prizeRingColor(prize.rank)}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {prizeIcon(prize.rank)}
                    <input
                      value={prize.label}
                      onChange={(e) => updatePrize(prize.id, 'label', e.target.value)}
                      className="text-xs font-black bg-transparent border-b border-slate-300 dark:border-slate-600 focus:outline-none text-slate-900 dark:text-white w-32"
                    />
                  </div>
                  <button onClick={() => removePrize(prize.id)} className="text-rose-500 hover:text-rose-700">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block mb-0.5">جۆری خەڵات</label>
                    <select
                      value={prize.type}
                      onChange={(e) => updatePrize(prize.id, 'type', e.target.value)}
                      className="w-full text-xs px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold focus:outline-none text-slate-900 dark:text-white"
                    >
                      <option value="free_wash">شوردنی خاوەن</option>
                      <option value="cash">پارەی کاش</option>
                      <option value="discount">داشکاندن</option>
                      <option value="custom">تر</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block mb-0.5">
                      {prize.type === 'cash' ? 'بڕ (IQD)' : prize.type === 'discount' ? 'ڕێژە (٪)' : 'ژمارە'}
                    </label>
                    <input
                      type="number"
                      value={prize.value}
                      onChange={(e) => updatePrize(prize.id, 'value', Number(e.target.value))}
                      className="w-full text-xs px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono font-bold focus:outline-none text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold block mb-0.5">وردەکاری</label>
                  <input
                    value={prize.description || ''}
                    onChange={(e) => updatePrize(prize.id, 'description', e.target.value)}
                    placeholder="وردەکاری خەڵات..."
                    className="w-full text-xs px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Save */}
          <button
            onClick={handleSaveSettings}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl flex items-center justify-center gap-2 text-sm transition"
          >
            <Save className="w-4 h-4" />
            پاشەکەوت بکە
          </button>
        </div>
      )}
    </div>
  );
};
