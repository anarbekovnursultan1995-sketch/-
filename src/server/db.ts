/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'node:fs';
import path from 'node:path';
import { Question, StudentProfile, TestResult, EssaySubmission, EssayTopic } from '../types/index.ts';
import { generateFullCurriculumQuestionBank } from '../data/generate-full-question-bank.ts';
import { parseOfficialVariantsFile } from '../../scripts/parse-official-variants.ts';
import { generateSimulationBank } from '../data/olympiad-simulation-bank.ts';
import { generateExtendedOlympiadQuestions } from '../data/olympiad-extended-questions.ts';
import { ESSAY_TOPICS } from '../data/historical-curriculum.ts';
import { calculateStudentRating } from '../utils/olympiad-logic.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

export interface DatabaseSchema {
  questions: Question[];
  students: StudentProfile[];
  tests: TestResult[];
  essays: EssaySubmission[];
  essayTopics: EssayTopic[];
  settings: {
    teacherEmail: string;
    testDurationMinutes: number;
    questionsPerTest: number;
  };
}

export function buildMasterQuestionBank(): Question[] {
  let official: Question[] = [];
  try {
    official = parseOfficialVariantsFile();
  } catch (err) {
    console.warn('Could not parse official variants from asset:', err);
  }
  const sim = generateSimulationBank();
  const curriculum = generateFullCurriculumQuestionBank();
  const extended = generateExtendedOlympiadQuestions();

  // Deduplicate strictly by normalized question text to guarantee non-repeating questions
  const seenTexts = new Set<string>();
  const seenIds = new Set<string>();
  const combined: Question[] = [];

  const getStem = (text: string) =>
    text.toLowerCase().replace(/[^a-zа-яәіңғүұқөһ0-9]/gi, '').slice(0, 80);

  // 1. First add all official variants (1 to 10)
  for (const q of official) {
    if (!q || !q.question) continue;
    combined.push(q);
    seenIds.add(q.id);
    seenTexts.add(getStem(q.question));
  }

  // 2. Add all simulation variants (11 to 30)
  for (const q of sim) {
    if (!q || !q.question) continue;
    combined.push(q);
    seenIds.add(q.id);
    seenTexts.add(getStem(q.question));
  }

  // 3. Add curriculum and extended questions only if non-duplicate
  for (const q of [...curriculum, ...extended]) {
    if (!q || !q.question) continue;
    const stem = getStem(q.question);
    if (!seenIds.has(q.id) && !seenTexts.has(stem)) {
      combined.push(q);
      seenIds.add(q.id);
      seenTexts.add(stem);
    }
  }

  console.log(`[Master Question Bank] Combined total non-repeating: ${combined.length} questions across 30 variants and curriculum.`);
  return combined;
}

