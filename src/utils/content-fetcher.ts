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

// microCMSからブログを取得
export async function fetchAllBlogs(): Promise<UnifiedBlogEntry[]> {
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

  return allCmsEntries.map(convertMicroCMSBlogToEntry);
}

// microCMSから日記を取得
export async function fetchAllDiaries(): Promise<UnifiedDiaryEntry[]> {
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

  return allCmsEntries.map(convertMicroCMSDiaryToEntry);
}

// microCMSからエモニクルを取得
export async function fetchAllEmonicles(): Promise<UnifiedEmonicleEntry[]> {
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

  return allCmsEntries.map(convertMicroCMSEmonicleToEntry);
}
