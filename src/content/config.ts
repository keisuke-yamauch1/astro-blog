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

const journal = defineCollection({
  schema: z.object({
    title: z.string(),
    date: z.date(),
    weather: z.string().optional(),
    image: z.string().optional(),
  }),
});

export const collections = { blog, journal };
