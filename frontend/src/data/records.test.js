import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/client.js';
import { migrateLegacy } from './profile.js';
import { flush, pendingCount, recordAttempt, recordEffort, recordResult, rejectionOf } from './records.js';
import { clearSession, saveSession } from './session.js';

vi.mock('../api/client.js', async (orig) => ({ ...(await orig()), postRecords: vi.fn(async () => ({})) }));
const api = await import('../api/client.js');

const as = (code) =>
  saveSession({ token: `tok-${code}`, expiresAt: 'x', student: { code, classCode: 'K', username: code } });

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe('antrean catatan per siswa', () => {
  it('catatan siswa A tidak terkirim saat siswa B masuk', async () => {
    as('S01');
    recordEffort('guided', 5);
    clearSession();
    as('S02');
    expect(pendingCount()).toBe(0);
    await flush();
    expect(api.postRecords).not.toHaveBeenCalled();

    as('S01');
    expect(pendingCount()).toBe(1);
    await flush();
    expect(api.postRecords).toHaveBeenCalledTimes(1);
    expect(api.postRecords.mock.calls[0][0]).not.toHaveProperty('code');
    expect(pendingCount()).toBe(0);
  });

  it('hasil bagian dikirim setelah semua jawabannya terkirim (antrean panjang)', async () => {
    as('S01');
    for (let i = 0; i < 120; i += 1) {
      recordAttempt({ problem_id: 'P01', section_id: 'guided', correct: true, hints_used: 0 });
    }
    recordResult({ section_id: 'guided', score: 1, max_score: 6, completed_at: '2026-11-14T08:00:00Z' });
    await flush();
    const [first, second] = api.postRecords.mock.calls.map((c) => c[0]);
    expect(first.attempts).toHaveLength(100);
    expect(first.results).toHaveLength(0);
    expect(second.attempts).toHaveLength(20);
    expect(second.results).toHaveLength(1);
    expect(pendingCount()).toBe(0);
  });

  it('hasil yang ditolak server dicatat dan tidak dikirim ulang', async () => {
    as('S01');
    const row = recordResult({ section_id: 'game', score: 1, max_score: 10, completed_at: '2026-11-14T08:00:00Z' });
    api.postRecords.mockResolvedValueOnce({
      inserted: 0,
      rejected: [{ id: row.id, section_id: 'game', reason: 'section_locked', missing: [] }],
    });
    await flush();
    expect(pendingCount()).toBe(0);
    expect(rejectionOf(row.id)).toMatchObject({ reason: 'section_locked' });
  });

  it('401 saat mengirim → antrean tetap disimpan', async () => {
    as('S01');
    recordEffort('guided', 5);
    api.postRecords.mockRejectedValueOnce(new ApiError('x', 401, 'session_expired'));
    await flush();
    expect(pendingCount()).toBe(1);
  });

  it('data versi lama dipindahkan hanya untuk siswa yang sama', () => {
    localStorage.setItem('literasy.profile', JSON.stringify({ code: 'S01', classCode: 'K' }));
    localStorage.setItem('literasy.queue', JSON.stringify({ attempts: [], effort: [{ id: '1' }], reflections: [] }));
    migrateLegacy('S02');
    expect(localStorage.getItem('literasy.queue')).not.toBeNull();
    migrateLegacy('S01');
    expect(localStorage.getItem('literasy.queue')).toBeNull();
    as('S01');
    expect(pendingCount()).toBe(1);
  });
});
