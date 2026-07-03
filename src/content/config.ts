import { defineCollection, z } from 'astro:content';

// blog / diary / emonicle 共通スキーマ
// blog-cms 側の zod（title/description/tags/pubDate/draft/heroImage）と一致させる。
// format は microCMS 移行分（生HTML本文）の目印。'html' のときは set:html 直描画に回す。
const postSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
  pubDate: z.coerce.date(),
  draft: z.boolean().default(false),
  heroImage: z.string().optional(),
  format: z.enum(['md', 'html']).default('md'),
});

const blog = defineCollection({ type: 'content', schema: postSchema });
const diary = defineCollection({ type: 'content', schema: postSchema });
const emonicle = defineCollection({ type: 'content', schema: postSchema });

const profile = defineCollection({
  type: 'content',
  schema: z.object({
  }),
});

const home = defineCollection({
  type: 'content',
  schema: z.object({
  }),
});

export const collections = { blog, diary, emonicle, profile, home };
