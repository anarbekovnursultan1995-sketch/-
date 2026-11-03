/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { StudentProfile, GradeLevel } from '../types/index.ts';
import { loginUser } from '../services/api.ts';
import { Shield, Sparkles, Check, School, MapPin, GraduationCap, Edit3 } from 'lucide-react';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: StudentProfile) => void;
  teacherEmail: string;
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  teacherEmail,
}) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [grade, setGrade] = useState<GradeLevel>(10);
  const [school, setSchool] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = async (
    targetEmail: string,
    targetName: string,
    targetGrade: GradeLevel,
    targetSchool?: string,
    targetCity?: string,
    forceRole?: 'student' | 'teacher'
  ) => {
    setLoading(true);
    setError(null);
    try {
      const res = await loginUser({
        email: targetEmail,
        name: targetName,
        grade: targetGrade,
        school: targetSchool,
        city: targetCity,
        forceRole,
      });
      onLoginSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Кіру сәтсіз аяқталды');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) {
      setError('Google поштаңыз бен аты-жөніңізді енгізіңіз');
      return;
    }
    handleLogin(email, name, grade, school, city);
  };

  const selectPreset = (pEmail: string, pName: string, pGrade: GradeLevel, pSchool: string, pCity: string) => {
    setEmail(pEmail);
    setName(pName);
    setGrade(pGrade);
    setSchool(pSchool);
    setCity(pCity);
    setError(null);
  };

  const gradeList: GradeLevel[] = [5, 6, 7, 8, 9, 10];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 p-5 text-slate-950 text-center relative">
          <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-2xl mx-auto flex items-center justify-center mb-2 shadow-inner">
            <svg className="w-7 h-7" viewBox="0 0 24 24">
              <path
                fill="#ffffff"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#ffffff"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#ffffff"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#ffffff"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">Google аккаунт арқылы кіру және тіркелу</h2>
          <p className="text-xs text-amber-100 mt-0.5">
            Қазақстан тарихы республикалық олимпиадасына дайындық платформасы (5–10 сынып)
          </p>
        </div>

        <div className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
          {error && (
            <div className="p-3 text-xs bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl">
              {error}
            </div>
          )}

          {/* Teacher Fast Button */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Жетекші / Мұғалім үшін:
            </label>
            <button
              type="button"
              onClick={() => handleLogin(teacherEmail, 'Анарбеков Нұрсұлтан (Жетекші)', 10, 'Бас жетекші', 'Алматы', 'teacher')}
              disabled={loading}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-amber-500/30 text-left transition group cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs border border-amber-500/40">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white group-hover:text-amber-300">
                    Анарбеков Нұрсұлтан
                  </div>
                  <div className="text-xs text-amber-400/90 flex items-center space-x-1">
                    <span>{teacherEmail}</span>
                    <span className="font-bold">• Жетекші / Мұғалім</span>
                  </div>
                </div>
              </div>
              <Sparkles className="w-4 h-4 text-amber-400 opacity-60 group-hover:opacity-100" />
            </button>
          </div>

          {/* Quick preset buttons to auto-populate form */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Дайын оқушы үлгісін таңдау немесе өңдеу:
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => selectPreset('aisultan.murat@olympiad.kz', 'Мұратұлы Айсұлтан', 10, '№178 лицей', 'Алматы')}
                className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-blue-500/60 text-left transition cursor-pointer"
              >
                <div className="text-xs font-semibold text-slate-200">Мұратұлы Айсұлтан</div>
                <div className="text-[11px] text-blue-400 flex items-center space-x-1 mt-0.5">
                  <span>10-сынып • №178 лицей</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => selectPreset('dina.serikkyzy@olympiad.kz', 'Серікқызы Дина', 9, 'НЗМ (NIS) ФМБ', 'Астана')}
                className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/60 text-left transition cursor-pointer"
              >
                <div className="text-xs font-semibold text-slate-200">Серікқызы Дина</div>
                <div className="text-[11px] text-emerald-400 flex items-center space-x-1 mt-0.5">
                  <span>9-сынып • НЗМ Астана</span>
                </div>
              </button>
            </div>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-3 text-[11px] text-slate-400 font-medium">
              Оқушы деректерін толтыру және тексеру
            </span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          {/* Profile & Google Sign-in registration form */}
          <form onSubmit={handleFormSubmit} className="space-y-3.5">
            <div>
              <label className="text-xs font-medium text-slate-300 mb-1 block">
                Google электрондық поштасы (Email):
              </label>
              <input
                type="email"
                placeholder="mysurname@gmail.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-3.5 py-2 text-sm bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 mb-1 flex items-center justify-between">
                <span>Оқушының толық аты-жөні:</span>
                <span className="text-[11px] text-amber-400/80">Олимпиада тізімі үшін</span>
              </label>
              <input
                type="text"
                placeholder="Мысалы: Берік Ерболұлы"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full px-3.5 py-2 text-sm bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            {/* Grade selector 5-10 */}
            <div>
              <label className="text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center space-x-1">
                  <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Сыныбыңызды таңдаңыз:</span>
                </span>
                <span className="text-xs font-bold text-amber-400">{grade}-сынып</span>
              </label>
              <div className="grid grid-cols-6 gap-1.5">
                {gradeList.map(g => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGrade(g)}
                    className={`py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer ${
                      grade === g
                        ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-300 mb-1 block">Мектеп / Лицей атауы:</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="№12 мектеп-гимназия..."
                    value={school}
                    onChange={e => setSchool(e.target.value)}
                    className="w-full pl-3 pr-8 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
                  />
                  <School className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-2.5" />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 mb-1 block">Қаласы / Өңірі:</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Алматы, Астана, Шымкент..."
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    className="w-full pl-3 pr-8 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
                  />
                  <MapPin className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-2.5" />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 py-3 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm transition shadow-lg flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>Жүйеге кіруде...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Деректерді растап, жүйеге кіру</span>
                </>
              )}
            </button>
          </form>

          <p className="text-[11px] text-center text-slate-500 pt-1">
            Кіргеннен кейін де өз аты-жөніңізді, мектебіңіз бен сыныбыңызды кез келген уақытта «Профильді өңдеу» батырмасы арқылы түзетуге болады.
          </p>
        </div>
      </div>
    </div>
  );
};
