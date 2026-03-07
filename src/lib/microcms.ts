import { createClient } from 'microcms-js-sdk';

// microCMSクライアント初期化
export const microCMSClient = createClient({
  serviceDomain: import.meta.env.MICROCMS_SERVICE_DOMAIN,
  apiKey: import.meta.env.MICROCMS_API_KEY,
});

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
