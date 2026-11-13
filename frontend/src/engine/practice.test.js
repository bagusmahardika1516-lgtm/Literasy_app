import diag from '@content/diagnostic.json';
import practice from '@content/practice.json';
import data from '@content/problems.json';
import { describe, expect, it } from 'vitest';
import { checkAnswer } from './checker.js';
import {
  availableHintLevels,
  checkStep,
  evaluateDiagnostic,
  parseFraction,
  sanityInfo,
  supportsStepSolver,
  unitChoices,
} from './practice.js';

const P = Object.fromEntries(data.problems.map((p) => [p.id, p]));
const T = practice.steps;

describe('Step Solver', () => {
  it('hanya untuk soal busur/juring dengan r dan θ', () => {
    expect(supportsStepSolver(P.P01)).toBe(true);
    expect(supportsStepSolver(P.P11)).toBe(false);
    expect(supportsStepSolver(P.P16)).toBe(false);
  });

  it('langkah ditanya', () => {
    expect(checkStep(P.P01, 'asked', 'arcLength', T).correct).toBe(true);
    expect(checkStep(P.P01, 'asked', 'sectorArea', T).correct).toBe(false);
  });

  it('langkah diketahui menerima koma', () => {
    expect(checkStep(P.P05, 'given', { r: '10', theta: '36' }, T).correct).toBe(true);
    expect(checkStep(P.P05, 'given', { r: '20', theta: '36' }, T).correct).toBe(false);
  });

  it('langkah pecahan menerima 1/4, 0,25, 0.25', () => {
    for (const v of ['1/4', '0,25', '0.25', '90/360']) expect(checkStep(P.P01, 'fraction', v, T).correct).toBe(true);
    expect(checkStep(P.P01, 'fraction', '1/3', T).correct).toBe(false);
    expect(checkStep(P.P03, 'fraction', '1/6', T).correct).toBe(true);
  });

  it('langkah rumus memberi umpan balik tertukar', () => {
    expect(checkStep(P.P01, 'formula', 'arc', T).correct).toBe(true);
    const r = checkStep(P.P01, 'formula', 'sector', T);
    expect(r.correct).toBe(false);
    expect(r.misconceptionId).toBe('swap_formula');
    expect(r.feedback).toBe(T.formula.wrongArc);
  });

  it('langkah hitung memakai checker', () => {
    expect(checkStep(P.P02, 'compute', { value: '38,5', unit: 'cm2' }, T).correct).toBe(true);
  });
});

describe('parseFraction', () => {
  it.each([
    ['1/4', 0.25],
    [' 3 / 4 ', 0.75],
    ['0,5', 0.5],
    ['1/0', null],
    ['x', null],
  ])('%j → %j', (raw, v) => expect(parseFraction(raw)).toBe(v));
});

describe('pemudaran petunjuk', () => {
  it.each([
    [{ support: 'guided', streakNoHint: 0, wrongOnCurrent: 0 }, 3],
    [{ support: 'guided', streakNoHint: 2, wrongOnCurrent: 0 }, 2],
    [{ support: 'guided', streakNoHint: 4, wrongOnCurrent: 0 }, 1],
    [{ support: 'guided', streakNoHint: 9, wrongOnCurrent: 0 }, 1],
    [{ support: 'guided', streakNoHint: 4, wrongOnCurrent: 2 }, 2],
    [{ support: 'independent', streakNoHint: 0, wrongOnCurrent: 0 }, 1],
    [{ support: 'independent', streakNoHint: 0, wrongOnCurrent: 3 }, 2],
    [{ support: 'literacy', streakNoHint: 0, wrongOnCurrent: 5 }, 3],
  ])('%o → %i', (s, n) => expect(availableHintLevels(s)).toBe(n));
});

describe('cek kewajaran', () => {
  it('busur: pakai keliling', () => {
    expect(sanityInfo(P.P01)).toEqual({
      theta: 90,
      fraction: '1/4',
      kind: 'panjang',
      wholeName: 'Keliling',
      whole: 44,
      unitKey: 'cm',
    });
  });
  it('juring: pakai luas', () => expect(sanityInfo(P.P09).whole).toBe(154));
  it('null untuk soal invers', () => expect(sanityInfo(P.P12)).toBeNull());
  it('pilihan satuan', () => {
    expect(unitChoices('cm2')).toEqual(['cm', 'cm2']);
    expect(unitChoices('m')).toEqual(['m', 'm2']);
    expect(unitChoices('deg')).toEqual([]);
  });
});

describe('diagnostik', () => {
  it('kunci jawaban diagnostik dikenali checker', () => {
    for (const d of diag.items) expect(checkAnswer(d, String(d.answer.value)).correct).toBe(true);
  });
  it('lulus bila ≥ 4 benar', () => {
    const all = Object.fromEntries(diag.items.map((d) => [d.id, true]));
    expect(evaluateDiagnostic(diag, all)).toEqual({ score: 6, pass: true, remedials: [] });
  });
  it('remedial unik untuk butir salah', () => {
    const r = evaluateDiagnostic(diag, { D3: true, D4: true, D5: true });
    expect(r.pass).toBe(false);
    expect(r.remedials).toEqual(['R-Bagian', 'R-Pecahan']);
  });
});
