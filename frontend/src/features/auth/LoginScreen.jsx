// Satu-satunya pintu masuk: perkenalan singkat + form username & password (pengganti Halaman Awal).
import text from '@content/welcome.json';
import { useState } from 'react';
import SvgSector from '../../scenes/svg/SvgSector.jsx';
import Button from '../../ui/Button.jsx';
import { useAuth } from './AuthProvider.jsx';
import styles from './LoginScreen.module.css';

export default function LoginScreen() {
  const { login, notice } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    const u = username.trim().toLowerCase();
    if (!u || !password) return;
    setBusy(true);
    setError('');
    try {
      await login(u, password); // berhasil → GuestOnly mengarahkan ke beranda
    } catch (err) {
      setError(err.message);
      setPassword('');
      setBusy(false);
    }
  }

  return (
    <main className={styles.main}>
      <div className={styles.visual} aria-hidden="true">
        <SvgSector angle={90} radius={14} highlight="both" />
      </div>
      <h1 className={styles.title}>{text.title}</h1>
      <p className={styles.tagline}>{text.tagline}</p>

      {notice && !error && (
        <p role="status" className={styles.notice}>
          {notice}
        </p>
      )}

      <form onSubmit={onSubmit} noValidate className={styles.form}>
        <label className={styles.field}>
          Username
          <input
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="contoh: 8a-2026-s01"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            autoComplete="username"
            required
          />
        </label>
        <label className={styles.label} htmlFor="password">
          Password
        </label>
        <div className={styles.passwordRow}>
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            className={styles.toggle}
            aria-pressed={showPassword}
            aria-controls="password"
            onClick={() => setShowPassword((v) => !v)}
          >
            {showPassword ? 'Sembunyikan' : 'Lihat'}
          </button>
        </div>
        {error && (
          <p role="alert" className={styles.error}>
            {error}
          </p>
        )}
        <Button type="submit" variant="primary" block disabled={busy || !username.trim() || !password}>
          {busy ? 'Memeriksa…' : 'Masuk'}
        </Button>
      </form>
      <p className={styles.note}>{text.note}</p>
    </main>
  );
}
