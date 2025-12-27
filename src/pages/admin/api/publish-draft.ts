import type { APIRoute } from 'astro';
import { verifyToken, isLocalhost } from '../../../lib/auth';
import { getFileContent, updateFile, GitHubAPIError } from '../../../lib/github-client';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

export const prerender = false;

// localhost環境用の処理（従来の実装）
async function handleLocalPublish(filename: string, date: string) {
  try {
    const filepath = path.join(process.cwd(), 'src/content/diary', filename);

    if (!fs.existsSync(filepath)) {
      return new Response(JSON.stringify({ error: 'File not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let content = fs.readFileSync(filepath, 'utf-8');
    content = content.replace(/^draft:\s*true/m, 'draft: false');
    fs.writeFileSync(filepath, content, 'utf-8');

    try {
      const cwd = process.cwd();
      const relativeFilePath = path.relative(cwd, filepath);
      execSync(`git add "${relativeFilePath}"`, { cwd });
      execSync(`git commit -m "diary: ${date}"`, { cwd });
      execSync('git push', { cwd });

      return new Response(JSON.stringify({
        success: true,
        message: '下書きを公開しました（localhost）',
        filename,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (gitError) {
      return new Response(JSON.stringify({
        success: true,
        message: 'ファイルは更新されましたが、gitプッシュに失敗しました',
        gitError: (gitError as Error).message,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    throw error;
  }
}

// Vercel環境用の処理（GitHub API）
async function handleGitHubPublish(filename: string, date: string) {
  const githubPath = `src/content/diary/${filename}`;

  try {
    const { content, sha } = await getFileContent(githubPath);
    const updatedContent = content.replace(/^draft:\s*true/m, 'draft: false');

    if (updatedContent === content) {
      return new Response(JSON.stringify({
        error: 'draft: true が見つかりませんでした'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = await updateFile(
      githubPath,
      updatedContent,
      `diary: ${date}`,
      sha
    );

    return new Response(JSON.stringify({
      success: true,
      message: '下書きを公開しました（GitHub API）',
      filename,
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
    const { filename, date } = await request.json();

    if (!filename || !date) {
      return new Response(JSON.stringify({ error: 'filename and date are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 環境に応じた処理の分岐
    if (isLocal) {
      return await handleLocalPublish(filename, date);
    } else {
      return await handleGitHubPublish(filename, date);
    }

  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};