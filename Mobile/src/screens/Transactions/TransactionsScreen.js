import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import client from '../../api/client';

const CATEGORIES = ['All', 'Food', 'Transport', 'Education', 'Healthcare', 'Rent', 'Bills', 'Entertainment', 'Clothing', 'Other'];

const TransactionItem = ({ item, onDelete }) => {
  const isIncome = item.type === 'income' || item.type === 'INCOME';
  return (
    <View style={styles.item}>
      <View style={[styles.badge, { backgroundColor: isIncome ? '#d1fae5' : '#fee2e2' }]}>
        <Ionicons
          name={isIncome ? 'arrow-up' : 'arrow-down'}
          size={16}
          color={isIncome ? '#10b981' : '#ef4444'}
        />
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemTitle} numberOfLines={1}>
          {item.title || item.description || item.source || '—'}
        </Text>
        <Text style={styles.itemMeta}>
          {item.category || '—'} · {item.date?.substring(0, 10)}
        </Text>
      </View>
      <View style={styles.itemRight}>
        <Text style={[styles.itemAmount, { color: isIncome ? '#10b981' : '#ef4444' }]}>
          {isIncome ? '+' : '-'} {Number(item.amount).toFixed(2)}
        </Text>
        <TouchableOpacity onPress={() => onDelete(item.id, isIncome)} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={14} color="#d1d5db" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function TransactionsScreen() {
  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'income' | 'expense'
  const [filterCategory, setFilterCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = async () => {
    try {
      const [expRes, incRes] = await Promise.all([
        client.get('/expenses'),
        client.get('/incomes'),
      ]);
      setExpenses(expRes.data.map(e => ({ ...e, type: 'expense' })));
      setIncomes(incRes.data.map(i => ({ ...i, type: 'income' })));
    } catch (err) {
      console.error('Transactions fetch error', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchAll(); }, []));

  const handleDelete = async (id, isIncome) => {
    try {
      if (isIncome) {
        await client.delete(`/incomes/${id}`);
        setIncomes(prev => prev.filter(i => i.id !== id));
      } else {
        await client.delete(`/expenses/${id}`);
        setExpenses(prev => prev.filter(e => e.id !== id));
      }
    } catch (err) {
      console.error('Delete error', err.message);
    }
  };

  const onRefresh = () => { setRefreshing(true); fetchAll(); };

  const all = [...expenses, ...incomes].sort((a, b) => new Date(b.date) - new Date(a.date));

  const filtered = all.filter(t => {
    if (filterType === 'income' && t.type !== 'income') return false;
    if (filterType === 'expense' && t.type !== 'expense') return false;
    if (filterCategory !== 'All' && t.category !== filterCategory) return false;
    const q = search.toLowerCase();
    if (q && !(t.title || t.description || t.source || '').toLowerCase().includes(q)) return false;
    return true;
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Transactions</Text>
        <Text style={styles.headerCount}>{filtered.length} records</Text>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={18} color="#9ca3af" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search transactions..."
          placeholderTextColor="#9ca3af"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>

      {/* Type Filter Tabs */}
      <View style={styles.tabs}>
        {[['all', 'All'], ['income', 'Income'], ['expense', 'Expense']].map(([val, label]) => (
          <TouchableOpacity
            key={val}
            style={[styles.tab, filterType === val && styles.tabActive]}
            onPress={() => setFilterType(val)}
          >
            <Text style={[styles.tabText, filterType === val && styles.tabTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Category Filter */}
      <FlatList
        horizontal
        data={CATEGORIES}
        keyExtractor={c => c}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.catList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.catChip, filterCategory === item && styles.catChipActive]}
            onPress={() => setFilterCategory(item)}
          >
            <Text style={[styles.catChipText, filterCategory === item && styles.catChipTextActive]}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* List */}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#6366f1" size="large" />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item, i) => `${item.id}-${item.type}-${i}`}
          renderItem={({ item }) => <TransactionItem item={item} onDelete={handleDelete} />}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="receipt-outline" size={48} color="#e5e7eb" />
              <Text style={styles.emptyText}>No transactions found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  header: {
    backgroundColor: '#6366f1',
    paddingTop: 56,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },
  headerCount: { color: '#c7d2fe', fontSize: 13 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#1f2937' },
  tabs: { flexDirection: 'row', marginHorizontal: 16, marginTop: 12, gap: 8 },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  tabActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  tabText: { fontSize: 13, color: '#6b7280', fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  catList: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  catChipActive: { backgroundColor: '#eef2ff', borderColor: '#6366f1' },
  catChipText: { fontSize: 12, color: '#6b7280', fontWeight: '500' },
  catChipTextActive: { color: '#6366f1', fontWeight: '700' },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  badge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemInfo: { flex: 1 },
  itemTitle: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
  itemMeta: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  itemRight: { alignItems: 'flex-end', gap: 4 },
  itemAmount: { fontSize: 14, fontWeight: '700' },
  deleteBtn: { padding: 4 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: '#9ca3af', fontSize: 14, marginTop: 12 },
});
