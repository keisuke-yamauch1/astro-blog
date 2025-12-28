import { describe, it, expect } from 'vitest';
import { convertContent } from '../post-creator';

describe('コンテンツ変換関数', () => {
  describe('convertContent - YouTube URL変換', () => {
    it('YouTube URLをコンポーネントに変換する', () => {
      const input = 'https://www.youtube.com/watch?v=abc123';
      const result = convertContent(input, { convertUrls: true });

      expect(result.content).toContain('<YouTube id="abc123" playlabel="Play" />');
      expect(result.imports).toContain("import { YouTube } from 'astro-embed';");
      expect(result.isMdx).toBe(true);
    });

    it('youtu.be短縮URLを変換する', () => {
      const input = 'https://youtu.be/abc123';
      const result = convertContent(input, { convertUrls: true });

      expect(result.content).toContain('<YouTube id="abc123" playlabel="Play" />');
      expect(result.imports).toContain("import { YouTube } from 'astro-embed';");
      expect(result.isMdx).toBe(true);
    });

    it('Markdown形式のYouTube URLを変換する', () => {
      const input = '[Video Link](https://www.youtube.com/watch?v=abc123)';
      const result = convertContent(input, { convertUrls: true });

      expect(result.content).toContain('<YouTube id="abc123"');
      expect(result.isMdx).toBe(true);
    });

    it('複数のYouTube URLを変換する', () => {
      const input = `https://www.youtube.com/watch?v=abc123
https://www.youtube.com/watch?v=def456`;
      const result = convertContent(input, { convertUrls: true });

      expect(result.content).toContain('id="abc123"');
      expect(result.content).toContain('id="def456"');
      expect(result.imports).toHaveLength(1); // 重複排除
      expect(result.isMdx).toBe(true);
    });

    it('クエリパラメータ付きURLを変換する', () => {
      const input = 'https://www.youtube.com/watch?v=abc123&t=30s';
      const result = convertContent(input, { convertUrls: true });

      expect(result.content).toContain('id="abc123"');
      expect(result.isMdx).toBe(true);
    });
  });

  describe('convertContent - Twitter URL変換', () => {
    it('twitter.com URLをコンポーネントに変換する', () => {
      const input = 'https://twitter.com/user/status/1234567890';
      const result = convertContent(input, { convertUrls: true });

      expect(result.content).toContain('<Tweet id="https://twitter.com/user/status/1234567890" />');
      expect(result.imports).toContain("import { Tweet } from 'astro-embed';");
      expect(result.isMdx).toBe(true);
    });

    it('x.com URLをコンポーネントに変換する', () => {
      const input = 'https://x.com/user/status/1234567890';
      const result = convertContent(input, { convertUrls: true });

      expect(result.content).toContain('<Tweet id="https://x.com/user/status/1234567890" />');
      expect(result.isMdx).toBe(true);
    });

    it('www付きURLを変換する', () => {
      const input = 'https://www.twitter.com/user/status/1234567890';
      const result = convertContent(input, { convertUrls: true });

      expect(result.content).toContain('<Tweet id=');
      expect(result.isMdx).toBe(true);
    });

    it('複数のTwitter URLを変換する', () => {
      const input = `https://twitter.com/user1/status/111
https://x.com/user2/status/222`;
      const result = convertContent(input, { convertUrls: true });

      expect(result.content).toContain('status/111');
      expect(result.content).toContain('status/222');
      expect(result.imports).toHaveLength(1); // 重複排除
    });
  });

  describe('convertContent - Obsidian画像変換', () => {
    it('Obsidian画像構文を変換する', () => {
      const input = '![[image.png]]';
      const result = convertContent(input, { convertObsidianLinks: true });

      expect(result.content).toBe('![Image](../../assets/image.png)');
    });

    it('複数の画像を変換する', () => {
      const input = '![[image1.png]]\n![[image2.jpg]]';
      const result = convertContent(input, { convertObsidianLinks: true });

      expect(result.content).toContain('![Image](../../assets/image1.png)');
      expect(result.content).toContain('![Image](../../assets/image2.jpg)');
    });

    it('スペースを含むファイル名を変換する', () => {
      const input = '![[my image.png]]';
      const result = convertContent(input, { convertObsidianLinks: true });

      expect(result.content).toBe('![Image](../../assets/my image.png)');
    });
  });

  describe('convertContent - Obsidian日記リンク変換', () => {
    it('日記リンクを変換する', () => {
      const input = '[[2025-03-14_タイトル]]';
      const result = convertContent(input, { convertObsidianLinks: true });

      expect(result.content).toBe('[2025-03-14](/diary/2025/03/14)');
    });

    it('複数の日記リンクを変換する', () => {
      const input = '[[2025-03-14_タイトル1]]と[[2025-03-15_タイトル2]]';
      const result = convertContent(input, { convertObsidianLinks: true });

      expect(result.content).toContain('[2025-03-14](/diary/2025/03/14)');
      expect(result.content).toContain('[2025-03-15](/diary/2025/03/15)');
    });
  });

  describe('convertContent - Obsidianブログリンク変換', () => {
    it('ブログリンクを変換する（ゼロパディング削除）', () => {
      const input = '[[00001_タイトル]]';
      const result = convertContent(input, { convertObsidianLinks: true });

      expect(result.content).toBe('[タイトル](/blog/1)');
    });

    it('大きなIDの変換', () => {
      const input = '[[00123_タイトル]]';
      const result = convertContent(input, { convertObsidianLinks: true });

      expect(result.content).toBe('[タイトル](/blog/123)');
    });

    it('複数のブログリンクを変換する', () => {
      const input = '[[00001_タイトル1]]と[[00002_タイトル2]]';
      const result = convertContent(input, { convertObsidianLinks: true });

      expect(result.content).toContain('[タイトル1](/blog/1)');
      expect(result.content).toContain('[タイトル2](/blog/2)');
    });
  });

  describe('convertContent - 統合テスト', () => {
    it('すべての変換を同時に適用する', () => {
      const input = `![[image.png]]
[[2025-03-14_日記]]
[[00001_ブログ]]
https://www.youtube.com/watch?v=abc123
https://twitter.com/user/status/1234567890`;

      const result = convertContent(input);

      expect(result.content).toContain('![Image](../../assets/image.png)');
      expect(result.content).toContain('[2025-03-14](/diary/2025/03/14)');
      expect(result.content).toContain('[ブログ](/blog/1)');
      expect(result.content).toContain('<YouTube id="abc123"');
      expect(result.content).toContain('<Tweet id=');
      expect(result.imports).toHaveLength(2);
      expect(result.isMdx).toBe(true);
    });

    it('convertUrls: falseの場合、URL変換をスキップ', () => {
      const input = 'https://www.youtube.com/watch?v=abc123';
      const result = convertContent(input, { convertUrls: false });

      expect(result.content).toBe(input);
      expect(result.imports).toHaveLength(0);
      expect(result.isMdx).toBe(false);
    });

    it('convertObsidianLinks: falseの場合、Obsidianリンク変換をスキップ', () => {
      const input = '![[image.png]]';
      const result = convertContent(input, { convertObsidianLinks: false });

      expect(result.content).toBe(input);
    });

    it('複雑な混在コンテンツを変換する', () => {
      const input = `![[image1.png]]

[[2025-03-14_日記タイトル]]

本文テキスト

https://www.youtube.com/watch?v=video1

[[00002_別のブログ]]

![[image2.jpg]]

https://youtu.be/video2

https://x.com/user/status/789012`;

      const result = convertContent(input);

      expect(result.content).toContain('![Image](../../assets/image1.png)');
      expect(result.content).toContain('![Image](../../assets/image2.jpg)');
      expect(result.content).toContain('[2025-03-14](/diary/2025/03/14)');
      expect(result.content).toContain('[別のブログ](/blog/2)');
      expect(result.content).toContain('<YouTube id="video1"');
      expect(result.content).toContain('<YouTube id="video2"');
      expect(result.content).toContain('<Tweet id="https://x.com/user/status/789012"');
      expect(result.imports).toContain("import { YouTube } from 'astro-embed';");
      expect(result.imports).toContain("import { Tweet } from 'astro-embed';");
      expect(result.isMdx).toBe(true);
    });
  });

  describe('convertContent - エッジケース', () => {
    it('空文字列を処理する', () => {
      const result = convertContent('');

      expect(result.content).toBe('');
      expect(result.imports).toHaveLength(0);
      expect(result.isMdx).toBe(false);
    });

    it('変換対象がないコンテンツ', () => {
      const input = 'これは通常のテキストです。\n\n改行も含まれます。';
      const result = convertContent(input);

      expect(result.content).toBe(input);
      expect(result.imports).toHaveLength(0);
      expect(result.isMdx).toBe(false);
    });

    it('フロントマター付きコンテンツ（ボディのみ返す）', () => {
      const input = `---
title: テスト
---

本文内容`;
      const result = convertContent(input);

      expect(result.content).toBe('本文内容');
    });

    it('長いコンテンツを処理する', () => {
      const longContent = 'a'.repeat(10000);
      const result = convertContent(longContent);

      expect(result.content).toBe(longContent);
      expect(result.imports).toHaveLength(0);
      expect(result.isMdx).toBe(false);
    });

    it('特殊文字を含むObsidianリンク', () => {
      const input = '![[画像🎨.png]]';
      const result = convertContent(input, { convertObsidianLinks: true });

      expect(result.content).toBe('![Image](../../assets/画像🎨.png)');
    });

    it('YouTube URLに似ているが違うURL', () => {
      const input = 'https://www.youtube.com/channel/UC123456';
      const result = convertContent(input, { convertUrls: true });

      // watch?vまたはyoutu.beでない場合は変換されない
      expect(result.content).toBe(input);
      expect(result.isMdx).toBe(false);
    });

    it('不完全なObsidian構文', () => {
      const input = '![[incomplete';
      const result = convertContent(input, { convertObsidianLinks: true });

      // 不完全な構文は変換されない
      expect(result.content).toBe(input);
    });
  });

  describe('convertContent - タグ処理（間接的テスト）', () => {
    it('フロントマター内のタグを処理する（複数行配列形式）', () => {
      const input = `---
title: Test
tags:
  - astro_blog/tag1
  - astro_blog/tag2
---

本文`;
      const result = convertContent(input, { processTags: true });

      // convertContentはボディのみを返すため、フロントマターは含まれない
      expect(result.content).toBe('本文');
    });

    it('processTags: falseの場合、タグ処理をスキップ', () => {
      const input = `---
tags:
  - astro_blog/tag1
---

本文`;
      const result = convertContent(input, { processTags: false });

      expect(result.content).toBe('本文');
    });
  });

  describe('convertContent - オプションの組み合わせ', () => {
    it('すべてのオプションをfalseにする', () => {
      const input = `![[image.png]]
https://www.youtube.com/watch?v=abc123
[[00001_blog]]`;

      const result = convertContent(input, {
        convertUrls: false,
        convertObsidianLinks: false,
        processTags: false,
      });

      // 何も変換されない
      expect(result.content).toBe(input);
      expect(result.imports).toHaveLength(0);
      expect(result.isMdx).toBe(false);
    });

    it('URL変換のみ有効', () => {
      const input = `![[image.png]]
https://www.youtube.com/watch?v=abc123`;

      const result = convertContent(input, {
        convertUrls: true,
        convertObsidianLinks: false,
      });

      expect(result.content).toContain('<YouTube id="abc123"');
      expect(result.content).toContain('![[image.png]]'); // 変換されない
      expect(result.isMdx).toBe(true);
    });

    it('Obsidianリンク変換のみ有効', () => {
      const input = `![[image.png]]
https://www.youtube.com/watch?v=abc123`;

      const result = convertContent(input, {
        convertUrls: false,
        convertObsidianLinks: true,
      });

      expect(result.content).toContain('![Image](../../assets/image.png)');
      expect(result.content).toContain('https://www.youtube.com/watch?v=abc123'); // 変換されない
      expect(result.isMdx).toBe(false);
    });
  });
});
