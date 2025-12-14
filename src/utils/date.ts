export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
}

export function isPublished(date: Date): boolean {
  // 現在のJST日付を取得（年/月/日のみ）
  const now = new Date();
  const jstNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));

  // 記事の日付をJSTとして解釈（年/月/日のみ）
  const jstArticleDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));

  // 日付のみで比較（時刻は無視）
  jstNow.setHours(0, 0, 0, 0);
  jstArticleDate.setHours(0, 0, 0, 0);

  return jstArticleDate <= jstNow;
}
