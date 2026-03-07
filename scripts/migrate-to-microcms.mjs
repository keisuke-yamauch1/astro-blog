import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';
import { glob } from 'glob';
import { createClient } from 'microcms-js-sdk';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import { visit } from 'unist-util-visit';
import dotenv from 'dotenv';

// 環境変数を読み込み
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CLI引数解析
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    dryRun: false,
    limit: null,
    contentType: null, // 'blog', 'diary', 'emonicle', or null (全て)
    verify: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--verify') {
      options.verify = true;
    } else if (arg === '--limit' && i + 1 < args.length) {
      options.limit = parseInt(args[i + 1], 10);
      i++;
    } else if (arg === '--content-type' && i + 1 < args.length) {
      options.contentType = args[i + 1];
      i++;
    }
  }

  return options;
}

// 環境変数チェック
function checkEnvironment() {
  if (!process.env.MICROCMS_SERVICE_DOMAIN || !process.env.MICROCMS_API_KEY) {
    console.error('❌ Error: MICROCMS_SERVICE_DOMAIN and MICROCMS_API_KEY must be set');
    process.exit(1);
  }
}

// microCMSクライアント初期化
const microCMSClient = createClient({
  serviceDomain: process.env.MICROCMS_SERVICE_DOMAIN,
  apiKey: process.env.MICROCMS_API_KEY,
});

// rehypeプラグイン: target="_blank"を追加
function rehypeTargetBlank() {
  return (tree) => {
    visit(tree, 'element', (node) => {
      if (node.tagName === 'a') {
        node.properties = node.properties || {};
        const href = String(node.properties.href || '');

        // 外部リンクのみtarget="_blank"を追加
        const isInternal =
          !href ||
          href.startsWith('/') ||
          href.startsWith('#');

        if (!isInternal) {
          node.properties.target = '_blank';
          node.properties.rel = 'noopener noreferrer';
        }
      }
    });
  };
}

// rehypeプラグイン: 画像にnot-proseクラスを追加
function rehypeImageNotProse() {
  return (tree) => {
    visit(tree, 'element', (node) => {
      if (node.tagName === 'img') {
        node.properties = node.properties || {};
        const existingClass = node.properties.class;
        node.properties.class = existingClass ? `${existingClass} not-prose` : 'not-prose';
      }
    });
  };
}

// Markdown→HTML変換
async function convertMarkdownToHtml(markdown, contentType) {
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm);

  // Diaryのみremark-breaksを適用
  if (contentType === 'diary') {
    processor.use(remarkBreaks);
  }

  processor
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeTargetBlank)
    .use(rehypeImageNotProse)
    .use(rehypeStringify);

  const result = await processor.process(markdown);
  return String(result);
}

// Markdownファイルをロード
async function loadMarkdownFiles(contentType) {
  const directory = path.join(__dirname, `../src/content/${contentType}`);
  const files = glob.sync(path.join(directory, '*.{md,mdx}'));

  const entries = [];

  for (const file of files) {
    try {
      const content = await fs.readFile(file, 'utf-8');
      const { data: frontmatter, content: markdown } = matter(content);

      entries.push({
        filename: path.basename(file),
        filepath: file,
        frontmatter,
        markdown,
        contentType,
      });
    } catch (error) {
      console.error(`❌ Error reading ${file}:`, error.message);
    }
  }

  return entries;
}

// frontmatter → microCMSデータ変換
function mapToMicroCMSData(entry) {
  const { frontmatter, htmlContent, contentType } = entry;

  const baseData = {
    title: frontmatter.title,
    description: frontmatter.description || '',
    content: htmlContent,
    date: new Date(frontmatter.date).toISOString(),
  };

  // 画像がある場合のみ追加
  if (frontmatter.image) {
    baseData.image = frontmatter.image;
  }

  if (contentType === 'blog') {
    const blogData = {
      ...baseData,
      customId: frontmatter.id,
    };
    // タグがある場合のみ追加
    if (frontmatter.tags && frontmatter.tags.length > 0) {
      blogData.tags = frontmatter.tags;
    }
    return blogData;
  }

  if (contentType === 'diary') {
    return baseData;
  }

  if (contentType === 'emonicle') {
    return {
      ...baseData,
      customId: frontmatter.id,
    };
  }

  return baseData;
}

// 進捗トラッカー
class ProgressTracker {
  constructor() {
    this.total = 0;
    this.success = 0;
    this.failed = 0;
    this.skipped = 0;
    this.errors = [];
  }

  addSuccess() {
    this.success++;
  }

  addFailed(filename, error) {
    this.failed++;
    this.errors.push({ filename, error });
  }

  addSkipped() {
    this.skipped++;
  }

  setTotal(count) {
    this.total = count;
  }

  printSummary() {
    console.log('\n===========================================');
    console.log('Migration Summary:');
    console.log('===========================================');
    console.log(`Total: ${this.total}`);
    console.log(`✓ Success: ${this.success}`);
    console.log(`❌ Failed: ${this.failed}`);
    console.log(`⊘ Skipped: ${this.skipped}`);
    console.log('-------------------------------------------\n');

    if (this.errors.length > 0) {
      console.log('Failed entries:');
      this.errors.forEach(({ filename, error }) => {
        console.log(`  - ${filename}: ${error}`);
      });
    }
  }
}

