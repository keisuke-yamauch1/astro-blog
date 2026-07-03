// Content Collections（.md 直読み）用の Unified* 型。
// 旧 src/lib/microcms/types.ts から移設。ページ側は data.date / data.image / source を参照するため、
// microCMS 時代と同じ形を維持している（import 差し替えだけで済むように）。

// コンテンツタイプのユニオン型
export type ContentType = 'blog' | 'diary' | 'emonicle';

// Unified Blog Entry型
export interface UnifiedBlogEntry {
  id: string;
  slug: string;
  data: {
    id?: number; // Markdownエントリー用（optional）
    title: string;
    description?: string;
    date: Date;
    tags?: string[];
    draft?: boolean;
    image?: string;
  };
  body: string;
  render: () => Promise<{ Content: any }>;
  source: 'markdown' | 'microcms';
}

// Unified Diary Entry型
export interface UnifiedDiaryEntry {
  id: string;
  slug: string;
  data: {
    title: string;
    description?: string;
    date: Date;
    weather?: string;
    condition?: string;
    image?: string;
    draft?: boolean;
  };
  body: string;
  render: () => Promise<{ Content: any }>;
  source: 'markdown' | 'microcms';
}

// Unified Emonicle Entry型
export interface UnifiedEmonicleEntry {
  id: string;
  slug: string;
  data: {
    id?: number; // Markdownエントリー用（optional）
    title: string;
    description?: string;
    date: Date;
    draft?: boolean;
    image?: string;
  };
  body: string;
  render: () => Promise<{ Content: any }>;
  source: 'markdown' | 'microcms';
}
