import { View, StyleSheet, ScrollView } from 'react-native';
import { colors } from '../../constants/colors';

export default function DashboardLayout({ children, header }) {
  return (
    <View style={styles.container}>
      {header}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.grid}>
          {children}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  }
});
