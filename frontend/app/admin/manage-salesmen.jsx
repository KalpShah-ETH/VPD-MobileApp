import { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Switch, Alert, Modal, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../constants/colors';
import { api } from '../../services/api';
import { getToken } from '../../services/auth';
import Toast from 'react-native-toast-message';

export default function AdminManageSalesmen() {
  const router = useRouter();
  const [salesmen, setSalesmen] = useState([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [formData, setFormData] = useState({ name: '', companyName: '', phone: '', password: '', canUploadStock: false });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const init = async () => {
      const t = await getToken('admin_token');
      setToken(t);
      if (t) loadSalesmen(t);
    };
    init();
  }, []);

  const loadSalesmen = async (authToken) => {
    setLoading(true);
    try {
      const res = await fetch(`${api.baseURL}/api/admin/salesman`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSalesmen(data);
      } else {
        Toast.show({ type: 'error', text1: 'Error', text2: data.error });
      }
    } catch (err) {
      console.log('Failed to fetch salesmen', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleUploadPermission = async (id, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      setSalesmen(prev => prev.map(s => s.id === id ? { ...s, canUploadStock: newStatus } : s));

      const res = await fetch(`${api.baseURL}/api/admin/salesman`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, canUploadStock: newStatus })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update permission');
      
      Toast.show({ type: 'success', text1: 'Permission Updated' });
    } catch (err) {
      setSalesmen(prev => prev.map(s => s.id === id ? { ...s, canUploadStock: currentStatus } : s));
      Toast.show({ type: 'error', text1: 'Error', text2: err.message });
    }
  };

  const handleDelete = (id, name) => {
    Alert.alert(
      "Delete Salesman",
      `Are you sure you want to delete ${name}? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              const res = await fetch(`${api.baseURL}/api/admin/salesman?id=${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data.error || 'Delete failed');
              
              setSalesmen(prev => prev.filter(s => s.id !== id));
              Toast.show({ type: 'success', text1: `${name} deleted successfully` });
            } catch (err) {
              Toast.show({ type: 'error', text1: 'Error', text2: err.message });
            }
          }
        }
      ]
    );
  };

  const handleAddSalesman = async () => {
    if (!formData.name || !formData.companyName || !formData.phone || !formData.password) {
      Toast.show({ type: 'error', text1: 'All fields are required' });
      return;
    }
    
    setSubmitting(true);
    try {
      const res = await fetch(`${api.baseURL}/api/admin/salesman`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create salesman');
      
      Toast.show({ type: 'success', text1: 'Salesman added successfully!' });
      setModalVisible(false);
      setFormData({ name: '', companyName: '', phone: '', password: '', canUploadStock: false });
      loadSalesmen(token);
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Error', text2: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardInfo}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.company}>{item.companyName} ({item.phone})</Text>
      </View>
      <View style={styles.toggleContainer}>
        <Text style={styles.toggleLabel}>Upload Stock</Text>
        <Switch
          value={item.canUploadStock}
          onValueChange={() => toggleUploadPermission(item.id, item.canUploadStock)}
          trackColor={{ false: colors.border, true: colors.primaryLight }}
          thumbColor={item.canUploadStock ? colors.primary : colors.white}
        />
      </View>
      <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id, item.name)}>
        <Text style={styles.deleteText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Manage Salesmen</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={salesmen}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No salesmen registered.</Text>
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {/* Add Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Salesman</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              value={formData.name}
              onChangeText={t => setFormData({...formData, name: t})}
            />
            <TextInput
              style={styles.input}
              placeholder="Company/Agency Name"
              value={formData.companyName}
              onChangeText={t => setFormData({...formData, companyName: t})}
            />
            <TextInput
              style={styles.input}
              placeholder="WhatsApp Phone Number"
              keyboardType="phone-pad"
              value={formData.phone}
              onChangeText={t => setFormData({...formData, phone: t})}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              secureTextEntry
              value={formData.password}
              onChangeText={t => setFormData({...formData, password: t})}
            />

            <View style={styles.modalSwitchRow}>
              <Text>Allow Stock Upload?</Text>
              <Switch
                value={formData.canUploadStock}
                onValueChange={v => setFormData({...formData, canUploadStock: v})}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)} disabled={submitting}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddSalesman} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: 16, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', alignItems: 'center' },
  backButton: { marginRight: 16, padding: 8 },
  backButtonText: { color: colors.primary, fontSize: 16, fontWeight: 'bold' },
  title: { fontSize: 20, fontWeight: 'bold', color: colors.textDark },
  card: { backgroundColor: colors.white, padding: 16, borderRadius: 8, marginBottom: 12, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  cardInfo: { flex: 1 },
  name: { fontSize: 16, fontWeight: 'bold', color: colors.textDark },
  company: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  toggleContainer: { alignItems: 'center', marginLeft: 16 },
  toggleLabel: { fontSize: 12, color: colors.textMuted, marginBottom: 4 },
  deleteBtn: { marginLeft: 16, padding: 8, backgroundColor: '#fef2f2', borderRadius: 8 },
  deleteText: { color: colors.danger, fontWeight: 'bold', fontSize: 12 },
  emptyText: { textAlign: 'center', color: colors.textMuted, marginTop: 40, fontSize: 16 },
  fab: { position: 'absolute', bottom: 30, right: 30, backgroundColor: colors.primary, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4 },
  fabIcon: { color: colors.white, fontSize: 32, fontWeight: 'bold', marginTop: -4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: colors.white, padding: 24, borderRadius: 12, elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, color: colors.textDark },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 16 },
  modalSwitchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  cancelBtn: { padding: 12, borderRadius: 8 },
  cancelText: { color: colors.textMuted, fontWeight: 'bold', fontSize: 16 },
  saveBtn: { backgroundColor: colors.primary, padding: 12, borderRadius: 8, minWidth: 80, alignItems: 'center' },
  saveText: { color: colors.white, fontWeight: 'bold', fontSize: 16 }
});
