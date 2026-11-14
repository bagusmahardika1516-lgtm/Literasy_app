/** Format angka gaya Indonesia: 7,33 · 1.250.000 (glossary.md §3). */
export function formatNumber(x) {
  return x.toLocaleString('id-ID', { maximumFractionDigits: 2 });
}

/** Isi template "{nama}" dari content/*.json. */
export function fill(template, vars) {
  return template.replace(/\{(\w+)\}/g, (m, key) => (key in vars ? String(vars[key]) : m));
}

/** 252000 ms → "4 mnt 12 dtk". */
export function formatDuration(ms) {
  if (!Number.isFinite(ms) || ms < 0) return '–';
  const total = Math.round(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  if (m === 0) return `${s} dtk`;
  return s === 0 ? `${m} mnt` : `${m} mnt ${s} dtk`;
}

/** Skor 14 dari 24 → "14/24" (koma desimal untuk skor parsial). */
export const formatScore = (score, max) => `${formatNumber(score)}/${formatNumber(max)}`;
