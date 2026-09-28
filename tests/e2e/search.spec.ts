import { expect, test } from '@playwright/test';

const strip = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

test('search without diacritics finds the recipe', async ({ page }) => {
  await page.goto('/');
  const box = page.getByLabel('Hledat recept');
  const total = await page.locator('[data-slug]').count();
  const title = (await page.locator('[data-slug] > a').first().innerText()).trim();

  await box.fill(strip(title));
  const visible = page.locator('[data-slug]:visible');
  await expect(visible.filter({ hasText: title }).first()).toBeVisible();
  if (total > 1) {
    await expect
      .poll(() => visible.count())
      .toBeLessThan(total);
  }

  await box.fill(`  ${title.toUpperCase()}  `);
  await expect(visible.filter({ hasText: title }).first()).toBeVisible();
});

test('no match shows the empty message and hides all groups', async ({ page }) => {
  await page.goto('/');
  const box = page.getByLabel('Hledat recept');
  await box.fill('zzzneexistujezzz');
  await expect(page.locator('[data-slug]:visible')).toHaveCount(0);
  await expect(page.locator('[data-group]:visible')).toHaveCount(0);
  await expect(page.getByText('Nic nenalezeno.')).toBeVisible();

  const total = await page.locator('[data-slug]').count();
  await box.fill('');
  await expect(page.locator('[data-slug]:visible')).toHaveCount(total);
  await expect(page.getByText('Nic nenalezeno.')).toBeHidden();
});

test('search matches ingredient text, not only titles', async ({ page }) => {
  await page.goto('/');
  const index = JSON.parse((await page.locator('#search-index').textContent())!) as {
    slug: string;
    title: string;
    text: string;
  }[];
  const withText = index.find((e) => e.text.split(' ').some((w) => w.length > 5 && !strip(e.title).includes(strip(w))));
  test.skip(!withText, 'žádný recept s ingrediencemi');
  const word = withText!.text.split(' ').find((w) => w.length > 5 && !strip(withText!.title).includes(strip(w)))!;
  await page.getByLabel('Hledat recept').fill(strip(word).replace(/[^a-z0-9]/g, ''));
  await expect(page.locator(`[data-slug="${withText!.slug}"]`)).toBeVisible();
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('recipes are listed and the search box stays hidden', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-slug]').first()).toBeVisible();
    await expect(page.getByLabel('Hledat recept')).toBeHidden();
  });
});
