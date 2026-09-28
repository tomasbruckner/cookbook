import { expect, test } from '@playwright/test';

test('home lists recipes grouped by category', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Kuchařka');
  const groups = page.locator('[data-group]');
  expect(await groups.count()).toBeGreaterThan(0);
  for (const group of await groups.all()) {
    await expect(group.getByRole('heading', { level: 2 })).not.toBeEmpty();
    await expect(group.locator('[data-slug]').first()).toBeVisible();
  }
});

test('header category link opens a non-empty category page', async ({ page }) => {
  await page.goto('/');
  const links = page.getByRole('navigation', { name: 'Kategorie' }).getByRole('link');
  expect(await links.count()).toBeGreaterThan(0);
  for (const link of await links.all()) {
    const href = await link.getAttribute('href');
    expect(href).toMatch(/^\/kategorie\/[a-z0-9-]+\/$/);
  }
  const first = links.first();
  const label = (await first.innerText()).trim();
  await first.click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(label);
  await expect(page).toHaveTitle(`${label} | Kuchařka`);
  await expect(page.locator('[data-slug]').first()).toBeVisible();
});

test('every header category has recipes (no empty categories linked)', async ({ page, request }) => {
  await page.goto('/');
  const hrefs = await page
    .getByRole('navigation', { name: 'Kategorie' })
    .getByRole('link')
    .evaluateAll((as) => as.map((a) => a.getAttribute('href')!));
  for (const href of hrefs) {
    const res = await request.get(href);
    expect(res.status(), href).toBe(200);
  }
});

test('tag link opens the tag page', async ({ page }) => {
  await page.goto('/');
  const tag = page.locator('main a[href^="/stitek/"]').first();
  test.skip((await tag.count()) === 0, 'žádný recept nemá štítek');
  const text = (await tag.innerText()).trim();
  await tag.click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(text);
  await expect(page.locator('[data-slug]').first()).toBeVisible();
});

test('unknown URL returns the 404 page', async ({ page }) => {
  const res = await page.goto('/tohle-neexistuje/');
  expect(res?.status()).toBe(404);
  await expect(page.getByRole('link', { name: 'Zpět na recepty' })).toBeVisible();
});

test('pages are marked noindex', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
});
