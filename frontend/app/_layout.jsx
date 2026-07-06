import { Stack } from 'expo-router';
import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { ActivityIndicator, View } from 'react-native';

const toastConfig = {
  success: (props) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: '#2E7D32', width: '100%', borderRadius: 0, marginTop: 0 }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 15,
        fontFamily: 'Inter_600SemiBold'
      }}
    />
  ),
  error: (props) => (
    <ErrorToast
      {...props}
      style={{ borderLeftColor: '#d32f2f', width: '100%', borderRadius: 0, marginTop: 0 }}
      text1Style={{
        fontSize: 15,
        fontFamily: 'Inter_600SemiBold'
      }}
      text2Style={{
        fontSize: 13,
        fontFamily: 'Inter_400Regular'
      }}
    />
  )
};

export default function Layout() {
  let [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  return (
    <>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#2E7D32',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontFamily: 'Inter_700Bold',
          },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'VPD Sales', headerShown: false }} />
        <Stack.Screen name="admin/dashboard" options={{ title: 'Admin Dashboard', headerBackVisible: false }} />
        <Stack.Screen name="salesman/dashboard" options={{ title: 'Salesman Dashboard', headerBackVisible: false }} />
        <Stack.Screen name="retailer/browse" options={{ title: 'Catalog', headerBackVisible: false }} />
      </Stack>
      <Toast config={toastConfig} />
    </>
  );
}
