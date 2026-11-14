// Uji Literasi Matematis (pretest/posttest) dari "Soal Mathematical literacy.docx" Tabel 2.
// Tanpa petunjuk/umpan balik (agar valid sebagai instrumen). Skor dihitung di server (evaluation.md §4).
import { useEffect, useState } from 'react';
import { getMlTest, getMlTestStatus, submitMlTest } from '../../api/client.js';
import { studentKey } from '../../data/profile.js';
import { uuid } from '../../data/uuid.js';
import Button from '../../ui/Button.jsx';
import card from '../../ui/Card.module.css';
import Feedback from '../../ui/Feedback.jsx';
import ScreenHeader from '../../ui/ScreenHeader.jsx';
import { formatNumber, formatScore } from '../../ui/format.js';
import ScoreRing from '../../ui/ScoreRing.jsx';
import MlStage from './MlStage.jsx';
import styles from './MlTestScreen.module.css';

// Draf per siswa: siswa lain di HP yang sama tidak melihat/meneruskan jawaban ini
const draftKey = () => studentKey('literasy.mltest-draft');

function loadDraft(kind) {
  try {
    const d = JSON.parse(localStorage.getItem(draftKey()) ?? 'null');
    return d?.kind === kind ? d : null;
  } catch {
    return null;
  }
}

function saveDraft(d) {
  try {
    localStorage.setItem(draftKey(), JSON.stringify(d));
  } catch {
    // abaikan
  }
}

/** @param {{ section: { title: string, testKind: 'pre'|'post' }, onBack: () => void, onDone: () => void }} props */
export default function MlTestScreen({ section, onBack, onDone }) {
  const kind = section.testKind;
  const [items, setItems] = useState(null);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState(() => loadDraft(kind) ?? { kind, id: uuid(), answers: {}, pos: [0, 0] });
  const [sending, setSending] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    Promise.all([getMlTest(), getMlTestStatus()])
      .then(([t, s]) => {
        setItems(t.items);
        setStatus(s);
      })
      .catch((e) => setError(e.message));
  }, []);

  function update(next) {
    setDraft(next);
    saveDraft(next);
  }

  if (error) {
    return (
      <main>
        <ScreenHeader title={section.title} onBack={onBack} />
        <Feedback correct={false}>{error}</Feedback>
      </main>
    );
  }
  if (!items || !status) return <p>Memuat soal…</p>;

  const alreadyDone = kind === 'pre' ? status.pre_done : status.post_done;
  if (alreadyDone) {
    const score = kind === 'pre' ? status.pre_score : status.post_score;
    const max = kind === 'pre' ? status.pre_max : status.post_max;
    return (
      <main>
        <ScreenHeader title={section.title} onBack={onBack} />
        <Feedback correct>Kamu sudah mengerjakan {section.title.toLowerCase()}. Terima kasih!</Feedback>
        {score !== null && score !== undefined && max ? (
          <div className={`${card.card} ${styles.done}`}>
            <ScoreRing
              value={score}
              max={max}
              size={112}
              label={`Skor ${formatNumber(score)} dari ${formatNumber(max)}`}
            >
              <strong className="num">{formatScore(score, max)}</strong>
            </ScoreRing>
            <p className={card.muted}>Skor ini tersimpan di akunmu. Uji hanya bisa dikerjakan satu kali.</p>
          </div>
        ) : null}
        <Button variant="primary" block onClick={onBack}>
          Kembali ke beranda
        </Button>
      </main>
    );
  }

  if (!started) {
    return (
      <main>
        <ScreenHeader title={section.title} onBack={onBack} />
        <div className={card.card}>
          <p>Ada {items.length} soal. Setiap soal dikerjakan langkah demi langkah.</p>
          <p>Kerjakan sendiri. Di uji ini tidak ada petunjuk dan tidak ada nilai benar/salah.</p>
          <p className={card.muted}>Jawabanmu tersimpan otomatis di HP ini sampai dikirim.</p>
        </div>
        <Button variant="primary" block onClick={() => setStarted(true)}>
          Mulai
        </Button>
      </main>
    );
  }

  const [ii, si] = draft.pos;
  const item = items[ii];
  const stage = item.stages[si];
  const answer = draft.answers[item.id]?.[stage.id];
  const isLast = ii === items.length - 1 && si === item.stages.length - 1;

  function setAnswer(v) {
    update({ ...draft, answers: { ...draft.answers, [item.id]: { ...draft.answers[item.id], [stage.id]: v } } });
  }

  function move(delta) {
    let [a, b] = [ii, si + delta];
    if (b >= item.stages.length) [a, b] = [a + 1, 0];
    if (b < 0) [a, b] = [a - 1, items[a - 1]?.stages.length - 1];
    if (a >= 0 && a < items.length) update({ ...draft, pos: [a, b] });
  }

  async function send() {
    setSending(true);
    setError('');
    try {
      const res = await submitMlTest(draft.id, kind, draft.answers);
      localStorage.removeItem(draftKey());
      onDone({ score: res.score, maxScore: res.max_score, details: { kind } });
    } catch (e) {
      if (e.status === 409) {
        // Sudah pernah dikirim (mis. dari HP lain): tampilkan status & skor yang tersimpan
        localStorage.removeItem(draftKey());
        getMlTestStatus()
          .then(setStatus)
          .catch(() => {});
      } else {
        setError(e.message);
      }
      setSending(false);
    }
  }

  return (
    <main>
      <ScreenHeader
        title={`Soal ${ii + 1}: ${item.title}`}
        progress={`Langkah ${si + 1}/${item.stages.length} · Soal ${ii + 1}/${items.length}`}
        onBack={ii === 0 && si === 0 ? onBack : () => move(-1)}
      />
      <div className={`${card.card} ${card.stem}`}>
        {item.stem.map((s) => (
          <p key={s}>{s}</p>
        ))}
      </div>
      <MlStage key={`${item.id}-${stage.id}`} stage={stage} value={answer} onChange={setAnswer} />
      {error && <Feedback correct={false}>{error}</Feedback>}
      <div className={card.actions}>
        {(ii > 0 || si > 0) && <Button onClick={() => move(-1)}>Kembali</Button>}
        {isLast ? (
          <Button variant="primary" disabled={sending} onClick={send}>
            {sending ? 'Mengirim…' : 'Kirim semua jawaban'}
          </Button>
        ) : (
          <Button variant="primary" onClick={() => move(1)}>
            Lanjut →
          </Button>
        )}
      </div>
    </main>
  );
}
