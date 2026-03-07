# microCMS移行タスク

## 📋 プロジェクト概要

現在の管理画面（/admin）をmicroCMSに置き換え、段階的に完全移行を実現する。

**現状の課題**:
- 管理画面のメンテナンスコスト（認証、エディタ、API実装）
- モバイル対応が不十分（EasyMDE）
- GitHub APIの複雑な処理（ローカル/Vercel環境の分岐）

**移行方針**:
1. 第1段階: ハイブリッド実装（既存Markdown + 新規microCMS）
2. 第2段階: 完全移行（全データ181件をmicroCMSへ）
3. 管理画面削除: /adminを完全削除

**データ量**: Blog 13件、Diary 168件、Emonicle 3件

**実装アプローチ**:
- microCMS: リッチエディタ（HTML出力）
- Astro: `set:html`でHTMLを直接埋め込み
- YouTube/Twitter: microCMS側で自動埋め込み
- 画像: microCMSにアップロード or 外部CDN URL

---

## Phase 1: 準備（1日）

### microCMSセットアップ

- [x] microCMSアカウント作成
- [x] サービス作成
- [x] Blog API作成（リスト形式）
  - [x] customId (数値・必須)
  - [x] title (テキスト・必須)
  - [x] description (テキスト・任意)
  - [x] content (リッチエディタ・必須)
  - [x] date (日時・必須)
  - [x] tags (複数選択・任意)
  - [x] draft (真偽値・デフォルト: false)
  - [x] image (テキスト・任意)
- [x] Diary API作成（リスト形式）
  - [x] title (テキスト・必須)
  - [x] description (テキスト・必須)
  - [x] content (リッチエディタ・必須)
  - [x] date (日時・必須)
  - [x] weather (テキスト・任意)
  - [x] condition (テキスト・任意)
  - [x] draft (真偽値・デフォルト: false)
  - [x] image (テキスト・任意)
- [x] Emonicle API作成（リスト形式）
  - [x] customId (数値・必須)
  - [x] title (テキスト・必須)
  - [x] description (テキスト・任意)
  - [x] content (リッチエディタ・必須)
  - [x] date (日時・必須)
  - [x] draft (真偽値・デフォルト: false)
  - [x] image (テキスト・任意)

### 環境設定

- [x] `.env`に環境変数追加
  - [x] `MICROCMS_SERVICE_DOMAIN`
  - [x] `MICROCMS_API_KEY`
- [x] Vercel環境変数設定
  - [x] `MICROCMS_SERVICE_DOMAIN`
  - [x] `MICROCMS_API_KEY`
- [x] 依存関係インストール
  ```bash
  npm install microcms-js-sdk gray-matter
  ```

---

## Phase 2: ハイブリッド実装（2-3日）

### 新規ファイル作成

- [x] `src/lib/microcms.ts` - microCMSクライアント
  - [x] `createClient`初期化
  - [x] 型定義: `MicroCMSBlog`, `MicroCMSDiary`, `MicroCMSEmonicle`
  - [x] エクスポート: `microCMSClient`

- [x] `src/utils/content-fetcher.ts` - 統合データフェッチャー
  - [x] 型定義: `UnifiedBlogEntry`, `UnifiedDiaryEntry`, `UnifiedEmonicleEntry`
  - [x] `fetchAllBlogs()` - Markdown + microCMS統合（ページネーション対応）
  - [x] `fetchAllDiaries()` - Markdown + microCMS統合（ページネーション対応）
  - [x] `fetchAllEmonicles()` - Markdown + microCMS統合（ページネーション対応）
  - [x] microCMS → Content Collections互換形式の変換関数
    - [x] `convertMicroCMSBlogToEntry()` - HTMLをそのまま使用
    - [x] `convertMicroCMSDiaryToEntry()` - HTMLをそのまま使用
    - [x] `convertMicroCMSEmonicleToEntry()` - HTMLをそのまま使用
  - [x] `render()`関数でHTMLを返す（`set:html`用）

### 既存ファイル修正

- [x] `src/pages/blog/[id].astro`
  - [x] `getCollection('blog')` → `fetchAllBlogs()`
  - [x] microCMS HTMLコンテンツを`set:html`で表示
- [x] `src/pages/blog/[...page].astro`
  - [x] `getCollection('blog')` → `fetchAllBlogs()`
