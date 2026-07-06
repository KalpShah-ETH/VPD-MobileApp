import { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, radius, shadow } from '../../constants/colors';
import { api } from '../../services/api';
import { getToken } from '../../services/auth';
import Toast from 'react-native-toast-message';

export default function SalesmanOrders() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL', 'PENDING', 'FULFILLED'

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
        const fetchedOrders = Array.isArray(data) ? data : (data.orders || []);
        setOrders(fetchedOrders);
        setFilteredOrders(fetchedOrders);
      } else {
        Toast.show({ type: 'error', text1: 'Error', text2: data.error });
      }
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Network error while fetching orders.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = orders;
    
    if (statusFilter !== 'ALL') {
      result = result.filter(o => o.status === statusFilter);
    }

    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(o => 
        o.id?.toString().includes(lower) ||
        o.retailer?.shopName?.toLowerCase().includes(lower) ||
        o.productName?.toLowerCase().includes(lower)
      );
    }

    setFilteredOrders(result);
  }, [search, statusFilter, orders]);

  const handleMarkFulfilled = async (id) => {
    try {
      const res = await fetch(`${api.baseURL}/api/salesman/orders`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ id: id, status: 'FULFILLED' })
      });
      const data = await res.json();
      if (res.ok) {
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'FULFILLED' } : o));
        Toast.show({ type: 'success', text1: 'Order Marked Delivered' });
      } else {
        Toast.show({ type: 'error', text1: 'Error', text2: data.error || 'Failed to update order' });
      }
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Network error.' });
    }
  };

  const total = orders.length;
  const pendingCount = orders.filter(o => o.status === 'PENDING').length;

  const renderItem = ({ item }) => {
    const isDone = item.status === 'FULFILLED';
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.orderId}>Order #{item.id}</Text>
          <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.shopName}>{item.retailer?.shopName || 'Unknown Shop'}</Text>
          
          {item.retailer?.phone ? (
            <TouchableOpacity onPress={() => Linking.openURL(`tel:${item.retailer.phone}`)}>
              <Text style={styles.phoneLink}>{item.retailer.phone}</Text>
            </TouchableOpacity>
          ) : null}

          <View style={styles.productRow}>
            <Text style={styles.productName}>{item.productName}</Text>
            <Text style={styles.quantity}>Qty: {item.quantity}</Text>
          </View>
          
          <View style={[styles.badge, isDone ? styles.badgeSuccess : styles.badgeWarning]}>
            <Text style={[styles.badgeText, isDone ? styles.badgeTextSuccess : styles.badgeTextWarning]}>
              {isDone ? "✓ Delivered" : "⏳ Pending delivery"}
            </Text>
          </View>
        </View>
        {!isDone && (
          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleMarkFulfilled(item.id)}
            >
              <Text style={styles.actionButtonText}>✓ Mark Delivered</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Orders Received</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{total}</Text>
          <Text style={styles.statLabel}>Total Orders</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{pendingCount}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
      </View>

      <View style={styles.filtersContainer}>
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput 
            style={styles.searchBar}
            value={search}
            onChangeText={setSearch}
            placeholder="Search orders..."
            placeholderTextColor={colors.textMuted}
          />
        </View>
        
        <View style={styles.statusFilters}>
          <TouchableOpacity 
            style={[styles.filterBtn, statusFilter === 'ALL' && styles.filterBtnActive]}
            onPress={() => setStatusFilter('ALL')}
          >
            <Text style={[styles.filterBtnText, statusFilter === 'ALL' && styles.filterBtnTextActive]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterBtn, statusFilter === 'PENDING' && styles.filterBtnActive]}
            onPress={() => setStatusFilter('PENDING')}
          >
            <Text style={[styles.filterBtnText, statusFilter === 'PENDING' && styles.filterBtnTextActive]}>Pending</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterBtn, statusFilter === 'FULFILLED' && styles.filterBtnActive]}
            onPress={() => setStatusFilter('FULFILLED')}
          >
            <Text style={[styles.filterBtnText, statusFilter === 'FULFILLED' && styles.filterBtnTextActive]}>Delivered</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
          ListEmptyComponent={<Text style={styles.emptyText}>No orders found.</Text>}
        />
      )}
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
  
  filtersContainer: { backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border },
  searchContainer: { flexDirection: 'row', backgroundColor: colors.bgPrimary, margin: 16, marginBottom: 8, paddingHorizontal: 12, alignItems: 'center', borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchBar: { flex: 1, paddingVertical: 12, fontSize: 16, fontFamily: 'Inter_400Regular' },
  
  statusFilters: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 16, gap: 8 },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.full, backgroundColor: colors.bgPrimary, borderWidth: 1, borderColor: colors.border },
  filterBtnActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  filterBtnText: { fontFamily: 'Inter_600SemiBold', color: colors.textMuted, fontSize: 14 },
  filterBtnTextActive: { color: colors.primary },

  card: { backgroundColor: colors.bgCard, padding: 16, borderRadius: radius.md, marginBottom: 16, ...shadow.sm },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  orderId: { fontSize: 14, fontFamily: 'Inter_700Bold', color: colors.primary },
  date: { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.textMuted },
  
  cardBody: { marginTop: 4 },
  shopName: { fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.textMain, marginBottom: 4 },
  phoneLink: { fontSize: 14, color: colors.primary, fontFamily: 'Inter_600SemiBold', marginBottom: 12, textDecorationLine: 'underline' },
  
  productRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.bgPrimary, padding: 12, borderRadius: radius.sm, marginBottom: 12 },
  productName: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: colors.textMain, flex: 1 },
  quantity: { fontSize: 16, fontFamily: 'Inter_700Bold', color: colors.primary, marginLeft: 16 },

  badge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.sm },
  badgeSuccess: { backgroundColor: colors.primaryLight },
  badgeWarning: { backgroundColor: colors.warningLight },
  badgeText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  badgeTextSuccess: { color: colors.success },
  badgeTextWarning: { color: colors.warning },
  
  actionRow: { flexDirection: 'row', justifyContent: 'flex-start', marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border },
  actionButton: { backgroundColor: colors.primary, paddingVertical: 12, paddingHorizontal: 20, borderRadius: radius.sm, alignItems: 'center' },
  actionButtonText: { color: colors.white, fontFamily: 'Inter_700Bold', fontSize: 14 },
  
  emptyText: { textAlign: 'center', color: colors.textMuted, marginTop: 40, fontFamily: 'Inter_400Regular', fontSize: 16 }
});
