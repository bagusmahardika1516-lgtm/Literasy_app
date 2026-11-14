// Siswa yang sedang masuk + progres per bagian (localStorage, terpisah per siswa).
// Hanya kode pseudonim yang disimpan (privacy.md). Progres online menyusul (poin skor per sesi).
import { getSession } from './session.js';

const KEY_PROGRESS = 'literasy.progress';

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // penyimpanan diblokir/penuh: aplikasi tetap berjalan tanpa menyimpan
  }
}

/** @returns {import('./session.js').Student | null} */
export const getProfile = () => getSession()?.student ?? null;

/** Kunci localStorage milik siswa yang sedang masuk, mis. "literasy.queue.S01". */
export function studentKey(base, code = getProfile()?.code) {
  return code ? `${base}.${code}` : null;
}

/** @returns {Record<string, 'done'>} */
export const getProgress = () => {
  const key = studentKey(KEY_PROGRESS);
  return key ? read(key, {}) : {};
};

export function markDone(sectionId) {
  const key = studentKey(KEY_PROGRESS);
  if (key) write(key, { ...getProgress(), [sectionId]: 'done' });
}

/**
 * Versi lama menyimpan profil/progres/antrean/draf tanpa kode siswa. Saat siswa yang sama masuk lagi,
 * pindahkan datanya ke kunci miliknya agar tidak hilang. Data milik siswa lain dibiarkan (tidak dikirim).
 */
export function migrateLegacy(code) {
  try {
    const legacy = JSON.parse(localStorage.getItem('literasy.profile') ?? 'null');
    if (legacy?.code !== code) return;
    for (const base of [KEY_PROGRESS, 'literasy.queue', 'literasy.mltest-draft']) {
      const raw = localStorage.getItem(base);
      if (raw !== null && localStorage.getItem(`${base}.${code}`) === null) {
        localStorage.setItem(`${base}.${code}`, raw);
      }
      localStorage.removeItem(base);
    }
    localStorage.removeItem('literasy.profile');
  } catch {
    // abaikan
  }
}
