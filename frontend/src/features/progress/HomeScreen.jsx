// Beranda / jalur belajar (design.md §4.1). Semua bagian bisa dibuka; yang disarankan ditandai ●.
import sequence from '@content/sequence.json';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getProgress } from '../../data/profile.js';
import { flush, pendingCount } from '../../data/records.js';
import Button from '../../ui/Button.jsx';
import { useAuth } from '../auth/AuthProvider.jsx';
import styles from './HomeScreen.module.css';
import UpdatePrompt from './UpdatePrompt.jsx';

export default function HomeScreen() {
  const navigate = useNavigate();
  const { student, logout } = useAuth();
  const [leaving, setLeaving] = useState(false);
  const progress = getProgress();
  const sections = sequence.sections;
  const doneCount = sections.filter((s) => progress[s.id] === 'done').length;
  const next = sections.find((s) => progress[s.id] !== 'done');

  async function onLogout() {
    setLeaving(true);
    await flush(); // coba kirim catatan yang tertunda dulu
    const pending = pendingCount();
    if (
      pending > 0 &&
      !window.confirm(
        `Ada ${pending} catatan belajar yang belum terkirim karena belum tersambung ke server.\n\n` +
          'Catatan itu tetap tersimpan di HP ini dan terkirim otomatis saat kamu masuk lagi di HP ini.\n\n' +
          'Tetap keluar?',
      )
    ) {
      setLeaving(false);
      return;
    }
    await logout(); // RequireAuth lalu mengarahkan ke halaman masuk
  }

  return (
    <main>
      <header className={styles.header}>
        <span>Halo, {student?.username || student?.code}</span>
        <Button variant="ghost" onClick={onLogout} disabled={leaving}>
          {leaving ? 'Keluar…' : 'Keluar'}
        </Button>
      </header>

      {/* Tawaran pembaruan hanya di beranda, tidak pernah menyela soal (G12) */}
      <UpdatePrompt />

      <h1>Busur & Juring</h1>
      <div
        className={styles.bar}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={sections.length}
        aria-valuenow={doneCount}
        aria-label="Kemajuan belajar"
      >
        <div className={styles.fill} style={{ width: `${(doneCount / sections.length) * 100}%` }} />
      </div>
      <p className={`num ${styles.count}`}>
        {doneCount}/{sections.length} bagian selesai
      </p>

      <ol className={styles.list}>
        {sections.map((s) => {
          const done = progress[s.id] === 'done';
          const isNext = next?.id === s.id;
          return (
            <li key={s.id}>
              <Link to={`/bagian/${s.id}`} className={`${styles.item} ${isNext ? styles.next : ''}`}>
                <span aria-hidden="true" className={styles.mark}>
                  {done ? '✓' : isNext ? '●' : '○'}
                </span>
                <span>{s.title}</span>
                {done && <span className={styles.badge}>selesai</span>}
              </Link>
            </li>
          );
        })}
      </ol>

      {next ? (
        <Button variant="primary" block onClick={() => navigate(`/bagian/${next.id}`)}>
          {doneCount === 0 ? 'Mulai Belajar' : 'Lanjutkan Belajar'}
        </Button>
      ) : (
        <p className={styles.count}>Semua bagian selesai. Kamu boleh mengulang bagian mana pun.</p>
      )}
    </main>
  );
}
