import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Linking,
  ScrollView,
} from 'react-native';
import { fetchFinancialNews, NewsArticle } from '../services/newsService';

const SOURCE_COLORS: Record<string, string> = {
  MarketWatch: '#00C896',
  CNBC: '#FF6B35',
  Reuters: '#FF8C00',
};

const SOURCES = ['All', 'MarketWatch', 'CNBC', 'Reuters'];

function FilterBar({ active, onChange }: { active: string; onChange: (s: string) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
      {SOURCES.map((s) => {
        const isActive = s === active;
        const color = SOURCE_COLORS[s] ?? '#00C896';
        return (
          <TouchableOpacity
            key={s}
            onPress={() => onChange(s)}
            style={[styles.filterChip, isActive && { backgroundColor: color + '22', borderColor: color }]}
          >
            <Text style={[styles.filterText, isActive && { color }]}>{s}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

function NewsCard({ item }: { item: NewsArticle }) {
  const color = SOURCE_COLORS[item.source] ?? '#8892A4';
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => item.url && Linking.openURL(item.url)}
    >
      <View style={[styles.sourceDot, { backgroundColor: color }]} />
      <View style={styles.cardContent}>
        <View style={styles.cardMeta}>
          <Text style={[styles.source, { color }]}>{item.source}</Text>
          <Text style={styles.time}>{item.publishedAt}</Text>
        </View>
        <Text style={styles.title} numberOfLines={3}>{item.title}</Text>
        {item.summary ? (
          <Text style={styles.summary} numberOfLines={2}>{item.summary}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

export default function NewsScreen() {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [activeSource, setActiveSource] = useState('All');

  const filtered = useMemo(() =>
    activeSource === 'All' ? news : news.filter((a) => a.source === activeSource),
    [news, activeSource]
  );

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      setError('');
      setNews(await fetchFinancialNews());
    } catch {
      setError('Failed to load news.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#00C896" /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>News</Text>
        <Text style={styles.headerSub}>Finance & Markets</Text>
      </View>
      <FilterBar active={activeSource} onChange={setActiveSource} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!error && filtered.length === 0 && !loading ? (
        <Text style={styles.empty}>No articles found. Pull to refresh.</Text>
      ) : null}
      <FlatList
        data={filtered}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(true); }}
            tintColor="#00C896"
          />
        }
        renderItem={({ item }) => <NewsCard item={item} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0E17' },
  center: { flex: 1, backgroundColor: '#0B0E17', justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#fff', letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: '#8892A4', marginTop: 2 },
  filterBar: { marginBottom: 12 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: '#1C2033',
    backgroundColor: '#141824',
  },
  filterText: { fontSize: 13, fontWeight: '600', color: '#4A5568' },
  card: {
    flexDirection: 'row', marginHorizontal: 16, marginBottom: 10,
    backgroundColor: '#141824', borderRadius: 14,
    padding: 14, borderWidth: 1, borderColor: '#1C2033',
  },
  sourceDot: { width: 3, borderRadius: 2, marginRight: 12, alignSelf: 'stretch' },
  cardContent: { flex: 1 },
  cardMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  source: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  time: { fontSize: 11, color: '#4A5568' },
  title: { fontSize: 14, fontWeight: '600', color: '#E2E8F0', lineHeight: 20 },
  summary: { fontSize: 12, color: '#8892A4', marginTop: 4, lineHeight: 17 },
  error: { color: '#FF4757', paddingHorizontal: 20, marginBottom: 8 },
  empty: { color: '#4A5568', textAlign: 'center', marginTop: 60, fontSize: 14 },
});
