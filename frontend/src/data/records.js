// Antrean catatan belajar → POST /api/records (F14). Ditulis ke localStorage dulu agar tidak hilang
// saat Wi-Fi kelas putus, lalu dikirim ulang (ADR-003).
// Antrean terpisah per siswa ("literasy.queue.S01"): catatan siswa A tidak pernah terkirim atas nama B,
// dan tidak dihapus saat keluar/sesi habis — terkirim lagi setelah siswa yang sama masuk.
import { postRecords } from '../api/client.js';
import { studentKey } from './profile.js';
import { uuid } from './uuid.js';

const BASE = 'literasy.queue';
const RETRY_MS = [5000, 30000, 120000];
const KINDS = /** @type {const} */ (['attempts', 'effort', 'reflections', 'results']);
// Batas per kiriman (backend: schemas.RecordsIn) — antrean panjang dikirim bertahap
const CHUNK = { attempts: 100, effort: 50, reflections: 50, results: 50 };

let inflight = null;
let retryIndex = 0;
let timer = null;

function empty() {
  return { attempts: [], effort: [], reflections: [], results: [] };
}

function readQueue(key) {
  try {
    return { ...empty(), ...JSON.parse(localStorage.getItem(key) ?? '') };
  } catch {
    return empty();
  }
}

function writeQueue(key, q) {
  try {
    localStorage.setItem(key, JSON.stringify(q));
  } catch {
    // penyimpanan penuh/diblokir
  }
}

function enqueue(kind, row) {
  const key = studentKey(BASE);
  if (!key) return null; // belum masuk: halaman belajar tidak bisa dibuka tanpa masuk
  const q = readQueue(key);
  const full = { id: uuid(), created_at: new Date().toISOString(), ...row };
  q[kind].push(full);
  writeQueue(key, q);
  scheduleFlush(1500);
  return full;
}

/** @param {{ problem_id: string, section_id: string, answer_value?: string, answer_unit?: string,
 *   correct: boolean, misconception_id?: string, hints_used: number, duration_ms?: number }} a */
export const recordAttempt = (a) => enqueue('attempts', a);
/** @param {string} sectionId @param {number} value 1–9 */
export const recordEffort = (sectionId, value) => enqueue('effort', { section_id: sectionId, value });
/** @param {{ prompt_id: string, choice?: string, free_text?: string, score?: number }} r */
export const recordReflection = (r) => enqueue('reflections', r);

/**
 * Hasil akhir satu bagian (skor per sesi). Bagian materi: score/max_score null.
 * @param {{ section_id: string, score: number|null, max_score: number|null, details?: object,
 *   started_at?: string, completed_at: string }} r
 * @returns {{ id: string } | null}
 */
export const recordResult = (r) => enqueue('results', { details: {}, ...r });

function scheduleFlush(ms) {
  clearTimeout(timer);
  timer = setTimeout(flush, ms);
}

const countOf = (q) => KINDS.reduce((n, k) => n + q[k].length, 0);

async function sendAll(key) {
  for (;;) {
    const q = readQueue(key);
    if (countOf(q) === 0) return;
    const batch = Object.fromEntries(KINDS.map((k) => [k, q[k].slice(0, CHUNK[k])]));
    await postRecords(batch);
    // hapus hanya yang sudah terkirim (catatan baru mungkin masuk selama pengiriman)
    const sent = new Set(KINDS.flatMap((k) => batch[k].map((r) => r.id)));
    const now = readQueue(key);
    writeQueue(key, Object.fromEntries(KINDS.map((k) => [k, now[k].filter((r) => !sent.has(r.id))])));
  }
}

/** Kirim antrean siswa yang sedang masuk. Panggilan bersamaan berbagi satu pengiriman. */
export function flush() {
  if (inflight) return inflight;
  const key = studentKey(BASE);
  if (!key || countOf(readQueue(key)) === 0) return Promise.resolve();
  inflight = sendAll(key)
    .then(() => {
      retryIndex = 0;
    })
    .catch((err) => {
      // 401: sesi berakhir → antrean disimpan, dikirim setelah masuk lagi (tanpa retry berulang)
      if (err?.status !== 401) {
        scheduleFlush(RETRY_MS[Math.min(retryIndex, RETRY_MS.length - 1)]);
        retryIndex += 1;
      }
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/** Kirim sekarang dan tunggu. @returns {Promise<boolean>} true bila antrean sudah kosong. */
export async function flushNow() {
  await flush();
  if (pendingCount() > 0) await flush(); // catatan yang masuk saat pengiriman sebelumnya berjalan
  return pendingCount() === 0;
}

export function pendingCount() {
  const key = studentKey(BASE);
  return key ? countOf(readQueue(key)) : 0;
}

/** Hasil bagian yang belum terkirim (untuk ditampilkan di beranda saat offline). */
export function queuedResults() {
  const key = studentKey(BASE);
  return key ? readQueue(key).results : [];
}

/** @param {string} id */
export const isQueued = (id) => queuedResults().some((r) => r.id === id);

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => flush());
}
