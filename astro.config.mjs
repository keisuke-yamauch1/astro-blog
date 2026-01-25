import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import rehypePrettyCode from 'rehype-pretty-code';
import { siteConfig } from './src/config';
import mdx from '@astrojs/mdx';
import embeds from 'astro-embed/integration';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';

import {
  remarkBreaksForDiary,
  remarkSpotifyEmbed,
  rehypeTargetBlank,
  rehypeCodeTitle,
  rehypeImageNotProse,
} from './src/plugins';

export default defineConfig({
  site: siteConfig.site,
  output: 'static',
  adapter: vercel(),
  integrations: [tailwind(), embeds({
    // Configure YouTube to use English UI
    services: {
      YouTube: {
        params: 'hl=en&rel=0'
      },
      Tweet: true,
      Vimeo: true,
      LinkPreview: false
    }
  }), sitemap(), mdx()],
  markdown: {
    remarkPlugins: [remarkSpotifyEmbed, remarkBreaksForDiary],
    rehypePlugins: [
      [rehypePrettyCode, {
        theme: {
          light: 'github-light',
          dark: 'github-dark'
        },
        onVisitLine(node) {
          if (node.children.length === 0) {
            node.children = [{type: 'text', value: ' '}];
          }
        },
      }],
      rehypeTargetBlank,
      rehypeImageNotProse,
    ],
  },
});