// Default initial state
function createInitialDatabase(): DatabaseSchema {
  const generatedQuestions = buildMasterQuestionBank();

  const teacherEmail = 'anarbekov.nursultan1995@gmail.com';

  const initialStudents: StudentProfile[] = [
    {
      id: 'teacher-main',
      name: 'Анарбеков Нұрсұлтан',
      email: teacherEmail,
      grade: 10,
      school: 'Республикалық мамандандырылған дарынды балалар мектебі',
      city: 'Алматы',
      role: 'teacher',
      createdAt: '2026-09-01T08:00:00.000Z',
      lastActive: new Date().toISOString(),
    },
    {
      id: 'std-1',
      name: 'Мұратұлы Айсұлтан',
      email: 'aisultan.murat@olympiad.kz',
      grade: 10,
      school: '№178 мамандандырылған лицей',
      city: 'Алматы',
      role: 'student',
      createdAt: '2026-09-10T09:15:00.000Z',
      lastActive: '2026-10-28T14:20:00.000Z',
    },
    {
      id: 'std-2',
      name: 'Серікқызы Дина',
      email: 'dina.serikkyzy@olympiad.kz',
      grade: 9,
      school: 'НЗМ (NIS) ФМБ',
      city: 'Астана',
      role: 'student',
      createdAt: '2026-09-12T11:00:00.000Z',
      lastActive: '2026-10-29T16:45:00.000Z',
    },
    {
      id: 'std-3',
      name: 'Қанатұлы Ерасыл',
      email: 'erasyl.kanat@olympiad.kz',
      grade: 10,
      school: '«Білім-Инновация» лицейі',
      city: 'Шымкент',
      role: 'student',
      createdAt: '2026-09-15T10:30:00.000Z',
      lastActive: '2026-10-27T18:10:00.000Z',
    },
    {
      id: 'std-4',
      name: 'Асқарқызы Мәдина',
      email: 'madina.askar@olympiad.kz',
      grade: 9,
      school: '№39 гимназия',
      city: 'Қарағанды',
      role: 'student',
      createdAt: '2026-09-18T12:00:00.000Z',
      lastActive: '2026-10-25T11:30:00.000Z',
    },
    {
      id: 'std-5',
      name: 'Болатұлы Нұрислам',
      email: 'nurislam.bolat@olympiad.kz',
      grade: 10,
      school: '№3 дарынды балалар лицейі',
      city: 'Ақтөбе',
      role: 'student',
      createdAt: '2026-09-20T14:40:00.000Z',
      lastActive: '2026-10-26T15:20:00.000Z',
    },
    {
      id: 'std-6',
      name: 'Дәулетқызы Аружан',
      email: 'aruzhan.daulet@olympiad.kz',
      grade: 9,
      school: '№8 лицей-мектеп',
      city: 'Павлодар',
      role: 'student',
      createdAt: '2026-09-22T08:50:00.000Z',
      lastActive: '2026-10-24T19:00:00.000Z',
    },
  ];

  const initialTests: TestResult[] = [
    {
      id: 'test-seed-1a',
      studentId: 'std-1',
      studentName: 'Мұратұлы Айсұлтан',
      studentEmail: 'aisultan.murat@olympiad.kz',
      studentGrade: 10,
      totalQuestions: 50,
      correctCount: 37,
      scorePercentage: 74,
      durationSeconds: 2750,
      completedAt: '2026-10-14T10:15:00.000Z',
      answers: [],
      gradeBreakdown: { 5: { total: 5, correct: 4 }, 6: { total: 8, correct: 6 }, 7: { total: 10, correct: 7 }, 8: { total: 12, correct: 9 }, 9: { total: 10, correct: 7 }, 10: { total: 5, correct: 4 } },
      periodBreakdown: { ancient: { total: 13, correct: 10 }, medieval: { total: 10, correct: 7 }, kazakh_khanate: { total: 12, correct: 9 }, national_liberation: { total: 5, correct: 3 }, alash_soviet: { total: 5, correct: 4 }, independent_kazakhstan: { total: 5, correct: 4 } },
    },
    {
      id: 'test-seed-1b',
      studentId: 'std-1',
      studentName: 'Мұратұлы Айсұлтан',
      studentEmail: 'aisultan.murat@olympiad.kz',
      studentGrade: 10,
      totalQuestions: 50,
      correctCount: 42,
      scorePercentage: 84,
      durationSeconds: 2580,
      completedAt: '2026-10-21T11:40:00.000Z',
      answers: [],
      gradeBreakdown: { 5: { total: 5, correct: 5 }, 6: { total: 8, correct: 7 }, 7: { total: 10, correct: 8 }, 8: { total: 12, correct: 10 }, 9: { total: 10, correct: 8 }, 10: { total: 5, correct: 4 } },
      periodBreakdown: { ancient: { total: 13, correct: 11 }, medieval: { total: 10, correct: 8 }, kazakh_khanate: { total: 12, correct: 11 }, national_liberation: { total: 5, correct: 4 }, alash_soviet: { total: 5, correct: 4 }, independent_kazakhstan: { total: 5, correct: 4 } },
    },
    {
      id: 'test-seed-1',
      studentId: 'std-1',
      studentName: 'Мұратұлы Айсұлтан',
      studentEmail: 'aisultan.murat@olympiad.kz',
      studentGrade: 10,
      totalQuestions: 50,
      correctCount: 46,
      scorePercentage: 92,
      durationSeconds: 2450,
      completedAt: '2026-10-28T14:20:00.000Z',
      answers: [],
      gradeBreakdown: { 5: { total: 5, correct: 5 }, 6: { total: 8, correct: 8 }, 7: { total: 10, correct: 9 }, 8: { total: 12, correct: 11 }, 9: { total: 10, correct: 9 }, 10: { total: 5, correct: 4 } },
      periodBreakdown: { ancient: { total: 13, correct: 13 }, medieval: { total: 10, correct: 9 }, kazakh_khanate: { total: 12, correct: 11 }, national_liberation: { total: 5, correct: 4 }, alash_soviet: { total: 5, correct: 5 }, independent_kazakhstan: { total: 5, correct: 4 } },
    },
    {
      id: 'test-seed-2',
      studentId: 'std-2',
      studentName: 'Серікқызы Дина',
      studentEmail: 'dina.serikkyzy@olympiad.kz',
      studentGrade: 9,
      totalQuestions: 50,
      correctCount: 44,
      scorePercentage: 88,
      durationSeconds: 2600,
      completedAt: '2026-10-29T16:45:00.000Z',
      answers: [],
      gradeBreakdown: { 5: { total: 5, correct: 5 }, 6: { total: 8, correct: 7 }, 7: { total: 10, correct: 9 }, 8: { total: 12, correct: 10 }, 9: { total: 10, correct: 9 }, 10: { total: 5, correct: 4 } },
      periodBreakdown: { ancient: { total: 13, correct: 12 }, medieval: { total: 10, correct: 9 }, kazakh_khanate: { total: 12, correct: 10 }, national_liberation: { total: 5, correct: 5 }, alash_soviet: { total: 5, correct: 4 }, independent_kazakhstan: { total: 5, correct: 4 } },
    },
    {
      id: 'test-seed-3',
      studentId: 'std-3',
      studentName: 'Қанатұлы Ерасыл',
      studentEmail: 'erasyl.kanat@olympiad.kz',
      studentGrade: 10,
      totalQuestions: 50,
      correctCount: 41,
      scorePercentage: 82,
      durationSeconds: 2890,
      completedAt: '2026-10-27T18:10:00.000Z',
      answers: [],
      gradeBreakdown: { 5: { total: 5, correct: 4 }, 6: { total: 8, correct: 7 }, 7: { total: 10, correct: 8 }, 8: { total: 12, correct: 10 }, 9: { total: 10, correct: 8 }, 10: { total: 5, correct: 4 } },
      periodBreakdown: { ancient: { total: 13, correct: 11 }, medieval: { total: 10, correct: 8 }, kazakh_khanate: { total: 12, correct: 10 }, national_liberation: { total: 5, correct: 4 }, alash_soviet: { total: 5, correct: 4 }, independent_kazakhstan: { total: 5, correct: 4 } },
    },
  ];

  const initialEssays: EssaySubmission[] = [
    {
      id: 'essay-seed-1',
      studentId: 'std-1',
      studentName: 'Мұратұлы Айсұлтан',
      studentEmail: 'aisultan.murat@olympiad.kz',
      studentGrade: 10,
      topicId: 'essay-1',
      topicTitle: '«Қасым ханның қасқа жолы» – Қазақ мемлекеттілігінің нығаюы мен халықаралық беделінің артуы',
      content: 'Қазақ хандығының XVI ғасырдың бас кезіндегі дамуы Қасым ханның есімімен тікелей байланысты. Мұхаммед Хайдар Дулати өзінің әйгілі «Тарих-и Рашиди» еңбегінде: «Қасым хан бүкіл Дешті Қыпшаққа толық билік жүргізді, оның жасағында 300 мың жауынгер болды, халқы 1 миллионға жетті» деп жазған болатын. Қасым хан хандық билікті барынша орталықтандырып, мемлекеттің шекарасын Батыста Жайыққа, Оңтүстікте Сырдарияға, Солтүстікте Ұлытау мен Ертіске дейін кеңейтті. Мемлекеттің ең басты құқықтық тірегі ретінде «Қасым ханның қасқа жолы» атты 5 бөлімнен тұратын заңдар жинағы қабылданды. Бұл кодекс жер дауы, мүлік заңы, қылмыс пен жаза, әскери тәртіп және елшілік жораларын нақты бекітті. Сонымен қатар, Қасым хан Мәскеу княздігімен және Бабыр мемлекетімен елшілік қатынастар орнатып, Қазақ хандығын халықаралық аренада танытты. Қорытындылай келе, Қасым хан кезеңі – қазақ мемлекеттілігінің қалыптасу дәуіріндегі алтын діңгек болды.',
      wordCount: 142,
      submittedAt: '2026-10-28T15:10:00.000Z',
      status: 'graded',
      score: 24,
      rubricScores: {
        historicalAccuracy: 5,
        chronologyAndCausality: 5,
        historicalSourcesAndFigures: 5,
        argumentationAndConclusion: 5,
        academicStyleAndTerminology: 4,
      },
      teacherFeedback: 'Өте жақсы жазылған тарихи эссе! «Тарих-и Рашиди» дерегі орынды келтірілген. Заңның бес бөлімі мен дипломатиялық қатынастар нақты ашылған.',
      gradedAt: '2026-10-29T10:00:00.000Z',
      gradedBy: 'Анарбеков Нұрсұлтан (Жетекші)',
    },
    {
      id: 'essay-seed-2',
      studentId: 'std-2',
      studentName: 'Серікқызы Дина',
      studentEmail: 'dina.serikkyzy@olympiad.kz',
      studentGrade: 9,
      topicId: 'essay-3',
      topicTitle: 'Алаш қозғалысы және ұлттық автономия идеясы: Тәуелсіз Қазақстанның рухани бастауы',
      content: 'XX ғасырдың басында қазақ даласында орын алған ұлт-азаттық күрестің ең биік шыңы – Алаш қозғалысы. Әлихан Бөкейхан, Ахмет Байтұрсынұлы, Міржақып Дулатұлы бастаған зиялылар «Қазақ» газеті арқылы елдің көзін ашты. 1917 жылғы желтоқсанда Орынборда өткен екінші жалпықазақ съезінде Алаш автономиясы мен Алашорда үкіметі жарияланды. Олар жерді қазақ халқының меншігі деп тануды, әскер жасақтауды және зайырлы мемлекет құруды мақсат етті. Бүгінгі біздің Тәуелсіз Қазақстан – сол Алаш арыстарының асыл арманының заңды жалғасы.',
      wordCount: 88,
      submittedAt: '2026-10-29T17:30:00.000Z',
      status: 'pending',
    },
  ];

  return {
    questions: generatedQuestions,
    students: initialStudents,
    tests: initialTests,
    essays: initialEssays,
    essayTopics: ESSAY_TOPICS,
    settings: {
      teacherEmail,
      testDurationMinutes: 60,
      questionsPerTest: 50,
    },
  };
}

