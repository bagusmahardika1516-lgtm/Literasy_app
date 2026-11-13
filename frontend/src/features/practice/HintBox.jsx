// Petunjuk bertingkat 1→2→3, tidak pernah memberi jawaban akhir (F10, GL03, agents.md G7).
import practice from '@content/practice.json';
import Button from '../../ui/Button.jsx';
import { fill } from '../../ui/format.js';
import styles from './HintBox.module.css';

/** @param {{ hints: string[], available: number, opened: number, onOpen: () => void }} props */
export default function HintBox({ hints, available, opened, onOpen }) {
  const left = available - opened;
  return (
    <div className={styles.box}>
      {hints.slice(0, opened).map((h, i) => (
        <p key={h} className={styles.hint}>
          <span className={styles.label}>{fill(practice.hintTitle, { level: i + 1, max: available })}</span>
          {h}
        </p>
      ))}
      {left > 0 ? (
        <Button variant="ghost" onClick={onOpen}>
          💡 {practice.hintButton} ({left})
        </Button>
      ) : (
        opened > 0 && <p className={styles.none}>{practice.noHintLeft}</p>
      )}
    </div>
  );
}
