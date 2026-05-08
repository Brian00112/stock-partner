import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchStockQuote, StockQuote } from '../services/stockService';

const STORAGE_KEY = 'watchlist_symbols';

export default function WatchlistScreen() {
  const [symbols, setSymbols] = useState<string[]>([]);
  const [quotes, setQuotes] = useState<StockQuote[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadSymbols(); }, []);

  const loadSymbols = async () => {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    const list: string[] = saved ? JSON.parse(saved) : ['AAPL', 'MSFT', 'NVDA'];
    setSymbols(list);
    fetchQuotes(list);
  };

  const fetchQuotes = async (list: string[]) => {
    setLoading(true);
    const results = await Promise.allSettled(list.map(fetchStockQuote));
    const valid = results
      .filter((r): r is PromiseFulfilledResult<StockQuote> => r.status === 'fulfilled')
      .map((r) => r.value);
    setQuotes(valid);
    setLoading(false);
  };

  const addSymbol = async () => {
    const sym = input.trim().toUpperCase();
    if (!sym || symbols.includes(sym)) { setInput(''); return; }
    const updated = [...symbols, sym];
    setSymbols(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setInput('');
    fetchQuotes(updated);
  };

  const removeSymbol = async (sym: string) => {
    Alert.alert('삭제', `${sym}을(를) 관심 종목에서 제거할까요?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제', style: 'destructive', onPress: async () => {
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
      <Text style={styles.header}>⭐ Watchlist</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="종목 코드 입력 (예: TSLA)"
          placeholderTextColor="#555"
          value={input}
          onChangeText={setInput}
          autoCapitalize="characters"
          onSubmitEditing={addSymbol}
        />
        <TouchableOpacity style={styles.addBtn} onPress={addSymbol}>
          <Text style={styles.addBtnText}>추가</Text>
        </TouchableOpacity>
      </View>
      {loading ? <ActivityIndicator color="#00d4aa" style={{ marginTop: 20 }} /> : (
        <FlatList
          data={quotes}
          keyExtractor={(item) => item.symbol}
          renderItem={({ item }) => {
            const isUp = item.change >= 0;
            return (
              <TouchableOpacity style={styles.card} onLongPress={() => removeSymbol(item.symbol)}>
                <View>
                  <Text style={styles.symbol}>{item.symbol}</Text>
                  <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                </View>
                <View style={styles.right}>
                  <Text style={styles.price}>${item.price.toFixed(2)}</Text>
                  <Text style={[styles.change, { color: isUp ? '#00d4aa' : '#ff4d4d' }]}>
                    {isUp ? '+' : ''}{item.changePercent.toFixed(2)}%
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
          ListFooterComponent={<Text style={styles.hint}>길게 누르면 삭제</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0e1a', padding: 16 },
  header: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 16, marginTop: 8 },
  inputRow: { flexDirection: 'row', marginBottom: 16, gap: 8 },
  input: {
    flex: 1, backgroundColor: '#141824', color: '#fff', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 14,
  },
  addBtn: { backgroundColor: '#00d4aa', borderRadius: 10, paddingHorizontal: 16, justifyContent: 'center' },
  addBtnText: { color: '#000', fontWeight: 'bold', fontSize: 14 },
  card: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#141824', borderRadius: 12, padding: 16, marginBottom: 10,
  },
  symbol: { fontSize: 17, fontWeight: 'bold', color: '#fff' },
  name: { fontSize: 12, color: '#888', marginTop: 2, maxWidth: 180 },
  right: { alignItems: 'flex-end' },
  price: { fontSize: 17, fontWeight: 'bold', color: '#fff' },
  change: { fontSize: 13, marginTop: 2 },
  hint: { textAlign: 'center', color: '#444', fontSize: 12, marginTop: 8 },
});
