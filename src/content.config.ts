import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { CATEGORY_KEYS } from './consts';

const TAG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const recipes = defineCollection({
  loader: glob({
    pattern: '*.md',
    base: './src/content/recipes',
    generateId: ({ entry }) => entry.replace(/\.md$/, ''),
  }),
  schema: z.object({
    title: z.string().min(1),
    category: z.enum(CATEGORY_KEYS),
    tags: z.array(z.string().regex(TAG, 'štítek musí být kebab-case bez diakritiky')).default([]),
    servings: z.number().int().positive().optional(),
    time: z.number().int().positive().optional(),
    source: z.string().optional(),
  }),
});

export const collections = { recipes };
