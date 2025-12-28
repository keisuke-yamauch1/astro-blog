import { test, expect } from '@playwright/test';

test.describe('ブログ一覧ページ', () => {
  test('ブログ一覧が表示される', async ({ page }) => {
    await page.goto('/blog');

    // ページタイトルの確認
    const heading = page.getByRole('heading', { name: 'Blog' });
    await expect(heading).toBeVisible();

    // 記事プレビューの存在確認
    const articles = page.locator('article, .blog-preview');
    await expect(articles.first()).toBeVisible();
  });

  test('個別記事へのリンクが機能する', async ({ page }) => {
    await page.goto('/blog');

    // 最初の記事リンクをクリック
    const firstArticleLink = page.locator('article a, .blog-preview a').first();
    await firstArticleLink.click();

    // 個別記事ページに遷移していることを確認
    await expect(page).toHaveURL(/\/blog\/\d+/);
  });

  test('ページネーションが機能する', async ({ page }) => {
    await page.goto('/blog');

    // ページネーションの確認（記事が10件以上ある場合）
    const nextPageLink = page.getByRole('link', { name: /next|次|2/i });
    if (await nextPageLink.isVisible()) {
      await nextPageLink.click();
      await expect(page).toHaveURL(/\/blog\/2/);
    }
  });

  test('ダークモードの切り替え', async ({ page }) => {
    await page.goto('/blog');

    // ダークモードトグルボタンを探す（実装に応じて調整）
    const darkModeToggle = page.locator('[aria-label*="dark"], [aria-label*="theme"]');
    if (await darkModeToggle.isVisible()) {
      await darkModeToggle.click();

      // ダークモードクラスの確認
      const html = page.locator('html');
      await expect(html).toHaveClass(/dark/);
    }
  });
});
