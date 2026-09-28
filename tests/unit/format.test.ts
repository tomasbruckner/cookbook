import { describe, expect, it } from 'vitest';
import { formatMinutes, formatServings } from '../../src/lib/format';

describe('formatMinutes', () => {
  it.each([
    [5, '5 min'],
    [45, '45 min'],
    [60, '1 h'],
    [90, '1 h 30 min'],
    [180, '3 h'],
  ])('%i → %s', (min, expected) => {
    expect(formatMinutes(min)).toBe(expected);
  });
});

describe('formatServings', () => {
  it.each([
    [1, '1 porce'],
    [2, '2 porce'],
    [4, '4 porce'],
    [5, '5 porcí'],
    [8, '8 porcí'],
  ])('%i → %s', (n, expected) => {
    expect(formatServings(n)).toBe(expected);
  });
});
