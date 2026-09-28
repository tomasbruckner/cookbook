export const SITE_NAME = 'Kuchařka';

export const CATEGORIES = [
  { key: 'snidane', label: 'Snídaně' },
  { key: 'predkrmy-a-polevky', label: 'Předkrmy a polévky' },
  { key: 'hlavni-chody', label: 'Hlavní chody' },
  { key: 'dezerty', label: 'Dezerty a sladké' },
  { key: 'svaciny', label: 'Svačiny' },
  { key: 'ostatni', label: 'Ostatní' },
] as const;

export type CategoryKey = (typeof CATEGORIES)[number]['key'];

export const CATEGORY_KEYS = CATEGORIES.map((c) => c.key) as [CategoryKey, ...CategoryKey[]];

export function categoryLabel(key: CategoryKey): string {
  const found = CATEGORIES.find((c) => c.key === key);
  if (!found) throw new Error(`Neznámá kategorie: ${key}`);
  return found.label;
}
