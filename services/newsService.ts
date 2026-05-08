import axios from 'axios';

export interface NewsArticle {
  title: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: string;
}

const PROXY = 'https://corsproxy.io/?url=';

const FEEDS = [
  { url: 'https://feeds.marketwatch.com/marketwatch/topstories/', source: 'MarketWatch' },
  { url: 'https://feeds.reuters.com/reuters/businessNews', source: 'Reuters' },
  { url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html', source: 'CNBC' },
];

function decodeEntities(str: string): string {
  return str
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function extractTag(block: string, tag: string): string {
  const m = block.match(
    new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, 'i')
  );
  return m ? m[1].trim() : '';
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

async function parseFeed(feedUrl: string, source: string): Promise<NewsArticle[]> {
  const res = await axios.get(`${PROXY}${encodeURIComponent(feedUrl)}`, { timeout: 10000 });
  const xml: string = typeof res.data === 'string' ? res.data : '';
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) ?? [];

  return blocks.slice(0, 12).map((block) => ({
    title: decodeEntities(extractTag(block, 'title')),
    summary: decodeEntities(extractTag(block, 'description').replace(/<[^>]+>/g, '')).slice(0, 180),
    source,
    url: extractTag(block, 'link'),
    publishedAt: timeAgo(extractTag(block, 'pubDate')),
  }));
}

export async function fetchFinancialNews(): Promise<NewsArticle[]> {
  const results = await Promise.allSettled(FEEDS.map(({ url, source }) => parseFeed(url, source)));

  const articles: NewsArticle[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled') articles.push(...r.value);
  }
  return articles.slice(0, 30);
}
