import type { Root } from 'mdast';
import type { VFile } from 'vfile';
import remarkBreaks from 'remark-breaks';

/**
 * Custom remark plugin to apply remark-breaks only to diary collection.
 * This allows single line breaks to be rendered as <br> tags in diary entries.
 */
export function remarkBreaksForDiary() {
  return (tree: Root, file: VFile) => {
    const filePath = file.path || file.history[file.history.length - 1] || '';

    // Apply remark-breaks only to files in /content/diary/
    if (filePath.includes('/content/diary/')) {
      const breaksPlugin = remarkBreaks();
      return breaksPlugin(tree, file);
    }
  };
}
