import { defineCollection, z } from 'astro:content';

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

export const collections = { profile, home };
