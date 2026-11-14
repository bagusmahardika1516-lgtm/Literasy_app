import { useEffect, useId, useRef } from 'react';
import Button from './Button.jsx';
import styles from './ConfirmDialog.module.css';

/**
 * Dialog konfirmasi (pengganti window.confirm): fokus ke tombol aman, Esc = batal.
 * @param {{ open: boolean, title: string, children: import('react').ReactNode, confirmLabel: string,
 *   cancelLabel?: string, onConfirm: () => void, onCancel: () => void, busy?: boolean }} props
 */
export default function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  cancelLabel = 'Batal',
  onConfirm,
  onCancel,
  busy = false,
}) {
  const titleId = useId();
  const cancelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    cancelRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onCancel();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;
  return (
    // Klik di latar (bukan di dalam dialog) = batal; keyboard: Esc (lihat useEffect)
    <div className={styles.backdrop} onClick={(e) => e.target === e.currentTarget && onCancel()} role="presentation">
      <div className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        <div className={styles.body}>{children}</div>
        <div className={styles.actions}>
          <Button ref={cancelRef} variant="primary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button onClick={onConfirm} disabled={busy}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
