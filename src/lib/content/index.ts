import { getCollection, type CollectionEntry } from 'astro:content';
import { getDateParts } from '../../utils/date';
import type { UnifiedBlogEntry, UnifiedDiaryEntry, UnifiedEmonicleEntry } from './types';

export type {
  ContentType,
  UnifiedBlogEntry,
  UnifiedDiaryEntry,
  UnifiedEmonicleEntry,
} from './types';

// Content Collections のエントリを、ページ側が期待する Unified* 形式へ詰め替える。
// format === 'html'（microCMS 移行分）は source:'microcms' 互換にして、既存の set:html 分岐を無改修で活かす。
function toUnified(entry: CollectionEntry<'blog' | 'diary' | 'emonicle'>, slug: string) {
  const isHtml = entry.data.format === 'html';
  return {
    id: entry.slug,          // ファイル名（= 旧contentId or 日付）
    slug,
    data: {
      title: entry.data.title,
      description: entry.data.description,
      date: entry.data.pubDate,           // 既存ページは data.date を参照するため詰め替え
      tags: entry.data.tags,
      draft: entry.data.draft,
      image: entry.data.heroImage,        // 既存ページは data.image を参照
    },
    body: entry.body,
    render: isHtml
      ? async () => ({ Content: () => entry.body })   // 生HTMLをそのまま返す（set:html用）
      : () => entry.render(),                          // md は Astro に描画させる
    source: (isHtml ? 'microcms' : 'markdown') as const, // 既存分岐を再利用するための互換値
  };
}

export async function fetchAllBlogs(): Promise<UnifiedBlogEntry[]> {
  const entries = await getCollection('blog');
  return entries.map((e) => toUnified(e, e.slug));
}

export async function fetchAllEmonicles(): Promise<UnifiedEmonicleEntry[]> {
  const entries = await getCollection('emonicle');
  return entries.map((e) => toUnified(e, e.slug));
}

export async function fetchAllDiaries(): Promise<UnifiedDiaryEntry[]> {
  const entries = await getCollection('diary');
  return entries.map((e) => {
    const { year, month, day } = getDateParts(e.data.pubDate); // JST固定の既存関数
    return toUnified(e, `${year}/${month}/${day}`);
  });
}
