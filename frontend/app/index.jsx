import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Animated } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors } from '../constants/colors';
import { api } from '../services/api';
import { setToken } from '../services/auth';

export default function UnifiedLogin() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [role, setRole] = useState('salesman'); // 'retailer', 'salesman', 'admin'
  const [usernameOrPhone, setUsernameOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    // Wake DB silently
    fetch(`${api.baseURL}/api/ping`).catch(() => {});
    
    // Check for logout param
    if (params.logout === 'true') {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  }, [params]);

  const showError = (msg) => {
    setErrorMsg(msg);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setErrorMsg(null));
      }, 3000);
    });
  };

  const handleLogin = async () => {
    setErrorMsg(null);

    // Validation
    if (role === 'salesman' || role === 'retailer') {
      if (!usernameOrPhone || usernameOrPhone.length !== 10 || !/^\d+$/.test(usernameOrPhone)) {
        showError('Phone number must be exactly 10 digits.');
        return;
      }
    } else if (role === 'admin') {
      if (!usernameOrPhone) {
        showError('Admin username is required.');
        return;
      }
    }

    if (role !== 'retailer' && !password) {
      showError('Password is required.');
      return;
    }

    setLoading(true);

    try {
      let res;
      if (role === 'admin') {
        res = await fetch(`${api.baseURL}/api/admin/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: usernameOrPhone, password })
        });
      } else if (role === 'salesman') {
        res = await fetch(`${api.baseURL}/api/salesman/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: usernameOrPhone, password })
        });
      } else if (role === 'retailer') {
        res = await fetch(`${api.baseURL}/api/retailer/auth`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: usernameOrPhone })
        });
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      // Save token and navigate
      if (role === 'admin') {
        await setToken('admin_token', data.token);
        router.replace('/admin/dashboard');
      } else if (role === 'salesman') {
        await setToken('salesman_token', data.token);
        router.replace('/salesman/dashboard');
      } else if (role === 'retailer') {
        await setToken('retailer_token', data.token);
        router.replace('/retailer/browse');
      }

    } catch (err) {
      setLoading(false);
      showError(err.message);
    }
  };

  const getRoleLabel = () => {
    if (role === 'retailer') return 'Retailer';
    if (role === 'salesman') return 'Salesman';
    return 'Admin';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>VPD Order System</Text>
        <Text style={styles.subtitle}>Select role and sign in to continue.</Text>
      </View>

      {/* 3-Way Role Selector */}
      <View style={styles.pillContainer}>
        <TouchableOpacity 
          style={[styles.pillButton, role === 'retailer' && styles.pillActive]}
          onPress={() => { setRole('retailer'); setErrorMsg(null); }}
        >
          <Text style={[styles.pillText, role === 'retailer' && styles.pillTextActive]}>🛍️ Retailer</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.pillButton, role === 'salesman' && styles.pillActive]}
          onPress={() => { setRole('salesman'); setErrorMsg(null); }}
        >
          <Text style={[styles.pillText, role === 'salesman' && styles.pillTextActive]}>💼 Salesman</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.pillButton, role === 'admin' && styles.pillActive]}
          onPress={() => { setRole('admin'); setErrorMsg(null); }}
        >
          <Text style={[styles.pillText, role === 'admin' && styles.pillTextActive]}>🛡️ Admin</Text>
        </TouchableOpacity>
      </View>

      {/* Error Box */}
      {errorMsg && (
        <Animated.View style={[styles.errorBox, { opacity: fadeAnim }]}>
          <Text style={styles.errorText}>{errorMsg}</Text>
        </Animated.View>
      )}

      {/* Dynamic Form */}
      <View style={styles.formCard}>
        <Text style={styles.label}>
          {role === 'admin' ? 'Username' : 'WhatsApp Phone Number'}
        </Text>
        <TextInput
          style={styles.input}
          placeholder={role === 'admin' ? "Enter admin username" : "Enter 10-digit phone number"}
          value={usernameOrPhone}
          onChangeText={setUsernameOrPhone}
          keyboardType={role === 'admin' ? "default" : "phone-pad"}
          autoCapitalize="none"
        />

        {role !== 'retailer' && (
          <>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Enter password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Text style={styles.eyeText}>{showPassword ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <TouchableOpacity 
          style={[styles.submitButton, loading && styles.submitDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <Text style={styles.submitText}>Signing in...</Text>
          ) : (
            <Text style={styles.submitText}>Sign In as {getRoleLabel()}</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Retailer Info Box */}
      {role === 'retailer' && (
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Are you a Retailer? Retailers usually do not need a password. Please tap the unique private link sent to your phone via WhatsApp, or enter your registered phone number above to login directly.
          </Text>
        </View>
      )}

      {/* Logout Toast */}
      {showToast && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>✓ Successfully logged out</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc', // light gray/white background
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.primary, // bold blue text
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textMuted,
  },
  pillContainer: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0', // transparent/muted pill background
    borderRadius: 30,
    padding: 4,
    marginBottom: 32,
    width: '100%',
    maxWidth: 400,
  },
  pillButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 26,
    alignItems: 'center',
  },
  pillActive: {
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  pillText: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '600',
  },
  pillTextActive: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  errorBox: {
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: colors.danger,
    textAlign: 'center',
    fontWeight: '600',
  },
  formCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.white,
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#f8fafc',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    marginBottom: 24,
  },
  passwordInput: {
    flex: 1,
    padding: 14,
    fontSize: 16,
  },
  eyeBtn: {
    padding: 14,
  },
  eyeText: {
    color: colors.primary,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
  },
  submitDisabled: {
    backgroundColor: colors.primaryLight,
  },
  submitText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoBox: {
    width: '100%',
    maxWidth: 400,
    marginTop: 24,
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  infoText: {
    color: '#1e3a8a',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  toast: {
    position: 'absolute',
    bottom: 40,
    backgroundColor: '#22c55e',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  toastText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 14,
  }
});
