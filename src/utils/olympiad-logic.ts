/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GradeLevel, HistoricalPeriod, Question, TestAnswerRecord } from '../types/index.ts';

/**
 * Counts words in text, supporting Kazakh Cyrillic letters (Ә, І, Ң, Ғ, Ү, Ұ, Қ, Ө, Һ)
 */
export function countWordsInKazakhText(text: string): number {
  if (!text || typeof text !== 'string') return 0;
  const trimmed = text.trim();
  if (trimmed.length === 0) return 0;
  const words = trimmed.split(/\s+/).filter(w => w.replace(/[.,/#!$%^&*;:{}=\-_`~()?"«»—–]/g, '').length > 0);
  return words.length;
}

/**
 * Validates whether a question object meets all requirements
 */
export function validateQuestion(q: Partial<Question>): { valid: boolean; error?: string } {
  if (!q.question || q.question.trim().length < 5) {
    return { valid: false, error: 'Сұрақ мәтіні тым қысқа немесе толтырылмаған' };
  }
  if (!Array.isArray(q.options) || q.options.length < 4 || q.options.length > 5) {
    return { valid: false, error: 'Сұрақта 4 немесе 5 жауап нұсқасы болуы керек' };
  }
  for (let i = 0; i < q.options.length; i++) {
    if (!q.options[i] || q.options[i].trim().length === 0) {
      return { valid: false, error: `${i + 1}-жауап нұсқасы бос болмауы керек` };
    }
  }
  if (typeof q.correctAnswer !== 'number' || q.correctAnswer < 0 || q.correctAnswer >= q.options.length) {
    return { valid: false, error: `Дұрыс жауап индексі 0 мен ${q.options.length - 1} аралығында болуы тиіс` };
  }
  if (!q.grade || q.grade < 5 || q.grade > 10) {
    return { valid: false, error: 'Сынып деңгейі 5-10 аралығында болуы керек' };
  }
  if (!q.explanation || q.explanation.trim().length < 5) {
    return { valid: false, error: 'Тарихи түсіндірме (комментарий) толтырылуы міндетті' };
  }
  return { valid: true };
}

/**
 * Calculates test statistics, breakdowns, and accuracy
 */
export function calculateTestScore(
  userAnswers: { [questionId: string]: number },
  questions: Question[]
): {
  correctCount: number;
  totalQuestions: number;
  scorePercentage: number;
  answersRecord: TestAnswerRecord[];
  gradeBreakdown: Record<GradeLevel, { total: number; correct: number }>;
  periodBreakdown: Record<HistoricalPeriod, { total: number; correct: number }>;
} {
  let correctCount = 0;
  const answersRecord: TestAnswerRecord[] = [];

  const gradeBreakdown: Record<GradeLevel, { total: number; correct: number }> = {
    5: { total: 0, correct: 0 },
    6: { total: 0, correct: 0 },
    7: { total: 0, correct: 0 },
    8: { total: 0, correct: 0 },
    9: { total: 0, correct: 0 },
    10: { total: 0, correct: 0 },
  };

  const periodBreakdown: Record<HistoricalPeriod, { total: number; correct: number }> = {
    ancient: { total: 0, correct: 0 },
    medieval: { total: 0, correct: 0 },
    kazakh_khanate: { total: 0, correct: 0 },
    national_liberation: { total: 0, correct: 0 },
    alash_soviet: { total: 0, correct: 0 },
    independent_kazakhstan: { total: 0, correct: 0 },
  };

  for (const q of questions) {
    const selected = userAnswers[q.id];
    const isAnswered = typeof selected === 'number';
    const isCorrect = isAnswered && selected === q.correctAnswer;

    if (isCorrect) {
      correctCount++;
    }

    answersRecord.push({
      questionId: q.id,
      selectedAnswer: isAnswered ? selected : null,
      isCorrect,
    });

    if (gradeBreakdown[q.grade]) {
      gradeBreakdown[q.grade].total++;
      if (isCorrect) gradeBreakdown[q.grade].correct++;
    }

    if (periodBreakdown[q.period]) {
      periodBreakdown[q.period].total++;
      if (isCorrect) periodBreakdown[q.period].correct++;
    }
  }

  const totalQuestions = questions.length;
  const scorePercentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  return {
    correctCount,
    totalQuestions,
    scorePercentage,
    answersRecord,
    gradeBreakdown,
    periodBreakdown,
  };
}

/**
 * Calculates total Olympiad Rating Points for a student
 * Points formula:
 * - Each test score contributes points: (scorePercentage * 10)
 * - Each graded essay contributes: (score / 25) * 500 points
 * - Active participation bonus
 */
export function calculateStudentRating(
  testScores: number[], // percentage array
  essayScores: number[] // 0-25 points array
): number {
  if (testScores.length === 0 && essayScores.length === 0) return 0;

  // Test contribution: average test percentage * 10, plus 25 points per completed test up to 500
  const avgTest = testScores.length > 0 
    ? testScores.reduce((a, b) => a + b, 0) / testScores.length 
    : 0;
  const testPart = Math.round(avgTest * 10);
  const volumeBonus = Math.min(testScores.length * 20, 400);

  // Essay contribution: average essay score (out of 25) * 20 => max 500
  const avgEssay = essayScores.length > 0 
    ? essayScores.reduce((a, b) => a + b, 0) / essayScores.length 
    : 0;
  const essayPart = Math.round(avgEssay * 20);

  return testPart + volumeBonus + essayPart;
}

/**
 * Balanced selector for 50-question Olympiad test:
 * Grade 5: 5 questions
 * Grade 6: 8 questions
 * Grade 7: 10 questions
 * Grade 8: 12 questions
 * Grade 9: 10 questions
 * Grade 10: 5 questions
 * Total: 50 questions
 */
export function selectBalancedOlympiadQuestions(
  pool: Question[],
  targetCount: number = 50,
  seed?: number
): Question[] {
  if (!pool || pool.length === 0) return [];
  if (pool.length <= targetCount) {
    return [...pool].sort(() => 0.5 - Math.random());
  }

  const distribution: Record<GradeLevel, number> = {
    5: Math.round(targetCount * 0.10), // 5
    6: Math.round(targetCount * 0.16), // 8
    7: Math.round(targetCount * 0.20), // 10
    8: Math.round(targetCount * 0.24), // 12
    9: Math.round(targetCount * 0.20), // 10
    10: Math.round(targetCount * 0.10), // 5
  };

  const selected: Question[] = [];
  const selectedIds = new Set<string>();
  const selectedTexts = new Set<string>();

  const getStem = (text: string) => 
    text.toLowerCase().replace(/[^a-zа-яәіңғүұқөһ0-9]/gi, '').slice(0, 80);

  // Shuffle helper
  const shuffle = <T>(arr: T[]): T[] => [...arr].sort(() => 0.5 - Math.random());

  // Group by grade
  const byGrade: Record<GradeLevel, Question[]> = {
    5: pool.filter(q => q.grade === 5),
    6: pool.filter(q => q.grade === 6),
    7: pool.filter(q => q.grade === 7),
    8: pool.filter(q => q.grade === 8),
    9: pool.filter(q => q.grade === 9),
    10: pool.filter(q => q.grade === 10),
  };

  // Pick per grade according to target
  (Object.keys(distribution) as unknown as GradeLevel[]).forEach(grade => {
    const need = distribution[grade];
    const available = shuffle(byGrade[grade] || []);
    for (const q of available) {
      if (selected.filter(item => item.grade === grade).length >= need) break;
      const stem = getStem(q.question);
      if (!selectedIds.has(q.id) && !selectedTexts.has(stem)) {
        selected.push(q);
        selectedIds.add(q.id);
        selectedTexts.add(stem);
      }
    }
  });

  // If we still need more questions to hit targetCount
  if (selected.length < targetCount) {
    const remaining = shuffle(pool.filter(q => !selectedIds.has(q.id)));
    for (const q of remaining) {
      if (selected.length >= targetCount) break;
      const stem = getStem(q.question);
      if (!selectedIds.has(q.id) && !selectedTexts.has(stem)) {
        selected.push(q);
        selectedIds.add(q.id);
        selectedTexts.add(stem);
      }
    }
  }

  return shuffle(selected.slice(0, targetCount));
}

export type TimePaceStatus = 'ahead' | 'on_track' | 'behind' | 'critical';

export interface TimePaceAnalysis {
  status: TimePaceStatus;
  statusLabel: string;
  recommendedSecondsPerQuestion: number;
  remainingSecondsPerQuestion: number;
  timeElapsedSeconds: number;
  percentTimeUsed: number;
  percentQuestionsCompleted: number;
}

/**
 * Formats seconds into mm:ss with padded zeros
 */
export function formatOlympiadTime(seconds: number): {
  formatted: string;
  minutes: number;
  seconds: number;
} {
  const safeSecs = Math.max(0, Math.floor(seconds));
  const m = Math.floor(safeSecs / 60);
  const s = safeSecs % 60;
  return {
    formatted: `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`,
    minutes: m,
    seconds: s,
  };
}

/**
 * Analyzes the student's pacing against the official Olympiad time limits
 */
export function analyzeOlympiadTimePace(
  totalSeconds: number,
  timeLeftSeconds: number,
  totalQuestions: number,
  answeredCount: number
): TimePaceAnalysis {
  const timeElapsed = Math.max(0, totalSeconds - timeLeftSeconds);
  const percentTimeUsed = totalSeconds > 0 ? Math.min(100, Math.round((timeElapsed / totalSeconds) * 100)) : 0;
  const percentQuestionsCompleted = totalQuestions > 0 ? Math.min(100, Math.round((answeredCount / totalQuestions) * 100)) : 0;
  
  const recommendedSecondsPerQuestion = totalQuestions > 0 ? Math.round(totalSeconds / totalQuestions) : 72;
  const unansweredCount = Math.max(1, totalQuestions - answeredCount);
  const remainingSecondsPerQuestion = Math.max(0, Math.round(timeLeftSeconds / unansweredCount));

  let status: TimePaceStatus = 'on_track';
  let statusLabel = 'Оңтайлы қарқын';

  if (timeLeftSeconds <= 300 && unansweredCount > 3) {
    status = 'critical';
    statusLabel = 'Шұғыл! Уақыт аз қалды';
  } else if (percentQuestionsCompleted >= percentTimeUsed + 10) {
    status = 'ahead';
    statusLabel = 'Қарқын жоғары (алдасыз)';
  } else if (percentTimeUsed > percentQuestionsCompleted + 15) {
    status = 'behind';
    statusLabel = 'Баяу қарқын (жылдамдатыңыз)';
  } else {
    status = 'on_track';
    statusLabel = 'Оңтайлы қарқын';
  }

  return {
    status,
    statusLabel,
    recommendedSecondsPerQuestion,
    remainingSecondsPerQuestion,
    timeElapsedSeconds: timeElapsed,
    percentTimeUsed,
    percentQuestionsCompleted,
  };
}

