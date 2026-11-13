// Pemeriksa jawaban + deteksi miskonsepsi — padanan JS dari backend/app/engine/checker.py.
import { arcLength, circleArea, circumference, fractionLabel, sectorArea } from './circle.js';

export const DEFAULT_TOLERANCE = 0.01; // relatif (prd.md FR-10)

const LENGTH_UNITS = new Set(['cm', 'm']);
const AREA_UNITS = new Set(['cm2', 'm2']);
const NUMBER_RE = /^[+-]?(\d+([.,]\d+)?|[.,]\d+)$/;

/**
 * @typedef {{ correct: boolean, unitOk: boolean, feedback: string, misconceptionId?: string }} CheckResult
 */

/** Terima "7,33", "7.33", " 7,33 ", dan pemisah ribuan "1.250.000". @returns {number | null} */
export function parseNumber(raw) {
  let s = String(raw).trim().replace(/\s+/g, '');
  if (!s) return null;
  if ((s.match(/\./g) ?? []).length > 1 && !s.includes(',')) s = s.replace(/\./g, '');
  if (!NUMBER_RE.test(s)) return null;
  return Number(s.replace(',', '.'));
}

function close(a, b, tol = DEFAULT_TOLERANCE) {
  if (b === 0) return Math.abs(a) < 1e-9;
  return Math.abs(a - b) / Math.abs(b) <= tol;
}

function unitGroup(unit) {
  if (LENGTH_UNITS.has(unit)) return 'length';
  if (AREA_UNITS.has(unit)) return 'area';
  return null;
}

function genericMisconceptions(problem) {
  const { asked, model: m, pi } = problem;
  if (!['arcLength', 'sectorArea'].includes(asked) || !('r' in m)) return [];
  const part = fractionLabel(m.theta);
  if (asked === 'arcLength') {
    return [
      [sectorArea(m.r, m.theta, pi), 'swap_formula', 'Itu luas juring. Yang ditanya panjang busur → pakai keliling.'],
      [circumference(m.r, pi), 'forgot_fraction', `Itu keliling seluruh lingkaran. Busurmu hanya ${part}-nya.`],
    ];
  }
  return [
    [arcLength(m.r, m.theta, pi), 'swap_formula', 'Itu panjang busur. Juring adalah daerah → pakai luas.'],
    [circleArea(m.r, pi), 'forgot_fraction', `Itu luas seluruh lingkaran. Juringmu hanya ${part}-nya.`],
  ];
}

/**
 * @param {object} problem soal dari content/problems.json
 * @param {string} raw isian siswa
 * @param {string} [unit] satuan yang dipilih siswa
 * @returns {CheckResult}
 */
export function checkAnswer(problem, raw, unit) {
  const expected = problem.answer.value;
  const tol = problem.answer.tolerance ?? DEFAULT_TOLERANCE;

  if (typeof expected === 'string') {
    const ok = String(raw).trim().toLowerCase() === expected.toLowerCase();
    return { correct: ok, unitOk: true, feedback: ok ? '✓ Tepat.' : 'Belum tepat. Coba hitung dan bandingkan lagi.' };
  }

  const value = parseNumber(raw);
  if (value === null) {
    return { correct: false, unitOk: true, feedback: 'Tulis jawaban berupa angka, misalnya 22 atau 7,33.' };
  }

  const expectedUnit = problem.answer.unit;
  const unitOk = !unit || !expectedUnit || unit === expectedUnit;
  if (!unitOk && unitGroup(unit) !== unitGroup(expectedUnit)) {
    const wanted = unitGroup(expectedUnit) === 'length' ? 'panjang' : 'luas';
    return { correct: false, unitOk: false, feedback: `Satuanmu ${unit.replace('2', '²')}. Yang ditanya ${wanted}.` };
  }

  if (close(value, expected, tol)) return { correct: true, unitOk, feedback: '✓ Tepat.' };

  for (const mc of problem.misconceptions ?? []) {
    if (close(value, mc.answer, tol)) {
      return { correct: false, unitOk, feedback: mc.feedback, misconceptionId: mc.id };
    }
  }
  for (const [candidate, id, feedback] of genericMisconceptions(problem)) {
    if (close(value, candidate, tol)) return { correct: false, unitOk, feedback, misconceptionId: id };
  }
  return {
    correct: false,
    unitOk,
    feedback: 'Belum tepat. Periksa langkahmu satu per satu, atau buka petunjuk.',
  };
}
