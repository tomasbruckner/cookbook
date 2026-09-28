# Kuchařka

Osobní kuchařka jako statický web (Astro + Cloudflare Workers).

## Přidání receptu

1. Vytvoř `src/content/recipes/<nazev-bez-diakritiky>.md`:

   ```markdown
   ---
   title: Název receptu
   category: hlavni-chody   # snidane | predkrmy-a-polevky | hlavni-chody | dezerty | svaciny | ostatni
   tags: [italska]          # volitelné
   servings: 4              # volitelné
   time: 45                 # volitelné, minuty
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
