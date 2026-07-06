import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, FlatList } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { useRouter } from 'expo-router';
import { colors, radius, shadow } from '../../constants/colors';
import { getToken } from '../../services/auth';
import { api } from '../../services/api';
import Toast from 'react-native-toast-message';

export default function SalesmanUpload() {
  const router = useRouter();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [parsedItems, setParsedItems] = useState([]);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        setFile(result.assets[0]);
        parseFile(result.assets[0]);
      }
    } catch (err) {
      console.log('Error picking document', err);
    }
  };

  const parseFile = async (selectedFile) => {
    setLoading(true);
    setParsedItems([]);
    try {
      let rows = [];

      if (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls')) {
        const base64 = await FileSystem.readAsStringAsync(selectedFile.uri, { encoding: FileSystem.EncodingType.Base64 });
        const workbook = XLSX.read(base64, { type: 'base64' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        rows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
      } else {
        const response = await fetch(selectedFile.uri);
        const text = await response.text();
        const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
        rows = parsed.data;
      }

      const items = rows.map(row => ({
        name: row['item name'] || row['name'] || row['Name'] || row['ITEM NAME'] || '',
        mfg: row['mfg'] || row['Mfg'] || row['MFG'] || '',
        pack: row['pack'] || row['Pack'] || row['PACK'] || '',
        quantity: parseInt(row['qty'] || row['quantity'] || row['Qty'] || row['QTY'] || 0)
      })).filter(i => i.name && !isNaN(i.quantity));

      if (items.length === 0) {
        Toast.show({ type: 'error', text1: 'No valid items found', text2: 'Check headers (name, mfg, pack, qty).' });
        setFile(null);
      } else {
        setParsedItems(items);
      }
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Parsing Failed', text2: err.message });
      setFile(null);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (parsedItems.length === 0) return;

    setLoading(true);
    try {
      const token = await getToken('salesman_token');
      
      const res = await fetch(`${api.baseURL}/api/salesman/stock/bulk`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ items: parsedItems, fileName: file.name })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setLoading(false);
        Alert.alert(
          'Success', 
          `Stock updated successfully!\nInserted: ${data.inserted}\nSkipped: ${data.skipped}`,
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error) {
      setLoading(false);
      Alert.alert('Upload Failed', error.message);
    }
  };

  const renderPreviewRow = ({ item, index }) => (
    <View style={[styles.previewRow, index % 2 === 0 ? styles.evenRow : styles.oddRow]}>
      <Text style={[styles.cellText, { flex: 2 }]} numberOfLines={1}>{item.name}</Text>
      <Text style={[styles.cellText, { flex: 1 }]} numberOfLines={1}>{item.mfg}</Text>
      <Text style={[styles.cellText, { flex: 1 }]} numberOfLines={1}>{item.pack}</Text>
      <Text style={[styles.cellText, { width: 50, textAlign: 'right' }]}>{item.quantity}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Upload Stock Data</Text>
      </View>

      <View style={{padding: 24, flex: 1}}>
        <Text style={styles.subtitle}>Select a CSV or XLSX file to update your personal inventory allocations.</Text>

        {!parsedItems.length ? (
          <View style={styles.card}>
            {loading ? (
              <ActivityIndicator color={colors.primary} size="large" style={{marginVertical: 20}} />
            ) : (
              <>
                <Text style={styles.placeholder}>Select a file to preview data</Text>
                <TouchableOpacity style={styles.pickButton} onPress={pickDocument}>
                  <Text style={styles.pickButtonText}>Choose File</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        ) : (
          <View style={styles.previewContainer}>
            <View style={styles.fileHeader}>
              <View>
                <Text style={styles.fileName}>{file.name}</Text>
                <Text style={styles.fileSize}>{parsedItems.length} items parsed</Text>
              </View>
              <TouchableOpacity style={styles.repickBtn} onPress={pickDocument}>
                <Text style={styles.repickText}>Change</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.tableHeader}>
              <Text style={[styles.thText, { flex: 2 }]}>Product Name</Text>
              <Text style={[styles.thText, { flex: 1 }]}>Mfg</Text>
              <Text style={[styles.thText, { flex: 1 }]}>Pack</Text>
              <Text style={[styles.thText, { width: 50, textAlign: 'right' }]}>Qty</Text>
            </View>
            
            <FlatList
              data={parsedItems.slice(0, 50)} 
              keyExtractor={(item, idx) => idx.toString()}
              renderItem={renderPreviewRow}
              style={styles.tableBody}
              ListFooterComponent={
                parsedItems.length > 50 ? (
                  <Text style={styles.previewNote}>... and {parsedItems.length - 50} more rows</Text>
                ) : null
              }
            />

            <TouchableOpacity 
              style={styles.uploadButton}
              onPress={handleUpload}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.uploadButtonText}>Confirm & Upload</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  
  header: { padding: 16, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', alignItems: 'center' },
  backButton: { marginRight: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bgPrimary, justifyContent: 'center', alignItems: 'center' },
  backButtonText: { color: colors.textMain, fontSize: 20, fontFamily: 'Inter_700Bold' },
  title: { fontSize: 20, fontFamily: 'Inter_700Bold', color: colors.primary },

  subtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', color: colors.textMuted, marginBottom: 24 },
  
  card: { backgroundColor: colors.bgCard, padding: 32, borderRadius: radius.lg, alignItems: 'center', ...shadow.md, marginBottom: 24, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed' },
  
  placeholder: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: colors.textMuted, marginBottom: 20 },
  pickButton: { backgroundColor: colors.primaryLight, paddingHorizontal: 24, paddingVertical: 12, borderRadius: radius.sm },
  pickButtonText: { color: colors.primary, fontFamily: 'Inter_700Bold', fontSize: 16 },
  
  previewContainer: { flex: 1, backgroundColor: colors.bgCard, borderRadius: radius.lg, ...shadow.sm, overflow: 'hidden' },
  fileHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.bgPrimary },
  fileName: { fontSize: 16, fontFamily: 'Inter_700Bold', color: colors.primary },
  fileSize: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.textMuted },
  repickBtn: { padding: 8, backgroundColor: colors.bgCard, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border },
  repickText: { color: colors.textMain, fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  
  tableHeader: { flexDirection: 'row', padding: 12, backgroundColor: colors.border },
  thText: { fontFamily: 'Inter_700Bold', fontSize: 12, color: colors.textMain },
  
  tableBody: { flex: 1 },
  previewRow: { flexDirection: 'row', padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  evenRow: { backgroundColor: colors.bgCard },
  oddRow: { backgroundColor: colors.bgPrimary },
  cellText: { fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.textMain, marginRight: 8 },
  previewNote: { textAlign: 'center', padding: 16, fontFamily: 'Inter_600SemiBold', color: colors.textMuted },
  
  uploadButton: { backgroundColor: colors.primary, padding: 16, alignItems: 'center' },
  uploadButtonText: { color: colors.white, fontSize: 16, fontFamily: 'Inter_700Bold' }
});
