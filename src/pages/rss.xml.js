import rss from '@astrojs/rss';
import MarkdownIt from 'markdown-it';
import { siteConfig } from '../config';
import { fetchAllBlogs, fetchAllDiaries, fetchAllEmonicles } from '../lib/content';
import { filterPublishedPosts, filterPublishedEmonicles } from '../utils/posts';
import { getDiaryPath } from '../utils/date';

const md = new MarkdownIt({ html: true, linkify: true });

// microCMS移行分（format: html）は生HTML、md記事はMarkdownをHTMLに変換して載せる。
// remarkプラグイン（埋め込み・空行）はRSSには効かないが、リンクのまま載れば十分。
function toRssContent(post) {
  return post.source === 'microcms' ? post.body : md.render(post.body);
}

export async function GET(context) {
  // Blog
  const blog = await fetchAllBlogs();
  const publishedBlogs = filterPublishedPosts(blog);
  const blogItems = publishedBlogs.map((post) => ({
    title: post.data.title,
    description: post.data.description || '',
    link: context.site + 'blog/' + post.id,
    pubDate: post.data.date,
    content: toRssContent(post),
  }));

  // Diary
  const diary = await fetchAllDiaries();
  const publishedDiaries = filterPublishedPosts(diary);
  const diaryItems = publishedDiaries.map((post) => ({
    title: post.data.title,
    description: '',
    link: context.site + getDiaryPath(post.data.date).slice(1),
    pubDate: post.data.date,
    content: toRssContent(post),
  }));

  // Emonicle
  const emonicle = await fetchAllEmonicles();
  const publishedEmonicles = filterPublishedEmonicles(emonicle);
  const emonicleItems = publishedEmonicles.map((post) => ({
    title: post.data.title,
    description: post.data.description || '',
    link: context.site + 'emonicle/' + post.id,
    pubDate: post.data.date,
    content: toRssContent(post),
  }));

  const allItems = [...blogItems, ...diaryItems, ...emonicleItems];

  return rss({
    title: siteConfig.title,
    description: siteConfig.description || siteConfig.slogan,
    site: context.site,
    items: allItems,
  });
}
