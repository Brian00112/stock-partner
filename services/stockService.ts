import axios from 'axios';

const PROXY = 'https://corsproxy.io/?url=';
const YAHOO_BASE = `${PROXY}https://query1.finance.yahoo.com/v8/finance/chart`;

export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

const INDICES = [
  { symbol: '^GSPC', name: 'S&P 500' },
  { symbol: '^IXIC', name: 'NASDAQ' },
  { symbol: '^DJI', name: 'DOW JONES' },
  { symbol: '^VIX', name: 'VIX Volatility' },
  { symbol: 'SPY', name: 'SPY ETF' },
  { symbol: 'QQQ', name: 'QQQ ETF' },
  { symbol: 'IWM', name: 'Russell 2000 ETF' },
];

export async function fetchMarketIndices(): Promise<StockQuote[]> {
  const results = await Promise.all(
    INDICES.map(async ({ symbol, name }) => {
      const res = await axios.get(`${YAHOO_BASE}/${symbol}`, {
        params: { interval: '1d', range: '1d' },
      });
      const meta = res.data.chart.result[0].meta;
      const price = meta.regularMarketPrice;
      const prev = meta.chartPreviousClose;
      const change = price - prev;
      const changePercent = (change / prev) * 100;
      return { symbol, name, price, change, changePercent };
    })
  );
  return results;
}

export async function fetchStockQuote(symbol: string): Promise<StockQuote> {
  const res = await axios.get(`${YAHOO_BASE}/${symbol}`, {
    params: { interval: '1d', range: '1d' },
  });
  const meta = res.data.chart.result[0].meta;
  const price = meta.regularMarketPrice;
  const prev = meta.chartPreviousClose;
  const change = price - prev;
  const changePercent = (change / prev) * 100;
  return { symbol, name: meta.shortName || symbol, price, change, changePercent };
}
