import { expect, test } from '@playwright/test';

async function recipeHrefs(page: import('@playwright/test').Page): Promise<string[]> {
  await page.goto('/');
  return page.locator('[data-slug] > a').evaluateAll((as) => as.map((a) => a.getAttribute('href')!));
}

test('opening a recipe from the list shows its title', async ({ page }) => {
  await page.goto('/');
  const first = page.locator('[data-slug] > a').first();
  const title = (await first.innerText()).trim();
  await first.click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
  await expect(page).toHaveTitle(`${title} | Kuchařka`);
  await expect(page.locator('main a[href^="/kategorie/"]').first()).toBeVisible();
});

test('every recipe renders cleanly', async ({ page }) => {
  for (const href of await recipeHrefs(page)) {
    await page.goto(href);
    const main = page.locator('main');
    await expect(main.getByRole('heading', { level: 1 }), href).not.toBeEmpty();
    await expect(main, href).not.toContainText('undefined');
    await expect(main, href).not.toContainText('NaN');
    const ingredients = main.locator('[data-section="ingredients"]');
    if ((await ingredients.count()) > 0) {
      // sekce se vykreslí právě jednou
      await expect(main.getByRole('heading', { level: 2, name: 'Ingredience', exact: true }), href).toHaveCount(1);
    }
  }
});

test('ingredients sit left of the method on desktop', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'jen desktop');
  for (const href of await recipeHrefs(page)) {
    await page.goto(href);
    const ingredients = page.locator('[data-section="ingredients"]');
    if ((await ingredients.count()) === 0) continue;
    const a = await ingredients.boundingBox();
    const b = await page.locator('[data-section="rest"]').boundingBox();
    expect(a!.x).toBeLessThan(b!.x);
    return;
  }
  test.skip(true, 'žádný recept se sekcí Ingredience');
});

test('a long ingredients list can be scrolled into view within the sticky column', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'jen desktop');
  await page.setViewportSize({ width: 1024, height: 768 });
  for (const href of await recipeHrefs(page)) {
    await page.goto(href);
    const ingredients = page.locator('[data-section="ingredients"]');
    if ((await ingredients.count()) === 0) continue;
    const box = await ingredients.boundingBox();
    if (!box || box.height <= 700) continue; // jen dost dlouhý seznam ingrediencí aktivuje omezení výšky
    // sroluj stránku jen kousek dolů, do postupu (ne až na konec stránky)
    await page.evaluate(() => window.scrollBy(0, 500));
    const lastLi = ingredients.locator('li').last();
    await ingredients.evaluate((el) => el.scrollTo(0, el.scrollHeight));
    await expect(lastLi).toBeInViewport();
    return;
  }
  test.skip(true, 'žádný recept s dost dlouhým seznamem ingrediencí');
});

test('recipe without ingredients section renders as one column', async ({ page }) => {
  for (const href of await recipeHrefs(page)) {
    await page.goto(href);
    if ((await page.locator('[data-section="ingredients"]').count()) > 0) continue;
    await expect(page.locator('[data-section="rest"]')).toHaveCount(0);
    await expect(page.locator('main article')).toContainText(/\S/);
    return;
  }
  test.skip(true, 'všechny recepty mají sekci Ingredience');
});
