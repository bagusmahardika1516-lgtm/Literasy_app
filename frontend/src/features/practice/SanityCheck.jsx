// Cek Kewajaran (F09, GL02): pecahan sudut + seluruh keliling/luas + cek satuan, sebelum jawaban dikirim.
import practice from '@content/practice.json';
import Button from '../../ui/Button.jsx';
import card from '../../ui/Card.module.css';
import { fill, formatNumber } from '../../ui/format.js';

/**
 * @param {{ info: ReturnType<typeof import('../../engine/practice.js').sanityInfo>, answer: string,
 *   answerUnit: string, onSend: () => void, onRecheck: () => void }} props
 */
export default function SanityCheck({ info, answer, answerUnit, onSend, onRecheck }) {
  const t = practice.sanity;
  const unitWord = practice.units[info.unitKey];
  return (
    <section className={card.card} aria-label={t.title}>
      <h2>{t.title}</h2>
      <p className="num">{fill(t.fraction, { theta: info.theta, fraction: info.fraction })}</p>
      <p className="num">
        {fill(t.whole, { wholeName: info.wholeName, whole: formatNumber(info.whole), unit: unitWord })}
      </p>
      <p>{fill(t.unitAsk, { kind: info.kind, unitWord })}</p>
      <p className="num">
        <strong>{fill(t.question, { answer, answerUnit })}</strong>
      </p>
      <div className={card.actions}>
        <Button onClick={onRecheck}>{t.recheck}</Button>
        <Button variant="primary" onClick={onSend}>
          {t.send}
        </Button>
      </div>
    </section>
  );
}
