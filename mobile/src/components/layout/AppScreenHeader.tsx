import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useLayout } from '../../hooks/useLayout';
import { useAppLayoutOptional } from '../../context/AppLayoutContext';
import MenuButton from './MenuButton';
import { colors, spacing, typography } from '../../theme';

type Props = {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  right?: ReactNode;
};

export default function AppScreenHeader({ title, subtitle, showBack = true, right }: Props) {
  const navigation = useNavigation();
  const layout = useAppLayoutOptional();
  const { isCompact, headerTitleSize, headerSubtitleSize } = useLayout();
  const canBack = showBack && navigation.canGoBack();

  return (
    <View style={[styles.wrap, isCompact && styles.wrapCompact]}>
      <View style={styles.left}>
        {layout ? <MenuButton /> : null}
        {canBack ? (
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={8}
          >
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.center}>
        {title ? (
          <Text style={[styles.title, { fontSize: headerTitleSize }]} numberOfLines={2}>
            {title}
          </Text>
        ) : null}
        {subtitle ? (
          <Text style={[styles.subtitle, { fontSize: headerSubtitleSize }]} numberOfLines={3}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const BTN = 44;

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingTop: spacing.xs,
    minHeight: BTN,
  },
  wrapCompact: { marginBottom: spacing.sm },
  left: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  center: { flex: 1, minWidth: 0, justifyContent: 'center' },
  right: { flexShrink: 0, marginLeft: spacing.xs },
  backBtn: {
    width: BTN,
    height: BTN,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: { opacity: 0.88 },
  backIcon: {
    fontSize: 28,
    fontWeight: '300',
    color: colors.primaryDark,
    marginTop: -2,
    marginLeft: -2,
  },
  title: { ...typography.h2, color: colors.text, lineHeight: 26 },
  subtitle: { color: colors.textMuted, marginTop: 2, lineHeight: 20 },
});
