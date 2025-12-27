import type { APIRoute } from 'astro';
import { verifyToken } from '../../../lib/auth';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

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
    const { filename, date } = await request.json();

    if (!filename || !date) {
      return new Response(JSON.stringify({ error: 'filename and date are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // ファイルパスを構築
    const filepath = path.join(process.cwd(), 'src/content/diary', filename);

    // ファイルが存在するか確認
    if (!fs.existsSync(filepath)) {
      return new Response(JSON.stringify({ error: 'File not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // ファイル内容を読み取り
    let content = fs.readFileSync(filepath, 'utf-8');

    // draft: true を draft: false に置換
    content = content.replace(/^draft:\s*true/m, 'draft: false');

    // ファイルに書き込み
    fs.writeFileSync(filepath, content, 'utf-8');

    // Gitでコミット＆プッシュ
    try {
      const cwd = process.cwd();
      const relativeFilePath = path.relative(cwd, filepath);

      // Gitに追加
      execSync(`git add "${relativeFilePath}"`, { cwd });

      // コミットメッセージを生成
      const commitMessage = `diary: ${date}`;

      execSync(`git commit -m "${commitMessage}"`, { cwd });

      // プッシュ
      execSync('git push', { cwd });

      return new Response(JSON.stringify({
        success: true,
        message: '下書きを公開しました',
        filename,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (gitError) {
      // Gitエラーの場合でも、ファイルは更新済み
      console.error('Git operation failed:', gitError);
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
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};