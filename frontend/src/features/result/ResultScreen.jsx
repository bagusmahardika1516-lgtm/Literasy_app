// Hasil akhir satu bagian (skor per sesi) + status penyimpanan ke server.
// Tanpa poin/peringkat/animasi hadiah (ADR-010): hanya ringkasan yang membantu siswa memutuskan langkah berikutnya.
import { useEffect, useState } from 'react';
import { flushNow, isQueued } from '../../data/records.js';
import Button from '../../ui/Button.jsx';
import { formatDuration, formatNumber, formatScore } from '../../ui/format.js';
import ScoreRing from '../../ui/ScoreRing.jsx';
import styles from './ResultScreen.module.css';

const SCORE_LABEL = {
  practice: 'Benar di percobaan pertama',
  diagnostic: 'Jawaban benar',
  game: 'Tepat pada pilihan pertama',
  mltest: 'Skor uji',
};

function message(kind, ratio) {
  if (kind === 'mltest') return 'Terima kasih sudah mengerjakan dengan sungguh-sungguh.';
  if (ratio === null) return 'Bagian ini sudah kamu selesaikan.';
  if (ratio >= 0.8) return 'Hebat! Kamu sudah menguasai bagian ini.';
  if (ratio >= 0.5) return 'Bagus! Ulangi bagian ini kapan-kapan untuk soal yang masih keliru.';
  return 'Tidak apa-apa. Coba ulangi bagian ini, atau buka lagi Contoh Soal.';
}

/** Status simpan: 'saving' → 'saved' | 'pending' (offline, dikirim otomatis nanti). */
function useSaveStatus(recordId, serverSaved) {
  const [status, setStatus] = useState(serverSaved || !recordId ? 'saved' : 'saving');
  useEffect(() => {
    if (serverSaved || !recordId) return undefined;
    let alive = true;
    const check = () =>
      flushNow().then(() => {
        if (alive) setStatus(isQueued(recordId) ? 'pending' : 'saved');
      });
    check();
    window.addEventListener('online', check);
    return () => {
      alive = false;
      window.removeEventListener('online', check);
    };
  }, [recordId, serverSaved]);
  return status;
}

/**
 * @param {{ section: { id: string, title: string, kind: string },
 *   result: { score: number|null, maxScore: number|null, details: object, startedAt: string, completedAt: string,
 *     recordId?: string, serverSaved?: boolean },
 *   onContinue: () => void, onRetry: () => void, continueLabel: string }} props
 */
export default function ResultScreen({ section, result, onContinue, onRetry, continueLabel }) {
  const status = useSaveStatus(result.recordId, result.serverSaved);
  const scored = result.score !== null && result.maxScore;
  const ratio = scored ? result.score / result.maxScore : null;
  const duration = Date.parse(result.completedAt) - Date.parse(result.startedAt);
  const hints = result.details?.hints;
  const isTest = section.kind === 'mltest';

  return (
    <main className={styles.main}>
      <p className={styles.eyebrow}>Bagian selesai</p>
      <h1 className={styles.title}>{section.title}</h1>

      <div className={styles.hero}>
        {scored ? (
          <ScoreRing
            value={result.score}
            max={result.maxScore}
            size={156}
            label={`${SCORE_LABEL[section.kind] ?? 'Skor'}: ${formatNumber(result.score)} dari ${formatNumber(result.maxScore)}`}
          >
            <span className={`num ${styles.big}`}>{formatScore(result.score, result.maxScore)}</span>
            <span className={`num ${styles.pct}`}>{Math.round(ratio * 100)}%</span>
          </ScoreRing>
        ) : (
          <ScoreRing value={1} max={1} size={156} tone="correct" label="Bagian selesai">
            <span className={styles.check}>✓</span>
          </ScoreRing>
        )}
        <p className={styles.message}>{message(section.kind, ratio)}</p>
      </div>

      <dl className={styles.stats}>
        {scored && (
          <div>
            <dt>{SCORE_LABEL[section.kind] ?? 'Skor'}</dt>
            <dd className="num">
              {formatNumber(result.score)} dari {formatNumber(result.maxScore)}
            </dd>
          </div>
        )}
        {typeof hints === 'number' && (
          <div>
            <dt>Petunjuk dipakai</dt>
            <dd className="num">{hints}</dd>
          </div>
        )}
        {!isTest && Number.isFinite(duration) && duration > 0 && (
          <div>
            <dt>Waktu</dt>
            <dd className="num">{formatDuration(duration)}</dd>
          </div>
        )}
      </dl>

      {isTest && <p className={styles.note}>Jawaban uraian (alasan) dinilai kemudian oleh guru/peneliti.</p>}

      <p role="status" className={`${styles.save} ${styles[status]}`}>
        {status === 'saving' && 'Menyimpan hasil…'}
        {status === 'saved' && '✓ Hasil tersimpan di akunmu'}
        {status === 'pending' && '↻ Belum tersambung. Hasil tersimpan di HP ini dan terkirim otomatis.'}
      </p>

      <div className={styles.actions}>
        <Button variant="primary" block onClick={onContinue}>
          {continueLabel}
        </Button>
        {!isTest && (
          <Button block onClick={onRetry}>
            Ulangi bagian ini
          </Button>
        )}
      </div>
    </main>
  );
}
