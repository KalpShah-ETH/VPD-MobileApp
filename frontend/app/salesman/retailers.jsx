import { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput, Alert, Modal, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { colors, radius, shadow } from '../../constants/colors';
import { api } from '../../services/api';
import { getToken } from '../../services/auth';
import Toast from 'react-native-toast-message';

export default function SalesmanRetailers() {
  const router = useRouter();
  const [retailers, setRetailers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [newShopName, setNewShopName] = useState('');
  const [token, setToken] = useState(null);

  useEffect(() => {
    const init = async () => {
      const t = await getToken('salesman_token');
      setToken(t);
      if (t) fetchRetailers(t);
    };
    init();
  }, []);

  const fetchRetailers = async (authToken) => {
    try {
      setLoading(true);
      const res = await fetch(`${api.baseURL}/api/salesman/retailers`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (res.ok) {
        setRetailers(Array.isArray(data) ? data : data.retailers || []);
      } else {
        Toast.show({ type: 'error', text1: 'Error', text2: data.error });
      }
    } catch (err) {
      console.log('Failed to fetch retailers', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRetailer = async () => {
    if (!newPhone || !newShopName) {
      Toast.show({ type: 'error', text1: 'Validation', text2: 'Please fill all fields' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${api.baseURL}/api/salesman/retailers`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopName: newShopName, phone: newPhone, active: true })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add retailer');
      
      Toast.show({ type: 'success', text1: 'Retailer created successfully!' });
      setModalVisible(false);
      setNewPhone('');
      setNewShopName('');
      fetchRetailers(token); // refresh
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Error', text2: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = !currentStatus;
    try {
      setRetailers(prev => prev.map(r => r.id === id ? { ...r, active: newStatus } : r));
      const res = await fetch(`${api.baseURL}/api/salesman/retailers`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, active: newStatus })
      });
      if (!res.ok) throw new Error('Update failed');
      Toast.show({ type: 'success', text1: 'Status updated' });
    } catch (err) {
      setRetailers(prev => prev.map(r => r.id === id ? { ...r, active: currentStatus } : r));
      Toast.show({ type: 'error', text1: 'Error', text2: err.message });
    }
  };

  const copyLink = async (phone) => {
    const link = `https://vpd.example.com/r/${phone}`; // replace with actual web app base domain
    await Clipboard.setStringAsync(link);
    Toast.show({ type: 'success', text1: 'Copied to clipboard' });
  };

  const sendWhatsApp = (shopName, phone) => {
    const link = `https://vpd.example.com/r/${phone}`;
    const text = `Hello ${shopName},\n\nHere is your private link to browse VPD stock and place orders: ${link}\n\nNo password required.`;
    const url = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(text)}`;
    Linking.openURL(url).catch(() => {
      Toast.show({ type: 'error', text1: 'WhatsApp not installed' });
    });
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardInfo}>
        <Text style={styles.shopName}>{item.shopName}</Text>
        <Text style={styles.phone}>{item.phone}</Text>
        <View style={styles.statusRow}>
          <Text style={[styles.badge, item.active ? styles.badgeActive : styles.badgeInactive]}>
            {item.active ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity 
          style={[styles.toggleBtn, item.active ? styles.toggleBtnInactive : styles.toggleBtnActive]}
          onPress={() => toggleStatus(item.id, item.active)}
        >
          <Text style={[styles.toggleBtnText, item.active ? styles.toggleTextInactive : styles.toggleTextActive]}>
            {item.active ? 'Disable' : 'Enable'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => copyLink(item.phone)}>
          <Text style={styles.actionText}>📋 Copy Link</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.waBtn} onPress={() => sendWhatsApp(item.shopName, item.phone)}>
          <Text style={styles.waText}>WhatsApp</Text>
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
        <Text style={styles.title}>Retailer Directory</Text>
        <View style={{flex: 1}}/>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={retailers}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={<Text style={styles.emptyText}>No retailers linked yet.</Text>}
        />
      )}

      {/* Add Retailer Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Retailer</Text>
            
            <Text style={styles.label}>Shop Name</Text>
            <TextInput 
              style={styles.input}
              value={newShopName}
              onChangeText={setNewShopName}
              placeholder="Enter shop name"
            />
            
            <Text style={styles.label}>WhatsApp Number</Text>
            <TextInput 
              style={styles.input}
              value={newPhone}
              onChangeText={setNewPhone}
              keyboardType="phone-pad"
              placeholder="Enter phone number"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddRetailer} disabled={submitting}>
                {submitting ? <ActivityIndicator color={colors.white} /> : <Text style={styles.saveBtnText}>Create & Link</Text>}
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
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border },
  backButton: { marginRight: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bgPrimary, justifyContent: 'center', alignItems: 'center' },
  backButtonText: { color: colors.textMain, fontSize: 20, fontFamily: 'Inter_700Bold' },
  title: { fontSize: 20, fontFamily: 'Inter_700Bold', color: colors.primary },
  
  addBtn: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.sm },
  addBtnText: { color: colors.white, fontFamily: 'Inter_700Bold', fontSize: 14 },
  
  card: { backgroundColor: colors.bgCard, padding: 16, borderRadius: radius.md, marginBottom: 16, ...shadow.sm },
  cardInfo: { marginBottom: 16 },
  shopName: { fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.textMain, marginBottom: 4 },
  phone: { fontSize: 14, fontFamily: 'Inter_400Regular', color: colors.textMuted },
  
  statusRow: { flexDirection: 'row', marginTop: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.full, fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  badgeActive: { backgroundColor: colors.primaryLight, color: colors.primary },
  badgeInactive: { backgroundColor: colors.dangerLight, color: colors.danger },
  
  cardActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12 },
  toggleBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.sm, borderWidth: 1 },
  toggleBtnActive: { borderColor: colors.primary, backgroundColor: colors.bgPrimary },
  toggleBtnInactive: { borderColor: colors.danger, backgroundColor: colors.dangerLight },
  toggleTextActive: { color: colors.primary, fontFamily: 'Inter_600SemiBold' },
  toggleTextInactive: { color: colors.danger, fontFamily: 'Inter_600SemiBold' },
  
  actionBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.sm, backgroundColor: colors.bgPrimary, borderWidth: 1, borderColor: colors.border },
  actionText: { color: colors.textMain, fontFamily: 'Inter_600SemiBold' },
  
  waBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.sm, backgroundColor: '#25D366' }, // WhatsApp green
  waText: { color: colors.white, fontFamily: 'Inter_700Bold' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalContent: { backgroundColor: colors.bgCard, padding: 24, borderRadius: radius.lg, ...shadow.lg },
  modalTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', color: colors.textMain, marginBottom: 20 },
  label: { fontSize: 14, color: colors.textMain, fontFamily: 'Inter_600SemiBold', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: 12, marginBottom: 20, fontSize: 16, fontFamily: 'Inter_400Regular', backgroundColor: colors.bgPrimary },
  
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  cancelBtn: { padding: 12 },
  cancelBtnText: { color: colors.textMuted, fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  saveBtn: { backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: radius.sm },
  saveBtnText: { color: colors.white, fontFamily: 'Inter_700Bold', fontSize: 16 },

  emptyText: { textAlign: 'center', color: colors.textMuted, marginTop: 40, fontFamily: 'Inter_400Regular', fontSize: 16 }
});
