import { stripDiacritics } from './slug';

export interface SearchEntry {
  slug: string;
  title: string;
  category: string;
  tags: string[];
  text: string;
}

export function normalize(s: string): string {
  return stripDiacritics(s).toLowerCase();
}

export function tokenize(query: string): string[] {
  return normalize(query).split(/\s+/).filter(Boolean);
}

export function matches(entry: SearchEntry, query: string): boolean {
  const tokens = tokenize(query);
  if (tokens.length === 0) return true;
  const haystack = normalize([entry.title, ...entry.tags, entry.text].join(' '));
  return tokens.every((t) => haystack.includes(t));
}
