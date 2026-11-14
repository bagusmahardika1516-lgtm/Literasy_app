import { forwardRef } from 'react';
import styles from './Button.module.css';

/**
 * Tombol dasar. Satu tombol `primary` per layar (design.md §1, aturan 4).
 * @type {import('react').ForwardRefExoticComponent<{ variant?: 'primary' | 'secondary' | 'ghost', block?: boolean }
 *   & import('react').ButtonHTMLAttributes<HTMLButtonElement> & import('react').RefAttributes<HTMLButtonElement>>}
 */
const Button = forwardRef(function Button(
  { variant = 'secondary', block = false, className = '', type = 'button', ...rest },
  ref,
) {
  const cls = [styles.btn, styles[variant], block ? styles.block : '', className].filter(Boolean).join(' ');
  return <button ref={ref} type={type} className={cls} {...rest} />;
});

export default Button;
