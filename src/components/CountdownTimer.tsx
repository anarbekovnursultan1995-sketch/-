/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Clock, 
  AlertTriangle, 
  Volume2, 
  VolumeX, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  Target, 
  HelpCircle,
  X,
  Zap,
  Info
} from 'lucide-react';
import { analyzeOlympiadTimePace, formatOlympiadTime } from '../utils/olympiad-logic.ts';

interface CountdownTimerProps {
  totalSeconds: number;
  timeLeft: number;
  totalQuestions: number;
  answeredCount: number;
  currentIndex?: number;
  onTimeUp: () => void;
  className?: string;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  totalSeconds,
  timeLeft,
  totalQuestions,
  answeredCount,
  onTimeUp,
  className = '',
}) => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showPacePanel, setShowPacePanel] = useState(false);
  const [showStrategyModal, setShowStrategyModal] = useState(false);
  const [activeAlert, setActiveAlert] = useState<{
    type: 'info' | 'warning' | 'urgent';
    title: string;
    message: string;
  } | null>(null);

  // Keep track of which threshold alerts have already fired in this session
  const triggeredAlerts = useRef<{ [key: string]: boolean }>({});

  const pace = analyzeOlympiadTimePace(
    totalSeconds,
    timeLeft,
    totalQuestions,
    answeredCount
  );

  const { formatted, minutes, seconds } = formatOlympiadTime(timeLeft);

  // Web Audio synthesizer chime for warnings (No external audio file needed)
  const playSoundAlert = (type: 'mild' | 'urgent' | 'final') => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      if (type === 'final') {
        // High urgency 3-beep chime
        [0, 0.15, 0.3].forEach((delay, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.value = idx === 2 ? 880 : 660; // A5
          gain.gain.setValueAtTime(0.2, ctx.currentTime + delay);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.12);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + delay);
          osc.stop(ctx.currentTime + delay + 0.15);
        });
      } else if (type === 'urgent') {
        // Two warning tones
        [0, 0.2].forEach(delay => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = 523.25; // C5
          gain.gain.setValueAtTime(0.15, ctx.currentTime + delay);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.16);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + delay);
          osc.stop(ctx.currentTime + delay + 0.18);
        });
      } else {
        // Gentle single reminder ping
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 440; // A4
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.26);
      }
    } catch {
      // Audio context might be restricted before user gesture
    }
  };

  // Monitor thresholds for official Olympiad reminders
  useEffect(() => {
    // 15-minute warning
    if (timeLeft <= 900 && timeLeft > 895 && !triggeredAlerts.current['15m']) {
      triggeredAlerts.current['15m'] = true;
      playSoundAlert('mild');
      setActiveAlert({
        type: 'info',
        title: 'Олимпиада: 15 минут қалды',
        message: 'Белгіленген күмәнді сұрақтарды қайта тексеруге көшуді ұсынамыз.',
      });
    }

    // 5-minute warning
    if (timeLeft <= 300 && timeLeft > 295 && !triggeredAlerts.current['5m']) {
      triggeredAlerts.current['5m'] = true;
      playSoundAlert('urgent');
      setActiveAlert({
        type: 'warning',
        title: 'Шұғыл: 5 минут қалды!',
        message: 'Жауап берілмеген сұрақтарды тез толтырыңыз, уақыт таяп қалды.',
      });
    }

    // 1-minute warning
    if (timeLeft <= 60 && timeLeft > 55 && !triggeredAlerts.current['1m']) {
      triggeredAlerts.current['1m'] = true;
      playSoundAlert('final');
      setActiveAlert({
        type: 'urgent',
        title: 'Соңғы 60 секунд!',
        message: 'Регламент бойынша тестілеу нәтижесі автоматты түрде қабылданады.',
      });
    }

    // Exact 0: timeout
    if (timeLeft <= 0) {
      onTimeUp();
    }
  }, [timeLeft, onTimeUp]);

  // Auto-dismiss temporary alerts after 7 seconds
  useEffect(() => {
    if (!activeAlert) return;
    const t = setTimeout(() => {
      setActiveAlert(null);
    }, 7000);
    return () => clearTimeout(t);
  }, [activeAlert]);

  // Determine color and styling theme based on urgency
  const isCritical = timeLeft <= 300; // < 5 mins
  const isUrgent = timeLeft <= 60; // < 1 min
  const isWarning = timeLeft > 300 && timeLeft <= 900; // 5-15 mins

  const themeClasses = isUrgent
    ? 'bg-rose-500/25 border-rose-500/60 text-rose-300 ring-2 ring-rose-500/40 animate-pulse'
    : isCritical
    ? 'bg-rose-950/70 border-rose-500/40 text-rose-300'
    : isWarning
    ? 'bg-amber-950/60 border-amber-500/40 text-amber-300'
    : 'bg-slate-950 border-slate-800 text-amber-400';

  const progressPercent = totalSeconds > 0 
    ? Math.max(0, Math.min(100, Math.round((timeLeft / totalSeconds) * 100))) 
    : 0;

  return (
    <div className={`relative ${className}`}>
      {/* Toast Alert Popover */}
      {activeAlert && (
        <div 
          className={`fixed top-5 right-5 z-50 max-w-sm w-full p-4 rounded-2xl shadow-2xl border backdrop-blur-md animate-in slide-in-from-top-4 flex items-start space-x-3 ${
            activeAlert.type === 'urgent'
              ? 'bg-rose-950/95 border-rose-500 text-rose-200'
              : activeAlert.type === 'warning'
              ? 'bg-amber-950/95 border-amber-500 text-amber-200'
              : 'bg-slate-900/95 border-slate-700 text-slate-200'
          }`}
        >
          <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
            activeAlert.type === 'urgent' ? 'text-rose-400' : 'text-amber-400'
          }`} />
          <div className="flex-1 text-xs">
            <h4 className="font-bold text-white text-sm mb-0.5">{activeAlert.title}</h4>
            <p className="leading-relaxed opacity-90">{activeAlert.message}</p>
          </div>
          <button
            onClick={() => setActiveAlert(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition"
            title="Жабу"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Timer Bar Unit */}
      <div className="flex items-center space-x-2">
        {/* Digital Clock Display */}
        <div 
          className={`flex items-center space-x-2.5 px-3 py-1.5 rounded-xl border transition-all ${themeClasses}`}
          title={`Қалған уақыт: ${formatted}`}
        >
          <div className="relative flex items-center justify-center">
            <Clock className={`w-4 h-4 ${isCritical ? 'text-rose-400' : 'text-amber-400'}`} />
            {isUrgent && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            )}
          </div>
          <div className="flex flex-col">
            <span className="font-mono font-extrabold text-sm sm:text-base tracking-wider leading-none">
              {formatted}
            </span>
            <span className="text-[9px] text-slate-400 font-sans tracking-tight uppercase mt-0.5">
              {isCritical ? 'Шұғыл' : 'Қалған уақыт'}
            </span>
          </div>

          {/* Mini circular progress indicator */}
          <div className="w-6 h-6 relative hidden sm:flex items-center justify-center ml-1">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-800"
                strokeWidth="4"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={isCritical ? 'text-rose-500' : isWarning ? 'text-amber-500' : 'text-emerald-500'}
                strokeDasharray={`${progressPercent}, 100`}
                strokeWidth="4"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
          </div>
        </div>

        {/* Time-Management Quick Action Button */}
        <button
          type="button"
          onClick={() => setShowPacePanel(!showPacePanel)}
          className={`px-2.5 py-1.5 rounded-xl border text-xs font-medium flex items-center space-x-1.5 transition cursor-pointer ${
            showPacePanel
              ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
              : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
          }`}
          title="Олимпиадалық уақыт менеджменті және қарқыны"
        >
          <Zap className={`w-3.5 h-3.5 ${showPacePanel ? 'text-slate-950' : 'text-amber-400'}`} />
          <span className="hidden md:inline">Уақыт қарқыны</span>
          {showPacePanel ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Sound Toggle Button */}
        <button
          type="button"
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`p-1.5 rounded-xl border text-xs transition cursor-pointer ${
            soundEnabled
              ? 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white'
              : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-400'
          }`}
          title={soundEnabled ? 'Дыбыстық ескертулер қосулы' : 'Дыбыстық ескертулер өшірулі'}
        >
          {soundEnabled ? (
            <Volume2 className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <VolumeX className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Expandable Olympiad Time-Management Coach Panel */}
      {showPacePanel && (
        <div className="absolute right-0 top-12 z-40 w-80 sm:w-96 p-4 rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl backdrop-blur-xl animate-in fade-in space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Олимпиадалық уақыт қарқыны
              </h4>
            </div>
            <button
              onClick={() => setShowStrategyModal(true)}
              className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center space-x-1 transition"
            >
              <Info className="w-3 h-3" />
              <span>Кеңестер</span>
            </button>
          </div>

          {/* Current Pace Status Pill */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-xs text-slate-400">Қазіргі қарқын:</span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono border ${
              pace.status === 'ahead'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : pace.status === 'on_track'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
            }`}>
              {pace.statusLabel}
            </span>
          </div>

          {/* Per Question Time Metric */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-1">1 сұраққа қалған:</span>
              <span className="text-base font-bold text-white font-mono">
                ~{pace.remainingSecondsPerQuestion} сек
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                (қалған сұрақтар бойынша)
              </span>
            </div>
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-1">Ұсынылатын қарқын:</span>
              <span className="text-base font-bold text-amber-400 font-mono">
                ~{pace.recommendedSecondsPerQuestion} сек
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                ({totalQuestions} сұраққа 60 мин)
              </span>
            </div>
          </div>

          {/* Dual Progress Bars: Time vs Answered */}
          <div className="space-y-2 pt-1 text-xs">
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Жұмсалған уақыт:</span>
                <span className="font-mono text-slate-200">{pace.percentTimeUsed}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                <div 
                  className={`h-full transition-all duration-300 ${
                    pace.percentTimeUsed > 80 ? 'bg-rose-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${pace.percentTimeUsed}%` }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Орындалған сұрақтар:</span>
                <span className="font-mono text-emerald-400">{pace.percentQuestionsCompleted}% ({answeredCount}/{totalQuestions})</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${pace.percentQuestionsCompleted}%` }}
                />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Регламент: 60 минут қатаң</span>
            <button
              onClick={() => setShowPacePanel(false)}
              className="text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
            >
              Жабу
            </button>
          </div>
        </div>
      )}

      {/* Strategy Modal */}
      {showStrategyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2 text-amber-400">
                <Zap className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">
                  Олимпиадалық уақыт менеджменті стратегиясы
                </h3>
              </div>
              <button
                onClick={() => setShowStrategyModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start space-x-3">
                <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center flex-shrink-0 text-xs">
                  1
                </div>
                <div>
                  <strong className="text-white block mb-0.5">«Үш кезең» олимпиадалық әдісі:</strong>
                  Алдымен 100% сенімді сұрақтарды жылдам белгілеп шығыңыз (алғашқы 30-35 минут). Бұл сенімді ұпай базасын қалыптастырады.
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start space-x-3">
                <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center flex-shrink-0 text-xs">
                  2
                </div>
                <div>
                  <strong className="text-white block mb-0.5">Күмәнді сұрақтарды жалаушамен белгілеу:</strong>
                  Бір күрделі сұраққа 2 минуттан артық тоқталмаңыз. Белгілеу батырмасын басып, келесіге өтіңіз.
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start space-x-3">
                <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center flex-shrink-0 text-xs">
                  3
                </div>
                <div>
                  <strong className="text-white block mb-0.5">Қорытынды 10-15 минутты тексеруге қалдыру:</strong>
                  Сұрақтар картасындағы сары нүктелі белгіленген сұрақтарды мұқият талдап, соңғы шешім қабылдаңыз.
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start space-x-3">
                <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center flex-shrink-0 text-xs">
                  4
                </div>
                <div>
                  <strong className="text-white block mb-0.5">Ешбір сұрақты бос қалдырмау:</strong>
                  Республикалық олимпиадада әрбір ұпай медальдық шешуші мәнге ие. Уақыт бітуге 2 минут қалғанда бос сұрақтарды толық қамтыңыз.
                </div>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setShowStrategyModal(false)}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Түсіндім, тестті жалғастыру
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
