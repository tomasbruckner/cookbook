export interface YouTubeVideo {
  id: string;
  /** Začátek přehrávání v sekundách. */
  start?: number;
}

const HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be']);
const ID = /^[A-Za-z0-9_-]{11}$/;

/** `297`, `2s`, `1m30s`, `1h2m3s` → sekundy; cokoli jiného → undefined. */
function parseTime(value: string | null): number | undefined {
  if (!value) return undefined;
  if (/^\d+$/.test(value)) return Number(value);
  const m = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(value);
  if (!m || !(m[1] || m[2] || m[3])) return undefined;
  return Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0);
}

export function parseYouTubeUrl(url: string): YouTubeVideo | null {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  if (!HOSTS.has(u.hostname)) return null;

  let id: string | null = null;
  if (u.hostname === 'youtu.be') {
    id = u.pathname.slice(1);
  } else if (u.pathname === '/watch') {
    id = u.searchParams.get('v');
  } else if (u.pathname.startsWith('/shorts/')) {
    id = u.pathname.slice('/shorts/'.length);
  }
  if (!id || !ID.test(id)) return null;

  const start = parseTime(u.searchParams.get('t') ?? u.searchParams.get('start'));
  return start === undefined ? { id } : { id, start };
}
