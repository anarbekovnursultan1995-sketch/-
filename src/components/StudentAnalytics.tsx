/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { StudentProfile, TestResult, EssaySubmission } from '../types/index.ts';
import { fetchStudentTests, fetchStudentEssays } from '../services/api.ts';
import { calculateStudentRating } from '../utils/olympiad-logic.ts';
import { 
  BarChart3, 
  Award, 
  Clock, 
  ShieldCheck, 
  FileText, 
  CheckCircle,
  TrendingUp,
  Sparkles,
  Calendar,
  Edit3,
  ArrowUpRight,
  Target,
  Activity,
  ChevronRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Dot
} from 'recharts';

interface StudentAnalyticsProps {
  currentUser: StudentProfile;
  onOpenTest: () => void;
  onOpenEditProfile?: () => void;
  onOpenLeaderboard?: () => void;
}

export const StudentAnalytics: React.FC<StudentAnalyticsProps> = ({
  currentUser,
  onOpenTest,
  onOpenEditProfile,
  onOpenLeaderboard,
}) => {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [essays, setEssays] = useState<EssaySubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [testsRes, essaysRes] = await Promise.all([
          fetchStudentTests(currentUser.id),
          fetchStudentEssays(currentUser.id),
        ]);
        setTests(testsRes.tests || []);
        setEssays(essaysRes.essays || []);
      } catch (e) {
        console.error('Error loading student analytics:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentUser.id]);

  const testScores = tests.map(t => t.scorePercentage);
  const gradedEssays = essays.filter(e => e.status === 'graded' && typeof e.score === 'number');
  const essayScores = gradedEssays.map(e => e.score!);

  const avgTest = testScores.length > 0 ? Math.round(testScores.reduce((a, b) => a + b, 0) / testScores.length) : 0;
  const bestTest = testScores.length > 0 ? Math.max(...testScores) : 0;
  const ratingPoints = calculateStudentRating(testScores, essayScores);

  // Chronological sort for the progress chart (oldest to newest)
  const chronologicalTests = [...tests].sort(
    (a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
  );

  const initialScore = chronologicalTests.length > 0 ? chronologicalTests[0].scorePercentage : 0;
  const latestScore = chronologicalTests.length > 0 ? chronologicalTests[chronologicalTests.length - 1].scorePercentage : 0;
  const scoreDelta = latestScore - initialScore;

  const chartData = chronologicalTests.map((t, idx) => {
    const d = new Date(t.completedAt);
    const dateLabel = isNaN(d.getTime()) 
      ? `#${idx + 1}` 
      : d.toLocaleDateString('kk-KZ', { month: 'short', day: 'numeric' });
    const mins = Math.floor((t.durationSeconds || 0) / 60);
    const secs = (t.durationSeconds || 0) % 60;
    return {
      testNum: idx + 1,
      name: `Тест #${idx + 1}`,
      shortDate: dateLabel,
      fullDate: isNaN(d.getTime()) ? 'Күні белгісіз' : d.toLocaleDateString('kk-KZ', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      score: t.scorePercentage,
      correct: t.correctCount,
      total: t.totalQuestions,
      duration: `${mins} мин ${secs} сек`,
    };
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 animate-in fade-in">
      {/* Student Profile Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Оқушының жеке дайындық кабинеті
              </span>
              <span className="text-xs text-slate-300 font-bold">• {currentUser.grade}-сынып</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {currentUser.name}
              </h1>
              {onOpenEditProfile && (
                <button
                  onClick={onOpenEditProfile}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
                  title="Аты-жөні, сыныбы, мектебін өзгерту"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Деректерді өңдеу</span>
                </button>
              )}
            </div>
            <p className="text-slate-400 text-xs sm:text-sm">
              {currentUser.school || 'Қазақстан тарихынан олимпиадалық топ'} {currentUser.city && `• ${currentUser.city}`}
            </p>
          </div>

          {/* Rating Points Card */}
          <div className="flex flex-col items-center justify-center p-5 bg-slate-950 rounded-2xl border border-slate-800 min-w-[180px]">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>Рейтинг ұпайы</span>
            </span>
            <div className="text-4xl font-extrabold text-amber-400 font-mono mt-1">
              {ratingPoints}
            </div>
            <span className="text-[11px] text-slate-500 mt-0.5">
              Тесттер + Тарихи эссе
            </span>
            {onOpenLeaderboard && (
              <button
                onClick={onOpenLeaderboard}
                className="mt-2.5 px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 border border-amber-500/30 rounded-xl text-[11px] font-semibold flex items-center space-x-1 transition cursor-pointer"
              >
                <span>Рейтингті көру</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Privacy Note Banner */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center space-x-2 text-xs text-emerald-400/90">
          <ShieldCheck className="w-4 h-4 flex-shrink-0" />
          <span>
            Құпиялылық кепілі: Сіздің барлық нәтижелеріңіз, қателеріңіз және эсселеріңіз құпия сақталады және тек жетекшіңізге ғана көрінеді.
          </span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm">
          <div className="text-xs text-slate-400 font-medium">Орындалған тесттер</div>
          <div className="text-2xl font-bold text-white mt-1">{tests.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">{tests.length * 50} сұрақ шешілді</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm">
          <div className="text-xs text-slate-400 font-medium">Орташа тест нәтижесі</div>
          <div className="text-2xl font-bold text-amber-400 mt-1 font-mono">{avgTest}%</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Жалпы орташа көрсеткіш</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm">
          <div className="text-xs text-slate-400 font-medium">Ең жоғары нәтиже</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1 font-mono">{bestTest}%</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Үздік тест көрсеткіші</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm">
          <div className="text-xs text-slate-400 font-medium">Тапсырылған эсселер</div>
          <div className="text-2xl font-bold text-sky-400 mt-1">{essays.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">{gradedEssays.length} бағаланды</div>
        </div>
      </div>

      {/* Visual Progress Chart Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-white">Дайындық динамикасы және нәтижелер графигі</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Әрбір тапсырылған тест нәтижесінің уақыт бойынша өсу сызығы
            </p>
          </div>

          {/* Quick trajectory delta badges */}
          {tests.length > 1 && (
            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center space-x-2 text-xs">
                <span className="text-slate-400">Өсім қарқыны:</span>
                <span className={`font-mono font-bold flex items-center ${
                  scoreDelta > 0 
                    ? 'text-emerald-400' 
                    : scoreDelta === 0 
                    ? 'text-slate-300' 
                    : 'text-rose-400'
                }`}>
                  {scoreDelta > 0 ? `+${scoreDelta}%` : `${scoreDelta}%`}
                  {scoreDelta > 0 && <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />}
                </span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center space-x-1.5">
                <Target className="w-3.5 h-3.5" />
                <span>Меже: 80%+</span>
              </div>
            </div>
          )}
        </div>

        {/* Recharts Progress Chart */}
        {chartData.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center mx-auto text-amber-400">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="text-sm font-semibold text-white">Әзірге тест нәтижелері жоқ</div>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Алғашқы олимпиадалық тестті тапсырған соң, осы жерде нәтижеңіздің өсу бағыты мен графигі автоматты түрде салынады.
            </p>
            <button
              onClick={onOpenTest}
              className="mt-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Алғашқы тестті тапсыру
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="h-64 sm:h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 12, right: 16, left: -20, bottom: 4 }}
                >
                  <defs>
                    <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis 
                    dataKey="shortDate" 
                    stroke="#475569" 
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    tickLine={false}
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    stroke="#475569" 
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    tickLine={false}
                    ticks={[0, 20, 40, 60, 80, 100]}
                    unit="%"
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const item = payload[0].payload;
                        return (
                          <div className="bg-slate-950/95 border border-slate-700/80 rounded-2xl p-3.5 shadow-2xl text-xs space-y-2 backdrop-blur-md min-w-[200px]">
                            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                              <span className="font-bold text-white flex items-center space-x-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                <span>{item.name}</span>
                              </span>
                              <span className={`px-2 py-0.5 rounded-lg font-mono font-bold text-xs ${
                                item.score >= 80 
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                                  : item.score >= 60 
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              }`}>
                                {item.score}%
                              </span>
                            </div>
                            <div className="space-y-1 text-slate-300 text-[11px]">
                              <div className="flex justify-between">
                                <span className="text-slate-400">Дұрыс жауап:</span>
                                <span className="font-mono font-bold text-white">{item.correct} / {item.total}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Жұмсалған уақыт:</span>
                                <span className="font-mono text-slate-300">{item.duration}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Тапсырылған күні:</span>
                                <span className="text-slate-400">{item.fullDate}</span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <ReferenceLine 
                    y={80} 
                    stroke="#10b981" 
                    strokeDasharray="4 4" 
                    strokeWidth={1.5}
                    label={{ 
                      value: '80% Олимпиадалық меже', 
                      fill: '#34d399', 
                      fontSize: 10, 
                      position: 'insideTopRight' 
                    }} 
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#scoreColor)"
                    activeDot={{
                      r: 6,
                      stroke: '#fbbf24',
                      strokeWidth: 2,
                      fill: '#0f172a'
                    }}
                    dot={{
                      r: 4,
                      stroke: '#f59e0b',
                      strokeWidth: 2,
                      fill: '#0f172a'
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {chartData.length === 1 && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-300/90 text-xs flex items-center justify-between">
                <span>
                  Алғашқы тест нәтижеңіз белгіленді! Ұзақ мерзімді өсу сызығын қадағалау үшін келесі тест нұсқасын орындаңыз.
                </span>
                <button
                  onClick={onOpenTest}
                  className="ml-3 px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-[11px] whitespace-nowrap cursor-pointer"
                >
                  2-тестті бастау
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Test Attempts History */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">Тестілеу тарихы мен толық хаттамасы</h3>
          </div>
          <button
            onClick={onOpenTest}
            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition"
          >
            Жаңа тест бастау
          </button>
        </div>

        {tests.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            Әзірге орындалған тесттер жоқ. Күнделікті 50 сұрақтық олимпиадалық тестті бастаңыз!
          </div>
        ) : (
          <div className="space-y-3">
            {tests.map((t, idx) => {
              const mins = Math.floor(t.durationSeconds / 60);
              const secs = t.durationSeconds % 60;
              const dateStr = new Date(t.completedAt).toLocaleDateString('kk-KZ', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={t.id || idx}
                  className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-white font-mono">
                      #{tests.length - idx}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">
                        50 сұрақтық олимпиадалық кешен
                      </div>
                      <div className="text-slate-400 flex items-center space-x-2 mt-0.5">
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          <span>{dateStr}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{mins} мин {secs} сек</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 self-end sm:self-auto">
                    <div className="text-right">
                      <div className="text-sm font-bold text-white font-mono">
                        {t.correctCount} / {t.totalQuestions}
                      </div>
                      <div className="text-[11px] text-slate-400">дұрыс жауап</div>
                    </div>

                    <div
                      className={`px-3 py-1.5 rounded-xl font-bold font-mono text-sm border ${
                        t.scorePercentage >= 80
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : t.scorePercentage >= 60
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      }`}
                    >
                      {t.scorePercentage}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
