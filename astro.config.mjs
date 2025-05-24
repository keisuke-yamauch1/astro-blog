import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import rehypePrettyCode from 'rehype-pretty-code';
import { siteConfig } from './src/config';
import { visit } from 'unist-util-visit';
import mdx from '@astrojs/mdx';

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
  integrations: [tailwind(), sitemap(), mdx()],
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
      rehypeImageNotProse,
    ],
  },
});
