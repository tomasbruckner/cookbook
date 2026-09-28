import { expect, test, type Page } from '@playwright/test';

// Testy nesmí záviset na síti ani na konkrétním receptu.
test.beforeEach(async ({ page }) => {
  await page.route(/^https?:\/\/(?!localhost)/, (route) => route.abort());
});

async function firstRecipeWithVideo(page: Page): Promise<string | null> {
  await page.goto('/');
  const hrefs = await page.locator('[data-slug] > a').evaluateAll((as) => as.map((a) => a.getAttribute('href')!));
  for (const href of hrefs) {
    await page.goto(href);
    if ((await page.locator('[data-youtube-id]').count()) > 0) return href;
  }
  return null;
}

test('video shows a thumbnail first and loads the player on click', async ({ page }) => {
  const href = await firstRecipeWithVideo(page);
  test.skip(!href, 'žádný recept s YouTube odkazem');

  const figure = page.locator('[data-youtube-id]').first();
  const id = await figure.getAttribute('data-youtube-id');
  await expect(figure.locator('img')).toHaveAttribute('src', `https://i.ytimg.com/vi/${id}/hqdefault.jpg`);
  await expect(page.locator('iframe')).toHaveCount(0);

  const open = figure.getByRole('link', { name: 'Otevřít v YouTube' });
  await expect(open).toHaveAttribute('href', /youtu/);

  await figure.getByRole('link', { name: 'Přehrát video' }).click();
  const iframe = figure.locator('iframe');
  await expect(iframe).toHaveAttribute('src', new RegExp(`^https://www\\.youtube-nocookie\\.com/embed/${id}\\?autoplay=1`));
  await expect(page).toHaveURL(new RegExp(`${href}$`));
  await expect(open).toBeVisible();
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('the thumbnail is a plain link to YouTube', async ({ page }) => {
    const href = await firstRecipeWithVideo(page);
    test.skip(!href, 'žádný recept s YouTube odkazem');
    await expect(page.locator('[data-youtube-id] .yt-thumb').first()).toHaveAttribute('href', /youtu/);
  });
});
