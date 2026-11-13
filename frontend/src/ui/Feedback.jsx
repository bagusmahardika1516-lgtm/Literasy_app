import styles from './Feedback.module.css';

/**
 * Umpan balik benar/coba lagi — selalu dengan ikon + teks, tidak hanya warna (design.md §2).
 * @param {{ correct: boolean, children: import('react').ReactNode }} props
 */
export default function Feedback({ correct, children }) {
  return (
    <p role="status" className={`${styles.box} ${correct ? styles.correct : styles.retry}`}>
      <span aria-hidden="true">{correct ? '✓ ' : '↻ '}</span>
      {children}
    </p>
  );
}
