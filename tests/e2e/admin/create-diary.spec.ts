import { test, expect } from '@playwright/test';

test.describe('管理画面 - 日記作成', () => {
  // 各テスト前にログイン状態を設定
  test.beforeEach(async ({ page }) => {
    // ログイン処理（localStorageにトークンを設定）
    await page.goto('/admin');

    // localStorageにトークンを設定（実際の認証フローに応じて調整）
    await page.evaluate(() => {
      localStorage.setItem('admin_token', 'test-token');
    });

    await page.goto('/admin');
  });

  test('日記作成フォームが表示される', async ({ page }) => {
    // フォーム要素の確認
    await expect(page.locator('#date')).toBeVisible();
    await expect(page.locator('#title')).toBeVisible();
    await expect(page.locator('#condition')).toBeVisible();

    // EasyMDEエディタの確認
    await expect(page.locator('.CodeMirror')).toBeVisible();
  });

  test('日記を作成できる', async ({ page }) => {
    // 日付の入力
    await page.locator('#date').fill('2025-12-28');

    // タイトルの入力
    await page.locator('#title').fill('Playwright テスト日記');

    // コンディションの入力
    await page.locator('#condition').fill('晴れ');

    // EasyMDEエディタへの入力
    const editor = page.locator('.CodeMirror textarea');
    await editor.fill('これはPlaywrightで作成したテスト日記です。\n\n改行テスト。');

    // 公開ボタンをクリック
    await page.getByRole('button', { name: '公開' }).click();

    // 成功メッセージの確認
    await expect(page.locator('#status')).toContainText('✓ 公開成功');
  });

  test('下書き保存ができる', async ({ page }) => {
    // フォーム入力
    await page.locator('#date').fill('2025-12-28');
    await page.locator('#title').fill('下書きテスト');

    const editor = page.locator('.CodeMirror textarea');
    await editor.fill('下書き保存のテスト');

    // 下書き保存ボタンをクリック
    await page.getByRole('button', { name: '下書き保存' }).click();

    // 成功メッセージの確認
    await expect(page.locator('#status')).toContainText('下書き保存');

    // プレビューリンクの確認
    const previewLink = page.locator('#status a');
    await expect(previewLink).toHaveAttribute('href', /\/diary\/2025\/12\/28/);
  });

  test('必須フィールドのバリデーション', async ({ page }) => {
    // タイトルを空のまま公開ボタンをクリック
    await page.getByRole('button', { name: '公開' }).click();

    // HTML5バリデーションメッセージの確認
    const titleInput = page.locator('#title');
    const validationMessage = await titleInput.evaluate((el: HTMLInputElement) =>
      el.validationMessage
    );
    expect(validationMessage).toBeTruthy();
  });
});
