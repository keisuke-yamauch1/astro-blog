/**
 * TwitterリンクをTweetコンポーネントに変換するユーティリティ関数
 * @param {string} content - 変換するHTMLコンテンツ
 * @returns {string} - 変換後のHTMLコンテンツ
 */
export function convertTwitterLinks(content) {
  if (!content) return content;
  
  const twitterRegex = /<a[^>]*href="(https?:\/\/(www\.)?(twitter\.com|x\.com)\/[^\/]+\/status\/\d+)"[^>]*>(.*?)<\/a>/g;
  
  let processedContent = content;
  
  processedContent = processedContent.replace(twitterRegex, (match, url) => {
    return `<div class="twitter-embed my-6">
      <Tweet id="${url}" />
    </div>`;
  });
  
  return processedContent;
}
