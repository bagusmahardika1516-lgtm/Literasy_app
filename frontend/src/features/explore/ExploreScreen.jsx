// Eksplorasi busur & juring (F01, F06, F07, F08; design.md §4.2).
// Teks dari content/explore.json, angka dari engine/circle.js — komponen tidak menghitung rumus sendiri.
import text from '@content/explore.json';
import { useCallback, useState } from 'react';
import { arcLength, circleArea, circumference, fractionLabel, round2, sectorArea } from '../../engine/circle.js';
import SceneView from '../../scenes/SceneView.jsx';
import Button from '../../ui/Button.jsx';
import { fill, formatNumber } from '../../ui/format.js';
import Slider from '../../ui/Slider.jsx';
import styles from './ExploreScreen.module.css';

const INITIAL = { angle: 90, radius: 14, highlight: 'both' };
const ANGLE_SNAPS = [0, 30, 45, 60, 90, 120, 180, 270, 360];

/** @param {{ onBack: () => void, onDone: () => void }} props */
export default function ExploreScreen({ onBack, onDone }) {
  const [angle, setAngle] = useState(INITIAL.angle);
  const [radius, setRadius] = useState(INITIAL.radius);
  const [highlight, setHighlight] = useState(INITIAL.highlight);
  const [topView, setTopView] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [fallback, setFallback] = useState(false);
  const onFallback = useCallback(() => setFallback(true), []);

  const f = fractionLabel(angle);
  const vars = {
    theta: angle,
    fraction: f,
    circumference: formatNumber(round2(circumference(radius))),
    area: formatNumber(round2(circleArea(radius))),
    arc: formatNumber(round2(arcLength(radius, angle))),
    sector: formatNumber(round2(sectorArea(radius, angle))),
  };
  const showArc = highlight !== 'sector';
  const showSector = highlight !== 'arc';

  function reset() {
    setAngle(INITIAL.angle);
    setRadius(INITIAL.radius);
    setHighlight(INITIAL.highlight);
    setTopView(false);
    setResetKey((k) => k + 1);
  }

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <Button variant="ghost" onClick={onBack} aria-label={text.back}>
          ← {text.back}
        </Button>
        <h1 className={styles.title}>{text.title}</h1>
        <Button variant="ghost" onClick={reset}>
          ↺ {text.reset}
        </Button>
      </header>

      <p className={styles.intro}>{text.intro}</p>

      <SceneView
        angle={angle}
        radius={radius}
        highlight={highlight}
        topView={topView}
        resetKey={resetKey}
        onFallback={onFallback}
      />
      {fallback && <p className={styles.note}>{text.fallbackNote}</p>}

      {/* Penjelasan tepat di bawah gambar (spatial contiguity, EL02) */}
      <section aria-live="polite" className={`num ${styles.readout}`}>
        <p className={styles.angle}>{fill(text.fractionLine, vars)}</p>
        {showArc && <p className={styles.arc}>{fill(text.arcLine, vars)}</p>}
        {showSector && <p className={styles.sector}>{fill(text.sectorLine, vars)}</p>}
      </section>

      <div className={styles.toggle} role="group" aria-label="Tampilkan">
        {['arc', 'sector', 'both'].map((h) => (
          <Button key={h} variant={highlight === h ? 'primary' : 'secondary'} aria-pressed={highlight === h} onClick={() => setHighlight(h)}>
            {text.toggle[h]}
          </Button>
        ))}
      </div>

      <Slider label={text.sliderAngle} value={angle} min={0} max={360} unit="°" tone="angle" snapPoints={ANGLE_SNAPS} onChange={setAngle} />
      <Slider label={text.sliderRadius} value={radius} min={1} max={28} unit=" cm" onChange={setRadius} />

      {!fallback && (
        <label className={styles.check}>
          <input type="checkbox" checked={topView} onChange={(e) => setTopView(e.target.checked)} />
          {text.topView}
        </label>
      )}

      <p className={styles.key}>{text.keyIdea}</p>

      <nav className={styles.nav}>
        <Button variant="primary" onClick={onDone}>
          {text.next} →
        </Button>
      </nav>
    </main>
  );
}
