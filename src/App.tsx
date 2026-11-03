/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { StudentProfile, Question, TestResult } from './types/index.ts';
import { Navbar } from './components/Navbar.tsx';
import { GoogleAuthModal } from './components/GoogleAuthModal.tsx';
import { TestModule } from './components/TestModule.tsx';
import { TestResultsView } from './components/TestResultsView.tsx';
import { EssayModule } from './components/EssayModule.tsx';
import { StudentAnalytics } from './components/StudentAnalytics.tsx';
import { Leaderboard } from './components/Leaderboard.tsx';
import { TeacherDashboard } from './components/TeacherDashboard.tsx';
import { EditProfileModal } from './components/EditProfileModal.tsx';
import { fetchConfig } from './services/api.ts';
import { 
  Award, 
  BookOpen, 
  FileText, 
  ShieldCheck, 
  Users, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight,
  Database
} from 'lucide-react';

const TEACHER_EMAIL = 'anarbekov.nursultan1995@gmail.com';

export default function App() {
  const [currentUser, setCurrentUser] = useState<StudentProfile | null>(null);
  const [activeTab, setActiveTab] = useState<string>('test');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [completedTestResult, setCompletedTestResult] = useState<TestResult | null>(null);
  const [activeTestQuestions, setActiveTestQuestions] = useState<Question[]>([]);
  const [config, setConfig] = useState<any>(null);

  // Restore session from localStorage or query params
  useEffect(() => {
    fetchConfig().then(cfg => setConfig(cfg)).catch(console.error);

    const savedUser = localStorage.getItem('qazhistory_user');
    if (savedUser) {
      try {
        const u: StudentProfile = JSON.parse(savedUser);
        setCurrentUser(u);
        setActiveTab(u.role === 'teacher' ? 'students' : 'test');
      } catch (e) {
        console.error(e);
      }
    }

    // Auto-start support per Ultra Mode instructions
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('autostart') === '1' && !savedUser) {
      const defaultStudent: StudentProfile = {
        id: 'std-1',
        name: 'Мұратұлы Айсұлтан',
        email: 'aisultan.murat@olympiad.kz',
        grade: 10,
        school: '№178 мамандандырылған лицей',
        city: 'Алматы',
        role: 'student',
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
      };
      setCurrentUser(defaultStudent);
      localStorage.setItem('qazhistory_user', JSON.stringify(defaultStudent));
      setActiveTab('test');
    }
  }, []);

  const handleLoginSuccess = (user: StudentProfile) => {
    setCurrentUser(user);
    localStorage.setItem('qazhistory_user', JSON.stringify(user));
    if (user.role === 'teacher') {
      setActiveTab('students');
    } else {
      setActiveTab('test');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('qazhistory_user');
    setActiveTab('test');
    setCompletedTestResult(null);
  };

  const handleSwitchToTeacher = () => {
    const teacherUser: StudentProfile = {
      id: 'teacher-main',
      name: 'Анарбеков Нұрсұлтан (Жетекші)',
      email: TEACHER_EMAIL,
      grade: 10,
      school: 'Республикалық олимпиадалық жетекшілік',
      city: 'Алматы',
      role: 'teacher',
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
    };
    handleLoginSuccess(teacherUser);
  };

  const handleSwitchToStudent = () => {
    const studentUser: StudentProfile = {
      id: 'std-1',
      name: 'Мұратұлы Айсұлтан',
      email: 'aisultan.murat@olympiad.kz',
      grade: 10,
      school: '№178 мамандандырылған лицей',
      city: 'Алматы',
      role: 'student',
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
    };
    handleLoginSuccess(studentUser);
  };

  const handleTestComplete = (result: TestResult, questions: Question[]) => {
    setCompletedTestResult(result);
    setActiveTestQuestions(questions);
  };

  const handleProfileUpdated = (updatedUser: StudentProfile) => {
    setCurrentUser(updatedUser);
    localStorage.setItem('qazhistory_user', JSON.stringify(updatedUser));
  };

  const isTeacher = currentUser?.role === 'teacher';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Navigation Header */}
      <Navbar
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={tab => {
          setActiveTab(tab);
          // If moving away from test result, clear preview
          if (tab !== 'test') {
            setCompletedTestResult(null);
          }
        }}
        onLogout={handleLogout}
        onOpenAuth={() => setIsAuthOpen(true)}
        onSwitchToTeacher={handleSwitchToTeacher}
        onSwitchToStudent={handleSwitchToStudent}
        onOpenEditProfile={() => setIsEditProfileOpen(true)}
      />

      {/* Main Content Body */}
      <main className="flex-grow">
        {!currentUser ? (
          /* Landing Screen when not logged in */
          <div className="max-w-6xl mx-auto px-4 py-12 sm:py-20 space-y-16 animate-in fade-in">
            {/* Hero Section */}
            <div className="text-center space-y-6 max-w-3xl mx-auto">
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>9-10 сынып оқушыларына арналған арнайы платформа</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
                Қазақстан тарихынан <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 bg-clip-text text-transparent">республикалық олимпиадаға</span> дайындық
              </h1>

              <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
                5, 6, 7, 8, 9, 10 сынып бағдарламаларын толық қамтитын 2 200+ олимпиадалық сұрақтар қоры, 10 ресми республикалық олимпиадалық нұсқа (400 сұрақ), тарихи эссе модулі және жетекшінің толық бақылау жүйесі.
              </p>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="w-full sm:w-auto px-8 py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-2xl text-base transition shadow-xl flex items-center justify-center space-x-2.5 cursor-pointer"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#000000"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#000000"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#000000"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#000000"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Google аккаунт арқылы кіру</span>
                </button>

                <button
                  onClick={handleSwitchToTeacher}
                  className="w-full sm:w-auto px-6 py-4 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-semibold rounded-2xl text-base transition border border-slate-800 flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                  <span>Мұғалім / Жетекші панелі</span>
                </button>
              </div>

              <div className="pt-2 text-xs text-slate-500">
                Жетекші поштасы: <code className="text-slate-400">{TEACHER_EMAIL}</code>
              </div>
            </div>

            {/* Core Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-3 shadow-sm hover:border-slate-700 transition">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <Database className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">2 200+ Сұрақ & 10 Ресми нұсқа</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  5-10 сыныптар курсы бойынша 10 ресми олимпиадалық нұсқа (әрқайсысы 40 сұрақ, 5 жауап) және кеңейтілген тақырыптық база.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-3 shadow-sm hover:border-slate-700 transition">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">2-кезең: Тарихи эссе</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  50 тесттен кейін оқушы республикалық олимпиаданың ресми критерийлері бойынша тарихи эссе жазып, жетекші бағасын алады.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-3 shadow-sm hover:border-slate-700 transition">
                <div className="w-12 h-12 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Құпиялылық және Мұғалім кабинеті</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Оқушылар бір-бірінің нәтижесін көре алмайды. Барлық рейтинг пен аналитиканы тек жетекші ғана өз кабинетінен көреді.
                </p>
              </div>
            </div>
          </div>
        ) : isTeacher ? (
          /* Teacher / Supervisor Dashboard */
          <TeacherDashboard currentUser={currentUser} initialTab={activeTab} />
        ) : (
          /* Student Views */
          <div>
            {activeTab === 'test' && (
              completedTestResult ? (
                <TestResultsView
                  result={completedTestResult}
                  questions={activeTestQuestions}
                  onRetake={() => setCompletedTestResult(null)}
                  onProceedToEssay={() => {
                    setCompletedTestResult(null);
                    setActiveTab('essay');
                  }}
                />
              ) : (
                <TestModule
                  currentUser={currentUser}
                  onTestComplete={handleTestComplete}
                  onProceedToEssay={() => setActiveTab('essay')}
                />
              )
            )}

            {activeTab === 'essay' && (
              <EssayModule currentUser={currentUser} />
            )}

            {activeTab === 'my-stats' && (
              <StudentAnalytics
                currentUser={currentUser}
                onOpenTest={() => {
                  setCompletedTestResult(null);
                  setActiveTab('test');
                }}
                onOpenEditProfile={() => setIsEditProfileOpen(true)}
                onOpenLeaderboard={() => setActiveTab('leaderboard')}
              />
            )}

            {activeTab === 'leaderboard' && (
              <Leaderboard
                currentUser={currentUser}
                onStartTest={() => {
                  setCompletedTestResult(null);
                  setActiveTab('test');
                }}
                onStartEssay={() => setActiveTab('essay')}
              />
            )}
          </div>
        )}
      </main>

      {/* Google Auth Modal */}
      <GoogleAuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        teacherEmail={TEACHER_EMAIL}
      />

      {/* Edit Student Profile Modal */}
      {currentUser && (
        <EditProfileModal
          isOpen={isEditProfileOpen}
          onClose={() => setIsEditProfileOpen(false)}
          currentUser={currentUser}
          onProfileUpdated={handleProfileUpdated}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>QazHistory Olympiad © 2026 • 9-10 сыныптардың Қазақстан тарихы олимпиадалық платформасы</span>
          <span>Жетекші: Анарбеков Нұрсұлтан ({TEACHER_EMAIL})</span>
        </div>
      </footer>
    </div>
  );
}
