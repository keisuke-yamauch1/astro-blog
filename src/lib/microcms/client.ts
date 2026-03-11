import { createClient } from 'microcms-js-sdk';

// microCMSクライアント初期化（サーバーサイド用）
// クライアント側で実行されないように条件付きで初期化
export const microCMSClient = typeof window === 'undefined'
  ? createClient({
      serviceDomain: import.meta.env.MICROCMS_SERVICE_DOMAIN || '',
      apiKey: import.meta.env.MICROCMS_API_KEY || '',
    })
  : null as any;

// microCMSクライアント初期化（クライアントサイド用）
// ブラウザで実行されるため、環境変数をPropsとして受け取る
export function createClientForPreview(serviceDomain: string, apiKey: string) {
  if (typeof window === 'undefined') {
    throw new Error('createClientForPreview can only be used in the browser');
  }

  return createClient({
    serviceDomain,
    apiKey,
  });
}
