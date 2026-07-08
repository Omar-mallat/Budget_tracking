import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';

const MenuRow = ({ icon, label, value, onPress, danger }) => (
  <TouchableOpacity style={styles.menuRow} onPress={onPress}>
    <Ionicons name={icon} size={20} color={danger ? '#ef4444' : '#6b7280'} style={styles.menuIcon} />
    <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>{label}</Text>
    {value && <Text style={styles.menuValue}>{value}</Text>}
    <Ionicons name="chevron-forward" size={16} color="#d1d5db" />
  </TouchableOpacity>
);

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [families, setFamilies] = useState([]);
  const [budgetStatus, setBudgetStatus] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [famRes, budgetRes] = await Promise.all([
        client.get('/families'),
        client.get('/budgets/status'),
      ]);
      setFamilies(famRes.data);
      setBudgetStatus(budgetRes.data);
    } catch (err) {
      console.error('Profile fetch error', err.message);
    } finally {
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, []));

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  const overBudgetCount = budgetStatus.filter(b => b.percentage >= 100).length;
  const nearLimitCount  = budgetStatus.filter(b => b.percentage >= 80 && b.percentage < 100).length;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
    >
      {/* Avatar */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.name?.[0]?.toUpperCase() || '?'}
          </Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      {/* Budget Health */}
      {budgetStatus.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Budget Health</Text>
          <View style={styles.card}>
            <View style={styles.healthRow}>
              <View style={styles.healthItem}>
                <Text style={[styles.healthNumber, { color: '#ef4444' }]}>{overBudgetCount}</Text>
                <Text style={styles.healthLabel}>Over Budget</Text>
              </View>
              <View style={styles.healthDivider} />
              <View style={styles.healthItem}>
                <Text style={[styles.healthNumber, { color: '#f59e0b' }]}>{nearLimitCount}</Text>
                <Text style={styles.healthLabel}>Near Limit</Text>
              </View>
              <View style={styles.healthDivider} />
              <View style={styles.healthItem}>
                <Text style={[styles.healthNumber, { color: '#10b981' }]}>
                  {budgetStatus.length - overBudgetCount - nearLimitCount}
                </Text>
                <Text style={styles.healthLabel}>On Track</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Family Workspaces */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Family Workspaces</Text>
        {families.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.emptyText}>No family workspace yet.</Text>
            <Text style={styles.emptySubText}>Go to the web app to create or join a family.</Text>
          </View>
        ) : (
          families.map(f => (
            <View key={f.id} style={styles.familyCard}>
              <View style={styles.familyIcon}>
                <Ionicons name="people" size={20} color="#6366f1" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.familyName}>{f.name}</Text>
                <Text style={styles.familyMeta}>
                  {f.members?.length} members · {f.myRole}
                </Text>
              </View>
              <View style={[
                styles.roleBadge,
                f.myRole === 'ADMIN' && styles.roleBadgeAdmin,
              ]}>
                <Text style={[styles.roleText, f.myRole === 'ADMIN' && styles.roleTextAdmin]}>
                  {f.myRole}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Menu */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.card}>
          <MenuRow
            icon="notifications-outline"
            label="Notifications"
            onPress={() => navigation.navigate('Notifications')}
          />
          <View style={styles.divider} />
          <MenuRow
            icon="log-out-outline"
            label="Sign Out"
            danger
            onPress={handleLogout}
          />
        </View>
      </View>

      <Text style={styles.version}>Family Finance · TND · v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  content: { paddingBottom: 40 },
  avatarSection: {
    backgroundColor: '#6366f1',
    alignItems: 'center',
    paddingTop: 64,
    paddingBottom: 32,
    paddingHorizontal: 20,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 32, fontWeight: '800', color: '#fff' },
  name: { fontSize: 20, fontWeight: '700', color: '#fff' },
  email: { fontSize: 13, color: '#c7d2fe', marginTop: 4 },
  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#6b7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  healthRow: { flexDirection: 'row', alignItems: 'center' },
  healthItem: { flex: 1, alignItems: 'center' },
  healthNumber: { fontSize: 28, fontWeight: '800' },
  healthLabel: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  healthDivider: { width: 1, height: 40, backgroundColor: '#f3f4f6' },
  familyCard: {
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
  familyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eef2ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  familyName: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
  familyMeta: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  roleBadgeAdmin: { backgroundColor: '#fef9c3' },
  roleText: { fontSize: 11, color: '#6b7280', fontWeight: '600' },
  roleTextAdmin: { color: '#92400e' },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
  },
  menuIcon: { marginRight: 14 },
  menuLabel: { flex: 1, fontSize: 15, color: '#1f2937' },
  menuLabelDanger: { color: '#ef4444' },
  menuValue: { fontSize: 13, color: '#9ca3af', marginRight: 8 },
  divider: { height: 1, backgroundColor: '#f3f4f6' },
  emptyText: { color: '#9ca3af', fontSize: 14 },
  emptySubText: { color: '#d1d5db', fontSize: 12, marginTop: 4 },
  version: { textAlign: 'center', color: '#d1d5db', fontSize: 11, marginTop: 32 },
});
