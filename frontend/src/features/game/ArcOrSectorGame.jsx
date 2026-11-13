// Permainan "Busur atau Juring?" (F01, IL01). Tanpa poin/timer/peringkat (G3, G10):
// setiap kartu diberi alasan, kartu yang salah diulang di akhir sampai tepat.
import game from '@content/game.json';
import { useState } from 'react';
import Button from '../../ui/Button.jsx';
import card from '../../ui/Card.module.css';
import Feedback from '../../ui/Feedback.jsx';
import ScreenHeader from '../../ui/ScreenHeader.jsx';
import styles from './ArcOrSectorGame.module.css';

const LABEL = { arc: 'Busur', sector: 'Juring' };

/** @param {{ section: { title: string }, onBack: () => void, onDone: () => void }} props */
export default function ArcOrSectorGame({ section, onBack, onDone }) {
  const [queue, setQueue] = useState(() => game.items.map((g) => g.id));
  const [picked, setPicked] = useState(null);
  const [doneCount, setDoneCount] = useState(0);
  const item = game.items.find((g) => g.id === queue[0]);
  const correct = picked === item?.answer;

  function next() {
    const [head, ...rest] = queue;
    if (correct) setDoneCount((n) => n + 1);
    setQueue(correct ? rest : [...rest, head]); // salah → muncul lagi di akhir
    setPicked(null);
  }

  function restart() {
    setQueue(game.items.map((g) => g.id));
    setPicked(null);
    setDoneCount(0);
  }

  if (!item) {
    return (
      <main>
        <ScreenHeader title={game.title} onBack={onBack} onRestart={restart} />
        <Feedback correct>Semua kartu sudah tepat. Kamu bisa membedakan busur dan juring!</Feedback>
        <Button variant="primary" block onClick={onDone}>
          Selesai
        </Button>
      </main>
    );
  }

  return (
    <main>
      <ScreenHeader
        title={section.title}
        progress={`${doneCount}/${game.items.length} kartu tepat`}
        onBack={onBack}
        onRestart={restart}
      />
      <p className={card.muted}>{game.intro}</p>
      <article className={`${card.card} ${styles.prompt}`}>{item.text}</article>
      <div className={styles.choices}>
        {['arc', 'sector'].map((v) => (
          <button
            key={v}
            type="button"
            disabled={picked !== null}
            className={`${styles.choice} ${styles[v]} ${picked === v ? styles.on : ''}`}
            onClick={() => setPicked(v)}
          >
            {LABEL[v]}
          </button>
        ))}
      </div>
      {picked && (
        <>
          <Feedback correct={correct}>
            {correct ? 'Tepat. ' : `Belum tepat, ini ${LABEL[item.answer].toLowerCase()}. `}
            {item.why}
          </Feedback>
          <Button variant="primary" block onClick={next}>
            Kartu berikutnya →
          </Button>
        </>
      )}
    </main>
  );
}
