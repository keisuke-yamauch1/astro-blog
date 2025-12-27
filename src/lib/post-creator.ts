import fs from 'fs';
import path from 'path';

// ==================== 型定義 ====================

// 変換結果の型
interface ContentConversionResult {
  content: string;       // 変換後のボディ（フロントマター除く）
  imports: string[];     // 必要なimport文のリスト
  isMdx: boolean;        // MDX形式が必要か
}

// 変換オプションの型
interface ConversionOptions {
  convertUrls?: boolean;          // URL変換（デフォルト: true）
  convertObsidianLinks?: boolean; // Obsidianリンク変換（デフォルト: true）
  processTags?: boolean;          // タグ処理（デフォルト: true）
}

// フロントマター分離結果の型
interface SplitContent {
  frontmatter: string;
  body: string;
  hasFrontmatter: boolean;
}

// ==================== 正規表現パターン ====================

// URL検出パターン
const URL_PATTERNS = {
  youtube: /(?:\[)?https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)(?:[?&].*)?(?:\])?(?:\(https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)(?:[a-zA-Z0-9_-]+)(?:[?&].*)?\))?/g,
  twitter: /(?:\[)?https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/(?:[^\/]+)\/status\/(\d+)(?:\?.*)?(?:\])?(?:\(https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/(?:[^\/]+)\/status\/(?:\d+)(?:\?.*)?\))?/g,
} as const;

// Obsidian構文パターン
const OBSIDIAN_PATTERNS = {
  image: /!\[\[(.*?)\]\]/g,
  diaryLink: /\[\[(\d{4})-(\d{2})-(\d{2})_(.*?)\]\]/g,
  blogLink: /\[\[(\d{5})_(.*?)\]\]/g,
} as const;

// ==================== ブログ記事作成 ====================

// ブログ記事作成
export async function createBlogPost(data: {
  title: string;
  description?: string;
  tags?: string[];
  content: string;
  draft?: boolean;
  enableConversion?: boolean;      // デフォルト: true
  conversionOptions?: ConversionOptions;
}) {
  let processedBody = data.content;
  let imports: string[] = [];
  let extension = '.md';

  // デフォルトで変換を有効化
  if (data.enableConversion !== false) {
    const result = convertContent(data.content, data.conversionOptions);
    processedBody = result.content;  // 変換後のボディ
    imports = result.imports;        // import文のリスト
    extension = result.isMdx ? '.mdx' : '.md';
  }

  // 次のID取得
  const nextId = await getNextBlogId();

  // ファイル名生成（特殊文字を削除）
  const sanitizedTitle = sanitizeFilename(data.title);
  const filename = `${String(nextId).padStart(5, '0')}_${sanitizedTitle}${extension}`;

  // フロントマター生成
  const frontmatter = `---
id: ${nextId}
title: ${data.title}
${data.description ? `description: ${data.description}` : ''}
date: ${new Date().toISOString().split('T')[0]}
${data.tags && data.tags.length > 0 ? `tags:\n${data.tags.map(t => `  - ${t}`).join('\n')}` : 'tags: []'}
draft: ${data.draft ?? false}
---`;

  // import文を追加
  const importsSection = imports.length > 0 ? `\n\n${imports.join('\n')}` : '';

  // 最終的なコンテンツ
  const finalContent = `${frontmatter}${importsSection}\n\n${processedBody}`;

  // ファイル保存
  const filepath = path.join(process.cwd(), 'src/content/blog', filename);
  fs.writeFileSync(filepath, finalContent, 'utf-8');

  return { filename, filepath, id: nextId };
}

