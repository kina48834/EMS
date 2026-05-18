import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { emsColors } from '@ems/shared/theme/colors';
import { IncidentStatus } from '../models';
import { useLayout } from '../hooks/useLayout';
import { colors, radius, spacing } from '../theme';

const LEGEND = [
  { status: IncidentStatus.pending, color: emsColors.mapPending, label: 'Pending' },
  { status: IncidentStatus.approved, color: emsColors.mapApproved, label: 'Approved' },
  { status: IncidentStatus.rejected, color: emsColors.mapRejected, label: 'Rejected' },
  { status: IncidentStatus.resolved, color: emsColors.mapResolved, label: 'Resolved' },
] as const;

type Props = {
  /** Extra space above the home indicator (map bottom sheet height). */
  bottomInset?: number;
};

export default function MapLegend({ bottomInset = 128 }: Props) {
  const insets = useSafeAreaInsets();
  const { isCompact, width } = useLayout();
  const bottom = insets.bottom + bottomInset;

  return (
    <View
      style={[
        styles.wrap,
        { bottom, maxWidth: Math.min(280, width - spacing.lg * 2) },
        isCompact && styles.wrapCompact,
      ]}
      pointerEvents="none"
    >
      <Text style={styles.title}>Legend</Text>
      <View style={styles.row}>
        {LEGEND.map((item) => (
          <View key={item.status} style={styles.item}>
            <View style={[styles.dot, { backgroundColor: item.color }]} />
            <Text style={styles.label}>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    right: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  wrapCompact: { right: spacing.sm, paddingHorizontal: spacing.sm },
  title: { fontSize: 11, fontWeight: '700', color: colors.text, marginBottom: 4 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  label: { fontSize: 10, color: colors.textMuted },
});
