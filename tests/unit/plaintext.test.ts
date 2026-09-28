import { describe, expect, it } from 'vitest';
import { markdownToText } from '../../src/lib/plaintext';

describe('markdownToText', () => {
  it('strips headings, list markers and emphasis', () => {
    const md = '## Ingredience\n\n### Knedlík\n\n* 400 g **staršího** pečiva  \n1. _sůl_\n';
    expect(markdownToText(md)).toBe('Ingredience Knedlík 400 g staršího pečiva sůl');
  });

  it('keeps link text and drops URLs', () => {
    expect(markdownToText('kouřová omáčka \\- link [zde](https://example.com/x)')).toBe(
      'kouřová omáčka - link zde',
    );
  });

  it('unescapes Markdown escapes', () => {
    expect(markdownToText('p-LY9b1u\\_io \\& 1\\. vejce')).toBe('p-LY9b1u_io & 1. vejce');
  });

  it('collapses whitespace including CRLF', () => {
    expect(markdownToText('a\r\n\r\n  b\tc')).toBe('a b c');
  });
});
