// Beranda / jalur belajar (design.md §4.1). Pembukaan bertahap: bagian berikutnya terbuka setelah bagian
// sebelumnya selesai (semua soal dijawab); bagian yang sudah terbuka boleh diulang kapan saja.
// Progres & skor dibaca dari server (GET /api/progress) — tetap ada walau pindah HP.
import sequence from '@content/sequence.json';
import { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { flush, pendingCount } from '../../data/records.js';
import Button from '../../ui/Button.jsx';
import ConfirmDialog from '../../ui/ConfirmDialog.jsx';
import { formatNumber, formatScore } from '../../ui/format.js';
import LockIcon from '../../ui/LockIcon.jsx';
import ScoreRing from '../../ui/ScoreRing.jsx';
import { useAuth } from '../auth/AuthProvider.jsx';
import styles from './HomeScreen.module.css';
import UpdatePrompt from './UpdatePrompt.jsx';
import { useProgress } from './useProgress.js';

const SECTIONS = sequence.sections;
const TITLE = Object.fromEntries(SECTIONS.map((s) => [s.id, s.title]));

const KIND_LABEL = {
  mltest: 'Uji',
  diagnostic: 'Cek prasyarat',
  explore: 'Eksplorasi',
  deck: 'Materi',
  contrast: 'Materi',
  game: 'Permainan',
  examples: 'Contoh soal',
  practice: 'Latihan',
  reflection: 'Refleksi',
};

function subtitle(s) {
  const n = s.items?.length;
  return n ? `${KIND_LABEL[s.kind]} · ${n} soal` : KIND_LABEL[s.kind];
}

function TestCard({ progress }) {
  const pre = progress.pretest?.last;
  const post = progress.posttest?.last;
  const delta = pre && post ? post.score - pre.score : null;
  const cell = (label, s) => (
    <div className={styles.testCell}>
      <span className={styles.testLabel}>{label}</span>
      {s ? (
        <>
          <strong className="num">{formatScore(s.score, s.max_score)}</strong>
          <span className={styles.testBar} aria-hidden="true">
            <span style={{ width: `${(s.score / s.max_score) * 100}%` }} />
          </span>
        </>
      ) : (
        <span className={styles.testEmpty}>Belum dikerjakan</span>
      )}
    </div>
  );
  return (
    <section className={styles.testCard} aria-labelledby="uji-literasi">
      <h2 id="uji-literasi" className={styles.cardTitle}>
        Uji Literasi
      </h2>
      <div className={styles.testGrid}>
        {cell('Uji Awal', pre)}
        {cell('Uji Akhir', post)}
      </div>
      {delta !== null && (
        <p className={styles.delta}>
          {delta > 0
            ? `Skormu naik ${formatNumber(delta)} poin dari Uji Awal.`
            : delta === 0
              ? 'Skormu sama dengan Uji Awal.'
              : `Skormu turun ${formatNumber(-delta)} poin dari Uji Awal.`}
        </p>
      )}
    </section>
  );
}

export default function HomeScreen() {
  const navigate = useNavigate();
  const { student, logout } = useAuth();
  const { progress, sync } = useProgress();
  const [leaving, setLeaving] = useState(false);
  const [confirm, setConfirm] = useState(0); // >0: jumlah catatan tertunda, dialog terbuka

  const doneCount = SECTIONS.filter((s) => progress[s.id]?.done).length;
  // Bagian berikutnya = bagian terbuka pertama yang belum selesai
  const next = SECTIONS.find((s) => progress[s.id]?.status === 'open');
  const pending = pendingCount();

  async function onLogout() {
    setLeaving(true);
    await flush(); // coba kirim catatan yang tertunda dulu
    const left = pendingCount();
    if (left > 0) {
      setConfirm(left);
      setLeaving(false);
      return;
    }
    await logout(); // RequireAuth lalu mengarahkan ke halaman masuk
  }

  const closeDialog = useCallback(() => setConfirm(0), []);

  return (
    <main>
      <header className={styles.header}>
        <div className={styles.hello}>
          <span className={styles.avatar} aria-hidden="true">
            {(student?.code ?? '?').slice(0, 3)}
          </span>
          <span>
            <span className={styles.helloSmall}>Halo,</span>
            <strong>{student?.username || student?.code}</strong>
          </span>
        </div>
        <Button variant="ghost" onClick={onLogout} disabled={leaving}>
          {leaving ? 'Keluar…' : 'Keluar'}
        </Button>
      </header>

      {/* Tawaran pembaruan hanya di beranda, tidak pernah menyela soal (G12) */}
      <UpdatePrompt />

      <section className={styles.hero} aria-labelledby="judul-beranda">
        <ScoreRing
          value={doneCount}
          max={SECTIONS.length}
          size={104}
          label={`Kemajuan belajar: ${doneCount} dari ${SECTIONS.length} bagian selesai`}
        >
          <strong className={`num ${styles.heroNum}`}>{doneCount}</strong>
          <span className={`num ${styles.heroOf}`}>dari {SECTIONS.length}</span>
        </ScoreRing>
        <div className={styles.heroText}>
          <h1 id="judul-beranda" className={styles.heroTitle}>
            Busur & Juring
          </h1>
          <p className={styles.heroSub}>
            {next ? (
              <>
                Berikutnya: <strong>{next.title}</strong>
              </>
            ) : (
              'Semua bagian selesai. Kamu boleh mengulang bagian mana pun.'
            )}
          </p>
        </div>
      </section>

      {next && (
        <Button variant="primary" block className={styles.cta} onClick={() => navigate(`/bagian/${next.id}`)}>
          {doneCount === 0 ? 'Mulai Belajar' : 'Lanjutkan Belajar'} →
        </Button>
      )}

      <TestCard progress={progress} />

      {(sync === 'offline' || pending > 0) && (
        <p role="status" className={styles.sync}>
          {sync === 'offline'
            ? 'Belum tersambung ke server. Menampilkan data terakhir di HP ini.'
            : `${pending} catatan menunggu dikirim.`}
        </p>
      )}

      <h2 className={styles.listTitle}>Jalur belajar</h2>
      <ol className={styles.list} aria-busy={sync === 'loading'}>
        {SECTIONS.map((s, idx) => {
          const p = progress[s.id];
          const done = Boolean(p?.done);
          const isNext = next?.id === s.id;
          const score = p?.last;
          if (p?.status === 'locked') {
            // Terkunci: bukan tautan, tidak bisa dibuka (server juga menolak hasilnya)
            return (
              <li key={s.id}>
                <div className={`${styles.item} ${styles.locked}`} aria-disabled="true">
                  <span aria-hidden="true" className={styles.step}>
                    <LockIcon size={15} />
                  </span>
                  <span className={styles.itemText}>
                    <span className={styles.itemTitle}>{s.title}</span>
                    <span className={styles.itemSub}>Selesaikan “{TITLE[p.requires]}” dulu</span>
                  </span>
                  <span className={`${styles.chip} ${styles.chipLocked}`}>Terkunci</span>
                </div>
              </li>
            );
          }
          return (
            <li key={s.id}>
              <Link
                to={`/bagian/${s.id}`}
                className={`${styles.item} ${isNext ? styles.next : ''} ${done ? styles.done : ''}`}
                aria-current={isNext ? 'step' : undefined}
              >
                <span aria-hidden="true" className={`num ${styles.step}`}>
                  {done ? '✓' : idx + 1}
                </span>
                <span className={styles.itemText}>
                  <span className={styles.itemTitle}>{s.title}</span>
                  <span className={styles.itemSub}>{subtitle(s)}</span>
                </span>
                {score ? (
                  <span className={`num ${styles.chip} ${styles.chipScore}`}>
                    <span className="visually-hidden">Skor terakhir </span>
                    {formatScore(score.score, score.max_score)}
                  </span>
                ) : done ? (
                  <span className={`${styles.chip} ${styles.chipDone}`}>Selesai</span>
                ) : isNext ? (
                  <span className={`${styles.chip} ${styles.chipNext}`}>Berikutnya</span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ol>

      <ConfirmDialog
        open={confirm > 0}
        title="Keluar sekarang?"
        confirmLabel="Tetap keluar"
        cancelLabel="Jangan keluar dulu"
        busy={leaving}
        onCancel={closeDialog}
        onConfirm={async () => {
          setConfirm(0);
          await logout();
        }}
      >
        <p>
          Ada <strong className="num">{confirm}</strong> catatan belajar yang belum terkirim karena belum tersambung ke
          server.
        </p>
        <p>Catatan itu tetap tersimpan di HP ini dan terkirim otomatis saat kamu masuk lagi di HP ini.</p>
      </ConfirmDialog>
    </main>
  );
}
