import { useEffect, useState } from 'preact/hooks';
import useSWR from 'swr';
import {
  fetchPreviewContent,
  type ContentType,
  type PreviewContent,
  type MicroCMSBlog,
  type MicroCMSDiary,
  type MicroCMSEmonicle,
} from '../lib/microcms/index';
import { formatDate } from '../utils/date';

interface PreviewContainerProps {
  serviceDomain: string;
  apiKey: string;
}

export default function PreviewContainer(props: PreviewContainerProps) {
  const { serviceDomain, apiKey } = props;
  const [contentId, setContentId] = useState<string>('');
  const [draftKey, setDraftKey] = useState<string>('');
  const [contentType, setContentType] = useState<ContentType | null>(null);
  const [error, setError] = useState<string | null>(null);

  // URLクエリパラメータを解析
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const id = params.get('contentId');
    const key = params.get('draftKey');
    const type = params.get('type') as ContentType;

    if (!id || !key || !type) {
      setError('必須パラメータが不足しています: contentId, draftKey, type');
      return;
    }

    if (!['blog', 'diary', 'emonicle'].includes(type)) {
      setError(`無効なコンテンツタイプ: ${type}`);
      return;
    }

    setContentId(id);
    setDraftKey(key);
    setContentType(type);
  }, []);

  // コンテンツ更新後にiframelyを再初期化
  const { data, error: swrError, isLoading } = useSWR(
    contentId && draftKey && contentType
      ? ['preview', contentId, draftKey, contentType]
      : null,
    () => fetchPreviewContent(serviceDomain, apiKey, contentId, draftKey, contentType!),
    {
      refreshInterval: 3000, // 3秒ごとに自動更新
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  // コンテンツ更新後にiframelyを再初期化
  useEffect(() => {
    if (data && typeof window !== 'undefined') {
      setTimeout(() => {
        if ((window as any).iframely) {
          (window as any).iframely.load();
        }
      }, 100);
    }
  }, [data]);

  // エラーハンドリング
  if (error) {
    return (
      <div class="max-w-3xl mx-auto px-4 py-12">
        <div class="bg-red-100 dark:bg-red-900 border-l-4 border-red-500 p-4 rounded">
          <p class="text-red-800 dark:text-red-200">
            <strong>エラー:</strong> {error}
          </p>
        </div>
      </div>
    );
  }

  if (swrError) {
    return (
      <div class="max-w-3xl mx-auto px-4 py-12">
        <div class="bg-red-100 dark:bg-red-900 border-l-4 border-red-500 p-4 rounded">
          <p class="text-red-800 dark:text-red-200">
            <strong>コンテンツの取得に失敗しました:</strong>{' '}
            {swrError.message || '不明なエラー'}
          </p>
        </div>
      </div>
    );
  }

  // ローディング状態
  if (isLoading || !data) {
    return (
      <div class="max-w-3xl mx-auto px-4 py-12">
        <div class="animate-pulse">
          <div class="h-8 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
          <div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/4 mb-8"></div>
          <div class="space-y-3">
            <div class="h-4 bg-gray-300 dark:bg-gray-700 rounded"></div>
            <div class="h-4 bg-gray-300 dark:bg-gray-700 rounded"></div>
            <div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  // コンテンツタイプ別の表示
  return (
    <div>
      {/* プレビューバナー */}
      <div class="bg-blue-600 text-white py-3 px-4 sticky top-0 z-50 shadow-md">
        <div class="max-w-3xl mx-auto flex justify-between items-center">
          <div class="flex items-center gap-2">
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            <span class="font-semibold">プレビューモード</span>
            <span class="text-blue-200 text-sm">(3秒ごとに自動更新)</span>
          </div>
          <a
            href={`https://${serviceDomain}.microcms.io/`}
            target="_blank"
            rel="noopener noreferrer"
            class="text-sm underline hover:text-blue-200"
          >
            microCMSに戻る
          </a>
        </div>
      </div>

      {/* コンテンツ表示 */}
      <article class="max-w-3xl mx-auto px-4 py-8">
        {contentType === 'blog' && <BlogPreview content={data as MicroCMSBlog} />}
        {contentType === 'diary' && <DiaryPreview content={data as MicroCMSDiary} />}
        {contentType === 'emonicle' && <EmoniclePreview content={data as MicroCMSEmonicle} />}
      </article>
    </div>
  );
}

// Blog用プレビューコンポーネント
function BlogPreview({ content }: { content: MicroCMSBlog }) {
  return (
    <>
      {content.image && (
        <img
          src={content.image}
          alt={content.title}
          class="w-full h-[400px] object-cover rounded-xl shadow-lg mb-8"
        />
      )}
      <header class="mb-12">
        <h1 class="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-gray-100">
          {content.title}
        </h1>
        <div class="mb-6 text-gray-600 dark:text-gray-300">
          <time>{formatDate(new Date(content.date))}</time>
        </div>
        {content.tags && content.tags.length > 0 && (
          <div class="flex flex-wrap gap-2">
            {content.tags.map((tag) => (
              <span
                key={tag}
                class="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </header>
      <div
        class="prose prose-lg dark:prose-invert max-w-none [&_.iframely-embed]:my-6"
        dangerouslySetInnerHTML={{ __html: content.content }}
      />
    </>
  );
}

// Diary用プレビューコンポーネント
function DiaryPreview({ content }: { content: MicroCMSDiary }) {
  return (
    <>
      {content.draft && (
        <div class="bg-yellow-100 dark:bg-yellow-900 border-l-4 border-yellow-500 p-4 mb-8 rounded">
          <p class="text-yellow-800 dark:text-yellow-200">
            <strong>下書き:</strong> この記事はまだ公開されていません。
          </p>
        </div>
      )}
      {content.image && (
        <img
          src={content.image}
          alt={content.title}
          class="w-full h-[400px] object-cover rounded-xl shadow-lg mb-8"
        />
      )}
      <header class="mb-12">
        <h1 class="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-gray-100">
          {content.title}
        </h1>
        <div class="flex flex-col sm:flex-row gap-2 sm:gap-6 text-gray-600 dark:text-gray-300">
          <div class="flex items-center">
            <span class="font-semibold mr-2 min-w-[2.5em]">日付:</span>
            <span>{formatDate(new Date(content.date))}</span>
          </div>
          {content.weather && (
            <div class="flex items-center">
              <span class="font-semibold mr-2 min-w-[2.5em]">天気:</span>
              <span>{content.weather}</span>
            </div>
          )}
          {content.condition && (
            <div class="flex items-center">
              <span class="font-semibold mr-2 min-w-[2.5em]">調子:</span>
              <span>{content.condition}</span>
            </div>
          )}
        </div>
      </header>
      <div
        class="prose prose-lg dark:prose-invert max-w-none diary-content [&_.iframely-embed]:my-6"
        dangerouslySetInnerHTML={{ __html: content.content }}
      />
    </>
  );
}

// Emonicle用プレビューコンポーネント
function EmoniclePreview({ content }: { content: MicroCMSEmonicle }) {
  return (
    <>
      {content.image && (
        <img
          src={content.image}
          alt={content.title}
          class="w-full h-[400px] object-cover rounded-xl shadow-lg mb-8"
        />
      )}
      <header class="mb-12">
        <h1 class="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-gray-100">
          {content.title}
        </h1>
        <div class="mb-6 text-gray-600 dark:text-gray-300">
          <time>{formatDate(new Date(content.date))}</time>
        </div>
      </header>
      <div
        class="prose prose-lg dark:prose-invert max-w-none [&_.iframely-embed]:my-6"
        dangerouslySetInnerHTML={{ __html: content.content }}
      />
    </>
  );
}
