import type { Root, Element } from 'hast';
import { visit } from 'unist-util-visit';

/**
 * Rehype plugin to support code block titles using `language:title` syntax.
 * Example: ```typescript:example.ts will add a title "example.ts" above the code block.
 */
export function rehypeCodeTitle() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element, index, parent) => {
      if (
        node.tagName !== 'pre' ||
        !Array.isArray(node.properties?.className) ||
        !node.properties.className.some((c) => typeof c === 'string' && c.startsWith('language-'))
      ) {
        return;
      }

      const langClass = node.properties.className.find(
        (c): c is string => typeof c === 'string' && c.startsWith('language-')
      );
      if (!langClass) return;

      const [lang, title] = langClass.replace('language-', '').split(':');
      if (!title) return;

      node.properties.className = node.properties.className.map((c) =>
        c === langClass ? `language-${lang}` : c
      );

      const titleNode: Element = {
        type: 'element',
        tagName: 'div',
        properties: { className: ['code-title'] },
        children: [{ type: 'text', value: title }],
      };

      if (parent && typeof index === 'number') {
        parent.children.splice(index, 0, titleNode);
      }
    });
  };
}
