import { Stack } from 'expo-router';

export default function Layout() {
  return (
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
      <Stack.Screen name="admin/login" options={{ title: 'Admin Login' }} />
      <Stack.Screen name="admin/dashboard" options={{ title: 'Admin Dashboard', headerBackVisible: false }} />
      <Stack.Screen name="salesman/login" options={{ title: 'Salesman Login' }} />
      <Stack.Screen name="salesman/dashboard" options={{ title: 'Salesman Dashboard', headerBackVisible: false }} />
      <Stack.Screen name="retailer/login" options={{ title: 'Retailer Login' }} />
      <Stack.Screen name="retailer/browse" options={{ title: 'Catalog', headerBackVisible: false }} />
    </Stack>
  );
}
