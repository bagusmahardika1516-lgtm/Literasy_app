// Sesi login di localStorage: token Bearer + data siswa. Tetap ada saat browser ditutup;
// hilang hanya lewat tombol Keluar atau bila server menolak token (401).
const KEY = 'literasy.session';

/** @typedef {{ code: string, classCode: string, username: string }} Student */
/** @typedef {{ token: string, expiresAt: string, student: Student }} Session */

/** @returns {Session | null} */
export function getSession() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    return s?.token && s?.student?.code ? s : null;
  } catch {
    return null;
  }
}

/** @param {Session} session */
export function saveSession(session) {
  try {
    localStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    // penyimpanan diblokir: sesi hanya bertahan selama tab terbuka
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // abaikan
  }
}

export const getToken = () => getSession()?.token ?? null;

/** Ubah bentuk data siswa dari API (snake_case) ke bentuk di aplikasi. */
export const toStudent = (s) => ({ code: s.code, classCode: s.class_code, username: s.username });
