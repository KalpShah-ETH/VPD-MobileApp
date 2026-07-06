import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { removeToken, getToken } from '../../services/auth';
import { api } from '../../services/api';
import { colors, radius } from '../../constants/colors';
import DashboardLayout from '../../src/components/DashboardLayout';
import DashboardCard from '../../src/components/DashboardCard';

export default function AdminDashboard() {
  const router = useRouter();
  const [pendingOrders, setPendingOrders] = useState(0);

  const fetchPendingOrders = async () => {
    try {
      const token = await getToken('admin_token');
      const res = await api.adminOrders(token);
      if (res && res.orders) {
        // Enums used by backend/web are PENDING / FULFILLED.
        const pendingCount = res.orders.filter(o => o.status === 'PENDING').length;
        setPendingOrders(pendingCount);
      }
    } catch (err) {
      console.log('Failed to fetch orders stats', err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPendingOrders();
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
            await removeToken('admin_token');
            router.replace('/?logout=true');
          }
        }
      ]
    );
  };

  const header = (
    <View style={styles.header}>
      <Text style={styles.title}>🛡️ VPD Admin</Text>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <DashboardLayout header={header}>
      <DashboardCard title="Manage Salesmen" subtitle="Add, edit or block" onPress={() => router.push('/admin/manage-salesmen')} />
      <DashboardCard title="View All Orders" subtitle="Global order history" badge={pendingOrders > 0 ? pendingOrders : null} onPress={() => router.push('/admin/orders')} />
      <DashboardCard title="Retailer View Preview" subtitle="Browse as retailer" onPress={() => router.push('/admin/preview')} />
      <DashboardCard title="Background Image" subtitle="Update retailer app BG" onPress={() => router.push('/admin/background')} />
      <DashboardCard title="Bulk Stock Upload" subtitle="Global stock catalogue" onPress={() => router.push('/admin/upload-stock')} />
      <DashboardCard title="Settings" subtitle="Admins & Upload History" onPress={() => router.push('/admin/settings')} />
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
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    color: colors.primary,
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
