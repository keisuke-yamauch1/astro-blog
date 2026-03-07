import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';
import { glob } from 'glob';
import { createClient } from 'microcms-js-sdk';
import dotenv from 'dotenv';

// 環境変数を読み込み
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// microCMSクライアント初期化
const microCMSClient = createClient({
  serviceDomain: process.env.MICROCMS_SERVICE_DOMAIN,
  apiKey: process.env.MICROCMS_API_KEY,
});

// 日付を正規化（比較用）
function normalizeDate(date) {
  if (date instanceof Date) {
    return date.toISOString().split('T')[0];
  }
  if (typeof date === 'string') {
    return new Date(date).toISOString().split('T')[0];
  }
  return '';
}

// microCMSから全diaryを取得
async function fetchAllDiariesFromMicroCMS() {
  let allDiaries = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    try {
      const response = await microCMSClient.getList({
        endpoint: 'diary',
        queries: {
          limit,
          offset,
          // draft含めて全件取得
        },
      });

      allDiaries = allDiaries.concat(response.contents);

      if (response.contents.length < limit) {
        break;
      }

      offset += limit;
    } catch (error) {
      console.error('Error fetching from microCMS:', error.message);
      break;
    }
  }

  return allDiaries;
}

// ローカルのMarkdownファイルを読み込み
async function loadLocalDiaries() {
  const directory = path.join(__dirname, '../src/content/diary');
  const files = glob.sync(path.join(directory, '*.{md,mdx}'));

  const diaries = [];

  for (const file of files) {
    try {
      const content = await fs.readFile(file, 'utf-8');
      const { data: frontmatter, content: markdown } = matter(content);

      diaries.push({
        filename: path.basename(file),
        frontmatter,
        markdown,
        contentLength: markdown.trim().length,
      });
    } catch (error) {
      console.error(`Error reading ${file}:`, error.message);
    }
  }

  return diaries;
}

// 検証実行
async function verifyDiaryMigration() {
  console.log('===========================================');
  console.log('  Diary Migration Verification');
  console.log('===========================================\n');

  // 環境変数確認
  if (!process.env.MICROCMS_SERVICE_DOMAIN || !process.env.MICROCMS_API_KEY) {
    console.error('❌ Error: MICROCMS_SERVICE_DOMAIN and MICROCMS_API_KEY must be set');
    process.exit(1);
  }

  console.log('📥 Fetching data from microCMS...');
  const microCMSDiaries = await fetchAllDiariesFromMicroCMS();
  console.log(`✓ Fetched ${microCMSDiaries.length} diaries from microCMS\n`);

  console.log('📂 Loading local Markdown files...');
  const localDiaries = await loadLocalDiaries();
  console.log(`✓ Loaded ${localDiaries.length} local diary files\n`);

  console.log('-------------------------------------------');
  console.log('Verification Results:');
  console.log('-------------------------------------------\n');

  const errors = [];
  let checkedCount = 0;

  // ローカルファイルごとに検証
  for (const local of localDiaries) {
    const localDate = normalizeDate(local.frontmatter.date);

    // microCMSから対応するエントリーを探す（日付で照合）
    const microCMSEntry = microCMSDiaries.find(entry => {
      const entryDate = normalizeDate(entry.date);
      return entryDate === localDate && entry.title === local.frontmatter.title;
    });

    if (!microCMSEntry) {
      errors.push({
        file: local.filename,
        type: 'MISSING',
        message: 'Not found in microCMS',
      });
      console.log(`❌ ${local.filename}: Not found in microCMS`);
      continue;
    }

    checkedCount++;
    const issues = [];

    // 1. frontmatter正確性確認
    if (microCMSEntry.title !== local.frontmatter.title) {
      issues.push(`Title mismatch: "${microCMSEntry.title}" vs "${local.frontmatter.title}"`);
    }

    const microCMSDate = normalizeDate(microCMSEntry.date);
    if (microCMSDate !== localDate) {
      issues.push(`Date mismatch: ${microCMSDate} vs ${localDate}`);
    }

    if (microCMSEntry.description !== local.frontmatter.description) {
      issues.push(`Description mismatch`);
    }

    // 2. コンテンツ本文の欠損確認（文字数で大まかにチェック）
    const microCMSContentLength = microCMSEntry.content?.length || 0;
    const localContentLength = local.contentLength;

    // HTML変換で増えるため、ローカルの1.5倍程度までは許容
    if (microCMSContentLength === 0 && localContentLength > 0) {
      issues.push(`Content is empty (local: ${localContentLength} chars)`);
    } else if (microCMSContentLength < localContentLength * 0.5) {
      issues.push(`Content seems truncated (microCMS: ${microCMSContentLength} chars, local: ${localContentLength} chars)`);
    }

    // 3. 画像URLの正確性確認
    if (local.frontmatter.image) {
      if (microCMSEntry.image !== local.frontmatter.image) {
        issues.push(`Image URL mismatch: "${microCMSEntry.image}" vs "${local.frontmatter.image}"`);
      }
    }

    if (issues.length > 0) {
      errors.push({
        file: local.filename,
        type: 'MISMATCH',
        issues,
      });
      console.log(`⚠️  ${local.filename}:`);
      issues.forEach(issue => console.log(`    - ${issue}`));
    } else {
      console.log(`✓ ${local.filename}`);
    }
  }

  // サマリー表示
  console.log('\n===========================================');
  console.log('Summary:');
  console.log('===========================================');
  console.log(`Total local files: ${localDiaries.length}`);
  console.log(`Total microCMS entries: ${microCMSDiaries.length}`);
  console.log(`Verified: ${checkedCount}`);
  console.log(`✓ Passed: ${checkedCount - errors.length}`);
  console.log(`⚠️  Issues: ${errors.length}`);
  console.log('-------------------------------------------\n');

  if (errors.length > 0) {
    console.log('⚠️  Issues found:');
    errors.forEach(error => {
      console.log(`\n${error.file} (${error.type}):`);
      if (error.issues) {
        error.issues.forEach(issue => console.log(`  - ${issue}`));
      } else {
        console.log(`  - ${error.message}`);
      }
    });
  } else {
    console.log('🎉 All diary entries verified successfully!');
  }
}

