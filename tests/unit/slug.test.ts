import { describe, expect, it } from 'vitest';
import { isValidRecipeId, slugify, stripDiacritics, uniqueSlug } from '../../src/lib/slug';

describe('stripDiacritics', () => {
  it('removes Czech diacritics', () => {
    expect(stripDiacritics('Příliš žluťoučký kůň úpěl ďábelské ódy')).toBe(
      'Prilis zlutoucky kun upel dabelske ody',
    );
  });
});

describe('slugify', () => {
  it('lowercases and strips diacritics', () => {
    expect(slugify('Svíčková na smetaně')).toBe('svickova-na-smetane');
  });

  it('collapses punctuation runs into a single dash', () => {
    expect(slugify('Omáčka: základní (2×)')).toBe('omacka-zakladni-2');
    expect(slugify('Hlavní chody - čínské')).toBe('hlavni-chody-cinske');
    expect(slugify('Pizza / calzone')).toBe('pizza-calzone');
  });

  it('trims leading and trailing dashes', () => {
    expect(slugify('  -- Pho Bo! --  ')).toBe('pho-bo');
  });

  it('throws when nothing usable remains', () => {
    expect(() => slugify('')).toThrow();
    expect(() => slugify('?!–')).toThrow();
  });

  it('suffixes Windows reserved names', () => {
    expect(slugify('Con')).toBe('con-recept');
    expect(slugify('NUL')).toBe('nul-recept');
    expect(slugify('COM1')).toBe('com1-recept');
    expect(slugify('LPT9')).toBe('lpt9-recept');
    expect(slugify('Console')).toBe('console');
  });

  it('only ever emits [a-z0-9-]', () => {
    for (const t of ['Šakšuka', 'Kaša', 'Kung Pao', 'Beef stew „Ragusae"', 'Chleba & kvásek']) {
      expect(slugify(t)).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });
});

describe('uniqueSlug', () => {
  it('returns base when free', () => {
    expect(uniqueSlug('cheesecake', new Set())).toBe('cheesecake');
  });

  it('adds -2 on first collision', () => {
    expect(uniqueSlug('cheesecake', new Set(['cheesecake']))).toBe('cheesecake-2');
  });

  it('skips suffixes that are already taken', () => {
    expect(uniqueSlug('cheesecake', new Set(['cheesecake', 'cheesecake-2', 'cheesecake-3']))).toBe(
      'cheesecake-4',
    );
  });
});

describe('isValidRecipeId', () => {
  it('accepts the plain slug', () => {
    expect(isValidRecipeId('svickova', 'Svíčková')).toBe(true);
  });

  it('accepts collision suffixes from 2 up', () => {
    expect(isValidRecipeId('svickova-2', 'Svíčková')).toBe(true);
    expect(isValidRecipeId('svickova-12', 'Svíčková')).toBe(true);
  });

  it('rejects -1, -0, leading zeros and foreign slugs', () => {
    expect(isValidRecipeId('svickova-1', 'Svíčková')).toBe(false);
    expect(isValidRecipeId('svickova-02', 'Svíčková')).toBe(false);
    expect(isValidRecipeId('gulas', 'Svíčková')).toBe(false);
  });

  it('treats a trailing number in the title as part of the base', () => {
    expect(isValidRecipeId('buchty-2', 'Buchty 2')).toBe(true);
  });
});
