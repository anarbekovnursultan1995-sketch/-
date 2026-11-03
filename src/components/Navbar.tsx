/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { StudentProfile } from '../types/index.ts';
import { 
  BookOpen, 
  Award, 
  FileText, 
  BarChart3, 
  Users, 
  Database, 
  CheckCircle, 
  LogOut, 
  ShieldCheck,
  GraduationCap,
  Edit3,
  Trophy
} from 'lucide-react';

interface NavbarProps {
  currentUser: StudentProfile | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  onOpenAuth: () => void;
  onSwitchToTeacher: () => void;
  onSwitchToStudent: () => void;
  onOpenEditProfile?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  onLogout,
  onOpenAuth,
  onSwitchToTeacher,
  onSwitchToStudent,
  onOpenEditProfile,
}) => {
  const isTeacher = currentUser?.role === 'teacher';

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Name */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab(isTeacher ? 'students' : 'test')}>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center shadow-md">
              <Award className="w-6 h-6 text-slate-950 font-bold" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold tracking-tight text-lg text-white">QazHistory</span>
                <span className="px-2 py-0.5 text-xs font-semibold uppercase tracking-wider rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Олимпиада
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                9-10 сыныптардың Қазақстан тарихы республикалық олимпиадасына дайындық
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          {currentUser && (
            <nav className="hidden md:flex items-center space-x-1">
              {!isTeacher ? (
                <>
                  <button
                    onClick={() => setActiveTab('test')}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                      activeTab === 'test'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Күнделікті 50 тест</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('essay')}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                      activeTab === 'essay'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>Тарихи эссе</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('my-stats')}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                      activeTab === 'my-stats'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>Менің нәтижелерім</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('leaderboard')}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                      activeTab === 'leaderboard'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Trophy className="w-4 h-4" />
                    <span>Рейтинг</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setActiveTab('students')}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                      activeTab === 'students'
                        ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>Оқушылар және Рейтинг</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('essay-eval')}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                      activeTab === 'essay-eval'
                        ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Эссе тексеру</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('questions')}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                      activeTab === 'questions'
                        ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Database className="w-4 h-4" />
                    <span>Сұрақтар қоры</span>
                  </button>
                </>
              )}
            </nav>
          )}

          {/* User profile & controls */}
          <div className="flex items-center space-x-3">
            {currentUser ? (
              <div className="flex items-center space-x-3">
                {/* Role and User Badge */}
                <div className="text-right hidden sm:block">
                  <div className="flex items-center justify-end space-x-1.5">
                    {isTeacher ? (
                      <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        <ShieldCheck className="w-3 h-3 mr-1" />
                        Жетекші
                      </span>
                    ) : (
                      <button
                        onClick={onOpenEditProfile}
                        title="Профильді өңдеу"
                        className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-500/30 cursor-pointer transition"
                      >
                        <GraduationCap className="w-3 h-3 mr-1" />
                        {currentUser.grade}-сынып
                      </button>
                    )}
                    <span className="text-sm font-medium text-white">{currentUser.name}</span>
                  </div>
                  <p className="text-xs text-slate-400 truncate max-w-[180px]">{currentUser.email}</p>
                </div>

                {/* Edit Profile Button for Student */}
                {!isTeacher && onOpenEditProfile && (
                  <button
                    onClick={onOpenEditProfile}
                    title="Профильді өңдеу (Аты-жөні, сыныбы, мектебі)"
                    className="text-xs bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 px-2.5 py-1.5 rounded-lg border border-amber-500/30 flex items-center space-x-1.5 transition cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Өңдеу</span>
                  </button>
                )}

                {/* Quick Role Switcher for convenient teacher/student testing */}
                {isTeacher ? (
                  <button
                    onClick={onSwitchToStudent}
                    title="Оқушы көрінісіне ауысу"
                    className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1.5 rounded-lg border border-slate-700 flex items-center space-x-1 transition"
                  >
                    <span>Оқушы көрінісі</span>
                  </button>
                ) : (
                  <button
                    onClick={onSwitchToTeacher}
                    title="Жетекші кабинетіне кіру"
                    className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1.5 rounded-lg border border-slate-700 flex items-center space-x-1 transition"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden sm:inline">Мұғалім панелі</span>
                  </button>
                )}

                {/* Logout */}
                <button
                  onClick={onLogout}
                  title="Шығу"
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-sm transition shadow-sm"
              >
                <span>Google арқылы кіру</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile navigation tab bar */}
      {currentUser && (
        <div className="md:hidden border-t border-slate-800 px-2 py-1.5 flex justify-around bg-slate-900/90 backdrop-blur">
          {!isTeacher ? (
            <>
              <button
                onClick={() => setActiveTab('test')}
                className={`px-3 py-1 text-xs font-medium rounded ${
                  activeTab === 'test' ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400'
                }`}
              >
                Тест (50)
              </button>
              <button
                onClick={() => setActiveTab('essay')}
                className={`px-3 py-1 text-xs font-medium rounded ${
                  activeTab === 'essay' ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400'
                }`}
              >
                Тарихи эссе
              </button>
              <button
                onClick={() => setActiveTab('my-stats')}
                className={`px-3 py-1 text-xs font-medium rounded ${
                  activeTab === 'my-stats' ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400'
                }`}
              >
                Нәтижелер
              </button>
              <button
                onClick={() => setActiveTab('leaderboard')}
                className={`px-3 py-1 text-xs font-medium rounded ${
                  activeTab === 'leaderboard' ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400'
                }`}
              >
                Рейтинг
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setActiveTab('students')}
                className={`px-3 py-1 text-xs font-medium rounded ${
                  activeTab === 'students' ? 'bg-sky-500/20 text-sky-400' : 'text-slate-400'
                }`}
              >
                Рейтинг
              </button>
              <button
                onClick={() => setActiveTab('essay-eval')}
                className={`px-3 py-1 text-xs font-medium rounded ${
                  activeTab === 'essay-eval' ? 'bg-sky-500/20 text-sky-400' : 'text-slate-400'
                }`}
              >
                Эссе тексеру
              </button>
              <button
                onClick={() => setActiveTab('questions')}
                className={`px-3 py-1 text-xs font-medium rounded ${
                  activeTab === 'questions' ? 'bg-sky-500/20 text-sky-400' : 'text-slate-400'
                }`}
              >
                Сұрақтар қоры
              </button>
            </>
          )}
        </div>
      )}
    </header>
  );
};
