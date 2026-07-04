import { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../../constants/colors';
import { api } from '../../services/api';
import { getToken, removeToken } from '../../services/auth';

export default function RetailerBrowse() {
  const router = useRouter();
  const [medicines, setMedicines] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const init = async () => {
      const t = await getToken('retailer_token');
      if (!t) {
        router.replace('/');
        return;
      }
      setToken(t);
      loadStock(t, 1, '');
    };
    init();
  }, []);

  const loadStock = async (authToken, pageNum, searchQuery) => {
    try {
      // Offline Cache check on first load
      if (pageNum === 1 && !searchQuery) {
        const cached = await AsyncStorage.getItem('stock_cache');
        if (cached) setMedicines(JSON.parse(cached));
      }

      const res = await api.getStock(authToken, pageNum, searchQuery);
      
      if (pageNum === 1) {
        setMedicines(res.items || []);
        if (!searchQuery) AsyncStorage.setItem('stock_cache', JSON.stringify(res.items || []));
      } else {
        setMedicines(prev => [...prev, ...(res.items || [])]);
      }
    } catch (err) {
      console.log('Failed to fetch stock', err);
    } finally {
      setLoading(false);
    }
  };

  // Debounce search effect could be added here
  
  const handleLogout = async () => {
    await removeToken('retailer_token');
    router.replace('/');
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemMfg}>{item.mfg} | {item.pack}</Text>
        <Text style={styles.itemPrice}>₹{item.price.toFixed(2)}</Text>
      </View>
      <TouchableOpacity style={styles.addButton}>
        <Text style={styles.addButtonText}>Add</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TextInput 
          style={styles.searchBar}
          value={search}
          onChangeText={(text) => {
            setSearch(text);
            // Quick mock search logic for now
            loadStock(token, 1, text);
          }}
          placeholder="Search medicines..."
        />
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Exit</Text>
        </TouchableOpacity>
      </View>

      {loading && page === 1 ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={medicines}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 80 }}
          onEndReached={() => {
            const nextPage = page + 1;
            setPage(nextPage);
            loadStock(token, nextPage, search);
          }}
          onEndReachedThreshold={0.5}
        />
      )}

      <TouchableOpacity style={styles.cartFab} onPress={() => router.push('/retailer/cart')}>
        <Text style={styles.cartFabText}>View Cart (2)</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 10,
    borderRadius: 8,
    marginRight: 12,
  },
  logoutBtn: {
    padding: 8,
  },
  logoutText: {
    color: colors.danger,
    fontWeight: 'bold',
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
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
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  itemMfg: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: 4,
  },
  addButton: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addButtonText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  cartFab: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  cartFabText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  }
});
