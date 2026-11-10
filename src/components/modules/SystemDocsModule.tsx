'use client';

import React, { useState, useEffect } from 'react';
import { RoadmapItem } from '@/types';
import { getSavedRoadmap, saveRoadmap } from '@/lib/storage';
import {
  BookOpen,
  Sparkles,
  CheckCircle2,
  Clock,
  Video,
  MessageSquare,
  Cpu,
  Plus,
  Trash2,
  Check,
  Edit,
  Tag,
  StickyNote,
} from 'lucide-react';

export const SystemDocsModule: React.FC = () => {
  const [roadmap, setRoadmap] = useState<RoadmapItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Roadmap Item Form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetVersion, setTargetVersion] = useState('v2.0.0');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    setRoadmap(getSavedRoadmap());
  }, []);

  const handleToggleCompleted = (id: string) => {
    const updated = roadmap.map((item) => {
      if (item.id === id) {
        return { ...item, completed: !item.completed };
      }
      return item;
    });
    setRoadmap(updated);
    saveRoadmap(updated);
  };

  const handleAddRoadmapItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    const newItem: RoadmapItem = {
      id: `road-${Date.now()}`,
      title,
      description,
      targetVersion: targetVersion || 'v2.0.0',
      completed: false,
      notes,
      createdAt: new Date().toISOString().split('T')[0],
    };

    const updated = [newItem, ...roadmap];
    setRoadmap(updated);
    saveRoadmap(updated);
    setShowAddModal(false);

    setTitle('');
    setDescription('');
    setNotes('');
  };

  const handleDeleteItem = (id: string) => {
    if (confirm('دڵنیایت لە سڕینەوەی ئەم بڕگەیە لە نەخشەی داهاتوو؟')) {
      const updated = roadmap.filter((i) => i.id !== id);
      setRoadmap(updated);
      saveRoadmap(updated);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto" dir="rtl">
      {/* Studio Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">ڕێبەری فەرمی و نەخشەی کارکردن</h2>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-bold">
                Docs & Roadmap
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              تەواوی تایبەتمەندییە چالاکەکانی سیستەم لەگەڵ نەخشەی کارکردنی داهاتوو (Roadmap).
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          زیادکردنی بیرۆکەی نوێ
        </button>
      </div>

      {/* Version 1.0.0 Features Overview */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-5">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            تایبەتمەندییە چالاکەکانی ئەم ڤێرژنە (v1.0.0)
          </h3>
          <span className="text-xs px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-full font-mono font-bold">
            چالاکە
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50/70 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 rounded-2xl space-y-2">
            <span className="font-bold text-slate-900 dark:text-white block">١. تابلۆی فەرمی عێراق و کوردستان</span>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              پشتگیری تابلۆی نوێ بە هەموو کۆدەکانی (21 سلێمانی، 22 هەولێر، 23 هەڵەبجە، 24 دهۆک، 25 کەرکووک، 11 بەغداد...) هاوشانی تابلۆ کۆنەکان.
            </p>
          </div>

          <div className="p-4 bg-slate-50/70 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 rounded-2xl space-y-2">
            <span className="font-bold text-slate-900 dark:text-white block">٢. لۆیەڵتی ٤ + ١ شۆردنی بەخۆڕایی (Free)</span>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              سیستەمەکە شۆردنی ٥ـەم دەیکاتە 0 دینار، لەگەڵ بەستەری جامی پێشەوە و یاسای بەسەرچوون دوای ١٥ ڕۆژ.
            </p>
          </div>

          <div className="p-4 bg-slate-50/70 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 rounded-2xl space-y-2">
            <span className="font-bold text-slate-900 dark:text-white block">٣. وەستاکان، کاتی دەوام، نەهاتن و ئەرشیف</span>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              دەستکاریکردنی زانیاری، دیاریکردنی کاتی کارکردن، تۆمارکردنی ڕۆژانی نەهاتوو بە هۆکارەوە، و ئەرشیفکردنی ستاف.
            </p>
          </div>

          <div className="p-4 bg-slate-50/70 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 rounded-2xl space-y-2">
            <span className="font-bold text-slate-900 dark:text-white block">٤. شاشەی تەلەفزیۆن (/tv) و پسوولەی کاشێر</span>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              شاشەی ژووری دانیشتن بۆ نیشاندانی قۆناغی سەیارەکان بە قەبارەی گەورە لەگەڵ پرینتی پسوولەی 80mm.
            </p>
          </div>

          <div className="p-4 bg-slate-50/70 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 rounded-2xl space-y-2">
            <span className="font-bold text-slate-900 dark:text-white block">٥. پۆرتاڵی تایبەتی خاوەن سەیارە و کامێرای لایڤ</span>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              کۆدی نهێنی (PIN) بۆ خاوەن سەیارە، پشکنینی دۆخی گەیشتن بە غەسل، مێژووی شۆردن، و کامێرای لایڤی هۆڵەکە لە مۆبایلەوە.
            </p>
          </div>

          <div className="p-4 bg-slate-50/70 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 rounded-2xl space-y-2">
            <span className="font-bold text-indigo-700 dark:text-indigo-400 block">٦. فراوانبوونی خزمەتگوزارییەکان (فەرش، قەنەفە، پۆڵیش)</span>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              سیستەمەکە بەتەواوی ئامادەیە بۆ وەرگرتنی شۆردنی فەرش بە مەتر دووجا، قەنەفە و مۆبیلیات بە هەڵم، و پۆڵیش و نانۆ سێرامیکی ئۆتۆمبێل بە یەکە و پسوولەی جیاواز.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Future Roadmap with Add & Note capability */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-6">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              نەخشەی کارکردن بۆ داهاتوو (پێشنیار، تێبینی و بیرۆکەکان)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              دەتوانیت هەر بیرۆکە و پلانێکی ترت هەبوو لێرە زیادی بکەیت لەگەڵ تێبینییەکانت.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-1.5 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            بیرۆکەی نوێ
          </button>
        </div>

        {/* Roadmap Items List */}
        <div className="space-y-3">
          {roadmap.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-2xl border transition-all ${
                item.completed
                  ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                  : 'bg-slate-50/70 dark:bg-slate-800/70 border-slate-200/80 dark:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleCompleted(item.id)}
                      className={`w-5 h-5 rounded-lg border flex items-center justify-center transition shrink-0 cursor-pointer ${
                        item.completed
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-transparent hover:border-slate-400 dark:hover:border-slate-500'
                      }`}
                      title="گۆڕینی دۆخ (جێبەجێکراو / لە چاوەڕوانیدا)"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>

                    <h4
                      className={`font-bold text-sm text-slate-900 dark:text-white ${
                        item.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''
                      }`}
                    >
                      {item.title}
                    </h4>

                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-mono font-bold">
                      {item.targetVersion}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pr-7">
                    {item.description}
                  </p>

                  {/* Notes Callout */}
                  {item.notes && (
                    <div className="mr-7 p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-2">
                      <StickyNote className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-900 dark:text-white block">تێبینی تایبەت:</strong>
                        <span>{item.notes}</span>
                      </div>
                    </div>
                  )}

                  <div className="pr-7 text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                    بەرواری دانان: {item.createdAt}
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition shrink-0 cursor-pointer"
                  title="سڕینەوە"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Roadmap Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-slate-900 dark:text-white">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              زیادکردنی بیرۆکە یان پلانی نوێ بۆ داهاتوو
            </h3>

            <form onSubmit={handleAddRoadmapItem} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1">ناونیشانی بیرۆکە یان تایبەتمەندی:</label>
                <input
                  type="text"
                  required
                  placeholder="وەک: بەستنەوەی کامێرای ژیری دەستکرد، ئۆفەری وەرزی..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                />
              </div>

              <div>
                <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1">وەسف و چۆنیەتی کارکردن:</label>
                <textarea
                  rows={3}
                  required
                  placeholder="ڕوونکردنەوە لەسەر ئەوەی ئەم تایبەتمەندییە چی دەکات..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                />
              </div>

              <div>
                <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1">ڤێرژنی پێشبینیکراو:</label>
                <input
                  type="text"
                  placeholder="v2.0.0 یان قۆناغی دووەم"
                  value={targetVersion}
                  onChange={(e) => setTargetVersion(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1">تێبینی و پێداویستییەکان (Notes):</label>
                <input
                  type="text"
                  placeholder="کەرەستەی پێویست، تێچوو، ڕێنمایی تایبەت..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition shadow-xs cursor-pointer"
                >
                  زیادکردن بۆ نەخشەی کار
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition cursor-pointer"
                >
                  داخستن
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
