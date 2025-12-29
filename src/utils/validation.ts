import { matchesDateParts } from './date';

/**
 * IDベースの記事検証
 */
export function validateIdPost<T extends { data: { id: number } }>(
  post: T | undefined,
  id: string | undefined
): post is T {
  return post !== undefined &&
         post.data !== undefined &&
         post.data.id.toString() === id;
}

/**
 * 日付ベースの記事検証
 */
export function validateDatePost<T extends { data: { date: Date } }>(
  entry: T | undefined,
  params: { year?: string; month?: string; day?: string }
): entry is T {
  return entry !== undefined &&
         entry.data !== undefined &&
         matchesDateParts(entry.data.date, params);
}
