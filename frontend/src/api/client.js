// Klien HTTP ke backend FastAPI (backend/app/main.py). Token sesi dikirim di header Authorization.
import { clearSession, getToken } from '../data/session.js';

const BASE = (import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000').replace(/\/$/, '');

/** Dikirim ke window saat server menolak sesi (401). AuthProvider mendengarkan event ini. */
export const UNAUTHORIZED_EVENT = 'literasy:unauthorized';

const MESSAGES = {
  invalid_credentials: 'Username atau password salah.',
  too_many_attempts: 'Terlalu banyak percobaan masuk. Tunggu sekitar 15 menit, lalu coba lagi.',
  session_replaced: 'Akunmu baru saja masuk di perangkat lain, jadi kamu dikeluarkan dari perangkat ini.',
  session_expired: 'Sesi masukmu sudah habis. Silakan masuk lagi.',
  session_revoked: 'Password akunmu sudah diganti. Silakan masuk dengan password baru.',
  account_disabled: 'Akun ini dinonaktifkan. Tanyakan kepada gurumu.',
  not_authenticated: 'Silakan masuk terlebih dahulu.',
  invalid_token: 'Silakan masuk lagi.',
};

/** Pesan untuk kode error dari server (detail.code). */
export const messageFor = (code) => MESSAGES[code] ?? MESSAGES.invalid_token;

export class ApiError extends Error {
  /** @param {string} message @param {number} status @param {string} [code] */
  constructor(message, status, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function handleUnauthorized(code) {
  clearSession();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT, { detail: { code } }));
  }
}

/**
 * @param {string} method @param {string} path @param {unknown} [body]
 * @param {{ auth?: boolean, notifyUnauthorized?: boolean }} [opts]
 */
async function request(method, path, body, { auth = true, notifyUnauthorized = true } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = auth ? getToken() : null;
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Tidak tersambung ke server. Periksa internet, lalu coba lagi.', 0);
  }
  if (res.status === 204) return null;
  if (res.ok) return res.json();

  const detail = await res
    .json()
    .then((b) => b?.detail)
    .catch(() => null);
  const code = detail && typeof detail === 'object' ? detail.code : undefined;

  if (res.status === 401) {
    // 401 pada endpoint ber-token = sesi tidak berlaku lagi → keluar dan arahkan ke halaman masuk
    if (auth && notifyUnauthorized) handleUnauthorized(code);
    throw new ApiError(messageFor(code), 401, code);
  }
  if (res.status === 429) throw new ApiError(messageFor('too_many_attempts'), 429, code);
  if (res.status === 422) throw new ApiError('Format data belum benar.', 422);
  throw new ApiError('Server sedang bermasalah. Coba lagi sebentar.', res.status);
}

// --- Login ---------------------------------------------------------------

/** @returns {Promise<{ token: string, expires_at: string, student: { code: string, class_code: string, username: string } }>} */
export const login = (username, password) =>
  request('POST', '/api/auth/login', { username, password }, { auth: false });

/** Cabut sesi di server. 401 di sini tidak perlu memicu pesan "dikeluarkan". */
export const logout = () => request('POST', '/api/auth/logout', undefined, { notifyUnauthorized: false });

export const me = () => request('GET', '/api/auth/me');

// --- Data belajar ----------------------------------------------------------

export const postRecords = (payload) => request('POST', '/api/records', payload);

/** Soal Uji Literasi (tanpa kunci jawaban). */
export const getMlTest = () => request('GET', '/api/mltest', undefined, { auth: false });

export const getMlTestStatus = () => request('GET', '/api/mltest/status');

export const submitMlTest = (submissionId, kind, answers) =>
  request('POST', '/api/mltest/submit', { submission_id: submissionId, kind, answers });
