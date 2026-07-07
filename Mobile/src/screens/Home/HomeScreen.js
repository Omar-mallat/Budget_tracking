import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';

const StatCard = ({ label, amount, color, icon }) => (
  <View style={[styles.statCard, { borderLeftColor: color }]}>
    <Ionicons name={icon} size={20} color={color} style={styles.statIcon} />
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={[styles.statAmount, { color }]}>
      TND {Number(amount).toFixed(2)}
    </Text>
  </View>
);

const TransactionRow = ({ item }) => {
  const isIncome = item.type === 'income';
  return (
    <View style={styles.txRow}>
      <View style={[styles.txDot, { backgroundColor: isIncome ? '#10b981' : '#ef4444' }]} />
      <View style={styles.txInfo}>
        <Text style={styles.txDesc} numberOfLines={1}>{item.description || '—'}</Text>
        <Text style={styles.txDate}>{item.date?.substring(0, 10)}</Text>
      </View>
      <Text style={[styles.txAmount, { color: isIncome ? '#10b981' : '#ef4444' }]}>
        {isIncome ? '+' : '-'} TND {Number(item.amount).toFixed(2)}
      </Text>
    </View>
  );
};

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpenses: 0, totalBalance: 0 });
  const [transactions, setTransactions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [sumRes, txRes] = await Promise.all([
        client.get('/dashboard/summary'),
        client.get('/dashboard/transactions'),
      ]);
      setSummary(sumRes.data);
      setTransactions(txRes.data);
    } catch (err) {
      console.error('Home fetch error', err.message);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const balance = Number(summary.totalBalance ?? (summary.totalIncome - summary.totalExpenses));
  const isPositive = balance >= 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Hero balance banner */}
      <View style={styles.hero}>
        <Text style={styles.heroGreeting}>Hello, {user?.name?.split(' ')[0] || 'there'} 👋</Text>
        <Text style={styles.heroLabel}>Current Balance</Text>
        <Text style={[styles.heroBalance, { color: isPositive ? '#a5f3fc' : '#fca5a5' }]}>
          TND {balance.toFixed(2)}
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Stat Cards */}
        <View style={styles.statsRow}>
          <StatCard label="Income" amount={summary.totalIncome} color="#10b981" icon="arrow-up-circle" />
          <StatCard label="Expenses" amount={summary.totalExpenses} color="#ef4444" icon="arrow-down-circle" />
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#ef4444' }]}
            onPress={() => navigation.navigate('Add', { defaultType: 'EXPENSE' })}
          >
            <Ionicons name="remove-circle-outline" size={22} color="#fff" />
            <Text style={styles.actionText}>Add Expense</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#10b981' }]}
            onPress={() => navigation.navigate('Add', { defaultType: 'INCOME' })}
          >
            <Ionicons name="add-circle-outline" size={22} color="#fff" />
            <Text style={styles.actionText}>Add Income</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#6366f1' }]}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Ionicons name="notifications-outline" size={22} color="#fff" />
            <Text style={styles.actionText}>Alerts</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Transactions */}
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        <View style={styles.card}>
          {transactions.length === 0 ? (
            <Text style={styles.emptyText}>No transactions yet</Text>
          ) : (
            transactions.slice(0, 8).map((t, i) => <TransactionRow key={`${t.id}-${t.type}-${i}`} item={t} />)
          )}
          {transactions.length > 0 && (
            <TouchableOpacity
              style={styles.viewAllBtn}
              onPress={() => navigation.navigate('Transactions')}
            >
              <Text style={styles.viewAllText}>View all transactions →</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  hero: {
    backgroundColor: '#6366f1',
    paddingTop: 56,
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  heroGreeting: { color: '#c7d2fe', fontSize: 14, marginBottom: 8 },
  heroLabel: { color: '#e0e7ff', fontSize: 13 },
  heroBalance: { fontSize: 38, fontWeight: '800', marginTop: 4 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  statIcon: { marginBottom: 6 },
  statLabel: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  statAmount: { fontSize: 17, fontWeight: '700' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1f2937', marginBottom: 10, marginTop: 4 },
  quickActions: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  actionBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  actionText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  txDot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  txInfo: { flex: 1 },
  txDesc: { fontSize: 14, color: '#1f2937', fontWeight: '500' },
  txDate: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  txAmount: { fontSize: 14, fontWeight: '700' },
  viewAllBtn: { paddingTop: 12, alignItems: 'center' },
  viewAllText: { color: '#6366f1', fontSize: 13, fontWeight: '600' },
  emptyText: { color: '#9ca3af', textAlign: 'center', paddingVertical: 20 },
});
