/**
 * YouTubeリンクを埋め込みプレーヤーに変換するユーティリティ関数
 * @param {string} content - 変換するHTMLコンテンツ
 * @returns {string} - 変換後のHTMLコンテンツ
 */
export function convertYoutubeLinks(content) {
  if (!content) return content;
  
  const youtubeRegex = /<a[^>]*href="(https?:\/\/(www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11}))"[^>]*>(.*?)<\/a>/g;
  const youtubeShortRegex = /<a[^>]*href="(https?:\/\/(www\.)?youtu\.be\/([a-zA-Z0-9_-]{11}))"[^>]*>(.*?)<\/a>/g;
  
  let processedContent = content;
  
  processedContent = processedContent.replace(youtubeRegex, (match, url, domain, videoId) => {
    return `<div class="youtube-embed my-6 w-full aspect-video rounded-xl overflow-hidden shadow-lg">
      <iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" 
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
        allowfullscreen class="w-full h-full"></iframe>
    </div>`;
  });
  
  processedContent = processedContent.replace(youtubeShortRegex, (match, url, domain, videoId) => {
    return `<div class="youtube-embed my-6 w-full aspect-video rounded-xl overflow-hidden shadow-lg">
      <iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" 
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
        allowfullscreen class="w-full h-full"></iframe>
    </div>`;
  });
  
  return processedContent;
}
