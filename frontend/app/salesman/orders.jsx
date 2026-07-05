import { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { colors } from '../../constants/colors';
import { api } from '../../services/api';
import { getToken } from '../../services/auth';

export default function SalesmanOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const init = async () => {
      const t = await getToken('salesman_token');
      setToken(t);
      if (t) fetchOrders(t);
    };
    init();
  }, []);

  const fetchOrders = async (authToken) => {
    try {
      const res = await fetch(`${api.baseURL}/api/salesman/orders`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (res.ok) {
        setOrders(Array.isArray(data) ? data : []);
      } else {
        Alert.alert('Error', data.error || 'Failed to fetch orders');
      }
    } catch (err) {
      Alert.alert('Error', 'Network error while fetching orders.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkFulfilled = async (id) => {
    try {
      const res = await fetch(`${api.baseURL}/api/salesman/orders`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ id: id, status: 'BILLING_DONE' })
      });
      const data = await res.json();
      if (res.ok) {
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'BILLING_DONE' } : o));
      } else {
        Alert.alert('Error', data.error || 'Failed to update order');
      }
    } catch (err) {
      Alert.alert('Error', 'Network error.');
    }
  };

  const renderItem = ({ item }) => {
    const isDone = item.status === 'BILLING_DONE';
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.shopName}>{item.retailer?.shopName || 'Unknown Shop'}</Text>
          <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>
        <View style={styles.cardBody}>
          <View>
            <Text style={styles.info}>Product: {item.productName}</Text>
            <Text style={styles.info}>Qty: {item.quantity}</Text>
          </View>
          <View style={[styles.badge, isDone ? styles.badgeSuccess : styles.badgeWarning]}>
            <Text style={[styles.badgeText, isDone ? styles.badgeTextSuccess : styles.badgeTextWarning]}>
              {item.status.replace('_', ' ')}
            </Text>
          </View>
        </View>
        {item.status === 'PENDING_BILLING' && (
          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleMarkFulfilled(item.id)}
            >
              <Text style={styles.actionButtonText}>Billing Done ✓</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={<Text style={{textAlign: 'center', marginTop: 20}}>No orders found.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  card: { backgroundColor: colors.white, padding: 16, borderRadius: 8, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  shopName: { fontSize: 18, fontWeight: 'bold', color: colors.textDark },
  date: { fontSize: 12, color: colors.textMuted },
  cardBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  info: { fontSize: 14, color: colors.textMuted },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  badgeSuccess: { backgroundColor: '#E8F5E9' },
  badgeWarning: { backgroundColor: '#FFF3E0' },
  badgeText: { fontSize: 12, fontWeight: 'bold' },
  badgeTextSuccess: { color: '#2E7D32' },
  badgeTextWarning: { color: '#E65100' },
  actionRow: { flexDirection: 'row', justifyContent: 'flex-start' },
  actionButton: { backgroundColor: colors.primaryLight, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 6, alignItems: 'center', alignSelf: 'flex-start' },
  actionButtonText: { color: colors.primary, fontWeight: 'bold', fontSize: 14 }
});
