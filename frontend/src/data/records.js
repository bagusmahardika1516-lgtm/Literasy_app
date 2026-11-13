// Antrean catatan belajar → POST /api/records (F14). Ditulis ke localStorage dulu agar tidak hilang
// saat Wi-Fi kelas putus, lalu dikirim ulang (ADR-003). Dexie menyusul bila data membesar.
import { postRecords } from '../api/client.js';
import { getProfile } from './profile.js';
import { uuid } from './uuid.js';

const KEY = 'literasy.queue';
const RETRY_MS = [5000, 30000, 120000];

let flushing = false;
let retryIndex = 0;
let timer = null;

function readQueue() {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '') ?? empty();
  } catch {
    return empty();
  }
}

function empty() {
  return { attempts: [], effort: [], reflections: [] };
}

function writeQueue(q) {
  try {
    localStorage.setItem(KEY, JSON.stringify(q));
  } catch {
    // penyimpanan penuh/diblokir: data tetap dicoba kirim dari memori pada flush berikutnya
  }
}

function enqueue(kind, row) {
  const q = readQueue();
  q[kind].push({ id: uuid(), created_at: new Date().toISOString(), ...row });
  writeQueue(q);
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

/** Kirim antrean. Aman dipanggil berulang. */
export async function flush() {
  const profile = getProfile();
  if (flushing || !profile) return;
  const q = readQueue();
  const count = q.attempts.length + q.effort.length + q.reflections.length;
  if (count === 0) return;
  flushing = true;
  try {
    await postRecords({ code: profile.code, class_code: profile.classCode, ...q });
    // hapus hanya yang sudah terkirim (catatan baru mungkin masuk selama pengiriman)
    const sent = new Set([...q.attempts, ...q.effort, ...q.reflections].map((r) => r.id));
    const now = readQueue();
    writeQueue({
      attempts: now.attempts.filter((r) => !sent.has(r.id)),
      effort: now.effort.filter((r) => !sent.has(r.id)),
      reflections: now.reflections.filter((r) => !sent.has(r.id)),
    });
    retryIndex = 0;
  } catch {
    scheduleFlush(RETRY_MS[Math.min(retryIndex, RETRY_MS.length - 1)]);
    retryIndex += 1;
  } finally {
    flushing = false;
  }
}

export function pendingCount() {
  const q = readQueue();
  return q.attempts.length + q.effort.length + q.reflections.length;
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => flush());
}
