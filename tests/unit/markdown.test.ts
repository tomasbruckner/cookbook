import { describe, expect, it } from 'vitest';
import { renderMarkdown } from '../../src/lib/markdown';

const YT = 'https://www.youtube.com/watch?v=tBTNMo77h2Q';

describe('renderMarkdown', () => {
  it('renders a paragraph with only a YouTube link as a click-to-load player', () => {
    const html = renderMarkdown(`[${YT}](${YT})\n`);
    expect(html).toContain('data-youtube-id="tBTNMo77h2Q"');
    expect(html).toContain('src="https://i.ytimg.com/vi/tBTNMo77h2Q/hqdefault.jpg"');
    expect(html).toContain('loading="lazy"');
    expect(html).toContain(`href="${YT}"`);
    expect(html).toContain('Otevřít v YouTube');
    expect(html).not.toContain('<iframe');
    expect(html).not.toContain('data-start');
  });

  it('keeps the start time', () => {
    const url = 'https://youtu.be/z-AI4ZalbR4?t=297';
    expect(renderMarkdown(`[${url}](${url})`)).toContain('data-start="297"');
  });

  it('escapes the original URL in attributes', () => {
    const url = 'https://www.youtube.com/watch?v=AAkotB7wyUg&t=2s';
    const html = renderMarkdown(`[${url}](${url})`);
    expect(html).toContain('href="https://www.youtube.com/watch?v=AAkotB7wyUg&amp;t=2s"');
    expect(html).toContain('data-start="2"');
  });

  it('splits a link-only paragraph with hard breaks: video player plus plain link', () => {
    const site = 'https://natashaskitchen.com/blueberry-muffins-with-lemon-glaze/';
    const html = renderMarkdown(`[${YT}](${YT})  \n[${site}](${site})\n`);
    expect(html.match(/data-youtube-id=/g)).toHaveLength(1);
    expect(html).toContain(`<p><a href="${site}">${site}</a></p>`);
  });

  it('renders two YouTube links in one paragraph as two players', () => {
    const other = 'https://www.youtube.com/watch?v=SIee8PWWSbI';
    const html = renderMarkdown(`[${YT}](${YT})  \n[${other}](${other})`);
    expect(html.match(/data-youtube-id=/g)).toHaveLength(2);
  });

  it('leaves a YouTube link inside a sentence as a normal link', () => {
    const html = renderMarkdown(`Viz [video](${YT}) pro postup.`);
    expect(html).not.toContain('data-youtube-id');
    expect(html).toContain(`<a href="${YT}">video</a>`);
  });

  it('leaves a paragraph with only a non-YouTube link unchanged', () => {
    const site = 'https://angiebakes.com/2014/06/19/malinove-brownies/';
    expect(renderMarkdown(`[${site}](${site})`)).toBe(`<p><a href="${site}">${site}</a></p>\n`);
  });

  it('renders ordinary markdown as before', () => {
    const html = renderMarkdown('## Ingredience\n\n* 2 vejce\n');
    expect(html).toContain('<h2>Ingredience</h2>');
    expect(html).toContain('<li>2 vejce</li>');
  });
});
