import type { Root } from 'hast';
import { visit } from 'unist-util-visit';
import { siteConfig } from '../config';

/**
 * Rehype plugin to add target="_blank" to external links only.
 * Internal links (starting with "/", "#", or the site's own URL) open in the same tab.
 */
export function rehypeTargetBlank() {
  const siteOrigin = new URL(siteConfig.site).origin;

  return (tree: Root) => {
    visit(tree, 'element', (node) => {
      if (node.tagName === 'a') {
        node.properties = node.properties || {};
        const href = String(node.properties.href || '');
        const isInternal =
          !href ||
          href.startsWith('/') ||
          href.startsWith('#') ||
          href.startsWith(siteOrigin);
        if (isInternal) {
          // 内部リンクから target="_blank" を明示的に削除
          delete node.properties.target;
        } else {
          node.properties.target = '_blank';
        }
      }
    });
  };
}
