import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { useRouter } from 'expo-router';
import { colors } from '../../constants/colors';
import { getToken } from '../../services/auth';
import { api } from '../../services/api';

export default function AdminUploadStock() {
  const router = useRouter();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
        copyToCacheDirectory: true,
      });

      if (result.canceled === false) {
        setFile(result.assets[0]);
      }
    } catch (err) {
      console.log('Error picking document', err);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      Alert.alert('Error', 'Please select a CSV or XLSX file first');
      return;
    }

    setLoading(true);
    try {
      const token = await getToken('admin_token');
      
      let rows = [];

      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        // Read as base64 for xlsx parsing
        const base64 = await FileSystem.readAsStringAsync(file.uri, { encoding: FileSystem.EncodingType.Base64 });
        const workbook = XLSX.read(base64, { type: 'base64' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        rows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
      } else {
        // Assume CSV
        const response = await fetch(file.uri);
        const text = await response.text();
        const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
        rows = parsed.data;
      }

      // Map to API format (mfg, name, pack, quantity)
      const items = rows.map(row => ({
        name: row['item name'] || row['name'] || row['Name'] || row['ITEM NAME'] || '',
        mfg: row['mfg'] || row['Mfg'] || row['MFG'] || '',
        pack: row['pack'] || row['Pack'] || row['PACK'] || '',
        quantity: row['qty'] || row['quantity'] || row['Qty'] || row['QTY'] || 0
      })).filter(i => i.name && i.quantity !== undefined && i.quantity !== "");

      if (items.length === 0) {
        setLoading(false);
        Alert.alert('Error', 'No valid items found. Make sure headers are correct (item name, mfg, pack, qty).');
        return;
      }

      const res = await fetch(`${api.baseURL}/api/admin/salesman/bulk-stock`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ items, fileName: file.name })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setLoading(false);
        Alert.alert(
          'Success', 
          `Global stock updated successfully!\nInserted: ${data.inserted}\nSkipped (Duplicates): ${data.skipped}`,
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        setLoading(false);
        Alert.alert('Upload Failed', data.error || 'Unknown error');
      }
    } catch (error) {
      setLoading(false);
      Alert.alert('Upload Failed', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Global Stock Upload</Text>
      <Text style={styles.subtitle}>Upload a CSV file to update the global catalogue for all retailers.</Text>

      <View style={styles.card}>
        {file ? (
          <View style={styles.fileInfo}>
            <Text style={styles.fileName}>{file.name}</Text>
            <Text style={styles.fileSize}>{(file.size / 1024).toFixed(2)} KB</Text>
          </View>
        ) : (
          <Text style={styles.placeholder}>No file selected</Text>
        )}

        <TouchableOpacity style={styles.pickButton} onPress={pickDocument}>
          <Text style={styles.pickButtonText}>Choose CSV File</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={[styles.uploadButton, !file && styles.uploadButtonDisabled]}
        onPress={handleUpload}
        disabled={!file || loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.uploadButtonText}>Update Global Stock</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 32,
  },
  card: {
    backgroundColor: colors.white,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 24,
  },
  fileInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  fileName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
    textAlign: 'center',
  },
  fileSize: {
    fontSize: 12,
    color: colors.textMuted,
  },
  placeholder: {
    fontSize: 16,
    color: colors.textMuted,
    marginBottom: 16,
  },
  pickButton: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  pickButtonText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  uploadButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  uploadButtonDisabled: {
    backgroundColor: colors.border,
  },
  uploadButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  }
});
