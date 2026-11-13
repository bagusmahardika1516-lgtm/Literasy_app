// Fallback 2D bila WebGL tidak tersedia — props sama dengan SceneView (design.md §6.3).
import styles from './SvgSector.module.css';

const R = 1;

function point(deg, radius = R) {
  const a = (deg * Math.PI) / 180;
  // y SVG mengarah ke bawah → dibalik agar sudut berlawanan arah jarum jam
  return [radius * Math.cos(a), -radius * Math.sin(a)];
}

/**
 * @param {{ angle: number, radius: number, highlight?: 'arc'|'sector'|'both'|'none', unit?: string }} props
 */
export default function SvgSector({ angle, radius, highlight = 'both', unit = 'cm' }) {
  const t = Math.max(0, Math.min(360, angle));
  const full = t >= 360;
  const large = t > 180 ? 1 : 0;
  const [ex, ey] = point(t);
  const showArc = t > 0 && (highlight === 'arc' || highlight === 'both');
  const showSector = t > 0 && (highlight === 'sector' || highlight === 'both');
  const [lx, ly] = point(t / 2, 1.22);
  const [sx, sy] = point(t / 2, 0.68);
  // label sudut dekat pusat; untuk sudut kecil digeser agar tidak menimpa label r
  const [tx, ty] = point(Math.max(t / 2, 20), 0.36);
  const [mx, my] = point(t, 0.2);

  return (
    <svg
      className={styles.svg}
      viewBox="-1.45 -1.4 2.9 2.8"
      role="img"
      aria-label={`Lingkaran jari-jari ${radius} ${unit}, sudut pusat ${Math.round(t)} derajat`}
    >
      <circle r={R} className={styles.disc} />
      {showSector &&
        (full ? (
          <circle r={R} className={styles.sector} />
        ) : (
          <path d={`M0 0 L${R} 0 A${R} ${R} 0 ${large} 0 ${ex} ${ey} Z`} className={styles.sector} />
        ))}
      {showArc &&
        (full ? (
          <circle r={R} className={styles.arc} />
        ) : (
          <path d={`M${R} 0 A${R} ${R} 0 ${large} 0 ${ex} ${ey}`} className={styles.arc} />
        ))}
      {t > 0 && !full && (
        <path d={`M0.2 0 A0.2 0.2 0 ${large} 0 ${mx} ${my}`} className={styles.angle} />
      )}
      <line x1="0" y1="0" x2={R} y2="0" className={styles.radius} />
      {t > 0 && <line x1="0" y1="0" x2={ex} y2={ey} className={styles.radius} />}

      <text x="0.5" y="0.16" className={styles.label}>
        r = {radius} {unit}
      </text>
      {t > 0 && (
        <text x={tx} y={ty} className={`${styles.label} ${styles.angleText}`}>
          {Math.round(t)}°
        </text>
      )}
      {showArc && (
        <text x={lx} y={ly} className={`${styles.label} ${styles.arcText}`}>
          busur
        </text>
      )}
      {showSector && (
        <text x={sx} y={sy} className={`${styles.label} ${styles.sectorText}`}>
          juring
        </text>
      )}
    </svg>
  );
}
