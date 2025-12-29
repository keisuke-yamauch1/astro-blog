import rss from '@astrojs/rss';
import { siteConfig } from '../config';
import { getCollection } from 'astro:content';
import { filterPublishedEmonicles } from '../utils/posts';
import { getDiaryPath } from '../utils/date';

export async function GET(context) {
  const blogCollection = 'blog';
  // id,slug,body,collection,data,render
  const blog = await getCollection(blogCollection);
  const blogItems = blog.map((post) => ({
    title: post.data.title,
    description: post.data.description,
    link: context.site + blogCollection + '/' + post.data.id,
    pubDate: post.data.date,
    content: post.body
  }));
  const diaryCollection = 'diary';
  const diary = await getCollection(diaryCollection);
  const diaryItems = diary.map((post) => ({
      title: post.data.title,
      description: post.data.title,
      link: context.site + getDiaryPath(post.data.date).slice(1), // Remove leading slash
      pubDate: post.data.date,
      content: post.body
  }));
  
  const emonicleCollection = 'emonicle';
  const emonicle = await getCollection(emonicleCollection);
  const publishedEmonicles = filterPublishedEmonicles(emonicle);
  const emonicleItems = publishedEmonicles.map((post) => ({
    title: post.data.title,
    description: post.data.description,
    link: context.site + emonicleCollection + '/' + post.data.id,
    pubDate: post.data.date,
    content: post.body
  }));
  
  const allItems = [...blogItems, ...diaryItems, ...emonicleItems];
  return rss({
    // `<title>` field in output xml
    title: siteConfig.title,
    // `<description>` field in output xml
    description: siteConfig.description || siteConfig.slogan,
    // Pull in your project "site" from the endpoint context
    // https://docs.astro.build/en/reference/api-reference/#site
    site: context.site,
    // Array of `<item>`s in output xml
    // See "Generating items" section for examples using content collections and glob imports
    items: allItems,
  });
}