// レート制限対策付きAPI呼び出し
async function createEntry(endpoint, data, tracker, filename) {
  const maxRetries = 2;
  let retryCount = 0;

  while (retryCount <= maxRetries) {
    try {
      await microCMSClient.create({
        endpoint,
        content: data,
        isDraft: true, // 下書き状態で作成
      });

      tracker.addSuccess();
      console.log(`  ✓ ${filename}`);

      // レート制限対策: 150msディレイ
      await new Promise(resolve => setTimeout(resolve, 150));
      return;
    } catch (error) {
      if (error.status === 429 && retryCount < maxRetries) {
        // 429エラー: 指数バックオフでリトライ
        const delay = (retryCount + 1) * 5000; // 5秒、10秒
        console.log(`  ⚠️  Rate limit hit for ${filename}, retrying in ${delay / 1000}s...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        retryCount++;
      } else {
        // その他のエラーまたは最大リトライ到達
        tracker.addFailed(filename, error.message);
        console.log(`  ❌ ${filename}: ${error.message}`);
        return;
      }
    }
  }
}

// ドライラン実行
async function runDryRun(entries, options) {
  console.log('===========================================');
  console.log('  DRY RUN MODE');
  console.log('===========================================\n');

  const limit = options.limit || entries.length;
  const limitedEntries = entries.slice(0, limit);

  console.log(`Processing ${limitedEntries.length} of ${entries.length} entries:\n`);

  for (const entry of limitedEntries) {
    console.log(`📄 ${entry.filename} (${entry.contentType})`);
    console.log('  Frontmatter:', JSON.stringify(entry.frontmatter, null, 2));

    try {
      const htmlContent = await convertMarkdownToHtml(entry.markdown, entry.contentType);
      const data = mapToMicroCMSData({ ...entry, htmlContent });
      console.log('  Mapped data:', JSON.stringify(data, null, 2));
      console.log('  ✓ Conversion successful\n');
    } catch (error) {
      console.log(`  ❌ Conversion failed: ${error.message}\n`);
    }
  }

  console.log('===========================================');
  console.log('DRY RUN COMPLETE');
  console.log('===========================================');
}

// 実際の移行実行
async function runMigration(entries, options) {
  console.log('===========================================');
  console.log('  MIGRATION START');
  console.log('===========================================\n');

  const limit = options.limit || entries.length;
  const limitedEntries = entries.slice(0, limit);

  const tracker = new ProgressTracker();
  tracker.setTotal(limitedEntries.length);

  console.log(`Migrating ${limitedEntries.length} of ${entries.length} entries:\n`);

  for (const entry of limitedEntries) {
    try {
      const htmlContent = await convertMarkdownToHtml(entry.markdown, entry.contentType);
      const data = mapToMicroCMSData({ ...entry, htmlContent });

      await createEntry(entry.contentType, data, tracker, entry.filename);
    } catch (error) {
      tracker.addFailed(entry.filename, error.message);
      console.log(`  ❌ ${entry.filename}: ${error.message}`);
    }
  }

  tracker.printSummary();
}

// メイン処理
async function main() {
  const options = parseArgs();

  console.log('===========================================');
  console.log('  microCMS Migration Tool');
  console.log('===========================================\n');

  // 環境変数チェック
  checkEnvironment();

  // コンテンツタイプ決定
  const contentTypes = options.contentType
    ? [options.contentType]
    : ['blog', 'diary', 'emonicle'];

  console.log(`Target content types: ${contentTypes.join(', ')}`);
  console.log(`Mode: ${options.dryRun ? 'DRY RUN' : 'MIGRATION'}`);
  if (options.limit) {
    console.log(`Limit: ${options.limit} entries per type`);
  }
  console.log('');

  // Markdownファイルをロード
  let allEntries = [];
  for (const contentType of contentTypes) {
    console.log(`📂 Loading ${contentType} files...`);
    const entries = await loadMarkdownFiles(contentType);
    console.log(`  ✓ Loaded ${entries.length} files\n`);
    allEntries = allEntries.concat(entries);
  }

  if (allEntries.length === 0) {
    console.log('⚠️  No entries to migrate.');
    return;
  }

  // ドライランまたは実際の移行
  if (options.dryRun) {
    await runDryRun(allEntries, options);
  } else {
    await runMigration(allEntries, options);

    // 検証実行
    if (options.verify) {
      console.log('\n===========================================');
      console.log('  Running Verification...');
      console.log('===========================================\n');

      // verify-migration.cjsを実行
      const { spawn } = await import('child_process');
      const verifyProcess = spawn('node', ['scripts/verify-migration.cjs'], {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..'),
      });

      await new Promise((resolve, reject) => {
        verifyProcess.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Verification failed with code ${code}`));
          }
        });
      });
    }
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
