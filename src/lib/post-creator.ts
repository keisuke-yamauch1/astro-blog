import fs from 'fs';
import path from 'path';

// ブログ記事作成
export async function createBlogPost(data: {
  title: string;
  description?: string;
  tags?: string[];
  content: string;
  draft?: boolean;
}) {
  // 次のID取得
  const nextId = await getNextBlogId();

  // ファイル名生成（特殊文字を削除）
  const sanitizedTitle = sanitizeFilename(data.title);
  const filename = `${String(nextId).padStart(5, '0')}_${sanitizedTitle}.md`;

  // フロントマター生成
  const frontmatter = `---
id: ${nextId}
title: ${data.title}
${data.description ? `description: ${data.description}` : ''}
date: ${new Date().toISOString().split('T')[0]}
${data.tags && data.tags.length > 0 ? `tags:\n${data.tags.map(t => `  - ${t}`).join('\n')}` : 'tags: []'}
draft: ${data.draft ?? false}
---

${data.content}
`;

  // ファイル保存
  const filepath = path.join(process.cwd(), 'src/content/blog', filename);
  fs.writeFileSync(filepath, frontmatter, 'utf-8');

  return { filename, filepath, id: nextId };
}

// 日記作成
export async function createDiaryPost(data: {
  title: string;
  date?: string;
  condition?: string;
  content: string;
}) {
  const date = data.date || new Date().toISOString().split('T')[0];
  const sanitizedTitle = sanitizeFilename(data.title);
  const filename = `${date}_${sanitizedTitle}.md`;

  const frontmatter = `---
title: ${data.title}
date: ${date}
${data.condition ? `condition: ${data.condition}` : ''}
---

${data.content}
`;

  const filepath = path.join(process.cwd(), 'src/content/diary', filename);
  fs.writeFileSync(filepath, frontmatter, 'utf-8');

  return { filename, filepath, date };
}

// 次のブログIDを取得
async function getNextBlogId(): Promise<number> {
  const blogDir = path.join(process.cwd(), 'src/content/blog');
  const files = fs.readdirSync(blogDir);

  const ids = files
    .filter(f => f.match(/^\d{5}_/))
    .map(f => parseInt(f.substring(0, 5)))
    .filter(id => !isNaN(id));

  return ids.length > 0 ? Math.max(...ids) + 1 : 1;
}

// ファイル名のサニタイズ
function sanitizeFilename(title: string): string {
  return title
    .replace(/[<>:"/\\|?*]/g, '')  // 危険な文字削除
    .replace(/\.\./g, '')           // ..削除
    .trim()
    .slice(0, 100);                 // 長さ制限
}
