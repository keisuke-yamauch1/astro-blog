import type { MicroCMSQueries } from 'microcms-js-sdk';
import { createClientForPreview } from './client';
import type { ContentType, MicroCMSBlog, MicroCMSDiary, MicroCMSEmonicle, PreviewContent } from './types';

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
