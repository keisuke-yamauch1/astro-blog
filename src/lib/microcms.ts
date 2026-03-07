import { createClient, type MicroCMSQueries } from 'microcms-js-sdk';

// microCMSクライアント初期化（サーバーサイド用）
// ⚠️ クライアント側で実行されないように条件付きで初期化
export const microCMSClient = typeof window === 'undefined'
  ? createClient({
      serviceDomain: import.meta.env.MICROCMS_SERVICE_DOMAIN || '',
      apiKey: import.meta.env.MICROCMS_API_KEY || '',
    })
  : null as any;

// microCMSクライアント初期化（クライアントサイド用）
// ⚠️ ブラウザで実行されるため、環境変数をPropsとして受け取る
export function createClientForPreview(serviceDomain: string, apiKey: string) {
  if (typeof window === 'undefined') {
    throw new Error('createClientForPreview can only be used in the browser');
  }

  return createClient({
    serviceDomain,
    apiKey,
  });
}

// Blog型定義
export interface MicroCMSBlog {
  id: string;
  customId: number;
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
  customId: number;
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

// プレビュー用コンテンツ取得関数
export async function fetchPreviewContent(
  serviceDomain: string,
  apiKey: string,
  contentId: string,
  draftKey: string,
  type: ContentType
): Promise<PreviewContent> {
  const client = createClientForPreview(serviceDomain, apiKey);

  const queries: MicroCMSQueries = {
    draftKey,
  };

  switch (type) {
    case 'blog':
      return await client.get<MicroCMSBlog>({
        endpoint: 'blog',
        contentId,
        queries,
      });
    case 'diary':
      return await client.get<MicroCMSDiary>({
        endpoint: 'diary',
        contentId,
        queries,
      });
    case 'emonicle':
      return await client.get<MicroCMSEmonicle>({
        endpoint: 'emonicle',
        contentId,
        queries,
      });
    default:
      throw new Error(`Unknown content type: ${type}`);
  }
}
