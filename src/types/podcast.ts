export interface PodcastChannel {
  title: string;
  description: string;
  image: string;
  link: string;
}

export interface PodcastEpisode {
  title: string;
  description: string;
  pubDate: Date;
  duration: string;
  audioUrl: string;
  episodeUrl: string;
  image?: string;
}

export interface PodcastFeed {
  channel: PodcastChannel;
  episodes: PodcastEpisode[];
}