// 日記作成
export async function createDiaryPost(data: {
  title: string;
  date?: string;
  condition?: string;
  content: string;
  draft?: boolean;
  enableConversion?: boolean;      // デフォルト: true
  conversionOptions?: ConversionOptions;
}) {
  let processedBody = data.content;
  let imports: string[] = [];
  let extension = '.md';

  // デフォルトで変換を有効化
  if (data.enableConversion !== false) {
    const result = convertContent(data.content, data.conversionOptions);
    processedBody = result.content;  // 変換後のボディ
    imports = result.imports;        // import文のリスト
    extension = result.isMdx ? '.mdx' : '.md';
  }

  const date = data.date || new Date().toISOString().split('T')[0];
  const sanitizedTitle = sanitizeFilename(data.title);
  const filename = `${date}_${sanitizedTitle}${extension}`;

  // フロントマター生成
  const frontmatter = `---
title: ${data.title}
date: ${date}
${data.condition ? `condition: ${data.condition}` : ''}
draft: ${data.draft ?? false}
---`;

  // import文を追加
  const importsSection = imports.length > 0 ? `\n\n${imports.join('\n')}` : '';

  // 最終的なコンテンツ
  const finalContent = `${frontmatter}${importsSection}\n\n${processedBody}`;

  const filepath = path.join(process.cwd(), 'src/content/diary', filename);
  fs.writeFileSync(filepath, finalContent, 'utf-8');

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

// 日記削除
export function deleteDiaryPost(filename: string): void {
  const filepath = path.join(process.cwd(), 'src/content/diary', filename);

  if (!fs.existsSync(filepath)) {
    throw new Error(`ファイルが見つかりません: ${filename}`);
  }

  fs.unlinkSync(filepath);
}

// ファイル名のサニタイズ
function sanitizeFilename(title: string): string {
  return title
    .replace(/[<>:"/\\|?*]/g, '')  // 危険な文字削除
    .replace(/\.\./g, '')           // ..削除
    .trim()
    .slice(0, 100);                 // 長さ制限
}

// ==================== コンテンツ変換ユーティリティ ====================

/**
 * フロントマターとボディを分離
 */
function splitFrontmatter(content: string): SplitContent {
  if (!content.startsWith('---')) {
    return {
      frontmatter: '',
      body: content,
      hasFrontmatter: false,
    };
  }

  const secondDashIndex = content.indexOf('---', 3);
  if (secondDashIndex === -1) {
    return {
      frontmatter: '',
      body: content,
      hasFrontmatter: false,
    };
  }

  return {
    frontmatter: content.substring(0, secondDashIndex + 3),
    body: content.substring(secondDashIndex + 3).trim(),
    hasFrontmatter: true,
  };
}

/**
 * フロントマター、import文、ボディを結合
 */
function joinFrontmatter(
  frontmatter: string,
  imports: string[],
  body: string
): string {
  if (!frontmatter) {
    return body;
  }

  const parts = [frontmatter];

  if (imports.length > 0) {
    parts.push(imports.join('\n'));
  }

  parts.push(body);

  return parts.join('\n\n');
}

/**
 * YouTube URLをコンポーネントに変換
 */
function convertYouTubeUrls(content: string): string {
  // グローバルフラグがあるので、新しいRegExpインスタンスを作成
  const youtubeRegex = new RegExp(URL_PATTERNS.youtube.source, 'g');

  return content.replace(youtubeRegex, (match, videoId) => {
    return `<YouTube id="${videoId}" playlabel="Play" />`;
  });
}

/**
 * Twitter URLをコンポーネントに変換
 */
function convertTwitterUrls(content: string): string {
  // グローバルフラグがあるので、新しいRegExpインスタンスを作成
  const twitterRegex = new RegExp(URL_PATTERNS.twitter.source, 'g');

  return content.replace(twitterRegex, (match, tweetId) => {
    // URLを抽出
    const urlMatch = match.match(/https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/(?:[^\/]+)\/status\/(\d+)(?:\?.*)?/);
    if (urlMatch) {
      return `<Tweet id="${urlMatch[0]}" />`;
    }
    return match;
  });
}

/**
 * 必要なimport文を生成
 */
function generateImports(content: string): string[] {
  const imports: string[] = [];

  // YouTube URLがあるかチェック
  const youtubeRegex = new RegExp(URL_PATTERNS.youtube.source, 'g');
  if (youtubeRegex.test(content)) {
    imports.push("import { YouTube } from 'astro-embed';");
  }

  // Twitter URLがあるかチェック
  const twitterRegex = new RegExp(URL_PATTERNS.twitter.source, 'g');
  if (twitterRegex.test(content)) {
    imports.push("import { Tweet } from 'astro-embed';");
  }

  return imports;
}

/**
 * MDX形式が必要かどうか判定
 */
function needsMdx(content: string): boolean {
  const youtubeRegex = new RegExp(URL_PATTERNS.youtube.source, 'g');
  const twitterRegex = new RegExp(URL_PATTERNS.twitter.source, 'g');

  return youtubeRegex.test(content) || twitterRegex.test(content);
}

/**
 * Obsidian画像構文を変換
 * ![[filename]] → ![Image](../../assets/filename)
 */
function convertObsidianImages(content: string): string {
  const imageRegex = new RegExp(OBSIDIAN_PATTERNS.image.source, 'g');

  return content.replace(imageRegex, (match, filename) => {
    return `![Image](../../assets/${filename})`;
  });
}

/**
 * Obsidian日記リンクを変換
 * [[YYYY-MM-DD_xxxxx]] → [YYYY-MM-DD](/diary/YYYY/MM/DD)
 */
function convertObsidianDiaryLinks(content: string): string {
  const diaryLinkRegex = new RegExp(OBSIDIAN_PATTERNS.diaryLink.source, 'g');

  return content.replace(diaryLinkRegex, (match, year, month, day, title) => {
    return `[${year}-${month}-${day}](/diary/${year}/${month}/${day})`;
  });
}

/**
 * Obsidianブログリンクを変換
 * [[00001_タイトル]] → [タイトル](/blog/1)
 */
function convertObsidianBlogLinks(content: string): string {
  const blogLinkRegex = new RegExp(OBSIDIAN_PATTERNS.blogLink.source, 'g');

  return content.replace(blogLinkRegex, (match, number, title) => {
    // ゼロパディングを削除
    const nonZeroPaddedNumber = parseInt(number, 10);
    return `[${title}](/blog/${nonZeroPaddedNumber})`;
  });
}

/**
 * フロントマターのタグから astro_blog/ プレフィックスを削除
 */
function processTagsInFrontmatter(frontmatter: string): string {
  // tagsが含まれていない場合はそのまま返す
  if (!frontmatter.includes('tags:')) {
    return frontmatter;
  }

  let processedFrontmatter = frontmatter;

  // 複数行配列形式のタグを処理
  // 例:
  // tags:
  //   - astro_blog/tag1
  //   - astro_blog/tag2
  if (frontmatter.match(/tags:\s*\n\s+- /)) {
    const lines = processedFrontmatter.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].match(/\s+- astro_blog\//)) {
        lines[i] = lines[i].replace(/(\s+- )astro_blog\//, '$1');
      }
    }
    processedFrontmatter = lines.join('\n');
  } else {
    // 配列形式（単一行）のタグを処理
    // 例: tags: [astro_blog/tag1, astro_blog/tag2]
    processedFrontmatter = processedFrontmatter.replace(/tags:\s*\[(.*?)\]/g, (match, tagList) => {
      const processedTagList = tagList.replace(/astro_blog\//g, '');
      return `tags: [${processedTagList}]`;
    });

    // 文字列形式のタグを処理
    // 例: tags: astro_blog/tag1, astro_blog/tag2
    processedFrontmatter = processedFrontmatter.replace(/tags:\s*(.*?)(?=\n|$)/g, (match, tagList) => {
      if (!tagList.includes('[') && !tagList.includes(']')) {
        const processedTagList = tagList.replace(/astro_blog\//g, '');
        return `tags: ${processedTagList}`;
      }
      return match;
    });
  }

  return processedFrontmatter;
}

/**
 * コンテンツをObsidian形式からAstro形式に変換
 * すべての変換処理を統合したメイン関数
 */
export function convertContent(
  content: string,
  options: ConversionOptions = {}
): ContentConversionResult {
  const {
    convertUrls = true,
    convertObsidianLinks = true,
    processTags = true,
  } = options;

  // 1. フロントマター分離
  const { frontmatter, body, hasFrontmatter } = splitFrontmatter(content);

  let processedFrontmatter = frontmatter;
  let processedBody = body;

  // 2. タグ処理
  if (processTags && hasFrontmatter) {
    processedFrontmatter = processTagsInFrontmatter(processedFrontmatter);
  }

  // 3. MDX判定とimport文生成（URL変換の前に実行）
  const isMdx = convertUrls ? needsMdx(processedBody) : false;
  const imports = convertUrls ? generateImports(processedBody) : [];

  // 4. URL変換
  if (convertUrls) {
    processedBody = convertYouTubeUrls(processedBody);
    processedBody = convertTwitterUrls(processedBody);
  }

  // 5. Obsidianリンク変換
  if (convertObsidianLinks) {
    processedBody = convertObsidianImages(processedBody);
    processedBody = convertObsidianDiaryLinks(processedBody);
    processedBody = convertObsidianBlogLinks(processedBody);
  }

  // 6. ボディとimport文を返す（フロントマターは含めない）
  return {
    content: processedBody,  // 変換後のボディのみ
    imports,                 // import文のリスト
    isMdx
  };
}
