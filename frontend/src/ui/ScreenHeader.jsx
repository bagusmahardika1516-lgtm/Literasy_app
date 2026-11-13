import Button from './Button.jsx';
import styles from './ScreenHeader.module.css';

/**
 * Kepala layar materi: tombol Kembali dan Ulangi selalu ada (agents.md G6, EL04).
 * @param {{ title: string, onBack: () => void, onRestart?: () => void, progress?: string }} props
 */
export default function ScreenHeader({ title, onBack, onRestart, progress }) {
  return (
    <header className={styles.header}>
      <Button variant="ghost" onClick={onBack} aria-label="Kembali">
        ←
      </Button>
      <div className={styles.center}>
        <h1 className={styles.title}>{title}</h1>
        {progress && <span className={`num ${styles.progress}`}>{progress}</span>}
      </div>
      {onRestart ? (
        <Button variant="ghost" onClick={onRestart} aria-label="Ulangi dari awal">
          ↺
        </Button>
      ) : (
        <span className={styles.spacer} />
      )}
    </header>
  );
}
