import axios from 'axios';

export interface NewsArticle {
  title: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: string;
}

const RSS_TO_JSON = 'https://api.rss2json.com/v1/api.json';

const FEEDS = [
  { url: 'https://feeds.content.dowjones.io/public/rss/mw_realtimeheadlines', source: 'MarketWatch' },
  { url: 'https://feeds.a.dj.com/rss/RSSMarketsMain.xml', source: 'WSJ Markets' },
  { url: 'https://www.investing.com/rss/news_25.rss', source: 'Investing.com' },
];

export async function fetchFinancialNews(): Promise<NewsArticle[]> {
  const results = await Promise.allSettled(
    FEEDS.map(({ url, source }) =>
      axios.get(RSS_TO_JSON, { params: { rss_url: url, count: 15 } }).then((res) => ({
        items: res.data?.items ?? [],
        source,
      }))
    )
  );

  const articles: NewsArticle[] = [];

  for (const result of results) {
    if (result.status !== 'fulfilled') continue;
    const { items, source } = result.value;
    for (const item of items) {
      articles.push({
        title: item.title ?? '',
        summary: (item.description ?? '').replace(/<[^>]+>/g, '').slice(0, 200),
        source: item.author || source,
        url: item.link ?? '',
        publishedAt: item.pubDate ?? '',
      });
    }
  }

  return articles.slice(0, 30);
}
