import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Modal, TextInput, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import client from '../../api/client';

const GoalCard = ({ goal, onContribute, onDelete }) => {
  const current = Number(goal.currentAmount);
  const target  = Number(goal.targetAmount);
  const pct     = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  const achieved = current >= target;

  return (
    <View style={[styles.card, achieved && styles.cardAchieved]}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{goal.title}</Text>
          {goal.deadline && (
            <Text style={styles.cardDeadline}>
              Deadline: {new Date(goal.deadline).toLocaleDateString()}
            </Text>
          )}
        </View>
        {achieved && (
          <View style={styles.achievedBadge}>
            <Text style={styles.achievedText}>🎉 Done!</Text>
          </View>
        )}
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: achieved ? '#10b981' : '#6366f1' }]} />
      </View>

      <View style={styles.cardAmounts}>
        <Text style={styles.cardSaved}>TND {current.toFixed(2)} saved</Text>
        <Text style={styles.cardPct}>{pct.toFixed(0)}%</Text>
        <Text style={styles.cardTarget}>/ TND {target.toFixed(2)}</Text>
      </View>

      {!achieved && (
        <Text style={styles.cardRemaining}>
          TND {Math.max(0, target - current).toFixed(2)} remaining
        </Text>
      )}

      <View style={styles.cardActions}>
        {!achieved && (
          <TouchableOpacity style={styles.contributeBtn} onPress={() => onContribute(goal)}>
            <Ionicons name="add-circle-outline" size={16} color="#6366f1" />
            <Text style={styles.contributeBtnText}>Add Contribution</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.deleteGoalBtn} onPress={() => onDelete(goal.id)}>
          <Ionicons name="trash-outline" size={15} color="#d1d5db" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function GoalsScreen() {
  const [families, setFamilies] = useState([]);
  const [familyId, setFamilyId] = useState(null);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Create goal modal
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [newDeadline, setNewDeadline] = useState('');

  // Contribute modal
  const [contributeGoal, setContributeGoal] = useState(null);
  const [contribution, setContribution] = useState('');

  const fetchData = async () => {
    try {
      const famRes = await client.get('/families');
      setFamilies(famRes.data);
      const fid = famRes.data[0]?.id;
      setFamilyId(fid);
      if (fid) {
        const goalRes = await client.get(`/savings-goals?familyId=${fid}`);
        setGoals(goalRes.data);
      }
    } catch (err) {
      console.error('Goals fetch error', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, []));

  const handleCreateGoal = async () => {
    if (!newTitle.trim() || !newTarget) {
      Alert.alert('Error', 'Title and target amount are required');
      return;
    }
    try {
      await client.post('/savings-goals', {
        familyId,
        title: newTitle.trim(),
        targetAmount: parseFloat(newTarget),
        deadline: newDeadline || undefined,
      });
      setShowCreate(false);
      setNewTitle(''); setNewTarget(''); setNewDeadline('');
      const res = await client.get(`/savings-goals?familyId=${familyId}`);
      setGoals(res.data);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Could not create goal');
    }
  };

  const handleContribute = async () => {
    const amt = parseFloat(contribution);
    if (!amt || amt <= 0) { Alert.alert('Error', 'Enter a valid amount'); return; }
    try {
      await client.put(`/savings-goals/${contributeGoal.id}/contribute`, { amount: amt });
      setContributeGoal(null);
      setContribution('');
      const res = await client.get(`/savings-goals?familyId=${familyId}`);
      setGoals(res.data);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Could not save contribution');
    }
  };

  const handleDelete = async (id) => {
    Alert.alert('Delete Goal', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await client.delete(`/savings-goals/${id}`);
            setGoals(prev => prev.filter(g => g.id !== id));
          } catch (err) {
            Alert.alert('Error', 'Could not delete goal');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Savings Goals</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => familyId ? setShowCreate(true) : Alert.alert('No Family', 'Create or join a family first.')}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {!familyId && !loading && (
        <View style={styles.noFamily}>
          <Ionicons name="people-outline" size={40} color="#d1d5db" />
          <Text style={styles.noFamilyText}>Join or create a family to set savings goals</Text>
        </View>
      )}

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#6366f1" size="large" />
      ) : (
        <FlatList
          data={goals}
          keyExtractor={g => String(g.id)}
          renderItem={({ item }) => (
            <GoalCard goal={item} onContribute={setContributeGoal} onDelete={handleDelete} />
          )}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
          ListEmptyComponent={
            familyId ? (
              <View style={styles.empty}>
                <Ionicons name="flag-outline" size={48} color="#e5e7eb" />
                <Text style={styles.emptyText}>No savings goals yet</Text>
                <TouchableOpacity onPress={() => setShowCreate(true)}>
                  <Text style={styles.emptyLink}>Create your first goal →</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
        />
      )}

      {/* Create Goal Modal */}
      <Modal visible={showCreate} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>New Savings Goal</Text>

            <Text style={styles.modalLabel}>Title</Text>
            <TextInput style={styles.modalInput} placeholder="e.g., Emergency Fund"
              value={newTitle} onChangeText={setNewTitle} />

            <Text style={styles.modalLabel}>Target Amount (TND)</Text>
            <TextInput style={styles.modalInput} placeholder="e.g., 5000"
              value={newTarget} onChangeText={setNewTarget} keyboardType="decimal-pad" />

            <Text style={styles.modalLabel}>Deadline (YYYY-MM-DD, optional)</Text>
            <TextInput style={styles.modalInput} placeholder="2026-12-31"
              value={newDeadline} onChangeText={setNewDeadline} />

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowCreate(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={handleCreateGoal}>
                <Text style={styles.modalSaveText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Contribute Modal */}
      <Modal visible={!!contributeGoal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Add Contribution</Text>
            <Text style={styles.modalSub}>{contributeGoal?.title}</Text>

            <Text style={styles.modalLabel}>Amount (TND)</Text>
            <TextInput style={styles.modalInput} placeholder="e.g., 200"
              value={contribution} onChangeText={setContribution} keyboardType="decimal-pad" autoFocus />

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => { setContributeGoal(null); setContribution(''); }}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={handleContribute}>
                <Text style={styles.modalSaveText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  addBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: { padding: 16, paddingBottom: 32 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    borderTopWidth: 3,
    borderTopColor: '#6366f1',
  },
  cardAchieved: { borderTopColor: '#10b981' },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1f2937' },
  cardDeadline: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  achievedBadge: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginLeft: 8,
  },
  achievedText: { fontSize: 12, color: '#065f46', fontWeight: '700' },
  progressTrack: {
    height: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: { height: 8, borderRadius: 4 },
  cardAmounts: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardSaved: { fontSize: 13, fontWeight: '600', color: '#1f2937' },
  cardPct: { fontSize: 12, color: '#6366f1', fontWeight: '700', marginLeft: 'auto' },
  cardTarget: { fontSize: 12, color: '#9ca3af' },
  cardRemaining: { fontSize: 12, color: '#9ca3af', marginTop: 4 },
  cardActions: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8 },
  contributeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    backgroundColor: '#eef2ff',
    borderRadius: 8,
  },
  contributeBtnText: { fontSize: 13, color: '#6366f1', fontWeight: '600' },
  deleteGoalBtn: { padding: 8 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: '#9ca3af', fontSize: 14, marginTop: 12 },
  emptyLink: { color: '#6366f1', fontSize: 14, fontWeight: '600', marginTop: 8 },
  noFamily: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 40 },
  noFamilyText: { color: '#9ca3af', fontSize: 14, textAlign: 'center', marginTop: 12 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1f2937', marginBottom: 4 },
  modalSub: { fontSize: 13, color: '#9ca3af', marginBottom: 16 },
  modalLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 12 },
  modalInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: '#111827',
  },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 20 },
  modalCancel: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  modalCancelText: { color: '#6b7280', fontWeight: '600' },
  modalSave: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    backgroundColor: '#6366f1',
    alignItems: 'center',
  },
  modalSaveText: { color: '#fff', fontWeight: '700' },
});
