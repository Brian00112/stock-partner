import Anthropic from '@anthropic-ai/sdk';
import { NewsArticle } from './newsService';
import { TickerSentiment } from './redditService';
import { StockQuote } from './stockService';

const API_KEY = process.env.EXPO_PUBLIC_CLAUDE_API_KEY ?? '';

export interface AIAnalysis {
  summary: string;
  signal: 'bullish' | 'bearish' | 'neutral';
  confidence: 'high' | 'medium' | 'low';
  keyPoints: string[];
}

function buildClient(): Anthropic {
  return new Anthropic({ apiKey: API_KEY, dangerouslyAllowBrowser: true });
}

export async function analyzeStock(
  quote: StockQuote,
  news: NewsArticle[],
  reddit: TickerSentiment | null
): Promise<AIAnalysis> {
  const client = buildClient();

  const newsText = news.slice(0, 5).map((a) => `- ${a.title}`).join('\n');
  const redditText = reddit
    ? `Reddit: ${reddit.mentions} mentions, ${reddit.bullish} bullish signals, ${reddit.bearish} bearish signals`
    : 'No Reddit data available';

  const prompt = `Analyze ${quote.symbol} (${quote.name}) based on the following data:

Price: $${quote.price.toFixed(2)} (${quote.changePercent >= 0 ? '+' : ''}${quote.changePercent.toFixed(2)}% today)

Recent news:
${newsText || 'No recent news found'}

${redditText}

Respond in JSON with this exact structure:
{
  "summary": "2-3 sentence analysis",
  "signal": "bullish" | "bearish" | "neutral",
  "confidence": "high" | "medium" | "low",
  "keyPoints": ["point 1", "point 2", "point 3"]
}`;

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Invalid response format');

  return JSON.parse(jsonMatch[0]) as AIAnalysis;
}

export async function analyzeMarket(
  indices: StockQuote[],
  fearGreedScore: number,
  redditScore: number,
  topNews: NewsArticle[]
): Promise<AIAnalysis> {
  const client = buildClient();

  const indicesText = indices
    .filter((i) => i.symbol.startsWith('^'))
    .map((i) => `${i.name}: ${i.changePercent >= 0 ? '+' : ''}${i.changePercent.toFixed(2)}%`)
    .join(', ');

  const newsText = topNews.slice(0, 4).map((a) => `- ${a.title}`).join('\n');

  const prompt = `Analyze today's US stock market based on:

Indices: ${indicesText}
Fear & Greed Index: ${fearGreedScore}/100
Reddit Market Mood: ${redditScore > 0 ? 'Bullish' : 'Bearish'} (${Math.abs(redditScore)}%)

Top headlines:
${newsText || 'No headlines available'}

Respond in JSON with this exact structure:
{
  "summary": "2-3 sentence market overview",
  "signal": "bullish" | "bearish" | "neutral",
  "confidence": "high" | "medium" | "low",
  "keyPoints": ["point 1", "point 2", "point 3"]
}`;

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Invalid response format');

  return JSON.parse(jsonMatch[0]) as AIAnalysis;
}
