import { emsColors } from '@ems/shared/theme/colors';
import { StyleSheet, Text, View } from 'react-native';
import { IncidentStatus } from '../../models';
import { radius, spacing } from '../../theme';

const palette: Record<string, { bg: string; fg: string; label: string }> = {
  [IncidentStatus.pending]: { bg: '#fffbeb', fg: '#b45309', label: 'Pending' },
  [IncidentStatus.approved]: { bg: emsColors.primaryLight, fg: emsColors.primaryDark, label: 'Approved' },
  [IncidentStatus.rejected]: { bg: '#fff1f2', fg: '#be123c', label: 'Rejected' },
  [IncidentStatus.resolved]: { bg: '#f0f9ff', fg: '#0369a1', label: 'Resolved' },
};

export default function StatusBadge({ status }: { status: string }) {
  const c = palette[status] ?? { bg: '#f1f5f9', fg: '#475569', label: status };
  return (
    <View style={[styles.pill, { backgroundColor: c.bg }]}>
      <Text style={[styles.text, { color: c.fg }]}>{c.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  text: { fontSize: 12, fontWeight: '700' },
});
