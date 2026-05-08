import axios from 'axios';

export interface FearGreedData {
  score: number;
  label: string;
  previousClose: number;
  oneWeekAgo: number;
  oneMonthAgo: number;
}

const PROXY = 'https://corsproxy.io/?url=';
const CNN_URL = 'https://production.dataviz.cnn.io/index/fearandgreed/graphdata';

export async function fetchFearGreed(): Promise<FearGreedData> {
  const res = await axios.get(`${PROXY}${encodeURIComponent(CNN_URL)}`, { timeout: 8000 });
  const d = res.data.fear_and_greed;
  return {
    score: Math.round(d.score),
    label: d.rating,
    previousClose: Math.round(d.previous_close),
    oneWeekAgo: Math.round(d.previous_1_week),
    oneMonthAgo: Math.round(d.previous_1_month),
  };
}

export function fearGreedColor(score: number): string {
  if (score >= 75) return '#00C896';
  if (score >= 55) return '#7EC850';
  if (score >= 45) return '#F5A623';
  if (score >= 25) return '#FF6B35';
  return '#FF4757';
}
