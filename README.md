# Kuchařka

Osobní kuchařka jako statický web (Astro + Cloudflare Workers).

## Přidání receptu

1. Vytvoř `src/content/recipes/<slug>.md`, kde `<slug>` = `slugify(title)` (jen znaky `[a-z0-9-]`, bez diakritiky), při kolizi s `-N` (N ≥ 2), např. „Omáčka: základní (2×)“ → `omacka-zakladni-2`:

   ```markdown
   ---
   title: Název receptu
   category: hlavni-chody   # snidane | predkrmy-a-polevky | hlavni-chody | dezerty | svaciny | ostatni
   tags: [italska]          # volitelné
   servings: 4              # volitelné
   time: 45                 # volitelné, minuty
   source: https://…        # volitelné
   ---

   [odkaz na zdroj](https://…)

   ## Ingredience

   * …

   ## Postup

   1. …
   ```

2. `npm run dev` a zkontroluj na http://localhost:4321
3. `npm run test:unit`
4. `./deploy.ps1`

## Vývoj

    npm install
    npm run dev
    npm run test:unit
    npm run test:e2e
