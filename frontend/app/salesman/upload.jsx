import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { colors } from '../../constants/colors';
import { getToken } from '../../services/auth';

export default function SalesmanUpload() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'],
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
      Alert.alert('Error', 'Please select a CSV or Excel file first');
      return;
    }

    setLoading(true);
    try {
      const token = await getToken('salesman_token');
      
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || 'text/csv'
      });

      // API route for stock upload
      // const res = await fetch('YOUR_API_URL/api/salesman/stock/bulk', {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${token}`
      //   },
      //   body: formData
      // });
      
      // Simulating API success for now
      setTimeout(() => {
        setLoading(false);
        Alert.alert('Success', 'Stock catalogue updated successfully!');
        setFile(null);
      }, 1500);

    } catch (error) {
      setLoading(false);
      Alert.alert('Upload Failed', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upload Stock Data</Text>
      <Text style={styles.subtitle}>Select a CSV or Excel file to update your inventory.</Text>

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
          <Text style={styles.pickButtonText}>Choose File</Text>
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
          <Text style={styles.uploadButtonText}>Upload to Server</Text>
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
