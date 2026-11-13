// Validasi konten di sisi JS (npm run content:check). Padanan: backend/scripts/content_check.py
import { describe, expect, it } from 'vitest';
import data from '@content/problems.json';
import sequence from '@content/sequence.json';
import { solve, solveDecision } from './circle.js';

const FORBIDDEN = /radius|keliling busur|luas busur|panjang juring|sudut tengah/i;
const problems = data.problems;

describe('content/problems.json', () => {
  it('berisi P01–P18 berurutan', () => {
    expect(problems.map((p) => p.id)).toEqual(Array.from({ length: 18 }, (_, i) => `P${String(i + 1).padStart(2, '0')}`));
  });

  it.each(problems.map((p) => [p.id, p]))('%s: kunci jawaban = hasil engine', (_, p) => {
    expect(solve(p)).toBe(p.answer.value);
    if (p.decision) expect(solveDecision(p)).toBe(p.decision.answer);
  });

  it.each(problems.map((p) => [p.id, p]))('%s: aturan konten', (_, p) => {
    expect(p.hints).toHaveLength(3);
    for (const s of p.stem) expect(s.split(/\s+/).length).toBeLessThanOrEqual(20);
    expect([...p.stem, ...p.hints].join(' ')).not.toMatch(FORBIDDEN);
  });

  it('ID bagian unik', () => {
    const ids = sequence.sections.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
