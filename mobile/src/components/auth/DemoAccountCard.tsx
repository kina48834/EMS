import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { DemoAccount } from '../../constants/demoAccounts';
import { colors, radius, spacing } from '../../theme';

export default function DemoAccountCard({
  account,
  disabled,
  onPress,
}: {
  account: DemoAccount;
  disabled?: boolean;
  onPress: () => void;
}) {
  const supported = account.mobileSupported;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || !supported}
      style={({ pressed }) => [
        styles.card,
        !supported && styles.cardDisabled,
        pressed && supported && styles.cardPressed,
      ]}
    >
      <View style={styles.head}>
        <Text style={[styles.label, !supported && styles.textMuted]}>{account.label}</Text>
        {account.hint ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{account.hint}</Text>
          </View>
        ) : (
          <View style={[styles.badge, styles.badgeOk]}>
            <Text style={[styles.badgeText, styles.badgeTextOk]}>Tap to sign in</Text>
          </View>
        )}
      </View>
      <Text style={styles.email} numberOfLines={1}>
        {account.email}
      </Text>
      {supported ? (
        <Text style={styles.password}>Password: {account.password}</Text>
      ) : (
        <Text style={styles.webNote}>Sign in on the Vite web app for this role.</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  cardDisabled: { opacity: 0.72, backgroundColor: '#f8fafc' },
  cardPressed: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, marginBottom: 6 },
  label: { fontSize: 14, fontWeight: '700', color: colors.text, flex: 1 },
  textMuted: { color: colors.textMuted },
  badge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  badgeOk: { backgroundColor: colors.primaryLight },
  badgeText: { fontSize: 10, fontWeight: '600', color: colors.textMuted },
  badgeTextOk: { color: colors.primaryDark },
  email: { fontSize: 12, color: colors.textMuted },
  password: { fontSize: 11, color: '#94a3b8', marginTop: 4 },
  webNote: { fontSize: 11, color: colors.textMuted, marginTop: 4, fontStyle: 'italic' },
});
