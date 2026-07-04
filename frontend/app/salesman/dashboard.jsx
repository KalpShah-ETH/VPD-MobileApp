import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../constants/colors';
import { removeToken } from '../../services/auth';
import DashboardLayout from '../../src/components/DashboardLayout';
import DashboardCard from '../../src/components/DashboardCard';

export default function SalesmanDashboard() {
  const router = useRouter();

  const handleLogout = async () => {
    await removeToken('salesman_token');
    router.replace('/');
  };

  const header = (
    <View style={styles.header}>
      <Text style={styles.title}>Salesman Dashboard</Text>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <DashboardLayout header={header}>
      <DashboardCard title="Orders" subtitle="View incoming orders" onPress={() => router.push('/salesman/orders')} />
      <DashboardCard title="My Stock" subtitle="Browse & search catalogue" onPress={() => router.push('/salesman/stock')} />
      <DashboardCard title="My Retailers" subtitle="Add or remove stores" onPress={() => router.push('/salesman/retailers')} />
      <DashboardCard title="Upload Stock" subtitle="Update stock via CSV" onPress={() => router.push('/salesman/upload')} />
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
    fontWeight: 'bold',
    color: colors.textDark,
  },
  logoutButton: {
    padding: 8,
    backgroundColor: colors.danger,
    borderRadius: 8,
  },
  logoutText: {
    color: colors.white,
    fontWeight: 'bold',
  }
});
