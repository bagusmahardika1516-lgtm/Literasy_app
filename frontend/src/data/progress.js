// Progres & skor per bagian untuk beranda.
// Sumber: GET /api/progress (tersimpan sebagai cache per siswa untuk dipakai saat offline)
//        + hasil yang masih di antrean (belum terkirim) + tanda "selesai" lokal versi lama.
import { getProgress as getLocalDone, studentKey } from './profile.js';
import { queuedResults } from './records.js';

const CACHE = 'literasy.progress-cache';

/**
 * @typedef {{ score: number, max_score: number, completed_at?: string | null }} Score
 * @typedef {{ section_id: string, done: boolean, times_completed: number, last: Score | null,
 *   best: Score | null, last_completed_at?: string | null, pending?: boolean }} SectionProgress
 */

/** @returns {SectionProgress[] | null} */
export function readCache() {
  const key = studentKey(CACHE);
  if (!key) return null;
  try {
    return JSON.parse(localStorage.getItem(key) ?? 'null')?.sections ?? null;
  } catch {
    return null;
  }
}

/** @param {SectionProgress[]} sections */
export function writeCache(sections) {
  const key = studentKey(CACHE);
  if (!key) return;
  try {
    localStorage.setItem(key, JSON.stringify({ sections, savedAt: new Date().toISOString() }));
  } catch {
    // abaikan
  }
}

const ratio = (s) => (s && s.max_score ? s.score / s.max_score : -1);

/**
 * Gabungkan progres server dengan hasil yang belum terkirim. Fungsi murni (dites).
 * @param {string[]} sectionIds urutan bagian
 * @param {SectionProgress[] | null} server
 * @param {Array<{ section_id: string, score: number|null, max_score: number|null, completed_at: string }>} queued
 * @param {Record<string, 'done'>} localDone
 * @returns {Record<string, SectionProgress>}
 */
export function mergeProgress(sectionIds, server, queued, localDone) {
  const byId = Object.fromEntries((server ?? []).map((s) => [s.section_id, { ...s }]));
  const out = {};
  for (const id of sectionIds) {
    const s = byId[id] ?? { section_id: id, done: false, times_completed: 0, last: null, best: null };
    const mine = queued
      .filter((r) => r.section_id === id)
      .sort((a, b) => String(a.completed_at).localeCompare(String(b.completed_at)));
    for (const r of mine) {
      s.done = true;
      s.pending = true;
      s.times_completed += 1;
      s.last_completed_at = r.completed_at;
      if (r.score !== null && r.score !== undefined && r.max_score) {
        const sc = { score: r.score, max_score: r.max_score, completed_at: r.completed_at };
        s.last = sc;
        if (ratio(sc) >= ratio(s.best)) s.best = sc;
      }
    }
    if (localDone[id] === 'done') s.done = true;
    out[id] = s;
  }
  return out;
}

/** Progres saat ini tanpa jaringan (cache + antrean). */
export function localProgress(sectionIds) {
  return mergeProgress(sectionIds, readCache(), queuedResults(), getLocalDone());
}
