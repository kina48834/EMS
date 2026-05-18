import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Barangay } from '../../models';
import { colors, radius, spacing } from '../../theme';

export default function BarangayPicker({
  barangays,
  value,
  onChange,
  loading,
}: {
  barangays: Barangay[];
  value: string | null;
  onChange: (id: string) => void;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.loadingText}>Loading barangays…</Text>
      </View>
    );
  }

  if (barangays.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No barangays found. Run demo_accounts.sql in Supabase.</Text>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {barangays.map((b) => {
        const selected = value === b.id;
        return (
          <Pressable
            key={b.id}
            onPress={() => onChange(b.id)}
            style={[styles.row, selected && styles.rowSelected]}
          >
            <View style={[styles.radio, selected && styles.radioSelected]}>
              {selected ? <View style={styles.radioDot} /> : null}
            </View>
            <View style={styles.rowText}>
              <Text style={[styles.name, selected && styles.nameSelected]}>{b.name}</Text>
              {b.city ? <Text style={styles.city}>{b.city}</Text> : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    maxHeight: 220,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  rowSelected: { backgroundColor: colors.primaryLight },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  rowText: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: colors.text },
  nameSelected: { color: colors.primaryDark },
  city: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  loading: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.lg },
  loadingText: { fontSize: 14, color: colors.textMuted },
  empty: {
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#f8fafc',
  },
  emptyText: { fontSize: 13, color: colors.textMuted, lineHeight: 20 },
});
