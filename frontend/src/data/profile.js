// Profil & progres sederhana di localStorage (Sprint 0). Diganti Dexie + antrean sinkronisasi di Sprint 5.
// Hanya kode pseudonim yang disimpan (privacy.md).
const KEY_PROFILE = 'literasy.profile';
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

/** @returns {{ code: string, classCode: string } | null} */
export const getProfile = () => read(KEY_PROFILE, null);
export const saveProfile = (profile) => write(KEY_PROFILE, profile);

/** @returns {Record<string, 'done'>} */
export const getProgress = () => read(KEY_PROGRESS, {});
export function markDone(sectionId) {
  write(KEY_PROGRESS, { ...getProgress(), [sectionId]: 'done' });
}

/** "Keluar & hapus data di HP ini" (privacy.md §4). */
export function clearAll() {
  try {
    localStorage.removeItem(KEY_PROFILE);
    localStorage.removeItem(KEY_PROGRESS);
    localStorage.removeItem('literasy.queue');
    localStorage.removeItem('literasy.mltest-draft');
  } catch {
    // abaikan
  }
}
