import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLayout } from '../../hooks/useLayout';
import { colors, radius, shadows, spacing, typography } from '../../theme';

type Props = {
  title: string;
  subtitle?: string;
  icon: string;
  variant?: 'primary' | 'secondary';
  onPress: () => void;
  style?: object;
};

export default function QuickAction({ title, subtitle, icon, variant = 'secondary', onPress, style }: Props) {
  const primary = variant === 'primary';
  const { isCompact } = useLayout();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.wrap,
        primary ? styles.primary : styles.secondary,
        primary && shadows.button,
        pressed && styles.pressed,
        style,
      ]}
    >
      <View
        style={[
          styles.iconBox,
          isCompact && styles.iconBoxCompact,
          primary ? styles.iconBoxPrimary : styles.iconBoxSecondary,
        ]}
      >
        <Text style={[styles.icon, isCompact && styles.iconCompact]}>{icon}</Text>
      </View>
      <View style={styles.text}>
        <Text
          style={[styles.title, primary && styles.titlePrimary, isCompact && styles.titleCompact]}
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={0.85}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.sub, primary && styles.subPrimary]} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    minHeight: 76,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  primary: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    ...shadows.card,
  },
  pressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },
  iconBox: {
    width: 44,
    height: 44,
    flexShrink: 0,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxCompact: { width: 40, height: 40 },
  iconBoxPrimary: { backgroundColor: 'rgba(255,255,255,0.2)' },
  iconBoxSecondary: { backgroundColor: colors.primaryLight },
  icon: { fontSize: 22 },
  iconCompact: { fontSize: 20 },
  text: { flex: 1, minWidth: 0 },
  title: { ...typography.button, color: colors.text },
  titleCompact: { fontSize: 14 },
  titlePrimary: { color: '#fff' },
  sub: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  subPrimary: { color: 'rgba(255,255,255,0.85)' },
});
