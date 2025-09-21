import { getCollection } from 'astro:content';

export async function GET() {
  const blogPosts = await getCollection('blog');
  const diaryPosts = await getCollection('diary');
  const emoniclePosts = await getCollection('emonicle');

  const searchData = await Promise.all([
    // Blog posts
    ...blogPosts.map(async (post) => {
      if (post.data.draft) {
        return null;
      }

      const cleanContent = post.body.replace(/!\[.*?\]\(.*?\)/g, '')
        .replace(/<img[^>]*>/g, '')
        .replace(/<(video|audio)[^>]*>.*?<\/(video|audio)>/gs, '')
        .replace(/\.(png|jpg|jpeg|gif|webp|svg|avif|mp4|webm|mp3|wav|ogg)/gi, '');

      return {
        title: post.data.title,
        description: post.data.description,
        tags: post.data.tags,
        slug: post.slug,
        content: cleanContent,
        collection: 'blog',
        id: post.data.id,
        date: post.data.date,
      };
    }),

    // Diary posts
    ...diaryPosts.map(async (post) => {
      const cleanContent = post.body.replace(/!\[.*?\]\(.*?\)/g, '')
        .replace(/<img[^>]*>/g, '')
        .replace(/<(video|audio)[^>]*>.*?<\/(video|audio)>/gs, '')
        .replace(/\.(png|jpg|jpeg|gif|webp|svg|avif|mp4|webm|mp3|wav|ogg)/gi, '');

      return {
        title: post.data.title,
        description: post.data.weather ? `天気: ${post.data.weather}` : '',
        tags: [],
        slug: post.slug,
        content: cleanContent,
        collection: 'diary',
        date: post.data.date,
      };
    }),

    // Emonicle posts
    ...emoniclePosts.map(async (post) => {
      if (post.data.draft) {
        return null;
      }

      const cleanContent = post.body.replace(/!\[.*?\]\(.*?\)/g, '')
        .replace(/<img[^>]*>/g, '')
        .replace(/<(video|audio)[^>]*>.*?<\/(video|audio)>/gs, '')
        .replace(/\.(png|jpg|jpeg|gif|webp|svg|avif|mp4|webm|mp3|wav|ogg)/gi, '');

      return {
        title: post.data.title,
        description: post.data.description,
        tags: [],
        slug: post.slug,
        content: cleanContent,
        collection: 'emonicle',
        id: post.data.id,
        date: post.data.date,
      };
    })
  ]);

  // filter out null values
  const filteredData = searchData.filter(Boolean);

  return new Response(JSON.stringify(filteredData), {
    headers: {
      'Content-Type': 'application/json'
    }
  });
}
