import type { APIRoute } from 'astro';
import { verifyPassword, generateToken, isLocalhost } from '../../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    // localhostの場合は認証をスキップ
    if (isLocalhost(request)) {
      const token = generateToken();
      return new Response(JSON.stringify({ success: true, token, localhost: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { password } = await request.json();

    // bcryptは非同期処理なのでawait必須
    const isValid = await verifyPassword(password);

    if (isValid) {
      const token = generateToken();
      return new Response(JSON.stringify({ success: true, token }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({ success: false, error: 'Invalid password' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: 'Invalid request' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
