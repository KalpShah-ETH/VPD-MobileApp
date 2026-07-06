import { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '../../constants/colors';
import { api } from '../../services/api';
import { getToken } from '../../services/auth';

export default function SalesmanStock() {
  const [medicines, setMedicines] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const init = async () => {
      const t = await getToken('salesman_token');
      setToken(t);
      if (t) loadStock(t, 1, '');
    };
    init();
  }, []);

  const loadStock = async (authToken, pageNum, searchQuery) => {
    try {
      const res = await api.getStock(authToken, pageNum, searchQuery);
      if (pageNum === 1) {
        setMedicines(res.items || []);
      } else {
        setMedicines(prev => [...prev, ...(res.items || [])]);
      }
    } catch (err) {
      console.log('Failed to fetch stock', err);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemMfg}>{item.mfg} | {item.pack}</Text>
      </View>
      <View style={styles.stockBadge}>
        <Text style={styles.stockText}>Qty: {item.quantity}</Text>
      </View>
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
            loadStock(token, 1, text);
          }}
          placeholder="Search my stock..."
        />
      </View>

      {loading && page === 1 ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={medicines}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
          onEndReached={() => {
            const nextPage = page + 1;
            setPage(nextPage);
            loadStock(token, nextPage, search);
          }}
          onEndReachedThreshold={0.5}
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
  searchBar: {
    backgroundColor: colors.background,
    padding: 10,
    borderRadius: 8,
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
  stockBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  stockText: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 12,
  }
});
