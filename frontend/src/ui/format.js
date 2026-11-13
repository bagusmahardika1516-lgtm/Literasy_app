/** Format angka gaya Indonesia: 7,33 · 1.250.000 (glossary.md §3). */
export function formatNumber(x) {
  return x.toLocaleString('id-ID', { maximumFractionDigits: 2 });
}

/** Isi template "{nama}" dari content/*.json. */
export function fill(template, vars) {
  return template.replace(/\{(\w+)\}/g, (m, key) => (key in vars ? String(vars[key]) : m));
}
