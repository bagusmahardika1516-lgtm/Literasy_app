import { describe, expect, it } from 'vitest';
import { mergeProgress } from './progress.js';

const IDS = ['guided', 'explore', 'game'];

describe('mergeProgress', () => {
  it('memakai data server', () => {
    const server = [
      {
        section_id: 'guided',
        done: true,
        times_completed: 1,
        last: { score: 4, max_score: 6 },
        best: { score: 4, max_score: 6 },
      },
    ];
    const p = mergeProgress(IDS, server, [], {});
    expect(p.guided.last.score).toBe(4);
    expect(p.explore.done).toBe(false);
  });

  it('hasil yang belum terkirim ikut tampil dan menjadi skor terakhir', () => {
    const server = [
      {
        section_id: 'guided',
        done: true,
        times_completed: 1,
        last: { score: 5, max_score: 6 },
        best: { score: 5, max_score: 6 },
      },
    ];
    const queued = [
      { section_id: 'guided', score: 3, max_score: 6, completed_at: '2026-11-14T09:00:00Z' },
      { section_id: 'explore', score: null, max_score: null, completed_at: '2026-11-14T09:05:00Z' },
    ];
    const p = mergeProgress(IDS, server, queued, {});
    expect(p.guided.last.score).toBe(3);
    expect(p.guided.best.score).toBe(5);
    expect(p.guided.times_completed).toBe(2);
    expect(p.guided.pending).toBe(true);
    expect(p.explore.done).toBe(true);
    expect(p.explore.last).toBeNull();
  });

  it('offline tanpa cache: tanda selesai lokal tetap dipakai', () => {
    const p = mergeProgress(IDS, null, [], { game: 'done' });
    expect(p.game.done).toBe(true);
  });

  it('ada data server: tanda selesai lokal tidak membuka bagian (server = sumber kebenaran)', () => {
    const p = mergeProgress(IDS, [], [], { guided: 'done' });
    expect(p.guided.done).toBe(false);
    expect(p.explore.status).toBe('locked');
  });
});

const ORDER = ['pretest', 'diagnostic', 'explore', 'concept'];
const srv = (id, done = false) => ({ section_id: id, done, times_completed: done ? 1 : 0, last: null, best: null });
const statuses = (p) => ORDER.map((id) => p[id].status);

describe('Pembukaan bertahap', () => {
  it('siswa baru: hanya bagian pertama yang terbuka', () => {
    const p = mergeProgress(ORDER, [], [], {});
    expect(statuses(p)).toEqual(['open', 'locked', 'locked', 'locked']);
    expect(p.diagnostic.requires).toBe('pretest');
  });

  it('bagian selesai membuka bagian berikutnya', () => {
    const p = mergeProgress(ORDER, [srv('pretest', true)], [], {});
    expect(statuses(p)).toEqual(['done', 'open', 'locked', 'locked']);
  });

  it('hasil yang belum terkirim (offline) juga membuka bagian berikutnya', () => {
    const queued = [{ section_id: 'diagnostic', score: 5, max_score: 6, completed_at: '2026-11-14T09:00:00Z' }];
    const p = mergeProgress(ORDER, [srv('pretest', true)], queued, {});
    expect(statuses(p)).toEqual(['done', 'done', 'open', 'locked']);
  });

  it('mengulang bagian sebelumnya tidak mengunci bagian berikutnya', () => {
    const server = [srv('pretest', true), srv('diagnostic', true)];
    const retake = [{ section_id: 'pretest', score: null, max_score: null, completed_at: '2026-11-14T10:00:00Z' }];
    const p = mergeProgress(ORDER, server, retake, {});
    expect(p.pretest.times_completed).toBe(2);
    expect(statuses(p)).toEqual(['done', 'done', 'open', 'locked']);
  });

  it('progres lama yang melompat tetap terbuka, begitu juga bagian sesudahnya', () => {
    const p = mergeProgress(ORDER, [srv('explore', true)], [], {});
    expect(statuses(p)).toEqual(['open', 'locked', 'done', 'open']);
  });
});
