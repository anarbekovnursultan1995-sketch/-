/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  countWordsInKazakhText,
  validateQuestion,
  calculateTestScore,
  calculateStudentRating,
  selectBalancedOlympiadQuestions,
  formatOlympiadTime,
  analyzeOlympiadTimePace,
} from './olympiad-logic.ts';
import { Question } from '../types/index.ts';

test('countWordsInKazakhText correctly counts Kazakh words and ignores punctuation', () => {
  const sample1 = 'Қазақ хандығының негізін 1465 жылы Керей мен Жәнібек сұлтандар қалады.';
  assert.equal(countWordsInKazakhText(sample1), 10);

  const sampleWithQuotes = '«Қасым ханның қасқа жолы» заңдар жинағы 5 бөлімнен тұрады!';
  assert.equal(countWordsInKazakhText(sampleWithQuotes), 9);

  assert.equal(countWordsInKazakhText(''), 0);
  assert.equal(countWordsInKazakhText('    '), 0);
});

test('validateQuestion verifies complete structure and catches errors', () => {
  const validQ: Question = {
    id: 'q-1',
    grade: 8,
    period: 'kazakh_khanate',
    topic: 'Қазақ хандығының құрылуы',
    question: 'Қазақ хандығы қай жылы құрылды?',
    options: ['1465 ж.', '1511 ж.', '1723 ж.', '1991 ж.'],
    correctAnswer: 0,
    explanation: 'М.Х.Дулатидің «Тарих-и Рашиди» еңбегінде Қазақ хандығының құрылған уақыты 1465-1466 жж. деп көрсетілген.',
  };

  assert.equal(validateQuestion(validQ).valid, true);

  // Valid 5-option question
  const valid5OptionQ: Question = {
    ...validQ,
    options: ['Палеолит', 'Мезолит', 'Неолит', 'Энеолит', 'Қола'],
    correctAnswer: 4,
  };
  assert.equal(validateQuestion(valid5OptionQ).valid, true);

  // Missing options
  assert.equal(validateQuestion({ ...validQ, options: ['A', 'B'] as any }).valid, false);

  // Invalid correctAnswer index
  assert.equal(validateQuestion({ ...validQ, correctAnswer: 5 }).valid, false);

  // Invalid grade
  assert.equal(validateQuestion({ ...validQ, grade: 12 as any }).valid, false);

  // Missing explanation
  assert.equal(validateQuestion({ ...validQ, explanation: '' }).valid, false);
});

test('calculateTestScore evaluates correct count, percentage, and period breakdown', () => {
  const mockQuestions: Question[] = [
    {
      id: 'q-1',
      grade: 6,
      period: 'ancient',
      topic: 'Сақтар',
      question: 'Сақ патшайымы?',
      options: ['Томирис', 'Зарина', 'Бегім', 'Айша'],
      correctAnswer: 0,
      explanation: 'Томирис - сақ-массагеттердің әйгілі патшайымы.',
    },
    {
      id: 'q-2',
      grade: 8,
      period: 'kazakh_khanate',
      topic: 'Хандар',
      question: '«Жеті жарғыны» қабылдаған хан?',
      options: ['Қасым', 'Тәуке', 'Абылай', 'Кенесары'],
      correctAnswer: 1,
      explanation: 'Тәуке хан XVII ғасырдың соңында «Жеті жарғы» заңдар жинағын бекітті.',
    },
  ];

  const userAnswers = {
    'q-1': 0, // correct
    'q-2': 0, // incorrect (chose 0 instead of 1)
  };

  const result = calculateTestScore(userAnswers, mockQuestions);
  assert.equal(result.correctCount, 1);
  assert.equal(result.totalQuestions, 2);
  assert.equal(result.scorePercentage, 50);
  assert.equal(result.periodBreakdown.ancient.correct, 1);
  assert.equal(result.periodBreakdown.kazakh_khanate.correct, 0);
  assert.equal(result.gradeBreakdown[6].correct, 1);
  assert.equal(result.gradeBreakdown[8].correct, 0);
});

