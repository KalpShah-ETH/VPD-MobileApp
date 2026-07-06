import { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, radius, shadow } from '../../constants/colors';
import { api } from '../../services/api';
import { getToken } from '../../services/auth';
import Toast from 'react-native-toast-message';

export default function RetailerCart() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    const loadCart = async () => {
      const savedCart = await AsyncStorage.getItem('retailer_cart');
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        setCartItems(Object.values(parsed));
      }
    };
    loadCart();
  }, []);

  const saveCart = async (items) => {
    const cartObj = {};
    items.forEach(item => { cartObj[item.id] = item; });
    await AsyncStorage.setItem('retailer_cart', JSON.stringify(cartObj));
  };

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) return;
    
    setLoading(true);
    try {
      const token = await getToken('retailer_token');
      const orderPayload = cartItems.map(item => ({
        stockItemId: item.id,
        quantity: item.cartQty
      }));
      
      const res = await api.placeOrder(token, orderPayload);
      if (res.error) throw new Error(res.error);

      await AsyncStorage.removeItem('retailer_cart');
      setCartItems([]);
      setLoading(false);
      
      Toast.show({ type: 'success', text1: 'Order placed successfully!' });
      router.replace('/retailer/browse');
    } catch (error) {
      setLoading(false);
      Toast.show({ type: 'error', text1: 'Order Failed', text2: error.message });
    }
  };

  const updateQuantity = (itemId, maxQty, delta) => {
    const updated = cartItems.map(item => {
      if (item.id === itemId) {
        let newQty = item.cartQty + delta;
        if (newQty < 1) newQty = 1;
        if (newQty > maxQty) newQty = maxQty;
        return { ...item, cartQty: newQty };
      }
      return item;
    });
    setCartItems(updated);
    saveCart(updated);
  };

  const handleRemoveItem = (itemId) => {
    const updated = cartItems.filter(i => i.id !== itemId);
    setCartItems(updated);
    saveCart(updated);
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemMfg}>{item.mfg || 'No Manufacturer'}</Text>
        </View>
        <TouchableOpacity onPress={() => handleRemoveItem(item.id)} style={styles.removeBtn}>
          <Text style={styles.removeIcon}>🗑️</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.cardFooter}>
        <View style={styles.stepperContainer}>
          <TouchableOpacity style={styles.stepperBtn} onPress={() => updateQuantity(item.id, item.quantity, -1)}>
            <Text style={styles.stepperBtnText}>-</Text>
          </TouchableOpacity>
          <TextInput 
            style={styles.stepperInput}
            value={item.cartQty.toString()}
            editable={false}
          />
          <TouchableOpacity style={styles.stepperBtn} onPress={() => updateQuantity(item.id, item.quantity, 1)}>
            <Text style={styles.stepperBtnText}>+</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.totalText}>Total: {item.cartQty} strips</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backCircle}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shopping Cart</Text>
      </View>

      {cartItems.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Your cart is empty.</Text>
          <TouchableOpacity 
            style={styles.continueBtnSecondary}
            onPress={() => router.back()}
          >
            <Text style={styles.continueTextSecondary}>Browse Catalog</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={cartItems}
            keyExtractor={item => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={{ padding: 16 }}
          />
          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.checkoutButton}
              onPress={handlePlaceOrder}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.checkoutText}>Send WhatsApp Order</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.continueBtn}
              onPress={() => router.back()}
              disabled={loading}
            >
              <Text style={styles.continueText}>Add More / Continue Browsing</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  header: { 
    flexDirection: 'row', padding: 12, backgroundColor: colors.bgCard, 
    alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border, ...shadow.sm 
  },
  backCircle: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.bgPrimary,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  backArrow: { fontSize: 24, color: colors.textMain },
  headerTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.textMain },
  
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyText: { fontSize: 18, color: colors.textMuted, fontFamily: 'Inter_600SemiBold', marginBottom: 24 },
  continueBtnSecondary: { borderWidth: 1, borderColor: colors.primary, padding: 16, borderRadius: radius.sm, width: '100%', alignItems: 'center' },
  continueTextSecondary: { color: colors.primary, fontFamily: 'Inter_700Bold', fontSize: 16 },
  
  card: { backgroundColor: colors.bgCard, padding: 16, borderRadius: radius.md, marginBottom: 12, ...shadow.sm },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  cardInfo: { flex: 1 },
  itemName: { fontSize: 16, fontFamily: 'Inter_700Bold', color: colors.textMain },
  itemMfg: { fontSize: 12, color: colors.textMuted, fontFamily: 'Inter_400Regular', marginTop: 4 },
  removeBtn: { padding: 8, backgroundColor: colors.dangerLight, borderRadius: radius.sm, marginLeft: 12 },
  removeIcon: { fontSize: 16 },
  
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stepperContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgPrimary, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border },
  stepperBtn: { paddingHorizontal: 12, paddingVertical: 6 },
  stepperBtnText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: colors.textMain },
  stepperInput: { width: 30, textAlign: 'center', fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.textMain },
  totalText: { fontFamily: 'Inter_600SemiBold', color: colors.primary },

  footer: { backgroundColor: colors.bgCard, padding: 24, borderTopWidth: 1, borderTopColor: colors.border },
  checkoutButton: { backgroundColor: colors.primary, padding: 16, borderRadius: radius.sm, alignItems: 'center', marginBottom: 12 },
  checkoutText: { color: colors.white, fontSize: 16, fontFamily: 'Inter_700Bold' },
  continueBtn: { padding: 16, borderRadius: radius.sm, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  continueText: { color: colors.textMain, fontSize: 16, fontFamily: 'Inter_600SemiBold' }
});