- [x] `src/pages/diary/[year]/[month]/[day].astro`
  - [x] `getCollection('diary')` → `fetchAllDiaries()`
  - [x] microCMS HTMLコンテンツを`set:html`で表示
- [x] `src/pages/diary/[...page].astro`
  - [x] `getCollection('diary')` → `fetchAllDiaries()`
- [x] `src/pages/index.astro`
  - [x] ハイブリッドフェッチ実装
- [x] `src/pages/tags/[tag].astro`
  - [x] `fetchAllBlogs()`使用
- [x] `src/pages/tags/index.astro`
  - [x] `fetchAllBlogs()`使用
- [x] `src/pages/archive.astro`
  - [x] `fetchAllBlogs()`使用
- [x] `src/pages/api/search.json.ts`
  - [x] 検索API更新（HTML除去処理追加）
- [x] `src/pages/emonicle/[id].astro`
  - [x] `fetchAllEmonicles()`使用
  - [x] microCMS HTMLコンテンツを`set:html`で表示
- [x] `src/pages/emonicle/[...page].astro`
  - [x] `fetchAllEmonicles()`使用
- [x] `src/pages/emonicle/[slug].astro`
  - [x] `fetchAllEmonicles()`使用
  - [x] microCMS HTMLコンテンツを`set:html`で表示

### テスト

- [x] ローカル開発サーバー起動（`npm run dev`）
- [x] 既存Markdownコンテンツ表示確認
- [x] microCMSテストコンテンツ作成（手動1件）
- [x] microCMSコンテンツ表示確認
- [x] 日記の改行処理確認（単一改行が`<br>`）
- [x] YouTube/Twitter埋め込み確認
- [ ] タグフィルタリング確認
- [ ] ページネーション確認

### Phase 2完了時の実装詳細

**UnifiedEntry型の設計**:
```typescript
interface UnifiedBlogEntry {
  id: string;
  slug: string;
  data: { /* frontmatter */ };
  body: string;  // Markdown: 空文字列、microCMS: HTML
  render: () => Promise<{ Content: any }>;
  source: 'markdown' | 'microcms';  // 判別フィールド
}
```
- `source`フィールドでMarkdown/microCMSを判別
- Markdownの`render()`: Astroコンポーネントを返す
- microCMSの`render()`: HTML文字列を返す関数（`() => cms.content`）

**エラーハンドリング戦略**:
```typescript
export async function fetchAllBlogs(): Promise<UnifiedBlogEntry[]> {
  try {
    // Markdown + microCMS統合
  } catch (error) {
    console.error('Error fetching blogs:', error);
    // microCMSエラー時はMarkdownのみにフォールバック
    const markdownPosts = await getCollection('blog');
    return markdownPosts.map(/* ... */);
  }
}
```
- 全fetch関数（`fetchAllBlogs`, `fetchAllDiaries`, `fetchAllEmonicles`）にtry-catch実装
- microCMS APIエラー時は既存Markdownのみを返す
- ビルドは必ず成功する設計（段階的移行に最適）

**検索APIの対応** (`src/pages/api/search.json.ts`):
```typescript
let cleanContent = post.body;
if (post.source === 'microcms') {
  cleanContent = post.body.replace(/<[^>]*>/g, ' '); // HTML除去
} else {
  // Markdownの既存処理
}
```

**`markdown-renderer.ts`は作成していない**:
- 計画では`remark`/`rehype`でMarkdownレンダリング予定だった
- リッチエディタ（HTML出力）採用により不要になった

---

## Phase 3: データ移行（1日）

### 移行スクリプト作成

- [ ] `scripts/migrate-to-microcms.js`作成
  - [ ] `gray-matter`でfrontmatterパース
  - [ ] microCMS API `create`メソッド実装
  - [ ] レート制限対策（150msディレイ）
  - [ ] エラーハンドリング
  - [ ] `--dry-run`オプション実装
  - [ ] `--limit`オプション実装

### データ移行実行

- [ ] ドライラン実行（確認のみ）
  ```bash
  node scripts/migrate-to-microcms.js --dry-run
  ```
- [ ] 10件ずつテスト移行
  ```bash
  node scripts/migrate-to-microcms.js --limit 10
  ```
- [ ] Blog 13件移行
- [ ] Diary 168件移行
- [ ] Emonicle 3件移行

### データ検証

