// Masuk dengan kode siswa + kode kelas (FR-01, ADR-011). Tanpa nama, tanpa kata sandi.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { verifyStudent } from '../../api/client.js';
import { saveProfile } from '../../data/profile.js';
import Button from '../../ui/Button.jsx';
import styles from './LoginScreen.module.css';

export default function LoginScreen() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [classCode, setClassCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    const k = classCode.trim().toUpperCase();
    if (!/^S\d{2,3}$/.test(c)) {
      setError('Kode siswa diawali huruf S lalu angka, contoh S01.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      if (await verifyStudent(c, k)) {
        saveProfile({ code: c, classCode: k });
        navigate('/', { replace: true });
      } else {
        setError('Kode siswa atau kode kelas tidak cocok. Tanyakan kepada gurumu.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className={styles.main}>
      <h1>Busur & Juring</h1>
      <p className={styles.lead}>Masukkan kode dari gurumu.</p>
      <form onSubmit={onSubmit} noValidate>
        <label className={styles.field}>
          Kode siswa
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="S01"
            autoCapitalize="characters"
            autoComplete="off"
            inputMode="text"
            required
          />
        </label>
        <label className={styles.field}>
          Kode kelas
          <input
            value={classCode}
            onChange={(e) => setClassCode(e.target.value)}
            placeholder="8A-2026"
            autoCapitalize="characters"
            autoComplete="off"
            required
          />
        </label>
        {error && (
          <p role="alert" className={styles.error}>
            {error}
          </p>
        )}
        <Button type="submit" variant="primary" block disabled={busy || !code || !classCode}>
          {busy ? 'Memeriksa…' : 'Masuk'}
        </Button>
      </form>
    </main>
  );
}
