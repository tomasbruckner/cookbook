import { Marked, type Tokens } from 'marked';
import { parseYouTubeUrl, type YouTubeVideo } from './youtube';

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function youTubePlayer(video: YouTubeVideo, url: string): string {
  const href = escapeAttr(url);
  const start = video.start === undefined ? '' : ` data-start="${video.start}"`;
  return (
    `<figure class="not-prose my-6 max-w-xl" data-youtube-id="${video.id}"${start}>` +
    `<a class="yt-thumb group relative block aspect-video overflow-hidden rounded-lg bg-black" href="${href}" aria-label="Přehrát video">` +
    `<img src="https://i.ytimg.com/vi/${video.id}/hqdefault.jpg" alt="" loading="lazy" class="h-full w-full object-cover" />` +
    `<span aria-hidden="true" class="absolute inset-0 m-auto flex h-14 w-20 items-center justify-center rounded-xl bg-red-600 text-2xl text-white group-hover:bg-red-700">▶</span>` +
    `</a>` +
    `<figcaption class="mt-2 text-sm"><a href="${href}" class="text-[var(--color-accent)] underline">Otevřít v YouTube</a></figcaption>` +
    `</figure>\n`
  );
}

const isBlank = (t: Tokens.Generic) => t.type === 'br' || (t.type === 'text' && t.raw.trim() === '');

const marked = new Marked({
  renderer: {
    // Odstavec složený jen z odkazů: YouTube odkazy → přehrávač, ostatní → odkaz na vlastním řádku.
    paragraph(token) {
      const inline = token.tokens.filter((t) => !isBlank(t));
      if (inline.length === 0 || !inline.every((t) => t.type === 'link')) return false;
      const links = inline as Tokens.Link[];
      if (!links.some((l) => parseYouTubeUrl(l.href))) return false;
      return links
        .map((link) => {
          const video = parseYouTubeUrl(link.href);
          return video ? youTubePlayer(video, link.href) : `<p>${this.parser.parseInline([link])}</p>\n`;
        })
        .join('');
    },
  },
});

export function renderMarkdown(md: string): string {
  return marked.parse(md, { async: false }) as string;
}
