/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Question, TestResult } from '../types/index.ts';
import { 
  Trophy, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ArrowRight, 
  RotateCcw, 
  BookOpen, 
  Filter, 
  Sparkles,
  HelpCircle
} from 'lucide-react';

interface TestResultsViewProps {
  result: TestResult;
  questions: Question[];
  onRetake: () => void;
  onProceedToEssay: () => void;
}

export const TestResultsView: React.FC<TestResultsViewProps> = ({
  result,
  questions,
  onRetake,
  onProceedToEssay,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'incorrect' | 'correct'>('all');

  const questionMap = new Map<string, Question>();
  questions.forEach(q => questionMap.set(q.id, q));

  const answersList = result.answers || [];

  const filteredAnswers = answersList.filter(ans => {
    if (filterMode === 'incorrect') return !ans.isCorrect;
    if (filterMode === 'correct') return ans.isCorrect;
    return true;
  });

  const incorrectCount = result.totalQuestions - result.correctCount;

  // Formatting duration
  const mins = Math.floor(result.durationSeconds / 60);
  const secs = result.durationSeconds % 60;

  // Olympiad qualification feedback
  const getFeedbackBadge = (pct: number) => {
    if (pct >= 90) {
      return {
        label: 'Республикалық олимпиаданың жүлделі деңгейі! (I-II орын үміткері)',
        color: 'from-amber-500 to-yellow-400 text-slate-950',
      };
    }
    if (pct >= 80) {
      return {
        label: 'Жоғары дайындық деңгейі (Облыстық/Республикалық кезең)',
        color: 'from-emerald-500 to-teal-400 text-slate-950',
      };
    }
    if (pct >= 70) {
      return {
        label: 'Жақсы нәтиже (Қателермен жұмыс істеу ұсынылады)',
        color: 'from-blue-500 to-indigo-400 text-white',
      };
    }
    return {
      label: 'Қосымша қайталауды талап етеді',
      color: 'from-rose-500 to-amber-500 text-white',
    };
  };

  const badge = getFeedbackBadge(result.scorePercentage);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 animate-in fade-in">
      {/* Primary Result Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 text-center md:text-left">
            <span className={`inline-flex items-center text-xs font-extrabold px-3 py-1 rounded-full bg-gradient-to-r ${badge.color} shadow-sm`}>
              <Trophy className="w-3.5 h-3.5 mr-1.5" />
              {badge.label}
            </span>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Тест аяқталды: {result.correctCount} / {result.totalQuestions}
            </h1>
            <p className="text-slate-400 text-sm max-w-xl">
              Қазақстан тарихы республикалық олимпиадасына дайындық тесті сәтті тапсырылды. Төменде әр сұрақтың толық тарихи түсіндірмесімен таныса аласыз.
            </p>
          </div>

          {/* Big Score Gauge */}
          <div className="flex flex-col items-center justify-center p-6 bg-slate-950/80 rounded-2xl border border-slate-800 min-w-[200px]">
            <div className="text-5xl font-black text-amber-400 font-mono tracking-tight">
              {result.scorePercentage}%
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Уақыт: {mins} мин {secs} сек</span>
            </div>
          </div>
        </div>

        {/* Action CTAs */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
          <button
            onClick={onProceedToEssay}
            className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold rounded-xl text-sm transition shadow-lg flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>2-кезең: Тарихи эссе жазуға өту</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>

          <button
            onClick={onRetake}
            className="w-full sm:w-auto px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium rounded-xl text-sm transition border border-slate-700 flex items-center justify-center space-x-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Жаңа тест тапсыру</span>
          </button>
        </div>
      </div>

      {/* Grade and Period Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* By Grade */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>Сыныптар бойынша дәлдік (5-10 сынып):</span>
          </h3>
          <div className="space-y-2.5">
            {([5, 6, 7, 8, 9, 10] as const).map(gr => {
              const data = result.gradeBreakdown?.[gr] || { total: 0, correct: 0 };
              const pct = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
              return (
                <div key={gr} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-medium">{gr}-сынып курсы</span>
                    <span className="font-mono text-slate-400">
                      <strong className="text-white">{data.correct}</strong> / {data.total} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* By Historical Period */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
            <Trophy className="w-4 h-4 text-emerald-400" />
            <span>Тарихи дәуірлер бойынша талдау:</span>
          </h3>
          <div className="space-y-2.5">
            {[
              { key: 'ancient', name: 'Ежелгі дәуір (Сақ, Ғұн, Үйсін)' },
              { key: 'medieval', name: 'Орта ғасырлар (Түрік қағанаты, Алтын Орда)' },
              { key: 'kazakh_khanate', name: 'Қазақ хандығы дәуірі (Хандар мен заңдар)' },
              { key: 'national_liberation', name: 'Ұлт-азаттық көтерілістер (XVIII-XIX ғғ.)' },
              { key: 'alash_soviet', name: 'Алаш қозғалысы, 1916 ж., Кеңес және ҰОС' },
              { key: 'independent_kazakhstan', name: 'Желтоқсан және Тәуелсіз Қазақстан' },
            ].map(per => {
              const data = result.periodBreakdown?.[per.key as keyof typeof result.periodBreakdown] || {
                total: 0,
                correct: 0,
              };
              const pct = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
              return (
                <div key={per.key} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 truncate max-w-[240px]">{per.name}</span>
                    <span className="font-mono text-slate-400">
                      <strong className="text-white">{data.correct}</strong> / {data.total} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Question by Question Detailed Historical Review */}
      <div className="space-y-4">
        {/* Review Toolbar & Filter */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center space-x-2 text-sm font-bold text-white">
            <Filter className="w-4 h-4 text-amber-400" />
            <span>Сұрақтарды талдау мен тарихи түсіндірмелер:</span>
          </div>

          <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                filterMode === 'all'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Барлығы ({result.totalQuestions})
            </button>
            <button
              onClick={() => setFilterMode('incorrect')}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center space-x-1 ${
                filterMode === 'incorrect'
                  ? 'bg-rose-500/20 text-rose-300 font-semibold border border-rose-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <XCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>Қате жауаптар ({incorrectCount})</span>
            </button>
            <button
              onClick={() => setFilterMode('correct')}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center space-x-1 ${
                filterMode === 'correct'
                  ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Дұрыс ({result.correctCount})</span>
            </button>
          </div>
        </div>

        {/* Answers List */}
        <div className="space-y-4">
          {filteredAnswers.map((item, idx) => {
            const q = questionMap.get(item.questionId);
            if (!q) return null;

            const isCorrect = item.isCorrect;
            const userPick = item.selectedAnswer;
            const correctPick = q.correctAnswer;

            return (
              <div
                key={item.questionId || idx}
                className={`bg-slate-900 border rounded-2xl p-5 sm:p-6 shadow-sm transition space-y-4 ${
                  isCorrect ? 'border-slate-800' : 'border-rose-900/60 bg-rose-950/10'
                }`}
              >
                {/* Header: Status and Metadata */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`inline-flex items-center text-xs font-bold px-2.5 py-0.5 rounded-md ${
                        isCorrect
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {isCorrect ? (
                        <>
                          <CheckCircle className="w-3.5 h-3.5 mr-1" /> Дұрыс жауап
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5 mr-1" /> Қате жауап
                        </>
                      )}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">{q.grade}-сынып</span>
                    <span className="text-xs text-slate-500">•</span>
                    <span className="text-xs text-amber-400/80 font-medium truncate max-w-[200px]">
                      {q.topic}
                    </span>
                  </div>
                </div>

                {/* Question */}
                <h4 className="text-base sm:text-lg font-semibold text-white leading-relaxed">
                  {q.question}
                </h4>

                {/* Options List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {q.options.map((optText, optIdx) => {
                    const isUserChoice = userPick === optIdx;
                    const isRightOption = correctPick === optIdx;
                    const letter = ['A', 'B', 'C', 'D', 'E'][optIdx] || String.fromCharCode(65 + optIdx);

                    let style = 'bg-slate-950/60 border-slate-800 text-slate-400';
                    let badgeColor = 'bg-slate-800 text-slate-400';

                    if (isRightOption) {
                      style = 'bg-emerald-500/15 border-emerald-500/60 text-emerald-200 font-medium';
                      badgeColor = 'bg-emerald-500 text-slate-950 font-bold';
                    } else if (isUserChoice && !isCorrect) {
                      style = 'bg-rose-500/15 border-rose-500/60 text-rose-200 font-medium line-through';
                      badgeColor = 'bg-rose-500 text-white font-bold';
                    }

                    return (
                      <div
                        key={optIdx}
                        className={`p-3 rounded-xl border flex items-center space-x-2.5 text-xs sm:text-sm ${style}`}
                      >
                        <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs flex-shrink-0 ${badgeColor}`}>
                          {letter}
                        </span>
                        <span className="flex-grow">{optText}</span>
                        {isRightOption && <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                        {isUserChoice && !isCorrect && <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />}
                      </div>
                    );
                  })}
                </div>

                {/* Academic Historical Explanation Box */}
                <div className="bg-slate-950 border border-amber-500/20 rounded-xl p-4 text-xs sm:text-sm space-y-1.5">
                  <div className="font-bold text-amber-400 flex items-center space-x-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>Тарихи түсіндірме және анықтама:</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    {q.explanation}
                  </p>
                  {q.sourceOrEra && (
                    <div className="text-[11px] text-slate-500 pt-1">
                      Тарихи дереккөз: {q.sourceOrEra}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
