import { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput, Alert, Modal } from 'react-native';
import { colors } from '../../constants/colors';
// API mock
// import { api } from '../../services/api';

export default function SalesmanRetailers() {
  const [retailers, setRetailers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [newShopName, setNewShopName] = useState('');

  useEffect(() => {
    setTimeout(() => {
      setRetailers([
        { id: 1, shopName: 'Apollo Pharmacy', phone: '9876543210', active: true },
        { id: 2, shopName: 'MedPlus', phone: '9876543211', active: true }
      ]);
      setLoading(false);
    }, 800);
  }, []);

  const handleAddRetailer = () => {
    if (!newPhone || !newShopName) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    // API Call here to add retailer
    setRetailers(prev => [...prev, {
      id: Math.random(),
      shopName: newShopName,
      phone: newPhone,
      active: true
    }]);
    setModalVisible(false);
    setNewPhone('');
    setNewShopName('');
  };

  const toggleStatus = (id) => {
    setRetailers(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r));
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardInfo}>
        <Text style={styles.shopName}>{item.shopName}</Text>
        <Text style={styles.phone}>Phone: {item.phone}</Text>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: item.active ? colors.success : colors.danger }]} />
          <Text style={styles.statusText}>{item.active ? 'Active' : 'Blocked'}</Text>
        </View>
      </View>
      <TouchableOpacity 
        style={[styles.toggleBtn, { backgroundColor: item.active ? '#FFEBEE' : '#E8F5E9' }]}
        onPress={() => toggleStatus(item.id)}
      >
        <Text style={[styles.toggleBtnText, { color: item.active ? colors.danger : colors.success }]}>
          {item.active ? 'Block' : 'Unblock'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Retailers</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Text style={styles.addBtnText}>+ Add New</Text>
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
            
            <Text style={styles.label}>Phone Number (Login ID)</Text>
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
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddRetailer}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  addBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addBtnText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardInfo: {
    flex: 1,
  },
  shopName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  phone: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  toggleBtnText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: colors.white,
    padding: 24,
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    fontSize: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  cancelBtn: {
    padding: 12,
    marginRight: 12,
  },
  cancelBtnText: {
    color: colors.textMuted,
    fontWeight: 'bold',
  },
  saveBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  saveBtnText: {
    color: colors.white,
    fontWeight: 'bold',
  }
});
