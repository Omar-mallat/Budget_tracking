import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import client from '../../api/client';

const EXPENSE_CATEGORIES = ['Food', 'Transport', 'Education', 'Healthcare', 'Rent', 'Bills', 'Entertainment', 'Clothing', 'Groceries', 'Family Events', 'Charity', 'Other'];
const INCOME_CATEGORIES  = ['Salary', 'Freelancing', 'Investments', 'Business', 'Gifts', 'Other'];
const PAYMENT_METHODS    = ['Cash', 'Bank Transfer', 'Card', 'Installments'];

export default function AddTransactionScreen({ route, navigation }) {
  const prefill       = route?.params?.prefill;
  const defaultType   = prefill?.type || route?.params?.defaultType || 'EXPENSE';

  const [type, setType]               = useState(defaultType);
  const [amount, setAmount]           = useState(prefill?.amount || '');
  const [category, setCategory]       = useState(prefill?.category || '');
  const [description, setDescription] = useState(prefill?.description || '');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [loading, setLoading]         = useState(false);

  const amountRef = useRef(null);
  const categories = type === 'EXPENSE' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const isExpense = type === 'EXPENSE';

  const handleSave = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    if (!category) {
      Alert.alert('Error', 'Please select a category');
      return;
    }

    try {
      setLoading(true);
      const today = new Date().toISOString().substring(0, 10);

      if (isExpense) {
        await client.post('/expenses', {
          title: description || category,
          amount: parseFloat(amount),
          category,
          date: today,
          reference: description || null,
        });
      } else {
        await client.post('/incomes', {
          title: description || category,
          amount: parseFloat(amount),
          category,
          date: today,
          source: description || null,
        });
      }

      // Reset form
      setAmount('');
      setCategory('');
      setDescription('');
      setPaymentMethod('Cash');

      Alert.alert(
        'Saved!',
        `${isExpense ? 'Expense' : 'Income'} of TND ${parseFloat(amount).toFixed(2)} recorded.`,
        [{ text: 'OK', onPress: () => navigation.navigate('Home') }]
      );
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Could not save transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Add Transaction</Text>
            <Text style={styles.headerSub}>Fast — 3 taps and done</Text>
          </View>
          <TouchableOpacity
            style={styles.scanBtn}
            onPress={() => navigation.navigate('ScanReceipt')}
          >
            <Ionicons name="scan-outline" size={18} color="#6366f1" />
            <Text style={styles.scanBtnText}>Scan Receipt</Text>
          </TouchableOpacity>
        </View>

        {prefill && (
          <View style={styles.prefillBanner}>
            <Ionicons name="checkmark-circle" size={16} color="#10b981" />
            <Text style={styles.prefillBannerText}>Pre-filled from receipt scan — review before saving</Text>
          </View>
        )}

        {/* Type Toggle */}
        <View style={styles.typeToggle}>
          <TouchableOpacity
            style={[styles.typeBtn, isExpense && styles.typeBtnExpense]}
            onPress={() => { setType('EXPENSE'); setCategory(''); }}
          >
            <Ionicons name="arrow-down-circle" size={18} color={isExpense ? '#fff' : '#ef4444'} />
            <Text style={[styles.typeBtnText, isExpense && styles.typeBtnTextActive]}>Expense</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeBtn, !isExpense && styles.typeBtnIncome]}
            onPress={() => { setType('INCOME'); setCategory(''); }}
          >
            <Ionicons name="arrow-up-circle" size={18} color={!isExpense ? '#fff' : '#10b981'} />
            <Text style={[styles.typeBtnText, !isExpense && styles.typeBtnTextActive]}>Income</Text>
          </TouchableOpacity>
        </View>

        {/* Amount — big, centered, primary focus */}
        <View style={styles.amountContainer}>
          <Text style={styles.currency}>TND</Text>
          <TextInput
            ref={amountRef}
            style={styles.amountInput}
            placeholder="0.00"
            placeholderTextColor="#d1d5db"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            autoFocus
          />
        </View>

        {/* Category Chips */}
        <Text style={styles.label}>Category</Text>
        <View style={styles.chips}>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, category === cat && (isExpense ? styles.chipExpenseActive : styles.chipIncomeActive)]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Description */}
        <Text style={styles.label}>Description (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Weekly groceries at Monoprix"
          placeholderTextColor="#9ca3af"
          value={description}
          onChangeText={setDescription}
        />

        {/* Payment Method (expense only) */}
        {isExpense && (
          <>
            <Text style={styles.label}>Payment Method</Text>
            <View style={styles.paymentRow}>
              {PAYMENT_METHODS.map(m => (
                <TouchableOpacity
                  key={m}
                  style={[styles.paymentChip, paymentMethod === m && styles.paymentChipActive]}
                  onPress={() => setPaymentMethod(m)}
                >
                  <Text style={[styles.paymentChipText, paymentMethod === m && styles.paymentChipTextActive]}>
                    {m}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Save Button */}
        <TouchableOpacity
          style={[
            styles.saveBtn,
            { backgroundColor: isExpense ? '#ef4444' : '#10b981' },
            loading && styles.saveBtnDisabled,
          ]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : (
              <View style={styles.saveBtnInner}>
                <Ionicons name="checkmark-circle" size={22} color="#fff" />
                <Text style={styles.saveBtnText}>Save {isExpense ? 'Expense' : 'Income'}</Text>
              </View>
            )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  scroll: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#1e1b4b' },
  headerSub: { fontSize: 13, color: '#9ca3af', marginTop: 2 },
  scanBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#eef2ff', paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 10, borderWidth: 1, borderColor: '#c7d2fe',
  },
  scanBtnText: { color: '#6366f1', fontSize: 12, fontWeight: '700' },
  prefillBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#f0fdf4', borderRadius: 10, padding: 12,
    marginBottom: 16, borderWidth: 1, borderColor: '#bbf7d0',
  },
  prefillBannerText: { color: '#065f46', fontSize: 12, flex: 1 },
  typeToggle: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 10,
  },
  typeBtnExpense: { backgroundColor: '#ef4444' },
  typeBtnIncome:  { backgroundColor: '#10b981' },
  typeBtnText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  typeBtnTextActive: { color: '#fff' },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  currency: { fontSize: 24, fontWeight: '700', color: '#9ca3af', marginRight: 8 },
  amountInput: { fontSize: 44, fontWeight: '800', color: '#1f2937', minWidth: 120 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 10, marginTop: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  chipExpenseActive: { backgroundColor: '#fef2f2', borderColor: '#ef4444' },
  chipIncomeActive:  { backgroundColor: '#f0fdf4', borderColor: '#10b981' },
  chipText: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
  chipTextActive: { fontWeight: '700', color: '#1f2937' },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1f2937',
    marginBottom: 20,
  },
  paymentRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  paymentChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  paymentChipActive: { backgroundColor: '#eef2ff', borderColor: '#6366f1' },
  paymentChipText: { fontSize: 12, color: '#6b7280', fontWeight: '500' },
  paymentChipTextActive: { color: '#6366f1', fontWeight: '700' },
  saveBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  saveBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
