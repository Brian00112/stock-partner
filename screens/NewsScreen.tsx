import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, Linking,
} from 'react-native';
import { fetchFinancialNews, NewsArticle } from '../services/newsService';

export default function NewsScreen() {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setError('');
      const data = await fetchFinancialNews();
      setNews(data);
    } catch {
      setError('뉴스를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);
  const onRefresh = () => { setRefreshing(true); load(); };

  if (loading) return <ActivityIndicator style={styles.center} size="large" color="#00d4aa" />;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>📰 Financial News</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={news}
        keyExtractor={(_, i) => String(i)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00d4aa" />}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => item.url && Linking.openURL(item.url)}>
            <Text style={styles.source}>{item.source}</Text>
            <Text style={styles.title}>{item.title}</Text>
            {item.summary ? <Text style={styles.summary}>{item.summary}</Text> : null}
            <Text style={styles.date}>{new Date(item.publishedAt).toLocaleDateString()}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0e1a', padding: 16 },
  center: { flex: 1, backgroundColor: '#0a0e1a' },
  header: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 16, marginTop: 8 },
  card: {
    backgroundColor: '#141824', borderRadius: 12, padding: 16, marginBottom: 12,
  },
  source: { fontSize: 11, color: '#00d4aa', fontWeight: '600', marginBottom: 4 },
  title: { fontSize: 15, fontWeight: '600', color: '#fff', marginBottom: 6 },
  summary: { fontSize: 13, color: '#aaa', lineHeight: 18, marginBottom: 8 },
  date: { fontSize: 11, color: '#666' },
  error: { color: '#ff4d4d', marginBottom: 8 },
});
