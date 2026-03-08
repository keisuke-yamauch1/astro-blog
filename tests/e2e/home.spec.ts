import { test, expect } from '@playwright/test';

test.describe('ホームページ', () => {
  test('トップページが正しく表示される', async ({ page }) => {
    await page.goto('/');

    // タイトルの確認
    await expect(page).toHaveTitle(/まあ、そうかもしれない/);

    // メインコンテンツの確認
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();
  });

  test('ソーシャルリンクが表示される', async ({ page }) => {
    await page.goto('/');

    // SocialLinksコンポーネントの確認
    const socialLinks = page.locator('a[target="_blank"]');
    await expect(socialLinks.first()).toBeVisible();
  });

  test('ナビゲーションリンクが機能する', async ({ page }) => {
    await page.goto('/');

    // Blogリンクをクリック（ナビゲーション内の最初のBlogリンク）
    await page.getByRole('link', { name: 'Blog', exact: true }).first().click();

    // URLの確認
    await expect(page).toHaveURL(/\/blog/);
  });
});
