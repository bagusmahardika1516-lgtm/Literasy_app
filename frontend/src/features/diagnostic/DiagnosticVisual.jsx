import styles from './DiagnosticVisual.module.css';

const R = 65;

/**
 * Ilustrasi visual untuk butir soal prasyarat D1–D6 (F03, EL02, G5).
 * Membantu siswa mengaitkan teks dengan representasi konkret lingkaran.
 * @param {{ itemId: string }} props
 */
export default function DiagnosticVisual({ itemId }) {
  switch (itemId) {
    case 'D1':
      return (
        <div className={styles.wrapper}>
          <svg className={styles.svg} viewBox="-95 -85 190 170" role="img" aria-label="Lingkaran dengan garis dari pusat ke tepi">
            <circle cx="0" cy="0" r={R} className={styles.disc} />
            <circle cx="0" cy="0" r={R} className={styles.discOutline} />
            {/* Garis jari-jari dari pusat ke tepi */}
            <line x1="0" y1="0" x2={R} y2="0" className={styles.radiusLine} />
            <circle cx="0" cy="0" r="4" className={styles.centerDot} />
            <circle cx={R} cy="0" r="3.5" className={styles.centerDot} />
            <text x="-24" y="-10" className={styles.label}>
              Pusat (O)
            </text>
            <text x={R / 2} y="-14" className={`${styles.label} ${styles.labelArc}`}>
              Garis ?
            </text>
            <text x="0" y="74" className={styles.label}>
              (dari titik pusat ke lingkaran)
            </text>
          </svg>
        </div>
      );

    case 'D2':
      return (
        <div className={styles.wrapper}>
          <svg className={styles.svg} viewBox="-95 -85 190 170" role="img" aria-label="Lingkaran berdiameter 14 cm">
            <circle cx="0" cy="0" r={R} className={styles.disc} />
            <circle cx="0" cy="0" r={R} className={styles.discOutline} />
            {/* Garis diameter penuh */}
            <line x1={-R} y1="0" x2={R} y2="0" className={styles.fullDiameter} />
            {/* Sorot jari-jari (setengah diameter) */}
            <line x1="0" y1="0" x2={R} y2="0" className={styles.radiusLine} />
            <circle cx="0" cy="0" r="4" className={styles.centerDot} />
            {/* Panah dimensi diameter 14 cm di atas */}
            <line x1={-R} y1="-14" x2={R} y2="-14" className={styles.dimLine} />
            <line x1={-R} y1="-8" x2={-R} y2="-20" className={styles.dimLine} />
            <line x1={R} y1="-8" x2={R} y2="-20" className={styles.dimLine} />
            <text x="0" y="-24" className={styles.label}>
              diameter = 14 cm
            </text>
            <text x={R / 2} y="18" className={`${styles.label} ${styles.labelArc}`}>
              r = ? cm
            </text>
            <text x="0" y="74" className={styles.label}>
              (jari-jari adalah setengah diameter)
            </text>
          </svg>
        </div>
      );

    case 'D3':
      return (
        <div className={styles.wrapper}>
          <svg className={styles.svg} viewBox="-95 -85 190 170" role="img" aria-label="Lingkaran dengan keliling r = 7 cm">
            <circle cx="0" cy="0" r={R} className={styles.disc} />
            {/* Garis keliling melingkar bertebal warna */}
            <circle cx="0" cy="0" r={R} className={styles.perimeter} />
            <line x1="0" y1="0" x2={R} y2="0" className={styles.dimLine} />
            <circle cx="0" cy="0" r="3.5" className={styles.centerDot} />
            <text x={R / 2} y="14" className={styles.label}>
              r = 7 cm
            </text>
            <text x="0" y="-30" className={`${styles.label} ${styles.labelArc}`}>
              Keliling = ?
            </text>
            <text x="0" y="74" className={styles.label}>
              (panjang seluruh garis tepi melingkar)
            </text>
          </svg>
        </div>
      );

    case 'D4':
      return (
        <div className={styles.wrapper}>
          <svg className={styles.svg} viewBox="-95 -85 190 170" role="img" aria-label="Lingkaran dengan luas r = 7 cm">
            {/* Daerah luas terarsir penuh */}
            <circle cx="0" cy="0" r={R} className={styles.filledArea} />
            <circle cx="0" cy="0" r={R} className={styles.discOutline} />
            <line x1="0" y1="0" x2={R} y2="0" className={styles.dimLine} />
            <circle cx="0" cy="0" r="3.5" className={styles.centerDot} />
            <text x={R / 2} y="14" className={styles.label}>
              r = 7 cm
            </text>
            <text x="0" y="-18" className={`${styles.label} ${styles.labelSector}`}>
              Luas = ?
            </text>
            <text x="0" y="74" className={styles.label}>
              (seluruh daerah permukaan dalam)
            </text>
          </svg>
        </div>
      );

    case 'D5':
      return (
        <div className={styles.wrapper}>
          <svg className={styles.svg} viewBox="-95 -85 190 170" role="img" aria-label="Putaran penuh 360 derajat">
            <defs>
              <marker id="angle-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="var(--c-angle)" />
              </marker>
            </defs>
            <circle cx="0" cy="0" r={R} className={styles.disc} />
            <circle cx="0" cy="0" r={R} className={styles.discOutline} />
            <line x1="0" y1="0" x2={R} y2="0" className={styles.dimLine} />
            <circle cx="0" cy="0" r="3.5" className={styles.centerDot} />
            {/* Panah putaran 360° */}
            <path
              d="M 36 0 A 36 36 0 1 0 36 -6"
              fill="none"
              stroke="var(--c-angle)"
              strokeWidth="3.5"
              markerEnd="url(#angle-arrow)"
            />
            <text x="0" y="-18" className={`${styles.label} ${styles.labelAngle}`}>
              1 putaran = ...°
            </text>
            <text x="0" y="74" className={styles.label}>
              (memutar penuh satu lingkaran)
            </text>
          </svg>
        </div>
      );

    case 'D6':
      return (
        <div className={styles.wrapper}>
          <svg className={styles.svg} viewBox="-95 -85 190 170" role="img" aria-label="Sudut 90 derajat dalam lingkaran">
            <circle cx="0" cy="0" r={R} className={styles.disc} />
            <circle cx="0" cy="0" r={R} className={styles.discOutline} />
            {/* Pembagian 4 kuadran sama besar */}
            <line x1={-R} y1="0" x2={R} y2="0" className={styles.dimLine} />
            <line x1="0" y1={-R} x2="0" y2={R} className={styles.dimLine} />
            {/* Seperempat lingkaran (kuadran 1) terarsir */}
            <path d={`M 0 0 L ${R} 0 A ${R} ${R} 0 0 0 0 ${-R} Z`} className={styles.sectorSlice} />
            {/* Tanda siku-siku 90° */}
            <path d="M 14 0 L 14 -14 L 0 -14" className={styles.angleMarker} />
            <circle cx="0" cy="0" r="3.5" className={styles.centerDot} />
            <text x="28" y="-28" className={`${styles.label} ${styles.labelAngle}`}>
              90°
            </text>
            <text x="0" y="74" className={styles.label}>
              (berapa bagian dari 4 potong lingkaran?)
            </text>
          </svg>
        </div>
      );

    default:
      return null;
  }
}
