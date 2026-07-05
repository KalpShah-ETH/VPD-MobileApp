import { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ImageBackground, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../../constants/colors';
import { api } from '../../services/api';
import { getToken, removeToken } from '../../services/auth';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

export default function RetailerBrowse() {
  const router = useRouter();
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [token, setToken] = useState(null);
  const [bgImage, setBgImage] = useState(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [cart, setCart] = useState({});

  const debounceTimer = useRef(null);

  // Load initial data and cart
  useEffect(() => {
    const init = async () => {
      const t = await getToken('retailer_token');
      if (!t) {
        router.replace('/');
        return;
      }
      setToken(t);
      loadBgImage();
      
      const savedCart = await AsyncStorage.getItem('retailer_cart');
      if (savedCart) setCart(JSON.parse(savedCart));

      loadData(t, 1, '', null);
    };
    init();
  }, []);

  // Update cart count when returning from cart screen
  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem('retailer_cart').then(savedCart => {
        if (savedCart) setCart(JSON.parse(savedCart));
        else setCart({});
      });
    }, [])
  );

  const loadBgImage = async () => {
    try {
      const res = await fetch(`${api.baseURL}/api/retailer/bg-image`);
      const resData = await res.json();
      if (resData.image) setBgImage(`data:image/jpeg;base64,${resData.image}`);
    } catch (err) {}
  };

  const loadData = async (authToken, pageNum, searchQuery, compId) => {
    setLoading(pageNum === 1);
    try {
      const res = await api.retailerBrowse(authToken, pageNum, searchQuery, compId);
      
      const newData = Array.isArray(res) ? res : res.stockItems;
      if (!newData) return;

      if (pageNum === 1) {
        setData(newData);
      } else {
        setData(prev => [...prev, ...newData]);
      }
    } catch (err) {
      console.log('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  // Debounce search effect
  useEffect(() => {
    if (!token) return;
    
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    
    debounceTimer.current = setTimeout(() => {
      setPage(1);
      loadData(token, 1, search, selectedCompanyId);
    }, 250); // 250ms debounce
    
    return () => clearTimeout(debounceTimer.current);
  }, [search]);

  const handleLogout = async () => {
    await removeToken('retailer_token');
    router.replace('/');
  };

  const handleAddToCart = async (item) => {
    const newCart = { ...cart };
    if (newCart[item.id]) {
      newCart[item.id].cartQty += 1;
    } else {
      newCart[item.id] = { ...item, cartQty: 1 };
    }
    setCart(newCart);
    await AsyncStorage.setItem('retailer_cart', JSON.stringify(newCart));
    Alert.alert('Added to Cart', `${item.name} added to cart.`);
  };

  const renderCompanyCard = ({ item }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => {
        setSelectedCompanyId(item.id);
        setSearch('');
        setPage(1);
        loadData(token, 1, '', item.id);
      }}
    >
      <View style={styles.cardInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemMfg}>{item.companyName} | {item.stockItemsCount || 0} items</Text>
      </View>
      <Text style={{color: colors.primary, fontWeight: 'bold'}}>→</Text>
    </TouchableOpacity>
  );

  const renderStockCard = ({ item }) => {
    const isSoldOut = item.quantity <= 0;
    return (
      <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: isSoldOut ? colors.textMuted : colors.primary }]}>
        <View style={styles.cardInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          {item.mfg && <Text style={styles.badge}>🏭 {item.mfg}</Text>}
          {item.pack && <Text style={styles.badge}>📦 Pack: {item.pack}</Text>}
          {isSoldOut ? (
            <Text style={[styles.stockText, {color: colors.danger, fontWeight: 'bold'}]}>🚫 SOLD OUT</Text>
          ) : (
            <Text style={styles.stockText}>🟢 Available Stock: {item.quantity}</Text>
          )}
        </View>
        {!isSoldOut && (
          <TouchableOpacity style={styles.addButton} onPress={() => handleAddToCart(item)}>
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const cartItemCount = Object.keys(cart).length;

  return (
    <View style={styles.container}>
      {bgImage ? (
        <ImageBackground source={{ uri: bgImage }} style={styles.bgImage} resizeMode="stretch">
          {renderContent()}
        </ImageBackground>
      ) : (
        renderContent()
      )}
    </View>
  );
  
  function renderContent() {
    return (
      <>
        <View style={styles.header}>
          {selectedCompanyId && (
            <TouchableOpacity onPress={() => {
              setSelectedCompanyId(null);
              setSearch('');
              setPage(1);
              loadData(token, 1, '', null);
            }} style={{marginRight: 12}}>
              <Text style={{fontSize: 24}}>←</Text>
            </TouchableOpacity>
          )}
          <TextInput 
            style={styles.searchBar}
            value={search}
            onChangeText={setSearch}
            placeholder={selectedCompanyId ? "Search medicines..." : "Search companies..."}
          />
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Exit</Text>
          </TouchableOpacity>
        </View>

        {loading && page === 1 ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={data}
            keyExtractor={item => item.id.toString()}
            renderItem={selectedCompanyId ? renderStockCard : renderCompanyCard}
            contentContainerStyle={{ paddingBottom: 80 }}
            onEndReached={() => {
              if (data.length >= 50) {
                const nextPage = page + 1;
                setPage(nextPage);
                loadData(token, nextPage, search, selectedCompanyId);
              }
            }}
            onEndReachedThreshold={0.5}
            ListEmptyComponent={
               <Text style={{textAlign: 'center', marginTop: 40, color: colors.textMuted}}>No results found.</Text>
            }
          />
        )}

        {cartItemCount > 0 && (
          <TouchableOpacity style={styles.cartFab} onPress={() => router.push('/retailer/cart')}>
            <Text style={styles.cartFabText}>🛒 View Cart ({cartItemCount})</Text>
          </TouchableOpacity>
        )}
      </>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  bgImage: { flex: 1, width: '100%', height: '100%' },
  header: {
    flexDirection: 'row', padding: 16, backgroundColor: colors.white,
    borderBottomWidth: 1, borderBottomColor: colors.border, alignItems: 'center',
  },
  searchBar: {
    flex: 1, backgroundColor: colors.background, padding: 10, borderRadius: 8, marginRight: 12,
  },
  logoutBtn: { padding: 8 },
  logoutText: { color: colors.danger, fontWeight: 'bold' },
  card: {
    flexDirection: 'row', backgroundColor: colors.white, padding: 16, marginHorizontal: 16,
    marginTop: 12, borderRadius: 8, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2,
  },
  cardInfo: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: 'bold', color: colors.textDark, marginBottom: 4 },
  itemMfg: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  badge: { fontSize: 12, color: colors.textMuted, backgroundColor: '#f1f5f9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start', marginTop: 4 },
  stockText: { fontSize: 12, color: colors.success, marginTop: 6 },
  addButton: { backgroundColor: colors.primaryLight, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
  addButtonText: { color: colors.primary, fontWeight: 'bold' },
  cartFab: {
    position: 'absolute', bottom: 24, left: 24, right: 24, backgroundColor: colors.primary,
    padding: 16, borderRadius: 30, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 5,
  },
  cartFabText: { color: colors.white, fontWeight: 'bold', fontSize: 16 }
});
