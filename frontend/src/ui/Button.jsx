import styles from './Button.module.css';

/**
 * Tombol dasar. Satu tombol `primary` per layar (design.md §1, aturan 4).
 * @param {{ variant?: 'primary' | 'secondary' | 'ghost', block?: boolean } & import('react').ButtonHTMLAttributes<HTMLButtonElement>} props
 */
export default function Button({ variant = 'secondary', block = false, className = '', type = 'button', ...rest }) {
  const cls = [styles.btn, styles[variant], block ? styles.block : '', className].filter(Boolean).join(' ');
  return <button type={type} className={cls} {...rest} />;
}
