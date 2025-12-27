import type { CollectionEntry } from 'astro:content';
import { isPublished } from './date';

export interface PostFilter {
  maxPosts?: number;
  tags?: string[];
  excludeTags?: string[];
}

export function sortPostsByDate(posts: CollectionEntry<'blog'>[]): CollectionEntry<'blog'>[] {
  return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export function filterPublishedPosts(posts: CollectionEntry<'blog'>[]): CollectionEntry<'blog'>[] {
  return posts.filter(post => !post.data.draft && isPublished(post.data.date));
}

export function filterPosts(posts: CollectionEntry<'blog'>[], filter: PostFilter = {}): CollectionEntry<'blog'>[] {
  let filteredPosts = filterPublishedPosts(posts);

  // Filter by tags
  if (filter.tags?.length) {
    filteredPosts = filteredPosts.filter(post => 
      filter.tags!.some(tag => post.data.tags?.includes(tag))
    );
  }

  // Filter by excluded tags
  if (filter.excludeTags?.length) {
    filteredPosts = filteredPosts.filter(post => 
      !filter.excludeTags!.some(tag => post.data.tags?.includes(tag))
    );
  }

  // Sort posts by date
  filteredPosts = sortPostsByDate(filteredPosts);

  // Limit number of posts if maxPosts is specified
  if (filter.maxPosts) {
    filteredPosts = filteredPosts.slice(0, filter.maxPosts);
  }

  return filteredPosts;
}

export function getPostsByTag(posts: CollectionEntry<'blog'>[], tag: string): CollectionEntry<'blog'>[] {
  return posts.filter(post => 
    post.data.tags?.includes(tag) &&
    !post.data.draft &&
    isPublished(post.data.date)
  );
}

export function getAllTags(posts: CollectionEntry<'blog'>[]): string[] {
  const publishedPosts = filterPublishedPosts(posts);
  return [...new Set(publishedPosts.flatMap(post => post.data.tags || []))].sort();
}

// Emonicle utility functions
export function sortEmoniclesByDate(posts: CollectionEntry<'emonicle'>[]): CollectionEntry<'emonicle'>[] {
  return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export function filterPublishedEmonicles(posts: CollectionEntry<'emonicle'>[]): CollectionEntry<'emonicle'>[] {
  return posts.filter(post => !post.data.draft && isPublished(post.data.date));
}

export interface EmonicleFilter {
  maxPosts?: number;
}

export function filterEmonicles(posts: CollectionEntry<'emonicle'>[], filter: EmonicleFilter = {}): CollectionEntry<'emonicle'>[] {
  let filteredPosts = filterPublishedEmonicles(posts);

  // Sort posts by date
  filteredPosts = sortEmoniclesByDate(filteredPosts);

  // Limit number of posts if maxPosts is specified
  if (filter.maxPosts) {
    filteredPosts = filteredPosts.slice(0, filter.maxPosts);
  }

  return filteredPosts;
}

// Diary utility functions
export function sortDiariesByDate(entries: CollectionEntry<'diary'>[]): CollectionEntry<'diary'>[] {
  return entries.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export function filterPublishedDiaries(entries: CollectionEntry<'diary'>[]): CollectionEntry<'diary'>[] {
  return entries.filter(entry => !entry.data.draft && isPublished(entry.data.date));
}

export interface DiaryFilter {
  maxEntries?: number;
}

export function filterDiaries(entries: CollectionEntry<'diary'>[], filter: DiaryFilter = {}): CollectionEntry<'diary'>[] {
  let filteredEntries = filterPublishedDiaries(entries);

  // Sort entries by date
  filteredEntries = sortDiariesByDate(filteredEntries);

  // Limit number of entries if maxEntries is specified
  if (filter.maxEntries) {
    filteredEntries = filteredEntries.slice(0, filter.maxEntries);
  }

  return filteredEntries;
}
