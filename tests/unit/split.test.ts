import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { cleanTitle, renderRaw, splitDocument } from '../../scripts/migrate/split-doc';

const fixture = readFileSync(fileURLToPath(new URL('./fixtures/export.md', import.meta.url)), 'utf8');

describe('cleanTitle', () => {
  it.each([
    ['Pancakes {#pancakes}', 'Pancakes'],
    ['**Wafle** {#wafle}', 'Wafle'],
    ['Hlavní chody \\- čínské {#hlavní-chody---čínské}', 'Hlavní chody - čínské'],
    ['Beef stew Ragusae {#beef-stew-ragusae}', 'Beef stew Ragusae'],
    ['  Dal  ', 'Dal'],
    ['', ''],
  ])('%j → %j', (raw, expected) => {
    expect(cleanTitle(raw)).toBe(expected);
  });
});

describe('splitDocument', () => {
  const result = splitDocument(fixture, 2);

  it('finds every H2 recipe with a usable title', () => {
    expect(result.recipes.map((r) => r.title)).toEqual(['Pancakes', 'Wafle', 'Kung Pao', 'Kung Pao']);
  });

  it('assigns slugs with collision suffixes', () => {
    expect(result.recipes.map((r) => r.slug)).toEqual(['pancakes', 'wafle', 'kung-pao', 'kung-pao-2']);
    expect(result.warnings.join('\n')).toContain('kung-pao-2');
  });

  it('records the enclosing H1 chapter', () => {
    expect(result.recipes.map((r) => r.chapter)).toEqual([
      'Snídaně',
      'Snídaně',
      'Hlavní chody - čínské',
      'Hlavní chody - čínské',
    ]);
  });

  it('keeps recipe bodies, including ### sections and fenced code', () => {
    const pancakes = result.recipes[0];
    expect(pancakes.body).toContain('### Ingredience');
    expect(pancakes.body).toContain('* 3pcs Egg');
    expect(pancakes.body).not.toContain('## Wafle');
    expect(result.recipes[2].body).toContain('## tohle není recept');
  });

  it('discards the table of contents and reports it', () => {
    expect(result.discarded).toContain('[Pancakes](#pancakes)');
    expect(result.recipes.some((r) => r.body.includes('[Pancakes](#pancakes)'))).toBe(false);
  });

  it('reports a heading without a usable title as an error and skips it', () => {
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('?!');
    expect(result.recipes.some((r) => r.body.includes('obsah receptu bez názvu'))).toBe(false);
  });

  it('gives identical results for CRLF input', () => {
    const crlf = splitDocument(fixture.replace(/\n/g, '\r\n'), 2);
    expect(crlf.recipes).toEqual(result.recipes);
  });

  it('rejects an invalid level', () => {
    expect(() => splitDocument(fixture, 0)).toThrow();
    expect(() => splitDocument(fixture, 7)).toThrow();
  });
});

describe('renderRaw', () => {
  it('writes title, chapter comment and body', () => {
    expect(renderRaw({ slug: 'dal', title: 'Dal', chapter: 'Hlavní chody - indická', body: 'x' })).toBe(
      '# Dal\n\n<!-- kapitola: Hlavní chody - indická -->\n\nx\n',
    );
  });

  it('omits the chapter comment when there is none', () => {
    expect(renderRaw({ slug: 'dal', title: 'Dal', chapter: null, body: 'x' })).toBe('# Dal\n\nx\n');
  });
});