let dbCache: DatabaseSchema | null = null;

export function getDatabase(): DatabaseSchema {
  if (dbCache) return dbCache;

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      dbCache = JSON.parse(content);
      // Ensure questions is loaded properly and contains all 30 variants and 2400+ questions
      const hasVariant30 = dbCache?.questions?.some(q => q.variant === 30);
      if (!dbCache || !dbCache.questions || dbCache.questions.length < 2400 || !hasVariant30) {
        console.log(`Current questions count is ${dbCache?.questions?.length || 0}. Upgrading to full 30 variants master bank...`);
        const fullBank = buildMasterQuestionBank();
        if (dbCache) {
          dbCache.questions = fullBank;
        } else {
          dbCache = createInitialDatabase();
        }
        saveDatabase(dbCache);
      }
      return dbCache!;
    } catch (e) {
      console.error('Error reading db.json, recreating initial database:', e);
      dbCache = createInitialDatabase();
      saveDatabase(dbCache);
      return dbCache;
    }
  } else {
    dbCache = createInitialDatabase();
    saveDatabase(dbCache);
    return dbCache;
  }
}

export function saveDatabase(data: DatabaseSchema): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    dbCache = data;
  } catch (e) {
    console.error('Error saving db.json:', e);
  }
}

// Student Aggregated Statistics & Leaderboard (Strictly for Teacher)
export function getTeacherLeaderboard() {
  const db = getDatabase();
  const students = db.students.filter(s => s.role === 'student');

  return students.map(student => {
    const studentTests = db.tests.filter(t => t.studentId === student.id);
    const studentEssays = db.essays.filter(e => e.studentId === student.id);

    const testScores = studentTests.map(t => t.scorePercentage);
    const gradedEssays = studentEssays.filter(e => e.status === 'graded' && typeof e.score === 'number');
    const essayScores = gradedEssays.map(e => e.score!);

    const averageTestScore = testScores.length > 0 
      ? Math.round(testScores.reduce((a, b) => a + b, 0) / testScores.length) 
      : 0;

    const bestTestScore = testScores.length > 0 ? Math.max(...testScores) : 0;

    const averageEssayScore = essayScores.length > 0 
      ? Math.round((essayScores.reduce((a, b) => a + b, 0) / essayScores.length) * 10) / 10 
      : 0;

    const ratingPoints = calculateStudentRating(testScores, essayScores);

    const recentTest = studentTests.sort((a, b) => 
      new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    )[0];

    return {
      student,
      testsCompleted: studentTests.length,
      averageTestScore,
      bestTestScore,
      totalQuestionsAnswered: studentTests.length * 50,
      essaysSubmitted: studentEssays.length,
      essaysGraded: gradedEssays.length,
      averageEssayScore,
      olympiadRatingPoints: ratingPoints,
      recentTestDate: recentTest ? recentTest.completedAt : student.lastActive,
    };
  }).sort((a, b) => b.olympiadRatingPoints - a.olympiadRatingPoints);
}
