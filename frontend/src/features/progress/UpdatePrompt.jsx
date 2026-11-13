// Tawaran versi baru PWA — hanya ditampilkan di beranda (agents.md G12).
import { useRegisterSW } from 'virtual:pwa-register/react';
import Button from '../../ui/Button.jsx';

export default function UpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;
  return (
    <div role="status" style={{ marginBottom: 'var(--sp-4)' }}>
      <p>Versi baru tersedia.</p>
      <Button onClick={() => updateServiceWorker(true)}>Muat ulang</Button>
    </div>
  );
}
