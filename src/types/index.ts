/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type GradeLevel = 5 | 6 | 7 | 8 | 9 | 10;

export type HistoricalPeriod =
  | 'ancient' // Ежелгі Қазақстан (Тас, қола, сақтар, ғұндар, үйсіндер, қаңлылар)
  | 'medieval' // Орта ғасырлар (Түрік қағанаттары, Алтын Орда, Қазақ хандығының бастауы)
  | 'kazakh_khanate' // Қазақ хандығы дәуірі (XV-XVIII ғғ., хандар, жоңғар шапқыншылығы)
  | 'national_liberation' // Ұлт-азаттық қозғалыстар және Ресей отаршылдығы (XVIII-XIX ғғ.)
  | 'alash_soviet' // XX ғасыр басы, Алаш қозғалысы, 1916 ж. көтеріліс, Кеңес дәуірі, ҰОС
  | 'independent_kazakhstan'; // Желтоқсан оқиғасы, Тәуелсіз Қазақстан, қазіргі заман

export interface Question {
  id: string;
  grade: GradeLevel;
  period: HistoricalPeriod;
  topic: string;
  question: string;
  options: string[]; // Supports 4 or 5 options [A, B, C, D, E]
  correctAnswer: number; // 0, 1, 2, 3, or 4
  explanation: string;
  sourceOrEra?: string;
  variant?: number; // 1 to 10 if from official variants
  variantQuestionNum?: number; // 1 to 40
}

export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  grade: GradeLevel;
  school?: string;
  city?: string;
  role: 'student' | 'teacher';
  createdAt: string;
  lastActive: string;
}

export interface TestAnswerRecord {
  questionId: string;
  selectedAnswer: number | null;
  isCorrect: boolean;
  timeSpentSec?: number;
}

export interface TestResult {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentGrade: GradeLevel;
  totalQuestions: number;
  correctCount: number;
  scorePercentage: number;
  durationSeconds: number;
  completedAt: string;
  answers: TestAnswerRecord[];
  gradeBreakdown: Record<GradeLevel, { total: number; correct: number }>;
  periodBreakdown: Record<HistoricalPeriod, { total: number; correct: number }>;
}

export interface EssaySubmission {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentGrade: GradeLevel;
  topicId: string;
  topicTitle: string;
  content: string;
  wordCount: number;
  submittedAt: string;
  status: 'pending' | 'graded';
  score?: number; // 0 - 25 points
  rubricScores?: {
    historicalAccuracy: number; // 0 - 5
    chronologyAndCausality: number; // 0 - 5
    historicalSourcesAndFigures: number; // 0 - 5
    argumentationAndConclusion: number; // 0 - 5
    academicStyleAndTerminology: number; // 0 - 5
  };
  teacherFeedback?: string;
  gradedAt?: string;
  gradedBy?: string;
}

export interface StudentStats {
  student: StudentProfile;
  testsCompleted: number;
  averageTestScore: number;
  bestTestScore: number;
  totalQuestionsAnswered: number;
  essaysSubmitted: number;
  essaysGraded: number;
  averageEssayScore: number;
  olympiadRatingPoints: number; // Combined calculated ranking points
  rank?: number;
  recentTestDate?: string;
}

export interface EssayTopic {
  id: string;
  title: string;
  historicalPeriod: HistoricalPeriod;
  targetGrades: (9 | 10)[];
  context: string;
  guidingQuestions: string[];
  suggestedSources: string[];
}

export interface AnonymousLeaderboardEntry {
  rank: number;
  alias: string;
  studentId?: string;
  isCurrentUser: boolean;
  grade: GradeLevel;
  city?: string;
  ratingPoints: number;
  testsCompleted: number;
  averageTestScore: number;
  bestTestScore: number;
  essaysGraded: number;
  league: 'gold' | 'silver' | 'bronze' | 'participant';
}

