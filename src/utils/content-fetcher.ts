import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import { microCMSClient, type MicroCMSBlog, type MicroCMSDiary, type MicroCMSEmonicle } from '../lib/microcms';

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

// microCMS BlogエントリーをContent Collections互換形式に変換
function convertMicroCMSBlogToEntry(cms: MicroCMSBlog): UnifiedBlogEntry {
  return {
    id: cms.id, // microCMSのcontentID（URL用）
    slug: cms.id, // microCMSのcontentID
    data: {
      // id フィールドは削除（microCMSエントリーには不要）
      title: cms.title,
      description: cms.description,
      date: new Date(cms.date),
      tags: cms.tags,
      draft: cms.draft,
      image: cms.image,
    },
    body: cms.content, // リッチエディタのHTML
    render: async () => {
      // HTMLをそのまま返す（set:html用）
      const htmlContent = cms.content;
      return {
        Content: () => htmlContent,
      };
    },
    source: 'microcms',
  };
}

// microCMS DiaryエントリーをContent Collections互換形式に変換
function convertMicroCMSDiaryToEntry(cms: MicroCMSDiary): UnifiedDiaryEntry {
  // 日付からslugを生成（YYYY/MM/DD形式）
  const dateObj = new Date(cms.date);
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const slug = `${year}/${month}/${day}`;

  return {
    id: cms.id,
    slug,
    data: {
      title: cms.title,
      description: cms.description,
      date: new Date(cms.date),
      weather: cms.weather,
      condition: cms.condition,
      image: cms.image,
      draft: cms.draft,
    },
    body: cms.content, // リッチエディタのHTML
    render: async () => {
      // HTMLをそのまま返す（set:html用）
      const htmlContent = cms.content;
      return {
        Content: () => htmlContent,
      };
    },
    source: 'microcms',
  };
}

// microCMS EmonicleエントリーをContent Collections互換形式に変換
function convertMicroCMSEmonicleToEntry(cms: MicroCMSEmonicle): UnifiedEmonicleEntry {
  return {
    id: cms.id, // microCMSのcontentID（URL用）
    slug: cms.id, // microCMSのcontentID
    data: {
      // id フィールドは削除（microCMSエントリーには不要）
      title: cms.title,
      description: cms.description,
      date: new Date(cms.date),
      draft: cms.draft,
      image: cms.image,
    },
    body: cms.content, // リッチエディタのHTML
    render: async () => {
      // HTMLをそのまま返す（set:html用）
      const htmlContent = cms.content;
      return {
        Content: () => htmlContent,
      };
    },
    source: 'microcms',
  };
}

// ハイブリッドフェッチ: Markdown + microCMS
export async function fetchAllBlogs(): Promise<UnifiedBlogEntry[]> {
  try {
    // Markdownエントリー取得
    const markdownPosts = await getCollection('blog');
    const mdEntries: UnifiedBlogEntry[] = markdownPosts.map(post => ({
      ...post,
      body: '', // Content Collectionsではbodyは直接アクセス不可
      source: 'markdown' as const,
    }));

    // microCMSエントリー取得（ページネーション対応）
    let allCmsEntries: MicroCMSBlog[] = [];
    let offset = 0;
    const limit = 100; // microCMSの最大limit

    while (true) {
      const cmsResponse = await microCMSClient.getList<MicroCMSBlog>({
        endpoint: 'blog',
        queries: { limit, offset },
      });

      allCmsEntries = [...allCmsEntries, ...cmsResponse.contents];

      // 全件取得したら終了
      if (cmsResponse.contents.length < limit) {
        break;
      }
      offset += limit;
    }

    const cmsEntries = allCmsEntries.map(convertMicroCMSBlogToEntry);

    // 重複排除: microCMSを優先（customIdで比較）
    const cmsCustomIdSet = new Set(allCmsEntries.map(cms => cms.customId));
    const uniqueMdEntries = mdEntries.filter(e => e.data.id !== undefined && !cmsCustomIdSet.has(e.data.id));

    // microCMS + ユニークなMarkdownを統合して返す
    return [...cmsEntries, ...uniqueMdEntries];
  } catch (error) {
    console.error('Error fetching blogs:', error);
    // microCMSでエラーが発生してもMarkdownエントリーは返す
    const markdownPosts = await getCollection('blog');
    return markdownPosts.map(post => ({
      ...post,
      body: '',
      source: 'markdown' as const,
    }));
  }
}

export async function fetchAllDiaries(): Promise<UnifiedDiaryEntry[]> {
  try {
    const markdownEntries = await getCollection('diary');
    const mdEntries: UnifiedDiaryEntry[] = markdownEntries.map(entry => ({
      ...entry,
      body: '',
      source: 'markdown' as const,
    }));

    // microCMSエントリー取得（ページネーション対応）
    let allCmsEntries: MicroCMSDiary[] = [];
    let offset = 0;
    const limit = 100;

    while (true) {
      const cmsResponse = await microCMSClient.getList<MicroCMSDiary>({
        endpoint: 'diary',
        queries: { limit, offset },
      });

      allCmsEntries = [...allCmsEntries, ...cmsResponse.contents];

      if (cmsResponse.contents.length < limit) {
        break;
      }
      offset += limit;
    }

    const cmsEntries = allCmsEntries.map(convertMicroCMSDiaryToEntry);

    // 重複排除: microCMSを優先
    const cmsSlugSet = new Set(cmsEntries.map(e => e.slug));
    const uniqueMdEntries = mdEntries.filter(e => !cmsSlugSet.has(e.slug));

    // microCMS + ユニークなMarkdownを統合して返す
    return [...cmsEntries, ...uniqueMdEntries];
  } catch (error) {
    console.error('Error fetching diaries:', error);
    const markdownEntries = await getCollection('diary');
    return markdownEntries.map(entry => ({
      ...entry,
      body: '',
      source: 'markdown' as const,
    }));
  }
}

export async function fetchAllEmonicles(): Promise<UnifiedEmonicleEntry[]> {
  try {
    const markdownEntries = await getCollection('emonicle');
    const mdEntries: UnifiedEmonicleEntry[] = markdownEntries.map(entry => ({
      ...entry,
      body: '',
      source: 'markdown' as const,
    }));

    // microCMSエントリー取得（ページネーション対応）
    let allCmsEntries: MicroCMSEmonicle[] = [];
    let offset = 0;
    const limit = 100;

    while (true) {
      const cmsResponse = await microCMSClient.getList<MicroCMSEmonicle>({
        endpoint: 'emonicle',
        queries: { limit, offset },
      });

      allCmsEntries = [...allCmsEntries, ...cmsResponse.contents];

      if (cmsResponse.contents.length < limit) {
        break;
      }
      offset += limit;
    }

    const cmsEntries = allCmsEntries.map(convertMicroCMSEmonicleToEntry);

    // 重複排除: microCMSを優先（customIdで比較）
    const cmsCustomIdSet = new Set(allCmsEntries.map(cms => cms.customId));
    const uniqueMdEntries = mdEntries.filter(e => e.data.id !== undefined && !cmsCustomIdSet.has(e.data.id));

    // microCMS + ユニークなMarkdownを統合して返す
    return [...cmsEntries, ...uniqueMdEntries];
  } catch (error) {
    console.error('Error fetching emonicles:', error);
    const markdownEntries = await getCollection('emonicle');
    return markdownEntries.map(entry => ({
      ...entry,
      body: '',
      source: 'markdown' as const,
    }));
  }
}
