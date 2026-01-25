/**
 * 日記コンテンツ生成のための共通ユーティリティ
 * フロントマター生成、ファイル名サニタイズを一元管理
 */

// 型定義
export interface DiaryFrontmatterOptions {
  title: string;
  date: string;
  draft?: boolean;
}

export interface DiaryContentOptions extends DiaryFrontmatterOptions {
  content: string;
}

/**
 * 日記用フロントマターを生成
 */
export function generateDiaryFrontmatter(options: DiaryFrontmatterOptions): string {
  return `---
title: ${options.title}
date: ${options.date}
draft: ${options.draft ?? false}
---`;
}

/**
 * 日記の完全なコンテンツを生成（フロントマター + 本文）
 */
export function generateDiaryContent(options: DiaryContentOptions): string {
  const frontmatter = generateDiaryFrontmatter({
    title: options.title,
    date: options.date,
    draft: options.draft,
  });
  return `${frontmatter}\n\n${options.content}\n`;
}

/**
 * タイトルをファイル名用にサニタイズ
 * - 危険な文字を削除
 * - 連続するドットを削除
 * - スペースをアンダースコアに変換
 * - 長さを制限
 */
export function sanitizeDiaryFilename(title: string): string {
  return title
    .replace(/[<>:"/\\|?*]/g, '')  // 危険な文字削除
    .replace(/\.\./g, '')           // ..削除
    .replace(/\s+/g, '_')           // スペースをアンダースコアに
    .trim()
    .slice(0, 50);                  // 長さ制限
}

/**
 * 日記のファイル名を生成
 */
export function generateDiaryFilename(date: string, title: string, extension = '.md'): string {
  return `${date}_${sanitizeDiaryFilename(title)}${extension}`;
}
