import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type ScrollViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppScreenHeader from '../layout/AppScreenHeader';
import { useLayout } from '../../hooks/useLayout';
import { colors, spacing } from '../../theme';

type Props = ScrollViewProps & {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  headerRight?: ReactNode;
  children: ReactNode;
};

export default function Screen({
  title,
  subtitle,
  showBack,
  headerRight,
  children,
  contentContainerStyle,
  ...scrollProps
}: Props) {
  const { contentPadding, maxContentWidth, isWide } = useLayout();
  const hasHeader = Boolean(title || subtitle || headerRight);

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
          {hasHeader ? (
            <AppScreenHeader
              title={title}
              subtitle={subtitle}
              showBack={showBack}
              right={headerRight}
            />
          ) : null}
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
});
