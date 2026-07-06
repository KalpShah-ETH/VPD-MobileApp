import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { colors, radius, shadow } from '../../constants/colors';
import { api } from '../../services/api';
import { getToken } from '../../services/auth';
import Toast from 'react-native-toast-message';

export default function AdminSettings() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [adminsCount, setAdminsCount] = useState(0);
  const [uploads, setUploads] = useState([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = await getToken('admin_token');
      // Mocked endpoints if backend doesn't exist yet, or real if they do
      // The user requested parity even if it means adding screens. We will attempt to fetch or default to empty/0
      const resAdmins = await fetch(`${api.baseURL}/api/admin/list`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(r => r.json()).catch(() => ({ admins: [] }));
      
      if (resAdmins && resAdmins.admins) setAdminsCount(resAdmins.admins.length);

      const resUploads = await fetch(`${api.baseURL}/api/admin/uploads/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(r => r.json()).catch(() => ({ history: [] }));

      if (resUploads && resUploads.history) setUploads(resUploads.history);
      
    } catch (err) {
      console.log('Failed to fetch settings data', err);
    } finally {
      setFetching(false);
    }
  };

  const handleCreateAdmin = async () => {
    if (!username || !password) {
      Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Username and password required.' });
      return;
    }
    
    setLoading(true);
    try {
      const token = await getToken('admin_token');
      const res = await fetch(`${api.baseURL}/api/admin/create-admin`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ username, password })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create admin');
      
      Toast.show({ type: 'success', text1: 'Admin Created Successfully!' });
      setUsername('');
      setPassword('');
      fetchData(); // refresh count
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Error', text2: err.message });
    } finally {
      setLoading(false);
    }
  };

  const renderUploadHistory = ({ item }) => (
    <View style={styles.historyCard}>
      <Text style={styles.historyFile}>{item.filename || 'upload.csv'}</Text>
      <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 8}}>
        <Text style={styles.historyMeta}>By: {item.admin_username || 'Admin'}</Text>
        <Text style={styles.historyMeta}>{item.items_added || 0} items added</Text>
      </View>
      <Text style={styles.historyTime}>{new Date(item.created_at || Date.now()).toLocaleString()}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{padding: 16}}>
      <Text style={styles.pageTitle}>System Settings</Text>

      {/* Create Admin Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Create Admin Account</Text>
          <Text style={styles.sectionSubtitle}>Currently registered admins: {adminsCount}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            placeholder="New admin username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="New admin password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TouchableOpacity 
            style={[styles.primaryBtn, loading && styles.disabledBtn]}
            onPress={handleCreateAdmin}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.primaryBtnText}>Create Admin</Text>}
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Uploads Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Stock Uploads</Text>
          <Text style={styles.sectionSubtitle}>History of global CSV uploads</Text>
        </View>
        {fetching ? (
          <ActivityIndicator color={colors.primary} style={{marginTop: 20}} />
        ) : uploads.length === 0 ? (
          <View style={styles.card}>
            <Text style={{color: colors.textMuted, fontFamily: 'Inter_400Regular', textAlign: 'center'}}>No recent uploads found.</Text>
          </View>
        ) : (
          <FlatList
            data={uploads}
            keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
            renderItem={renderUploadHistory}
            scrollEnabled={false}
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  pageTitle: { fontSize: 24, fontFamily: 'Inter_700Bold', color: colors.textMain, marginBottom: 24 },
  
  section: { marginBottom: 32 },
  sectionHeader: { marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.textMain },
  sectionSubtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', color: colors.textMuted },
  
  card: { backgroundColor: colors.bgCard, padding: 20, borderRadius: radius.md, ...shadow.sm },
  label: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.textMain, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: 12, marginBottom: 16, fontFamily: 'Inter_400Regular', backgroundColor: colors.bgPrimary },
  
  primaryBtn: { backgroundColor: colors.primary, padding: 14, borderRadius: radius.sm, alignItems: 'center' },
  disabledBtn: { opacity: 0.7 },
  primaryBtnText: { color: colors.white, fontFamily: 'Inter_700Bold', fontSize: 16 },

  historyCard: { backgroundColor: colors.bgCard, padding: 16, borderRadius: radius.md, marginBottom: 12, ...shadow.sm, borderLeftWidth: 4, borderLeftColor: colors.primary },
  historyFile: { fontSize: 16, fontFamily: 'Inter_700Bold', color: colors.textMain },
  historyMeta: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.textMuted },
  historyTime: { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.textMuted, marginTop: 8 }
});
