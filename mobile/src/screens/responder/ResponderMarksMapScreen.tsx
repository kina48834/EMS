import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { formatApiError } from '../../lib/apiErrorMessage';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ResponderStackParamList } from '../../navigation/types';
import { useApi } from '../../context/ApiContext';
import { useUser } from '../../context/UserContext';
import { IncidentStatus, Role, type ID, type Incident, type User } from '../../models';
import type { IncidentStatus as StatusFilter } from '@ems/shared/types';
import MapScreenShell from '../../components/layout/MapScreenShell';
import IncidentsMapView from '../../components/maps/IncidentsMapView';
import type { IncidentsMapRef } from '../../components/maps/types';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import HeaderIconButton from '../../components/ui/HeaderIconButton';
import MapLegend from '../../components/MapLegend';
import StatusBadge from '../../components/ui/StatusBadge';
import { incidentsToMarkers, locationLabel } from '../../lib/incidentMap';
import { colors, radius, spacing } from '../../theme';

type Props = NativeStackScreenProps<ResponderStackParamList, 'ResponderMarksMap'>;

const STATUS_FILTERS: Array<{ value: StatusFilter | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: IncidentStatus.pending, label: 'Pending' },
  { value: IncidentStatus.approved, label: 'Approved' },
  { value: IncidentStatus.rejected, label: 'Rejected' },
  { value: IncidentStatus.resolved, label: 'Resolved' },
];

export default function ResponderMarksMapScreen({ navigation }: Props) {
  const api = useApi();
  const user = useUser();
  const barangayId = user.barangayId;
  const mapRef = useRef<IncidentsMapRef>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [residents, setResidents] = useState<User[]>([]);
  const [residentFilter, setResidentFilter] = useState<ID | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter | 'all'>('all');
  const [selected, setSelected] = useState<Incident | null>(null);

  const refresh = useCallback(async () => {
    if (!barangayId) return;
    setBusy(true);
    setError(null);
    try {
      const [nextIncidents, roleUsers] = await Promise.all([
        api.listIncidentsForBarangay(barangayId),
        api.listUsersByRole(Role.resident),
      ]);
      setIncidents(nextIncidents);
      setResidents(roleUsers.filter((r) => r.barangayId === barangayId));
      setTimeout(() => mapRef.current?.fitToMarkers(), 100);
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setBusy(false);
    }
  }, [api, barangayId]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const filtered = useMemo(() => {
    let list = incidents;
    if (residentFilter !== 'all') list = list.filter((i) => i.reporterId === residentFilter);
    if (statusFilter !== 'all') list = list.filter((i) => i.status === statusFilter);
    return list;
  }, [incidents, residentFilter, statusFilter]);

  const markers = useMemo(() => incidentsToMarkers(filtered), [filtered]);

  const residentById = useMemo(() => {
    const m = new Map<string, User>();
    for (const r of residents) m.set(r.id, r);
    return m;
  }, [residents]);

  useEffect(() => {
    if (!selected) return;
    if (!filtered.some((i) => i.id === selected.id)) setSelected(null);
  }, [filtered, selected]);

  useEffect(() => {
    if (selected) {
      mapRef.current?.focusPoint(selected.location.lat, selected.location.lng);
      return;
    }
    if (filtered.length > 0) {
      setTimeout(() => mapRef.current?.fitToMarkers(), 80);
    }
  }, [filtered, selected?.id]);

  function onSelectById(id: string) {
    const i = filtered.find((x) => x.id === id);
    if (!i) return;
    setSelected(i);
    mapRef.current?.focusPoint(i.location.lat, i.location.lng);
  }

  if (!barangayId) {
    return (
      <View style={styles.center}>
        <Text style={styles.err}>Responder barangay missing.</Text>
      </View>
    );
  }

  return (
    <MapScreenShell
      title="Resident marks map"
      subtitle={`${filtered.length} mark${filtered.length === 1 ? '' : 's'} in barangay`}
      headerRight={<HeaderIconButton label="Refresh map" icon="↻" onPress={() => void refresh()} />}
    >
      <View style={styles.flex}>
        <IncidentsMapView
        ref={mapRef}
        style={styles.map}
        markers={markers}
        selectedId={selected?.id ?? null}
        onMarkerPress={onSelectById}
      />

      {busy ? (
        <View style={styles.overlay}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : null}

      <View style={styles.filters}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          <FilterChip
            label="All residents"
            active={residentFilter === 'all'}
            onPress={() => {
              setResidentFilter('all');
              setSelected(null);
            }}
          />
          {residents.map((r) => (
            <FilterChip
              key={r.id}
              label={r.name.split(' ')[0]}
              active={residentFilter === r.id}
              onPress={() => {
                setResidentFilter(r.id);
                setSelected(null);
              }}
            />
          ))}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {STATUS_FILTERS.map((f) => (
            <FilterChip
              key={f.value}
              label={f.label}
              active={statusFilter === f.value}
              onPress={() => {
                setStatusFilter(f.value);
                setSelected(null);
              }}
            />
          ))}
        </ScrollView>
        <Text style={styles.count}>
          {filtered.length} mark{filtered.length === 1 ? '' : 's'}
        </Text>
      </View>

      <MapLegend bottomInset={150} />

      <View style={styles.bottom}>
        {error ? <Text style={styles.err}>{error}</Text> : null}
        {selected == null ? (
          <Card>
            <Text style={styles.muted}>
              {filtered.length === 0
                ? 'No marks for this filter.'
                : 'Tap a colored dot on the map to view resident mark details.'}
            </Text>
          </Card>
        ) : (
          <Card>
            <View style={styles.cardHead}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {selected.title}
              </Text>
              <StatusBadge status={selected.status} />
            </View>
            <Text style={styles.resident}>
              {residentById.get(selected.reporterId)?.name ?? selected.reporterId}
            </Text>
            <Text style={styles.place} numberOfLines={2}>
              {locationLabel(selected)}
            </Text>
            <View style={styles.actions}>
              {selected.status === IncidentStatus.approved ? (
                <Button
                  title="Respond"
                  variant="primary"
                  onPress={() => navigation.navigate('ResponderDetail', { incidentId: selected.id })}
                />
              ) : (
                <Text style={styles.mutedSmall}>Only approved incidents can be responded to.</Text>
              )}
            </View>
          </Card>
        )}
      </View>

      </View>
    </MapScreenShell>
  );
}

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  map: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filters: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
  },
  chipRow: { flexDirection: 'row', gap: spacing.xs, paddingVertical: 2 },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  chipTextActive: { color: '#fff' },
  count: { fontSize: 11, color: colors.textMuted, marginTop: 4, marginLeft: 4 },
  bottom: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  cardTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.text },
  resident: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 2 },
  place: { fontSize: 12, color: colors.textMuted, marginBottom: spacing.sm },
  muted: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  mutedSmall: { fontSize: 12, color: colors.textMuted, flex: 1 },
  actions: { flexDirection: 'row', gap: spacing.sm },
  err: { color: colors.danger, marginBottom: spacing.sm, fontSize: 13 },
});
