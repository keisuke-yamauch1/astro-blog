import type { APIRoute } from 'astro';
import { verifyToken, isLocalhost } from '../../../lib/auth';
import { createDiaryPost, deleteDiaryPost } from '../../../lib/post-creator';

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

    // 日記を下書きとして作成（gitにコミットしない）
    const result = await createDiaryPost({
      ...data,
      draft: true,
    });

    // 古いファイルが指定されており、ファイル名が変わった場合は削除
    if (data.oldFilename && data.oldFilename !== result.filename) {
      try {
        deleteDiaryPost(data.oldFilename);
      } catch (error) {
        console.warn('古いファイルの削除に失敗:', error);
        // エラーは無視して処理を続行
      }
    }

    return new Response(JSON.stringify({
      success: true,
      ...result,
      message: '下書きを保存しました',
    }), {
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