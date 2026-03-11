import { fetchAllBlogs, fetchAllDiaries, fetchAllEmonicles } from '../../lib/microcms';

export async function GET() {
  const blogPosts = await fetchAllBlogs();
  const diaryPosts = await fetchAllDiaries();
  const emoniclePosts = await fetchAllEmonicles();

  const searchData = await Promise.all([
    // Blog posts
    ...blogPosts.map(async (post) => {
      if (post.data.draft) {
        return null;
      }

      // microCMSのコンテンツはHTMLなので、HTMLタグを除去
      let cleanContent = post.body;
      if (post.source === 'microcms') {
        cleanContent = post.body.replace(/<[^>]*>/g, ' '); // HTMLタグを除去
      } else {
        cleanContent = post.body.replace(/!\[.*?\]\(.*?\)/g, '')
          .replace(/<img[^>]*>/g, '')
          .replace(/<(video|audio)[^>]*>.*?<\/(video|audio)>/gs, '')
          .replace(/\.(png|jpg|jpeg|gif|webp|svg|avif|mp4|webm|mp3|wav|ogg)/gi, '');
      }

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
      let cleanContent = post.body;
      if (post.source === 'microcms') {
        cleanContent = post.body.replace(/<[^>]*>/g, ' ');
      } else {
        cleanContent = post.body.replace(/!\[.*?\]\(.*?\)/g, '')
          .replace(/<img[^>]*>/g, '')
          .replace(/<(video|audio)[^>]*>.*?<\/(video|audio)>/gs, '')
          .replace(/\.(png|jpg|jpeg|gif|webp|svg|avif|mp4|webm|mp3|wav|ogg)/gi, '');
      }

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

      let cleanContent = post.body;
      if (post.source === 'microcms') {
        cleanContent = post.body.replace(/<[^>]*>/g, ' ');
      } else {
        cleanContent = post.body.replace(/!\[.*?\]\(.*?\)/g, '')
          .replace(/<img[^>]*>/g, '')
          .replace(/<(video|audio)[^>]*>.*?<\/(video|audio)>/gs, '')
          .replace(/\.(png|jpg|jpeg|gif|webp|svg|avif|mp4|webm|mp3|wav|ogg)/gi, '');
      }

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