- [ ] frontmatter正確性確認（title, date, tags等）
- [ ] コンテンツ本文の欠損なし確認
- [ ] 画像URLの正確性確認
- [ ] タグの正確性確認
- [ ] 全ページ表示確認

---

## Phase 4: 完全移行準備（1日）

### バックアップ

- [ ] Markdownファイルバックアップ作成
  ```bash
  tar -czf content-backup-$(date +%Y%m%d).tar.gz src/content/
  ```

### 表示確認

- [ ] ホームページ表示確認
- [ ] ブログ一覧ページネーション確認
- [ ] 日記一覧ページネーション確認
- [ ] 個別記事ページ確認
- [ ] タグ別ページ確認
- [ ] アーカイブページ確認
- [ ] 検索機能確認
- [ ] RSSフィード確認
- [ ] Sitemap確認

### E2Eテスト更新

- [ ] `tests/e2e/blog/list.spec.ts`更新
- [ ] `tests/e2e/home.spec.ts`更新
- [ ] `tests/e2e/microcms-integration.spec.ts`作成

---

## Phase 5: 完全移行（1日）

### Content Collections削除

- [ ] `src/content/config.ts`から削除
  - [ ] `blog`コレクション定義削除
  - [ ] `diary`コレクション定義削除
  - [ ] `emonicle`コレクション定義削除
  - [ ] `profile`, `home`は保持
- [ ] Markdownディレクトリ削除
  - [ ] `src/content/blog/`削除（バックアップ後）
  - [ ] `src/content/diary/`削除（バックアップ後）
  - [ ] `src/content/emonicle/`削除（バックアップ後）

### content-fetcher.ts簡素化

- [ ] `getCollection`呼び出し削除
- [ ] microCMS APIのみからデータ取得

### 管理画面削除

- [ ] `src/pages/admin/`ディレクトリ全体削除
  - [ ] `index.astro`
  - [ ] `login.astro`
  - [ ] `drafts.astro`
  - [ ] `preview/`
  - [ ] `api/auth.ts`
  - [ ] `api/create-post.ts`
  - [ ] `api/save-draft.ts`
  - [ ] `api/publish-draft.ts`
- [ ] `src/lib/diary-utils.ts`削除
- [ ] `src/lib/auth.ts`削除
- [ ] `src/lib/github-client.ts`削除
- [ ] `src/lib/post-creator.ts`部分削除
  - [ ] 作成関連の関数削除（`createBlogPost`, `createDiaryPost`等）
  - [ ] `convertContent`は保持

### 依存関係削除

- [ ] npm パッケージアンインストール
  ```bash
  npm uninstall bcrypt easymde jsonwebtoken octokit
  ```

### 環境変数クリーンアップ

- [ ] `.env`から削除
  - [ ] `ADMIN_PASSWORD_HASH`
  - [ ] `JWT_SECRET`
  - [ ] `GITHUB_TOKEN`
  - [ ] `GITHUB_OWNER`
  - [ ] `GITHUB_REPO`

### デプロイ

- [ ] ローカルビルド確認（`npm run build`）
- [ ] 全ページ生成確認（`dist/`ディレクトリ）
- [ ] Vercel環境変数設定確認
- [ ] Vercelデプロイ
- [ ] 本番環境で全ページ確認

---

## Phase 6: Webhook設定（0.5日）

- [ ] Vercel Deploy Hook作成
  - [ ] Vercelダッシュボードで Deploy Hook URL取得
- [ ] microCMS Webhook設定
  - [ ] イベント: コンテンツ公開/更新/削除
  - [ ] URL: Vercel Deploy Hook URL
- [ ] 自動デプロイテスト
  - [ ] microCMSでテスト記事公開
  - [ ] Vercel自動デプロイ確認

---

## Phase 7: クリーンアップ（0.5日）

- [ ] ドキュメント更新
  - [ ] `CLAUDE.md`更新（管理画面の記述削除、microCMS運用手順追加）
  - [ ] `README.md`更新（microCMS移行完了の記載）
- [ ] 未使用コード削除確認
  - [ ] 削除漏れチェック
- [ ] `TASK.md`完了マーク

---

## 📝 重要な実装ポイント

### 改行処理の互換性

**リスク**: 日記の単一改行が`<br>`にならない

