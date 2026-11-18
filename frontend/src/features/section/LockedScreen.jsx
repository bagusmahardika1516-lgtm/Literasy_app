// Layar saat bagian terkunci dibuka lewat URL langsung (pembukaan bertahap).
import { useNavigate } from 'react-router-dom';
import Button from '../../ui/Button.jsx';
import LockIcon from '../../ui/LockIcon.jsx';
import ScreenHeader from '../../ui/ScreenHeader.jsx';
import styles from './LockedScreen.module.css';

/** @param {{ section: { title: string }, requires: { id: string, title: string } | null }} props */
export default function LockedScreen({ section, requires }) {
  const navigate = useNavigate();
  const home = () => navigate('/');
  return (
    <main>
      <ScreenHeader title={section.title} onBack={home} />
      <section className={styles.box} aria-labelledby="judul-terkunci">
        <span className={styles.icon}>
          <LockIcon size={32} />
        </span>
        <h2 id="judul-terkunci" className={styles.title}>
          Bagian ini masih terkunci
        </h2>
        {requires && (
          <p className={styles.text}>
            Selesaikan <strong>{requires.title}</strong> dulu. Bagian ini terbuka otomatis setelah semua soal di bagian
            itu kamu jawab.
          </p>
        )}
      </section>
      <div className={styles.actions}>
        {requires && (
          <Button variant="primary" block onClick={() => navigate(`/bagian/${requires.id}`)}>
            Buka {requires.title} →
          </Button>
        )}
        <Button block onClick={home}>
          Kembali ke beranda
        </Button>
      </div>
    </main>
  );
}
