import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { fetchMarketIndices, StockQuote } from '../services/stockService';
import { fetchFearGreed, fearGreedColor, FearGreedData } from '../services/sentimentService';

function today(): string {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

type MarketSession = 'pre' | 'open' | 'after' | 'closed';

function getMarketSession(): { session: MarketSession; label: string; next: string } {
  const now = new Date();
  const et = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const day = et.getDay();
  const h = et.getHours();
  const m = et.getMinutes();
  const mins = h * 60 + m;

  const isWeekend = day === 0 || day === 6;
  if (isWeekend) return { session: 'closed', label: 'Market Closed', next: 'Opens Monday 9:30 AM ET' };

  if (mins < 240) return { session: 'closed', label: 'Market Closed', next: 'Pre-market opens 4:00 AM ET' };
  if (mins < 570) return { session: 'pre', label: 'Pre-Market', next: 'Market opens 9:30 AM ET' };
  if (mins < 960) return { session: 'open', label: 'Market Open', next: 'Closes 4:00 PM ET' };
  if (mins < 1200) return { session: 'after', label: 'After Hours', next: 'Closes 8:00 PM ET' };
  return { session: 'closed', label: 'Market Closed', next: 'Pre-market opens 4:00 AM ET' };
}

const SESSION_COLORS: Record<MarketSession, string> = {
  open: '#00C896',
  pre: '#F5A623',
  after: '#7B68EE',
  closed: '#4A5568',
};

function FearGreedCard({ data }: { data: FearGreedData }) {
  const color = fearGreedColor(data.score);
  const pct = data.score;
  return (
    <View style={styles.fgCard}>
      <View style={styles.fgTop}>
        <View>
          <Text style={styles.fgTitle}>Fear & Greed Index</Text>
          <Text style={[styles.fgLabel, { color }]}>{data.label.toUpperCase()}</Text>
        </View>
        <Text style={[styles.fgScore, { color }]}>{data.score}</Text>
      </View>
      <View style={styles.fgBarBg}>
        <View style={[styles.fgBarFill, { width: `${pct}%` as any, backgroundColor: color }]} />
      </View>
      <View style={styles.fgFooter}>
        <Text style={styles.fgStat}>Prev <Text style={{ color: fearGreedColor(data.previousClose) }}>{data.previousClose}</Text></Text>
        <Text style={styles.fgStat}>1W <Text style={{ color: fearGreedColor(data.oneWeekAgo) }}>{data.oneWeekAgo}</Text></Text>
        <Text style={styles.fgStat}>1M <Text style={{ color: fearGreedColor(data.oneMonthAgo) }}>{data.oneMonthAgo}</Text></Text>
      </View>
    </View>
  );
}

function MarketStatusBanner() {
  const { session, label, next } = getMarketSession();
  const color = SESSION_COLORS[session];
  return (
    <View style={[styles.banner, { borderColor: color + '33', backgroundColor: color + '11' }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <View>
        <Text style={[styles.bannerLabel, { color }]}>{label}</Text>
        <Text style={styles.bannerNext}>{next}</Text>
      </View>
    </View>
  );
}

function vixLabel(price: number): { text: string; color: string } {
  if (price < 15) return { text: 'Low Fear', color: '#00C896' };
  if (price < 25) return { text: 'Moderate', color: '#F5A623' };
  if (price < 35) return { text: 'High Fear', color: '#FF6B35' };
  return { text: 'Extreme Fear', color: '#FF4757' };
}

function IndexCard({ item, onPress }: { item: StockQuote; onPress?: () => void }) {
  const up = item.change >= 0;
  const isVix = item.symbol === '^VIX';
  const vix = isVix ? vixLabel(item.price) : null;

  return (
    <TouchableOpacity style={styles.card} activeOpacity={onPress ? 0.7 : 1} onPress={onPress}>
      <View style={styles.cardTop}>
        <View>
          <Text style={styles.indexName}>{item.name}</Text>
          <Text style={styles.symbol}>{item.symbol}</Text>
        </View>
        {vix ? (
          <View style={[styles.badge, { backgroundColor: vix.color + '22' }]}>
            <Text style={[styles.badgeText, { color: vix.color }]}>{vix.text}</Text>
          </View>
        ) : (
          <View style={[styles.badge, { backgroundColor: up ? '#0d2e22' : '#2e0d0d' }]}>
            <Text style={[styles.badgeText, { color: up ? '#00C896' : '#FF4757' }]}>
              {up ? '▲' : '▼'} {Math.abs(item.changePercent).toFixed(2)}%
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.price}>
        {item.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </Text>
      <Text style={[styles.change, { color: up ? '#00C896' : '#FF4757' }]}>
        {up ? '+' : ''}{item.change.toFixed(2)} today
      </Text>
    </TouchableOpacity>
  );
}

export default function MarketScreen({ navigation }: any) {
  const [indices, setIndices] = useState<StockQuote[]>([]);
  const [fearGreed, setFearGreed] = useState<FearGreedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      setError('');
      const [indicesData, fgData] = await Promise.allSettled([
        fetchMarketIndices(),
        fetchFearGreed(),
      ]);
      if (indicesData.status === 'fulfilled') setIndices(indicesData.value);
      if (fgData.status === 'fulfilled') setFearGreed(fgData.value);
      if (indicesData.status === 'rejected') setError('Failed to load market data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#00C896" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Markets</Text>
        <Text style={styles.headerDate}>{today()}</Text>
      </View>
      <MarketStatusBanner />
      {fearGreed ? <FearGreedCard data={fearGreed} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={indices}
        keyExtractor={(item) => item.symbol}
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(true); }}
            tintColor="#00C896"
          />
        }
        ListHeaderComponent={<Text style={styles.sectionLabel}>US INDICES</Text>}
        renderItem={({ item }) => (
          <IndexCard
            item={item}
            onPress={!item.symbol.startsWith('^')
              ? () => navigation.navigate('StockDetail', { symbol: item.symbol })
              : undefined}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0E17' },
  center: { flex: 1, backgroundColor: '#0B0E17', justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#fff', letterSpacing: -0.5 },
  headerDate: { fontSize: 13, color: '#8892A4', marginTop: 2 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  bannerLabel: { fontSize: 13, fontWeight: '700' },
  bannerNext: { fontSize: 11, color: '#8892A4', marginTop: 1 },
  sectionLabel: {
    fontSize: 11, fontWeight: '600', color: '#8892A4',
    letterSpacing: 1, marginBottom: 10, paddingHorizontal: 20,
  },
  card: {
    marginHorizontal: 16, marginBottom: 12,
    backgroundColor: '#141824', borderRadius: 16,
    padding: 18, borderWidth: 1, borderColor: '#1C2033',
  },
  cardTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 12,
  },
  indexName: { fontSize: 15, fontWeight: '600', color: '#fff' },
  symbol: { fontSize: 12, color: '#8892A4', marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 13, fontWeight: '600' },
  price: { fontSize: 32, fontWeight: '700', color: '#fff', letterSpacing: -1 },
  change: { fontSize: 13, marginTop: 4, fontWeight: '500' },
  fgCard: {
    marginHorizontal: 16, marginBottom: 16,
    backgroundColor: '#141824', borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: '#1C2033',
  },
  fgTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  fgTitle: { fontSize: 12, color: '#8892A4', fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 },
  fgLabel: { fontSize: 16, fontWeight: '700' },
  fgScore: { fontSize: 40, fontWeight: '700', letterSpacing: -1 },
  fgBarBg: { height: 6, backgroundColor: '#1C2033', borderRadius: 3, marginBottom: 10 },
  fgBarFill: { height: 6, borderRadius: 3 },
  fgFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  fgStat: { fontSize: 12, color: '#8892A4' },
  error: { color: '#FF4757', paddingHorizontal: 20, marginBottom: 8 },
});
