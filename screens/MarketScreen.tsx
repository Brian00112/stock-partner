import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl,
} from 'react-native';
import { fetchMarketIndices, StockQuote } from '../services/stockService';

export default function MarketScreen() {
  const [indices, setIndices] = useState<StockQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setError('');
      const data = await fetchMarketIndices();
      setIndices(data);
    } catch {
      setError('시장 데이터를 불러오지 못했습니다.');
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
      <Text style={styles.header}>📈 Market Overview</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={indices}
        keyExtractor={(item) => item.symbol}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00d4aa" />}
        renderItem={({ item }) => {
          const isUp = item.change >= 0;
          return (
            <View style={styles.card}>
              <View>
                <Text style={styles.indexName}>{item.name}</Text>
                <Text style={styles.symbol}>{item.symbol}</Text>
              </View>
              <View style={styles.right}>
                <Text style={styles.price}>{item.price.toLocaleString('en-US', { maximumFractionDigits: 2 })}</Text>
                <Text style={[styles.change, { color: isUp ? '#00d4aa' : '#ff4d4d' }]}>
                  {isUp ? '+' : ''}{item.change.toFixed(2)} ({isUp ? '+' : ''}{item.changePercent.toFixed(2)}%)
                </Text>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0e1a', padding: 16 },
  center: { flex: 1, backgroundColor: '#0a0e1a' },
  header: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 16, marginTop: 8 },
  card: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#141824', borderRadius: 12, padding: 16, marginBottom: 12,
  },
  indexName: { fontSize: 16, fontWeight: '600', color: '#fff' },
  symbol: { fontSize: 12, color: '#888', marginTop: 2 },
  right: { alignItems: 'flex-end' },
  price: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  change: { fontSize: 13, marginTop: 2 },
  error: { color: '#ff4d4d', marginBottom: 8 },
});
