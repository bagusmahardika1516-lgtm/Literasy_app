import { describe, expect, it } from 'vitest';
import { missingStages, stageAnswered } from './answered.js';

const choice = { id: 's1', type: 'choice', choices: ['A', 'B'] };
const number = { id: 's2', type: 'number' };
const fields = { id: 's3', type: 'fields', fields: [{ id: 'r' }, { id: 'theta' }] };
const text = { id: 's4', type: 'text' };
const items = [
  { id: 'T1', stages: [choice, number] },
  { id: 'T2', stages: [fields, text] },
];

describe('Uji Literasi: semua langkah wajib dijawab', () => {
  it('jawaban kosong / tidak ada di pilihan / isian tidak lengkap = belum dijawab', () => {
    expect(stageAnswered(choice, 'C')).toBe(false);
    expect(stageAnswered(choice, 'A')).toBe(true);
    expect(stageAnswered(number, '  ')).toBe(false);
    expect(stageAnswered(number, '0')).toBe(true); // jawaban salah tetap terhitung terjawab
    expect(stageAnswered(fields, { r: '7' })).toBe(false);
    expect(stageAnswered(fields, { r: '7', theta: '90' })).toBe(true);
    expect(stageAnswered(text, '')).toBe(false);
  });

  it('daftar langkah yang belum dijawab, urut dari soal pertama', () => {
    const answers = { T1: { s1: 'A' }, T2: { s3: { r: '7', theta: '90' }, s4: 'karena' } };
    expect(missingStages(items, answers)).toEqual([{ pos: [0, 1], label: 'Soal 1 langkah 2' }]);
    expect(missingStages(items, {})).toHaveLength(4);
  });
});
