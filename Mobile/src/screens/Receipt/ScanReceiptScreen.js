import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  Alert, ScrollView, TextInput,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import client from '../../api/client';

const EXPENSE_CATEGORIES = ['Food', 'Transport', 'Education', 'Healthcare', 'Rent', 'Bills', 'Entertainment', 'Clothing', 'Groceries', 'Family Events', 'Charity', 'Other'];

export default function ScanReceiptScreen({ navigation, route }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState('camera'); // 'camera' | 'processing' | 'review'
  const [scanning, setScanning] = useState(false);
  const cameraRef = useRef(null);

  // Extracted data from OCR
  const [amount, setAmount]           = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate]               = useState('');
  const [category, setCategory]       = useState('');
  const [rawText, setRawText]         = useState('');

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, []);

  const processImage = async (base64) => {
    try {
      setMode('processing');
      const res = await client.post('/receipts/scan', { image: base64 });
      const { amount: amt, date: d, description: desc, rawText: raw } = res.data;

      setAmount(amt !== null ? String(parseFloat(amt).toFixed(3)) : '');
      setDate(d || new Date().toISOString().substring(0, 10));
      setDescription(desc || '');
      setRawText(raw || '');
      setMode('review');
    } catch (err) {
      console.error('OCR failed:', err.message);
      Alert.alert('OCR Failed', 'Could not read the receipt. Please enter details manually.', [
        { text: 'OK', onPress: () => setMode('review') },
      ]);
    }
  };

  const takePicture = async () => {
    if (!cameraRef.current || scanning) return;
    try {
      setScanning(true);
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.7 });
      await processImage(photo.base64);
    } catch (err) {
      Alert.alert('Error', 'Could not take picture');
      setMode('camera');
    } finally {
      setScanning(false);
    }
  };

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]?.base64) {
      await processImage(result.assets[0].base64);
    }
  };

  const handleUseData = () => {
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount before continuing');
      return;
    }
    // Pass extracted data back to AddTransactionScreen
    navigation.navigate('Add', {
      prefill: {
        amount: String(parsed),
        description,
        date,
        category: category || '',
        type: 'EXPENSE',
      },
    });
  };

  // ── Permission not granted ─────────────────────────────────────────────────
  if (!permission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#6366f1" size="large" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Ionicons name="camera-off-outline" size={56} color="#d1d5db" />
        <Text style={styles.permText}>Camera permission is required to scan receipts.</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Processing spinner ─────────────────────────────────────────────────────
  if (mode === 'processing') {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#6366f1" size="large" />
        <Text style={styles.processingText}>Reading receipt…</Text>
        <Text style={styles.processingSubText}>OCR is extracting amount and date</Text>
      </View>
    );
  }

  // ── Review extracted data ──────────────────────────────────────────────────
  if (mode === 'review') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.reviewContent} keyboardShouldPersistTaps="handled">
        <View style={styles.reviewHeader}>
          <Ionicons name="checkmark-circle" size={40} color="#10b981" />
          <Text style={styles.reviewTitle}>Receipt Scanned</Text>
          <Text style={styles.reviewSubtitle}>Review and correct the extracted data</Text>
        </View>

        <Text style={styles.fieldLabel}>Amount (TND)</Text>
        <TextInput
          style={[styles.fieldInput, !amount && styles.fieldInputWarn]}
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder="0.000"
          placeholderTextColor="#9ca3af"
        />
        {!amount && <Text style={styles.warnText}>Amount not detected — enter manually</Text>}

        <Text style={styles.fieldLabel}>Date</Text>
        <TextInput
          style={styles.fieldInput}
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#9ca3af"
        />

        <Text style={styles.fieldLabel}>Description / Merchant</Text>
        <TextInput
          style={styles.fieldInput}
          value={description}
          onChangeText={setDescription}
          placeholder="e.g., Monoprix"
          placeholderTextColor="#9ca3af"
        />

        <Text style={styles.fieldLabel}>Category</Text>
        <View style={styles.chips}>
          {EXPENSE_CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, category === cat && styles.chipActive]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {rawText ? (
          <View style={styles.rawBox}>
            <Text style={styles.rawLabel}>Raw OCR text</Text>
            <Text style={styles.rawText} numberOfLines={6}>{rawText}</Text>
          </View>
        ) : null}

        <View style={styles.reviewActions}>
          <TouchableOpacity style={styles.retakeBtn} onPress={() => setMode('camera')}>
            <Ionicons name="camera-outline" size={18} color="#6b7280" />
            <Text style={styles.retakeBtnText}>Retake</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.useBtn} onPress={handleUseData}>
            <Ionicons name="arrow-forward-circle" size={18} color="#fff" />
            <Text style={styles.useBtnText}>Use This Data</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // ── Camera view ────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back">
        {/* Viewfinder overlay */}
        <View style={styles.overlay}>
          <View style={styles.overlayTop} />
          <View style={styles.overlayMiddle}>
            <View style={styles.overlaySide} />
            <View style={styles.viewfinder}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </View>
            <View style={styles.overlaySide} />
          </View>
          <View style={styles.overlayBottom}>
            <Text style={styles.hintText}>Centre the receipt inside the frame</Text>
            <View style={styles.cameraActions}>
              <TouchableOpacity style={styles.galleryBtn} onPress={pickFromGallery}>
                <Ionicons name="images-outline" size={26} color="#fff" />
                <Text style={styles.galleryBtnText}>Gallery</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.shutterBtn, scanning && styles.shutterBtnDisabled]}
                onPress={takePicture}
                disabled={scanning}
              >
                {scanning
                  ? <ActivityIndicator color="#6366f1" size="small" />
                  : <View style={styles.shutterInner} />}
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
                <Ionicons name="close-outline" size={26} color="#fff" />
                <Text style={styles.galleryBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const CORNER_SIZE = 24;
const CORNER_THICKNESS = 3;
const CORNER_COLOR = '#6366f1';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: '#f1f5f9' },
  permText: { color: '#6b7280', fontSize: 14, textAlign: 'center', marginTop: 16, marginBottom: 20 },
  permBtn: { backgroundColor: '#6366f1', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  permBtnText: { color: '#fff', fontWeight: '700' },
  processingText: { color: '#1f2937', fontSize: 18, fontWeight: '700', marginTop: 20 },
  processingSubText: { color: '#9ca3af', fontSize: 13, marginTop: 6 },

  // Camera
  camera: { flex: 1 },
  overlay: { flex: 1 },
  overlayTop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  overlayMiddle: { flexDirection: 'row', height: 260 },
  overlaySide: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  viewfinder: { width: 280, borderRadius: 4 },
  overlayBottom: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', paddingTop: 16 },
  hintText: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 24 },
  cameraActions: { flexDirection: 'row', alignItems: 'center', gap: 32 },
  galleryBtn: { alignItems: 'center', gap: 4 },
  galleryBtnText: { color: 'rgba(255,255,255,0.8)', fontSize: 11 },
  cancelBtn: { alignItems: 'center', gap: 4 },
  shutterBtn: {
    width: 70, height: 70, borderRadius: 35,
    backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 4, borderColor: 'rgba(255,255,255,0.5)',
  },
  shutterBtnDisabled: { opacity: 0.5 },
  shutterInner: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#fff' },

  // Corner markers
  corner: { position: 'absolute', width: CORNER_SIZE, height: CORNER_SIZE },
  cornerTL: { top: 0, left: 0, borderTopWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS, borderColor: CORNER_COLOR },
  cornerTR: { top: 0, right: 0, borderTopWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS, borderColor: CORNER_COLOR },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS, borderColor: CORNER_COLOR },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS, borderColor: CORNER_COLOR },

  // Review
  reviewContent: { padding: 20, paddingBottom: 40, backgroundColor: '#f1f5f9' },
  reviewHeader: { alignItems: 'center', marginBottom: 24 },
  reviewTitle: { fontSize: 20, fontWeight: '800', color: '#1f2937', marginTop: 10 },
  reviewSubtitle: { fontSize: 13, color: '#9ca3af', marginTop: 4 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 14 },
  fieldInput: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: '#111827',
  },
  fieldInputWarn: { borderColor: '#f59e0b', backgroundColor: '#fffbeb' },
  warnText: { color: '#f59e0b', fontSize: 12, marginTop: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb',
  },
  chipActive: { backgroundColor: '#eef2ff', borderColor: '#6366f1' },
  chipText: { fontSize: 12, color: '#6b7280', fontWeight: '500' },
  chipTextActive: { color: '#6366f1', fontWeight: '700' },
  rawBox: {
    backgroundColor: '#f9fafb', borderRadius: 8, padding: 12,
    borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 16,
  },
  rawLabel: { fontSize: 11, color: '#9ca3af', fontWeight: '600', marginBottom: 4 },
  rawText: { fontSize: 11, color: '#6b7280', lineHeight: 16 },
  reviewActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  retakeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 12,
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb',
  },
  retakeBtnText: { color: '#6b7280', fontWeight: '600' },
  useBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 12, backgroundColor: '#6366f1',
  },
  useBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
