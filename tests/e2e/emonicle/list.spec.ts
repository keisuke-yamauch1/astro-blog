import { test, expect } from '@playwright/test';

test.describe('Emonicle一覧ページ', () => {
  test('Emonicle一覧が表示される', async ({ page }) => {
    await page.goto('/emonicle');

    const heading = page.getByRole('heading', { name: 'Emonicle' });
    await expect(heading).toBeVisible();
  });

  test('個別Emonicle記事へのリンクが機能する', async ({ page }) => {
    await page.goto('/emonicle');

    const articles = page.locator('article a, .emonicle-preview a');
    const count = await articles.count();

    if (count > 0) {
      const firstArticle = articles.first();
      await firstArticle.click();

      await expect(page).toHaveURL(/\/emonicle\/[a-z0-9_-]+/i);

      const title = page.locator('h1');
      await expect(title).toBeVisible();
    }
  });

  test('ページネーションが機能する', async ({ page }) => {
    await page.goto('/emonicle');

    const nextPageLink = page.getByRole('link', { name: /next|次|2/i });
    if (await nextPageLink.isVisible()) {
      await nextPageLink.click();
      await expect(page).toHaveURL(/\/emonicle\/2\/?/);
    }
  });
});
