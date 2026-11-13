import { useId } from 'react';
import styles from './NumberInput.module.css';

/**
 * Isian angka (keyboard angka di HP). Menerima koma atau titik.
 * Bila `units` diberikan, siswa memilih satuan sendiri (cek satuan, F09); bila `unitLabel`, satuan hanya ditampilkan.
 * @param {{ label: string, value: string, onChange: (v: string) => void, units?: { value: string, label: string }[],
 *   unit?: string, onUnitChange?: (u: string) => void, unitLabel?: string, disabled?: boolean,
 *   placeholder?: string, inputMode?: 'decimal' | 'text' }} props
 */
export default function NumberInput({
  label,
  value,
  onChange,
  units,
  unit,
  onUnitChange,
  unitLabel,
  disabled,
  placeholder,
  inputMode = 'decimal',
}) {
  const id = useId();
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <div className={styles.row}>
        <input
          id={id}
          className={`num ${styles.input}`}
          inputMode={inputMode}
          autoComplete="off"
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
        {unitLabel && <span className={styles.unitLabel}>{unitLabel}</span>}
        {units && units.length > 0 && (
          <div role="radiogroup" aria-label={`Satuan ${label}`} className={styles.units}>
            {units.map((u) => (
              <button
                key={u.value}
                type="button"
                role="radio"
                aria-checked={unit === u.value}
                disabled={disabled}
                className={`${styles.unit} ${unit === u.value ? styles.unitOn : ''}`}
                onClick={() => onUnitChange?.(u.value)}
              >
                {u.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
