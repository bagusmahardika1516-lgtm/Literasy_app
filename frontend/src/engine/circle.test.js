import { describe, expect, it } from 'vitest';
import * as c from './circle.js';

// Tabel kasus yang sama dengan backend/tests/test_circle.py (testing.md §2.1)
const TABLE = [
  [c.arcLength, [14, 90, '22/7'], 22],
  [c.sectorArea, [14, 90, '22/7'], 154],
  [c.arcLength, [7, 90, '22/7'], 11],
  [c.sectorArea, [7, 90, '22/7'], 38.5],
  [c.arcLength, [21, 60, '22/7'], 22],
  [c.sectorArea, [21, 60, '22/7'], 231],
  [c.arcLength, [10, 36, '3.14'], 6.28],
  [c.sectorArea, [10, 180, '3.14'], 157],
  [c.sectorArea, [10, 72, '3.14'], 62.8],
  [c.arcLength, [7, 120, '22/7'], 14.67],
  [c.sectorPerimeter, [14, 90, '22/7'], 50],
  [c.thetaFromArc, [22, 14, '22/7'], 90],
  [c.radiusFromArea, [77, 45, '22/7'], 14],
  [c.radiusFromArc, [44, 120, '22/7'], 21],
];

describe('rumus', () => {
  it.each(TABLE)('%o(%o) = %o', (fn, args, expected) => {
    expect(c.round2(fn(...args))).toBe(expected);
  });

  it.each([
    [14, '22/7'],
    [7, '22/7'],
    [10, '3.14'],
    [10.5, '22/7'],
    [3.5, '22/7'],
    [5, '3.14'],
  ])('pickPi(%s) = %s', (r, mode) => expect(c.pickPi(r)).toBe(mode));

  it('memilih pi otomatis bila mode kosong', () => {
    expect(c.round2(c.arcLength(14, 90))).toBe(22);
    expect(c.round2(c.sectorArea(10, 180))).toBe(157);
  });

  it('batas nilai', () => {
    expect(c.arcLength(7, 0)).toBe(0);
    expect(c.round2(c.arcLength(7, 360))).toBe(c.round2(c.circumference(7)));
    expect(() => c.arcLength(0, 90)).toThrow();
    expect(() => c.sectorArea(7, 400)).toThrow();
    expect(() => c.radiusFromArc(10, 0)).toThrow();
  });

  it.each([
    [90, '1/4'],
    [60, '1/6'],
    [45, '1/8'],
    [120, '1/3'],
    [270, '3/4'],
    [360, '1'],
    [0, '0'],
    [100, '5/18'],
  ])('fractionLabel(%s) = %s', (t, label) => expect(c.fractionLabel(t)).toBe(label));

  it.each([
    [14.666666, 14.67],
    [2.4444, 2.44],
    [6.280000000000001, 6.28],
    [0.125, 0.13],
    [14.665, 14.67],
    [57.75, 57.75],
  ])('round2(%s) = %s', (x, y) => expect(c.round2(x)).toBe(y));
});
