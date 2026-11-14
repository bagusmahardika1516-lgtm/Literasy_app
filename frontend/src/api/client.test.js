import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getSession, saveSession } from '../data/session.js';
import { getMlTestStatus, login, logout, UNAUTHORIZED_EVENT } from './client.js';

const SESSION = { token: 'tok-1', expiresAt: 'x', student: { code: 'S01', classCode: 'K', username: 'k-s01' } };

function mockFetch(status, body) {
  const fn = vi.fn(async () => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }));
  globalThis.fetch = fn;
  return fn;
}

let events;
const onEvent = (e) => events.push(e.detail.code);

beforeEach(() => {
  localStorage.clear();
  events = [];
  window.addEventListener(UNAUTHORIZED_EVENT, onEvent);
});
afterEach(() => window.removeEventListener(UNAUTHORIZED_EVENT, onEvent));

describe('klien API', () => {
  it('mengirim token sebagai Authorization: Bearer', async () => {
    saveSession(SESSION);
    const f = mockFetch(200, { pre_done: false, post_done: false });
    await getMlTestStatus();
    expect(f.mock.calls[0][1].headers.Authorization).toBe('Bearer tok-1');
  });

  it('login tidak mengirim token lama', async () => {
    saveSession(SESSION);
    const f = mockFetch(200, {});
    await login('u', 'p');
    expect(f.mock.calls[0][1].headers.Authorization).toBeUndefined();
  });

  it('401 pada endpoint ber-token → hapus sesi + kirim event dengan alasannya', async () => {
    saveSession(SESSION);
    mockFetch(401, { detail: { code: 'session_replaced', message: '…' } });
    await expect(getMlTestStatus()).rejects.toMatchObject({ status: 401, code: 'session_replaced' });
    expect(getSession()).toBeNull();
    expect(events).toEqual(['session_replaced']);
  });

  it('401 saat login (password salah) tidak memicu event keluar', async () => {
    mockFetch(401, { detail: { code: 'invalid_credentials', message: '…' } });
    await expect(login('u', 'salah')).rejects.toMatchObject({ message: 'Username atau password salah.' });
    expect(events).toEqual([]);
  });

  it('401 saat logout tidak memicu pesan "dikeluarkan"', async () => {
    saveSession(SESSION);
    mockFetch(401, { detail: { code: 'session_replaced' } });
    await expect(logout()).rejects.toMatchObject({ status: 401 });
    expect(events).toEqual([]);
  });

  it('429 → pesan tunggu', async () => {
    mockFetch(429, { detail: { code: 'too_many_attempts' } });
    await expect(login('u', 'p')).rejects.toMatchObject({ status: 429, message: expect.stringMatching(/Tunggu/) });
  });

  it('jaringan putus → status 0 tanpa menghapus sesi', async () => {
    saveSession(SESSION);
    globalThis.fetch = vi.fn(async () => {
      throw new TypeError('offline');
    });
    await expect(getMlTestStatus()).rejects.toMatchObject({ status: 0 });
    expect(getSession()).not.toBeNull();
  });
});
