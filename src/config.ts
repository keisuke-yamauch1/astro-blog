import type { PostFilter } from "./utils/posts";

export interface SiteConfig {
  title: string;
  slogan: string;
  description?: string;
  site: string,
  social: {
    github?: string;
    linkedin?: string;
    email?: string;
    rss?: boolean;
    x?: string;
  };
  homepage: PostFilter;
  googleAnalysis?: string;
  search?: boolean;
}

export const siteConfig: SiteConfig = {
  site: "https://www.kechiiiiin.com/", // your site url
  title: "まあ、そうかもしれない",
  slogan: "このサイトについて",
  description: "けちーんです。ブログ書いたり、日記書いたり、自由に書いていきます",
  social: {
    github: "https://github.com/keisuke-yamauch1", // leave empty if you don't want to show the github
    // linkedin: "https://www.linkedin.com/in/someone/", // leave empty if you don't want to show the linkedin
    // email: "example@gmail.com", // leave empty if you don't want to show the email
    rss: true, // set this to false if you don't want to provide an rss feed
    x: "https://x.com/kechiiin_",
  },
  homepage: {
    maxPosts: 5,
    tags: [],
    excludeTags: [],
  },
  googleAnalysis: "", // your google analysis id
  search: true, // set this to false if you don't want to provide a search feature
};
