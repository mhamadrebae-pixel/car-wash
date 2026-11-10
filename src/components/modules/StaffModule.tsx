'use client';

import React, { useState } from 'react';
import { StaffMember, StaffDeduction, AbsentRecord, Vehicle, WashRecord, AppSettings } from '@/types';
import { PlateDisplay } from '@/components/ui/PlateDisplay';
import { formatIQD, normalizeDigits } from '@/lib/storage';
import {
  Users,
  Plus,
  Trash2,
  Calendar,
  AlertTriangle,
  Clock,
  Archive,
  RotateCcw,
  Edit,
  UserCheck,
  UserX,
  Briefcase,
  Phone,
  FileText,
  Award,
  TrendingUp,
  DollarSign,
  Car,
  Printer,
  Sparkles,
  ChevronLeft,
  X,
  CheckCircle2,
} from 'lucide-react';

interface StaffModuleProps {
  staff: StaffMember[];
  vehicles?: Vehicle[];
  settings?: AppSettings;
  onUpdateStaff: (staff: StaffMember[]) => void;
  onNotify: (msg: string) => void;
}

export const StaffModule: React.FC<StaffModuleProps> = ({
  staff,
  vehicles = [],
  settings,
  onUpdateStaff,
  onNotify,
}) => {
  // Tabs: Active staff vs Archived staff
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [timeframe, setTimeframe] = useState<'today' | 'this_month' | 'all'>('today');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [absenceModalStaff, setAbsenceModalStaff] = useState<StaffMember | null>(null);
  const [deductionModalStaff, setDeductionModalStaff] = useState<StaffMember | null>(null);
  const [historyModalStaff, setHistoryModalStaff] = useState<StaffMember | null>(null);
  const [paySlipModalStaff, setPaySlipModalStaff] = useState<StaffMember | null>(null);

  // Form states for Add/Edit
  const [name, setName] = useState('');
  const [role, setRole] = useState('وەستای سەرەکی و پۆلیش');
  const [phone, setPhone] = useState('');
  const [salaryType, setSalaryType] = useState<'monthly' | 'daily'>('monthly');
  const [baseSalary, setBaseSalary] = useState('');
  const [commissionType, setCommissionType] = useState<'fixed' | 'percentage' | 'none'>('fixed');
  const [commissionValue, setCommissionValue] = useState('2000');
  const [workHours, setWorkHours] = useState('08:00 AM - 06:00 PM');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  // Absence form states
  const [absentDate, setAbsentDate] = useState(new Date().toISOString().split('T')[0]);
  const [absentReason, setAbsentReason] = useState('نەخۆش بوو');

  // Deduction form states
  const [deductionAmount, setDeductionAmount] = useState('');
  const [deductionReason, setDeductionReason] = useState('');

  // Open Edit Modal
  const handleOpenEdit = (worker: StaffMember) => {
    setEditingStaff(worker);
    setName(worker.name);
    setRole(worker.role);
    setPhone(worker.phone);
    setSalaryType(worker.salaryType);
    setBaseSalary(worker.baseSalary.toString());
    setCommissionType(worker.commissionType || 'fixed');
    setCommissionValue(worker.commissionValue !== undefined ? worker.commissionValue.toString() : '2000');
    setWorkHours(worker.workHours || '08:00 AM - 06:00 PM');
    setStartDate(worker.startDate || new Date().toISOString().split('T')[0]);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff || !name || !baseSalary) return;

    const updated = staff.map((w) => {
      if (w.id === editingStaff.id) {
        return {
          ...w,
          name,
          role,
          phone: normalizeDigits(phone),
          salaryType,
          baseSalary: Number(normalizeDigits(baseSalary)) || 0,
          commissionType,
          commissionValue: Number(normalizeDigits(commissionValue)) || 0,
          workHours,
          startDate,
        };
      }
      return w;
    });

    onUpdateStaff(updated);
    setEditingStaff(null);
    onNotify('زانیارییەکانی وەستا بە سەرکەوتوویی نوێکرانەوە.');
  };

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !baseSalary) return;

    const newWorker: StaffMember = {
      id: `staff-${Date.now()}`,
      name,
      role,
      phone: normalizeDigits(phone),
      salaryType,
      baseSalary: Number(normalizeDigits(baseSalary)) || 0,
      commissionType,
      commissionValue: Number(normalizeDigits(commissionValue)) || 0,
      workHours: workHours || '08:00 AM - 06:00 PM',
      startDate: startDate || new Date().toISOString().split('T')[0],
      status: 'active',
      absentRecords: [],
      deductions: [],
    };

    const updated = [...staff, newWorker];
    onUpdateStaff(updated);
    setShowAddModal(false);
    setName('');
    setPhone('');
    setBaseSalary('');
    setCommissionType('fixed');
    setCommissionValue('2000');
    onNotify(`وەستای نوێ (${name}) بە سەرکەوتوویی تۆمارکرا.`);
  };

  // Add Specific Absent Day
  const handleAddAbsentDay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!absenceModalStaff || !absentDate) return;

    const newAbs: AbsentRecord = {
      id: `abs-${Date.now()}`,
      date: absentDate,
      reason: absentReason || 'ئامادەنەبوو',
    };

    const updated = staff.map((w) => {
      if (w.id === absenceModalStaff.id) {
        const existingAbs = Array.isArray(w.absentRecords) ? w.absentRecords : [];
        return {
          ...w,
          absentRecords: [newAbs, ...existingAbs],
        };
      }
      return w;
    });

    onUpdateStaff(updated);
    setAbsenceModalStaff(null);
    onNotify('ڕۆژی نەهاتوو لەسەر مێژووی وەستاکە تۆمارکرا.');
  };

  // Delete Absent Day record
  const handleDeleteAbsentDay = (workerId: string, absentId: string) => {
    const updated = staff.map((w) => {
      if (w.id === workerId) {
        const existingAbs = Array.isArray(w.absentRecords) ? w.absentRecords : [];
        return {
          ...w,
          absentRecords: existingAbs.filter((a) => a.id !== absentId),
        };
      }
      return w;
    });
    onUpdateStaff(updated);
    onNotify('تۆماری نەهاتنەکە سڕایەوە.');
  };

  // Add penalty / deduction
  const handleAddDeduction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deductionModalStaff || !deductionAmount) return;

    const newDed: StaffDeduction = {
      id: `ded-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      amount: Number(normalizeDigits(deductionAmount)) || 0,
      reason: deductionReason || 'غەرامەی سەرپێچی یان هەڵە',
    };

    const updated = staff.map((w) => {
      if (w.id === deductionModalStaff.id) {
        const existingDeds = Array.isArray(w.deductions) ? w.deductions : [];
        return {
          ...w,
          deductions: [newDed, ...existingDeds],
        };
      }
      return w;
    });

    onUpdateStaff(updated);
    setDeductionModalStaff(null);
    setDeductionAmount('');
    setDeductionReason('');
    onNotify('غەرامە و لێبڕین لەسەر وەستاکە تۆمارکرا.');
  };

  // Archive staff member (moves to archive instead of deleting)
  const handleArchiveStaff = (worker: StaffMember) => {
    if (confirm(`دڵنیایت لە ئەرشیفکردنی وەستا (${worker.name})؟ هەموو زانیاری و مێژووەکەی دەچێتە ئەرشیف.`)) {
      const updated = staff.map((w) => {
        if (w.id === worker.id) {
          return {
            ...w,
            status: 'archived' as const,
            endDate: new Date().toISOString().split('T')[0],
          };
        }
        return w;
      });
      onUpdateStaff(updated);
      onNotify(`وەستا (${worker.name}) گوازرایەوە بۆ بەشی ئەرشیف.`);
    }
  };

  // Restore from archive
  const handleRestoreStaff = (worker: StaffMember) => {
    const updated = staff.map((w) => {
      if (w.id === worker.id) {
        return {
          ...w,
          status: 'active' as const,
          endDate: undefined,
        };
      }
      return w;
    });
    onUpdateStaff(updated);
    onNotify(`وەستا (${worker.name}) گەڕێندرایەوە بۆ کارمەندانی چالاک.`);
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const thisMonthStr = new Date().toISOString().slice(0, 7);

  // Helper to extract washes and commissions for a worker
  const getWorkerWashes = (worker: StaffMember) => {
    const list: {
      vehicle: Vehicle;
      wash: WashRecord;
      commission: number;
      date: string;
    }[] = [];

    (vehicles || []).forEach((v) => {
      (v.washHistory || []).forEach((w) => {
        if (w.staffId === worker.id || w.staffName === worker.name) {
          let comm = w.workerCommission;
          if (comm === undefined || comm === null) {
            if (worker.commissionType === 'percentage') {
              const pct = worker.commissionValue !== undefined ? worker.commissionValue : 25;
              comm = Math.round(((w.price || 0) * pct) / 100);
            } else if (worker.commissionType === 'none') {
              comm = 0;
            } else {
              comm = worker.commissionValue !== undefined ? worker.commissionValue : 2000;
            }
          }
          list.push({
            vehicle: v,
            wash: w,
            commission: comm,
            date: w.date || '',
          });
        }
      });
    });

    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const getFilteredWashes = (worker: StaffMember, tf: 'today' | 'this_month' | 'all') => {
    const all = getWorkerWashes(worker);
    if (tf === 'today') return all.filter((x) => x.date.startsWith(todayStr));
    if (tf === 'this_month') return all.filter((x) => x.date.startsWith(thisMonthStr));
    return all;
  };

  // Performance calculations for all active staff
  const activeStaffList = (staff || []).filter((w) => (w?.status || 'active') === 'active');
  const staffStatsMap = activeStaffList.map((worker) => {
    const washes = getFilteredWashes(worker, timeframe);
    const count = washes.length;
    const commission = washes.reduce((sum, x) => sum + x.commission, 0);
    const revenue = washes.reduce((sum, x) => sum + (x.wash.price || 0), 0);
    return {
      worker,
      count,
      commission,
      revenue,
    };
  });

  const totalPeriodCars = staffStatsMap.reduce((sum, s) => sum + s.count, 0);
  const totalPeriodCommissions = staffStatsMap.reduce((sum, s) => sum + s.commission, 0);
  const topPerformer = [...staffStatsMap].sort((a, b) => b.count - a.count)[0];

  const filteredStaff = (staff || []).filter((w) => (w?.status || 'active') === activeTab);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              بەڕێوەبردنی وەستاکان، کاتی کار، نەهاتن و ئەرشیف
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              دەستکاریکردنی زانیاری، دیاریکردنی کاتی دەوام، تۆماری ڕۆژانی نەهاتوو، و ئەرشیفکردنی ستاف.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Active / Archive Toggle */}
          <div className="flex p-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'active'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              وەستاکانی ئێستا ({(staff || []).filter((w) => (w?.status || 'active') === 'active').length})
            </button>
            <button
              onClick={() => setActiveTab('archived')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                activeTab === 'archived'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Archive className="w-3.5 h-3.5" />
              ئەرشیفکراوەکان ({(staff || []).filter((w) => w?.status === 'archived').length})
            </button>
          </div>

          {activeTab === 'active' && (
            <button
              onClick={() => {
                setName('');
                setPhone('');
                setBaseSalary('');
                setShowAddModal(true);
              }}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              زیادکردنی وەستا
            </button>
          )}
        </div>
      </div>

      {/* Commission Leaderboard & Metric Bar */}
      {activeTab === 'active' && activeStaffList.length > 0 && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/40 rounded-3xl p-5 text-white shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-800/40 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white">تەختی بەرهەم و عەمولەی وەستاکان (Commission Board)</h3>
                <p className="text-[10px] text-slate-400">چاودێری ڕاستەوخۆی سەیارە شۆردراوەکان و شایستەی دارایی وەستاکان</p>
              </div>
            </div>

            {/* Timeframe Filter Pills */}
            <div className="flex p-1 bg-slate-800/80 rounded-xl border border-slate-700/60 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setTimeframe('today')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  timeframe === 'today'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ئەمڕۆ
              </button>
              <button
                type="button"
                onClick={() => setTimeframe('this_month')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  timeframe === 'this_month'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ئەم مانگە
              </button>
              <button
                type="button"
                onClick={() => setTimeframe('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  timeframe === 'all'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                گشتی (هەموو کات)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Top Performer Card */}
            <div className="p-3.5 bg-indigo-900/30 border border-indigo-700/40 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  وەستای پلەی یەکەم (Top Star)
                </span>
                <h4 className="text-sm font-black text-white mt-0.5">
                  {topPerformer && topPerformer.count > 0 ? topPerformer.worker.name : 'هێشتا دیاری نەکراوە'}
                </h4>
                <p className="text-[10px] text-slate-300 font-mono mt-0.5">
                  {topPerformer && topPerformer.count > 0 ? `${topPerformer.count} سەیارە • ${formatIQD(topPerformer.commission)} عەمولە` : 'سەیارەی نوێ بشۆن تا لێرە دەربکەوێت'}
                </p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center text-xl shrink-0">
                🏆
              </div>
            </div>

            {/* Total Washed Cars */}
            <div className="p-3.5 bg-slate-800/40 border border-slate-700/50 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400">کۆی سەیارە شۆردراوەکان</span>
                <h4 className="text-base font-black text-white font-mono mt-0.5">
                  {totalPeriodCars} <span className="text-xs font-normal text-slate-400">سەیارە</span>
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  لە {timeframe === 'today' ? 'ئەمڕۆدا' : timeframe === 'this_month' ? 'ئەم مانگەدا' : 'سەرەتای کارکردنەوە'}
                </p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
                <Car className="w-5 h-5" />
              </div>
            </div>

            {/* Total Commissions Paid */}
            <div className="p-3.5 bg-slate-800/40 border border-slate-700/50 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-400">کۆی عەمولەی شایستە</span>
                <h4 className="text-base font-black text-emerald-400 font-mono mt-0.5">
                  {formatIQD(totalPeriodCommissions)}
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  شایستەی بەرهەمی هەموو وەستاکان
                </p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Staff Cards Grid */}
      {filteredStaff.length === 0 ? (
        <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-xs bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs">
          {activeTab === 'active'
            ? 'هیچ وەستایەکی چالاک نییە. لە دوگمەی سەرەوە وەستای نوێ زیاد بکە.'
            : 'ئەرشیف بەتاڵە؛ هیچ کارمەندێکی پێشوو لە ئەرشیفدا نییە.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredStaff.map((worker) => {
            const isArchived = worker.status === 'archived';
            const absentRecords = Array.isArray(worker.absentRecords) ? worker.absentRecords : [];
            const deductions = Array.isArray(worker.deductions) ? worker.deductions : [];
            const baseSalary = Number(worker.baseSalary) || 0;

            const workerWashes = getFilteredWashes(worker, timeframe);
            const periodCarsCount = workerWashes.length;
            const periodCommission = workerWashes.reduce((sum, x) => sum + x.commission, 0);

            // Calculations
            const totalDeductionsAmount = deductions.reduce(
              (sum, d) => sum + (Number(d?.amount) || 0),
              0
            );
            const dailyRate =
              worker.salaryType === 'monthly'
                ? Math.round(baseSalary / 30)
                : baseSalary;

            const totalAbsentCut = absentRecords.length * dailyRate;
            const netSalary = Math.max(0, baseSalary + periodCommission - totalDeductionsAmount - totalAbsentCut);
            const isTop = topPerformer && topPerformer.count > 0 && topPerformer.worker.id === worker.id;

            return (
              <div
                key={worker.id}
                className={`bg-white dark:bg-slate-900 border rounded-3xl p-5 sm:p-6 shadow-xs hover:shadow-md space-y-4 relative overflow-hidden flex flex-col justify-between transition-all group ${
                  isTop && !isArchived
                    ? 'border-amber-300 dark:border-amber-700/60 ring-2 ring-amber-400/30'
                    : isArchived
                    ? 'border-amber-200 dark:border-amber-800/60 bg-amber-50/20 dark:bg-amber-950/20'
                    : 'border-slate-200/80 dark:border-slate-800'
                }`}
              >
                <div className="space-y-3">
                  {/* Card Header & Controls */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-base text-slate-900">
                          {worker.name}
                        </h3>
                        {isTop && !isArchived && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-300 font-bold flex items-center gap-0.5">
                            🏆 یەکەم
                          </span>
                        )}
                        {isArchived && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold">
                            ئەرشیفکراو
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-blue-600 font-bold mt-0.5">{worker.role}</p>
                      <p className="text-[11px] text-slate-400 font-mono pt-0.5">{worker.phone}</p>
                    </div>

                    {!isArchived && (
                      <button
                        onClick={() => handleOpenEdit(worker)}
                        className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 rounded-xl transition"
                        title="دەستکاریکردنی زانیاری"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Performance Highlight Box */}
                  {!isArchived && (
                    <div className="grid grid-cols-2 gap-2 p-2.5 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-200/80 rounded-2xl">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 font-bold block">
                          شۆردراو ({timeframe === 'today' ? 'ئەمڕۆ' : timeframe === 'this_month' ? 'مانگانە' : 'گشتی'}):
                        </span>
                        <strong className="text-xs font-mono font-black text-blue-700 flex items-center gap-1 mt-0.5">
                          <Car className="w-3.5 h-3.5" />
                          {periodCarsCount} سەیارە
                        </strong>
                      </div>
                      <div className="text-left">
                        <span className="text-[10px] text-slate-500 font-bold block">عەمولەی بەرهەم:</span>
                        <strong className="text-xs font-mono font-black text-emerald-700 mt-0.5 block">
                          +{formatIQD(periodCommission)}
                        </strong>
                      </div>
                    </div>
                  )}

                  {/* Work Hours and Period info */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-[11px] space-y-1.5 font-medium">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-slate-500 flex items-center gap-1 font-bold">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        کاتی دەوام:
                      </span>
                      <strong className="text-slate-900 font-mono">{worker.workHours || '08:00 AM - 06:00 PM'}</strong>
                    </div>

                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-slate-500 flex items-center gap-1 font-bold">
                        <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                        ماوەی کارکردن:
                      </span>
                      <span className="font-mono text-slate-700">
                        {isArchived ? (
                          <span>لە {worker.startDate} بۆ {worker.endDate || 'ئێستا'}</span>
                        ) : (
                          <span>دەستپێکردن: {worker.startDate}</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Salary Summary */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs space-y-2 font-medium">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-bold">
                        مووچە ({worker.salaryType === 'monthly' ? 'مانگانە' : 'ڕۆژانە'}):
                      </span>
                      <strong className="text-slate-900 font-mono font-bold">{formatIQD(baseSalary)}</strong>
                    </div>

                    <div className="flex justify-between text-emerald-700 bg-emerald-50/80 p-2 rounded-xl border border-emerald-200/60 font-bold">
                      <span className="flex items-center gap-1">
                        <Award className="w-3.5 h-3.5" />
                        عەمولەی سەیارە ({periodCarsCount} سەیارە):
                      </span>
                      <strong className="font-mono font-black">+{formatIQD(periodCommission)}</strong>
                    </div>

                    <div className="flex justify-between text-rose-600">
                      <span className="font-bold">ڕۆژانی نەهاتوو ({absentRecords.length} ڕۆژ):</span>
                      <strong className="font-mono font-bold">- {formatIQD(totalAbsentCut)}</strong>
                    </div>

                    <div className="flex justify-between text-amber-700">
                      <span className="font-bold">غەرامە و سزا ({deductions.length}):</span>
                      <strong className="font-mono font-bold">- {formatIQD(totalDeductionsAmount)}</strong>
                    </div>

                    <div className="flex justify-between text-blue-700 text-[11px]">
                      <span className="font-bold">مۆدێلی عەمولە:</span>
                      <strong className="font-mono font-bold">
                        {worker.commissionType === 'percentage'
                          ? `${worker.commissionValue || 25}٪ لە نرخی شۆردن`
                          : worker.commissionType === 'none'
                          ? 'بێ عەمولە'
                          : `${formatIQD(worker.commissionValue !== undefined ? worker.commissionValue : 2000)} / سەیارە`}
                      </strong>
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-sm">
                      <span className="text-emerald-700 font-extrabold">کۆی شایستەی وەرگیراو:</span>
                      <span className="text-emerald-700 font-mono font-black">{formatIQD(netSalary)}</span>
                    </div>
                  </div>

                  {/* Specific Absence History */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-600 font-bold flex items-center gap-1">
                        <UserX className="w-3.5 h-3.5 text-red-500" />
                        مێژووی نەهاتنەکان ({absentRecords.length})
                      </span>
                      {!isArchived && (
                        <button
                          onClick={() => {
                            setAbsenceModalStaff(worker);
                            setAbsentDate(new Date().toISOString().split('T')[0]);
                          }}
                          className="text-[10px] text-blue-600 hover:text-blue-700 font-bold"
                        >
                          + تۆمارکردنی ڕۆژ
                        </button>
                      )}
                    </div>

                    {absentRecords.length === 0 ? (
                      <p className="text-[10px] text-slate-400 italic">هیچ ڕۆژێک نائامادە نەبووە ✓</p>
                    ) : (
                      <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                        {absentRecords.map((abs) => (
                          <div
                            key={abs.id}
                            className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] flex items-center justify-between text-slate-700"
                          >
                            <div>
                              <span className="font-mono font-bold text-red-600">{abs.date}</span>
                              <span className="text-slate-500 mr-2">({abs.reason || 'نەهاتوو'})</span>
                            </div>
                            {!isArchived && (
                              <button
                                onClick={() => handleDeleteAbsentDay(worker.id, abs.id)}
                                className="text-slate-400 hover:text-red-600 p-0.5"
                                title="سڕینەوە"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-2">
                  {!isArchived ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setHistoryModalStaff(worker)}
                        className="flex-1 min-w-[95px] py-2 px-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1"
                        title="بینینی لیستی ئەو سەیارانەی ئەم وەستایە شۆردوونی"
                      >
                        <Car className="w-3.5 h-3.5 text-blue-600" />
                        سەیارەکان ({periodCarsCount})
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaySlipModalStaff(worker)}
                        className="flex-1 min-w-[95px] py-2 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1"
                        title="دروستکردن و چاپکردنی پسوولەی مووچە و عەمولە"
                      >
                        <Printer className="w-3.5 h-3.5 text-emerald-600" />
                        پسوولەی حیساب
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setDeductionModalStaff(worker);
                          setDeductionAmount('');
                          setDeductionReason('');
                        }}
                        className="py-2 px-2.5 bg-slate-100 hover:bg-amber-50 hover:text-amber-700 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1"
                        title="دانانی غەرامە"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                        غەرامە
                      </button>

                      <button
                        type="button"
                        onClick={() => handleArchiveStaff(worker)}
                        className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition"
                        title="ئەرشیفکردن"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleRestoreStaff(worker)}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      گەڕاندنەوە لە ئەرشیف بۆ چالاک
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-slate-900 dark:text-white">
            <h3 className="font-black text-lg text-slate-900">تۆمارکردنی وەستای نوێ</h3>

            <form onSubmit={handleAddStaff} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-700 block mb-1 font-bold">ناوی وەستا:</label>
                <input
                  type="text"
                  required
                  placeholder="وەک: وەستا ڕێبوار"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-bold">ڕۆڵ و پسپۆڕی:</label>
                <input
                  type="text"
                  placeholder="وەستای کەفڕێژ، وەستای پۆلیش، هتد"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1 font-bold">ژمارەی مۆبایل:</label>
                  <input
                    type="text"
                    placeholder="0770XXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="text-slate-700 block mb-1 font-bold">کاتی کارکردن (دەوام):</label>
                  <input
                    type="text"
                    value={workHours}
                    onChange={(e) => setWorkHours(e.target.value)}
                    placeholder="08:00 AM - 06:00 PM"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1 font-bold">شێوازی مووچە:</label>
                  <select
                    value={salaryType}
                    onChange={(e) => setSalaryType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-medium"
                  >
                    <option value="monthly">مانگانە</option>
                    <option value="daily">ڕۆژانە</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 block mb-1 font-bold">بڕی مووچە (IQD):</label>
                  <input
                    type="number"
                    required
                    placeholder="نموونە: 500000"
                    value={baseSalary}
                    onChange={(e) => setBaseSalary(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>
              </div>

              {/* Commission per wash */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-blue-50/70 border border-blue-200/60 rounded-xl">
                <div>
                  <label className="text-blue-950 block mb-1 font-bold text-xs">جۆری عەمولە بۆ هەر سەیارەیەک:</label>
                  <select
                    value={commissionType}
                    onChange={(e) => setCommissionType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-medium text-xs"
                  >
                    <option value="fixed">بڕی دیاریکراو (دینار بۆ هەر سەیارەیەک)</option>
                    <option value="percentage">ڕێژەی لەسەدا (% لە نرخی شۆردن)</option>
                    <option value="none">بێ عەمولە (تەنها مووچە)</option>
                  </select>
                </div>

                <div>
                  <label className="text-blue-950 block mb-1 font-bold text-xs">
                    {commissionType === 'percentage' ? 'ڕێژەی عەمولە (%):' : 'بڕی عەمولە (دینار):'}
                  </label>
                  <input
                    type="number"
                    disabled={commissionType === 'none'}
                    placeholder={commissionType === 'percentage' ? 'نموونە: 25' : 'نموونە: 2000'}
                    value={commissionValue}
                    onChange={(e) => setCommissionValue(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 rounded-xl text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-500 font-medium text-xs disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-bold">بەرواری دەستپێکردنی کار:</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl transition shadow-md shadow-blue-500/20"
                >
                  پاشەکەوتکردن
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                >
                  داخستن
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {editingStaff && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-slate-900 dark:text-white">
            <h3 className="font-black text-lg text-slate-900">
              دەستکاریکردنی زانیاری: {editingStaff.name}
            </h3>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-700 block mb-1 font-bold">ناوی وەستا:</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-bold">ڕۆڵ و پسپۆڕی:</label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1 font-bold">ژمارەی مۆبایل:</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="text-slate-700 block mb-1 font-bold">کاتی کارکردن (دەوام):</label>
                  <input
                    type="text"
                    value={workHours}
                    onChange={(e) => setWorkHours(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1 font-bold">شێوازی مووچە:</label>
                  <select
                    value={salaryType}
                    onChange={(e) => setSalaryType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-medium"
                  >
                    <option value="monthly">مانگانە</option>
                    <option value="daily">ڕۆژانە</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 block mb-1 font-bold">بڕی مووچە (IQD):</label>
                  <input
                    type="number"
                    required
                    value={baseSalary}
                    onChange={(e) => setBaseSalary(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>
              </div>

              {/* Commission per wash */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-blue-50/70 border border-blue-200/60 rounded-xl">
                <div>
                  <label className="text-blue-950 block mb-1 font-bold text-xs">جۆری عەمولە بۆ هەر سەیارەیەک:</label>
                  <select
                    value={commissionType}
                    onChange={(e) => setCommissionType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-medium text-xs"
                  >
                    <option value="fixed">بڕی دیاریکراو (دینار بۆ هەر سەیارەیەک)</option>
                    <option value="percentage">ڕێژەی لەسەدا (% لە نرخی شۆردن)</option>
                    <option value="none">بێ عەمولە (تەنها مووچە)</option>
                  </select>
                </div>

                <div>
                  <label className="text-blue-950 block mb-1 font-bold text-xs">
                    {commissionType === 'percentage' ? 'ڕێژەی عەمولە (%):' : 'بڕی عەمولە (دینار):'}
                  </label>
                  <input
                    type="number"
                    disabled={commissionType === 'none'}
                    placeholder={commissionType === 'percentage' ? 'نموونە: 25' : 'نموونە: 2000'}
                    value={commissionValue}
                    onChange={(e) => setCommissionValue(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 rounded-xl text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-500 font-medium text-xs disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-bold">بەرواری دەستپێکردنی کار لای ئێمە:</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl transition shadow-md shadow-blue-500/20"
                >
                  پاشەکەوتکردنی گۆڕانکارییەکان
                </button>
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                >
                  داخستن
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Absence Day Modal */}
      {absenceModalStaff && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-slate-900 dark:text-white">
            <h3 className="font-black text-lg text-slate-900">
              تۆمارکردنی ڕۆژی نەهاتوو بۆ: {absenceModalStaff.name}
            </h3>

            <form onSubmit={handleAddAbsentDay} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-700 block mb-1 font-bold">ئەو بەروارەی نەهاتووە:</label>
                <input
                  type="date"
                  required
                  value={absentDate}
                  onChange={(e) => setAbsentDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-500 text-sm font-medium"
                />
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-bold">هۆکاری نەهاتن:</label>
                <input
                  type="text"
                  required
                  placeholder="وەک: نەخۆش بوو، مۆڵەت بوو، بەبێ ئاگاداری..."
                  value={absentReason}
                  onChange={(e) => setAbsentReason(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition shadow-md shadow-rose-500/20"
                >
                  تۆمارکردن
                </button>
                <button
                  type="button"
                  onClick={() => setAbsenceModalStaff(null)}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                >
                  داخستن
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Deduction / Penalty Modal */}
      {deductionModalStaff && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-slate-900 dark:text-white">
            <h3 className="font-black text-lg text-slate-900">
              دانانی غەرامە / لێبڕین بۆ: {deductionModalStaff.name}
            </h3>

            <form onSubmit={handleAddDeduction} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-700 block mb-1 font-bold">بڕی غەرامە (IQD):</label>
                <input
                  type="number"
                  required
                  placeholder="نموونە: 15000"
                  value={deductionAmount}
                  onChange={(e) => setDeductionAmount(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-500 text-sm font-medium"
                />
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-bold">هۆکاری غەرامە یان لێبڕین:</label>
                <input
                  type="text"
                  required
                  placeholder="وەک: شکاندنی شتێک، دواکەوتن، بەفیڕۆدان..."
                  value={deductionReason}
                  onChange={(e) => setDeductionReason(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition shadow-md shadow-rose-500/20"
                >
                  تۆمارکردنی غەرامە
                </button>
                <button
                  type="button"
                  onClick={() => setDeductionModalStaff(null)}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                >
                  داخستن
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Washes History Log Modal for Worker */}
      {historyModalStaff && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl text-slate-900 dark:text-white max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    مێژووی سەیارەکانی: {historyModalStaff.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    لیستی سەیارە شۆردراوەکان • {timeframe === 'today' ? 'ئەمڕۆ' : timeframe === 'this_month' ? 'ئەم مانگە' : 'گشتی'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setHistoryModalStaff(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-2 pr-1">
              {(() => {
                const washes = getFilteredWashes(historyModalStaff, timeframe);
                if (washes.length === 0) {
                  return (
                    <div className="text-center py-12 text-slate-400 text-xs font-medium space-y-2">
                      <Car className="w-8 h-8 mx-auto text-slate-300 stroke-1" />
                      <p>هیچ سەیارەیەک لەم ماوەیەدا بۆ ئەم وەستایە تۆمار نەکراوە!</p>
                    </div>
                  );
                }
                return washes.map((item, idx) => (
                  <div
                    key={`${item.wash.id}-${idx}`}
                    className="p-3 bg-slate-50 hover:bg-blue-50/50 border border-slate-200/80 rounded-2xl flex items-center justify-between gap-3 text-xs transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-700 font-mono font-bold flex items-center justify-center text-xs shrink-0">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{item.vehicle.carModel} • {item.vehicle.ownerName}</div>
                        <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2 mt-0.5">
                          <span>{new Date(item.date).toLocaleDateString('ku')}</span>
                          <span>{new Date(item.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                          <span className="text-blue-600 font-bold">• {item.wash.serviceName}</span>
                          <span className="text-slate-600 font-bold">• {formatIQD(item.wash.price)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <PlateDisplay plate={item.vehicle.plate} size="sm" />
                      <div className="text-left font-mono shrink-0">
                        <div className="text-[10px] text-slate-400 font-sans">عەمولە:</div>
                        <div className="font-extrabold text-emerald-700 text-xs">+{formatIQD(item.commission)}</div>
                      </div>
                    </div>
                  </div>
                ));
              })()}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              {(() => {
                const washes = getFilteredWashes(historyModalStaff, timeframe);
                const totalComm = washes.reduce((sum, x) => sum + x.commission, 0);
                return (
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-slate-600">
                      کۆی سەیارەکان: <strong className="text-slate-900 font-mono text-sm">{washes.length}</strong>
                    </span>
                    <span className="font-bold text-slate-600">
                      کۆی عەمولە: <strong className="text-emerald-700 font-mono text-sm">{formatIQD(totalComm)}</strong>
                    </span>
                  </div>
                );
              })()}
              <button
                type="button"
                onClick={() => setHistoryModalStaff(null)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
              >
                داخستن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Worker Pay Slip Modal */}
      {paySlipModalStaff && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-slate-900 dark:text-white">
            {/* Printable Voucher Card */}
            <div id="worker-payslip" className="border-2 border-slate-900/80 rounded-2xl p-5 space-y-4 font-sans bg-white shadow-xs">
              {/* Header */}
              <div className="text-center border-b-2 border-dashed border-slate-300 pb-3">
                <h3 className="font-black text-base text-slate-900">
                  {settings?.carWashName || 'غەسلی شاژنی ئۆتۆمبێل (Royal Car Wash)'}
                </h3>
                <p className="text-[11px] text-slate-500 font-bold mt-0.5">پسوولەی وەرگرتنی مووچە و عەمولەی کارمەند</p>
                <div className="text-[10px] text-slate-400 font-mono mt-1">
                  بەرواری بڕین: {new Date().toLocaleDateString('ku')} • {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              {/* Worker Info */}
              {(() => {
                const washes = getFilteredWashes(paySlipModalStaff, timeframe);
                const periodCarsCount = washes.length;
                const periodCommission = washes.reduce((sum, x) => sum + x.commission, 0);
                const baseSalary = Number(paySlipModalStaff.baseSalary) || 0;
                const absentRecords = Array.isArray(paySlipModalStaff.absentRecords) ? paySlipModalStaff.absentRecords : [];
                const deductions = Array.isArray(paySlipModalStaff.deductions) ? paySlipModalStaff.deductions : [];
                const totalDeductionsAmount = deductions.reduce((sum, d) => sum + (Number(d?.amount) || 0), 0);
                const dailyRate = paySlipModalStaff.salaryType === 'monthly' ? Math.round(baseSalary / 30) : baseSalary;
                const totalAbsentCut = absentRecords.length * dailyRate;
                const netSalary = Math.max(0, baseSalary + periodCommission - totalDeductionsAmount - totalAbsentCut);

                return (
                  <>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-bold">ناوی کارمەند:</span>
                        <strong className="text-slate-900 font-extrabold">{paySlipModalStaff.name}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-bold">پێگە و ڕۆڵ:</span>
                        <span className="text-slate-700">{paySlipModalStaff.role}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-bold">ماوەی حیساب:</span>
                        <span className="text-blue-700 font-bold">
                          {timeframe === 'today' ? 'حیسابی ئەمڕۆ' : timeframe === 'this_month' ? 'حیسابی ئەم مانگە' : 'حیسابی گشتی'}
                        </span>
                      </div>
                    </div>

                    {/* Breakdown */}
                    <div className="space-y-1.5 text-xs pt-1 border-t border-slate-200">
                      <div className="flex justify-between">
                        <span className="text-slate-600 font-bold">مووچەی بنەڕەتی ({paySlipModalStaff.salaryType === 'monthly' ? 'مانگانە' : 'ڕۆژانە'}):</span>
                        <strong className="font-mono text-slate-900">{formatIQD(baseSalary)}</strong>
                      </div>
                      <div className="flex justify-between text-emerald-700 font-bold bg-emerald-50/50 p-1.5 rounded-lg border border-emerald-200/50">
                        <span>عەمولەی بەرهەم ({periodCarsCount} سەیارە):</span>
                        <strong className="font-mono">+{formatIQD(periodCommission)}</strong>
                      </div>
                      {totalAbsentCut > 0 && (
                        <div className="flex justify-between text-rose-600">
                          <span>لێبڕینی نەهاتن ({absentRecords.length} ڕۆژ):</span>
                          <strong className="font-mono">-{formatIQD(totalAbsentCut)}</strong>
                        </div>
                      )}
                      {totalDeductionsAmount > 0 && (
                        <div className="flex justify-between text-amber-700">
                          <span>غەرامە و سزا ({deductions.length}):</span>
                          <strong className="font-mono">-{formatIQD(totalDeductionsAmount)}</strong>
                        </div>
                      )}

                      <div className="pt-2 border-t-2 border-slate-900 flex justify-between items-center text-sm">
                        <span className="font-black text-slate-900">کۆی شایستەی پاکتاوکراو:</span>
                        <span className="font-black font-mono text-emerald-700 text-base">{formatIQD(netSalary)}</span>
                      </div>
                    </div>

                    {/* Signatures */}
                    <div className="pt-6 grid grid-cols-2 gap-4 text-center text-[10px] text-slate-500 border-t border-dashed border-slate-200">
                      <div>
                        <div className="h-9 border-b border-slate-400 mb-1" />
                        <span>واژۆی کارمەند (وەرگر)</span>
                      </div>
                      <div>
                        <div className="h-9 border-b border-slate-400 mb-1" />
                        <span>واژۆی بەڕێوەبەر / کاشێر</span>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Modal Actions */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20"
              >
                <Printer className="w-4 h-4" />
                چاپکردنی پسوولە
              </button>
              <button
                type="button"
                onClick={() => setPaySlipModalStaff(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
              >
                داخستن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
