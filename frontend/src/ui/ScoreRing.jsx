import styles from './ScoreRing.module.css';

/**
 * Cincin kemajuan (lingkaran — selaras dengan materi busur). Busur terisi = value/max.
 * Teks di tengah selalu ada, jadi informasi tidak hanya lewat warna (design.md §2).
 * @param {{ value: number, max: number, size?: number, label: string, children: import('react').ReactNode,
 *   tone?: 'sector' | 'correct' }} props
 */
export default function ScoreRing({ value, max, size = 132, label, children, tone = 'sector' }) {
  const stroke = Math.max(8, Math.round(size / 11));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const frac = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  return (
    <div
      className={`${styles.ring} ${styles[tone]}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={label}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle className={styles.track} cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} />
        <circle
          className={styles.fill}
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - frac)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className={styles.center} aria-hidden="true">
        {children}
      </div>
    </div>
  );
}
