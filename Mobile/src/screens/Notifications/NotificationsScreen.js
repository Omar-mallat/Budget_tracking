import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import client from '../../api/client';

const NotificationItem = ({ item, onRead, onDelete }) => (
  <View style={[styles.item, !item.read && styles.itemUnread]}>
    <View style={[styles.dot, { backgroundColor: item.read ? '#d1d5db' : '#6366f1' }]} />
    <View style={styles.itemBody}>
      <Text style={[styles.itemMessage, !item.read && styles.itemMessageBold]}>
        {item.message}
      </Text>
      <Text style={styles.itemTime}>
        {new Date(item.createdAt).toLocaleString()}
      </Text>
    </View>
    <View style={styles.itemActions}>
      {!item.read && (
        <TouchableOpacity onPress={() => onRead(item.id)} style={styles.actionIcon}>
          <Ionicons name="checkmark-circle-outline" size={20} color="#6366f1" />
        </TouchableOpacity>
      )}
      <TouchableOpacity onPress={() => onDelete(item.id)} style={styles.actionIcon}>
        <Ionicons name="trash-outline" size={18} color="#d1d5db" />
      </TouchableOpacity>
    </View>
  </View>
);

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await client.get('/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error('Notifications fetch error', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchNotifications(); }, []));

  const handleRead = async (id) => {
    try {
      await client.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error('Mark read error', err.message);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await client.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Mark all read error', err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await client.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error('Delete notification error', err.message);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={styles.headerSub}>{unreadCount} unread</Text>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAllRead}>
            <Ionicons name="checkmark-done" size={16} color="#6366f1" />
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#6366f1" size="large" />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={n => String(n.id)}
          renderItem={({ item }) => (
            <NotificationItem item={item} onRead={handleRead} onDelete={handleDelete} />
          )}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchNotifications(); }}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="notifications-off-outline" size={48} color="#e5e7eb" />
              <Text style={styles.emptyText}>All caught up!</Text>
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
  headerSub: { color: '#c7d2fe', fontSize: 13, marginTop: 2 },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  markAllText: { fontSize: 12, color: '#6366f1', fontWeight: '600' },
  list: { padding: 16, paddingBottom: 32 },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  itemUnread: { backgroundColor: '#eef2ff', borderLeftWidth: 3, borderLeftColor: '#6366f1' },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 5, marginRight: 12, flexShrink: 0 },
  itemBody: { flex: 1 },
  itemMessage: { fontSize: 13, color: '#4b5563', lineHeight: 18 },
  itemMessageBold: { color: '#1f2937', fontWeight: '600' },
  itemTime: { fontSize: 11, color: '#9ca3af', marginTop: 4 },
  itemActions: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 8 },
  actionIcon: { padding: 4 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { color: '#9ca3af', fontSize: 15, marginTop: 14 },
});
