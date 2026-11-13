// Utilitas kecil tanpa impor Three.js (agar bisa dipakai sebelum chunk 3D dimuat).

let cached;

/** Apakah perangkat mendukung WebGL? Hasil di-cache. */
export function webglSupport() {
  if (cached !== undefined) return cached;
  try {
    const canvas = document.createElement('canvas');
    cached = Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    cached = false;
  }
  return cached;
}

/** Baca warna token CSS, mis. readToken('--c-arc'). */
export function readToken(name, fallback = '#888888') {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

export function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}
