// Antrean catatan belajar → POST /api/records (F14). Ditulis ke localStorage dulu agar tidak hilang
// saat Wi-Fi kelas putus, lalu dikirim ulang (ADR-003).
// Antrean terpisah per siswa ("literasy.queue.S01"): catatan siswa A tidak pernah terkirim atas nama B,
// dan tidak dihapus saat keluar/sesi habis — terkirim lagi setelah siswa yang sama masuk.
import { postRecords } from '../api/client.js';
import { studentKey } from './profile.js';
import { uuid } from './uuid.js';

const BASE = 'literasy.queue';
const RETRY_MS = [5000, 30000, 120000];

let flushing = false;
let retryIndex = 0;
let timer = null;

function readQueue(key) {
  try {
    return { ...empty(), ...JSON.parse(localStorage.getItem(key) ?? '') };
  } catch {
    return empty();
  }
}

function empty() {
  return { attempts: [], effort: [], reflections: [] };
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
  if (!key) return; // belum masuk: halaman belajar tidak bisa dibuka tanpa masuk
  const q = readQueue(key);
  q[kind].push({ id: uuid(), created_at: new Date().toISOString(), ...row });
  writeQueue(key, q);
  scheduleFlush(1500);
}

/** @param {{ problem_id: string, section_id: string, answer_value?: string, answer_unit?: string,
 *   correct: boolean, misconception_id?: string, hints_used: number, duration_ms?: number }} a */
export const recordAttempt = (a) => enqueue('attempts', a);
/** @param {string} sectionId @param {number} value 1–9 */
export const recordEffort = (sectionId, value) => enqueue('effort', { section_id: sectionId, value });
/** @param {{ prompt_id: string, choice?: string, free_text?: string, score?: number }} r */
export const recordReflection = (r) => enqueue('reflections', r);

function scheduleFlush(ms) {
  clearTimeout(timer);
  timer = setTimeout(flush, ms);
}

const countOf = (q) => q.attempts.length + q.effort.length + q.reflections.length;

/** Kirim antrean siswa yang sedang masuk. Aman dipanggil berulang. */
export async function flush() {
  const key = studentKey(BASE);
  if (flushing || !key) return;
  const q = readQueue(key);
  if (countOf(q) === 0) return;
  flushing = true;
  try {
    await postRecords(q);
    // hapus hanya yang sudah terkirim (catatan baru mungkin masuk selama pengiriman)
    const sent = new Set([...q.attempts, ...q.effort, ...q.reflections].map((r) => r.id));
    const now = readQueue(key);
    writeQueue(key, {
      attempts: now.attempts.filter((r) => !sent.has(r.id)),
      effort: now.effort.filter((r) => !sent.has(r.id)),
      reflections: now.reflections.filter((r) => !sent.has(r.id)),
    });
    retryIndex = 0;
  } catch (err) {
    // 401: sesi berakhir → antrean disimpan, dikirim setelah masuk lagi (tanpa retry berulang)
    if (err?.status !== 401) {
      scheduleFlush(RETRY_MS[Math.min(retryIndex, RETRY_MS.length - 1)]);
      retryIndex += 1;
    }
  } finally {
    flushing = false;
  }
}

export function pendingCount() {
  const key = studentKey(BASE);
  return key ? countOf(readQueue(key)) : 0;
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => flush());
}
