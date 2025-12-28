import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();

  // HTMLレスポンスにcharset=utf-8を追加
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('text/html') && !contentType.includes('charset')) {
    // 新しいResponseオブジェクトを作成してヘッダーを設定
    const headers = new Headers(response.headers);
    headers.set('content-type', 'text/html; charset=utf-8');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: headers
    });
  }

  return response;
});