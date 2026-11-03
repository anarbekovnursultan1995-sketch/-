/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { EssaySubmission, EssayTopic, StudentProfile } from '../types/index.ts';
import { fetchEssayTopics, submitEssay, fetchStudentEssays } from '../services/api.ts';
import { countWordsInKazakhText } from '../utils/olympiad-logic.ts';
import { 
  FileText, 
  Send, 
  Save, 
  Sparkles, 
  CheckCircle, 
  Clock, 
  HelpCircle, 
  Award,
  ChevronDown,
  ChevronUp,
  MessageSquare
} from 'lucide-react';

interface EssayModuleProps {
  currentUser: StudentProfile;
}

export const EssayModule: React.FC<EssayModuleProps> = ({ currentUser }) => {
  const [topics, setTopics] = useState<EssayTopic[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [essayContent, setEssayContent] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [myEssays, setMyEssays] = useState<EssaySubmission[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'write' | 'history'>('write');
  const [expandedEssayId, setExpandedEssayId] = useState<string | null>(null);

  // Load topics and student's submitted essays
  useEffect(() => {
    const loadData = async () => {
      try {
        const topicsRes = await fetchEssayTopics();
        setTopics(topicsRes.topics);
        if (topicsRes.topics.length > 0 && !selectedTopicId) {
          setSelectedTopicId(topicsRes.topics[0].id);
        }

        const essaysRes = await fetchStudentEssays(currentUser.id);
        setMyEssays(essaysRes.essays);
      } catch (e) {
        console.error('Error loading essay data:', e);
      }
    };
    loadData();
  }, [currentUser.id]);

  // Load draft from localStorage
  useEffect(() => {
    if (selectedTopicId) {
      const draftKey = `essay_draft_${currentUser.id}_${selectedTopicId}`;
      const saved = localStorage.getItem(draftKey);
      if (saved && !essayContent) {
        setEssayContent(saved);
      }
    }
  }, [selectedTopicId, currentUser.id]);

  // Auto-save draft
  const handleContentChange = (text: string) => {
    setEssayContent(text);
    if (selectedTopicId) {
      const draftKey = `essay_draft_${currentUser.id}_${selectedTopicId}`;
      localStorage.setItem(draftKey, text);
    }
  };

  const currentTopic = topics.find(t => t.id === selectedTopicId) || topics[0];
  const wordCount = countWordsInKazakhText(essayContent);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTopic) return;

    if (wordCount < 100) {
      setErrorMessage('Эссе көлемі тым аз (кемінде 100-150 сөз жазылуы қажет).');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await submitEssay({
        studentId: currentUser.id,
        studentName: currentUser.name,
        studentEmail: currentUser.email,
        studentGrade: currentUser.grade,
        topicId: currentTopic.id,
        topicTitle: currentTopic.title,
        content: essayContent,
        wordCount,
      });

      // Clear draft
      localStorage.removeItem(`essay_draft_${currentUser.id}_${selectedTopicId}`);
      setEssayContent('');
      setSuccessMessage('Тарихи эссеңіз жетекшіге сәтті жіберілді! Тексеру қорытындысы осы бетте пайда болады.');
      
      // Update essays list
      setMyEssays(prev => [res.essay, ...prev]);
      setActiveSubTab('history');
    } catch (err: any) {
      setErrorMessage(err.message || 'Эссе жіберу кезінде қате кетті');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Module Title Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Республикалық олимпиада: 2-кезең
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Тарихи эссе жазу модулі
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm">
              Қазақстан тарихының өзекті мәселелері бойынша тарихи сауаттылық, дәйектілік пен авторлық көзқарасты шыңдау алаңы.
            </p>
          </div>

          {/* Subtabs switcher: Write vs My Submissions */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
            <button
              onClick={() => setActiveSubTab('write')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
                activeSubTab === 'write'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Эссе жазу
            </button>
            <button
              onClick={() => setActiveSubTab('history')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 ${
                activeSubTab === 'history'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Менің жұмыстарым</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-white text-[10px]">
                {myEssays.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-2xl flex items-center justify-between animate-in fade-in">
          <div className="flex items-center space-x-2 text-xs sm:text-sm">
            <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-xs text-emerald-400 hover:underline ml-4"
          >
            Жабу
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-2xl text-xs sm:text-sm flex items-center space-x-2 animate-in fade-in">
          <span>{errorMessage}</span>
        </div>
      )}

      {activeSubTab === 'write' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Writing Area (2 columns) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Topic Selector */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Эссе тақырыбын таңдаңыз:
              </label>
              <select
                value={selectedTopicId}
                onChange={e => {
                  setSelectedTopicId(e.target.value);
                  setEssayContent('');
                }}
                className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 transition font-medium"
              >
                {topics.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>

              {currentTopic && (
                <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 space-y-3 text-xs">
                  <div>
                    <span className="text-slate-400 font-semibold block mb-1">Тарихи мәнмәтін (контекст):</span>
                    <p className="text-slate-300 leading-relaxed">{currentTopic.context}</p>
                  </div>

                  <div>
                    <span className="text-amber-400 font-semibold block mb-1">Жетекші сұрақтар мен бағыттар:</span>
                    <ul className="space-y-1 text-slate-300 list-disc list-inside">
                      {currentTopic.guidingQuestions.map((gq, i) => (
                        <li key={i}>{gq}</li>
                      ))}
                    </ul>
                  </div>

                  {currentTopic.suggestedSources && (
                    <div className="pt-1 text-slate-400">
                      <strong>Ұсынылатын тарихи дереккөздер:</strong> {currentTopic.suggestedSources.join(', ')}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Essay Input Editor */}
            <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
                  <FileText className="w-4 h-4 text-amber-400" />
                  <span>Эссе мәтіні:</span>
                </span>

                {/* Word Counter */}
                <div className="flex items-center space-x-2">
                  <span
                    className={`text-xs font-mono font-semibold px-2.5 py-1 rounded-md border ${
                      wordCount >= 250 && wordCount <= 350
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : wordCount > 350
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    {wordCount} сөз (ұсынылатын: 250-350)
                  </span>
                </div>
              </div>

              <textarea
                value={essayContent}
                onChange={e => handleContentChange(e.target.value)}
                rows={14}
                placeholder="Эссеңізді осында жазыңыз... Кіріспе, негізгі бөлім (нақты тарихи фактілер, хронология, тұлғалар рөлі) және қорытынды ойларыңызды жүйелі түрде өрбітіңіз."
                className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm sm:text-base leading-relaxed focus:outline-none focus:border-amber-500 transition resize-y font-sans"
              />

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="text-xs text-slate-500 flex items-center space-x-1">
                  <Save className="w-3.5 h-3.5 text-slate-400" />
                  <span>Қаралама автоматты түрде сақталады</span>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition shadow-md flex items-center space-x-2 cursor-pointer"
                >
                  {submitting ? (
                    <span>Жіберілуде...</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Жетекшіге тексеруге жіберу</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Sidebar: Evaluation Criteria (1 column) */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 sticky top-20">
              <div className="flex items-center space-x-2 pb-2 border-b border-slate-800">
                <Award className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Бағалау критерийлері (25 балл)
                </h3>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1">
                  <div className="flex justify-between font-semibold text-slate-200">
                    <span>1. Тарихи сауаттылық</span>
                    <span className="text-amber-400 font-mono">0 - 5 балл</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Тарихи фактілердің дәлдігі, бұрмалаушылықтың болмауы.
                  </p>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1">
                  <div className="flex justify-between font-semibold text-slate-200">
                    <span>2. Хронология және себеп-салдар</span>
                    <span className="text-amber-400 font-mono">0 - 5 балл</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Оқиғалардың уақыт реттілігі және себептері мен салдарларының ашылуы.
                  </p>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1">
                  <div className="flex justify-between font-semibold text-slate-200">
                    <span>3. Тұлғалар мен деректер</span>
                    <span className="text-amber-400 font-mono">0 - 5 балл</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Тарихи тұлғалардың рөлін талдау, жазба деректерге сілтеме жасау.
                  </p>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1">
                  <div className="flex justify-between font-semibold text-slate-200">
                    <span>4. Дәйектілік пен қорытынды</span>
                    <span className="text-amber-400 font-mono">0 - 5 балл</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Логикалық ой қорыту, жеке авторлық тұжырымның дәлелденуі.
                  </p>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1">
                  <div className="flex justify-between font-semibold text-slate-200">
                    <span>5. Академиялық стиль</span>
                    <span className="text-amber-400 font-mono">0 - 5 балл</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Ғылыми-тарихи терминологияны сауатты қолдану, тіл байлығы.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300">
                Жетекші әрбір критерий бойынша балл қойып, жазбаша пікір мен ұсыныстарын жазады.
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Student's Submissions History */
        <div className="space-y-4">
          {myEssays.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center space-y-3">
              <FileText className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-white">Әзірге тапсырылған эсселер жоқ</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Тарихи эссе жазу үшін «Эссе жазу» қойындысын таңдап, республикалық тақырыптардың бірін орындаңыз.
              </p>
              <button
                onClick={() => setActiveSubTab('write')}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition"
              >
                Эссе жазуды бастау
              </button>
            </div>
          ) : (
            myEssays.map(essay => {
              const isGraded = essay.status === 'graded';
              const isExpanded = expandedEssayId === essay.id;
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
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        {isGraded ? (
                          <span className="inline-flex items-center text-xs font-bold px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Бағаланды: {essay.score} / 25 балл
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            <Clock className="w-3 h-3 mr-1" />
                            Жетекші тексеруінде
                          </span>
                        )}
                        <span className="text-xs text-slate-400 font-mono">{essay.wordCount} сөз</span>
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-white">{essay.topicTitle}</h3>
                      <div className="text-xs text-slate-500">{dateStr}</div>
                    </div>

                    <button
                      onClick={() => setExpandedEssayId(isExpanded ? null : essay.id)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center space-x-1 transition self-start sm:self-auto"
                    >
                      <span>{isExpanded ? 'Жасыру' : 'Толық оқу'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Teacher Feedback Card */}
                  {isGraded && essay.teacherFeedback && (
                    <div className="bg-slate-950 border border-amber-500/30 rounded-xl p-4 text-xs space-y-2">
                      <div className="flex items-center space-x-2 text-amber-400 font-bold">
                        <MessageSquare className="w-4 h-4" />
                        <span>Жетекшінің пікірі мен ескертулері:</span>
                      </div>
                      <p className="text-slate-200 leading-relaxed italic">
                        "{essay.teacherFeedback}"
                      </p>
                      {essay.gradedBy && (
                        <div className="text-[11px] text-slate-400 text-right">
                          Бағалаған: {essay.gradedBy} ({new Date(essay.gradedAt!).toLocaleDateString('kk-KZ')})
                        </div>
                      )}
                    </div>
                  )}

                  {/* Expanded Full Essay Text */}
                  {isExpanded && (
                    <div className="pt-3 border-t border-slate-800 text-slate-300 text-sm leading-relaxed whitespace-pre-wrap bg-slate-950/40 p-4 rounded-xl">
                      {essay.content}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
