import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors, radius, shadows, spacing } from '../../theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type Size = 'sm' | 'md' | 'lg';

const variantStyle: Record<Variant, { bg: string; fg: string; border: string }> = {
  primary: { bg: colors.primary, fg: '#fff', border: colors.primary },
  secondary: { bg: colors.surface, fg: colors.text, border: colors.border },
  outline: { bg: colors.surface, fg: colors.primaryDark, border: colors.primary },
  ghost: { bg: 'transparent', fg: colors.textMuted, border: 'transparent' },
  danger: { bg: colors.danger, fg: '#fff', border: colors.danger },
};

const sizeStyle: Record<Size, { minH: number; px: number; py: number; fontSize: number; fontWeight: '700' }> = {
  sm: { minH: 40, px: spacing.md, py: spacing.sm, fontSize: 13, fontWeight: '700' },
  md: { minH: 48, px: spacing.lg, py: spacing.md, fontSize: 15, fontWeight: '700' },
  lg: { minH: 52, px: spacing.xl, py: spacing.md + 2, fontSize: 15, fontWeight: '700' },
};

type Props = PressableProps & {
  title: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: string;
  style?: StyleProp<ViewStyle>;
};

export default function Button({
  title,
  variant = 'secondary',
  size = 'md',
  loading,
  fullWidth,
  icon,
  disabled,
  style,
  ...props
}: Props) {
  const v = variantStyle[variant];
  const s = sizeStyle[size];
  const showShadow = variant === 'primary' && !disabled && !loading;

  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.base,
        {
          minHeight: s.minH,
          paddingHorizontal: s.px,
          paddingVertical: s.py,
          backgroundColor: v.bg,
          borderColor: v.border,
          transform: [{ scale: pressed && !disabled ? 0.98 : 1 }],
        },
        showShadow && shadows.button,
        fullWidth && styles.fullWidth,
        (disabled || loading) && styles.disabled,
        style,
      ]}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} size="small" />
      ) : (
        <View style={styles.inner}>
          {icon ? <Text style={[styles.icon, { color: v.fg }]}>{icon}</Text> : null}
          <Text style={[styles.label, { fontSize: s.fontSize, fontWeight: s.fontWeight, color: v.fg }]} numberOfLines={1}>
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: { alignSelf: 'stretch', width: '100%' },
  inner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  icon: { fontSize: 16 },
  label: { textAlign: 'center' },
  disabled: { opacity: 0.45 },
});
