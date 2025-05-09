import rss from '@astrojs/rss';
import { siteConfig } from '../config';
import { getCollection } from 'astro:content';

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
      link: context.site + diaryCollection + '/' + post.data.date.getFullYear() + '/' + (post.data.date.getMonth() + 1).toString().padStart(2, '0') + '/' + post.data.date.getDate().toString().padStart(2, '0'),
      pubDate: post.data.date,
      content: post.body
  }));
  const allItems = [...blogItems, ...diaryItems];
  const rssXml = await rss({
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

  // Create a new response with shorter cache time (5 minutes)
  return new Response(rssXml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=300' // 5 minutes in seconds
    }
  });
}
