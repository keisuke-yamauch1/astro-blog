import type { CollectionEntry } from 'astro:content';
import { isPublished } from './date';

// Generic types for content with date
type ContentWithDate = {
  data: {
    date: Date;
    draft?: boolean;
  };
};

type ContentWithTags = ContentWithDate & {
  data: {
    tags?: string[];
  };
};

// Generic utility functions
export function sortByDate<T extends ContentWithDate>(entries: T[]): T[] {
  return [...entries].sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export function filterPublished<T extends ContentWithDate>(entries: T[]): T[] {
  return entries.filter(entry => !entry.data.draft && isPublished(entry.data.date));
}

export interface BaseFilter {
  maxEntries?: number;
}

export interface TagFilter extends BaseFilter {
  tags?: string[];
  excludeTags?: string[];
}

export function filterAndSort<T extends ContentWithDate>(
  entries: T[],
  filter: BaseFilter = {}
): T[] {
  let result = filterPublished(entries);
  result = sortByDate(result);

  if (filter.maxEntries) {
    result = result.slice(0, filter.maxEntries);
  }

  return result;
}

export function filterWithTags<T extends ContentWithTags>(
  entries: T[],
  filter: TagFilter = {}
): T[] {
  let result = filterPublished(entries);

  if (filter.tags?.length) {
    result = result.filter(entry =>
      filter.tags!.some(tag => entry.data.tags?.includes(tag))
    );
  }

  if (filter.excludeTags?.length) {
    result = result.filter(entry =>
      !filter.excludeTags!.some(tag => entry.data.tags?.includes(tag))
    );
  }

  result = sortByDate(result);

  if (filter.maxEntries) {
    result = result.slice(0, filter.maxEntries);
  }

  return result;
}

// Blog utility functions (aliases for backward compatibility)
export interface PostFilter {
  maxPosts?: number;
  tags?: string[];
  excludeTags?: string[];
}

export function sortPostsByDate(posts: CollectionEntry<'blog'>[]): CollectionEntry<'blog'>[] {
  return sortByDate(posts);
}

export function filterPublishedPosts(posts: CollectionEntry<'blog'>[]): CollectionEntry<'blog'>[] {
  return filterPublished(posts);
}

export function filterPosts(posts: CollectionEntry<'blog'>[], filter: PostFilter = {}): CollectionEntry<'blog'>[] {
  return filterWithTags(posts, {
    maxEntries: filter.maxPosts,
    tags: filter.tags,
    excludeTags: filter.excludeTags,
  });
}

export function getPostsByTag(posts: CollectionEntry<'blog'>[], tag: string): CollectionEntry<'blog'>[] {
  return filterPublished(posts).filter(post => post.data.tags?.includes(tag));
}

export function getAllTags(posts: CollectionEntry<'blog'>[]): string[] {
  const publishedPosts = filterPublished(posts);
  return [...new Set(publishedPosts.flatMap(post => post.data.tags || []))].sort();
}

// Emonicle utility functions (aliases for backward compatibility)
export interface EmonicleFilter {
  maxPosts?: number;
}

export function sortEmoniclesByDate(posts: CollectionEntry<'emonicle'>[]): CollectionEntry<'emonicle'>[] {
  return sortByDate(posts);
}

export function filterPublishedEmonicles(posts: CollectionEntry<'emonicle'>[]): CollectionEntry<'emonicle'>[] {
  return filterPublished(posts);
}

export function filterEmonicles(posts: CollectionEntry<'emonicle'>[], filter: EmonicleFilter = {}): CollectionEntry<'emonicle'>[] {
  return filterAndSort(posts, { maxEntries: filter.maxPosts });
}

// Diary utility functions (aliases for backward compatibility)
export interface DiaryFilter {
  maxEntries?: number;
}

export function sortDiariesByDate(entries: CollectionEntry<'diary'>[]): CollectionEntry<'diary'>[] {
  return sortByDate(entries);
}

export function filterPublishedDiaries(entries: CollectionEntry<'diary'>[]): CollectionEntry<'diary'>[] {
  return filterPublished(entries);
}

export function filterDiaries(entries: CollectionEntry<'diary'>[], filter: DiaryFilter = {}): CollectionEntry<'diary'>[] {
  return filterAndSort(entries, filter);
}
