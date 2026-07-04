# TASK.md（アーカイブ）

このファイルはかつて **microCMS 移行タスク**（2025年）の管理に使われていたが、
その後 microCMS は卒業し、コンテンツ管理は自作 CMS（blog-cms）に移行済み（2026-07）。

## 現状のアーキテクチャ（2026-07 時点）

- **コンテンツの正**: このリポジトリの `src/content/`（Content Collections・Markdown/HTML）
- **記事の作成・編集**: [blog-cms](https://cms.kechiiiiin.com)（Cloudflare Pages・別リポジトリ `blog-cms`）が
  GitHub API 経由で `main` に直接 commit する
- **microCMS**: 全記事（blog 14 / diary 219 / emonicle 4 = 237件）を `format: html` の md ファイルとして
  移行済み。API キーは削除済み・サービスは無料枠で放置（2026-07-04 判断）
- `source: 'microcms'` という値は移行由来の記事を示す**現役の分岐キー**として残っている（残骸ではない）

移行当時のタスク詳細は git 履歴のこのファイルを参照。
