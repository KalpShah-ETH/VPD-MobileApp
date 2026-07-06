import { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, StyleSheet, ActivityIndicator, TouchableOpacity, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, radius, shadow } from '../../constants/colors';
import { api } from '../../services/api';
import { getToken } from '../../services/auth';

export default function AdminOrdersFeed() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const token = await getToken('admin_token');
      const res = await fetch(`${api.baseURL}/api/admin/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setOrders(data);
        setFilteredOrders(data);
      } else {
        console.error(data.error);
      }
    } catch (err) {
      console.error('Failed to load system orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!search) {
      setFilteredOrders(orders);
    } else {
      const lower = search.toLowerCase();
      const filtered = orders.filter(o => 
        o.retailer?.shopName?.toLowerCase().includes(lower) ||
        o.salesman?.companyName?.toLowerCase().includes(lower) ||
        o.productName?.toLowerCase().includes(lower)
      );
      setFilteredOrders(filtered);
    }
  }, [search, orders]);

  const total = orders.length;
  const pending = orders.filter(o => o.status === 'PENDING').length;
  const fulfilled = total - pending;

  const renderItem = ({ item }) => {
    const isFulfilled = item.status === 'FULFILLED';
    const statusText = isFulfilled ? "✓ Delivered" : "⏳ Pending delivery";

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.orderId}>Order #{item.id}</Text>
          <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.shopName}>{item.retailer?.shopName || 'Unknown Retailer'}</Text>
          {item.retailer?.phone ? (
            <TouchableOpacity onPress={() => Linking.openURL(`tel:${item.retailer.phone}`)}>
              <Text style={styles.phoneLink}>{item.retailer.phone}</Text>
            </TouchableOpacity>
          ) : null}
          
          <Text style={styles.salesman}>Salesman: {item.salesman?.companyName || item.salesman?.name}</Text>
          
          <View style={styles.productRow}>
            <Text style={styles.productName}>{item.productName}</Text>
            <Text style={styles.quantity}>Qty: {item.quantity}</Text>
          </View>

          <View style={[styles.badge, isFulfilled ? styles.badgeSuccess : styles.badgeWarning]}>
            <Text style={[styles.badgeText, isFulfilled ? styles.badgeTextSuccess : styles.badgeTextWarning]}>
              {statusText}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>System Orders Feed</Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{total}</Text>
          <Text style={styles.statLabel}>Total Initiated</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{pending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{fulfilled}</Text>
          <Text style={styles.statLabel}>Fulfilled</Text>
        </View>
      </View>
      
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by retailer, salesman, or product..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No orders captured in system yet.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  
  header: {
    padding: 16, backgroundColor: colors.bgCard,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    flexDirection: 'row', alignItems: 'center'
  },
  backButton: { marginRight: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bgPrimary, justifyContent: 'center', alignItems: 'center' },
  backButtonText: { color: colors.textMain, fontSize: 20, fontFamily: 'Inter_700Bold' },
  title: { fontSize: 20, fontFamily: 'Inter_700Bold', color: colors.primary },

  statsGrid: { flexDirection: 'row', padding: 16, gap: 12, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border },
  statBox: { flex: 1, backgroundColor: colors.bgPrimary, padding: 12, borderRadius: radius.sm, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  statNumber: { fontSize: 20, fontFamily: 'Inter_700Bold', color: colors.primary },
  statLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: colors.textMuted },
  
  searchContainer: { padding: 16, backgroundColor: colors.bgPrimary },
  searchInput: {
    backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border,
    padding: 12, borderRadius: radius.sm, fontSize: 16, fontFamily: 'Inter_400Regular'
  },
  
  card: {
    backgroundColor: colors.bgCard, padding: 16, borderRadius: radius.md,
    marginBottom: 16, ...shadow.sm
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  orderId: { fontSize: 14, fontFamily: 'Inter_700Bold', color: colors.primary },
  date: { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.textMuted },
  cardBody: { marginTop: 4 },
  
  shopName: { fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.textMain, marginBottom: 4 },
  phoneLink: { fontSize: 14, color: colors.primary, fontFamily: 'Inter_600SemiBold', marginBottom: 8, textDecorationLine: 'underline' },
  salesman: { fontSize: 14, fontFamily: 'Inter_400Regular', color: colors.textMuted, marginBottom: 12 },
  
  productRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.bgPrimary, padding: 12, borderRadius: radius.sm, marginBottom: 12 },
  productName: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: colors.textMain, flex: 1 },
  quantity: { fontSize: 16, fontFamily: 'Inter_700Bold', color: colors.primary, marginLeft: 16 },
  
  badge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.sm },
  badgeSuccess: { backgroundColor: colors.primaryLight },
  badgeWarning: { backgroundColor: colors.warningLight },
  badgeText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  badgeTextSuccess: { color: colors.success },
  badgeTextWarning: { color: colors.warning },
  
  emptyText: { textAlign: 'center', color: colors.textMuted, marginTop: 40, fontFamily: 'Inter_400Regular', fontSize: 16 }
});
