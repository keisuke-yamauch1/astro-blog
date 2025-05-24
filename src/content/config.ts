import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  // Allow both .md and .mdx files in the blog collection
  type: 'content',
  schema: z.object({
    id: z.number(),
    title: z.string(),
    description: z.string().optional(),
    date: z.date(),
    tags: z.array(z.string()).optional(),
    draft: z.boolean().optional(),
    image: z.string().optional(),
  }),
});

const diary = defineCollection({
  // Allow both .md and .mdx files in the diary collection
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.date(),
    weather: z.string().optional(),
    image: z.string().optional(),
  }),
});

const profile = defineCollection({
  type: 'content',
  schema: z.object({
  }),
});

export const collections = { blog, diary, profile };
