import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../../theme';

type Props = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
  onBack?: () => void;
  backLabel?: string;
};

export default function AuthLayout({ title, subtitle, children, footer, onBack, backLabel = 'Back' }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.inner}>
            {onBack ? (
              <Pressable onPress={onBack} style={styles.backBtn} hitSlop={12}>
                <Text style={styles.backText}>← {backLabel}</Text>
              </Pressable>
            ) : null}

            <View style={styles.hero}>
              <View style={styles.logoBadge}>
                <Text style={styles.logoText}>EMS</Text>
              </View>
              <Text style={styles.brand}>Emergency Management</Text>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>

            {children}
            {footer ? <View style={styles.footer}>{footer}</View> : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: { flex: 1 },
  content: { flexGrow: 1, paddingBottom: spacing.xl * 2 },
  inner: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  backBtn: { alignSelf: 'flex-start', marginBottom: spacing.md, paddingVertical: spacing.xs },
  backText: { fontSize: 15, fontWeight: '600', color: colors.primary },
  hero: { marginBottom: spacing.lg },
  logoBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  logoText: { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 1.5 },
  brand: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
  },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: colors.textMuted, marginTop: spacing.sm, lineHeight: 22 },
  footer: { marginTop: spacing.lg, alignItems: 'center' },
});
