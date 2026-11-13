// Soal cerita per kalimat + "Tandai Info Penting" (F05; EL01, EL05). Siswa mengetuk kata/angka penting.
import practice from '@content/practice.json';
import styles from './HighlightStem.module.css';

/** @param {{ stem: string[], marked: string[], onToggle?: (key: string) => void }} props */
export default function HighlightStem({ stem, marked, onToggle }) {
  const t = practice.highlight;
  const interactive = Boolean(onToggle);
  return (
    <div>
      {interactive && <p className={styles.intro}>{t.intro}</p>}
      <ol className={styles.sentences}>
        {stem.map((sentence, si) => (
          <li key={sentence}>
            {sentence.split(' ').map((word, wi) => {
              const key = `${si}:${wi}`;
              const on = marked.includes(key);
              return interactive ? (
                <button
                  key={key}
                  type="button"
                  aria-pressed={on}
                  className={`${styles.word} ${on ? styles.on : ''}`}
                  onClick={() => onToggle(key)}
                >
                  {word}
                </button>
              ) : (
                <span key={key} className={on ? styles.onStatic : undefined}>
                  {word}{' '}
                </span>
              );
            })}
          </li>
        ))}
      </ol>
      {interactive && (
        <p className={styles.picked}>
          <strong>{t.picked}</strong>{' '}
          {marked.length ? marked.map((k) => wordAt(stem, k)).join(' · ') : t.none}
        </p>
      )}
    </div>
  );
}

function wordAt(stem, key) {
  const [si, wi] = key.split(':').map(Number);
  return stem[si].split(' ')[wi].replace(/[.,?!]$/, '');
}
