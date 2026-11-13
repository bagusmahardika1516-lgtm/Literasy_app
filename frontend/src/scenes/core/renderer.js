// Satu WebGLRenderer dipakai bergantian oleh semua scene (hemat memori, architecture.md §6).
import { WebGLRenderer } from 'three';

let renderer = null;
let owner = null;

/** Pasang renderer bersama ke `container`. Scene sebelumnya otomatis kehilangan kanvas. */
export function acquireRenderer(container) {
  if (!renderer) {
    renderer = new WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.touchAction = 'none';
  }
  container.appendChild(renderer.domElement);
  owner = container;
  return renderer;
}

/** Lepas kanvas dari `container` bila masih dipegangnya. Renderer tetap hidup untuk scene berikutnya. */
export function releaseRenderer(container) {
  if (renderer && owner === container) {
    renderer.domElement.remove();
    renderer.renderLists.dispose();
    owner = null;
  }
}
