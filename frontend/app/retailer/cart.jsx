import { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../constants/colors';
import { api } from '../../services/api';
import { getToken } from '../../services/auth';
// In a real app, cart state would come from a global store (Context/Zustand)
// For scaffolding, we'll mock the cart items

export default function RetailerCart() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  // Mock cart items
  const [cartItems, setCartItems] = useState([
    { id: 1, stockItemId: 101, name: 'Paracetamol 500mg', quantity: 10, mfg: 'Cipla' },
    { id: 2, stockItemId: 102, name: 'Amoxicillin 250mg', quantity: 5, mfg: 'Sun Pharma' }
  ]);

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) return;
    
    setLoading(true);
    try {
      const token = await getToken('retailer_token');
      // Map cart to API format
      const orderPayload = cartItems.map(item => ({
        stockItemId: item.stockItemId,
        quantity: item.quantity
      }));
      
      const res = await api.placeOrder(token, orderPayload);
      if (res.error) throw new Error(res.error);

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

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemMfg}>{item.mfg}</Text>
      </View>
      <View style={styles.cardTotal}>
        <Text style={styles.itemTotal}>Qty: {item.quantity}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
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
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: colors.textMuted,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
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
  itemTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  footer: {
    backgroundColor: colors.white,
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  checkoutButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  checkoutText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  }
});
