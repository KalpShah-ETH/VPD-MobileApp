import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../constants/colors';

export default function RoleSelector() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>VPD Sales</Text>
      <Text style={styles.subtitle}>Select your role to login</Text>
      
      <TouchableOpacity 
        style={styles.button}
        onPress={() => router.push('/retailer/login')}
      >
        <Text style={styles.buttonText}>I am a Retailer</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, styles.secondaryButton]}
        onPress={() => router.push('/salesman/login')}
      >
        <Text style={[styles.buttonText, styles.secondaryText]}>I am a Salesman</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, styles.outlineButton]}
        onPress={() => router.push('/admin/login')}
      >
        <Text style={[styles.buttonText, styles.outlineText]}>Admin Access</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 40,
  },
  button: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: colors.primaryLight,
  },
  secondaryText: {
    color: colors.primary,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  outlineText: {
    color: colors.textMuted,
  }
});
