import { createClient } from 'microcms-js-sdk';
import dotenv from 'dotenv';

dotenv.config();

const client = createClient({
  serviceDomain: process.env.MICROCMS_SERVICE_DOMAIN,
  apiKey: process.env.MICROCMS_API_KEY,
});

// Blog ID 13 を取得（customId=13で検索）
const response = await client.getList({
  endpoint: 'blog',
  queries: {
    filters: 'customId[equals]13',
    limit: 1,
  },
});

if (response.contents.length > 0) {
  const blog = response.contents[0];
  console.log('✅ microCMSに移行されています\n');
  console.log('Title:', blog.title);
  console.log('Description:', blog.description);
  console.log('Date:', blog.date);
  console.log('Tags:', blog.tags);
  console.log('Draft:', blog.draft);
  console.log('Content length:', blog.content.length, 'characters');
  console.log('\nContent preview (first 200 chars):');
  console.log(blog.content.substring(0, 200) + '...');
} else {
  console.log('❌ microCMSに見つかりませんでした');
}
