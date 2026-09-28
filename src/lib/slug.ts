const RESERVED = new Set([
  'con',
  'prn',
  'aux',
  'nul',
  ...Array.from({ length: 9 }, (_, i) => `com${i + 1}`),
  ...Array.from({ length: 9 }, (_, i) => `lpt${i + 1}`),
]);

export function stripDiacritics(s: string): string {
  return s.normalize('NFD').replace(/\p{M}/gu, '');
}

export function slugify(title: string): string {
  const slug = stripDiacritics(title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (!slug) throw new Error(`Z názvu nejde vytvořit slug: "${title}"`);
  return RESERVED.has(slug) ? `${slug}-recept` : slug;
}

export function uniqueSlug(base: string, taken: ReadonlySet<string>): string {
  if (!taken.has(base)) return base;
  for (let n = 2; ; n++) {
    const candidate = `${base}-${n}`;
    if (!taken.has(candidate)) return candidate;
  }
}

/** Soubor receptu se musí jmenovat slugify(title) nebo slugify(title)-N, N >= 2. */
export function isValidRecipeId(id: string, title: string): boolean {
  const base = slugify(title);
  if (id === base) return true;
  if (!id.startsWith(`${base}-`)) return false;
  const suffix = id.slice(base.length + 1);
  return /^[1-9]\d*$/.test(suffix) && Number(suffix) >= 2;
}
