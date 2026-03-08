import rss from '@astrojs/rss';
import { siteConfig } from '../config';
import { fetchAllBlogs, fetchAllDiaries, fetchAllEmonicles } from '../utils/content-fetcher';
import { filterPublishedPosts, filterPublishedEmonicles } from '../utils/posts';
import { getDiaryPath } from '../utils/date';

export async function GET(context) {
  // Blog
  const blog = await fetchAllBlogs();
  const publishedBlogs = filterPublishedPosts(blog);
  const blogItems = publishedBlogs.map((post) => {
    const content = post.source === 'microcms'
      ? post.body // microCMSはHTMLコンテンツ
      : post.body; // MarkdownもMarkdownコンテンツ（Astroが処理）

    return {
      title: post.data.title,
      description: post.data.description || '',
      link: context.site + 'blog/' + post.id,
      pubDate: post.data.date,
      content: content
    };
  });

  // Diary
  const diary = await fetchAllDiaries();
  const publishedDiaries = filterPublishedPosts(diary);
  const diaryItems = publishedDiaries.map((post) => {
    const content = post.source === 'microcms'
      ? post.body
      : post.body;

    return {
      title: post.data.title,
      description: post.data.title,
      link: context.site + getDiaryPath(post.data.date).slice(1),
      pubDate: post.data.date,
      content: content
    };
  });

  // Emonicle
  const emonicle = await fetchAllEmonicles();
  const publishedEmonicles = filterPublishedEmonicles(emonicle);
  const emonicleItems = publishedEmonicles.map((post) => {
    const content = post.source === 'microcms'
      ? post.body
      : post.body;

    return {
      title: post.data.title,
      description: post.data.description || '',
      link: context.site + 'emonicle/' + post.id,
      pubDate: post.data.date,
      content: content
    };
  });

  const allItems = [...blogItems, ...diaryItems, ...emonicleItems];

  return rss({
    title: siteConfig.title,
    description: siteConfig.description || siteConfig.slogan,
    site: context.site,
    items: allItems,
  });
}
