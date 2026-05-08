import axios from 'axios';

export interface RedditPost {
  title: string;
  score: number;
  numComments: number;
  url: string;
  subreddit: string;
  created: number;
}

export interface TickerSentiment {
  symbol: string;
  mentions: number;
  bullish: number;
  bearish: number;
  score: number; // -100 to 100
  posts: RedditPost[];
}

const PROXY = 'https://corsproxy.io/?url=';
const SUBREDDITS = ['wallstreetbets', 'stocks', 'investing'];

const BULLISH_WORDS = ['buy', 'bull', 'long', 'calls', 'moon', 'breakout', 'upside', 'growth', 'rally', 'pump'];
const BEARISH_WORDS = ['sell', 'bear', 'short', 'puts', 'crash', 'dump', 'downside', 'drop', 'fall', 'overvalued'];

function scoreSentiment(text: string): { bullish: number; bearish: number } {
  const lower = text.toLowerCase();
  const bullish = BULLISH_WORDS.filter((w) => lower.includes(w)).length;
  const bearish = BEARISH_WORDS.filter((w) => lower.includes(w)).length;
  return { bullish, bearish };
}

async function fetchSubredditPosts(subreddit: string): Promise<RedditPost[]> {
  const url = `https://www.reddit.com/r/${subreddit}/hot.json?limit=50`;
  const res = await axios.get(`${PROXY}${encodeURIComponent(url)}`, { timeout: 10000 });
  const children = res.data?.data?.children ?? [];
  return children.map((c: any) => ({
    title: c.data.title,
    score: c.data.score,
    numComments: c.data.num_comments,
    url: `https://reddit.com${c.data.permalink}`,
    subreddit,
    created: c.data.created_utc,
  }));
}

export interface MarketMood {
  totalPosts: number;
  bullish: number;
  bearish: number;
  score: number;
  topPosts: RedditPost[];
}

export async function fetchMarketMood(): Promise<MarketMood> {
  const results = await Promise.allSettled(SUBREDDITS.map(fetchSubredditPosts));
  const allPosts: RedditPost[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled') allPosts.push(...r.value);
  }

  let bullish = 0;
  let bearish = 0;
  for (const post of allPosts) {
    const s = scoreSentiment(post.title);
    bullish += s.bullish;
    bearish += s.bearish;
  }

  const total = bullish + bearish;
  const score = total === 0 ? 0 : Math.round(((bullish - bearish) / total) * 100);
  const topPosts = [...allPosts].sort((a, b) => b.score - a.score).slice(0, 5);

  return { totalPosts: allPosts.length, bullish, bearish, score, topPosts };
}

export async function fetchRedditSentiment(symbols: string[]): Promise<TickerSentiment[]> {
  const results = await Promise.allSettled(SUBREDDITS.map(fetchSubredditPosts));
  const allPosts: RedditPost[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled') allPosts.push(...r.value);
  }

  return symbols.map((symbol) => {
    const matched = allPosts.filter((p) =>
      p.title.toLowerCase().includes(symbol.toLowerCase()) ||
      p.title.includes(`$${symbol}`)
    );

    let bullish = 0;
    let bearish = 0;
    for (const post of matched) {
      const s = scoreSentiment(post.title);
      bullish += s.bullish;
      bearish += s.bearish;
    }

    const total = bullish + bearish;
    const score = total === 0 ? 0 : Math.round(((bullish - bearish) / total) * 100);

    return {
      symbol,
      mentions: matched.length,
      bullish,
      bearish,
      score,
      posts: matched.slice(0, 5),
    };
  });
}
