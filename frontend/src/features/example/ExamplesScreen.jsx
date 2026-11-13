// Contoh terurai WE1–WE6 (F04, GL01, DS02): langkah dibuka satu per ketukan, lalu "Jelaskan ke Teman".
import ex from '@content/examples.json';
import { useState } from 'react';
import SvgSector from '../../scenes/svg/SvgSector.jsx';
import Button from '../../ui/Button.jsx';
import card from '../../ui/Card.module.css';
import ScreenHeader from '../../ui/ScreenHeader.jsx';
import SelfExplain from '../reflection/SelfExplain.jsx';
import styles from './ExamplesScreen.module.css';

/** @param {{ section: { title: string, items: string[] }, onBack: () => void, onDone: () => void }} props */
export default function ExamplesScreen({ section, onBack, onDone }) {
  const list = section.items.map((id) => ex.examples.find((e) => e.id === id));
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(1);
  const [explaining, setExplaining] = useState(false);
  const e = list[i];
  const allShown = shown >= e.steps.length;

  function goNext() {
    setExplaining(false);
    setShown(1);
    if (i === list.length - 1) onDone();
    else setI(i + 1);
  }

  function afterSteps() {
    if (e.selfExplain && !explaining) setExplaining(true);
    else goNext();
  }

  return (
    <main>
      <ScreenHeader
        title={`Contoh ${i + 1}: ${e.title}`}
        progress={`${i + 1}/${list.length}`}
        onBack={i === 0 ? onBack : () => (setI(i - 1), setShown(1), setExplaining(false))}
        onRestart={() => (setShown(1), setExplaining(false))}
      />
      <div className={card.visual}>
        <SvgSector {...e.visual} />
      </div>
      <div className={`${card.card} ${card.stem}`}>
        {e.stem.map((s) => (
          <p key={s}>{s}</p>
        ))}
      </div>

      <ol className={styles.steps}>
        {e.steps.slice(0, shown).map((s) => (
          <li key={s.step}>
            <strong>{ex.stepLabels[s.step]}:</strong> <span className="num">{s.text}</span>
          </li>
        ))}
      </ol>

      {explaining ? (
        <SelfExplain promptId={e.selfExplain} onDone={goNext} />
      ) : (
        <div className={card.actions}>
          {!allShown ? (
            <Button variant="primary" onClick={() => setShown(shown + 1)}>
              Langkah berikutnya ({shown}/{e.steps.length})
            </Button>
          ) : (
            <Button variant="primary" onClick={afterSteps}>
              {i === list.length - 1 && !e.selfExplain ? 'Selesai' : 'Lanjut →'}
            </Button>
          )}
        </div>
      )}
    </main>
  );
}
