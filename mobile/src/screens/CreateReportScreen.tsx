import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import type { AppStackParamList } from '../navigation/types';
import { useApi } from '../context/ApiContext';
import { useUser } from '../context/UserContext';
import { IncidentType, type Incident } from '../models';
import { confirmAction } from '../lib/confirm';
import { canManageOwnMark } from '../lib/incidentManage';
import { reverseGeocode, searchPlacesPh, type PlaceSuggestion } from '../nominatim';
import LocationPickerMap from '../components/maps/LocationPickerMap';
import type { LocationPickerMapRef } from '../components/maps/LocationPickerMap.types';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import Screen from '../components/ui/Screen';
import StatusBadge from '../components/ui/StatusBadge';
import MapLegend from '../components/MapLegend';
import { incidentsToMarkers, locationLabel } from '../lib/incidentMap';
import { colors, radius, spacing } from '../theme';

const TYPES = [
  { value: IncidentType.crime, label: 'Crime' },
  { value: IncidentType.fire, label: 'Fire' },
  { value: IncidentType.accident, label: 'Accident' },
  { value: IncidentType.disaster, label: 'Disaster' },
] as const;

type Props = NativeStackScreenProps<AppStackParamList, 'CreateReport'>;

export default function CreateReportScreen({ navigation }: Props) {
  const api = useApi();
  const user = useUser();
  const mapRef = useRef<LocationPickerMapRef>(null);

  const [draftType, setDraftType] = useState<string>(IncidentType.crime);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [draftSaved, setDraftSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);
  const [myIncidents, setMyIncidents] = useState<Incident[]>([]);
  const [barangayIncidents, setBarangayIncidents] = useState<Incident[]>([]);

  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [results, setResults] = useState<PlaceSuggestion[]>([]);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mapMarkers = useMemo(() => {
    const byId = new Map<string, Incident>();
    for (const i of barangayIncidents) byId.set(i.id, i);
    for (const i of myIncidents) byId.set(i.id, i);
    return incidentsToMarkers([...byId.values()]);
  }, [barangayIncidents, myIncidents]);

  const refresh = useCallback(async () => {
    try {
      const mine = await api.listIncidentsForReporter(user.id);
      setMyIncidents(mine);
      if (user.barangayId) {
        const barangay = await api.listIncidentsForBarangay(user.barangayId);
        setBarangayIncidents(barangay);
      }
      setTimeout(() => mapRef.current?.fitToMarkers(), 120);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [api, user.id, user.barangayId]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  useEffect(() => {
    setDraftSaved(false);
    setError(null);
  }, [draftType, title, description]);

  useEffect(() => {
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, []);

  function saveInfo() {
    const t = title.trim();
    const d = description.trim();
    if (!t || !d) {
      setDraftSaved(false);
      setError('Title and description are required.');
      return;
    }
    setDraftSaved(true);
    setError(null);
  }

  function focusIncident(i: Incident) {
    setPin({ lat: i.location.lat, lng: i.location.lng });
    mapRef.current?.focusPoint(i.location.lat, i.location.lng);
  }

  async function deleteIncident(i: Incident) {
    if (!canManageOwnMark(i, user.id)) return;
    const ok = await confirmAction('Delete marked report?', 'This cannot be undone.', {
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    setBusy(true);
    try {
      await api.deleteIncident(i.id);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function onMapPick(lat: number, lng: number, nameHint?: string) {
    if (!draftSaved || busy) return;
    if (!user.barangayId) {
      setError('Missing barangay for this account.');
      return;
    }
    const t = title.trim();
    const d = description.trim();
    if (!t || !d) return;

    setPin({ lat, lng });
    setBusy(true);
    setError(null);
    try {
      let locationName = nameHint;
      if (!locationName) {
        locationName = (await reverseGeocode(lat, lng)) ?? undefined;
      }
      await api.createIncident({
        reporterId: user.id,
        barangayId: user.barangayId,
        type: draftType as IncidentType,
        title: t,
        description: d,
        location: { lat, lng },
        locationName,
      });
      setPin(null);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  function onQueryChange(text: string) {
    setQuery(text);
    setSearchOpen(true);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        setResults(await searchPlacesPh(text));
      } finally {
        setSearchLoading(false);
      }
    }, 350);
  }

  function pickSearch(item: PlaceSuggestion) {
    setSearchOpen(false);
    setQuery(item.name);
    void onMapPick(item.lat, item.lng, item.name);
  }

  return (
    <Screen contentContainerStyle={styles.pad}>
      <Text style={styles.h1}>New incident report</Text>
      <Text style={styles.sub}>
        {draftSaved
          ? 'Tap the map to mark your report. Colored dots are existing marks.'
          : 'Save report info below, then mark on the map.'}
      </Text>

      <View style={styles.mapSection}>
        <LocationPickerMap
          ref={mapRef}
          style={styles.map}
          markers={mapMarkers}
          pin={pin}
          pickEnabled={draftSaved && !busy}
          onPick={(lat, lng) => void onMapPick(lat, lng)}
        />
        {busy ? (
          <View style={styles.mapOverlay}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : null}
        <View style={styles.searchWrap} pointerEvents="box-none">
          <TextInput
            style={styles.searchInput}
            placeholder="Search places (PH)"
            value={query}
            onChangeText={onQueryChange}
            onFocus={() => setSearchOpen(true)}
          />
          {searchOpen && (searchLoading || results.length > 0) ? (
            <View style={styles.suggestions}>
              {searchLoading ? <Text style={styles.hint}>Searching…</Text> : null}
              <FlatList
                data={results}
                keyExtractor={(item, index) => `${item.lat}-${item.lng}-${index}`}
                style={{ maxHeight: 160 }}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <Pressable style={styles.suggestionRow} onPress={() => pickSearch(item)}>
                    <Text numberOfLines={2}>{item.name}</Text>
                  </Pressable>
                )}
              />
            </View>
          ) : null}
        </View>
        <MapLegend bottomOffset={12} />
      </View>

      <Card style={styles.section}>
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>My marked reports</Text>
          <Text style={styles.count}>{myIncidents.length}</Text>
        </View>
        {myIncidents.length === 0 ? (
          <Text style={styles.muted}>No marks yet. Save info and tap the map above.</Text>
        ) : (
          myIncidents.map((i) => (
            <View key={i.id} style={styles.markRow}>
              <Pressable onPress={() => focusIncident(i)} style={styles.markBody}>
                <View style={styles.markHead}>
                  <Text style={styles.markTitle} numberOfLines={1}>
                    {i.title}
                  </Text>
                  <StatusBadge status={i.status} />
                </View>
                <Text style={styles.markMeta}>{i.type}</Text>
                <Text style={styles.markPlace} numberOfLines={2}>
                  {locationLabel(i)}
                </Text>
              </Pressable>
              <View style={styles.markActions}>
                <Button
                  title="Open"
                  variant="secondary"
                  onPress={() => navigation.navigate('Detail', { incidentId: i.id })}
                />
                {canManageOwnMark(i, user.id) ? (
                  <Button
                    title="Edit"
                    variant="secondary"
                    onPress={() => navigation.navigate('Edit', { incidentId: i.id })}
                  />
                ) : null}
                {canManageOwnMark(i, user.id) ? (
                  <Button title="Delete" variant="danger" onPress={() => void deleteIncident(i)} />
                ) : null}
              </View>
            </View>
          ))
        )}
      </Card>

      <Card style={styles.section}>
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>New report info</Text>
          <Text style={styles.savedHint}>{draftSaved ? 'Saved — map enabled' : 'Not saved'}</Text>
        </View>

        {error ? <Text style={styles.err}>{error}</Text> : null}

        <Text style={styles.label}>Incident type</Text>
        <View style={styles.typeRow}>
          {TYPES.map((x) => {
            const active = draftType === x.value;
            return (
              <Pressable
                key={x.value}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setDraftType(x.value)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{x.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>Title</Text>
        <Input placeholder="Short title" value={title} onChangeText={setTitle} />

        <Text style={[styles.label, styles.labelGap]}>Description</Text>
        <Input
          placeholder="What happened?"
          value={description}
          onChangeText={setDescription}
          multiline
          style={styles.multiline}
        />

        <View style={styles.gap} />
        <Button title="Save info" variant="primary" fullWidth disabled={busy} onPress={saveInfo} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  pad: { padding: spacing.lg, paddingBottom: spacing.xl * 3 },
  h1: { fontSize: 22, fontWeight: '700', color: colors.text },
  sub: { fontSize: 14, color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.md },
  mapSection: {
    height: 360,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    position: 'relative',
  },
  map: { flex: 1, minHeight: 360 },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchWrap: { position: 'absolute', top: spacing.sm, left: spacing.sm, right: spacing.sm, zIndex: 10 },
  searchInput: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 15,
  },
  suggestions: {
    marginTop: 6,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  suggestionRow: { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  hint: { padding: spacing.sm, color: colors.textMuted, fontSize: 13 },
  section: { marginBottom: spacing.lg },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  count: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  savedHint: { fontSize: 12, color: colors.textMuted },
  muted: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  markRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: spacing.md,
  },
  markBody: { marginBottom: spacing.sm },
  markHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  markTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },
  markMeta: { fontSize: 13, color: colors.textMuted, marginTop: 4, textTransform: 'capitalize' },
  markPlace: { fontSize: 12, color: colors.textMuted, marginTop: 4, marginBottom: spacing.sm },
  markActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  labelGap: { marginTop: spacing.md },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  chipTextActive: { color: colors.primaryDark },
  multiline: { minHeight: 100, textAlignVertical: 'top' },
  err: { color: colors.danger, marginBottom: spacing.md, fontSize: 14 },
  gap: { height: spacing.md },
});