test('calculateStudentRating computes points for tests and essays', () => {
  const testScores = [80, 90]; // average = 85 => 850 pts + 40 pts bonus = 890
  const essayScores = [20, 24]; // average = 22 => (22 * 20) = 440
  const rating = calculateStudentRating(testScores, essayScores);
  assert.equal(rating, 850 + 40 + 440);

  // Empty returns 0
  assert.equal(calculateStudentRating([], []), 0);
});

test('selectBalancedOlympiadQuestions respects total count and picks questions', () => {
  const samplePool: Question[] = [];
  const grades = [5, 6, 7, 8, 9, 10] as const;
  for (let i = 0; i < 120; i++) {
    const gr = grades[i % grades.length];
    samplePool.push({
      id: `q-pool-${i}`,
      grade: gr,
      period: 'medieval',
      topic: `Topic ${i}`,
      question: `Тарихи сұрақ нөмірі ${i}?`,
      options: ['Жауап A', 'Жауап B', 'Жауап C', 'Жауап D'],
      correctAnswer: 0,
      explanation: `Түсіндірме ${i}`,
    });
  }

  const selected50 = selectBalancedOlympiadQuestions(samplePool, 50);
  assert.equal(selected50.length, 50);

  // Ensure unique IDs
  const uniqueIds = new Set(selected50.map(q => q.id));
  assert.equal(uniqueIds.size, 50);
});

test('selectBalancedOlympiadQuestions strictly prevents duplicate question texts', () => {
  const poolWithDupes: Question[] = [];
  for (let i = 0; i < 60; i++) {
    poolWithDupes.push({
      id: `dupe-${i}`,
      grade: 7,
      period: 'kazakh_khanate',
      topic: 'Қазақ хандығы',
      question: 'Қасым ханның қасқа жолы заңы қай ғасырда бекіді?',
      options: ['XVI ғ.', 'XV ғ.', 'XVII ғ.', 'XVIII ғ.'],
      correctAnswer: 0,
      explanation: 'XVI ғ. басында қабылданды.',
    });
  }
  const picked = selectBalancedOlympiadQuestions(poolWithDupes, 10);
  assert.equal(picked.length, 1); // Only 1 unique question picked despite 60 items
});

test('formatOlympiadTime formats seconds into mm:ss padded string', () => {
  const t1 = formatOlympiadTime(3600);
  assert.equal(t1.formatted, '60:00');
  assert.equal(t1.minutes, 60);
  assert.equal(t1.seconds, 0);

  const t2 = formatOlympiadTime(125);
  assert.equal(t2.formatted, '02:05');
  assert.equal(t2.minutes, 2);
  assert.equal(t2.seconds, 5);

  const t3 = formatOlympiadTime(0);
  assert.equal(t3.formatted, '00:00');
});

test('analyzeOlympiadTimePace computes pace status, remaining seconds and percentages', () => {
  // Scenario 1: On track - 50 questions, 60 mins (3600s), half time used (1800s left), 25 answered
  const paceOnTrack = analyzeOlympiadTimePace(3600, 1800, 50, 25);
  assert.equal(paceOnTrack.status, 'on_track');
  assert.equal(paceOnTrack.percentTimeUsed, 50);
  assert.equal(paceOnTrack.percentQuestionsCompleted, 50);
  assert.equal(paceOnTrack.remainingSecondsPerQuestion, 72);

  // Scenario 2: Ahead of pace - 50 questions, 3000s left (only 600s used), 25 answered (50% done vs 17% time)
  const paceAhead = analyzeOlympiadTimePace(3600, 3000, 50, 25);
  assert.equal(paceAhead.status, 'ahead');

  // Scenario 3: Behind pace - 50 questions, 1000s left (72% time used), 10 answered (20% done)
  const paceBehind = analyzeOlympiadTimePace(3600, 1000, 50, 10);
  assert.equal(paceBehind.status, 'behind');

  // Scenario 4: Critical - 200s left (under 5 mins) and 15 questions unanswered
  const paceCritical = analyzeOlympiadTimePace(3600, 200, 50, 35);
  assert.equal(paceCritical.status, 'critical');
});


