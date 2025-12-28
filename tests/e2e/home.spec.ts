import { test, expect } from '@playwright/test';

test.describe('ホームページ', () => {
  test('トップページが正しく表示される', async ({ page }) => {
    await page.goto('/');

    // タイトルの確認
    await expect(page).toHaveTitle(/astro-blog/i);

    // メインコンテンツの確認
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();

    // 最新の日記セクション
    const diarySection = page.getByRole('heading', { name: '最新の日記' });
    await expect(diarySection).toBeVisible();

    // 最新のブログセクション
    const blogSection = page.getByRole('heading', { name: '最新のブログ' });
    await expect(blogSection).toBeVisible();
  });

  test('ソーシャルリンクが表示される', async ({ page }) => {
    await page.goto('/');

    // SocialLinksコンポーネントの確認
    const socialLinks = page.locator('a[target="_blank"]');
    await expect(socialLinks.first()).toBeVisible();
  });

  test('ブログ一覧へのリンクが機能する', async ({ page }) => {
    await page.goto('/');

    // 「もっとみる」リンクをクリック
    await page.getByRole('link', { name: 'もっとみる' }).first().click();

    // URLの確認
    await expect(page).toHaveURL(/\/blog\//);
  });
});
