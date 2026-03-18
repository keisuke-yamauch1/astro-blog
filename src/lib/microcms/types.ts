// Blog型定義
export interface MicroCMSBlog {
  id: string;
  title: string;
  description?: string;
  content: string;
  date: string;
  tags?: string[];
  draft: boolean;
  image?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  revisedAt?: string;
}

// Diary型定義
export interface MicroCMSDiary {
  id: string;
  title: string;
  description: string;
  content: string;
  date: string;
  weather?: string;
  condition?: string;
  image?: string;
  draft: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  revisedAt?: string;
}

// Emonicle型定義
export interface MicroCMSEmonicle {
  id: string;
  title: string;
  description?: string;
  content: string;
  date: string;
  draft: boolean;
  image?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  revisedAt?: string;
}

// コンテンツタイプのユニオン型
export type ContentType = 'blog' | 'diary' | 'emonicle';
export type PreviewContent = MicroCMSBlog | MicroCMSDiary | MicroCMSEmonicle;

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
    description: string;
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
