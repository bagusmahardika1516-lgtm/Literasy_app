// Satu kartu konsep: gambar di atas, teks tepat di bawahnya (spatial contiguity, EL02).
import SvgSector from '../../scenes/svg/SvgSector.jsx';
import card from '../../ui/Card.module.css';

/** @param {{ data: { title: string, body: string, formula?: string, unit?: string, tone?: 'arc'|'sector',
 *   visual: { angle: number, radius: number, highlight: string } } }} props */
export default function ConceptCard({ data }) {
  const toneClass = data.tone === 'arc' ? card.formulaArc : data.tone === 'sector' ? card.formulaSector : '';
  return (
    <article className={card.card}>
      <div className={card.visual}>
        <SvgSector angle={data.visual.angle} radius={data.visual.radius} highlight={data.visual.highlight} />
      </div>
      <h2>{data.title}</h2>
      <p>{data.body}</p>
      {data.formula && <p className={`${card.formula} ${toneClass}`}>{data.formula}</p>}
      {data.unit && <p className={card.muted}>{data.unit}</p>}
    </article>
  );
}
