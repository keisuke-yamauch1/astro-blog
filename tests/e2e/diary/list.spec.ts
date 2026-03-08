import { test, expect } from '@playwright/test';

test.describe('日記一覧ページ', () => {
  test('日記一覧が表示される', async ({ page }) => {
    await page.goto('/diary');

    const heading = page.getByRole('heading', { name: 'Diary' });
    await expect(heading).toBeVisible();

    const entries = page.locator('article, .diary-preview');
    const count = await entries.count();
    expect(count).toBeGreaterThan(0);
  });

  test('個別日記へのリンクが機能する', async ({ page }) => {
    await page.goto('/diary');

    const firstEntryLink = page.locator('article a, .diary-preview a').first();
    await firstEntryLink.click();

    // 日付形式のURL（YYYY/MM/DD）
    await expect(page).toHaveURL(/\/diary\/\d{4}\/\d{2}\/\d{2}/);

    const entryTitle = page.locator('h1');
    await expect(entryTitle).toBeVisible();
  });

  test('ページネーションが機能する', async ({ page }) => {
    await page.goto('/diary');

    const nextPageLink = page.getByRole('link', { name: /next|次|2/i });
    if (await nextPageLink.isVisible()) {
      await nextPageLink.click();
      await expect(page).toHaveURL(/\/diary\/2\/?/);

      const entries = page.locator('article, .diary-preview');
      expect(await entries.count()).toBeGreaterThan(0);
    }
  });
});
