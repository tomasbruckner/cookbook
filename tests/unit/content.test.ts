import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';
import { CATEGORY_KEYS } from '../../src/consts';
import { isValidRecipeId } from '../../src/lib/slug';

const DIR = fileURLToPath(new URL('../../src/content/recipes/', import.meta.url));
const files = readdirSync(DIR).filter((f) => f.endsWith('.md'));

function frontmatter(source: string): Record<string, unknown> {
  const m = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!m) throw new Error('chybí frontmatter');
  return parse(m[1]) as Record<string, unknown>;
}

describe('recipe files', () => {
  it('there is at least one recipe', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files)('%s has a known category and a filename derived from its title', (file) => {
    const data = frontmatter(readFileSync(DIR + file, 'utf8'));
    expect(typeof data.title).toBe('string');
    expect(CATEGORY_KEYS).toContain(data.category);
    expect(isValidRecipeId(file.replace(/\.md$/, ''), data.title as string)).toBe(true);
  });
});

describe('frontmatter parser', () => {
  it('handles CRLF files', () => {
    expect(frontmatter('---\r\ntitle: A\r\ncategory: ostatni\r\n---\r\nbody')).toEqual({
      title: 'A',
      category: 'ostatni',
    });
  });
});
