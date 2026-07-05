import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../../constants/colors';
import { api } from '../../services/api';
import { getToken } from '../../services/auth';

export default function AdminBackgroundUpload() {
  const router = useRouter();
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const init = async () => {
      const t = await getToken('admin_token');
      setToken(t);
      if (t) fetchCurrentImage();
    };
    init();
  }, []);

  const fetchCurrentImage = async () => {
    try {
      const res = await fetch(`${api.baseURL}/api/retailer/bg-image`);
      const data = await res.json();
      if (data.image) {
        setImage(`data:image/jpeg;base64,${data.image}`);
      }
    } catch (err) {
      console.error('Failed to load current BG', err);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      handleUpload(result.assets[0].base64);
    }
  };

  const handleUpload = async (base64String) => {
    setSaving(true);
    try {
      const res = await fetch(`${api.baseURL}/api/admin/bg-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ base64Image: base64String })
      });
      if (res.ok) {
        setImage(`data:image/jpeg;base64,${base64String}`);
        Alert.alert('Success', 'Background image updated successfully.');
      } else {
        Alert.alert('Error', 'Failed to upload background.');
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    Alert.alert(
      'Remove Background',
      'Are you sure you want to remove the background image?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: async () => {
            setSaving(true);
            try {
              const res = await fetch(`${api.baseURL}/api/admin/bg-image`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
              });
              if (res.ok) {
                setImage(null);
              }
            } catch (err) {
              Alert.alert('Error', err.message);
            } finally {
              setSaving(false);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Retailer Background</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.subtitle}>Upload a background image to display behind the retailer's browsing catalogue.</Text>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : (
          <View style={styles.previewContainer}>
            {image ? (
              <Image source={{ uri: image }} style={styles.previewImage} resizeMode="cover" />
            ) : (
              <View style={styles.placeholderBox}>
                <Text style={styles.placeholderText}>No Background Image</Text>
              </View>
            )}
          </View>
        )}

        <TouchableOpacity 
          style={styles.uploadButton}
          onPress={pickImage}
          disabled={saving}
        >
          {saving ? (
             <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.uploadButtonText}>
              {image ? 'Change Image' : 'Upload Image (JPG/PNG)'}
            </Text>
          )}
        </TouchableOpacity>

        {image && !saving && (
          <TouchableOpacity style={styles.removeButton} onPress={handleRemove}>
            <Text style={styles.removeButtonText}>Remove Background</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  backButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 32,
  },
  previewContainer: {
    width: '100%',
    height: 300,
    backgroundColor: colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  placeholderBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
  },
  placeholderText: {
    color: colors.textMuted,
  },
  uploadButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  uploadButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  removeButton: {
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
  },
  removeButtonText: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: 'bold',
  }
});
