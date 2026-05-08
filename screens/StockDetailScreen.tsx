import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator,
  ScrollView, TouchableOpacity, Linking,
} from 'react-native';
import axios from 'axios';
import { fetchNewsBySymbol, NewsArticle } from '../services/newsService';

const PROXY = 'https://corsproxy.io/?url=';
const YAHOO_BASE = `${PROXY}https://query1.finance.yahoo.com/v8/finance/chart`;

interface StockDetail {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  high52: number;
  low52: number;
  volume: number;
  avgVolume: number;
  marketCap: number;
  open: number;
  prevClose: number;
}

function fmt(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toLocaleString()}`;
}

function fmtVol(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return String(n);
}

function Row({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, valueColor ? { color: valueColor } : null]}>{value}</Text>
    </View>
  );
}

export default function StockDetailScreen({ route, navigation }: any) {
  const { symbol } = route.params as { symbol: string };
  const [detail, setDetail] = useState<StockDetail | null>(null);
  const [relatedNews, setRelatedNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    navigation.setOptions({ title: symbol });
    load();
  }, [symbol]);

  const load = async () => {
    try {
      const [stockRes, newsRes] = await Promise.allSettled([
        axios.get(`${YAHOO_BASE}/${symbol}`, { params: { interval: '1d', range: '1d' } }),
        fetchNewsBySymbol(symbol),
      ]);
      if (stockRes.status === 'fulfilled') {
        const meta = stockRes.value.data.chart.result[0].meta;
        const price = meta.regularMarketPrice;
        const prev = meta.chartPreviousClose;
        setDetail({
          symbol,
          name: meta.shortName || symbol,
          price,
          change: price - prev,
          changePercent: ((price - prev) / prev) * 100,
          high52: meta.fiftyTwoWeekHigh,
          low52: meta.fiftyTwoWeekLow,
          volume: meta.regularMarketVolume,
          avgVolume: meta.averageDailyVolume3Month,
          marketCap: meta.marketCap,
          open: meta.regularMarketOpen,
          prevClose: prev,
        });
      } else {
        setError('Failed to load stock data.');
      }
      if (newsRes.status === 'fulfilled') setRelatedNews(newsRes.value.slice(0, 5));
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#00C896" /></View>;
  if (error || !detail) return <View style={styles.center}><Text style={styles.error}>{error}</Text></View>;

  const up = detail.change >= 0;
  const rangePercent = detail.high52 > detail.low52
    ? ((detail.price - detail.low52) / (detail.high52 - detail.low52)) * 100
    : 50;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.hero}>
        <Text style={styles.name}>{detail.name}</Text>
        <Text style={styles.price}>
          ${detail.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>
        <View style={[styles.changeBadge, { backgroundColor: up ? '#0d2e22' : '#2e0d0d' }]}>
          <Text style={[styles.changeText, { color: up ? '#00C896' : '#FF4757' }]}>
            {up ? '+' : ''}{detail.change.toFixed(2)} ({up ? '+' : ''}{detail.changePercent.toFixed(2)}%)
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>52-WEEK RANGE</Text>
        <View style={styles.rangeBar}>
          <View style={[styles.rangeThumb, { left: `${Math.min(Math.max(rangePercent, 2), 98)}%` as any }]} />
        </View>
        <View style={styles.rangeLabels}>
          <Text style={styles.rangeLabel}>${detail.low52.toFixed(2)}</Text>
          <Text style={styles.rangeLabel}>${detail.high52.toFixed(2)}</Text>
        </View>
      </View>

      {relatedNews.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>RELATED NEWS</Text>
          <View style={styles.statsCard}>
            {relatedNews.map((article, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.row, { flexDirection: 'column', alignItems: 'flex-start', gap: 4 }]}
                onPress={() => article.url && Linking.openURL(article.url)}
              >
                <Text style={{ fontSize: 11, color: '#00C896', fontWeight: '700' }}>{article.source} · {article.publishedAt}</Text>
                <Text style={{ fontSize: 13, color: '#E2E8F0', lineHeight: 18 }} numberOfLines={2}>{article.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>KEY STATS</Text>
        <View style={styles.statsCard}>
          <Row label="Open" value={`$${detail.open.toFixed(2)}`} />
          <Row label="Prev Close" value={`$${detail.prevClose.toFixed(2)}`} />
          <Row label="Volume" value={fmtVol(detail.volume)} />
          <Row label="Avg Volume" value={fmtVol(detail.avgVolume)} />
          {detail.marketCap ? <Row label="Market Cap" value={fmt(detail.marketCap)} /> : null}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0E17' },
  center: { flex: 1, backgroundColor: '#0B0E17', justifyContent: 'center', alignItems: 'center' },
  hero: { padding: 24, paddingBottom: 16 },
  name: { fontSize: 14, color: '#8892A4', marginBottom: 6 },
  price: { fontSize: 40, fontWeight: '700', color: '#fff', letterSpacing: -1 },
  changeBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginTop: 8 },
  changeText: { fontSize: 14, fontWeight: '600' },
  section: { paddingHorizontal: 20, marginTop: 20 },
  sectionTitle: { fontSize: 11, fontWeight: '600', color: '#8892A4', letterSpacing: 1, marginBottom: 10 },
  rangeBar: {
    height: 4, backgroundColor: '#1C2033', borderRadius: 2, marginBottom: 6, position: 'relative',
  },
  rangeThumb: {
    position: 'absolute', top: -4, width: 12, height: 12,
    borderRadius: 6, backgroundColor: '#00C896', marginLeft: -6,
  },
  rangeLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  rangeLabel: { fontSize: 12, color: '#8892A4' },
  statsCard: { backgroundColor: '#141824', borderRadius: 14, borderWidth: 1, borderColor: '#1C2033', overflow: 'hidden' },
  row: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 13,
    borderBottomWidth: 1, borderBottomColor: '#1C2033',
  },
  rowLabel: { fontSize: 14, color: '#8892A4' },
  rowValue: { fontSize: 14, fontWeight: '600', color: '#fff' },
  error: { color: '#FF4757' },
});
