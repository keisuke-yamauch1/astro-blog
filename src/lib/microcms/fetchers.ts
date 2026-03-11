import { microCMSClient } from './client';
import { convertMicroCMSBlogToEntry, convertMicroCMSDiaryToEntry, convertMicroCMSEmonicleToEntry } from './converters';
import type { MicroCMSBlog, MicroCMSDiary, MicroCMSEmonicle, UnifiedBlogEntry, UnifiedDiaryEntry, UnifiedEmonicleEntry } from './types';

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
