import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import rehypePrettyCode from 'rehype-pretty-code';
import { siteConfig } from './src/config';
import { visit } from 'unist-util-visit';

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

export default defineConfig({
  site: siteConfig.site,
  integrations: [tailwind(), sitemap()],
  markdown: {
    rehypePlugins: [
      [rehypePrettyCode, {
        theme: 'github-dark',
        onVisitLine(node) {
          if (node.children.length === 0) {
            node.children = [{type: 'text', value: ' '}];
          }
        },
      }],
      rehypeTargetBlank,
    ],
  },
});
