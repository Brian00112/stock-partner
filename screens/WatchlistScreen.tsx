import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchStockQuote, StockQuote } from '../services/stockService';

const STORAGE_KEY = 'watchlist_symbols';
const DEFAULT_SYMBOLS = ['AAPL', 'MSFT', 'NVDA'];

export default function WatchlistScreen({ navigation }: any) {
  const [symbols, setSymbols] = useState<string[]>([]);
  const [quotes, setQuotes] = useState<StockQuote[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { init(); }, []);

  const init = async () => {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    const list: string[] = saved ? JSON.parse(saved) : DEFAULT_SYMBOLS;
    setSymbols(list);
    loadQuotes(list);
  };

  const loadQuotes = async (list: string[]) => {
    setLoading(true);
    const results = await Promise.allSettled(list.map(fetchStockQuote));
    setQuotes(
      results
        .filter((r): r is PromiseFulfilledResult<StockQuote> => r.status === 'fulfilled')
        .map((r) => r.value)
        .sort((a, b) => a.symbol.localeCompare(b.symbol))
    );
    setLoading(false);
  };

  const addSymbol = async () => {
    const sym = input.trim().toUpperCase();
    if (!sym || symbols.includes(sym)) { setInput(''); return; }
    const updated = [...symbols, sym];
    setSymbols(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setInput('');
    loadQuotes(updated);
  };

  const removeSymbol = (sym: string) => {
    Alert.alert('Remove', `Remove ${sym} from your watchlist?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          const updated = symbols.filter((s) => s !== sym);
          setSymbols(updated);
          setQuotes((q) => q.filter((item) => item.symbol !== sym));
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Watchlist</Text>
        <Text style={styles.headerSub}>{quotes.length} stocks tracked</Text>
      </View>

      {quotes.length > 0 && (() => {
        const gainers = quotes.filter((q) => q.change > 0).length;
        const losers = quotes.filter((q) => q.change < 0).length;
        const avgChange = quotes.reduce((s, q) => s + q.changePercent, 0) / quotes.length;
        const up = avgChange >= 0;
        return (
          <View style={styles.summaryCard}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Avg Change</Text>
              <Text style={[styles.summaryValue, { color: up ? '#00C896' : '#FF4757' }]}>
                {up ? '+' : ''}{avgChange.toFixed(2)}%
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Gainers</Text>
              <Text style={[styles.summaryValue, { color: '#00C896' }]}>{gainers}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Losers</Text>
              <Text style={[styles.summaryValue, { color: '#FF4757' }]}>{losers}</Text>
            </View>
          </View>
        );
      })()}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Add ticker (e.g. TSLA)"
          placeholderTextColor="#4A5568"
          value={input}
          onChangeText={setInput}
          autoCapitalize="characters"
          onSubmitEditing={addSymbol}
          returnKeyType="done"
        />
        <TouchableOpacity style={styles.addBtn} onPress={addSymbol}>
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color="#00C896" style={{ marginTop: 32 }} />
      ) : (
        <FlatList
          data={quotes}
          keyExtractor={(item) => item.symbol}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => {
            const up = item.change >= 0;
            return (
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('StockDetail', { symbol: item.symbol })}
                onLongPress={() => removeSymbol(item.symbol)}
              >
                <View style={styles.cardLeft}>
                  <View style={styles.symbolBadge}>
                    <Text style={styles.symbolText}>{item.symbol.slice(0, 2)}</Text>
                  </View>
                  <View>
                    <Text style={styles.symbol}>{item.symbol}</Text>
                    <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                  </View>
                </View>
                <View style={styles.cardRight}>
                  <Text style={styles.price}>${item.price.toFixed(2)}</Text>
                  <View style={[styles.changeBadge, { backgroundColor: up ? '#0d2e22' : '#2e0d0d' }]}>
                    <Text style={[styles.changeText, { color: up ? '#00C896' : '#FF4757' }]}>
                      {up ? '+' : ''}{item.changePercent.toFixed(2)}%
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
          ListFooterComponent={
            quotes.length > 0 ? (
              <Text style={styles.hint}>Long press to remove</Text>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0E17' },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#fff', letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: '#8892A4', marginTop: 2 },
  inputRow: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 16, gap: 8 },
  input: {
    flex: 1,
    backgroundColor: '#141824',
    color: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#1C2033',
  },
  addBtn: {
    backgroundColor: '#00C896',
    borderRadius: 12,
    width: 46,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnText: { color: '#000', fontSize: 24, fontWeight: '600', lineHeight: 28 },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: '#141824',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1C2033',
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  symbolBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#1C2033',
    justifyContent: 'center',
    alignItems: 'center',
  },
  symbolText: { fontSize: 13, fontWeight: '700', color: '#8892A4' },
  symbol: { fontSize: 15, fontWeight: '700', color: '#fff' },
  name: { fontSize: 12, color: '#8892A4', marginTop: 2, maxWidth: 160 },
  cardRight: { alignItems: 'flex-end', gap: 6 },
  price: { fontSize: 16, fontWeight: '700', color: '#fff' },
  changeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  changeText: { fontSize: 12, fontWeight: '600' },
  summaryCard: {
    flexDirection: 'row', marginHorizontal: 16, marginBottom: 14,
    backgroundColor: '#141824', borderRadius: 14,
    borderWidth: 1, borderColor: '#1C2033', overflow: 'hidden',
  },
  summaryItem: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  summaryLabel: { fontSize: 11, color: '#8892A4', marginBottom: 4 },
  summaryValue: { fontSize: 18, fontWeight: '700' },
  summaryDivider: { width: 1, backgroundColor: '#1C2033' },
  hint: { textAlign: 'center', color: '#2D3748', fontSize: 12, marginTop: 12 },
});
