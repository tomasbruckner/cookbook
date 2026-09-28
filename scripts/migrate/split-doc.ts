import { slugify, uniqueSlug } from '../../src/lib/slug';

export interface RawRecipe {
  slug: string;
  title: string;
  chapter: string | null;
  body: string;
}

export interface SplitResult {
  recipes: RawRecipe[];
  /** Text mimo recepty (obsah dokumentu, úvody kapitol). */
  discarded: string;
  warnings: string[];
  errors: string[];
}

const HEADING = /^ {0,3}(#{1,6})(?:[ \t]+(.*?))?(?:[ \t]+#+)?[ \t]*$/;
const FENCE = /^ {0,3}(```|~~~)/;

/** Odstraní kotvu Google Docs `{#…}`, zvýraznění a Markdown escapy. */
export function cleanTitle(raw: string): string {
  return raw
    .replace(/\s*\{#[^}]*\}\s*$/, '')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/\\(.)/g, '$1')
    .trim();
}

export function splitDocument(source: string, level: number): SplitResult {
  if (!Number.isInteger(level) || level < 1 || level > 6) {
    throw new Error(`Neplatná úroveň nadpisu: ${level}`);
  }
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  const recipes: RawRecipe[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];
  const discarded: string[] = [];
  const taken = new Set<string>();

  let chapter: string | null = null;
  let current: { title: string; chapter: string | null; lines: string[] } | null = null;
  let inFence = false;

  const flush = () => {
    if (!current) return;
    const { title, chapter: recipeChapter, lines: body } = current;
    current = null;
    let base: string;
    try {
      base = slugify(title);
    } catch {
      errors.push(`Nadpis "${title}" nedává použitelný slug — recept přeskočen.`);
      return;
    }
    const slug = uniqueSlug(base, taken);
    if (slug !== base) warnings.push(`Kolize názvu "${title}" — uloženo jako ${slug}.md`);
    taken.add(slug);
    recipes.push({ slug, title, chapter: recipeChapter, body: body.join('\n').trim() });
  };

  for (const line of lines) {
    if (FENCE.test(line)) inFence = !inFence;
    const m = inFence ? null : HEADING.exec(line);
    if (m) {
      const depth = m[1].length;
      const title = cleanTitle(m[2] ?? '');
      if (depth === level) {
        flush();
        current = { title, chapter, lines: [] };
        continue;
      }
      if (depth < level) {
        flush();
        chapter = title || null;
        discarded.push(line);
        continue;
      }
    }
    (current ? current.lines : discarded).push(line);
  }
  flush();

  return { recipes, discarded: discarded.join('\n').trim(), warnings, errors };
}

export function renderRaw(recipe: RawRecipe): string {
  const chapter = recipe.chapter ? `<!-- kapitola: ${recipe.chapter} -->\n\n` : '';
  return `# ${recipe.title}\n\n${chapter}${recipe.body}\n`;
}
