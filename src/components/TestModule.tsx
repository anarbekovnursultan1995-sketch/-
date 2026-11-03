/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Question, StudentProfile, TestResult } from '../types/index.ts';
import { fetchOlympiadQuestionSet, fetchVariantQuestionSet, submitTestResult } from '../services/api.ts';
import { calculateTestScore } from '../utils/olympiad-logic.ts';
import { 
  Clock, 
  Flag, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  BookOpen, 
  ArrowRight, 
  Award, 
  Layers 
} from 'lucide-react';
import { CountdownTimer } from './CountdownTimer.tsx';

interface TestModuleProps {
  currentUser: StudentProfile;
  onTestComplete: (result: TestResult, questions: Question[]) => void;
  onProceedToEssay: () => void;
}

export const TestModule: React.FC<TestModuleProps> = ({
  currentUser,
  onTestComplete,
  onProceedToEssay,
}) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [testTitle, setTestTitle] = useState('Күнделікті олимпиадалық кешен');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [qId: string]: number }>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState(60 * 60); // 60 minutes
  const [totalDurationSeconds, setTotalDurationSeconds] = useState(60 * 60);
  const [isTestStarted, setIsTestStarted] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isTimeUpModal, setIsTimeUpModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'daily' | 'official' | 'training' | 'intensive'>('official');

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startDailyTest = async () => {
    setLoadingQuestions(true);
    try {
      const data = await fetchOlympiadQuestionSet(50);
      setQuestions(data.questions);
      setTestTitle('Күнделікті 50 сұрақтық олимпиадалық тест');
      setSelectedAnswers({});
      setFlaggedQuestions(new Set());
      setCurrentIndex(0);
      setTotalDurationSeconds(60 * 60);
      setTimeLeft(60 * 60);
      setIsTimeUpModal(false);
      setIsTestStarted(true);
    } catch (e) {
      console.error('Error fetching questions:', e);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const startVariantTest = async (variantNum: number, isOfficial: boolean) => {
    setLoadingQuestions(true);
    try {
      const data = await fetchVariantQuestionSet(variantNum);
      setQuestions(data.questions);
      setTestTitle(
        isOfficial 
          ? `Ресми олимпиадалық жинақ: ${variantNum}-нұсқа` 
          : `Олимпиадалық жаттығу жинағы: ${variantNum}-нұсқа`
      );
      setSelectedAnswers({});
      setFlaggedQuestions(new Set());
      setCurrentIndex(0);
      setTotalDurationSeconds(60 * 60);
      setTimeLeft(60 * 60);
      setIsTimeUpModal(false);
      setIsTestStarted(true);
    } catch (e) {
      console.error(`Error fetching variant ${variantNum}:`, e);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleTimeUp = () => {
    if (submitting) return;
    setIsTimeUpModal(true);
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeout(() => {
      handleFinalSubmit();
    }, 1200);
  };

  // Timer countdown with Olympiad strict limit
  useEffect(() => {
    if (isTestStarted && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTestStarted, timeLeft]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = (optionIndex: number) => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQ.id]: optionIndex,
    }));
  };

  const toggleFlagCurrent = () => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;
    setFlaggedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(currentQ.id)) {
        next.delete(currentQ.id);
      } else {
        next.add(currentQ.id);
      }
      return next;
    });
  };

  const handleFinalSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const calculation = calculateTestScore(selectedAnswers, questions);
    const duration = Math.max(1, totalDurationSeconds - timeLeft);

    const testPayload: Partial<TestResult> = {
      studentId: currentUser.id,
      studentName: currentUser.name,
      studentEmail: currentUser.email,
      studentGrade: currentUser.grade,
      totalQuestions: questions.length,
      correctCount: calculation.correctCount,
      scorePercentage: calculation.scorePercentage,
      durationSeconds: duration,
      answers: calculation.answersRecord,
      gradeBreakdown: calculation.gradeBreakdown,
      periodBreakdown: calculation.periodBreakdown,
    };

    try {
      const res = await submitTestResult(testPayload);
      onTestComplete(res.test, questions);
    } catch (e) {
      console.error('Error submitting test result:', e);
      // Fallback local calculation
      const fallbackResult: TestResult = {
        ...testPayload,
        id: `test-local-${Date.now()}`,
        completedAt: new Date().toISOString(),
      } as TestResult;
      onTestComplete(fallbackResult, questions);
    } finally {
      setSubmitting(false);
      setShowConfirmModal(false);
    }
  };

  // Keyboard shortcut listener for options (1-5 or A-E)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isTestStarted || showConfirmModal) return;
      if (e.key === '1' || e.key.toLowerCase() === 'a') handleSelectOption(0);
      if (e.key === '2' || e.key.toLowerCase() === 'b') handleSelectOption(1);
      if (e.key === '3' || e.key.toLowerCase() === 'c') handleSelectOption(2);
      if (e.key === '4' || e.key.toLowerCase() === 'd') handleSelectOption(3);
      if (e.key === '5' || e.key.toLowerCase() === 'e') handleSelectOption(4);
      if (e.key === 'ArrowRight' && currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
      }
      if (e.key === 'ArrowLeft' && currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTestStarted, currentIndex, questions, showConfirmModal]);

  const currentQ = questions[currentIndex];
  const answeredCount = Object.keys(selectedAnswers).length;
  const unansweredCount = questions.length - answeredCount;

  // Render: Start Screen
  if (!isTestStarted) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-10 shadow-xl space-y-6">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 mx-auto flex items-center justify-center text-slate-950 shadow-lg">
              <Award className="w-8 h-8" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Қазақстан тарихынан олимпиадалық тестілеу
            </h1>
            <p className="text-slate-400 max-w-2xl mx-auto text-sm sm:text-base">
              Республикалық пәндік олимпиадаға дайындық: 5–10 сынып бағдарламасын толық қамтитын 2 200+ сұрақтан тұратын кешенді база және 10 ресми олимпиадалық нұсқа.
            </p>
          </div>

          {/* Mode Selector Tabs */}
          <div className="flex flex-wrap border-b border-slate-800 text-sm font-medium">
            <button
              onClick={() => setActiveTab('official')}
              className={`pb-3 px-3 sm:px-4 transition border-b-2 flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'official'
                  ? 'border-amber-400 text-amber-300 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Ресми нұсқалар (1–10)</span>
            </button>
            <button
              onClick={() => setActiveTab('training')}
              className={`pb-3 px-3 sm:px-4 transition border-b-2 flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'training'
                  ? 'border-emerald-400 text-emerald-300 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Жаттығу I (11–20)</span>
            </button>
            <button
              onClick={() => setActiveTab('intensive')}
              className={`pb-3 px-3 sm:px-4 transition border-b-2 flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'intensive'
                  ? 'border-sky-400 text-sky-300 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-4 h-4 text-sky-400" />
              <span>Жаттығу II (21–30)</span>
            </button>
            <button
              onClick={() => setActiveTab('daily')}
              className={`pb-3 px-3 sm:px-4 transition border-b-2 flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'daily'
                  ? 'border-amber-400 text-amber-300 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Күнделікті 50 сұрақ</span>
            </button>
          </div>

          {/* TAB 1: 10 Official Variants */}
          {activeTab === 'official' && (
            <div className="space-y-4 pt-2">
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-xs text-amber-200 flex items-start space-x-3">
                <Sparkles className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-amber-300 text-sm font-bold">10 Ресми олимпиадалық нұсқа (Пайдаланушы жинағы)</strong>
                  Әр нұсқада 40 сұрақтан берілген, A, B, C, D, E түрінде бес жауап нұсқасы қамтылған. Ресми жауап кілттері мен тарихи түсіндірмелері толық тексеріліп енгізілген.
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(vNum => (
                  <button
                    key={vNum}
                    onClick={() => startVariantTest(vNum, true)}
                    disabled={loadingQuestions}
                    className="p-4 bg-slate-950 border border-slate-800 hover:border-amber-500/60 hover:bg-slate-800/80 rounded-xl text-center transition group cursor-pointer"
                  >
                    <span className="text-xs text-amber-400 font-bold block mb-1">Ресми үлгі</span>
                    <span className="text-lg font-bold text-white group-hover:text-amber-300 transition">
                      {vNum}-нұсқа
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-1">40 сұрақ • 60 мин</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: Training Variants (11-20) */}
          {activeTab === 'training' && (
            <div className="space-y-4 pt-2">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-xs text-emerald-200">
                <strong className="block text-emerald-300 text-sm font-bold mb-1">Олимпиадалық жаттығу нұсқалары (11-ден 20-нұсқаға дейін)</strong>
                Республикалық олимпиада құрылымына сай 10 негізгі бағытты (археологиядан Тәуелсіздікке дейін) қамтитын қайталанбайтын сұрақтар кешені.
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map(vNum => (
                  <button
                    key={vNum}
                    onClick={() => startVariantTest(vNum, false)}
                    disabled={loadingQuestions}
                    className="p-4 bg-slate-950 border border-slate-800 hover:border-emerald-500/60 hover:bg-slate-800/80 rounded-xl text-center transition group cursor-pointer"
                  >
                    <span className="text-xs text-emerald-400 font-bold block mb-1">Жаттығу I</span>
                    <span className="text-lg font-bold text-white group-hover:text-emerald-300 transition">
                      {vNum}-нұсқа
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-1">40 сұрақ • 60 мин</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Intensive Training Variants (21-30) */}
          {activeTab === 'intensive' && (
            <div className="space-y-4 pt-2">
              <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl p-4 text-xs text-sky-200">
                <strong className="block text-sky-300 text-sm font-bold mb-1">Олимпиадалық интенсив нұсқалары (21-ден 30-нұсқаға дейін)</strong>
                Қазақстан тарихының барлық күрделі тақырыптары мен деректі сұрақтарын қамтитын кеңейтілген олимпиадалық нұсқалар.
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[21, 22, 23, 24, 25, 26, 27, 28, 29, 30].map(vNum => (
                  <button
                    key={vNum}
                    onClick={() => startVariantTest(vNum, false)}
                    disabled={loadingQuestions}
                    className="p-4 bg-slate-950 border border-slate-800 hover:border-sky-500/60 hover:bg-slate-800/80 rounded-xl text-center transition group cursor-pointer"
                  >
                    <span className="text-xs text-sky-400 font-bold block mb-1">Жаттығу II</span>
                    <span className="text-lg font-bold text-white group-hover:text-sky-300 transition">
                      {vNum}-нұсқа
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-1">40 сұрақ • 60 мин</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: Daily 50 Question Mode */}
          {activeTab === 'daily' && (
            <div className="space-y-6 pt-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto text-left">
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400 block">Сұрақ саны</span>
                  <span className="text-lg font-bold text-white">50 сұрақ</span>
                </div>
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400 block">Берілетін уақыт</span>
                  <span className="text-lg font-bold text-amber-400">60 минут</span>
                </div>
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400 block">Сыныптар</span>
                  <span className="text-lg font-bold text-white">5-10 сынып</span>
                </div>
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400 block">2-кезең</span>
                  <span className="text-lg font-bold text-emerald-400">Тарихи эссе</span>
                </div>
              </div>

              <div className="text-center pt-2">
                <button
                  onClick={startDailyTest}
                  disabled={loadingQuestions}
                  className="px-8 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-base rounded-xl transition shadow-lg inline-flex items-center space-x-2 cursor-pointer"
                >
                  {loadingQuestions ? (
                    <span>Сұрақтар жүктелуде...</span>
                  ) : (
                    <>
                      <span>50 сұрақтық тестті бастау</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Syllabus breakdown description */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 max-w-2xl mx-auto text-left space-y-2">
            <div className="font-semibold text-slate-200 flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Тест ережелері мен талаптары:</span>
            </div>
            <p>
              • Әр сұрақтың дұрыс және қате жауабы тест соңында нақты тарихи түсіндірмесімен ашылады.
            </p>
            <p>
              • Тест біткен соң республикалық олимпиаданың 2-кезеңі – тарихи эссе жазу модуліне өтесіз.
            </p>
            <p className="text-slate-400">
              • Олимпиада құпиялылығы: оқушылар бір-бірінің нәтижесін көрмейді; тек жетекшіңіз (мұғалім) толық статистиканы көре алады.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Render: Active Testing View
  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Top Bar: Progress, Timer, and Actions */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center space-x-3">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
            Сұрақ {currentIndex + 1} / {questions.length}
          </span>
          <span className="text-xs text-slate-400 hidden sm:inline truncate max-w-xs">
            {testTitle}
          </span>
          <span className="text-xs text-slate-400 hidden md:inline">
            Жауап берілгені: <strong className="text-white">{answeredCount}</strong> / {questions.length}
          </span>
        </div>

        {/* Countdown Timer with Olympiad Pace & Time-Management Controls */}
        <CountdownTimer
          totalSeconds={totalDurationSeconds}
          timeLeft={timeLeft}
          totalQuestions={questions.length}
          answeredCount={answeredCount}
          currentIndex={currentIndex}
          onTimeUp={handleTimeUp}
        />

        <div className="flex items-center space-x-2">
          {/* Flag question */}
          <button
            onClick={toggleFlagCurrent}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
              currentQ && flaggedQuestions.has(currentQ.id)
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <Flag className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Белгілеу</span>
          </button>

          {/* Finish Button */}
          <button
            onClick={() => setShowConfirmModal(true)}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg transition shadow-sm cursor-pointer"
          >
            Тестті аяқтау
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Question Card (3 columns on lg) */}
        <div className="lg:col-span-3 space-y-6">
          {currentQ && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 min-h-[380px] flex flex-col justify-between">
              <div>
                {/* Meta info: Grade and Topic */}
                <div className="flex items-center space-x-2 text-xs text-slate-400 mb-4">
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                    {currentQ.grade}-сынып
                  </span>
                  <span>•</span>
                  <span className="text-amber-400/90 font-medium truncate">{currentQ.topic}</span>
                  {currentQ.variant && (
                    <>
                      <span>•</span>
                      <span className="text-slate-400">{currentQ.variant}-нұсқа №{currentQ.variantQuestionNum || currentIndex + 1}</span>
                    </>
                  )}
                </div>

                {/* Question Text */}
                <h2 className="text-lg sm:text-xl font-semibold text-white leading-relaxed">
                  {currentQ.question}
                </h2>
              </div>

              {/* Answer Options (Supports 4 or 5 options) */}
              <div className="space-y-3 pt-4">
                {currentQ.options.map((optionText, optIndex) => {
                  const isSelected = selectedAnswers[currentQ.id] === optIndex;
                  const letter = ['A', 'B', 'C', 'D', 'E'][optIndex] || String.fromCharCode(65 + optIndex);

                  return (
                    <button
                      key={optIndex}
                      onClick={() => handleSelectOption(optIndex)}
                      className={`w-full p-4 rounded-xl text-left border transition flex items-center space-x-3 cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500 text-white font-medium ring-1 ring-amber-500/40'
                          : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <span
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 transition ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {letter}
                      </span>
                      <span className="text-sm sm:text-base leading-snug flex-grow">{optionText}</span>
                    </button>
                  );
                })}
              </div>

              {/* Navigation Arrows */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <button
                  onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 text-xs font-semibold transition cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Алдыңғы сұрақ</span>
                </button>

                <div className="text-xs text-slate-500 hidden sm:block">
                  Пернетақта: 1, 2, 3, 4, 5 немесе A, B, C, D, E
                </div>

                {currentIndex < questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentIndex(prev => prev + 1)}
                    className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition cursor-pointer"
                  >
                    <span>Келесі сұрақ</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => setShowConfirmModal(true)}
                    className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer"
                  >
                    <span>Тестті аяқтау</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Question Matrix (1 column on lg) */}
        <div className="lg:col-span-1">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm sticky top-20">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Сұрақтар картасы
              </span>
              <span className="text-xs text-amber-400 font-mono font-medium">
                {answeredCount}/{questions.length}
              </span>
            </div>

            {/* Grid 1 to N */}
            <div className="grid grid-cols-5 sm:grid-cols-10 lg:grid-cols-5 gap-1.5 max-h-[420px] overflow-y-auto pr-1">
              {questions.map((q, idx) => {
                const isCurrent = idx === currentIndex;
                const isAnswered = typeof selectedAnswers[q.id] === 'number';
                const isFlagged = flaggedQuestions.has(q.id);

                let bgClass = 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700';
                if (isAnswered) {
                  bgClass = 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-semibold';
                }
                if (isCurrent) {
                  bgClass += ' ring-2 ring-white border-transparent text-white font-bold';
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-8 rounded-lg text-xs border relative flex items-center justify-center transition cursor-pointer ${bgClass}`}
                  >
                    {idx + 1}
                    {isFlagged && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 absolute top-1 right-1" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded bg-amber-500/20 border border-amber-500/40 inline-block" />
                <span>Жауап берілген</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded bg-slate-950 border border-slate-800 inline-block" />
                <span>Жауап берілмеген</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                <span>Белгіленген (күмәнді)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-amber-400">
              <AlertCircle className="w-6 h-6" />
              <h3 className="text-lg font-bold text-white">Тестті аяқтауды растайсыз ба?</h3>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs text-slate-300">
              <div className="flex justify-between">
                <span>Жалпы сұрақ саны:</span>
                <strong className="text-white">{questions.length}</strong>
              </div>
              <div className="flex justify-between">
                <span>Жауап берілген сұрақ:</span>
                <strong className="text-amber-400">{answeredCount}</strong>
              </div>
              {unansweredCount > 0 && (
                <div className="flex justify-between text-rose-400 font-semibold">
                  <span>Жауап берілмеген сұрақ:</span>
                  <strong>{unansweredCount}</strong>
                </div>
              )}
              <div className="flex justify-between">
                <span>Қалған уақыт:</span>
                <strong className="font-mono text-white">{formatTime(timeLeft)}</strong>
              </div>
            </div>

            <p className="text-xs text-slate-400">
              Тестті тапсырғаннан кейін әрбір сұрақтың дұрыс/қатесі толық тарихи түсіндірмесімен ашылады және тарихи эссе кезеңіне жолдама аласыз.
            </p>

            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
              >
                Тестке оралу
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md cursor-pointer"
              >
                {submitting ? 'Жіберілуде...' : 'Иә, аяқтау'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Strict Olympiad Time-Up Enforcement Modal */}
      {isTimeUpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-rose-500/60 rounded-3xl w-full max-w-md p-6 sm:p-8 text-center shadow-2xl space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 mx-auto flex items-center justify-center animate-pulse">
              <Clock className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-extrabold text-white">Олимпиадалық уақыт аяқталды!</h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Ресми регламенттің 60 минуттық уақыты толық бітті. Жауаптарыңыз автоматты түрде қабылданып, тексеру хаттамасына жіберілуде...
            </p>
            <div className="inline-flex items-center space-x-2 text-amber-400 text-xs font-semibold pt-2">
              <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              <span>Нәтижелер есептелуде...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
