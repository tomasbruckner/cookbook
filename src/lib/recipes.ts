import { CATEGORIES, type CategoryKey } from '../consts';

export interface RecipeLike {
  id: string;
  data: { title: string; category: CategoryKey; tags: string[] };
}

export interface CategoryGroup<T> {
  key: CategoryKey;
  label: string;
  recipes: T[];
}

export function sortByTitle<T extends RecipeLike>(recipes: readonly T[]): T[] {
  return [...recipes].sort((a, b) => a.data.title.localeCompare(b.data.title, 'cs'));
}

export function groupByCategory<T extends RecipeLike>(recipes: readonly T[]): CategoryGroup<T>[] {
  const sorted = sortByTitle(recipes);
  return CATEGORIES.map((c) => ({
    key: c.key,
    label: c.label,
    recipes: sorted.filter((r) => r.data.category === c.key),
  })).filter((g) => g.recipes.length > 0);
}

export function collectTags(recipes: readonly RecipeLike[]): string[] {
  return [...new Set(recipes.flatMap((r) => r.data.tags))].sort((a, b) => a.localeCompare(b, 'cs'));
}

export function withTag<T extends RecipeLike>(recipes: readonly T[], tag: string): T[] {
  return sortByTitle(recipes.filter((r) => r.data.tags.includes(tag)));
}
