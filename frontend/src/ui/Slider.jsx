import { useId } from 'react';
import styles from './Slider.module.css';

const SNAP_DISTANCE = 3;

function snap(value, points) {
  if (!points) return value;
  const near = points.find((p) => Math.abs(p - value) <= SNAP_DISTANCE);
  return near ?? value;
}

/**
 * Slider dengan tombol −/+ (aksesibel untuk TalkBack, design.md §7) dan titik snap opsional.
 * @param {{ label: string, value: number, min: number, max: number, step?: number, unit?: string,
 *   snapPoints?: number[], tone?: 'angle' | 'neutral', onChange: (v: number) => void }} props
 */
export default function Slider({ label, value, min, max, step = 1, unit = '', snapPoints, tone = 'neutral', onChange }) {
  const id = useId();
  const set = (v) => onChange(Math.min(max, Math.max(min, v)));
  return (
    <div className={styles.row}>
      <label htmlFor={id} className={styles.label}>
        {label}
        <span className={`num ${styles.value} ${styles[tone]}`}>
          {value}
          {unit}
        </span>
      </label>
      <div className={styles.controls}>
        <button type="button" className={styles.step} aria-label={`Kurangi ${label}`} onClick={() => set(value - step)}>
          −
        </button>
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          className={`${styles.range} ${styles[tone]}`}
          onChange={(e) => set(snap(Number(e.target.value), snapPoints))}
        />
        <button type="button" className={styles.step} aria-label={`Tambah ${label}`} onClick={() => set(value + step)}>
          +
        </button>
      </div>
    </div>
  );
}
