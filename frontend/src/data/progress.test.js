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
});
