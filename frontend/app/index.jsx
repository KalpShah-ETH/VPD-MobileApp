import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, radius, shadow } from '../constants/colors';
import { api } from '../services/api';
import { saveToken } from '../services/auth';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

export default function UnifiedLogin() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [role, setRole] = useState('salesman'); // 'salesman', 'admin'
  const [usernameOrPhone, setUsernameOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    // Wake DB silently exactly once on mount
    fetch(`${api.baseURL}/api/ping`).catch(() => {});
  }, []);

  useEffect(() => {
    // Check for logout param
    if (params.logout === 'true') {
      Toast.show({
        type: 'success',
        text1: 'Successfully logged out',
        position: 'bottom'
      });
    }
  }, [params.logout]);

  const handleLogin = async () => {
    setErrorMsg('');
    
    if (!usernameOrPhone) {
      setErrorMsg(`${role === 'admin' ? 'Admin' : 'Salesman'} username/phone is required.`);
      return;
    }

    if (!password) {
      setErrorMsg('Password is required.');
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
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      Toast.show({
        type: 'success',
        text1: `Welcome back, ${role === 'admin' ? 'Admin' : 'Salesman'}!`,
        position: 'top'
      });

      // Save token and navigate
      if (role === 'admin') {
        await saveToken('admin_token', data.token);
        router.replace('/admin/dashboard');
      } else if (role === 'salesman') {
        await saveToken('salesman_token', data.token);
        router.replace('/salesman/dashboard');
      }

    } catch (err) {
      setLoading(false);
      setErrorMsg(err.message);
    }
  };

  const getRoleLabel = () => {
    if (role === 'salesman') return 'Salesman';
    return 'Admin';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>VPD Order System</Text>
        <Text style={styles.subtitle}>Select role and sign in to continue</Text>
      </View>

      {/* 2-Way Segmented Control */}
      <View style={styles.segmentedControl}>
        <TouchableOpacity 
          style={[styles.segmentButton, role === 'salesman' && styles.segmentActive]}
          onPress={() => setRole('salesman')}
        >
          <Text style={[styles.segmentText, role === 'salesman' && styles.segmentTextActive]}>💼 Salesman</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.segmentButton, role === 'admin' && styles.segmentActive]}
          onPress={() => setRole('admin')}
        >
          <Text style={[styles.segmentText, role === 'admin' && styles.segmentTextActive]}>🛡️ Admin</Text>
        </TouchableOpacity>
      </View>

      {/* Dynamic Form */}
      <View style={styles.formCard}>
        {errorMsg ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}

        <Text style={styles.label}>
          {role === 'admin' ? 'Username' : 'WhatsApp Phone Number'}
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Enter username/phone"
          value={usernameOrPhone}
          onChangeText={setUsernameOrPhone}
          keyboardType={role === 'salesman' ? "phone-pad" : "default"}
          autoCapitalize="none"
        />

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
            <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={24} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    color: colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: colors.textMuted,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: colors.bgPrimary,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 4,
    marginBottom: 32,
    width: '100%',
    maxWidth: 440,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: colors.bgCard,
    ...shadow.sm,
  },
  segmentText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: colors.textMuted,
  },
  segmentTextActive: {
    color: colors.primary,
  },
  formCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: colors.bgCard,
    padding: 24,
    borderRadius: radius.lg,
    ...shadow.lg,
  },
  errorBox: {
    backgroundColor: colors.dangerLight,
    borderColor: colors.danger,
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontFamily: 'Inter_600SemiBold',
    color: colors.danger,
    fontSize: 14,
  },
  label: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: colors.textMain,
    marginBottom: 8,
  },
  input: {
    fontFamily: 'Inter_400Regular',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: 14,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: colors.bgPrimary,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.bgPrimary,
    marginBottom: 24,
  },
  passwordInput: {
    fontFamily: 'Inter_400Regular',
    flex: 1,
    padding: 14,
    fontSize: 16,
  },
  eyeBtn: {
    padding: 14,
  },
  submitButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: radius.sm,
    alignItems: 'center',
    width: '100%',
  },
  submitDisabled: {
    backgroundColor: colors.grayOut,
  },
  submitText: {
    fontFamily: 'Inter_700Bold',
    color: colors.white,
    fontSize: 16,
  }
});
