import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { colors, radius } from '../../constants/colors';
import { getToken, removeToken } from '../../services/auth';
import { api } from '../../services/api';
import { registerForPushNotifications } from '../../services/notifications';
import DashboardLayout from '../../src/components/DashboardLayout';
import DashboardCard from '../../src/components/DashboardCard';

export default function SalesmanDashboard() {
  const router = useRouter();
  const [salesmanName, setSalesmanName] = useState('Salesman');
  const [canUploadStock, setCanUploadStock] = useState(false);
  const [pendingOrders, setPendingOrders] = useState(0);

  useEffect(() => {
    const setupNotifications = async () => {
      const token = await registerForPushNotifications();
      if (token) {
        const sessionToken = await getToken('salesman_token');
        if (sessionToken) {
          api.salesmanPushToken(token, sessionToken).catch(err => console.log('Failed to save push token', err));
        }
      }
    };
    setupNotifications();
  }, []);

  const fetchData = async () => {
    try {
      const token = await getToken('salesman_token');
      // Fetch Orders for badge
      const resOrders = await fetch(`${api.baseURL}/api/salesman/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resOrders.ok) {
        const dataOrders = await resOrders.json();
        if (dataOrders.orders) {
          const pending = dataOrders.orders.filter(o => o.status === 'PENDING').length;
          setPendingOrders(pending);
        }
      }
      
      // Fetch Salesman Profile (assuming there's a /me endpoint or we decode the JWT token)
      // For now, attempt a fetch, fallback if 404
      const resMe = await fetch(`${api.baseURL}/api/salesman/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resMe.ok) {
        const dataMe = await resMe.json();
        if (dataMe.salesman) {
          setSalesmanName(dataMe.salesman.name || 'Salesman');
          setCanUploadStock(dataMe.salesman.canUploadStock || false);
        }
      }
    } catch (err) {
      console.log('Failed to fetch dashboard data', err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const handleLogout = () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Logout", 
          style: "destructive",
          onPress: async () => {
            await removeToken('salesman_token');
            router.replace('/?logout=true');
          }
        }
      ]
    );
  };

  const header = (
    <View style={styles.header}>
      <View>
        <Text style={styles.title}>Salesman Dashboard</Text>
        <Text style={styles.subtitle}>Rep: {salesmanName}</Text>
      </View>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <DashboardLayout header={header}>
      <DashboardCard title="Orders Received" subtitle="View incoming orders" badge={pendingOrders > 0 ? pendingOrders : null} onPress={() => router.push('/salesman/orders')} />
      <DashboardCard title="My Stock Catalogue" subtitle="Browse & search catalogue" onPress={() => router.push('/salesman/stock')} />
      <DashboardCard title="Retailer Directory" subtitle="Add or remove stores" onPress={() => router.push('/salesman/retailers')} />
      {canUploadStock && (
        <DashboardCard title="Upload Stock" subtitle="Update stock via CSV" onPress={() => router.push('/salesman/upload')} />
      )}
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: colors.primary,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: colors.textMuted,
    marginTop: 4,
  },
  logoutButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: colors.dangerLight,
    borderRadius: radius.sm,
  },
  logoutText: {
    color: colors.danger,
    fontFamily: 'Inter_600SemiBold',
  }
});
