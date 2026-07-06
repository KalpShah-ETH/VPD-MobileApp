import { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, radius, shadow } from '../../constants/colors';
import { api } from '../../services/api';
import { getToken } from '../../services/auth';

export default function RetailerPreview() {
  const router = useRouter();
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchPending, setSearchPending] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [token, setToken] = useState(null);
  const [bgImage, setBgImage] = useState(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [selectedCompanyName, setSelectedCompanyName] = useState(null);

  const debounceTimer = useRef(null);

  useEffect(() => {
    const init = async () => {
      const t = await getToken('admin_token');
      if (!t) {
        router.replace('/');
        return;
      }
      setToken(t);
      loadBgImage();
      loadData(t, 1, '', null);
    };
    init();
  }, []);

  const loadBgImage = async () => {
    try {
      const res = await fetch(`${api.baseURL}/api/retailer/bg-image`);
      const resData = await res.json();
      if (resData.image) setBgImage(`data:image/jpeg;base64,${resData.image}`);
    } catch (err) {}
  };

  const loadData = async (authToken, pageNum, searchQuery, compId) => {
    setLoading(pageNum === 1);
    try {
      // In preview mode, admins can fetch the same retailer endpoint (mocked or real)
      const res = await api.retailerBrowse(authToken, pageNum, searchQuery, compId);
      
      const newData = Array.isArray(res) ? res : res.stockItems || [];
      if (!newData) return;

      if (pageNum === 1) {
        setData(newData);
        if (res.totalPages) setTotalPages(res.totalPages);
        else setTotalPages(Math.ceil(newData.length / 50) || 1);
      } else {
        setData(prev => [...prev, ...newData]);
      }
    } catch (err) {
      console.log('Failed to fetch data', err);
    } finally {
      setLoading(false);
      setSearchPending(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    
    setSearchPending(true);
    debounceTimer.current = setTimeout(() => {
      setPage(1);
      loadData(token, 1, search, selectedCompanyId);
    }, 250);
    
    return () => clearTimeout(debounceTimer.current);
  }, [search]);

  const renderCompanyCard = ({ item }) => {
    const avatarColor = `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`;
    const initials = item.name ? item.name.substring(0, 2).toUpperCase() : 'CO';
    
    return (
      <TouchableOpacity 
        style={styles.companyCard} 
        onPress={() => {
          setSelectedCompanyId(item.id);
          setSelectedCompanyName(item.name);
          setSearch('');
          setPage(1);
          loadData(token, 1, '', item.id);
        }}
      >
        <View style={[styles.companyAvatar, { backgroundColor: avatarColor }]}>
          <Text style={styles.companyAvatarText}>{initials}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.companyName}>{item.name}</Text>
          <Text style={styles.itemMfg}>{item.stockItemsCount || 0} items in stock</Text>
        </View>
        <Text style={{color: colors.primary, fontWeight: 'bold', fontSize: 18}}>→</Text>
      </TouchableOpacity>
    );
  };

  const renderStockCard = ({ item }) => {
    const isSoldOut = item.quantity <= 0;

    return (
      <View style={[
        styles.stockCard, 
        { borderLeftColor: isSoldOut ? colors.grayOut : colors.primary },
        isSoldOut && { opacity: 0.6 }
      ]}>
        <View style={{ padding: 16 }}>
          <Text style={styles.itemName}>{item.name}</Text>
          <View style={styles.badgesRow}>
            {item.mfg ? <Text style={styles.badge}>🏭 {item.mfg}</Text> : null}
            {item.pack ? <Text style={styles.badge}>📦 Pack: {item.pack}</Text> : null}
          </View>
          {isSoldOut ? (
            <Text style={styles.soldOutText}>🚫 SOLD OUT</Text>
          ) : (
            <Text style={styles.stockText}>🟢 Available Stock: {item.quantity} strips</Text>
          )}
        </View>

        <View style={styles.actionArea}>
          <View style={[styles.addCta, { backgroundColor: colors.bgPrimary }]}>
            <Text style={[styles.addCtaText, { color: colors.textMuted }]}>Read Only Preview</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {bgImage ? (
        <ImageBackground source={{ uri: bgImage }} style={styles.bgImage} resizeMode="stretch">
          {renderContent()}
        </ImageBackground>
      ) : (
        renderContent()
      )}
    </View>
  );
  
  function renderContent() {
    return (
      <>
        {selectedCompanyId ? (
          <View style={styles.stickyHeader}>
            <TouchableOpacity onPress={() => {
              setSelectedCompanyId(null);
              setSelectedCompanyName(null);
              setSearch('');
              setPage(1);
              loadData(token, 1, '', null);
            }} style={styles.backCircle}>
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>
            <Text style={styles.stickyHeaderTitle}>{selectedCompanyName}</Text>
          </View>
        ) : (
          <View style={styles.mainHeader}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <TouchableOpacity onPress={() => router.back()} style={[styles.backCircle, {marginRight: 16}]}>
                <Text style={styles.backArrow}>←</Text>
              </TouchableOpacity>
              <View>
                <Text style={styles.mainTitle}>Retailer Preview</Text>
                <Text style={styles.mainSubtitle}>Read-only mode</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput 
            style={styles.searchBar}
            value={search}
            onChangeText={setSearch}
            placeholder={selectedCompanyId ? "Search medicines by name or manufacturer..." : "Search companies..."}
            placeholderTextColor={colors.textMuted}
          />
          {searchPending && <ActivityIndicator size="small" color={colors.primary} style={{marginRight: 8}} />}
        </View>

        {!selectedCompanyId && (
          <Text style={styles.sectionHeading}>SELECT PHARMA COMPANY</Text>
        )}

        {loading && page === 1 ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={data}
            keyExtractor={item => item.id.toString()}
            renderItem={selectedCompanyId ? renderStockCard : renderCompanyCard}
            contentContainerStyle={{ paddingBottom: 100 }}
            onEndReached={() => {
              if (page < totalPages && !loading) {
                const nextPage = page + 1;
                setPage(nextPage);
                loadData(token, nextPage, search, selectedCompanyId);
              }
            }}
            onEndReachedThreshold={0.5}
            ListEmptyComponent={
               <Text style={{textAlign: 'center', marginTop: 40, color: colors.textMuted}}>No results found.</Text>
            }
            ListFooterComponent={
              data.length > 0 && selectedCompanyId ? (
                <View style={styles.paginationFooter}>
                  <Text style={styles.paginationText}>Page {page} of {totalPages}</Text>
                </View>
              ) : null
            }
          />
        )}
      </>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  bgImage: { flex: 1, width: '100%', height: '100%' },
  
  mainHeader: {
    flexDirection: 'row', padding: 16, backgroundColor: colors.bgCard,
    alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  mainTitle: { fontSize: 22, fontWeight: '800', color: colors.primary, fontFamily: 'Inter_700Bold' },
  mainSubtitle: { fontSize: 14, color: colors.textMuted, fontFamily: 'Inter_400Regular' },
  
  stickyHeader: {
    flexDirection: 'row', padding: 12, backgroundColor: colors.bgCard, alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: colors.border, ...shadow.sm,
  },
  backCircle: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.bgPrimary,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  backArrow: { fontSize: 24, color: colors.textMain },
  stickyHeaderTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.textMain },

  searchContainer: {
    flexDirection: 'row', backgroundColor: colors.bgCard, margin: 16, paddingHorizontal: 12,
    alignItems: 'center', borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchBar: { flex: 1, paddingVertical: 12, fontSize: 16, fontFamily: 'Inter_400Regular' },
  
  sectionHeading: {
    paddingHorizontal: 16, marginBottom: 8, fontSize: 12, fontFamily: 'Inter_700Bold',
    color: colors.textMuted, letterSpacing: 1,
  },

  companyCard: {
    flexDirection: 'row', backgroundColor: colors.bgCard, padding: 16, marginHorizontal: 16,
    marginBottom: 12, borderRadius: radius.md, alignItems: 'center', minHeight: 80, ...shadow.sm,
  },
  companyAvatar: {
    width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 16,
  },
  companyAvatarText: { color: colors.white, fontFamily: 'Inter_700Bold', fontSize: 18 },
  companyName: { fontSize: 20, fontFamily: 'Inter_700Bold', color: colors.textMain, marginBottom: 4 },
  
  stockCard: {
    backgroundColor: colors.bgCard, marginHorizontal: 16, marginBottom: 12,
    borderRadius: radius.md, borderLeftWidth: 4, overflow: 'hidden', ...shadow.sm,
  },
  cardInfo: { flex: 1 },
  itemName: { fontSize: 19, fontFamily: 'Inter_700Bold', color: colors.textMain, marginBottom: 8 },
  itemMfg: { fontSize: 14, color: colors.textMuted, fontFamily: 'Inter_400Regular' },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  badge: { fontSize: 12, color: colors.textMuted, backgroundColor: colors.bgPrimary, borderColor: colors.border, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.full, fontFamily: 'Inter_600SemiBold' },
  stockText: { fontSize: 14, color: colors.success, fontFamily: 'Inter_600SemiBold' },
  soldOutText: { fontSize: 14, color: colors.danger, fontFamily: 'Inter_700Bold' },
  
  actionArea: {
    backgroundColor: colors.bgPrimary, padding: 16, borderTopWidth: 1, borderTopColor: colors.border,
  },
  addCta: { backgroundColor: colors.primary, paddingVertical: 14, borderRadius: radius.sm, alignItems: 'center', width: '100%' },
  addCtaText: { color: colors.white, fontFamily: 'Inter_700Bold', fontSize: 16 },

  paginationFooter: { padding: 16, alignItems: 'center' },
  paginationText: { fontFamily: 'Inter_600SemiBold', color: colors.textMuted }
});
