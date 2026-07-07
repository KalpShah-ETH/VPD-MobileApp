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
      console.log('[FRONTEND] Opening document picker...');
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      console.log('[FRONTEND] Document picker returned:', result.canceled ? 'CANCELED' : 'SUCCESS');

      if (!result.canceled) {
        setFile(result.assets[0]);
        console.log('[FRONTEND] Set file in state:', result.assets[0].name);
      }
    } catch (err) {
      console.error('[FRONTEND] Error picking document:', err);
      Alert.alert('Picker Error', err.message);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    console.log('[FRONTEND] Starting Salesman upload process for:', file.name);
    setLoading(true);
    
    try {
      const token = await getToken('salesman_token');
      console.log('[FRONTEND] Retrieved salesman token');
      
      const formData = new FormData();
      
      formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      formData.append('fileName', file.name);
      
      console.log('[FRONTEND] Created FormData payload');

      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${api.baseURL}/api/salesman/stock/bulk`);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      
      console.log(`[FRONTEND] Opened XHR POST to ${api.baseURL}/api/salesman/stock/bulk`);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          console.log(`[FRONTEND] Upload Progress: ${Math.round((event.loaded / event.total) * 100)}%`);
        }
      };

      xhr.onreadystatechange = () => {
        console.log(`[FRONTEND] XHR readyState changed to: ${xhr.readyState}`);
      };

      xhr.onload = () => {
        console.log('[FRONTEND] XHR OnLoad fired! Status:', xhr.status);
        console.log('[FRONTEND] Server Response Text:', xhr.responseText);
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
          console.error('[FRONTEND] Failed to parse response:', e);
          Alert.alert('Upload Failed', 'Failed to parse server response.');
        }
      };

      xhr.onerror = (e) => {
        console.error('[FRONTEND] XHR OnError fired!', e);
        setLoading(false);
        Alert.alert('Network Error', 'The request failed to reach the server.');
      };

      xhr.ontimeout = () => {
        console.error('[FRONTEND] XHR OnTimeout fired!');
        setLoading(false);
        Alert.alert('Timeout Error', 'The request timed out.');
      };
      
      xhr.timeout = 30000; // 30 seconds

      console.log('[FRONTEND] Sending XHR request now...');
      xhr.send(formData);
      console.log('[FRONTEND] xhr.send() executed!');

    } catch (error) {
      console.error('[FRONTEND] Try/Catch Error:', error);
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

      <ScrollView style={{flex: 1}} contentContainerStyle={{padding: 24}}>
        <Text style={styles.subtitle}>Select an Excel (.xlsx) file containing product inventory details to upload to your stock catalogue.</Text>

        {!file ? (
          <View style={styles.card}>
            <Text style={styles.placeholder}>No file selected</Text>
            <TouchableOpacity style={styles.pickButton} onPress={pickDocument}>
              <Text style={styles.pickButtonText}>Choose File</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.previewContainer}>
            <View style={styles.fileHeader}>
              <View>
                <Text style={styles.fileName}>{file?.name || 'Selected File'}</Text>
                <Text style={styles.fileSize}>Ready to upload</Text>
              </View>
              <TouchableOpacity style={styles.repickBtn} onPress={pickDocument}>
                <Text style={styles.repickText}>Change File</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.uploadButton, loading ? { opacity: 0.7 } : {}]}
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
      </ScrollView>
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