// microCMSから全blogを取得
async function fetchAllBlogsFromMicroCMS() {
  let allBlogs = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    try {
      const response = await microCMSClient.getList({
        endpoint: 'blog',
        queries: {
          limit,
          offset,
        },
      });

      allBlogs = allBlogs.concat(response.contents);

      if (response.contents.length < limit) {
        break;
      }

      offset += limit;
    } catch (error) {
      console.error('Error fetching from microCMS:', error.message);
      break;
    }
  }

  return allBlogs;
}

// ローカルのBlogファイルを読み込み
async function loadLocalBlogs() {
  const directory = path.join(__dirname, '../src/content/blog');
  const files = glob.sync(path.join(directory, '*.{md,mdx}'));

  const blogs = [];

  for (const file of files) {
    try {
      const content = await fs.readFile(file, 'utf-8');
      const { data: frontmatter, content: markdown } = matter(content);

      blogs.push({
        filename: path.basename(file),
        frontmatter,
        markdown,
        contentLength: markdown.trim().length,
      });
    } catch (error) {
      console.error(`Error reading ${file}:`, error.message);
    }
  }

  return blogs;
}

// Blog検証実行
async function verifyBlogMigration() {
  console.log('===========================================');
  console.log('  Blog Migration Verification');
  console.log('===========================================\n');

  // 環境変数確認
  if (!process.env.MICROCMS_SERVICE_DOMAIN || !process.env.MICROCMS_API_KEY) {
    console.error('❌ Error: MICROCMS_SERVICE_DOMAIN and MICROCMS_API_KEY must be set');
    process.exit(1);
  }

  console.log('📥 Fetching data from microCMS...');
  const microCMSBlogs = await fetchAllBlogsFromMicroCMS();
  console.log(`✓ Fetched ${microCMSBlogs.length} blogs from microCMS\n`);

  console.log('📂 Loading local Markdown files...');
  const localBlogs = await loadLocalBlogs();
  console.log(`✓ Loaded ${localBlogs.length} local blog files\n`);

  console.log('-------------------------------------------');
  console.log('Verification Results:');
  console.log('-------------------------------------------\n');

  const errors = [];
  let checkedCount = 0;

  // ローカルファイルごとに検証
  for (const local of localBlogs) {
    // microCMSから対応するエントリーを探す（customIdで照合）
    const microCMSEntry = microCMSBlogs.find(entry => {
      return entry.customId === local.frontmatter.id;
    });

    if (!microCMSEntry) {
      errors.push({
        file: local.filename,
        type: 'MISSING',
        message: 'Not found in microCMS',
      });
      console.log(`❌ ${local.filename}: Not found in microCMS`);
      continue;
    }

    checkedCount++;
    const issues = [];

    // 1. frontmatter正確性確認
    if (microCMSEntry.customId !== local.frontmatter.id) {
      issues.push(`CustomId mismatch: ${microCMSEntry.customId} vs ${local.frontmatter.id}`);
    }

    if (microCMSEntry.title !== local.frontmatter.title) {
      issues.push(`Title mismatch: "${microCMSEntry.title}" vs "${local.frontmatter.title}"`);
    }

    const microCMSDate = normalizeDate(microCMSEntry.date);
    const localDate = normalizeDate(local.frontmatter.date);
    if (microCMSDate !== localDate) {
      issues.push(`Date mismatch: ${microCMSDate} vs ${localDate}`);
    }

    if (microCMSEntry.description !== local.frontmatter.description) {
      issues.push(`Description mismatch`);
    }

    // tagsの検証
    const microCMSTags = microCMSEntry.tags || [];
    const localTags = local.frontmatter.tags || [];
    if (JSON.stringify(microCMSTags.sort()) !== JSON.stringify(localTags.sort())) {
      issues.push(`Tags mismatch: [${microCMSTags.join(', ')}] vs [${localTags.join(', ')}]`);
    }

    // 2. コンテンツ本文の欠損確認（文字数で大まかにチェック）
    const microCMSContentLength = microCMSEntry.content?.length || 0;
    const localContentLength = local.contentLength;

    // HTML変換で増えるため、ローカルの1.5倍程度までは許容
    if (microCMSContentLength === 0 && localContentLength > 0) {
      issues.push(`Content is empty (local: ${localContentLength} chars)`);
    } else if (microCMSContentLength < localContentLength * 0.5) {
      issues.push(`Content seems truncated (microCMS: ${microCMSContentLength} chars, local: ${localContentLength} chars)`);
    }

    // 3. 画像URLの正確性確認
    if (local.frontmatter.image) {
      if (microCMSEntry.image !== local.frontmatter.image) {
        issues.push(`Image URL mismatch: "${microCMSEntry.image}" vs "${local.frontmatter.image}"`);
      }
    }

    if (issues.length > 0) {
      errors.push({
        file: local.filename,
        type: 'MISMATCH',
        issues,
      });
      console.log(`⚠️  ${local.filename}:`);
      issues.forEach(issue => console.log(`    - ${issue}`));
    } else {
      console.log(`✓ ${local.filename}`);
    }
  }

  // サマリー表示
  console.log('\n===========================================');
  console.log('Summary:');
  console.log('===========================================');
  console.log(`Total local files: ${localBlogs.length}`);
  console.log(`Total microCMS entries: ${microCMSBlogs.length}`);
  console.log(`Verified: ${checkedCount}`);
  console.log(`✓ Passed: ${checkedCount - errors.length}`);
  console.log(`⚠️  Issues: ${errors.length}`);
  console.log('-------------------------------------------\n');

  if (errors.length > 0) {
    console.log('⚠️  Issues found:');
    errors.forEach(error => {
      console.log(`\n${error.file} (${error.type}):`);
      if (error.issues) {
        error.issues.forEach(issue => console.log(`  - ${issue}`));
      } else {
        console.log(`  - ${error.message}`);
      }
    });
  } else {
    console.log('🎉 All blog entries verified successfully!');
  }
}

// メイン処理
async function main() {
  const args = process.argv.slice(2);
  const contentType = args[0] || 'diary'; // デフォルトはdiary

  if (contentType === 'blog') {
    await verifyBlogMigration();
  } else if (contentType === 'diary') {
    await verifyDiaryMigration();
  } else {
    console.error(`Unknown content type: ${contentType}`);
    console.error('Usage: node verify-migration.mjs [diary|blog]');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
