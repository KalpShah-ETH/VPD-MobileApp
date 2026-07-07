import { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Switch, Alert, Modal, TextInput, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, radius, shadow } from '../../constants/colors';
import { api } from '../../services/api';
import { getToken } from '../../services/auth';
import Toast from 'react-native-toast-message';
import * as DocumentPicker from 'expo-document-picker';
import { readAsStringAsync, EncodingType } from 'expo-file-system';
import Papa from 'papaparse';

export default function AdminManageSalesmen() {
  const router = useRouter();
  const [salesmen, setSalesmen] = useState([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ name: '', companyName: '', phone: '', password: '', canUploadStock: false, active: true });
  const [showPassword, setShowPassword] = useState(false);
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
      if (!res.ok) throw new Error('Failed to update permission');
      Toast.show({ type: 'success', text1: 'Permission Updated' });
    } catch (err) {
      setSalesmen(prev => prev.map(s => s.id === id ? { ...s, canUploadStock: currentStatus } : s));
      Toast.show({ type: 'error', text1: 'Error', text2: err.message });
    }
  };

  const toggleActiveStatus = async (id, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      setSalesmen(prev => prev.map(s => s.id === id ? { ...s, active: newStatus } : s));
      const res = await fetch(`${api.baseURL}/api/admin/salesman`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, active: newStatus })
      });
      if (!res.ok) throw new Error('Failed to update status');
      Toast.show({ type: 'success', text1: 'Status Updated' });
    } catch (err) {
      setSalesmen(prev => prev.map(s => s.id === id ? { ...s, active: currentStatus } : s));
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
              if (!res.ok) throw new Error('Delete failed');
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

  const openEditModal = (salesman) => {
    setEditId(salesman.id);
    setFormData({
      name: salesman.name,
      companyName: salesman.companyName,
      phone: salesman.phone,
      password: '', // blank unless changing
      canUploadStock: salesman.canUploadStock || false,
      active: salesman.active !== false // default true if undefined
    });
    setModalVisible(true);
  };

  const handleSaveSalesman = async () => {
    if (!formData.name || !formData.companyName || !formData.phone || (!editId && !formData.password)) {
      Toast.show({ type: 'error', text1: 'Required fields missing' });
      return;
    }
    
    setSubmitting(true);
    try {
      const payload = { ...formData };
      if (editId) {
        payload.id = editId;
        if (!payload.password) delete payload.password; // don't update password if empty
      }
      
      const res = await fetch(`${api.baseURL}/api/admin/salesman`, {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save salesman');
      
      Toast.show({ type: 'success', text1: `Salesman ${editId ? 'updated' : 'added'} successfully!` });
      setModalVisible(false);
      setFormData({ name: '', companyName: '', phone: '', password: '', canUploadStock: false, active: true });
      setEditId(null);
      loadSalesmen(token);
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Error', text2: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values'],
        copyToCacheDirectory: true
      });
      
      if (result.canceled) return;
      
      Toast.show({ type: 'info', text1: 'Parsing file...' });
      const asset = result.assets[0];
      
      let text = '';
      if (Platform.OS === 'web') {
        text = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsText(asset.file);
        });
      } else {
        text = await readAsStringAsync(asset.uri);
      }
      
      // Import Papa inside the function if it wasn't imported globally, 
      // but wait, I'll need to import Papa at the top. Let's just use it here,
      // and I'll add the import later.
      const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
      const jsonData = parsed.data;
      
      if (jsonData.length === 0) throw new Error('File is empty');
      
      const payload = jsonData.map(row => ({
        name: row.name || row.Name,
        companyName: row.companyName || row.company || row.Company,
        phone: row.phone || row.Phone,
        password: row.password || row.Password,
        canUploadStock: row.canUploadStock === 'true' || row.canUploadStock === true,
      })).filter(r => r.name && r.phone && r.password);
      
      if (payload.length === 0) throw new Error('No valid rows found. Check column headers.');

      const res = await fetch(`${api.baseURL}/api/admin/salesman/bulk`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ salesmen: payload })
      });
      if (!res.ok) throw new Error('Bulk upload failed');
      
      Toast.show({ type: 'success', text1: `Uploaded ${payload.length} salesmen successfully` });
      loadSalesmen(token);
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Upload failed', text2: err.message });
    }
  };

  const total = salesmen.length;
  const active = salesmen.filter(s => s.active !== false).length;
  const inactive = total - active;

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardInfo}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.company}>{item.companyName} ({item.phone})</Text>
        <View style={styles.badgesRow}>
          <Text style={[styles.badge, item.active !== false ? styles.badgeActive : styles.badgeInactive]}>
            {item.active !== false ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>
      
      <View style={styles.togglesWrapper}>
        <View style={styles.toggleContainer}>
          <Text style={styles.toggleLabel}>Upload Stock</Text>
          <Switch
            value={item.canUploadStock}
            onValueChange={() => toggleUploadPermission(item.id, item.canUploadStock)}
            trackColor={{ false: colors.border, true: colors.primaryLight }}
            thumbColor={item.canUploadStock ? colors.primary : colors.bgPrimary}
          />
        </View>
        <View style={styles.toggleContainer}>
          <Text style={styles.toggleLabel}>Active</Text>
          <Switch
            value={item.active !== false}
            onValueChange={() => toggleActiveStatus(item.id, item.active !== false)}
            trackColor={{ false: colors.border, true: colors.primaryLight }}
            thumbColor={item.active !== false ? colors.primary : colors.bgPrimary}
          />
        </View>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.editBtn} onPress={() => openEditModal(item)}>
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id, item.name)}>
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Manage Salesmen</Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{active}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{inactive}</Text>
          <Text style={styles.statLabel}>Deactivated</Text>
        </View>
      </View>

      <View style={styles.headerActions}>
        <TouchableOpacity style={styles.bulkUploadBtn} onPress={handleBulkUpload}>
          <Text style={styles.bulkUploadText}>📥 Bulk Upload CSV</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.addBtn} onPress={() => { setEditId(null); setFormData({ name: '', companyName: '', phone: '', password: '', canUploadStock: false, active: true }); setModalVisible(true); }}>
          <Text style={styles.addBtnText}>➕ Add New</Text>
        </TouchableOpacity>
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

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editId ? 'Edit Salesman' : 'Add New Salesman'}</Text>
            
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
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder={editId ? "Leave blank to keep password" : "Password"}
                secureTextEntry={!showPassword}
                value={formData.password}
                onChangeText={t => setFormData({...formData, password: t})}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSwitchRow}>
              <Text style={styles.switchText}>Allow Stock Upload?</Text>
              <Switch
                value={formData.canUploadStock}
                onValueChange={v => setFormData({...formData, canUploadStock: v})}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)} disabled={submitting}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveSalesman} disabled={submitting}>
                {submitting ? <ActivityIndicator color={colors.white} /> : <Text style={styles.saveText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  header: { padding: 16, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', alignItems: 'center' },
  backButton: { marginRight: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bgPrimary, justifyContent: 'center', alignItems: 'center' },
  backButtonText: { color: colors.textMain, fontSize: 20, fontFamily: 'Inter_700Bold' },
  title: { fontSize: 20, fontFamily: 'Inter_700Bold', color: colors.primary },
  
  statsGrid: { flexDirection: 'row', padding: 16, gap: 12, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border },
  statBox: { flex: 1, backgroundColor: colors.bgPrimary, padding: 12, borderRadius: radius.sm, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  statNumber: { fontSize: 20, fontFamily: 'Inter_700Bold', color: colors.primary },
  statLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: colors.textMuted },
  
  headerActions: { flexDirection: 'row', padding: 16, gap: 12 },
  bulkUploadBtn: { flex: 1, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, padding: 12, borderRadius: radius.sm, alignItems: 'center' },
  bulkUploadText: { fontFamily: 'Inter_600SemiBold', color: colors.textMain },
  addBtn: { flex: 1, backgroundColor: colors.primary, padding: 12, borderRadius: radius.sm, alignItems: 'center' },
  addBtnText: { fontFamily: 'Inter_700Bold', color: colors.white },

  card: { backgroundColor: colors.bgCard, padding: 16, borderRadius: radius.md, marginBottom: 12, ...shadow.sm },
  cardInfo: { marginBottom: 12 },
  name: { fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.textMain },
  company: { fontSize: 14, fontFamily: 'Inter_400Regular', color: colors.textMuted, marginTop: 4 },
  
  badgesRow: { flexDirection: 'row', marginTop: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.full, fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  badgeActive: { backgroundColor: colors.primaryLight, color: colors.primary },
  badgeInactive: { backgroundColor: colors.dangerLight, color: colors.danger },

  togglesWrapper: { flexDirection: 'row', gap: 24, marginBottom: 16, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12 },
  toggleContainer: { alignItems: 'flex-start' },
  toggleLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: colors.textMuted, marginBottom: 4 },
  
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  editBtn: { paddingVertical: 8, paddingHorizontal: 16, backgroundColor: colors.bgPrimary, borderRadius: radius.sm },
  editText: { color: colors.textMain, fontFamily: 'Inter_600SemiBold' },
  deleteBtn: { paddingVertical: 8, paddingHorizontal: 16, backgroundColor: colors.dangerLight, borderRadius: radius.sm },
  deleteText: { color: colors.danger, fontFamily: 'Inter_600SemiBold' },
  
  emptyText: { textAlign: 'center', color: colors.textMuted, marginTop: 40, fontFamily: 'Inter_400Regular', fontSize: 16 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: colors.bgCard, padding: 24, borderRadius: radius.lg, ...shadow.lg },
  modalTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', marginBottom: 20, color: colors.textMain },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: 12, marginBottom: 16, fontSize: 16, fontFamily: 'Inter_400Regular', backgroundColor: colors.bgPrimary },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, backgroundColor: colors.bgPrimary, marginBottom: 16 },
  passwordInput: { flex: 1, padding: 12, fontSize: 16, fontFamily: 'Inter_400Regular' },
  eyeBtn: { padding: 12 },
  modalSwitchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  switchText: { fontFamily: 'Inter_600SemiBold', color: colors.textMain },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  cancelBtn: { padding: 12, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border },
  cancelText: { color: colors.textMuted, fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  saveBtn: { backgroundColor: colors.primary, padding: 12, borderRadius: radius.sm, minWidth: 80, alignItems: 'center' },
  saveText: { color: colors.white, fontFamily: 'Inter_700Bold', fontSize: 16 }
});
