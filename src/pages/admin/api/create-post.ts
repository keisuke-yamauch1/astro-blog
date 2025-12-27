import type { APIRoute } from 'astro';
import { verifyToken, isLocalhost } from '../../../lib/auth';
import { createDiaryPost, deleteDiaryPost } from '../../../lib/post-creator';
import { createFile, updateFile, deleteFile, getFileContent, GitHubAPIError } from '../../../lib/github-client';
import { execSync } from 'child_process';
import path from 'path';

export const prerender = false;

// フロントマターとコンテンツを生成
function generateDiaryContent(data: any, date: string, sanitizedTitle: string) {
  return `---
title: ${data.title}
date: ${date}
${data.condition ? `condition: ${data.condition}` : ''}
draft: ${data.draft ?? false}
---

${data.content}
`;
}

// タイトルをファイル名用にサニタイズ
function sanitizeTitle(title: string): string {
  return title
    .replace(/[\/\\:*?"<>|]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 50);
}

// localhost環境用の処理（従来の実装）
async function handleLocalCreate(data: any) {
  try {
    // 日記を作成
    const result = await createDiaryPost(data);

    // 古いファイルを削除（該当する場合）
    let fileChanged = false;
    if (data.oldFilename && data.oldFilename !== result.filename) {
      try {
        deleteDiaryPost(data.oldFilename);
        fileChanged = true;
      } catch (error) {
        console.warn('古いファイルの削除に失敗:', error);
      }
    }

    // Gitでコミット＆プッシュ
    try {
      const cwd = process.cwd();

      if (fileChanged) {
        execSync(`git add src/content/diary/`, { cwd });
      } else {
        const relativeFilePath = path.relative(cwd, result.filepath);
        execSync(`git add "${relativeFilePath}"`, { cwd });
      }

      const commitMessage = `diary: ${result.date}`;
      execSync(`git commit -m "${commitMessage}"`, { cwd });
      execSync('git push', { cwd });

      result.published = true;
    } catch (gitError) {
      console.error('Git operation failed:', gitError);
      result.gitError = (gitError as Error).message;
    }

    return new Response(JSON.stringify({ success: true, ...result }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    throw error;
  }
}

// Vercel環境用の処理（GitHub API）
async function handleGitHubCreate(data: any) {
  try {
    const date = data.date || new Date().toISOString().split('T')[0];
    const sanitizedTitle = sanitizeTitle(data.title);
    const filename = `${date}_${sanitizedTitle}.md`;
    const githubPath = `src/content/diary/${filename}`;
    const content = generateDiaryContent(data, date, sanitizedTitle);

    // 古いファイルを削除（該当する場合）
    if (data.oldFilename && data.oldFilename !== filename) {
      try {
        const oldPath = `src/content/diary/${data.oldFilename}`;
        const { sha } = await getFileContent(oldPath);
        await deleteFile(oldPath, `Delete old diary: ${data.oldFilename}`, sha);
      } catch (error) {
        console.warn('古いファイルの削除に失敗:', error);
      }
    }

    // ファイルを作成または更新
    let result;
    try {
      // 既存ファイルがある場合は更新、ない場合は作成
      const { sha } = await getFileContent(githubPath);
      result = await updateFile(githubPath, content, `diary: ${date}`, sha);
    } catch (error) {
      if (error instanceof GitHubAPIError && error.statusCode === 404) {
        // ファイルが存在しない場合は新規作成
        result = await createFile(githubPath, content, `diary: ${date}`);
      } else {
        throw error;
      }
    }

    return new Response(JSON.stringify({
      success: true,
      filename,
      date,
      published: true,
      commit: result.commit,
      url: result.url,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    if (error instanceof GitHubAPIError) {
      console.error('GitHub API operation failed:', error);
      return new Response(JSON.stringify({
        error: error.message,
        details: error.apiError?.message,
      }), {
        status: error.statusCode || 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    throw error;
  }
}

export const POST: APIRoute = async ({ request }) => {
  const isLocal = isLocalhost(request);

  // localhost以外は認証チェック
  if (!isLocal) {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token || !verifyToken(token)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  try {
    const data = await request.json();

    // 環境に応じた処理の分岐
    if (isLocal) {
      return await handleLocalCreate(data);
    } else {
      return await handleGitHubCreate(data);
    }

  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};