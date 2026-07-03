// microCMS → Content Collections（.md）一括移行スクリプト（一度きり）
//
// 実行:
//   MICROCMS_API_KEY=xxx MICROCMS_SERVICE_DOMAIN=kechiiiiin node scripts/migrate-microcms.mjs
//   （.env から読むなら: node --env-file=.env scripts/migrate-microcms.mjs）
//
// 方針:
//   - 本文 HTML は無変換でそのまま body へ（現行も set:html 直描画のため）
//   - frontmatter はリネームのみ（date→pubDate / image→heroImage）、format: html を付与
//   - ファイル名: blog/emonicle = contentId（URL互換）/ diary = JST の YYYY-MM-DD
//   - diary は1日1本前提。ファイル名重複が出たら停止して報告

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import matter from 'gray-matter';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const SERVICE_DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN || 'kechiiiiin';
const API_KEY = process.env.MICROCMS_API_KEY;
if (!API_KEY) {
  console.error('ERROR: MICROCMS_API_KEY が未設定です。');
  process.exit(1);
}

const ENDPOINTS = ['blog', 'diary', 'emonicle'];

// microCMS の全件ページング取得
async function fetchAll(endpoint) {
  const all = [];
  let offset = 0;
  const limit = 100;
  while (true) {
    const url = `https://${SERVICE_DOMAIN}.microcms.io/api/v1/${endpoint}?limit=${limit}&offset=${offset}`;
    const res = await fetch(url, { headers: { 'X-MICROCMS-API-KEY': API_KEY } });
    if (!res.ok) {
      throw new Error(`${endpoint} の取得に失敗: ${res.status} ${await res.text()}`);
    }
    const json = await res.json();
    all.push(...json.contents);
    if (json.contents.length < limit) break;
    offset += limit;
  }
  return all;
}

// JST の YYYY-MM-DD（getDateParts と同方式）
function jstYmd(dateStr) {
  const d = new Date(new Date(dateStr).toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// frontmatter 組み立て（空のキーは書かない）。gray-matter で安全に YAML 化。
function buildMarkdown(cms, { includeTags }) {
  const fm = {
    title: cms.title,
  };
  if (cms.description) fm.description = cms.description;
  if (includeTags && Array.isArray(cms.tags) && cms.tags.length > 0) fm.tags = cms.tags;
  fm.pubDate = cms.date; // ISO のまま（z.coerce.date() で受ける）
  fm.draft = cms.draft ?? false;
  if (cms.image) fm.heroImage = cms.image;
  fm.format = 'html'; // 移行分の印

  const body = cms.content ?? '';
  return matter.stringify(body, fm);
}

async function main() {
  const summary = {};

  for (const endpoint of ENDPOINTS) {
    const items = await fetchAll(endpoint);
    const outDir = join(ROOT, 'src', 'content', endpoint);
    mkdirSync(outDir, { recursive: true });

    const seen = new Map(); // diary の重複検出用（filename -> contentId）
    let written = 0;

    for (const cms of items) {
      let filename;
      if (endpoint === 'diary') {
        filename = `${jstYmd(cms.date)}.md`;
        if (seen.has(filename)) {
          console.error(
            `\n重複検出: diary の ${filename} が複数あります（${seen.get(filename)} と ${cms.id}）。` +
            `\n1日1本前提が崩れています。手動で統合するか -2 サフィックスの判断が必要です。停止します。`
          );
          process.exit(1);
        }
        seen.set(filename, cms.id);
      } else {
        filename = `${cms.id}.md`; // URL互換（contentId）
      }

      const md = buildMarkdown(cms, { includeTags: endpoint === 'blog' });
      writeFileSync(join(outDir, filename), md, 'utf-8');
      written++;
    }

    summary[endpoint] = { fetched: items.length, written };
  }

  console.log('\n=== 移行サマリ ===');
  for (const ep of ENDPOINTS) {
    console.log(`${ep}: 取得 ${summary[ep].fetched} / 書き出し ${summary[ep].written}`);
  }
  const total = ENDPOINTS.reduce((n, ep) => n + summary[ep].written, 0);
  console.log(`合計: ${total} 件`);
  console.log('（期待値: blog 14 / diary 218 / emonicle 4 = 236）');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
