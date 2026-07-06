import { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, radius, shadow } from '../../constants/colors';
import { api } from '../../services/api';
import { getToken } from '../../services/auth';

export default function SalesmanStock() {
  const router = useRouter();
  const [medicines, setMedicines] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [token, setToken] = useState(null);
  const [canUploadStock, setCanUploadStock] = useState(false);

  useEffect(() => {
    const init = async () => {
      const t = await getToken('salesman_token');
      setToken(t);
      if (t) {
        fetchProfile(t);
        loadStock(t, 1, '');
      }
    };
    init();
  }, []);

  const fetchProfile = async (t) => {
    try {
      const res = await fetch(`${api.baseURL}/api/salesman/me`, {
        headers: { 'Authorization': `Bearer ${t}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.salesman) {
          setCanUploadStock(data.salesman.canUploadStock);
        }
      }
    } catch (err) {}
  };

  const loadStock = async (authToken, pageNum, searchQuery) => {
    setLoading(pageNum === 1);
    try {
      const res = await api.getStock(authToken, pageNum, searchQuery);
      if (pageNum === 1) {
        setMedicines(res.items || []);
        setTotalPages(res.totalPages || Math.ceil((res.items || []).length / 50) || 1);
      } else {
        setMedicines(prev => [...prev, ...(res.items || [])]);
      }
    } catch (err) {
      console.log('Failed to fetch stock', err);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => {
    const outOfStock = item.quantity <= 0;
    
    return (
      <View style={[styles.card, outOfStock && { opacity: 0.6 }]}>
        <View style={styles.cardInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          <View style={styles.badgesRow}>
            {item.mfg ? <Text style={styles.badge}>🏭 {item.mfg}</Text> : null}
            {item.pack ? <Text style={styles.badge}>📦 PACK: {item.pack.toUpperCase()}</Text> : null}
          </View>
        </View>
        <View style={styles.qtyContainer}>
          <Text style={styles.qtyLabel}>Qty.</Text>
          <Text style={[styles.qtyValue, outOfStock && { color: colors.danger }]}>
            {item.quantity} {item.quantity === 1 ? 'strip' : 'strips'}
          </Text>
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
        <Text style={styles.title}>My Stock Catalogue</Text>
      </View>

      <View style={styles.descContainer}>
        <Text style={styles.descText}>
          {canUploadStock 
            ? "Upload or view products available for retailers." 
            : "View products managed by administrators."}
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput 
          style={styles.searchBar}
          value={search}
          onChangeText={(text) => {
            setSearch(text);
            loadStock(token, 1, text);
          }}
          placeholder="Search my stock..."
          placeholderTextColor={colors.textMuted}
        />
      </View>

      {loading && page === 1 ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={medicines}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          onEndReached={() => {
            if (page < totalPages && !loading) {
              const nextPage = page + 1;
              setPage(nextPage);
              loadStock(token, nextPage, search);
            }
          }}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <Text style={{textAlign: 'center', marginTop: 40, color: colors.textMuted, fontFamily: 'Inter_400Regular'}}>No stock found.</Text>
          }
          ListFooterComponent={
            medicines.length > 0 ? (
              <View style={styles.paginationFooter}>
                <Text style={styles.paginationText}>Page {page} of {totalPages}</Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  
  header: { padding: 16, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', alignItems: 'center' },
  backButton: { marginRight: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bgPrimary, justifyContent: 'center', alignItems: 'center' },
  backButtonText: { color: colors.textMain, fontSize: 20, fontFamily: 'Inter_700Bold' },
  title: { fontSize: 20, fontFamily: 'Inter_700Bold', color: colors.primary },

  descContainer: { padding: 16, paddingBottom: 0 },
  descText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: colors.textMuted },
  
  searchContainer: { flexDirection: 'row', backgroundColor: colors.bgCard, margin: 16, paddingHorizontal: 12, alignItems: 'center', borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchBar: { flex: 1, paddingVertical: 12, fontSize: 16, fontFamily: 'Inter_400Regular' },
  
  card: { flexDirection: 'row', backgroundColor: colors.bgCard, padding: 16, borderRadius: radius.md, marginBottom: 12, alignItems: 'center', ...shadow.sm },
  cardInfo: { flex: 1 },
  itemName: { fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.textMain, marginBottom: 8 },
  
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badge: { fontSize: 11, color: colors.textMuted, backgroundColor: colors.bgPrimary, borderColor: colors.border, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.full, fontFamily: 'Inter_600SemiBold' },
  
  qtyContainer: { alignItems: 'flex-end', marginLeft: 16 },
  qtyLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: colors.textMuted },
  qtyValue: { fontSize: 16, fontFamily: 'Inter_700Bold', color: colors.primary },
  
  paginationFooter: { padding: 16, alignItems: 'center' },
  paginationText: { fontFamily: 'Inter_600SemiBold', color: colors.textMuted }
});
