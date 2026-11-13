// Modul Kontras Busur–Juring (F01; IL01, K03): dua kolom berdampingan dengan warna tetap.
import lessons from '@content/lessons.json';
import SvgSector from '../../scenes/svg/SvgSector.jsx';
import Button from '../../ui/Button.jsx';
import card from '../../ui/Card.module.css';
import ScreenHeader from '../../ui/ScreenHeader.jsx';
import styles from './ContrastScreen.module.css';

function Column({ data, highlight, tone }) {
  return (
    <div className={`${styles.col} ${styles[tone]}`}>
      <div className={styles.visual}>
        <SvgSector angle={90} radius={14} highlight={highlight} />
      </div>
      <h2 className={styles.name}>{data.name}</h2>
      <p>{data.kind}</p>
      <p className={styles.part}>{data.part}</p>
      <p className={`num ${styles.formula}`}>{data.formula}</p>
      <p>
        satuan <strong>{data.unit}</strong>
      </p>
    </div>
  );
}

/** @param {{ section: { title: string }, onBack: () => void, onDone: () => void }} props */
export default function ContrastScreen({ section, onBack, onDone }) {
  const c = lessons.contrast;
  return (
    <main>
      <ScreenHeader title={section.title} onBack={onBack} />
      <div className={styles.grid}>
        <Column data={c.arc} highlight="arc" tone="arc" />
        <Column data={c.sector} highlight="sector" tone="sector" />
      </div>
      <p className={card.card}>
        {c.same}
        <br />
        <strong>{c.different}</strong>
      </p>
      <Button variant="primary" block onClick={onDone}>
        Lanjut ke permainan →
      </Button>
    </main>
  );
}
