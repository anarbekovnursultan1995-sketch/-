/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { StudentProfile, AnonymousLeaderboardEntry } from '../types/index.ts';
import { fetchAnonymousLeaderboard } from '../services/api.ts';
import { 
  Trophy, 
  Award, 
  Medal, 
  ShieldCheck, 
  Sparkles, 
  ArrowUpRight, 
  BookOpen, 
  FileText, 
  HelpCircle, 
  ChevronRight,
  Crown,
  Flame,
  CheckCircle2,
  Users
} from 'lucide-react';

interface LeaderboardProps {
  currentUser: StudentProfile | null;
  onStartTest?: () => void;
  onStartEssay?: () => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  currentUser,
  onStartTest,
  onStartEssay,
}) => {
  const [entries, setEntries] = useState<AnonymousLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [gradeFilter, setGradeFilter] = useState<'all' | '9' | '10'>('all');
  const [showFormulaModal, setShowFormulaModal] = useState(false);
  const [currentUserRank, setCurrentUserRank] = useState<number | undefined>();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchAnonymousLeaderboard({
          grade: gradeFilter,
          currentUserId: currentUser?.id,
        });
        setEntries(data.leaderboard || []);
        setCurrentUserRank(data.currentUserRank);
      } catch (err) {
        console.error('Error fetching anonymous leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [gradeFilter, currentUser?.id]);

  const currentUserEntry = entries.find(e => e.isCurrentUser);
  const top1 = entries[0];
  const top2 = entries[1];
  const top3 = entries[2];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 animate-in fade-in">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center space-x-1">
                <Trophy className="w-3.5 h-3.5" />
                <span>Олимпиадалық рейтинг</span>
              </span>
              <span className="text-xs text-slate-400">• Қатысушылар: {entries.length} оқушы</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Көшбасшылар тақтасы
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Қазақстан тарихынан республикалық пәндік олимпиадаға дайындық тобының жинақтаған рейтингтік ұпайлары бойынша жалпы көрсеткіштер кестесі.
            </p>
          </div>

          <button
            onClick={() => setShowFormulaModal(true)}
            className="px-4 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-amber-400 rounded-2xl text-xs font-semibold flex items-center space-x-2 transition self-start sm:self-auto cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Ұпай формуласы</span>
          </button>
        </div>

        {/* Privacy Shield Notice */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-start space-x-2.5 text-xs text-emerald-400/90 leading-relaxed">
          <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>
            <strong>Құпиялылық қорғалған:</strong> Платформа ережесіне сай қатысушылардың жеке басы (аты-жөні, поштасы, мектебі) басқаларға құпия сақталып, арнайы тарихи лақап аттар (бүркеншік есімдер) қолданылады. Сіз өз нәтижеңіз бен нақты орныңызды көре аласыз.
          </span>
        </div>
      </div>

      {/* Current User Standings Card (if student logged in) */}
      {currentUser && (
        <div className="bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/30 rounded-3xl p-5 sm:p-6 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-mono font-black text-2xl text-amber-400 shadow-inner">
                {currentUserRank ? `#${currentUserRank}` : '—'}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold text-white">{currentUser.name}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950">
                    Сіздің орныңыз
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {currentUser.grade}-сынып {currentUser.city && `• ${currentUser.city}`} • Рейтингте {entries.length} қатысушының ішінде
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 self-end sm:self-auto">
              <div className="text-right">
                <div className="text-xl font-black text-amber-400 font-mono">
                  {currentUserEntry?.ratingPoints || 0}
                </div>
                <div className="text-[11px] text-slate-400">Рейтинг ұпайы</div>
              </div>

              {onStartTest && (
                <button
                  onClick={onStartTest}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center space-x-1 cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Тест бастау</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Grade Selector Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex space-x-2">
          <button
            onClick={() => setGradeFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              gradeFilter === 'all'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Барлық сыныптар
          </button>
          <button
            onClick={() => setGradeFilter('9')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              gradeFilter === '9'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            9-сынып
          </button>
          <button
            onClick={() => setGradeFilter('10')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              gradeFilter === '10'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            10-сынып
          </button>
        </div>

        <span className="text-xs text-slate-500 hidden sm:block">
          Автоматты есептелген нәтижелер
        </span>
      </div>

      {/* Top 3 Podium Cards */}
      {!loading && entries.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* 2nd Place */}
          {top2 && (
            <div className={`p-6 rounded-3xl border flex flex-col justify-between space-y-4 relative order-2 md:order-1 ${
              top2.isCurrentUser 
                ? 'bg-slate-900 border-amber-500/50 ring-1 ring-amber-500/30' 
                : 'bg-slate-900/80 border-slate-800'
            }`}>
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-lg font-mono border border-slate-700">
                  2
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  Күміс лига
                </span>
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-white text-base truncate flex items-center gap-1.5">
                  <span>{top2.alias}</span>
                  {top2.isCurrentUser && (
                    <span className="text-[10px] bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded font-bold">Сіз</span>
                  )}
                </h3>
                <p className="text-xs text-slate-400">{top2.grade}-сынып • {top2.city}</p>
              </div>
              <div className="pt-3 border-t border-slate-800/80 flex items-baseline justify-between">
                <span className="text-xs text-slate-400">Орташа: {top2.averageTestScore}%</span>
                <span className="text-2xl font-black text-slate-200 font-mono">{top2.ratingPoints} <span className="text-xs text-slate-400 font-normal">ұпай</span></span>
              </div>
            </div>
          )}

          {/* 1st Place - Champion */}
          {top1 && (
            <div className={`p-6 sm:p-7 rounded-3xl border-2 flex flex-col justify-between space-y-4 relative order-1 md:order-2 shadow-xl ${
              top1.isCurrentUser 
                ? 'bg-gradient-to-b from-amber-500/20 to-slate-900 border-amber-400' 
                : 'bg-slate-900 border-amber-500/60'
            }`}>
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xl font-mono shadow-lg">
                  <Crown className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Алтын лига • Лидер
                </span>
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-white text-lg truncate flex items-center gap-1.5">
                  <span>{top1.alias}</span>
                  {top1.isCurrentUser && (
                    <span className="text-xs bg-amber-500 text-slate-950 px-2 py-0.5 rounded font-bold">Сіз</span>
                  )}
                </h3>
                <p className="text-xs text-amber-300/80">{top1.grade}-сынып • {top1.city} • {top1.testsCompleted} тест орындалды</p>
              </div>
              <div className="pt-3 border-t border-slate-800 flex items-baseline justify-between">
                <span className="text-xs text-slate-400">Үздік тест: {top1.bestTestScore}%</span>
                <span className="text-3xl font-black text-amber-400 font-mono">{top1.ratingPoints} <span className="text-xs text-amber-300 font-normal">ұпай</span></span>
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {top3 && (
            <div className={`p-6 rounded-3xl border flex flex-col justify-between space-y-4 relative order-3 ${
              top3.isCurrentUser 
                ? 'bg-slate-900 border-amber-500/50 ring-1 ring-amber-500/30' 
                : 'bg-slate-900/80 border-slate-800'
            }`}>
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-amber-900/40 text-amber-400 flex items-center justify-center font-bold text-lg font-mono border border-amber-800/50">
                  3
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-950 text-amber-400 border border-amber-800/40">
                  Қола лига
                </span>
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-white text-base truncate flex items-center gap-1.5">
                  <span>{top3.alias}</span>
                  {top3.isCurrentUser && (
                    <span className="text-[10px] bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded font-bold">Сіз</span>
                  )}
                </h3>
                <p className="text-xs text-slate-400">{top3.grade}-сынып • {top3.city}</p>
              </div>
              <div className="pt-3 border-t border-slate-800/80 flex items-baseline justify-between">
                <span className="text-xs text-slate-400">Орташа: {top3.averageTestScore}%</span>
                <span className="text-2xl font-black text-amber-300 font-mono">{top3.ratingPoints} <span className="text-xs text-slate-400 font-normal">ұпай</span></span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Roster List */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="text-base font-bold text-white">Жалпы рейтингтік кесте</h3>
          <span className="text-xs text-slate-400">
            Барлық қатысушылар: <strong className="text-white">{entries.length}</strong>
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            Рейтингтік деректер жүктелуде...
          </div>
        ) : entries.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            Бұл санатта әзірге қатысушылар жоқ.
          </div>
        ) : (
          <div className="space-y-2.5">
            {entries.map(entry => {
              const isTop3 = entry.rank <= 3;
              const isFirst = entry.rank === 1;

              return (
                <div
                  key={entry.rank}
                  className={`p-4 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                    entry.isCurrentUser
                      ? 'bg-amber-500/10 border-amber-500/40 ring-1 ring-amber-500/30'
                      : 'bg-slate-950/80 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-3.5">
                    {/* Rank Number Pill */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-bold text-sm flex-shrink-0 ${
                      isFirst
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : entry.rank === 2
                        ? 'bg-slate-700 text-white'
                        : entry.rank === 3
                        ? 'bg-amber-900/60 text-amber-200'
                        : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}>
                      #{entry.rank}
                    </div>

                    {/* Alias and Details */}
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-semibold text-white">
                          {entry.alias}
                        </span>
                        {entry.isCurrentUser && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950">
                            Сіз
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                          entry.league === 'gold'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            : entry.league === 'silver'
                            ? 'bg-slate-800 text-slate-300 border-slate-700'
                            : entry.league === 'bronze'
                            ? 'bg-amber-900/30 text-amber-400 border-amber-800/40'
                            : 'bg-slate-900 text-slate-400 border-slate-800'
                        }`}>
                          {entry.league === 'gold'
                            ? 'Алтын'
                            : entry.league === 'silver'
                            ? 'Күміс'
                            : entry.league === 'bronze'
                            ? 'Қола'
                            : 'Үміткер'}
                        </span>
                      </div>
                      <div className="text-slate-400 flex items-center space-x-2 mt-0.5">
                        <span>{entry.grade}-сынып</span>
                        <span>•</span>
                        <span>{entry.city}</span>
                        <span>•</span>
                        <span>{entry.testsCompleted} тест тапсырылды</span>
                        {entry.essaysGraded > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-sky-400">{entry.essaysGraded} эссе тексерілді</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Score & Metrics */}
                  <div className="flex items-center space-x-6 self-end sm:self-auto">
                    <div className="text-right">
                      <div className="text-xs text-slate-400">Орташа тест:</div>
                      <div className="font-mono font-bold text-white text-xs">
                        {entry.averageTestScore}%
                      </div>
                    </div>

                    <div className="text-right min-w-[80px]">
                      <div className="text-base font-extrabold text-amber-400 font-mono">
                        {entry.ratingPoints}
                      </div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-tight">ұпай</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Formula Modal */}
      {showFormulaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 sm:p-7 shadow-2xl space-y-4">
            <div className="flex items-center space-x-2.5 text-amber-400">
              <Trophy className="w-5 h-5" />
              <h3 className="text-base font-bold text-white">Олимпиадалық рейтинг ұпайы қалай есептеледі?</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Рейтинг ұпайы оқушының Қазақстан тарихы курсын қаншалықты жан-жақты меңгергенін бағалайтын республикалық олимпиадалық алгоритмге негізделген:
            </p>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                <div className="font-bold text-amber-300 flex items-center space-x-1.5">
                  <BookOpen className="w-4 h-4" />
                  <span>1. Тестілеу блогы:</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Орташа нәтиже × 10 (мысалы 90% = 900 ұпай) + әрбір аяқталған тестке қосылатын 20 бонус ұпай.
                </p>
              </div>

              <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                <div className="font-bold text-sky-300 flex items-center space-x-1.5">
                  <FileText className="w-4 h-4" />
                  <span>2. Тарихи эссе блогы:</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Жетекші бағалаған әрбір эсседен жиналған ұпай × 20 (мысалы 24 балл = 480 ұпай).
                </p>
              </div>

              <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                <div className="font-bold text-emerald-300 flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>3. Құпиялылық және этика:</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Оқушылар бір-бірінің жеке қателіктерін көрмейді, тек өз орны мен жалпы деңгейлік өсімін бақылай алады.
                </p>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setShowFormulaModal(false)}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Түсіндім
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
