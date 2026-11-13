import styles from './ChoiceList.module.css';

/**
 * Pilihan jawaban sebagai tombol besar (target sentuh ≥ 48dp).
 * @param {{ options: { value: string, label: string }[] | string[], value?: string, onChange: (v: string) => void,
 *   label: string, disabled?: boolean, status?: Record<string, 'correct' | 'wrong'> }} props
 */
export default function ChoiceList({ options, value, onChange, label, disabled = false, status = {} }) {
  const opts = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
  return (
    <div role="radiogroup" aria-label={label} className={styles.list}>
      {opts.map((o) => {
        const selected = value === o.value;
        const st = status[o.value];
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            className={[styles.option, selected ? styles.selected : '', st ? styles[st] : ''].join(' ')}
            onClick={() => onChange(o.value)}
          >
            <span aria-hidden="true" className={styles.dot}>
              {st === 'correct' ? '✓' : st === 'wrong' ? '✗' : selected ? '●' : '○'}
            </span>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
