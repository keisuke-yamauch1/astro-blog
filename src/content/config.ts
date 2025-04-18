import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
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
  schema: z.object({
    title: z.string(),
    date: z.date(),
    weather: z.string().optional(),
    image: z.string().optional(),
  }),
});

const profile = defineCollection({
  schema: z.object({
  }),
  type: 'content',
});

export const collections = { blog, diary, profile };
