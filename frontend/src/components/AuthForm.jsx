import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../constants/colors';
import { api } from '../../services/api';
import { saveToken } from '../../services/auth';
import { registerForPushNotifications } from '../../services/notifications';

export default function AuthForm({ role, requiresPassword = true }) {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const getTitle = () => {
    switch (role) {
      case 'admin': return 'Admin Panel';
      case 'salesman': return 'Salesman Portal';
      case 'retailer': return 'Retailer Login';
      default: return 'Login';
    }
  };

  const getIdentifierLabel = () => {
    return role === 'retailer' ? 'Phone Number' : 'Username';
  };

  const getIdentifierPlaceholder = () => {
    return role === 'retailer' ? 'e.g. 9876543210' : `Enter ${role} username`;
  };

  const handleLogin = async () => {
    if (!identifier || (requiresPassword && !password)) {
      Alert.alert('Error', `Please enter your ${getIdentifierLabel().toLowerCase()}${requiresPassword ? ' and password' : ''}`);
      return;
    }

    setLoading(true);
    try {
      let res;
      
      if (role === 'admin') {
        res = await api.adminLogin(identifier, password); // Assuming this is added to api.js
      } else if (role === 'salesman') {
        res = await api.salesmanLogin(identifier, password);
      } else if (role === 'retailer') {
        res = await api.retailerLogin(identifier);
      }
      
      if (res && res.error) {
        throw new Error(res.error);
      }

      // Save token securely if backend returns one
      if (res && res.token) {
        await saveToken(`${role}_token`, res.token);
      }

      // Setup push notifications for salesman
      if (role === 'salesman' && res && res.token) {
        const pushToken = await registerForPushNotifications();
        if (pushToken) {
          await api.salesmanPushToken(pushToken, res.token);
        }
      }

      setLoading(false);
      
      // Navigate to respective dashboard/browse
      if (role === 'admin') router.replace('/admin/dashboard');
      if (role === 'salesman') router.replace('/salesman/dashboard');
      if (role === 'retailer') router.replace('/retailer/browse');
      
    } catch (error) {
      setLoading(false);
      Alert.alert('Access Denied', error.message || 'Check your credentials');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{getTitle()}</Text>
      {role === 'retailer' && (
        <Text style={styles.subtitle}>Enter your phone number to access your catalog</Text>
      )}
      
      <View style={styles.form}>
        <Text style={styles.label}>{getIdentifierLabel()}</Text>
        <TextInput 
          style={styles.input}
          value={identifier}
          onChangeText={setIdentifier}
          autoCapitalize="none"
          keyboardType={role === 'retailer' ? 'phone-pad' : 'default'}
          placeholder={getIdentifierPlaceholder()}
        />

        {requiresPassword && (
          <>
            <Text style={styles.label}>Password</Text>
            <TextInput 
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="Enter password"
            />
          </>
        )}

        <TouchableOpacity 
          style={styles.button}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 32,
  },
  form: {
    backgroundColor: colors.white,
    padding: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    fontSize: 16,
  },
  button: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
