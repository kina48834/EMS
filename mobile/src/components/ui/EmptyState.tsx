import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

export default function EmptyState({
  icon = '📍',
  title,
  body,
  action,
}: {
  icon?: string;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  icon: { fontSize: 36, marginBottom: spacing.md },
  title: { ...typography.h3, color: colors.text, textAlign: 'center' },
  body: { ...typography.bodySm, color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm, lineHeight: 22 },
  action: { marginTop: spacing.lg, alignSelf: 'stretch' },
});
