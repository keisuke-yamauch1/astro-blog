export interface DateParts {
  year: string;
  month: string;
  day: string;
}

export function getDateParts(date: Date): DateParts {
  return {
    year: date.getFullYear().toString(),
    month: (date.getMonth() + 1).toString().padStart(2, '0'),
    day: date.getDate().toString().padStart(2, '0'),
  };
}

export function getDiaryPath(date: Date): string {
  const { year, month, day } = getDateParts(date);
  return `/diary/${year}/${month}/${day}`;
}

export function matchesDateParts(
  date: Date,
  params: { year?: string; month?: string; day?: string }
): boolean {
  const parts = getDateParts(date);
  return parts.year === params.year &&
         parts.month === params.month &&
         parts.day === params.day;
}

export function formatDate(date: Date): string {
  const { year, month, day } = getDateParts(date);
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
