// Progres & skor per bagian untuk beranda.
// Sumber: GET /api/progress (tersimpan sebagai cache per siswa untuk dipakai saat offline)
//        + hasil yang masih di antrean (belum terkirim) + tanda "selesai" lokal versi lama.
import { getProgress as getLocalDone, studentKey } from './profile.js';
import { queuedResults } from './records.js';

const CACHE = 'literasy.progress-cache';

/**
 * @typedef {{ score: number, max_score: number, completed_at?: string | null }} Score
 * @typedef {'locked' | 'open' | 'done'} SectionStatus
 * @typedef {{ section_id: string, done: boolean, times_completed: number, last: Score | null,
 *   best: Score | null, last_completed_at?: string | null, pending?: boolean,
 *   unlocked?: boolean, status?: SectionStatus, requires?: string | null }} SectionProgress
 */

/**
 * Pembukaan bertahap — aturan yang sama dengan backend/app/progression.py:
 * bagian pertama selalu terbuka; bagian berikutnya terbuka setelah bagian sebelumnya selesai;
 * bagian yang sudah pernah selesai tetap terbuka (mengulang tidak pernah mengunci apa pun).
 * Server tetap memeriksa ulang setiap hasil, jadi ini hanya untuk tampilan dan navigasi.
 * @param {string[]} sectionIds urutan bagian
 * @param {Record<string, SectionProgress>} byId diubah di tempat
 */
export function applyUnlocks(sectionIds, byId) {
  let previousDone = true;
  let previousId = null;
  for (const id of sectionIds) {
    const s = byId[id];
    s.unlocked = previousDone || s.done;
    s.status = s.done ? 'done' : s.unlocked ? 'open' : 'locked';
    s.requires = previousId; // bagian yang harus selesai lebih dulu
    previousDone = s.done;
    previousId = id;
  }
  return byId;
}

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
    // Tanda selesai lokal versi lama hanya dipakai bila belum pernah ada data dari server
    // (server = sumber kebenaran; tanda lokal bisa berasal dari hasil yang ditolak server)
    if (!server && localDone[id] === 'done') s.done = true;
    out[id] = s;
  }
  return applyUnlocks(sectionIds, out);
}

/** Progres saat ini tanpa jaringan (cache + antrean). */
export function localProgress(sectionIds) {
  return mergeProgress(sectionIds, readCache(), queuedResults(), getLocalDone());
}
