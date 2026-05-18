import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { colors, radius, spacing } from '../../theme';

type Variant = 'error' | 'info' | 'success';

export type { Variant as AlertVariant };

const palette: Record<Variant, { bg: string; border: string; text: string }> = {
  error: { bg: colors.dangerLight, border: '#fecdd3', text: '#9f1239' },
  info: { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af' },
  success: { bg: colors.successLight, border: '#a5f3fc', text: colors.primaryDark },
};

export default function AlertBanner({
  children,
  variant = 'error',
  style,
}: {
  children: string;
  variant?: Variant;
  style?: ViewStyle;
}) {
  const p = palette[variant];
  return (
    <View style={[styles.wrap, { backgroundColor: p.bg, borderColor: p.border }, style]}>
      <Text style={[styles.text, { color: p.text }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  text: { fontSize: 14, lineHeight: 20, fontWeight: '500' },
});
