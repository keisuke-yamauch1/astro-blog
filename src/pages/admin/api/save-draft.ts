import type { APIRoute } from 'astro';
import { verifyToken, isLocalhost } from '../../../lib/auth';
import { createDiaryPost, deleteDiaryPost } from '../../../lib/post-creator';
import { createFile, updateFile, deleteFile, getFileContent, GitHubAPIError } from '../../../lib/github-client';
import { generateDiaryContent, generateDiaryFilename } from '../../../lib/diary-utils';

export const prerender = false;

// localhost環境用の処理（従来の実装）
async function handleLocalSaveDraft(data: any) {
  try {
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
      }
    }

    return new Response(JSON.stringify({
      success: true,
      ...result,
      message: '下書きを保存しました（localhost）',
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    throw error;
  }
}

// Vercel環境用の処理（GitHub API）
async function handleGitHubSaveDraft(data: any) {
  try {
    const date = data.date || new Date().toISOString().split('T')[0];
    const filename = generateDiaryFilename(date, data.title);
    const githubPath = `src/content/diary/${filename}`;
    const content = generateDiaryContent({
      title: data.title,
      date,
      content: data.content,
      draft: true,
    });

    // 古いファイルを削除（該当する場合）
    if (data.oldFilename && data.oldFilename !== filename) {
      try {
        const oldPath = `src/content/diary/${data.oldFilename}`;
        const { sha } = await getFileContent(oldPath);
        await deleteFile(oldPath, `Delete old draft: ${data.oldFilename}`, sha);
      } catch (error) {
        console.warn('古いファイルの削除に失敗:', error);
      }
    }

    // ファイルを作成または更新
    let result;
    try {
      // 既存ファイルがある場合は更新、ない場合は作成
      const { sha } = await getFileContent(githubPath);
      result = await updateFile(githubPath, content, `Save draft: ${date}`, sha);
    } catch (error) {
      if (error instanceof GitHubAPIError && error.statusCode === 404) {
        // ファイルが存在しない場合は新規作成
        result = await createFile(githubPath, content, `Save draft: ${date}`);
      } else {
        throw error;
      }
    }

    return new Response(JSON.stringify({
      success: true,
      filename,
      date,
      message: '下書きを保存しました（GitHub API）',
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
      return await handleLocalSaveDraft(data);
    } else {
      return await handleGitHubSaveDraft(data);
    }

  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};