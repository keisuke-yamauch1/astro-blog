import { XMLParser } from 'fast-xml-parser';
import type { PodcastFeed, PodcastEpisode, PodcastChannel } from '../types/podcast';

const PODCAST_RSS_URL = 'https://rss.listen.style/p/kechiiiiin/rss';

export async function fetchPodcastFeed(): Promise<PodcastFeed> {
  const response = await fetch(PODCAST_RSS_URL);
  const xml = await response.text();

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
  });

  const result = parser.parse(xml);
  const channel = result.rss.channel;

  const podcastChannel: PodcastChannel = {
    title: channel.title,
    description: channel.description,
    image: channel.image?.url || channel['itunes:image']?.['@_href'],
    link: channel.link,
  };

  const items = Array.isArray(channel.item) ? channel.item : [channel.item];

  const episodes: PodcastEpisode[] = items.map((item: any) => ({
    title: item.title,
    description: item.description || '',
    pubDate: new Date(item.pubDate),
    duration: item['itunes:duration'] || '',
    audioUrl: item.enclosure?.['@_url'] || '',
    episodeUrl: item.link,
    image: item['itunes:image']?.['@_href'],
  }));

  episodes.sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());

  return { channel: podcastChannel, episodes };
}

export function formatDuration(duration: string): string {
  const parts = duration.split(':');
  if (parts.length === 3 && parts[0] === '00') {
    return `${parts[1]}:${parts[2]}`;
  }
  return duration;
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}
