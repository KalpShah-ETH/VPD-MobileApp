import { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '../../constants/colors';
import { api } from '../../services/api';
// Assuming backend has a route like /api/salesman/orders
import { getToken } from '../../services/auth';

export default function SalesmanOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mocking orders since backend might not have standard GET route structured perfectly yet
    setTimeout(() => {
      setOrders([
        { id: 101, shopName: 'Apollo Pharmacy', items: 3, total: 450.50, status: 'PENDING', date: '2023-10-25' },
        { id: 102, shopName: 'MedPlus', items: 1, total: 120.00, status: 'FULFILLED', date: '2023-10-24' }
      ]);
      setLoading(false);
    }, 800);
  }, []);

  const handleMarkFulfilled = (id) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'FULFILLED' } : o));
    // In a real app, make an API call to update status
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.shopName}>{item.shopName}</Text>
        <Text style={styles.date}>{item.date}</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.info}>Items: {item.items} | Total: ₹{item.total.toFixed(2)}</Text>
        <View style={[styles.badge, item.status === 'FULFILLED' ? styles.badgeSuccess : styles.badgeWarning]}>
          <Text style={[styles.badgeText, item.status === 'FULFILLED' ? styles.badgeTextSuccess : styles.badgeTextWarning]}>
            {item.status}
          </Text>
        </View>
      </View>
      {item.status === 'PENDING' && (
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleMarkFulfilled(item.id)}
        >
          <Text style={styles.actionButtonText}>Mark as Fulfilled</Text>
        </TouchableOpacity>
      )}
    </View>
  );

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
  },
  shopName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  date: {
    fontSize: 12,
    color: colors.textMuted,
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  info: {
    fontSize: 14,
    color: colors.textMuted,
  },
  badge: {
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
  actionButton: {
    backgroundColor: colors.primaryLight,
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  actionButtonText: {
    color: colors.primary,
    fontWeight: 'bold',
  }
});
