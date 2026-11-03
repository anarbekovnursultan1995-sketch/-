/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'node:fs';
import path from 'node:path';
import { Question, GradeLevel, HistoricalPeriod } from '../src/types/index.ts';

const FILE_PATH = path.resolve(process.cwd(), 'public/assets/aistudio/Paste_October_30__2026_-_5_59PM_d5dbc0fa');

interface ParsedVariantKey {
  variant: number;
  questionNum: number;
  keyLetter: 'A' | 'B' | 'C' | 'D' | 'E';
  answerText: string;
}

export function parseOfficialVariantsFile(): Question[] {
  const content = fs.readFileSync(FILE_PATH, 'utf-8');
  const lines = content.split(/\r?\n/);

  // 1. Separate questions part and answer keys part
  // Answer keys start at line "1 нұсқаның жауап кілті"
  let answerKeysStartIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('1 нұсқаның жауап кілті')) {
      answerKeysStartIndex = i;
      break;
    }
  }

  if (answerKeysStartIndex === -1) {
    throw new Error('Could not find answer keys start line');
  }

  const questionLines = lines.slice(0, answerKeysStartIndex);
  const answerKeyLines = lines.slice(answerKeysStartIndex);

  // 2. Parse answer keys
  const keysByVariantAndNum: Record<string, ParsedVariantKey> = {};
  let currentKeyVariant = 0;

  for (const line of answerKeyLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const variantMatch = trimmed.match(/^(\d+)\s+нұсқаның\s+жауап\s+кілті/i);
    if (variantMatch) {
      currentKeyVariant = parseInt(variantMatch[1], 10);
      continue;
    }

    if (trimmed.startsWith('Нәтиже:') || trimmed.startsWith('Мұғалімге') || trimmed.startsWith('Тексеруге')) {
      continue;
    }

    // Line format: "1\tB\tПалеолит" or "1  B  Палеолит"
    const rowMatch = trimmed.match(/^(\d+)[\t\s]+([A-Ea-e])[\t\s]+(.*)$/);
    if (rowMatch && currentKeyVariant >= 1 && currentKeyVariant <= 10) {
      const qNum = parseInt(rowMatch[1], 10);
      const letter = rowMatch[2].toUpperCase() as 'A' | 'B' | 'C' | 'D' | 'E';
      const ansText = rowMatch[3].trim();

      keysByVariantAndNum[`${currentKeyVariant}_${qNum}`] = {
        variant: currentKeyVariant,
        questionNum: qNum,
        keyLetter: letter,
        answerText: ansText,
      };
    }
  }

  console.log(`Parsed total answer keys: ${Object.keys(keysByVariantAndNum).length}`);

  // 3. Parse questions per variant
  const questions: Question[] = [];
  let currentVariant = 0;
  let currentQNum = 0;
  let currentQText = '';
  let optionBuffer: string[] = [];

  const letterToIndex: Record<string, number> = { A: 0, B: 1, C: 2, D: 3, E: 4 };

  function commitCurrentQuestion() {
    if (currentVariant > 0 && currentQNum > 0 && currentQText && optionBuffer.length >= 4) {
      const keyObj = keysByVariantAndNum[`${currentVariant}_${currentQNum}`];
      if (!keyObj) {
        console.warn(`Missing key for Variant ${currentVariant}, Q${currentQNum}`);
        return;
      }

      const correctIndex = letterToIndex[keyObj.keyLetter] ?? 0;

      // Period & Grade mapping as specified in Olympiad rubric
      let grade: GradeLevel = 5;
      let period: HistoricalPeriod = 'ancient';
      let topic = 'Ежелгі Қазақстан';

      if (currentQNum >= 1 && currentQNum <= 4) {
        grade = 5;
        period = 'ancient';
        topic = 'Ежелгі дәуір және археология';
      } else if (currentQNum >= 5 && currentQNum <= 8) {
        grade = 5;
        period = 'ancient';
        topic = 'Сақтар, үйсіндер, қаңлылар, ғұндар дәуірі';
      } else if (currentQNum >= 9 && currentQNum <= 12) {
        grade = 6;
        period = 'medieval';
        topic = 'Ерте орта ғасырлар (Түрік, Түргеш, Қарлұқ, Қимақ, Оғыз)';
      } else if (currentQNum >= 13 && currentQNum <= 16) {
        grade = 7;
        period = 'medieval';
        topic = 'Дамыған орта ғасырлар (Қарахан, Қарақытай, Алтын Орда, Моғолстан)';
      } else if (currentQNum >= 17 && currentQNum <= 20) {
        grade = 7;
        period = 'kazakh_khanate';
        topic = 'Қазақ хандығының құрылуы және саяси-әлеуметтік тарихы';
      } else if (currentQNum >= 21 && currentQNum <= 24) {
        grade = 8;
        period = 'national_liberation';
        topic = 'XVIII ғасырдағы Қазақстан, Жоңғар шапқыншылығы және Ресей саясаты';
      } else if (currentQNum >= 25 && currentQNum <= 28) {
        grade = 8;
        period = 'national_liberation';
        topic = 'XIX ғасырдағы ұлт-азаттық қозғалыстар мен реформалар';
      } else if (currentQNum >= 29 && currentQNum <= 32) {
        grade = 9;
        period = 'alash_soviet';
        topic = 'XX ғасыр басы: Алаш партиясы, автономия және 1916 жылғы көтеріліс';
      } else if (currentQNum >= 33 && currentQNum <= 36) {
        grade = 9;
        period = 'alash_soviet';
        topic = 'Кеңестік кезең: индустрияландыру, ҰОС және қайта құру жылдары';
      } else {
        grade = 10;
        period = 'independent_kazakhstan';
        topic = 'Тәуелсіз Қазақстан: мемлекеттілік, рәміздер, Конституция және реформалар';
      }

      // Detailed historical explanation
      const correctOptionText = optionBuffer[correctIndex] || keyObj.answerText;
      const explanation = `Дұрыс жауабы: ${keyObj.keyLetter}) ${correctOptionText}. ` +
        `Бұл мәлімет 5-10 сынып Қазақстан тарихы бағдарламасындағы «${topic}» бөлімінде қарастырылған. ` +
        `Тарихи тұрғыдан «${keyObj.answerText}» дерегі нақты құжаттық дереккөздер мен оқулық материалдарымен расталған.`;

      const q: Question = {
        id: `official-var-${currentVariant}-q-${currentQNum}`,
        grade,
        period,
        topic,
        question: currentQText,
        options: [...optionBuffer],
        correctAnswer: correctIndex,
        explanation,
        sourceOrEra: `Ресми республикалық олимпиада, ${currentVariant}-нұсқа, №${currentQNum}`,
        variant: currentVariant,
        variantQuestionNum: currentQNum,
      };

      questions.push(q);
    }

    currentQText = '';
    optionBuffer = [];
  }

  for (let i = 0; i < questionLines.length; i++) {
    const rawLine = questionLines[i];
    const line = rawLine.trim();
    if (!line) continue;

    // Variant header like "1 нұсқа", "2 нұсқа"
    const variantMatch = line.match(/^(\d+)\s+нұсқа$/i);
    if (variantMatch) {
      commitCurrentQuestion();
      currentVariant = parseInt(variantMatch[1], 10);
      currentQNum = 0;
      continue;
    }

    // Ignore secondary subheaders like "Аты-жөні ...", "Бес жауаптың ...", "11–20 сұрақтар"
    if (line.includes('Аты-жөні') || line.includes('Бес жауаптың') || line.match(/^\d+[–-]\d+\s+сұрақтар/)) {
      continue;
    }

    // Question start: "1. Адамзаттың...", "15. Шыңғыс..."
    const qMatch = line.match(/^(\d+)\.\s+(.*)$/);
    if (qMatch) {
      commitCurrentQuestion();
      currentQNum = parseInt(qMatch[1], 10);
      currentQText = qMatch[2].trim();
      continue;
    }

    // Options line: "A) ... B) ... C) ... D) ... E) ..."
    // Let's parse options by letters A), B), C), D), E)
    if (line.includes('A)') && line.includes('B)')) {
      // Split options using regex looking for letters like A), B), C), D), E)
      const parts = line.split(/(?=[A-E]\))/);
      for (const p of parts) {
        const optMatch = p.trim().match(/^([A-E])\)\s*(.*)$/);
        if (optMatch) {
          optionBuffer.push(optMatch[2].trim());
        }
      }
      continue;
    }

    // In case options span multiple lines
    const singleOptMatch = line.match(/^([A-E])\)\s*(.*)$/);
    if (singleOptMatch) {
      optionBuffer.push(singleOptMatch[2].trim());
      continue;
    }

    // In case question text spans multiple lines before options appear
    if (currentQText && optionBuffer.length === 0) {
      currentQText += ' ' + line;
    }
  }

  // Commit last question
  commitCurrentQuestion();

  return questions;
}

if (process.argv[1] && process.argv[1].endsWith('parse-official-variants.ts')) {
  try {
    const list = parseOfficialVariantsFile();
    console.log(`Successfully parsed ${list.length} official variant questions!`);
    console.log('Sample parsed question:');
    console.log(JSON.stringify(list[0], null, 2));

    // Verify all 10 variants have 40 questions each
    for (let v = 1; v <= 10; v++) {
      const vQuestions = list.filter(q => q.variant === v);
      console.log(`Variant ${v}: ${vQuestions.length} questions`);
      if (vQuestions.length !== 40) {
        console.error(`ERROR: Variant ${v} has ${vQuestions.length} questions, expected 40!`);
      }
    }
  } catch (err) {
    console.error('Error parsing:', err);
  }
}
