import type { APIRoute } from 'astro';
import { verifyToken } from '../../../lib/auth';
import { createBlogPost, createDiaryPost } from '../../../lib/post-creator';
import { execSync } from 'child_process';
import path from 'path';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  // トークン検証
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token || !verifyToken(token)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const data = await request.json();

    let result;
    if (data.type === 'blog') {
      result = await createBlogPost(data);
    } else if (data.type === 'diary') {
      result = await createDiaryPost(data);
    } else {
      throw new Error('Invalid type');
    }

    // 公開の場合、Gitでコミット＆プッシュ
    const isDraft = data.type === 'blog' ? data.draft : false;
    if (!isDraft) {
      try {
        const cwd = process.cwd();
        const relativeFilePath = path.relative(cwd, result.filepath);

        // Gitに追加
        execSync(`git add "${relativeFilePath}"`, { cwd });

        // コミットメッセージを生成
        let commitMessage;
        if (data.type === 'diary') {
          const date = new Date().toISOString().split('T')[0];
          commitMessage = `diary: ${date}`;
        } else {
          commitMessage = `blog: ${data.title}`;
        }

        execSync(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`, { cwd });

        // プッシュ
        execSync('git push', { cwd });

        result.published = true;
      } catch (gitError) {
        // Gitエラーは警告として扱う（ファイルは作成済み）
        console.error('Git operation failed:', gitError);
        result.gitError = (gitError as Error).message;
      }
    }

    return new Response(JSON.stringify({ success: true, ...result }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
