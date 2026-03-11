import { getDateParts } from '../../utils/date';
import type {
  MicroCMSBlog,
  MicroCMSDiary,
  MicroCMSEmonicle,
  UnifiedBlogEntry,
  UnifiedDiaryEntry,
  UnifiedEmonicleEntry,
} from './types';

// microCMS BlogエントリーをContent Collections互換形式に変換
export function convertMicroCMSBlogToEntry(cms: MicroCMSBlog): UnifiedBlogEntry {
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
export function convertMicroCMSDiaryToEntry(cms: MicroCMSDiary): UnifiedDiaryEntry {
  // 日付からslugを生成（YYYY/MM/DD形式）
  const dateObj = new Date(cms.date);
  const { year, month, day } = getDateParts(dateObj);
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
export function convertMicroCMSEmonicleToEntry(cms: MicroCMSEmonicle): UnifiedEmonicleEntry {
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
