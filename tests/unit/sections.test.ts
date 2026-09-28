import { describe, expect, it } from 'vitest';
import { splitIngredients, type IngredientSplit } from '../../src/lib/sections';

const join = (s: IngredientSplit) => s.before + (s.ingredients ?? '') + s.after;

describe('splitIngredients', () => {
  it('splits intro, ingredients and the rest', () => {
    const body = 'Odkaz\n\n## Ingredience\n\n* mouka\n\n## Postup\n\n1. upeč\n';
    const s = splitIngredients(body);
    expect(s.before).toBe('Odkaz\n\n');
    expect(s.ingredients).toBe('## Ingredience\n\n* mouka\n\n');
    expect(s.after).toBe('## Postup\n\n1. upeč\n');
    expect(join(s)).toBe(body);
  });

  it('runs to the end when ingredients are the last section', () => {
    const body = '## Ingredience\n\n* vejce\n* mléko\n';
    const s = splitIngredients(body);
    expect(s.before).toBe('');
    expect(s.ingredients).toBe(body);
    expect(s.after).toBe('');
  });

  it('returns null ingredients and the whole body as before when missing', () => {
    const body = '## Postup\n\n* nasekám česnek\n';
    expect(splitIngredients(body)).toEqual({ before: body, ingredients: null, after: '' });
  });

  it('keeps ### subheadings inside the section', () => {
    const body = '## Ingredience\n\n### Svíčková\n\n* maso\n\n### Knedlík\n\n* housky\n\n## Postup\n\nx\n';
    const s = splitIngredients(body);
    expect(s.ingredients).toContain('### Knedlík');
    expect(s.after.startsWith('## Postup')).toBe(true);
  });

  it('matches the heading case-insensitively with surrounding spaces and closing hashes', () => {
    expect(splitIngredients('##   INGREDIENCE  ##\n* a\n').ingredients).not.toBeNull();
  });

  it('does not match other headings starting with Ingredience', () => {
    expect(splitIngredients('## Ingredience (4 porce)\n* a\n').ingredients).toBeNull();
    expect(splitIngredients('### Ingredience\n* a\n').ingredients).toBeNull();
  });

  it('puts a second Ingredience heading into after', () => {
    const body = '## Ingredience\n* a\n## Ingredience\n* b\n';
    const s = splitIngredients(body);
    expect(s.ingredients).toBe('## Ingredience\n* a\n');
    expect(s.after).toBe('## Ingredience\n* b\n');
  });

  it('ignores headings inside fenced code blocks', () => {
    const body = '## Ingredience\n* a\n```\n## Postup\n```\n* b\n## Postup\nx\n';
    const s = splitIngredients(body);
    expect(s.ingredients).toBe('## Ingredience\n* a\n```\n## Postup\n```\n* b\n');
    expect(s.after).toBe('## Postup\nx\n');
  });

  it('works with CRLF line endings and preserves them', () => {
    const body = 'Úvod\r\n## Ingredience\r\n* a\r\n## Postup\r\nx\r\n';
    const s = splitIngredients(body);
    expect(s.before).toBe('Úvod\r\n');
    expect(s.ingredients).toBe('## Ingredience\r\n* a\r\n');
    expect(join(s)).toBe(body);
  });

  it('handles an empty body', () => {
    expect(splitIngredients('')).toEqual({ before: '', ingredients: null, after: '' });
  });
});
