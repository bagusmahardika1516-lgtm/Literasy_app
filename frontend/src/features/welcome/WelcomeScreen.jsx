// Halaman awal sebelum masuk (permintaan pengembang: "Halaman awal").
import text from '@content/welcome.json';
import { useNavigate } from 'react-router-dom';
import SvgSector from '../../scenes/svg/SvgSector.jsx';
import Button from '../../ui/Button.jsx';
import styles from './WelcomeScreen.module.css';

export default function WelcomeScreen() {
  const navigate = useNavigate();
  return (
    <main className={styles.main}>
      <div className={styles.visual} aria-hidden="true">
        <SvgSector angle={90} radius={14} highlight="both" />
      </div>
      <h1 className={styles.title}>{text.title}</h1>
      <p className={styles.tagline}>{text.tagline}</p>
      <ul className={styles.points}>
        {text.points.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
      <div className={styles.bottom}>
        <Button variant="primary" block onClick={() => navigate('/masuk')}>
          {text.start}
        </Button>
        <p className={styles.note}>{text.note}</p>
      </div>
    </main>
  );
}
