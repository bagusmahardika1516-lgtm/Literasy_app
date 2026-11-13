import { describe, expect, it } from 'vitest';
import data from '@content/problems.json';
import { checkAnswer, parseNumber } from './checker.js';

const P = Object.fromEntries(data.problems.map((p) => [p.id, p]));

describe('parseNumber', () => {
  it.each([
    ['7,33', 7.33],
    ['7.33', 7.33],
    [' 7,33 ', 7.33],
    ['22', 22],
    ['1.250.000', 1250000],
    ['7,3,3', null],
    ['', null],
    ['abc', null],
  ])('%j -> %j', (raw, v) => expect(parseNumber(raw)).toBe(v));
});

describe('checkAnswer (sama dengan backend/tests/test_checker.py)', () => {
  it('menerima koma dan pembulatan', () => {
    expect(checkAnswer(P.P08, '14,67', 'cm').correct).toBe(true);
    expect(checkAnswer(P.P08, '14.666', 'cm').correct).toBe(true);
  });

  it('menandai satuan yang salah kelompok', () => {
    const r = checkAnswer(P.P01, '11', 'cm2');
    expect(r.correct).toBe(false);
    expect(r.unitOk).toBe(false);
    expect(r.feedback).toContain('panjang');
  });

  it('mendeteksi rumus tertukar (IL01)', () => {
    expect(checkAnswer(P.P01, '38,5').misconceptionId).toBe('swap_formula');
    expect(checkAnswer(P.P02, '11').misconceptionId).toBe('swap_formula');
  });

  it('mendeteksi lupa pecahan sudut', () => {
    const r = checkAnswer(P.P01, '44');
    expect(r.misconceptionId).toBe('forgot_fraction');
    expect(r.feedback).toContain('1/4');
  });

  it('memakai miskonsepsi dari konten', () => {
    expect(checkAnswer(P.P07, '308').misconceptionId).toBe('diameter_as_radius');
    expect(checkAnswer(P.P08, '2,44').misconceptionId).toBe('minutes_as_degrees');
    expect(checkAnswer(P.P14, '22').misconceptionId).toBe('arc_only');
  });

  it('soal pilihan', () => {
    expect(checkAnswer(P.P16, 'a').correct).toBe(true);
    expect(checkAnswer(P.P17, 'ya').correct).toBe(false);
  });

  it('isian bukan angka', () => {
    const r = checkAnswer(P.P01, 'sebelas');
    expect(r.correct).toBe(false);
    expect(r.feedback).toContain('angka');
  });
});
