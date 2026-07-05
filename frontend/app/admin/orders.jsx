import { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../constants/colors';
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

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.orderId}>Order #{item.id}</Text>
        <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.shopName}>{item.retailer?.shopName || 'Unknown Retailer'}</Text>
        <Text style={styles.salesman}>Salesman: {item.salesman?.companyName || item.salesman?.name}</Text>
        
        <View style={styles.productRow}>
          <Text style={styles.productName}>{item.productName}</Text>
          <Text style={styles.quantity}>Qty: {item.quantity}</Text>
        </View>

        <View style={[styles.badge, item.status === 'BILLING_DONE' ? styles.badgeSuccess : styles.badgeWarning]}>
          <Text style={[styles.badgeText, item.status === 'BILLING_DONE' ? styles.badgeTextSuccess : styles.badgeTextWarning]}>
            {item.status.replace('_', ' ')}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>System Orders Feed</Text>
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
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No orders captured in system yet.</Text>
          }
        />
      )}
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
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: colors.background,
  },
  searchInput: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  card: {
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  orderId: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
  },
  date: {
    fontSize: 12,
    color: colors.textMuted,
  },
  cardBody: {
    marginTop: 4,
  },
  shopName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: 2,
  },
  salesman: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 12,
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 6,
    marginBottom: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textDark,
    flex: 1,
  },
  quantity: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginLeft: 16,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeSuccess: {
    backgroundColor: '#E8F5E9',
  },
  badgeWarning: {
    backgroundColor: '#FFF3E0',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  badgeTextSuccess: {
    color: '#2E7D32',
  },
  badgeTextWarning: {
    color: '#E65100',
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: 40,
    fontSize: 16,
  }
});
