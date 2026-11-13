// Rumus busur & juring — padanan JS dari backend/app/engine/circle.py.
// Kedua engine diuji dengan konten yang sama (content/problems.json) agar hasilnya identik.

/** @typedef {'22/7' | '3.14'} PiMode */

const PI_VALUES = { '22/7': 22 / 7, '3.14': 3.14 };

/**
 * Bulatkan 2 desimal, setengah ke atas (cara sekolah). Memakai notasi eksponen string
 * agar sama dengan Decimal(repr(x)) di Python: 14.665 -> 14.67, 6.280000000000001 -> 6.28.
 * @param {number} x
 */
export function round2(x) {
  if (x < 0) return -round2(-x);
  return Number(`${Math.round(Number(`${x}e2`))}e-2`);
}

function isMultipleOf7(x) {
  const q = x / 7;
  return Math.abs(q - Math.round(q)) < 1e-9 && Math.round(q) !== 0;
}

/** 22/7 bila jari-jari atau diameter kelipatan 7, selain itu 3,14. @returns {PiMode} */
export function pickPi(r) {
  return isMultipleOf7(r) || isMultipleOf7(2 * r) ? '22/7' : '3.14';
}

/** @param {PiMode | undefined | null} mode @param {number} [r] */
export function piValue(mode, r) {
  const m = mode ?? (r === undefined ? undefined : pickPi(r));
  if (!m || !(m in PI_VALUES)) throw new Error(`mode pi tidak dikenal: ${m}`);
  return PI_VALUES[m];
}

function checkR(r) {
  if (!(r > 0)) throw new Error('jari-jari harus positif');
}

function checkTheta(theta) {
  if (!(theta >= 0 && theta <= 360)) throw new Error('sudut pusat harus 0–360°');
}

export function fraction(theta) {
  checkTheta(theta);
  return theta / 360;
}

function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b);
}

/** Pecahan sudut paling sederhana: 90 -> "1/4", 360 -> "1", 0 -> "0". */
export function fractionLabel(theta) {
  checkTheta(theta);
  const t = Math.round(theta);
  if (t === 0) return '0';
  const g = gcd(t, 360);
  const num = t / g;
  const den = 360 / g;
  return den === 1 ? String(num) : `${num}/${den}`;
}

export function circumference(r, pi) {
  checkR(r);
  return 2 * piValue(pi, r) * r;
}

export function circleArea(r, pi) {
  checkR(r);
  return piValue(pi, r) * r * r;
}

export const arcLength = (r, theta, pi) => fraction(theta) * circumference(r, pi);
export const sectorArea = (r, theta, pi) => fraction(theta) * circleArea(r, pi);
export const sectorPerimeter = (r, theta, pi) => 2 * r + arcLength(r, theta, pi);
export const thetaFromArc = (arc, r, pi) => (arc / circumference(r, pi)) * 360;
export const thetaFromArea = (area, r, pi) => (area / circleArea(r, pi)) * 360;

export function radiusFromArc(arc, theta, pi = '22/7') {
  if (!(theta > 0)) throw new Error('sudut pusat harus > 0');
  return arc / (fraction(theta) * 2 * piValue(pi));
}

export function radiusFromArea(area, theta, pi = '22/7') {
  if (!(theta > 0)) throw new Error('sudut pusat harus > 0');
  return Math.sqrt(area / (fraction(theta) * piValue(pi)));
}

/** Kunci jawaban dari field `model` + `asked` sebuah soal. */
export function solve(problem) {
  const { model: m, pi, asked } = problem;
  const mult = m.multiplier ?? 1;
  let value;
  switch (asked) {
    case 'arcLength':
      value = arcLength(m.r, m.theta, pi);
      break;
    case 'sectorArea':
      value = sectorArea(m.r, m.theta, pi);
      break;
    case 'sectorPerimeter':
      value = sectorPerimeter(m.r, m.theta, pi);
      break;
    case 'theta':
      value = 'arc' in m ? thetaFromArc(m.arc, m.r, pi) : thetaFromArea(m.area, m.r, pi);
      break;
    case 'radius':
      value = 'arc' in m ? radiusFromArc(m.arc, m.theta, pi) : radiusFromArea(m.area, m.theta, pi);
      break;
    case 'compareSectorArea': {
      const a = round2(sectorArea(m.a.r, m.a.theta, pi));
      const b = round2(sectorArea(m.b.r, m.b.theta, pi));
      return a > b ? 'A' : b > a ? 'B' : 'Sama';
    }
    case 'evaluateClaim':
      if (m.claim !== 'arcEqualsDiameter') throw new Error(`klaim tidak dikenal: ${m.claim}`);
      return Math.abs(arcLength(m.r, m.theta, pi) - 2 * m.r) < 1e-9 ? 'ya' : 'tidak';
    default:
      throw new Error(`jenis pertanyaan tidak dikenal: ${asked}`);
  }
  return round2(value * mult);
}

/** Jawaban 'ya'/'tidak' bagian keputusan soal literasi, atau null. */
export function solveDecision(problem) {
  const d = problem.decision;
  if (!d) return null;
  const v = solve(problem);
  const ok = d.rule === '>=' ? v >= d.threshold : v <= d.threshold;
  return ok ? 'ya' : 'tidak';
}
