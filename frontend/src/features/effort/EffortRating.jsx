// Skala usaha mental Paas 1–9 di akhir bagian (F14, evaluation.md §5.1).
import { useState } from 'react';
import { recordEffort } from '../../data/records.js';
import Button from '../../ui/Button.jsx';
import styles from './EffortRating.module.css';

/** @param {{ sectionId: string, onDone: () => void }} props */
export default function EffortRating({ sectionId, onDone }) {
  const [value, setValue] = useState(null);

  function save() {
    recordEffort(sectionId, value);
    onDone();
  }

  return (
    <main className={styles.main}>
      <h1>Seberapa besar usaha pikiranmu di bagian tadi?</h1>
      <div role="radiogroup" aria-label="Usaha pikiran, 1 sangat ringan sampai 9 sangat berat" className={styles.scale}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            className={`num ${styles.dot} ${value === n ? styles.on : ''}`}
            onClick={() => setValue(n)}
          >
            {n}
          </button>
        ))}
      </div>
      <div className={styles.ends}>
        <span>sangat ringan</span>
        <span>sangat berat</span>
      </div>
      <Button variant="primary" block disabled={value === null} onClick={save}>
        Simpan
      </Button>
    </main>
  );
}
