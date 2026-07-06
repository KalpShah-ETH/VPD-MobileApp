import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { colors, radius, shadow } from '../../constants/colors';

export default function DashboardCard({ title, subtitle, onPress, badge }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.content}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardSubtitle}>{subtitle}</Text>
      </View>
      {badge !== undefined && badge !== null && (
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    width: '48%',
    padding: 16,
    borderRadius: radius.md,
    marginBottom: 16,
    ...shadow.sm,
    height: 100,
    flexDirection: 'row',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: colors.primary,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    fontFamily: 'Inter_400Regular',
  },
  badgeContainer: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.danger,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.sm,
  },
  badgeText: {
    color: colors.white,
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
  }
});
