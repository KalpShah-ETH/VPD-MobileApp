import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../constants/colors';
import DashboardLayout from '../../src/components/DashboardLayout';
import DashboardCard from '../../src/components/DashboardCard';

export default function AdminDashboard() {
  const router = useRouter();

  const handleLogout = () => {
    // TODO: Clear token logic
    router.replace('/');
  };

  const header = (
    <View style={styles.header}>
      <Text style={styles.title}>Welcome, Admin</Text>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <DashboardLayout header={header}>
      <DashboardCard title="Manage Salesmen" subtitle="Add, edit or block" onPress={() => router.push('/admin/manage-salesmen')} />
      <DashboardCard title="View All Orders" subtitle="Global order history" onPress={() => {}} />
      <DashboardCard title="Background Image" subtitle="Update retailer app BG" onPress={() => {}} />
      <DashboardCard title="Bulk Stock Upload" subtitle="Global stock catalogue" onPress={() => router.push('/admin/upload-stock')} />
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
