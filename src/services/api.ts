/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  Question, 
  StudentProfile, 
  TestResult, 
  EssaySubmission, 
  EssayTopic, 
  GradeLevel,
  AnonymousLeaderboardEntry
} from '../types/index.ts';

const API_BASE = '/api';

export async function fetchConfig() {
  const res = await fetch(`${API_BASE}/config`);
  return res.json();
}

export async function loginUser(payload: {
  email: string;
  name: string;
  grade?: number;
  school?: string;
  city?: string;
  forceRole?: 'student' | 'teacher';
}): Promise<{ user: StudentProfile }> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Кіру қатесі орын алды');
  }
  return res.json();
}

export async function updateUserProfile(payload: {
  id: string;
  name: string;
  grade: GradeLevel;
  school?: string;
  city?: string;
}): Promise<{ user: StudentProfile; success: boolean }> {
  const res = await fetch(`${API_BASE}/auth/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Профильді жаңарту кезінде қате кетті');
  }
  return res.json();
}

export async function fetchQuestions(params: {
  grade?: string;
  period?: string;
  variant?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params.grade) query.set('grade', params.grade);
  if (params.period) query.set('period', params.period);
  if (params.variant) query.set('variant', params.variant);
  if (params.search) query.set('search', params.search);
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));

  const res = await fetch(`${API_BASE}/questions?${query.toString()}`);
  return res.json();
}

export async function fetchOlympiadQuestionSet(count: number = 50): Promise<{ count: number; questions: Question[] }> {
  const res = await fetch(`${API_BASE}/questions/olympiad-set?count=${count}`);
  return res.json();
}

export async function fetchVariantQuestionSet(variantNumber: number): Promise<{ variant: number; count: number; questions: Question[] }> {
  const res = await fetch(`${API_BASE}/questions/variant/${variantNumber}`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || `${variantNumber}-нұсқаны жүктеу мүмкін болмады`);
  }
  return res.json();
}

export async function createQuestion(question: Partial<Question>): Promise<{ question: Question }> {
  const res = await fetch(`${API_BASE}/questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(question),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Сұрақты сақтау мүмкін болмады');
  }
  return res.json();
}

export async function updateQuestion(id: string, question: Partial<Question>): Promise<{ question: Question }> {
  const res = await fetch(`${API_BASE}/questions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(question),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Сұрақты жаңарту мүмкін болмады');
  }
  return res.json();
}

export async function deleteQuestion(id: string): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/questions/${id}`, {
    method: 'DELETE',
  });
  return res.json();
}

export async function importQuestions(questions: Partial<Question>[], mode: 'merge' | 'replace' = 'merge') {
  const res = await fetch(`${API_BASE}/questions/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ questions, mode }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Импорт кезінде қате кетті');
  }
  return res.json();
}

export async function submitTestResult(testData: Partial<TestResult>): Promise<{ test: TestResult }> {
  const res = await fetch(`${API_BASE}/tests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testData),
  });
  return res.json();
}

export async function fetchStudentTests(studentId: string): Promise<{ tests: TestResult[] }> {
  const res = await fetch(`${API_BASE}/tests/student/${studentId}`);
  return res.json();
}

export async function fetchAllTests(role: string = 'teacher'): Promise<{ tests: TestResult[] }> {
  const res = await fetch(`${API_BASE}/tests/all?role=${role}`, {
    headers: { 'x-role': role },
  });
  return res.json();
}

export async function fetchEssayTopics(): Promise<{ topics: EssayTopic[] }> {
  const res = await fetch(`${API_BASE}/essays/topics`);
  return res.json();
}

export async function submitEssay(essayData: Partial<EssaySubmission>): Promise<{ essay: EssaySubmission }> {
  const res = await fetch(`${API_BASE}/essays`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(essayData),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Эссені тапсыру кезінде қате орын алды');
  }
  return res.json();
}

export async function fetchStudentEssays(studentId: string): Promise<{ essays: EssaySubmission[] }> {
  const res = await fetch(`${API_BASE}/essays/student/${studentId}`);
  return res.json();
}

export async function fetchAllEssays(role: string = 'teacher'): Promise<{ essays: EssaySubmission[] }> {
  const res = await fetch(`${API_BASE}/essays/all?role=${role}`, {
    headers: { 'x-role': role },
  });
  return res.json();
}

export async function gradeEssay(
  id: string,
  payload: {
    score: number;
    rubricScores?: EssaySubmission['rubricScores'];
    teacherFeedback?: string;
    gradedBy?: string;
  },
  role: string = 'teacher'
): Promise<{ essay: EssaySubmission }> {
  const res = await fetch(`${API_BASE}/essays/${id}/grade?role=${role}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-role': role,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Эссені бағалау сәтсіз аяқталды');
  }
  return res.json();
}

export async function fetchLeaderboard(role: string = 'teacher') {
  const res = await fetch(`${API_BASE}/leaderboard?role=${role}`, {
    headers: { 'x-role': role },
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Рұқсат шектелген');
  }
  return res.json();
}

export async function fetchAnonymousLeaderboard(params: {
  grade?: string;
  currentUserId?: string;
}): Promise<{
  leaderboard: AnonymousLeaderboardEntry[];
  totalParticipants: number;
  currentUserRank?: number;
}> {
  const q = new URLSearchParams();
  if (params.grade) q.set('grade', params.grade);
  if (params.currentUserId) q.set('currentUserId', params.currentUserId);
  const res = await fetch(`${API_BASE}/leaderboard/anonymous?${q.toString()}`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Рейтингті жүктеу мүмкін болмады');
  }
  return res.json();
}

