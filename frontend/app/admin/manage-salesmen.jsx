import { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../constants/colors';
import { api } from '../../services/api';
import { getToken } from '../../services/auth';

export default function AdminManageSalesmen() {
  const router = useRouter();
  const [salesmen, setSalesmen] = useState([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const init = async () => {
      const t = await getToken('admin_token');
      setToken(t);
      if (t) loadSalesmen(t);
    };
    init();
  }, []);

  const loadSalesmen = async (authToken) => {
    setLoading(true);
    try {
      const res = await fetch(`${api.baseURL}/api/admin/salesman`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSalesmen(data);
      } else {
        Alert.alert('Error', data.error);
      }
    } catch (err) {
      console.log('Failed to fetch salesmen', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleUploadPermission = async (id, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      
      // Optimistic update
      setSalesmen(prev => prev.map(s => 
        s.id === id ? { ...s, canUploadStock: newStatus } : s
      ));

      const res = await fetch(`${api.baseURL}/api/admin/salesman`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id, canUploadStock: newStatus })
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update permission');
      }
    } catch (err) {
      // Revert on failure
      setSalesmen(prev => prev.map(s => 
        s.id === id ? { ...s, canUploadStock: currentStatus } : s
      ));
      Alert.alert('Error', err.message);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardInfo}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.company}>{item.companyName} ({item.phone})</Text>
      </View>
      <View style={styles.toggleContainer}>
        <Text style={styles.toggleLabel}>Upload Stock</Text>
        <Switch
          value={item.canUploadStock}
          onValueChange={() => toggleUploadPermission(item.id, item.canUploadStock)}
          trackColor={{ false: colors.border, true: colors.primaryLight }}
          thumbColor={item.canUploadStock ? colors.primary : colors.white}
        />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Manage Salesmen</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={salesmen}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No salesmen registered.</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  backButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  card: {
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'row',
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
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  company: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
  },
  toggleContainer: {
    alignItems: 'center',
    marginLeft: 16,
  },
  toggleLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: 40,
    fontSize: 16,
  }
});
