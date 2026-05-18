import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Incident } from '../../models';
import { locationLabel } from '../../lib/incidentMap';
import { useLayout } from '../../hooks/useLayout';
import Button from '../ui/Button';
import ButtonRow, { ButtonRowItem } from '../ui/ButtonRow';
import StatusBadge from '../ui/StatusBadge';
import { colors, radius, shadows, spacing, typography } from '../../theme';

type Props = {
  incident: Incident;
  canManage: boolean;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onPress?: () => void;
};

export default function IncidentCard({ incident, canManage, onOpen, onEdit, onDelete, onPress }: Props) {
  const { buttonSize, isCompact } = useLayout();
  const i = incident;

  return (
    <View style={styles.card}>
      <Pressable
        onPress={onPress ?? onOpen}
        style={({ pressed }) => [styles.body, pressed && styles.bodyPressed]}
        accessibilityRole="button"
      >
        <View style={styles.head}>
          <View style={styles.headText}>
            <Text style={styles.title} numberOfLines={2}>
              {i.title}
            </Text>
            <Text style={styles.type}>{i.type}</Text>
          </View>
          <StatusBadge status={i.status} />
        </View>

        <Text style={styles.place} numberOfLines={2}>
          📍 {locationLabel(i)}
        </Text>
        <Text style={styles.date}>Marked {new Date(i.createdAt).toLocaleString()}</Text>
      </Pressable>

      <View style={styles.actions}>
        <ButtonRow tight={isCompact}>
          <ButtonRowItem>
            <Button title="Open" variant="secondary" size={buttonSize} fullWidth onPress={onOpen} />
          </ButtonRowItem>
          {canManage ? (
            <>
              <ButtonRowItem>
                <Button title="Edit" variant="outline" size={buttonSize} fullWidth onPress={onEdit} />
              </ButtonRowItem>
              <ButtonRowItem>
                <Button title="Delete" variant="danger" size={buttonSize} fullWidth onPress={onDelete} />
              </ButtonRowItem>
            </>
          ) : null}
        </ButtonRow>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.card,
  },
  body: { padding: spacing.lg, paddingBottom: spacing.sm },
  bodyPressed: { backgroundColor: '#fafafa' },
  actions: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, marginBottom: spacing.sm },
  headText: { flex: 1, minWidth: 0 },
  title: { ...typography.h3, color: colors.text },
  type: { ...typography.caption, color: colors.textMuted, textTransform: 'capitalize', marginTop: 4 },
  place: { ...typography.bodySm, color: colors.text, marginTop: spacing.sm, lineHeight: 20 },
  date: { ...typography.caption, color: colors.textSubtle, marginTop: spacing.xs },
});
