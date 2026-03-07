import matter from 'gray-matter';
import fs from 'fs/promises';

const content = await fs.readFile('src/content/blog/00013_ペチコン福岡が初めてだった.mdx', 'utf-8');
const { data: frontmatter } = matter(content);

console.log('Frontmatter:', frontmatter);
console.log('\nTags:', frontmatter.tags);
console.log('Tags type:', typeof frontmatter.tags);
console.log('Tags is array:', Array.isArray(frontmatter.tags));
console.log('Tags length:', frontmatter.tags?.length);
