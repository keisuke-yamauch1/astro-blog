import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import rehypePrettyCode from 'rehype-pretty-code';
import { siteConfig } from './src/config';
import { visit } from 'unist-util-visit';
import mdx from '@astrojs/mdx';
import embeds from 'astro-embed/integration';
import vercel from '@astrojs/vercel';
import remarkBreaks from 'remark-breaks';

import sitemap from '@astrojs/sitemap';

// Custom remark plugin to apply remark-breaks only to diary collection
function remarkBreaksForDiary() {
  return (tree, file) => {
    const filePath = file.path || file.history[file.history.length - 1] || '';

    // Apply remark-breaks only to files in /content/diary/
    if (filePath.includes('/content/diary/')) {
      const breaksPlugin = remarkBreaks();
      return breaksPlugin(tree, file);
    }
  };
}

// Custom rehype plugin to add target="_blank" to all links
function rehypeTargetBlank() {
  return (tree) => {
    visit(tree, 'element', (node) => {
      if (node.tagName === 'a') {
        node.properties = node.properties || {};
        node.properties.target = '_blank';
      }
    });
  };
}

// https://astro.build/config
function rehypeCodeTitle() {
  return (tree) => {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'pre' || !node.properties?.className?.some(c => c.startsWith('language-'))) return;

      const [lang, title] = node.properties.className[0].replace('language-', '').split(':');
      if (!title) return;

      node.properties.className[0] = `language-${lang}`;

      const titleNode = {
        type: 'element',
        tagName: 'div',
        properties: { className: ['code-title'] },
        children: [{ type: 'text', value: title }]
      };

      parent.children.splice(index, 0, titleNode);
    });
  };
}

// Custom rehype plugin to add not-prose class to all images
function rehypeImageNotProse() {
  return (tree) => {
    visit(tree, 'element', (node) => {
      if (node.tagName === 'img') {
        node.properties = node.properties || {};
        node.properties.class = node.properties.class
          ? `${node.properties.class} not-prose`
          : 'not-prose';
      }
    });
  };
}

export default defineConfig({
  site: siteConfig.site,
  output: 'hybrid',
  adapter: vercel(),
  integrations: [tailwind(), embeds({
    // Configure YouTube to use English UI
    services: {
      YouTube: {
        params: 'hl=en&rel=0'
      },
      Tweet: true,
      Vimeo: true,
      LinkPreview: true
    }
  }), sitemap(), mdx()],
  markdown: {
    remarkPlugins: [remarkBreaksForDiary],
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