**対策**:
- `markdown-renderer.ts`の`renderMarkdown()`に`enableBreaks`オプション実装
- Diary専用のユニットテスト追加
  ```typescript
  test('日記の単一改行が<br>に変換される', async () => {
    const content = 'Line1\nLine2';
    const { html } = await renderMarkdown(content, [], false, { enableBreaks: true });
    expect(html).toContain('<br');
  });
  ```

### ビルド時間の増加

**想定**: 現在30秒 → 移行後60秒（181件のAPI呼び出し）

**対策**:
- microCMS APIキャッシュ実装（`src/lib/microcms-cache.ts`）
- 並列フェッチ（`Promise.all`）
- 目標: 45秒以内

### 画像の扱い

**方針**: 外部CDN（images.kechiiiiin.com）のURLをそのまま使用

**確認**: microCMSのimageフィールドをテキスト形式で定義

### プレビュー機能

**実装**:
- microCMS側のプレビュー機能を使用
- Astro側でSSRプレビューエンドポイント作成（`src/pages/preview/[contentType]/[id].astro`）

---

## 🔄 ロールバック戦略

### ハイブリッド期間中（Phase 2-3）

1. `content-fetcher.ts`を元の`getCollection`に戻す
2. Git revert

### 完全移行後（Phase 5以降）

1. バックアップtarballから復元
   ```bash
   tar -xzf content-backup-YYYYMMDD.tar.gz
   ```
2. `src/content/config.ts`復元
3. `content-fetcher.ts`削除
4. ページコンポーネント復元
5. Git revert
6. Vercel再デプロイ

---

## 📊 進捗管理

### Phase 1: 準備
- 状態: ✅ **完了**
- 見積: 1日
- 実績: microCMS API作成、環境変数設定、依存関係インストール完了

### Phase 2: ハイブリッド実装
- 状態: ✅ **完了**
- 見積: 2-3日
- 実績: `microcms.ts`, `content-fetcher.ts`作成、全ページコンポーネント更新、ビルド成功
- **実装上の決定**: リッチエディタ（HTML出力）を採用、`set:html`で直接埋め込み
- **解決した問題**:
  - microCMS API limit 100制限 → ページネーション実装
  - emonicleページ更新漏れ → 3ファイル修正
  - 空段落タグ表示 → CSS `p:empty { min-height: 1em }`

### Phase 3: データ移行
- 状態: ⏳ **未着手**
- 見積: 1日

### Phase 4: 完全移行準備
- 状態: ⏳ **未着手**
- 見積: 1日

### Phase 5: 完全移行
- 状態: ⏳ **未着手**
- 見積: 1日

### Phase 6: Webhook設定
- 状態: ⏳ **未着手**
- 見積: 0.5日

### Phase 7: クリーンアップ
- 状態: ⏳ **未着手**
- 見積: 0.5日

**総見積**: 7-8日 | **完了**: Phase 1-2 | **残り**: Phase 3-7 (約4日)

---

## 📁 重要ファイル一覧

### 新規作成ファイル
- `src/lib/microcms.ts`
- `src/lib/markdown-renderer.ts`
- `src/utils/content-fetcher.ts`
- `scripts/migrate-to-microcms.js`

### 修正ファイル
- `src/pages/blog/[id].astro`
- `src/pages/blog/[...page].astro`
- `src/pages/diary/[year]/[month]/[day].astro`
- `src/pages/diary/[...page].astro`
- `src/pages/index.astro`
- `src/pages/api/search.json.ts`
- `src/content/config.ts`（Phase 5で修正）

### 参照ファイル（変更不要）
- `src/utils/posts.ts`（フィルタリングロジック）
- `src/lib/post-creator.ts`（`convertContent()`を再利用）
- `astro.config.mjs`（rehypeプラグイン設定を参照）

### 削除ファイル（Phase 5）
- `src/pages/admin/`（全体）
- `src/lib/diary-utils.ts`
- `src/lib/auth.ts`
- `src/lib/github-client.ts`

---

## 📌 次のアクション

**推奨実装順序**:

1. **Phase 1-3（ハイブリッド + データ移行）を実装**
   - リスク低（既存機能を壊さない）
   - 新規コンテンツをmicroCMSで作成開始

2. **2週間のテスト運用**
   - microCMSでの記事作成体験確認
   - ビルド時間、パフォーマンス確認
   - 問題があればロールバック

3. **Phase 4-7（完全移行 + Webhook + クリーンアップ）を実装**
   - バックアップ必須
   - E2Eテスト全通過確認
   - デプロイ後の全ページ表示確認
