import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View, type ScrollViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MenuButton from '../layout/MenuButton';
import { useAppLayoutOptional } from '../../context/AppLayoutContext';
import { useLayout } from '../../hooks/useLayout';
import { colors, spacing, typography } from '../../theme';

type Props = ScrollViewProps & {
  title?: string;
  subtitle?: string;
  children: ReactNode;
};

export default function Screen({ title, subtitle, children, contentContainerStyle, ...scrollProps }: Props) {
  const { contentPadding, maxContentWidth, isWide } = useLayout();
  const layout = useAppLayoutOptional();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingHorizontal: contentPadding },
          contentContainerStyle,
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        {...scrollProps}
      >
        <View style={[styles.inner, { maxWidth: maxContentWidth }, isWide && styles.innerWide]}>
          {(title || layout) && (
            <View style={styles.header}>
              {layout ? <MenuButton /> : null}
              <View style={styles.headerText}>
                {title ? <Text style={styles.title}>{title}</Text> : null}
                {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
              </View>
            </View>
          )}
          {children}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { paddingBottom: spacing.xxl + spacing.lg, flexGrow: 1 },
  inner: { width: '100%', alignSelf: 'center' },
  innerWide: { paddingTop: spacing.sm },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.lg,
    paddingTop: spacing.sm,
  },
  headerText: { flex: 1, minWidth: 0 },
  title: { ...typography.h1, fontSize: 24, color: colors.text },
  subtitle: { ...typography.bodySm, color: colors.textMuted, marginTop: spacing.xs, lineHeight: 22 },
});
