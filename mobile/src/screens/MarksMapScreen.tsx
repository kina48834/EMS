import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { formatApiError } from '../lib/apiErrorMessage';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import type { AppStackParamList } from '../navigation/types';
import { useApi } from '../context/ApiContext';
import { useUser } from '../context/UserContext';
import { type Incident } from '../models';
import { confirmAction } from '../lib/confirm';
import { canManageOwnMark } from '../lib/incidentManage';
import IncidentsMapView from '../components/maps/IncidentsMapView';
import type { IncidentsMapRef } from '../components/maps/types';
import MapScreenShell from '../components/layout/MapScreenShell';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import HeaderIconButton from '../components/ui/HeaderIconButton';
import MapLegend from '../components/MapLegend';
import StatusBadge from '../components/ui/StatusBadge';
import { incidentsToMarkers, locationLabel } from '../lib/incidentMap';
import { colors, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<AppStackParamList, 'MarksMap'>;

export default function MarksMapScreen({ navigation }: Props) {
  const api = useApi();
  const user = useUser();
  const mapRef = useRef<IncidentsMapRef>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selected, setSelected] = useState<Incident | null>(null);

  const markers = useMemo(() => incidentsToMarkers(incidents), [incidents]);

  const refresh = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const items = await api.listIncidentsForReporter(user.id);
      setIncidents(items);
      setSelected((prev) => {
        if (!prev) return null;
        const next = items.find((x) => x.id === prev.id) ?? null;
        if (next) mapRef.current?.focusPoint(next.location.lat, next.location.lng);
        return next;
      });
      setTimeout(() => mapRef.current?.fitToMarkers(), 100);
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setBusy(false);
    }
  }, [api, user.id]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  useEffect(() => {
    if (incidents.length > 0 && !selected) {
      setTimeout(() => mapRef.current?.fitToMarkers(), 150);
    }
  }, [incidents.length, selected]);

  function onSelectById(id: string) {
    const i = incidents.find((x) => x.id === id);
    if (!i) return;
    setSelected(i);
    mapRef.current?.focusPoint(i.location.lat, i.location.lng);
  }

  async function deleteIncident(i: Incident) {
    if (!canManageOwnMark(i, user.id)) return;
    const ok = await confirmAction('Delete marked report?', 'This action cannot be undone.', {
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    setBusy(true);
    setError(null);
    try {
      await api.deleteIncident(i.id);
      setSelected(null);
      await refresh();
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setBusy(false);
    }
  }

  const markLabel = `${incidents.length} mark${incidents.length === 1 ? '' : 's'} on map`;

  return (
    <MapScreenShell
      title="My Marks Map"
      subtitle={markLabel}
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

        <MapLegend />

      <View style={styles.bottom}>
        {selected == null ? (
          <Card style={styles.sheet}>
            <Text style={styles.muted}>
              {incidents.length === 0
                ? 'No marks yet. Create a report and mark it on the map.'
                : 'Tap a colored dot on the map to view details.'}
            </Text>
          </Card>
        ) : (
          <Card style={styles.sheet}>
            <View style={styles.cardHead}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {selected.title}
              </Text>
              <StatusBadge status={selected.status} />
            </View>
            <Text style={styles.meta}>Type: {selected.type}</Text>
            <Text style={styles.place} numberOfLines={2}>
              {locationLabel(selected)}
            </Text>
            <Text style={styles.small}>Marked: {new Date(selected.createdAt).toLocaleString()}</Text>
            <View style={styles.actions}>
              <Button
                title="Open"
                variant="secondary"
                onPress={() => navigation.navigate('Detail', { incidentId: selected.id })}
              />
              {canManageOwnMark(selected, user.id) ? (
                <Button
                  title="Edit"
                  variant="secondary"
                  onPress={() => navigation.navigate('Edit', { incidentId: selected.id })}
                />
              ) : null}
              {canManageOwnMark(selected, user.id) ? (
                <Button title="Delete" variant="danger" onPress={() => void deleteIncident(selected)} />
              ) : null}
            </View>
            {error ? <Text style={styles.err}>{error}</Text> : null}
          </Card>
        )}
      </View>

      </View>
    </MapScreenShell>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  map: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottom: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
  },
  sheet: { marginBottom: 0 },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  cardTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.text },
  meta: { fontSize: 14, color: colors.text, marginBottom: spacing.xs },
  place: { fontSize: 12, color: colors.textMuted, marginBottom: spacing.xs },
  small: { fontSize: 12, color: colors.textMuted, marginBottom: spacing.md },
  muted: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  err: { color: colors.danger, marginTop: spacing.sm, fontSize: 13 },
});
