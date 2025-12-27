import type { APIRoute } from 'astro';
import { verifyToken, isLocalhost } from '../../../lib/auth';
import { createDiaryPost, deleteDiaryPost } from '../../../lib/post-creator';
import { execSync } from 'child_process';
import path from 'path';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  // localhostの場合は認証をスキップ
  if (!isLocalhost(request)) {
    // トークン検証
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
        // ファイル名が変更された場合、ディレクトリごと追加
        execSync(`git add src/content/diary/`, { cwd });
      } else {
        // 通常の新規作成または同じファイル名での上書き
        const relativeFilePath = path.relative(cwd, result.filepath);
        execSync(`git add "${relativeFilePath}"`, { cwd });
      }

      // コミットメッセージを生成（選択された日付を使用）
      const commitMessage = `diary: ${result.date}`;

      execSync(`git commit -m "${commitMessage}"`, { cwd });

      // プッシュ
      execSync('git push', { cwd });

      result.published = true;
    } catch (gitError) {
      // Gitエラーは警告として扱う（ファイルは作成済み）
      console.error('Git operation failed:', gitError);
      result.gitError = (gitError as Error).message;
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