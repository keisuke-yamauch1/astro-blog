import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2Eテスト設定
 *
 * 特徴:
 * - ヘッド付きモード（ブラウザ表示）をデフォルトに設定
 * - Astro開発サーバーとの連携
 * - Vitestとの共存を考慮したディレクトリ構成
 */
export default defineConfig({
  // テストファイルの配置場所
  testDir: './tests/e2e',

  // 並列実行の無効化（ヘッド付きモードで見やすくするため）
  fullyParallel: false,
  workers: 1,

  // タイムアウト設定
  timeout: 30 * 1000, // 30秒
  expect: {
    timeout: 5000, // 5秒
  },

  // 失敗時のリトライ（CI環境のみ）
  retries: process.env.CI ? 2 : 0,

  // レポート設定
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
  ],

  // テスト実行時の設定
  use: {
    // ベースURL（開発サーバー）
    baseURL: 'http://localhost:4321',

    // トレース記録（失敗時のみ）
    trace: 'on-first-retry',

    // スクリーンショット（失敗時のみ）
    screenshot: 'only-on-failure',

    // ビデオ録画（失敗時のみ）
    video: 'retain-on-failure',

    // ヘッド付きモード（ブラウザ表示）
    headless: false,

    // スローモーション（デバッグ用、ミリ秒）
    launchOptions: {
      slowMo: 500, // 0.5秒のスローモーション
    },
  },

  // ブラウザ設定
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // 必要に応じて他のブラウザを追加
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  // Astro開発サーバーの自動起動
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2分
  },
});
