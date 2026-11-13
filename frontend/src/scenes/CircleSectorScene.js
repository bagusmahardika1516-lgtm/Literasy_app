// Scene 3D lingkaran: cakram, juring (biru), busur (oranye), sudut pusat (hijau) — design.md §6.2, F01/F06.
// Render-on-demand: tidak ada loop animasi permanen (agents.md §4).
import {
  Curve,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  RingGeometry,
  Scene,
  Shape,
  TubeGeometry,
  Vector3,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DObject, CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { disposeObject } from './core/dispose.js';
import { acquireRenderer, releaseRenderer } from './core/renderer.js';
import { readToken } from './core/webgl.js';

const DEG = Math.PI / 180;
const DISC_DEPTH = 0.06;
const SECTOR_DEPTH = 0.1;
// Kamera lebih tinggi (±50°) agar juring tidak terlalu gepeng dan label tidak saling menumpuk
const CAM_DEFAULT = new Vector3(0, 2.0, 1.55);
const CAM_TOP = new Vector3(0, 2.6, 0.001);

/** Kurva busur pada bidang XY dengan radius 1. */
class ArcCurve3 extends Curve {
  constructor(thetaRad, z) {
    super();
    this.thetaRad = thetaRad;
    this.z = z;
  }

  getPoint(u, target = new Vector3()) {
    const a = u * this.thetaRad;
    return target.set(Math.cos(a), Math.sin(a), this.z);
  }
}

function sectorShape(thetaRad) {
  const s = new Shape();
  if (thetaRad >= 2 * Math.PI - 1e-6) {
    s.absarc(0, 0, 1, 0, 2 * Math.PI, false);
    return s;
  }
  s.moveTo(0, 0);
  s.lineTo(1, 0);
  s.absarc(0, 0, 1, 0, thetaRad, false);
  s.lineTo(0, 0);
  return s;
}

function makeLabel(text, colorVar) {
  const el = document.createElement('div');
  el.textContent = text;
  el.style.cssText = `font: 600 13px var(--font); line-height: 1.2; color: var(${colorVar}); background: var(--c-surface);
    padding: 2px 6px; border-radius: 6px; white-space: nowrap; pointer-events: none;`;
  return new CSS2DObject(el);
}

/**
 * @param {HTMLElement} el wadah (position: relative)
 * @param {{ radius: number, angle: number, highlight?: 'arc'|'sector'|'both'|'none', unit?: string,
 *   radiusMax?: number, topView?: boolean }} opts
 * @returns {import('./sceneHandle.js').SceneHandle}
 */
export function createSectorScene(el, opts) {
  const state = { highlight: 'both', unit: 'cm', radiusMax: 28, topView: false, ...opts };
  const colors = {
    arc: readToken('--c-arc'),
    sector: readToken('--c-sector'),
    angle: readToken('--c-angle'),
    ink: readToken('--c-ink'),
    disc: readToken('--c-disc'),
  };

  const renderer = acquireRenderer(el);
  const labels = new CSS2DRenderer();
  labels.domElement.style.cssText = 'position:absolute; inset:0; pointer-events:none;';
  el.appendChild(labels.domElement);

  const scene = new Scene();
  scene.add(new HemisphereLight(0xffffff, 0x888888, 2.2));
  const sun = new DirectionalLight(0xffffff, 1.2);
  sun.position.set(2, 4, 3);
  scene.add(sun);

  const camera = new PerspectiveCamera(40, 1, 0.1, 50);
  camera.position.copy(state.topView ? CAM_TOP : CAM_DEFAULT);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enablePan = false;
  controls.minDistance = 1.6;
  controls.maxDistance = 6;
  controls.maxPolarAngle = Math.PI / 2.1;

  // Semua objek dibangun di bidang XY lalu direbahkan; sumbu z lokal = "ke atas".
  const group = new Group();
  group.rotation.x = -Math.PI / 2;
  scene.add(group);

  const discShape = new Shape();
  discShape.absarc(0, 0, 1, 0, 2 * Math.PI, false);
  const disc = new Mesh(
    new ExtrudeGeometry(discShape, { depth: DISC_DEPTH, bevelEnabled: false, curveSegments: 96 }),
    new MeshStandardMaterial({ color: colors.disc, roughness: 0.9 }),
  );
  group.add(disc);

  const sectorMat = new MeshStandardMaterial({ color: colors.sector, roughness: 0.6 });
  const arcMat = new MeshStandardMaterial({ color: colors.arc, roughness: 0.5 });
  const angleMat = new MeshBasicMaterial({ color: colors.angle, side: DoubleSide });
  const radiusMat = new MeshStandardMaterial({ color: colors.ink });

  const sector = new Mesh(undefined, sectorMat);
  const arc = new Mesh(undefined, arcMat);
  const angleMark = new Mesh(undefined, angleMat);
  angleMark.position.z = SECTOR_DEPTH + 0.005;
  const radius1 = new Mesh(new CylinderGeometry(0.015, 0.015, 1, 8), radiusMat);
  const radius2 = new Mesh(radius1.geometry, radiusMat);
  group.add(sector, arc, angleMark, radius1, radius2);

  const labelR = makeLabel('', '--c-ink');
  const labelTheta = makeLabel('', '--c-angle');
  const labelArc = makeLabel('busur', '--c-arc');
  const labelSector = makeLabel('juring', '--c-sector');
  group.add(labelR, labelTheta, labelArc, labelSector);

  let frame = 0;
  const render = () => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      renderer.render(scene, camera);
      labels.render(scene, camera);
    });
  };
  controls.addEventListener('change', render);

  function placeRadius(mesh, a) {
    mesh.position.set(Math.cos(a) / 2, Math.sin(a) / 2, SECTOR_DEPTH + 0.01);
    mesh.rotation.set(0, 0, a - Math.PI / 2);
  }

  function rebuild() {
    const t = Math.max(0, Math.min(360, state.angle)) * DEG;
    sector.geometry?.dispose();
    arc.geometry?.dispose();
    angleMark.geometry?.dispose();

    sector.geometry = new ExtrudeGeometry(sectorShape(t), { depth: SECTOR_DEPTH, bevelEnabled: false, curveSegments: 64 });
    const segments = Math.max(8, Math.ceil((64 * t) / (2 * Math.PI)));
    arc.geometry = new TubeGeometry(new ArcCurve3(t, SECTOR_DEPTH), segments, 0.035, 12, false);
    angleMark.geometry = new RingGeometry(0.16, 0.21, 32, 1, 0, Math.max(t, 1e-3));

    placeRadius(radius1, 0);
    placeRadius(radius2, t);

    const mid = t / 2;
    labelR.element.textContent = `r = ${state.radius} ${state.unit}`;
    // Label disebar di sepanjang garis tengah sudut: θ dekat pusat, juring di tengah, busur di luar lingkaran.
    // r diletakkan di bawah jari-jari pertama.
    labelR.position.set(0.55, -0.16, SECTOR_DEPTH);
    labelTheta.element.textContent = `${Math.round(state.angle)}°`;
    const thetaAt = Math.max(mid, 0.35); // sudut kecil: geser label agar tidak menimpa label r
    labelTheta.position.set(0.24 * Math.cos(thetaAt), 0.24 * Math.sin(thetaAt), SECTOR_DEPTH);
    labelSector.position.set(0.62 * Math.cos(mid), 0.62 * Math.sin(mid), SECTOR_DEPTH + 0.02);
    labelArc.position.set(1.38 * Math.cos(mid), 1.38 * Math.sin(mid), SECTOR_DEPTH);

    const visible = t > 0;
    const showArc = visible && (state.highlight === 'arc' || state.highlight === 'both');
    const showSector = visible && (state.highlight === 'sector' || state.highlight === 'both');
    arc.visible = labelArc.visible = showArc;
    sector.visible = labelSector.visible = showSector;
    labelArc.element.style.display = showArc ? '' : 'none';
    labelSector.element.style.display = showSector ? '' : 'none';
    angleMark.visible = radius2.visible = visible;

    // Jari-jari diwakili ukuran visual (0,45–1,0) agar perubahan r terlihat tanpa keluar layar.
    group.scale.setScalar(0.45 + 0.55 * Math.min(1, state.radius / state.radiusMax));
    render();
  }

  const ro = new ResizeObserver(() => {
    const w = el.clientWidth;
    const h = el.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h);
    labels.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    render();
  });
  ro.observe(el);

  const listeners = new Set();
  const emit = () => listeners.forEach((cb) => cb({ angle: state.angle, radius: state.radius }));

  rebuild();

  return {
    setAngle(deg) {
      state.angle = deg;
      rebuild();
      emit();
    },
    setRadius(r) {
      state.radius = r;
      rebuild();
      emit();
    },
    setHighlight(h) {
      state.highlight = h;
      rebuild();
    },
    setTopView(on) {
      state.topView = on;
      camera.position.copy(on ? CAM_TOP : CAM_DEFAULT);
      controls.update();
      render();
    },
    resetCamera() {
      camera.position.copy(state.topView ? CAM_TOP : CAM_DEFAULT);
      controls.target.set(0, 0, 0);
      controls.update();
      render();
    },
    onChange(cb) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    dispose() {
      if (frame) cancelAnimationFrame(frame);
      ro.disconnect();
      controls.removeEventListener('change', render);
      controls.dispose();
      disposeObject(scene);
      labels.domElement.remove();
      listeners.clear();
      releaseRenderer(el);
    },
  };
}
