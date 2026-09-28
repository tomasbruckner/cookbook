import { describe, expect, it } from 'vitest';
import { CATEGORIES } from '../../src/consts';
import { collectTags, groupByCategory, sortByTitle, withTag, type RecipeLike } from '../../src/lib/recipes';

const r = (id: string, title: string, category: RecipeLike['data']['category'], tags: string[] = []): RecipeLike => ({
  id,
  data: { title, category, tags },
});

const recipes = [
  r('chleba', 'Chleba', 'ostatni', ['peceni']),
  r('cheesecake', 'Cheesecake', 'dezerty'),
  r('curry', 'Curry', 'hlavni-chody', ['japonska']),
  r('cervena-cocka', 'Červená čočka', 'hlavni-chody', ['indicka']),
  r('hovezi', 'Hovězí steaky', 'hlavni-chody'),
  r('pancakes', 'Pancakes', 'snidane', ['sladke']),
];

describe('sortByTitle', () => {
  it('uses Czech collation (C < Č, H < Ch)', () => {
    expect(sortByTitle(recipes).map((x) => x.id)).toEqual([
      'curry',
      'cervena-cocka',
      'hovezi',
      'cheesecake',
      'chleba',
      'pancakes',
    ]);
  });

  it('does not mutate the input', () => {
    const copy = [...recipes];
    sortByTitle(recipes);
    expect(recipes).toEqual(copy);
  });
});

describe('groupByCategory', () => {
  it('follows CATEGORIES order and sorts inside groups', () => {
    const groups = groupByCategory(recipes);
    expect(groups.map((g) => g.key)).toEqual(['snidane', 'hlavni-chody', 'dezerty', 'ostatni']);
    expect(groups[1].recipes.map((x) => x.id)).toEqual(['curry', 'cervena-cocka', 'hovezi']);
    expect(groups[1].label).toBe('Hlavní chody');
  });

  it('omits categories without recipes', () => {
    const keys = groupByCategory(recipes).map((g) => g.key);
    expect(keys).not.toContain('predkrmy-a-polevky');
    expect(keys).not.toContain('svaciny');
  });

  it('returns [] for no recipes', () => {
    expect(groupByCategory([])).toEqual([]);
  });
});

describe('collectTags / withTag', () => {
  it('collects unique sorted tags', () => {
    expect(collectTags([...recipes, r('x', 'X', 'ostatni', ['peceni'])])).toEqual([
      'indicka',
      'japonska',
      'peceni',
      'sladke',
    ]);
  });

  it('filters and sorts by tag', () => {
    expect(withTag(recipes, 'japonska').map((x) => x.id)).toEqual(['curry']);
    expect(withTag(recipes, 'neexistuje')).toEqual([]);
  });
});

describe('CATEGORIES', () => {
  it('has the agreed keys in the agreed order', () => {
    expect(CATEGORIES.map((c) => c.key)).toEqual([
      'snidane',
      'predkrmy-a-polevky',
      'hlavni-chody',
      'dezerty',
      'svaciny',
      'ostatni',
    ]);
  });
});
