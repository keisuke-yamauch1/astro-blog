import type { APIRoute } from 'astro';
import { verifyToken } from '../../../lib/auth';
import { createDiaryPost } from '../../../lib/post-creator';

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

    // 日記を下書きとして作成（gitにコミットしない）
    const result = await createDiaryPost({
      ...data,
      draft: true,
    });

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