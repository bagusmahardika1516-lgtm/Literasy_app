// Status masuk untuk seluruh aplikasi. Sumber kebenaran: sesi di localStorage (data/session.js),
// diperiksa ulang ke server (/api/auth/me) saat aplikasi dibuka.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as api from '../../api/client.js';
import { getProfile, migrateLegacy } from '../../data/profile.js';
import { flush } from '../../data/records.js';
import { clearSession, getSession, saveSession, toStudent } from '../../data/session.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [student, setStudent] = useState(getProfile);
  // Pesan mengapa siswa dikeluarkan (mis. akun masuk di perangkat lain), ditampilkan di halaman masuk
  const [notice, setNotice] = useState('');

  useEffect(() => {
    function onUnauthorized(e) {
      setStudent(null);
      setNotice(api.messageFor(e.detail?.code));
    }
    window.addEventListener(api.UNAUTHORIZED_EVENT, onUnauthorized);

    if (getSession()) {
      api
        .me()
        .then((s) => {
          const session = getSession();
          if (!session) return;
          const fresh = toStudent(s);
          saveSession({ ...session, student: fresh });
          setStudent(fresh);
          flush(); // kirim catatan yang tertunda dari sesi sebelumnya
        })
        .catch(() => {
          // Offline / server tidur: tetap masuk memakai sesi lokal. 401 ditangani lewat event.
        });
    }
    return () => window.removeEventListener(api.UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  const login = useCallback(async (username, password) => {
    const res = await api.login(username, password);
    const s = toStudent(res.student);
    saveSession({ token: res.token, expiresAt: res.expires_at, student: s });
    migrateLegacy(s.code);
    setNotice('');
    setStudent(s);
    flush();
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // Offline: token tetap dihapus di HP ini; sesi di server dicabut saat akun masuk lagi
    }
    clearSession();
    setNotice('');
    setStudent(null);
  }, []);

  const value = useMemo(() => ({ student, notice, login, logout }), [student, notice, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** @returns {{ student: import('../../data/session.js').Student | null, notice: string,
 *   login: (u: string, p: string) => Promise<void>, logout: () => Promise<void> }} */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth harus dipakai di dalam <AuthProvider>');
  return ctx;
}
