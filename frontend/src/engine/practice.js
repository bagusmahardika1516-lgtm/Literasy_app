// Logika latihan: Step Solver, pemudaran petunjuk, cek kewajaran, diagnostik (F02, F03, F09, F10).
// JS murni — tanpa React/DOM (agents.md §3).
import { checkAnswer, parseNumber } from './checker.js';
import { circleArea, circumference, fraction, fractionLabel, round2 } from './circle.js';

export const SOLVER_STEPS = /** @type {const} */ (['asked', 'given', 'fraction', 'formula', 'compute']);

/** Step Solver hanya untuk soal panjang busur / luas juring yang memiliki r dan θ. */
export function supportsStepSolver(problem) {
  return ['arcLength', 'sectorArea'].includes(problem.asked) && 'r' in problem.model && 'theta' in problem.model;
}

/** "1/4", "0,25", "0.25" → 0.25. @returns {number | null} */
export function parseFraction(raw) {
  const m = String(raw).trim().match(/^(\d+)\s*\/\s*(\d+)$/);
  if (m) return Number(m[2]) === 0 ? null : Number(m[1]) / Number(m[2]);
  return parseNumber(raw);
}

/**
 * Periksa satu langkah Step Solver.
 * @param {object} problem
 * @param {typeof SOLVER_STEPS[number]} step
 * @param {any} input
 * @param {object} texts content/practice.json → steps
 * @returns {{ correct: boolean, feedback: string, misconceptionId?: string }}
 */
export function checkStep(problem, step, input, texts) {
  const { model } = problem;
  switch (step) {
    case 'asked': {
      const ok = input === problem.asked;
      return { correct: ok, feedback: ok ? '✓' : texts.asked.wrong };
    }
    case 'given': {
      const r = parseNumber(input?.r ?? '');
      const t = parseNumber(input?.theta ?? '');
      const ok = r === model.r && t === model.theta;
      return { correct: ok, feedback: ok ? '✓' : texts.given.wrong };
    }
    case 'fraction': {
      const v = parseFraction(input ?? '');
      const ok = v !== null && Math.abs(v - fraction(model.theta)) < 0.005;
      return { correct: ok, feedback: ok ? `✓ ${fractionLabel(model.theta)}` : texts.fraction.wrong };
    }
    case 'formula': {
      const want = problem.asked === 'arcLength' ? 'arc' : 'sector';
      const ok = input === want;
      const feedback = ok ? '✓' : want === 'arc' ? texts.formula.wrongArc : texts.formula.wrongSector;
      return { correct: ok, feedback, misconceptionId: ok || input === 'circle' ? undefined : 'swap_formula' };
    }
    case 'compute': {
      return checkAnswer(problem, input?.value ?? '', input?.unit);
    }
    default:
      throw new Error(`langkah tidak dikenal: ${step}`);
  }
}

/**
 * Banyak tingkat petunjuk yang boleh dibuka (F10, ADR-007).
 * Mulai 3; berkurang 1 setiap 2 soal benar beruntun tanpa petunjuk; latihan mandiri maks 1;
 * bertambah 1 bila salah ≥ 2× pada soal ini. Selalu 1–3.
 * @param {{ support: string, streakNoHint: number, wrongOnCurrent: number }} s
 */
export function availableHintLevels({ support, streakNoHint, wrongOnCurrent }) {
  let levels = 3 - Math.floor(streakNoHint / 2);
  if (support === 'independent') levels = Math.min(levels, 1);
  if (wrongOnCurrent >= 2) levels += 1;
  return Math.max(1, Math.min(3, levels));
}

/**
 * Data untuk "Cek Kewajaran" (F09, GL02), atau null bila soal bukan busur/juring biasa.
 * @returns {{ theta: number, fraction: string, kind: 'panjang'|'luas', wholeName: string, whole: number,
 *   unitKey: string } | null}
 */
export function sanityInfo(problem) {
  if (!supportsStepSolver(problem)) return null;
  const { r, theta } = problem.model;
  const isArc = problem.asked === 'arcLength';
  const unitKey = problem.answer.unit;
  return {
    theta,
    fraction: fractionLabel(theta),
    kind: isArc ? 'panjang' : 'luas',
    wholeName: isArc ? 'Keliling' : 'Luas',
    whole: round2(isArc ? circumference(r, problem.pi) : circleArea(r, problem.pi)),
    unitKey,
  };
}

/** Pilihan satuan yang relevan untuk sebuah jawaban (agar cek satuan bermakna). */
export function unitChoices(unit) {
  if (unit === 'cm' || unit === 'cm2') return ['cm', 'cm2'];
  if (unit === 'm' || unit === 'm2') return ['m', 'm2'];
  return [];
}

/**
 * Nilai diagnostik prasyarat (F03).
 * @param {{ items: object[], passScore: number }} diag
 * @param {Record<string, boolean>} results benar/salah per id
 */
export function evaluateDiagnostic(diag, results) {
  const score = diag.items.filter((d) => results[d.id]).length;
  const remedials = [...new Set(diag.items.filter((d) => !results[d.id]).map((d) => d.remedial))];
  return { score, pass: score >= diag.passScore, remedials };
}
