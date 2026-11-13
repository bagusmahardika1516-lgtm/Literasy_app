// Pembungkus React: memilih scene Three.js (dimuat terpisah) atau fallback SVG.
import { useEffect, useRef, useState } from 'react';
import { webglSupport } from './core/webgl.js';
import styles from './SceneView.module.css';
import SvgSector from './svg/SvgSector.jsx';

/**
 * @param {{ angle: number, radius: number, highlight?: 'arc'|'sector'|'both'|'none', topView?: boolean,
 *   unit?: string, resetKey?: number, onFallback?: () => void }} props
 */
export default function SceneView({ angle, radius, highlight = 'both', topView = false, unit = 'cm', resetKey = 0, onFallback }) {
  const boxRef = useRef(null);
  const handleRef = useRef(null);
  const [use3d, setUse3d] = useState(() => webglSupport());
  const latest = useRef({ angle, radius, highlight, topView, unit });
  latest.current = { angle, radius, highlight, topView, unit };
  // Simpan callback di ref agar fungsi baru dari induk tidak membangun ulang scene.
  const onFallbackRef = useRef(onFallback);
  onFallbackRef.current = onFallback;

  // Buat scene sekali; Three.js diimpor dinamis agar tidak masuk unduhan awal.
  useEffect(() => {
    if (!use3d) return undefined;
    let cancelled = false;
    import('./CircleSectorScene.js')
      .then(({ createSectorScene }) => {
        if (cancelled || !boxRef.current) return;
        handleRef.current = createSectorScene(boxRef.current, latest.current);
      })
      .catch(() => {
        if (!cancelled) setUse3d(false);
      });
    return () => {
      cancelled = true;
      handleRef.current?.dispose();
      handleRef.current = null;
    };
  }, [use3d]);

  useEffect(() => handleRef.current?.setAngle(angle), [angle]);
  useEffect(() => handleRef.current?.setRadius(radius), [radius]);
  useEffect(() => handleRef.current?.setHighlight(highlight), [highlight]);
  useEffect(() => handleRef.current?.setTopView(topView), [topView]);
  useEffect(() => {
    if (resetKey) handleRef.current?.resetCamera();
  }, [resetKey]);

  useEffect(() => {
    if (!use3d) onFallbackRef.current?.();
  }, [use3d]);

  return (
    <div className={styles.box} ref={boxRef}>
      {!use3d && <SvgSector angle={angle} radius={radius} highlight={highlight} unit={unit} />}
    </div>
  );
}
