import { describe, expect, it } from 'vitest';
import { matches, normalize, tokenize, type SearchEntry } from '../../src/lib/search';

const svickova: SearchEntry = {
  slug: 'svickova',
  title: 'Svíčková',
  category: 'hlavni-chody',
  tags: ['klasika'],
  text: 'hovězí falešná svíčková, housky, máslo, knedlík',
};

describe('normalize', () => {
  it('lowercases and strips diacritics', () => {
    expect(normalize('ŠAKŠUKA Ďábel')).toBe('saksuka dabel');
  });
});

describe('tokenize', () => {
  it('splits on any whitespace and drops empties', () => {
    expect(tokenize('  SVÍČKOVÁ \t knedlík ')).toEqual(['svickova', 'knedlik']);
  });
  it('returns [] for whitespace-only query', () => {
    expect(tokenize('   ')).toEqual([]);
  });
});

describe('matches', () => {
  it('matches without diacritics', () => {
    expect(matches(svickova, 'svickova')).toBe(true);
  });
  it('matches uppercase with diacritics and extra spaces', () => {
    expect(matches(svickova, '  SVÍČKOVÁ   knedlík ')).toBe(true);
  });
  it('matches ingredients text', () => {
    expect(matches(svickova, 'maslo')).toBe(true);
  });
  it('matches tags', () => {
    expect(matches(svickova, 'klasik')).toBe(true);
  });
  it('requires all words (AND)', () => {
    expect(matches(svickova, 'svickova cokolada')).toBe(false);
  });
  it('matches everything for an empty or whitespace-only query', () => {
    expect(matches(svickova, '')).toBe(true);
    expect(matches(svickova, '   ')).toBe(true);
  });
  it('does not match unrelated words', () => {
    expect(matches(svickova, 'krevety')).toBe(false);
  });
});
