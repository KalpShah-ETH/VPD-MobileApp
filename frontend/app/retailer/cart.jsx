import { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../../constants/colors';
import { api } from '../../services/api';
import { getToken } from '../../services/auth';

export default function RetailerCart() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    const loadCart = async () => {
      const savedCart = await AsyncStorage.getItem('retailer_cart');
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        // Convert object mapping to array
        setCartItems(Object.values(parsed));
      }
    };
    loadCart();
  }, []);

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) return;
    
    setLoading(true);
    try {
      const token = await getToken('retailer_token');
      // Map cart to API format
      const orderPayload = cartItems.map(item => ({
        stockItemId: item.id,
        quantity: item.cartQty
      }));
      
      const res = await api.placeOrder(token, orderPayload);
      if (res.error) throw new Error(res.error);

      // Clear cart
      await AsyncStorage.removeItem('retailer_cart');
      setCartItems([]);

      setLoading(false);
      Alert.alert(
        "Order Placed Successfully!", 
        "Your salesman has been notified via push notification.",
        [{ text: "OK", onPress: () => router.replace('/retailer/browse') }]
      );
    } catch (error) {
      setLoading(false);
      Alert.alert("Order Failed", error.message);
    }
  };

  const handleRemoveItem = async (itemId) => {
    const updated = cartItems.filter(i => i.id !== itemId);
    setCartItems(updated);
    
    const cartObj = {};
    updated.forEach(item => { cartObj[item.id] = item; });
    await AsyncStorage.setItem('retailer_cart', JSON.stringify(cartObj));
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemMfg}>{item.companyName}</Text>
      </View>
      <View style={styles.cardTotal}>
        <Text style={styles.itemTotal}>Qty: {item.cartQty}</Text>
        <TouchableOpacity onPress={() => handleRemoveItem(item.id)}>
          <Text style={styles.removeText}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{fontSize: 16, color: colors.primary, fontWeight: 'bold'}}>← Back</Text>
        </TouchableOpacity>
        <Text style={{fontSize: 20, fontWeight: 'bold', marginLeft: 16}}>Cart</Text>
      </View>

      {cartItems.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Your cart is empty.</Text>
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
                <Text style={styles.checkoutText}>Confirm Order</Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', padding: 16, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border, alignItems: 'center' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 18, color: colors.textMuted },
  card: { flexDirection: 'row', backgroundColor: colors.white, padding: 16, borderRadius: 8, marginBottom: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  cardInfo: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: 'bold', color: colors.textDark },
  itemMfg: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  cardTotal: { alignItems: 'flex-end' },
  itemTotal: { fontSize: 16, fontWeight: 'bold', color: colors.primary },
  removeText: { fontSize: 12, color: colors.danger, marginTop: 8, fontWeight: 'bold' },
  footer: { backgroundColor: colors.white, padding: 24, borderTopWidth: 1, borderTopColor: colors.border },
  checkoutButton: { backgroundColor: colors.primary, padding: 16, borderRadius: 8, alignItems: 'center' },
  checkoutText: { color: colors.white, fontSize: 18, fontWeight: 'bold' }
});
