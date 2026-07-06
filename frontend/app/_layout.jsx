import { Stack } from 'expo-router';
import Toast from 'react-native-toast-message';

export default function Layout() {
  return (
    <>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#2E7D32',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'VPD Sales', headerShown: false }} />
        <Stack.Screen name="admin/dashboard" options={{ title: 'Admin Dashboard', headerBackVisible: false }} />
        <Stack.Screen name="salesman/dashboard" options={{ title: 'Salesman Dashboard', headerBackVisible: false }} />
        <Stack.Screen name="retailer/browse" options={{ title: 'Catalog', headerBackVisible: false }} />
      </Stack>
      <Toast />
    </>
  );
}
