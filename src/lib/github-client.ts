import { Octokit } from 'octokit';

// カスタムエラークラス
export class GitHubAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public apiError?: any
  ) {
    super(message);
    this.name = 'GitHubAPIError';
  }
}

// Octokitクライアントの初期化
export function getGitHubClient() {
  const token = import.meta.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error('GITHUB_TOKEN is not configured');
  }
  return new Octokit({ auth: token });
}

// リポジトリ情報の取得
export function getRepoInfo() {
  const owner = import.meta.env.GITHUB_OWNER;
  const repo = import.meta.env.GITHUB_REPO;

  if (!owner || !repo) {
    throw new Error('GITHUB_OWNER and GITHUB_REPO must be configured');
  }

  return { owner, repo };
}

// ファイルの取得（Content API）
export async function getFileContent(path: string): Promise<{ content: string; sha: string }> {
  const octokit = getGitHubClient();
  const { owner, repo } = getRepoInfo();

  try {
    const { data } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path,
      ref: 'main',
    });

    // ファイルの場合のみ処理
    if ('content' in data && data.type === 'file') {
      // Base64デコード
      const content = Buffer.from(data.content, 'base64').toString('utf-8');
      return { content, sha: data.sha };
    }

    throw new GitHubAPIError('Not a file');
  } catch (error: any) {
    if (error.status === 404) {
      throw new GitHubAPIError('ファイルが見つかりません', 404, error);
    } else if (error.status === 401) {
      throw new GitHubAPIError('GitHub認証が無効です', 401, error);
    } else if (error instanceof GitHubAPIError) {
      throw error;
    } else {
      throw new GitHubAPIError(`Failed to get file: ${error.message}`, error.status, error);
    }
  }
}

// ファイルの更新（Content API）
export async function updateFile(
  path: string,
  content: string,
  message: string,
  sha: string
): Promise<{ success: boolean; commit: string; url?: string }> {
  const octokit = getGitHubClient();
  const { owner, repo } = getRepoInfo();

  try {
    const { data } = await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message,
      content: Buffer.from(content).toString('base64'),
      sha,
      branch: 'main',
    });

    return {
      success: true,
      commit: data.commit.sha,
      url: data.content?.html_url,
    };
  } catch (error: any) {
    if (error.status === 404) {
      throw new GitHubAPIError('ファイルが見つかりません', 404, error);
    } else if (error.status === 401) {
      throw new GitHubAPIError('GitHub認証が無効です', 401, error);
    } else if (error.status === 409) {
      throw new GitHubAPIError('ファイルが他で更新されています（再読み込みしてください）', 409, error);
    } else if (error.status === 403 && error.message?.includes('rate limit')) {
      throw new GitHubAPIError('GitHub APIのレート制限に達しました', 403, error);
    } else {
      throw new GitHubAPIError(`Failed to update file: ${error.message}`, error.status, error);
    }
  }
}

// ファイルの作成（Content API）
export async function createFile(
  path: string,
  content: string,
  message: string
): Promise<{ success: boolean; commit: string; url?: string }> {
  const octokit = getGitHubClient();
  const { owner, repo } = getRepoInfo();

  try {
    const { data } = await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message,
      content: Buffer.from(content).toString('base64'),
      branch: 'main',
    });

    return {
      success: true,
      commit: data.commit.sha,
      url: data.content?.html_url,
    };
  } catch (error: any) {
    if (error.status === 401) {
      throw new GitHubAPIError('GitHub認証が無効です', 401, error);
    } else if (error.status === 403 && error.message?.includes('rate limit')) {
      throw new GitHubAPIError('GitHub APIのレート制限に達しました', 403, error);
    } else if (error.status === 422) {
      throw new GitHubAPIError('ファイルが既に存在します', 422, error);
    } else {
      throw new GitHubAPIError(`Failed to create file: ${error.message}`, error.status, error);
    }
  }
}

// ファイルの削除（Content API）
export async function deleteFile(
  path: string,
  message: string,
  sha: string
): Promise<{ success: boolean; commit: string }> {
  const octokit = getGitHubClient();
  const { owner, repo } = getRepoInfo();

  try {
    const { data } = await octokit.rest.repos.deleteFile({
      owner,
      repo,
      path,
      message,
      sha,
      branch: 'main',
    });

    return {
      success: true,
      commit: data.commit.sha,
    };
  } catch (error: any) {
    if (error.status === 404) {
      throw new GitHubAPIError('ファイルが見つかりません', 404, error);
    } else if (error.status === 401) {
      throw new GitHubAPIError('GitHub認証が無効です', 401, error);
    } else if (error.status === 409) {
      throw new GitHubAPIError('ファイルが他で更新されています（再読み込みしてください）', 409, error);
    } else {
      throw new GitHubAPIError(`Failed to delete file: ${error.message}`, error.status, error);
    }
  }
}
