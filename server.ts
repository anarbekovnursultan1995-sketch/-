/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';
import { getDatabase, saveDatabase, getTeacherLeaderboard } from './src/server/db.ts';
import { validateQuestion, selectBalancedOlympiadQuestions } from './src/utils/olympiad-logic.ts';
import { Question, StudentProfile, TestResult, EssaySubmission } from './src/types/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEACHER_EMAIL = 'anarbekov.nursultan1995@gmail.com';
const PORT = 3000;

async function startServer() {
  const app = express();

  // Support high payload size for bulk question import
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Initialize DB on start
  getDatabase();

  // ==========================================
  // CONFIG & HEALTH
  // ==========================================
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  app.get('/api/config', (req, res) => {
    const db = getDatabase();
    res.json({
      teacherEmail: TEACHER_EMAIL,
      totalQuestions: db.questions.length,
      settings: db.settings,
      totalStudents: db.students.filter(s => s.role === 'student').length,
    });
  });

  // ==========================================
  // AUTHENTICATION & PROFILES
  // ==========================================
  app.post('/api/auth/login', (req, res) => {
    const { email, name, grade, school, city, forceRole } = req.body;
    if (!email || !name) {
      return res.status(400).json({ error: 'Email және аты-жөні толтырылуы тиіс' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const isTeacher = cleanEmail === TEACHER_EMAIL.toLowerCase() || forceRole === 'teacher';

    const db = getDatabase();
    let user = db.students.find(s => s.email.toLowerCase() === cleanEmail);

    const parsedGrade = Number(grade);
    const validGrade = ([5, 6, 7, 8, 9, 10].includes(parsedGrade) ? parsedGrade : 10) as GradeLevel;

    if (user) {
      user.lastActive = new Date().toISOString();
      if (isTeacher) user.role = 'teacher';
      if (name) user.name = String(name).trim();
      if (grade && [5, 6, 7, 8, 9, 10].includes(Number(grade))) {
        user.grade = Number(grade) as GradeLevel;
      }
      if (school !== undefined) user.school = String(school).trim();
      if (city !== undefined) user.city = String(city).trim();
      saveDatabase(db);
      return res.json({ user });
    }

    const newUser: StudentProfile = {
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: String(name).trim(),
      email: cleanEmail,
      grade: validGrade,
      school: school ? String(school).trim() : undefined,
      city: city ? String(city).trim() : undefined,
      role: isTeacher ? 'teacher' : 'student',
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
    };

    db.students.push(newUser);
    saveDatabase(db);
    return res.status(201).json({ user: newUser });
  });

  // Profile update endpoint (Name, Grade 5-10, School, City)
  app.put('/api/auth/profile', (req, res) => {
    const { id, name, grade, school, city } = req.body;
    if (!id || !name) {
      return res.status(400).json({ error: 'ID және оқушының аты-жөні толтырылуы міндетті' });
    }

    const gNum = Number(grade);
    if (![5, 6, 7, 8, 9, 10].includes(gNum)) {
      return res.status(400).json({ error: 'Сынып 5, 6, 7, 8, 9 немесе 10 болуы керек' });
    }

    const db = getDatabase();
    const user = db.students.find(s => s.id === id);
    if (!user) {
      return res.status(404).json({ error: 'Оқушы табылмады' });
    }

    user.name = String(name).trim();
    user.grade = gNum as GradeLevel;
    user.school = school !== undefined ? String(school).trim() : user.school;
    user.city = city !== undefined ? String(city).trim() : user.city;
    user.lastActive = new Date().toISOString();

    // Synchronize past tests and essays for this student
    db.tests.forEach(t => {
      if (t.studentId === id) {
        t.studentName = user.name;
        t.studentGrade = user.grade;
      }
    });

    db.essays.forEach(e => {
      if (e.studentId === id) {
        e.studentName = user.name;
        e.studentGrade = user.grade;
      }
    });

    saveDatabase(db);
    return res.json({ success: true, user });
  });

  app.get('/api/auth/user/:email', (req, res) => {
    const cleanEmail = String(req.params.email).trim().toLowerCase();
    const db = getDatabase();
    const user = db.students.find(s => s.email.toLowerCase() === cleanEmail);
    if (!user) {
      return res.status(404).json({ error: 'Пайдаланушы табылмады' });
    }
    return res.json({ user });
  });

  // ==========================================
  // QUESTIONS MANAGEMENT (1000+ Questions)
  // ==========================================
  app.get('/api/questions', (req, res) => {
    const db = getDatabase();
    let list = [...db.questions];

    const { grade, period, variant, search, page = '1', limit = '20' } = req.query;

    if (grade && grade !== 'all') {
      list = list.filter(q => q.grade === Number(grade));
    }
    if (period && period !== 'all') {
      list = list.filter(q => q.period === period);
    }
    if (variant && variant !== 'all') {
      list = list.filter(q => q.variant === Number(variant));
    }
    if (search && typeof search === 'string' && search.trim().length > 0) {
      const qLower = search.toLowerCase();
      list = list.filter(
        q =>
          q.question.toLowerCase().includes(qLower) ||
          q.topic.toLowerCase().includes(qLower) ||
          q.options.some(opt => opt.toLowerCase().includes(qLower)) ||
          q.explanation.toLowerCase().includes(qLower)
      );
    }

    const total = list.length;
    const pageNum = Math.max(1, parseInt(String(page), 10));
    const pageSize = Math.max(1, parseInt(String(limit), 10));
    const startIndex = (pageNum - 1) * pageSize;
    const paginated = list.slice(startIndex, startIndex + pageSize);

    res.json({
      total,
      page: pageNum,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      questions: paginated,
    });
  });

  // Get specific Olympiad Variant (e.g. Variant 1..10 or 11..20, 40 questions)
  app.get('/api/questions/variant/:variantNumber', (req, res) => {
    const vNum = parseInt(req.params.variantNumber, 10);
    const db = getDatabase();
    const variantQuestions = db.questions
      .filter(q => q.variant === vNum)
      .sort((a, b) => (a.variantQuestionNum || 0) - (b.variantQuestionNum || 0));

    if (variantQuestions.length === 0) {
      return res.status(404).json({ error: `${vNum}-нұсқа сұрақтары табылмады` });
    }

    res.json({
      variant: vNum,
      count: variantQuestions.length,
      questions: variantQuestions,
    });
  });

  // Get balanced 50 questions for Olympiad test
  app.get('/api/questions/olympiad-set', (req, res) => {
    const db = getDatabase();
    const count = parseInt(String(req.query.count || '50'), 10);
    const selected = selectBalancedOlympiadQuestions(db.questions, count);
    res.json({
      count: selected.length,
      questions: selected,
    });
  });

  // Add new question (Teacher only)
  app.post('/api/questions', (req, res) => {
    const body = req.body as Partial<Question>;
    const validation = validateQuestion(body);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const db = getDatabase();
    const newQuestion: Question = {
      id: `q-custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      grade: body.grade!,
      period: body.period || 'kazakh_khanate',
      topic: body.topic || 'Жалпы Қазақстан тарихы',
      question: body.question!.trim(),
      options: body.options!,
      correctAnswer: body.correctAnswer!,
      explanation: body.explanation!.trim(),
      sourceOrEra: body.sourceOrEra || `Қазақстан тарихы ${body.grade}-сынып`,
    };

    db.questions.unshift(newQuestion);
    saveDatabase(db);
    res.status(201).json({ question: newQuestion, totalQuestions: db.questions.length });
  });

  // Edit question
  app.put('/api/questions/:id', (req, res) => {
    const { id } = req.params;
    const body = req.body as Partial<Question>;
    const db = getDatabase();
    const index = db.questions.findIndex(q => q.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Сұрақ табылмады' });
    }

    const validation = validateQuestion({ ...db.questions[index], ...body });
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    db.questions[index] = {
      ...db.questions[index],
      ...body,
      id, // keep immutable id
    };
    saveDatabase(db);
    res.json({ question: db.questions[index] });
  });

  // Delete question
  app.delete('/api/questions/:id', (req, res) => {
    const { id } = req.params;
    const db = getDatabase();
    const prevLen = db.questions.length;
    db.questions = db.questions.filter(q => q.id !== id);

    if (db.questions.length === prevLen) {
      return res.status(404).json({ error: 'Сұрақ табылмады' });
    }

    saveDatabase(db);
    res.json({ success: true, remaining: db.questions.length });
  });

  // Export all questions as JSON
  app.get('/api/questions/export/all', (req, res) => {
    const db = getDatabase();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="qazhistory-questions-1000.json"');
    res.send(JSON.stringify(db.questions, null, 2));
  });

  // Import questions from JSON
  app.post('/api/questions/import', (req, res) => {
    const { questions, mode = 'merge' } = req.body;
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'Сұрақтар тізімі (array) бос немесе қате' });
    }

    const db = getDatabase();
    const validQuestions: Question[] = [];

    for (const raw of questions) {
      const v = validateQuestion(raw);
      if (v.valid) {
        validQuestions.push({
          id: raw.id || `q-imp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          grade: raw.grade,
          period: raw.period || 'kazakh_khanate',
          topic: raw.topic || 'Тарих',
          question: raw.question.trim(),
          options: raw.options,
          correctAnswer: raw.correctAnswer,
          explanation: raw.explanation.trim(),
          sourceOrEra: raw.sourceOrEra,
        });
      }
    }

    if (validQuestions.length === 0) {
      return res.status(400).json({ error: 'Жүктелген деректерде жарамды сұрақ табылмады' });
    }

    if (mode === 'replace') {
      db.questions = validQuestions;
    } else {
      // Merge unique
      const existingIds = new Set(db.questions.map(q => q.id));
      for (const q of validQuestions) {
        if (!existingIds.has(q.id)) {
          db.questions.push(q);
          existingIds.add(q.id);
        }
      }
    }

    saveDatabase(db);
    res.json({
      success: true,
      importedCount: validQuestions.length,
      totalQuestions: db.questions.length,
    });
  });

  // ==========================================
  // TESTS & RESULTS
  // ==========================================
  app.post('/api/tests', (req, res) => {
    const body = req.body as TestResult;
    if (!body.studentId || !body.studentName) {
      return res.status(400).json({ error: 'Оқушы деректері толық емес' });
    }

    const db = getDatabase();
    const newTest: TestResult = {
      ...body,
      id: `test-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      completedAt: new Date().toISOString(),
    };

    db.tests.push(newTest);

    // Update student activity
    const std = db.students.find(s => s.id === body.studentId);
    if (std) {
      std.lastActive = newTest.completedAt;
    }

    saveDatabase(db);
    res.status(201).json({ test: newTest });
  });

  // Student: Get ONLY their own tests
  app.get('/api/tests/student/:studentId', (req, res) => {
    const { studentId } = req.params;
    const db = getDatabase();
    const myTests = db.tests
      .filter(t => t.studentId === studentId)
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
    res.json({ tests: myTests });
  });

  // Teacher: Get all tests
  app.get('/api/tests/all', (req, res) => {
    const isTeacher = req.headers['x-role'] === 'teacher' || req.query.role === 'teacher';
    if (!isTeacher) {
      return res.status(403).json({ error: 'Тек жетекші үшін ғана қолжетімді' });
    }
    const db = getDatabase();
    res.json({ tests: db.tests });
  });

  // ==========================================
  // HISTORICAL ESSAYS
  // ==========================================
  app.get('/api/essays/topics', (req, res) => {
    const db = getDatabase();
    res.json({ topics: db.essayTopics });
  });

  app.post('/api/essays', (req, res) => {
    const { studentId, studentName, studentEmail, studentGrade, topicId, topicTitle, content, wordCount } = req.body;
    if (!studentId || !content || content.trim().length < 20) {
      return res.status(400).json({ error: 'Эссе мәтіні тым қысқа немесе толтырылмаған' });
    }

    const db = getDatabase();
    const newEssay: EssaySubmission = {
      id: `essay-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      studentId,
      studentName,
      studentEmail,
      studentGrade: Number(studentGrade) === 9 ? 9 : 10,
      topicId,
      topicTitle,
      content: content.trim(),
      wordCount: Number(wordCount) || 0,
      submittedAt: new Date().toISOString(),
      status: 'pending',
    };

    db.essays.push(newEssay);

    const std = db.students.find(s => s.id === studentId);
    if (std) {
      std.lastActive = newEssay.submittedAt;
    }

    saveDatabase(db);
    res.status(201).json({ essay: newEssay });
  });

  // Student: Get ONLY their own essays
  app.get('/api/essays/student/:studentId', (req, res) => {
    const { studentId } = req.params;
    const db = getDatabase();
    const myEssays = db.essays
      .filter(e => e.studentId === studentId)
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    res.json({ essays: myEssays });
  });

  // Teacher: Get all essays
  app.get('/api/essays/all', (req, res) => {
    const isTeacher = req.headers['x-role'] === 'teacher' || req.query.role === 'teacher';
    if (!isTeacher) {
      return res.status(403).json({ error: 'Тек жетекші үшін ғана қолжетімді' });
    }
    const db = getDatabase();
    res.json({ essays: db.essays });
  });

  // Teacher: Grade essay
  app.post('/api/essays/:id/grade', (req, res) => {
    const isTeacher = req.headers['x-role'] === 'teacher' || req.query.role === 'teacher';
    if (!isTeacher) {
      return res.status(403).json({ error: 'Тек жетекші ғана эссені бағалай алады' });
    }

    const { id } = req.params;
    const { score, rubricScores, teacherFeedback, gradedBy } = req.body;

    const db = getDatabase();
    const essay = db.essays.find(e => e.id === id);
    if (!essay) {
      return res.status(404).json({ error: 'Эссе жұмысы табылмады' });
    }

    essay.status = 'graded';
    essay.score = Math.min(25, Math.max(0, Number(score) || 0));
    essay.rubricScores = rubricScores;
    essay.teacherFeedback = teacherFeedback ? String(teacherFeedback).trim() : undefined;
    essay.gradedAt = new Date().toISOString();
    essay.gradedBy = gradedBy || 'Анарбеков Нұрсұлтан (Жетекші)';

    saveDatabase(db);
    res.json({ essay });
  });

  // ==========================================
  // PRIVACY CONDITION: LEADERBOARD & STUDENT ROSTER
  // Strictly restricted to Teacher/Supervisor!
  // ==========================================
  app.get('/api/leaderboard', (req, res) => {
    const isTeacher = req.headers['x-role'] === 'teacher' || req.query.role === 'teacher';
    if (!isTeacher) {
      return res.status(403).json({
        error: 'ҚҰПИЯЛЫЛЫҚ ШАРТЫ: Оқушылар бір-бірінің рейтингін немесе нәтижелерін көре алмайды. Бұл дерек тек жетекшіге ғана қолжетімді.',
      });
    }

    const leaderboard = getTeacherLeaderboard();
    res.json({ leaderboard });
  });

  const OLYMPIAD_ALIASES = [
    '«Алтын адам» үміткері',
    '«Барыс» олимпиадашысы',
    '«Сұңқар» тарихшысы',
    '«Тұлпар» ізденушісі',
    '«Алаш» ізбасары',
    '«Сақ» сарбазы',
    '«Отырар» білгірі',
    '«Түркістан» зерделісі',
    '«Қасым хан» зерттеушісі',
    '«Бөкей» оқымыстысы',
    '«Күлтегін» оқырманы',
    '«Жеті жарғы» білімпазы',
    '«Тайбуға» зерттеушісі',
    '«Сарайшық» білгірі',
    '«Ұлытау» қыраны',
  ];

  // Anonymous Leaderboard for Students (Privacy protected with aliases)
  app.get('/api/leaderboard/anonymous', (req, res) => {
    const { grade, currentUserId } = req.query;
    let full = getTeacherLeaderboard();

    if (grade && grade !== 'all') {
      full = full.filter(item => item.student.grade === Number(grade));
    }

    let currentUserRank: number | undefined;

    const anonymousList = full.map((item, idx) => {
      const rank = idx + 1;
      const isCurrent = Boolean(currentUserId && item.student.id === currentUserId);
      if (isCurrent) {
        currentUserRank = rank;
      }

      let league: 'gold' | 'silver' | 'bronze' | 'participant' = 'participant';
      if (rank === 1) league = 'gold';
      else if (rank <= 3) league = 'silver';
      else if (rank <= 5) league = 'bronze';

      // Anonymize: Only the current student sees their real name; all others receive aliases
      const alias = isCurrent
        ? item.student.name
        : `${OLYMPIAD_ALIASES[idx % OLYMPIAD_ALIASES.length]} #${rank}`;

      return {
        rank,
        alias,
        isCurrentUser: isCurrent,
        grade: item.student.grade,
        city: item.student.city || 'Қазақстан',
        ratingPoints: item.olympiadRatingPoints,
        testsCompleted: item.testsCompleted,
        averageTestScore: item.averageTestScore,
        bestTestScore: item.bestTestScore,
        essaysGraded: item.essaysGraded,
        league,
      };
    });

    res.json({
      leaderboard: anonymousList,
      totalParticipants: full.length,
      currentUserRank,
    });
  });

  app.get('/api/students', (req, res) => {
    const isTeacher = req.headers['x-role'] === 'teacher' || req.query.role === 'teacher';
    if (!isTeacher) {
      return res.status(403).json({
        error: 'ҚҰПИЯЛЫЛЫҚ ШАРТЫ: Оқушылар тізімі мен нәтижелері тек жетекшіге қолжетімді.',
      });
    }

    const leaderboard = getTeacherLeaderboard();
    res.json({ students: leaderboard });
  });

  // Mount Vite development middlewares
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });

  app.use(vite.middlewares);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`QazHistory Olympiad Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
