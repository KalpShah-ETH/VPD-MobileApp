import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { colors, radius, shadow } from '../../constants/colors';
import { getToken } from '../../services/auth';
import { api } from '../../services/api';

export default function SalesmanUpload() {
  const router = useRouter();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'text/csv', 
          'application/vnd.ms-excel', 
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ],
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        setFile(result.assets[0]);
      }
    } catch (err) {
      console.error('Error picking document:', err);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    try {
      const token = await getToken('salesman_token');
      const formData = new FormData();

      formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      formData.append('fileName', file.name);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${api.baseURL}/api/salesman/stock/bulk`);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      // Do NOT set Content-Type header. XHR sets it automatically with the correct boundary for FormData.

      xhr.onload = () => {
        setLoading(false);
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            Alert.alert(
              'Success',
              `Stock updated successfully!\nInserted: ${data.inserted}\nSkipped: ${data.skipped}`,
              [{ text: 'OK', onPress: () => router.back() }]
            );
          } else {
            Alert.alert('Upload Failed', data.error || 'Unknown server error');
          }
        } catch (e) {
          Alert.alert('Upload Failed', 'Failed to parse server response.');
        }
      };

      xhr.onerror = () => {
        setLoading(false);
        Alert.alert('Network Error', 'The request failed to reach the server.');
      };

      xhr.send(formData);

    } catch (error) {
      setLoading(false);
      Alert.alert('Upload Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Bulk Stock Upload</Text>
      </View>

      <View style={{ padding: 24, flex: 1 }}>
        <Text style={styles.subtitle}>Upload a CSV or XLSX file to update the global catalogue.</Text>

        {!file ? (
          <View style={styles.card}>
            <Text style={styles.placeholder}>Select a CSV/XLSX file to upload</Text>
            <TouchableOpacity style={styles.pickButton} onPress={pickDocument}>
              <Text style={styles.pickButtonText}>Choose File</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.previewContainer}>
            <View style={styles.fileHeader}>
              <View>
                <Text style={styles.fileName}>{file.name}</Text>
                <Text style={styles.fileSize}>Ready to upload</Text>
              </View>
              <TouchableOpacity style={styles.repickBtn} onPress={pickDocument}>
                <Text style={styles.repickText}>Change File</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.uploadButton, loading && { opacity: 0.7 }]}
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
  previewContainer: { backgroundColor: colors.bgCard, borderRadius: radius.lg, ...shadow.sm, overflow: 'hidden' },
  fileHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.bgPrimary },
  fileName: { fontSize: 16, fontFamily: 'Inter_700Bold', color: colors.primary, marginBottom: 4 },
  fileSize: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.textMuted },
  repickBtn: { padding: 10, backgroundColor: colors.bgCard, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border },
  repickText: { color: colors.textMain, fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  uploadButton: { backgroundColor: colors.primary, padding: 20, alignItems: 'center' },
  uploadButtonText: { color: colors.white, fontSize: 18, fontFamily: 'Inter_700Bold' }
});