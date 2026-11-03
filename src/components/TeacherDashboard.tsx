/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { StudentProfile, Question, TestResult, EssaySubmission, StudentStats } from '../types/index.ts';
import { 
  fetchLeaderboard, 
  fetchAllTests, 
  fetchAllEssays, 
  fetchQuestions, 
  createQuestion, 
  updateQuestion, 
  deleteQuestion, 
  importQuestions, 
  gradeEssay 
} from '../services/api.ts';
import { 
  Users, 
  Award, 
  CheckCircle, 
  FileText, 
  Database, 
  Search, 
  Download, 
  Upload, 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  ShieldCheck, 
  GraduationCap, 
  Calendar, 
  Clock, 
  AlertCircle,
  Filter,
  Check,
  X
} from 'lucide-react';

interface TeacherDashboardProps {
  currentUser: StudentProfile;
  initialTab?: string;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  currentUser,
  initialTab = 'students',
}) => {
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const [students, setStudents] = useState<StudentStats[]>([]);
  const [allEssays, setAllEssays] = useState<EssaySubmission[]>([]);
  const [allTests, setAllTests] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters for Students Leaderboard
  const [gradeFilter, setGradeFilter] = useState<'all' | '9' | '10'>('all');
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudentCard, setSelectedStudentCard] = useState<StudentStats | null>(null);

  // Essay Grading modal
  const [gradingEssay, setGradingEssay] = useState<EssaySubmission | null>(null);
  const [rubric, setRubric] = useState({
    historicalAccuracy: 5,
    chronologyAndCausality: 5,
    historicalSourcesAndFigures: 5,
    argumentationAndConclusion: 4,
    academicStyleAndTerminology: 5,
  });
  const [teacherFeedback, setTeacherFeedback] = useState('');
  const [submittingGrade, setSubmittingGrade] = useState(false);

  // Question bank state
  const [questionsList, setQuestionsList] = useState<Question[]>([]);
  const [totalQuestionsCount, setTotalQuestionsCount] = useState(0);
  const [questionGradeFilter, setQuestionGradeFilter] = useState<string>('all');
  const [questionPeriodFilter, setQuestionPeriodFilter] = useState<string>('all');
  const [questionVariantFilter, setQuestionVariantFilter] = useState<string>('all');
  const [questionSearch, setQuestionSearch] = useState('');
  const [questionPage, setQuestionPage] = useState(1);
  const [editingQuestion, setEditingQuestion] = useState<Partial<Question> | null>(null);
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Load Leaderboard and data
  const loadData = async () => {
    setLoading(true);
    try {
      const [lbRes, essaysRes, testsRes] = await Promise.all([
        fetchLeaderboard('teacher'),
        fetchAllEssays('teacher'),
        fetchAllTests('teacher'),
      ]);
      setStudents(lbRes.leaderboard || []);
      setAllEssays(essaysRes.essays || []);
      setAllTests(testsRes.tests || []);
    } catch (e) {
      console.error('Error loading teacher data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Load questions when Question Bank tab is active or filters change
  const loadQuestions = async () => {
    try {
      const res = await fetchQuestions({
        grade: questionGradeFilter,
        period: questionPeriodFilter,
        variant: questionVariantFilter,
        search: questionSearch,
        page: questionPage,
        limit: 15,
      });
      setQuestionsList(res.questions || []);
      setTotalQuestionsCount(res.total || 0);
    } catch (e) {
      console.error('Error fetching questions for bank:', e);
    }
  };

  useEffect(() => {
    if (activeTab === 'questions') {
      loadQuestions();
    }
  }, [activeTab, questionGradeFilter, questionPeriodFilter, questionVariantFilter, questionSearch, questionPage]);

  // Export Leaderboard to CSV
  const handleExportCSV = () => {
    const headers = ['Орын', 'Аты-жөні', 'Google Email', 'Сыныбы', 'Мектебі', 'Қаласы', 'Орындаған тест саны', 'Орташа балы (%)', 'Үздік балы (%)', 'Эссе балы (/25)', 'Рейтинг ұпайы', 'Соңғы белсенділік'];
    const rows = students.map((s, idx) => [
      idx + 1,
      `"${s.student.name}"`,
      s.student.email,
      s.student.grade,
      `"${s.student.school || ''}"`,
      `"${s.student.city || ''}"`,
      s.testsCompleted,
      `${s.averageTestScore}%`,
      `${s.bestTestScore}%`,
      s.averageEssayScore,
      s.olympiadRatingPoints,
      new Date(s.recentTestDate || s.student.lastActive).toLocaleDateString('kk-KZ'),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `qazhistory-olympiad-students-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Submit Essay Grade
  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingEssay) return;

    const totalScore = 
      rubric.historicalAccuracy +
      rubric.chronologyAndCausality +
      rubric.historicalSourcesAndFigures +
      rubric.argumentationAndConclusion +
      rubric.academicStyleAndTerminology;

    setSubmittingGrade(true);
    try {
      await gradeEssay(gradingEssay.id, {
        score: totalScore,
        rubricScores: rubric,
        teacherFeedback,
        gradedBy: currentUser.name || 'Анарбеков Нұрсұлтан (Жетекші)',
      });

      setGradingEssay(null);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Бағалауды сақтау қатесі');
    } finally {
      setSubmittingGrade(false);
    }
  };

  // Add / Edit Question Save
  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion) return;

    try {
      if (editingQuestion.id) {
        await updateQuestion(editingQuestion.id, editingQuestion);
      } else {
        await createQuestion(editingQuestion);
      }
      setIsQuestionModalOpen(false);
      setEditingQuestion(null);
      await loadQuestions();
    } catch (err: any) {
      alert(err.message || 'Сұрақты сақтау сәтсіз аяқталды');
    }
  };

  // Delete Question
  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('Бұл сұрақты базадан өшіруді растайсыз ба?')) return;
    try {
      await deleteQuestion(id);
      await loadQuestions();
    } catch (e) {
      console.error(e);
    }
  };

  // Import JSON Questions
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json)) {
          const res = await importQuestions(json, 'merge');
          setImportStatus(`Сәтті қосылды: ${res.importedCount} жаңа сұрақ. Базада барлығы: ${res.totalQuestions}.`);
          await loadQuestions();
        } else {
          setImportStatus('Қате: JSON файлы сұрақтар тізімі (array) болуы керек.');
        }
      } catch (err: any) {
        setImportStatus(`JSON оқу қатесі: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  // Filter students
  const filteredStudents = students.filter(s => {
    if (gradeFilter !== 'all' && s.student.grade !== Number(gradeFilter)) return false;
    if (studentSearch.trim()) {
      const q = studentSearch.toLowerCase();
      return (
        s.student.name.toLowerCase().includes(q) ||
        s.student.email.toLowerCase().includes(q) ||
        (s.student.school && s.student.school.toLowerCase().includes(q)) ||
        (s.student.city && s.student.city.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-in fade-in">
      {/* Teacher Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Жетекшінің жеке кабинеті</span>
              </span>
              <span className="text-xs text-slate-400">• Құпиялылық қорғалған</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Оқушыларды бақылау және басқару панелі
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm max-w-2xl">
              Жетекші: <strong className="text-white">{currentUser.name}</strong> ({currentUser.email}). Барлық оқушылардың рейтингі, тест көрсеткіштері, эсселері тұрақты базада сақталады.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <div className="text-center">
              <div className="text-xs text-slate-400">Оқушылар</div>
              <div className="text-xl font-bold text-white mt-0.5">{students.length}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-slate-400">Тесттер</div>
              <div className="text-xl font-bold text-amber-400 mt-0.5">{allTests.length}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-slate-400">Эсселер</div>
              <div className="text-xl font-bold text-sky-400 mt-0.5">{allEssays.length}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-slate-400">Сұрақтар</div>
              <div className="text-xl font-bold text-emerald-400 mt-0.5">1,024+</div>
            </div>
          </div>
        </div>

        {/* Tab navigation within dashboard */}
        <div className="mt-8 pt-4 border-t border-slate-800 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('students')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition ${
              activeTab === 'students'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Оқушылар және Рейтинг ({students.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('essay-eval')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition ${
              activeTab === 'essay-eval'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            <span>Эссе тексеру ({allEssays.filter(e => e.status === 'pending').length} күтуде)</span>
          </button>

          <button
            onClick={() => setActiveTab('questions')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition ${
              activeTab === 'questions'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Сұрақтар қоры (2 200+ база)</span>
          </button>
        </div>
      </div>

      {/* TAB 1: STUDENTS & LEADERBOARD */}
      {activeTab === 'students' && (
        <div className="space-y-6">
          {/* Controls: Search, Grade Filter, Export */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Search */}
              <div className="relative flex-grow sm:flex-grow-0 sm:w-64">
                <input
                  type="text"
                  placeholder="Оқушы аты, поштасы, мектебі..."
                  value={studentSearch}
                  onChange={e => setStudentSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500 transition"
                />
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              </div>

              {/* Grade filter */}
              <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => setGradeFilter('all')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition ${
                    gradeFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400'
                  }`}
                >
                  Барлығы
                </button>
                <button
                  onClick={() => setGradeFilter('9')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition ${
                    gradeFilter === '9' ? 'bg-slate-800 text-white' : 'text-slate-400'
                  }`}
                >
                  9-сынып
                </button>
                <button
                  onClick={() => setGradeFilter('10')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition ${
                    gradeFilter === '10' ? 'bg-slate-800 text-white' : 'text-slate-400'
                  }`}
                >
                  10-сынып
                </button>
              </div>
            </div>

            {/* CSV Export */}
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center space-x-2 transition self-end md:self-auto"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>Excel/CSV экспорт</span>
            </button>
          </div>

          {/* Leaderboard Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3.5 text-center w-12">№</th>
                    <th className="px-4 py-3.5">Оқушының аты-жөні</th>
                    <th className="px-4 py-3.5">Сынып</th>
                    <th className="px-4 py-3.5">Мектеп / Қала</th>
                    <th className="px-4 py-3.5 text-center">Тест саны</th>
                    <th className="px-4 py-3.5 text-center">Орташа балы</th>
                    <th className="px-4 py-3.5 text-center">Үздік балы</th>
                    <th className="px-4 py-3.5 text-center">Эссе балы</th>
                    <th className="px-4 py-3.5 text-center font-bold text-amber-400">Рейтинг ұпайы</th>
                    <th className="px-4 py-3.5 text-right">Әрекет</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-8 text-center text-slate-500">
                        Оқушылар табылмады
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((item, idx) => {
                      const isTop3 = idx < 3;
                      return (
                        <tr key={item.student.id} className="hover:bg-slate-800/40 transition">
                          <td className="px-4 py-3.5 text-center font-bold">
                            {isTop3 ? (
                              <span
                                className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-black ${
                                  idx === 0
                                    ? 'bg-amber-500 text-slate-950'
                                    : idx === 1
                                    ? 'bg-slate-300 text-slate-950'
                                    : 'bg-amber-700 text-white'
                                }`}
                              >
                                {idx + 1}
                              </span>
                            ) : (
                              <span className="text-slate-500">{idx + 1}</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="font-semibold text-white text-sm">{item.student.name}</div>
                            <div className="text-slate-400 text-[11px]">{item.student.email}</div>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                              {item.student.grade}-сынып
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-slate-400">
                            <div>{item.student.school || '—'}</div>
                            <div className="text-[11px] text-slate-500">{item.student.city || ''}</div>
                          </td>
                          <td className="px-4 py-3.5 text-center font-mono font-medium text-white">
                            {item.testsCompleted}
                          </td>
                          <td className="px-4 py-3.5 text-center font-mono">
                            <span
                              className={`font-semibold ${
                                item.averageTestScore >= 80
                                  ? 'text-emerald-400'
                                  : item.averageTestScore >= 60
                                  ? 'text-amber-400'
                                  : 'text-slate-400'
                              }`}
                            >
                              {item.averageTestScore}%
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-center font-mono font-medium text-emerald-400">
                            {item.bestTestScore}%
                          </td>
                          <td className="px-4 py-3.5 text-center font-mono text-sky-400">
                            {item.essaysGraded > 0 ? `${item.averageEssayScore} / 25` : '—'}
                          </td>
                          <td className="px-4 py-3.5 text-center font-mono font-extrabold text-amber-400 text-sm">
                            {item.olympiadRatingPoints}
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <button
                              onClick={() => setSelectedStudentCard(item)}
                              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition inline-flex items-center space-x-1"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Картасы</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ESSAY EVALUATION HUB */}
      {activeTab === 'essay-eval' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-amber-400" />
              <span>Тапсырылған тарихи эсселерді тексеру және бағалау</span>
            </h2>
            <span className="text-xs text-slate-400">
              Барлығы: <strong className="text-white">{allEssays.length}</strong> эссе
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {allEssays.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-500 text-xs">
                Әзірге оқушылардан тапсырылған эсселер түскен жоқ.
              </div>
            ) : (
              allEssays.map(essay => {
                const isPending = essay.status === 'pending';
                const dateStr = new Date(essay.submittedAt).toLocaleDateString('kk-KZ', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={essay.id}
                    className={`bg-slate-900 border rounded-2xl p-6 shadow-sm space-y-4 ${
                      isPending ? 'border-amber-500/40 bg-amber-950/10' : 'border-slate-800'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          {isPending ? (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              Тексеруді күтуде
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              Бағаланды: {essay.score} / 25 балл
                            </span>
                          )}
                          <span className="text-xs text-slate-400 font-medium">
                            {essay.studentGrade}-сынып
                          </span>
                          <span className="text-xs text-slate-500">•</span>
                          <span className="text-xs text-slate-400">{dateStr}</span>
                        </div>
                        <h3 className="text-lg font-bold text-white">{essay.topicTitle}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Авторы: <strong className="text-slate-200">{essay.studentName}</strong> ({essay.studentEmail}) • Көлемі: {essay.wordCount} сөз
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          setGradingEssay(essay);
                          if (essay.rubricScores) {
                            setRubric(essay.rubricScores);
                          } else {
                            setRubric({
                              historicalAccuracy: 5,
                              chronologyAndCausality: 5,
                              historicalSourcesAndFigures: 5,
                              argumentationAndConclusion: 4,
                              academicStyleAndTerminology: 5,
                            });
                          }
                          setTeacherFeedback(essay.teacherFeedback || '');
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 self-start sm:self-auto cursor-pointer ${
                          isPending
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                        }`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>{isPending ? 'Эссені тексеру және бағалау' : 'Бағаны өзгерту'}</span>
                      </button>
                    </div>

                    {/* Essay snippet */}
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                      {essay.content}
                    </div>

                    {/* Teacher feedback view if already graded */}
                    {essay.teacherFeedback && (
                      <div className="p-3 bg-slate-950/70 border border-emerald-500/20 rounded-xl text-xs space-y-1">
                        <span className="text-emerald-400 font-bold block">Жетекші пікірі:</span>
                        <p className="text-slate-300 italic">"{essay.teacherFeedback}"</p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 3: QUESTION BANK MANAGEMENT (1,024 questions) */}
      {activeTab === 'questions' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1 w-full md:w-auto">
              <div className="flex items-center space-x-2">
                <Database className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Қазақстан тарихының олимпиадалық сұрақтар қоры</h3>
              </div>
              <p className="text-xs text-slate-400">
                Базада барлығы: <strong className="text-amber-400 font-mono">{totalQuestionsCount}</strong> сұрақ (5-10 сыныптар курсы)
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
              {/* Add question button */}
              <button
                onClick={() => {
                  setEditingQuestion({
                    grade: 8,
                    period: 'kazakh_khanate',
                    topic: 'Қазақ хандығы',
                    question: '',
                    options: ['', '', '', ''],
                    correctAnswer: 0,
                    explanation: '',
                  });
                  setIsQuestionModalOpen(true);
                }}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center space-x-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Жаңа сұрақ қосу</span>
              </button>

              {/* Download JSON export */}
              <a
                href="/api/questions/export/all"
                download="qazhistory-questions-1000.json"
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center space-x-1.5 transition"
              >
                <Download className="w-4 h-4 text-sky-400" />
                <span>JSON экспорт</span>
              </a>

              {/* Upload JSON import */}
              <label className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center space-x-1.5 transition cursor-pointer">
                <Upload className="w-4 h-4 text-emerald-400" />
                <span>JSON импорт</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {importStatus && (
            <div className="p-3 bg-slate-950 border border-amber-500/30 text-amber-300 text-xs rounded-xl flex items-center justify-between">
              <span>{importStatus}</span>
              <button onClick={() => setImportStatus(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Filters: Search, Grade, Period, Variant */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Сұрақты немесе тақырыпты іздеу..."
                value={questionSearch}
                onChange={e => {
                  setQuestionSearch(e.target.value);
                  setQuestionPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500 transition"
              />
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            </div>

            {/* Grade filter */}
            <select
              value={questionGradeFilter}
              onChange={e => {
                setQuestionGradeFilter(e.target.value);
                setQuestionPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500 transition"
            >
              <option value="all">Барлық сыныптар (5-10)</option>
              <option value="5">5-сынып (Тарихқа кіріспе)</option>
              <option value="6">6-сынып (Ежелгі заман, Сақтар, Ғұндар)</option>
              <option value="7">7-сынып (Орта ғасырлар, Түрік қағанаты)</option>
              <option value="8">8-сынып (Қазақ хандығы, Ұлт-азаттық)</option>
              <option value="9">9-сынып (Алаш, 1916 ж., Кеңес және ҰОС)</option>
              <option value="10">10-сынып (Желтоқсан, Тәуелсіз Қазақстан)</option>
            </select>

            {/* Period filter */}
            <select
              value={questionPeriodFilter}
              onChange={e => {
                setQuestionPeriodFilter(e.target.value);
                setQuestionPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500 transition"
            >
              <option value="all">Барлық кезеңдер</option>
              <option value="ancient">Ежелгі дәуір</option>
              <option value="medieval">Орта ғасырлар</option>
              <option value="kazakh_khanate">Қазақ хандығы</option>
              <option value="national_liberation">Ұлт-азаттық қозғалыстар</option>
              <option value="alash_soviet">Алаш және Кеңес кезеңі</option>
              <option value="independent_kazakhstan">Тәуелсіз Қазақстан</option>
            </select>

            {/* Variant filter */}
            <select
              value={questionVariantFilter}
              onChange={e => {
                setQuestionVariantFilter(e.target.value);
                setQuestionPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500 transition font-medium"
            >
              <option value="all">Барлық нұсқалар (жалпы база)</option>
              <optgroup label="Ресми олимпиадалық нұсқалар (10 нұсқа • 400 сұрақ)">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(v => (
                  <option key={v} value={v}>Ресми {v}-нұсқа (40 сұрақ)</option>
                ))}
              </optgroup>
              <optgroup label="Жаттығу I нұсқалары (11-20 нұсқалар)">
                {[11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map(v => (
                  <option key={v} value={v}>Жаттығу I {v}-нұсқа (40 сұрақ)</option>
                ))}
              </optgroup>
              <optgroup label="Жаттығу II Интенсив нұсқалары (21-30 нұсқалар)">
                {[21, 22, 23, 24, 25, 26, 27, 28, 29, 30].map(v => (
                  <option key={v} value={v}>Интенсив II {v}-нұсқа (40 сұрақ)</option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Questions list */}
          <div className="space-y-3">
            {questionsList.map((q, idx) => (
              <div
                key={q.id}
                className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-sm space-y-3 hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs text-slate-400">
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                      {q.grade}-сынып
                    </span>
                    <span>•</span>
                    <span className="text-slate-300 font-medium">{q.topic}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setEditingQuestion(q);
                        setIsQuestionModalOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition"
                      title="Өңдеу"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                      title="Өшіру"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="text-sm font-semibold text-white leading-relaxed">{q.question}</div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {q.options.map((opt, optIdx) => (
                    <div
                      key={optIdx}
                      className={`p-2 rounded-lg border flex items-center space-x-2 ${
                        optIdx === q.correctAnswer
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 font-medium'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400'
                      }`}
                    >
                      <span className="w-5 h-5 rounded flex items-center justify-center font-bold text-[10px] bg-slate-800 text-slate-300">
                        {['A', 'B', 'C', 'D'][optIdx]}
                      </span>
                      <span className="truncate">{opt}</span>
                      {optIdx === q.correctAnswer && (
                        <Check className="w-3.5 h-3.5 text-emerald-400 ml-auto flex-shrink-0" />
                      )}
                    </div>
                  ))}
                </div>

                <div className="text-[11px] text-slate-400 bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                  <strong className="text-amber-400/90">Түсіндірме:</strong> {q.explanation}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-slate-400">
            <span>
              Көрсетілуде: {(questionPage - 1) * 15 + 1} - {Math.min(questionPage * 15, totalQuestionsCount)} / {totalQuestionsCount}
            </span>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setQuestionPage(prev => Math.max(1, prev - 1))}
                disabled={questionPage === 1}
                className="px-3 py-1.5 rounded-lg bg-slate-800 disabled:opacity-40 text-white font-medium transition"
              >
                Алдыңғы
              </button>
              <span className="font-mono text-white">Бет: {questionPage}</span>
              <button
                onClick={() => setQuestionPage(prev => prev + 1)}
                disabled={questionPage * 15 >= totalQuestionsCount}
                className="px-3 py-1.5 rounded-lg bg-slate-800 disabled:opacity-40 text-white font-medium transition"
              >
                Келесі
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STUDENT INDIVIDUAL CARD MODAL */}
      {selectedStudentCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center font-bold text-lg">
                  {selectedStudentCard.student.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedStudentCard.student.name}</h3>
                  <p className="text-xs text-slate-400">
                    {selectedStudentCard.student.email} • {selectedStudentCard.student.grade}-сынып
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudentCard(null)}
                className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="text-[11px] text-slate-400">Рейтинг ұпайы</div>
                <div className="text-lg font-bold text-amber-400 font-mono mt-0.5">
                  {selectedStudentCard.olympiadRatingPoints}
                </div>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="text-[11px] text-slate-400">Орташа тест</div>
                <div className="text-lg font-bold text-emerald-400 font-mono mt-0.5">
                  {selectedStudentCard.averageTestScore}%
                </div>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="text-[11px] text-slate-400">Орындалған тест</div>
                <div className="text-lg font-bold text-white font-mono mt-0.5">
                  {selectedStudentCard.testsCompleted}
                </div>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="text-[11px] text-slate-400">Эссе балы</div>
                <div className="text-lg font-bold text-sky-400 font-mono mt-0.5">
                  {selectedStudentCard.averageEssayScore}/25
                </div>
              </div>
            </div>

            {/* Test attempts history */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Оқушының соңғы тест сынақтары:
              </h4>
              {allTests
                .filter(t => t.studentId === selectedStudentCard.student.id)
                .slice(0, 5)
                .map((t, i) => (
                  <div
                    key={t.id || i}
                    className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-white">50 сұрақтық олимпиадалық тест</div>
                      <div className="text-slate-500 text-[11px]">
                        {new Date(t.completedAt).toLocaleDateString('kk-KZ')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-amber-400 font-mono text-sm">
                        {t.scorePercentage}% ({t.correctCount}/50)
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            <div className="pt-2">
              <button
                onClick={() => setSelectedStudentCard(null)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition"
              >
                Жабу
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ESSAY GRADING MODAL */}
      {gradingEssay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Республикалық олимпиада: Эссені бағалау
                </span>
                <h3 className="text-lg font-bold text-white mt-1">{gradingEssay.topicTitle}</h3>
                <p className="text-xs text-slate-400">
                  Оқушы: <strong>{gradingEssay.studentName}</strong> ({gradingEssay.studentEmail}) • {gradingEssay.wordCount} сөз
                </p>
              </div>
              <button
                onClick={() => setGradingEssay(null)}
                className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Essay Full Text */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 text-xs sm:text-sm text-slate-200 leading-relaxed max-h-56 overflow-y-auto whitespace-pre-wrap">
              {gradingEssay.content}
            </div>

            {/* Rubric Evaluation Inputs */}
            <form onSubmit={handleSaveGrade} className="space-y-5">
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                  <span>5 критерий бойынша балл қою (0 - 5 балл):</span>
                  <span className="text-amber-400 font-mono text-sm">
                    Жалпы балл: {
                      rubric.historicalAccuracy +
                      rubric.chronologyAndCausality +
                      rubric.historicalSourcesAndFigures +
                      rubric.argumentationAndConclusion +
                      rubric.academicStyleAndTerminology
                    } / 25
                  </span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                    <div className="flex justify-between font-medium text-slate-300">
                      <span>1. Тарихи сауаттылық (фактілер):</span>
                      <strong className="text-amber-400">{rubric.historicalAccuracy}</strong>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={5}
                      value={rubric.historicalAccuracy}
                      onChange={e => setRubric({ ...rubric, historicalAccuracy: Number(e.target.value) })}
                      className="w-full accent-amber-500"
                    />
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                    <div className="flex justify-between font-medium text-slate-300">
                      <span>2. Хронология және себеп-салдар:</span>
                      <strong className="text-amber-400">{rubric.chronologyAndCausality}</strong>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={5}
                      value={rubric.chronologyAndCausality}
                      onChange={e => setRubric({ ...rubric, chronologyAndCausality: Number(e.target.value) })}
                      className="w-full accent-amber-500"
                    />
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                    <div className="flex justify-between font-medium text-slate-300">
                      <span>3. Тұлғалар мен деректерді қамту:</span>
                      <strong className="text-amber-400">{rubric.historicalSourcesAndFigures}</strong>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={5}
                      value={rubric.historicalSourcesAndFigures}
                      onChange={e => setRubric({ ...rubric, historicalSourcesAndFigures: Number(e.target.value) })}
                      className="w-full accent-amber-500"
                    />
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                    <div className="flex justify-between font-medium text-slate-300">
                      <span>4. Дәйектілік пен қорытынды:</span>
                      <strong className="text-amber-400">{rubric.argumentationAndConclusion}</strong>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={5}
                      value={rubric.argumentationAndConclusion}
                      onChange={e => setRubric({ ...rubric, argumentationAndConclusion: Number(e.target.value) })}
                      className="w-full accent-amber-500"
                    />
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1 sm:col-span-2">
                    <div className="flex justify-between font-medium text-slate-300">
                      <span>5. Академиялық стиль және терминология:</span>
                      <strong className="text-amber-400">{rubric.academicStyleAndTerminology}</strong>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={5}
                      value={rubric.academicStyleAndTerminology}
                      onChange={e => setRubric({ ...rubric, academicStyleAndTerminology: Number(e.target.value) })}
                      className="w-full accent-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Teacher written feedback */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 block">
                  Жетекшінің жазбаша пікірі мен ұсыныстары (оқушыға көрінеді):
                </label>
                <textarea
                  rows={4}
                  value={teacherFeedback}
                  onChange={e => setTeacherFeedback(e.target.value)}
                  placeholder="Оқушының жұмысына тарихи талдау, жетістіктері мен кемшіліктері бойынша нақты кеңестер жазыңыз..."
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setGradingEssay(null)}
                  className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Болдырмау
                </button>
                <button
                  type="submit"
                  disabled={submittingGrade}
                  className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-lg"
                >
                  {submittingGrade ? 'Сақталуда...' : 'Бағалауды бекіту'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD / EDIT QUESTION MODAL */}
      {isQuestionModalOpen && editingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">
                {editingQuestion.id ? 'Сұрақты өңдеу' : 'Жаңа олимпиадалық сұрақ қосу'}
              </h3>
              <button
                onClick={() => setIsQuestionModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Сынып:</label>
                  <select
                    value={editingQuestion.grade || 8}
                    onChange={e => setEditingQuestion({ ...editingQuestion, grade: Number(e.target.value) as any })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  >
                    <option value={5}>5-сынып</option>
                    <option value={6}>6-сынып</option>
                    <option value={7}>7-сынып</option>
                    <option value={8}>8-сынып</option>
                    <option value={9}>9-сынып</option>
                    <option value={10}>10-сынып</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Тарихи дәуір:</label>
                  <select
                    value={editingQuestion.period || 'kazakh_khanate'}
                    onChange={e => setEditingQuestion({ ...editingQuestion, period: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  >
                    <option value="ancient">Ежелгі дәуір</option>
                    <option value="medieval">Орта ғасырлар</option>
                    <option value="kazakh_khanate">Қазақ хандығы</option>
                    <option value="national_liberation">Ұлт-азаттық қозғалыстар</option>
                    <option value="alash_soviet">Алаш және Кеңес дәуірі</option>
                    <option value="independent_kazakhstan">Тәуелсіз Қазақстан</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold mb-1 block">Тақырыбы:</label>
                <input
                  type="text"
                  value={editingQuestion.topic || ''}
                  onChange={e => setEditingQuestion({ ...editingQuestion, topic: e.target.value })}
                  placeholder="Мысалы: «Қасым ханның қасқа жолы»"
                  required
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold mb-1 block">Сұрақ мәтіні:</label>
                <textarea
                  rows={3}
                  value={editingQuestion.question || ''}
                  onChange={e => setEditingQuestion({ ...editingQuestion, question: e.target.value })}
                  placeholder="Сұрақтың нақты мәтінін жазыңыз..."
                  required
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-semibold text-xs block">
                    Жауап нұсқалары ({editingQuestion.options?.length || 4} нұсқа, дұрысын белгілеңіз):
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const currentOpts = editingQuestion.options || ['', '', '', ''];
                      if (currentOpts.length === 4) {
                        setEditingQuestion({ ...editingQuestion, options: [...currentOpts, ''] });
                      } else {
                        setEditingQuestion({
                          ...editingQuestion,
                          options: currentOpts.slice(0, 4),
                          correctAnswer: Math.min(editingQuestion.correctAnswer || 0, 3),
                        });
                      }
                    }}
                    className="text-xs text-amber-400 hover:text-amber-300 font-medium cursor-pointer"
                  >
                    {(editingQuestion.options?.length || 4) === 4 ? '+ 5-нұсқаны (E) қосу' : '5-нұсқаны (E) алып тастау'}
                  </button>
                </div>
                {(editingQuestion.options || ['', '', '', '']).map((_, optIdx) => (
                  <div key={optIdx} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="correctOption"
                      checked={editingQuestion.correctAnswer === optIdx}
                      onChange={() => setEditingQuestion({ ...editingQuestion, correctAnswer: optIdx })}
                      className="accent-amber-500 w-4 h-4 cursor-pointer"
                    />
                    <span className="w-6 font-bold text-slate-400">
                      {['A', 'B', 'C', 'D', 'E'][optIdx]}:
                    </span>
                    <input
                      type="text"
                      value={editingQuestion.options?.[optIdx] || ''}
                      onChange={e => {
                        const newOpts = [...(editingQuestion.options || ['', '', '', ''])];
                        newOpts[optIdx] = e.target.value;
                        setEditingQuestion({ ...editingQuestion, options: newOpts });
                      }}
                      placeholder={`${['A', 'B', 'C', 'D', 'E'][optIdx]} нұсқасының мәтіні`}
                      required
                      className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="text-slate-300 font-semibold mb-1 block">Тарихи түсіндірме (комментарий):</label>
                <textarea
                  rows={3}
                  value={editingQuestion.explanation || ''}
                  onChange={e => setEditingQuestion({ ...editingQuestion, explanation: e.target.value })}
                  placeholder="Дұрыс жауаптың ғылыми тарихи түсіндірмесі мен даталарын көрсетіңіз..."
                  required
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="flex space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsQuestionModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Болдырмау
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  Сақтау
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
