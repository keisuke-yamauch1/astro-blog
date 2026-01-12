import type { Root } from 'hast';
import { visit } from 'unist-util-visit';

/**
 * Rehype plugin to add 'not-prose' class to all images.
 * This prevents Tailwind Typography from styling images.
 */
export function rehypeImageNotProse() {
  return (tree: Root) => {
    visit(tree, 'element', (node) => {
      if (node.tagName === 'img') {
        node.properties = node.properties || {};
        const existingClass = node.properties.class;
        node.properties.class = existingClass ? `${existingClass} not-prose` : 'not-prose';
      }
    });
  };
}
