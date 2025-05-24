import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import rehypePrettyCode from 'rehype-pretty-code';
import { siteConfig } from './src/config';
import { visit } from 'unist-util-visit';
import mdx from '@astrojs/mdx';
import embeds from 'astro-embed/integration';

import sitemap from '@astrojs/sitemap';

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

export default defineConfig({
  site: siteConfig.site,
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
    rehypePlugins: [
      [rehypePrettyCode, {
        theme: 'github-dark',
        keepBackground: false,
      }],
      rehypeTargetBlank,
      rehypeCodeTitle
    ]
  }
});
