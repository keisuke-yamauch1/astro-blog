import type { Root } from 'hast';
import { visit } from 'unist-util-visit';

/**
 * Rehype plugin to add target="_blank" to all links.
 * This ensures all links open in a new tab.
 */
export function rehypeTargetBlank() {
  return (tree: Root) => {
    visit(tree, 'element', (node) => {
      if (node.tagName === 'a') {
        node.properties = node.properties || {};
        node.properties.target = '_blank';
      }
    });
  };
}
