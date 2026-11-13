// Klien HTTP ke backend FastAPI (backend/app/main.py).
const BASE = (import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(method, path, body) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Tidak tersambung ke server. Periksa internet, lalu coba lagi.', 0);
  }
  if (res.status === 403) throw new ApiError('Kode siswa atau kode kelas tidak cocok.', 403);
  if (res.status === 422) throw new ApiError('Format data belum benar.', 422);
  if (!res.ok) throw new ApiError('Server sedang bermasalah. Coba lagi sebentar.', res.status);
  return res.json();
}

/** @returns {Promise<boolean>} */
export async function verifyStudent(code, classCode) {
  const data = await request('POST', '/api/students/verify', { code, class_code: classCode });
  return data.valid === true;
}

export const postRecords = (payload) => request('POST', '/api/records', payload);

/** Soal Uji Literasi (tanpa kunci jawaban). */
export const getMlTest = () => request('GET', '/api/mltest');

export const getMlTestStatus = (profile) =>
  request('POST', '/api/mltest/status', { code: profile.code, class_code: profile.classCode });

/** @param {{ code: string, classCode: string }} profile */
export const submitMlTest = (profile, submissionId, kind, answers) =>
  request('POST', '/api/mltest/submit', {
    code: profile.code,
    class_code: profile.classCode,
    submission_id: submissionId,
    kind,
    answers,
  });
