import { useCallback, useEffect, useRef, useState } from 'react';
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
import type { IncidentType } from '@ems/shared/types';
import { IncidentType as IncidentTypes, type Incident } from '../models';
import { reverseGeocode, searchPlacesPh, type PlaceSuggestion } from '../nominatim';
import LocationPickerMap from '../components/maps/LocationPickerMap';
import type { LocationPickerMapRef } from '../components/maps/LocationPickerMap.types';
import { confirmAction } from '../lib/confirm';
import { canManageOwnMark } from '../lib/incidentManage';
import { incidentsToMarkers, locationLabel } from '../lib/incidentMap';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import Screen from '../components/ui/Screen';
import StatusBadge from '../components/ui/StatusBadge';
import MapLegend from '../components/MapLegend';
import { colors, radius, spacing } from '../theme';

const TYPES = [
  { value: IncidentTypes.crime, label: 'Crime' },
  { value: IncidentTypes.fire, label: 'Fire' },
  { value: IncidentTypes.accident, label: 'Accident' },
  { value: IncidentTypes.disaster, label: 'Disaster' },
] as const;

type Props = NativeStackScreenProps<AppStackParamList, 'Edit'>;

export default function EditScreen({ navigation, route }: Props) {
  const api = useApi();
  const user = useUser();
  const { incidentId } = route.params;
  const mapRef = useRef<LocationPickerMapRef>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [incident, setIncident] = useState<Incident | null>(null);
  const [draftType, setDraftType] = useState<IncidentType>(IncidentTypes.crime);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [markMode, setMarkMode] = useState(false);
  const [otherMarkers, setOtherMarkers] = useState<ReturnType<typeof incidentsToMarkers>>([]);

  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [results, setResults] = useState<PlaceSuggestion[]>([]);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const i = await api.getIncidentById(incidentId);
      if (!canManageOwnMark(i, user.id)) {
        setError('This report can no longer be edited or deleted.');
        setIncident(i);
        return;
      }
      const mine = await api.listIncidentsForReporter(user.id);
      setOtherMarkers(incidentsToMarkers(mine.filter((x) => x.id !== i.id)));
      setIncident(i);
      setDraftType(i.type);
      setTitle(i.title);
      setDescription(i.description);
      setLocation(i.location);
      setLocationName(i.locationName ?? null);
      setTimeout(() => {
        mapRef.current?.focusPoint(i.location.lat, i.location.lng);
      }, 80);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }, [api, incidentId, user.id]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  useEffect(() => {
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, []);

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

  async function applyLocation(lat: number, lng: number, nameHint?: string) {
    setLocation({ lat, lng });
    setMarkMode(false);
    mapRef.current?.focusPoint(lat, lng);
    if (nameHint) {
      setLocationName(nameHint);
      return;
    }
    try {
      const name = await reverseGeocode(lat, lng);
      setLocationName(name ?? null);
    } catch {
      setLocationName(null);
    }
  }

  function onMapPick(lat: number, lng: number) {
    if (!markMode || busy) return;
    void applyLocation(lat, lng);
  }

  function pickSearchResult(item: PlaceSuggestion) {
    setSearchOpen(false);
    void applyLocation(item.lat, item.lng, item.name);
  }

  async function save() {
    if (!incident || !location) return;
    const t = title.trim();
    const d = description.trim();
    if (!t || !d) {
      setError('Title and description are required.');
      return;
    }
    if (!canManageOwnMark(incident, user.id)) {
      setError('This report can no longer be edited.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.updateIncident(incidentId, {
        type: draftType,
        title: t,
        description: d,
        location,
        locationName: locationName ?? undefined,
      });
      navigation.goBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function deleteMark() {
    if (!incident || !canManageOwnMark(incident, user.id)) return;
    const ok = await confirmAction('Delete marked report?', 'This cannot be undone.', {
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    setBusy(true);
    try {
      await api.deleteIncident(incident.id);
      navigation.popToTop();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  const editable = incident ? canManageOwnMark(incident, user.id) : false;
  const i = incident;

  return (
    <Screen contentContainerStyle={styles.pad} keyboardShouldPersistTaps="handled">
      {busy && !i ? <ActivityIndicator color={colors.primary} /> : null}
      {error ? <Text style={styles.err}>{error}</Text> : null}
      {!i && !busy ? <Text style={styles.muted}>Incident not loaded.</Text> : null}

      {i ? (
        <>
          <Card style={styles.metaCard}>
            <StatusBadge status={i.status} />
            <Text style={styles.h1}>Edit mark</Text>
            <Text style={styles.hint}>Update details or move the pin on the map. Only pending or rejected reports can be changed.</Text>
          </Card>

          {editable ? (
            <>
              <View style={styles.mapSection}>
                <LocationPickerMap
                  ref={mapRef}
                  style={styles.map}
                  markers={otherMarkers}
                  pin={location}
                  pickEnabled={markMode && !busy}
                  onPick={onMapPick}
                />
                <View style={styles.searchWrap}>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search places (PH)"
                    value={query}
                    onChangeText={onQueryChange}
                    onFocus={() => setSearchOpen(true)}
                    editable={!busy}
                  />
                  {searchOpen ? (
                    <View style={styles.suggestions}>
                      {searchLoading ? <Text style={styles.searchHint}>Searching…</Text> : null}
                      <FlatList
                        data={results}
                        keyExtractor={(item, index) => `${item.lat}-${item.lng}-${index}`}
                        style={{ maxHeight: 160 }}
                        keyboardShouldPersistTaps="handled"
                        renderItem={({ item }) => (
                          <Pressable onPress={() => pickSearchResult(item)} style={styles.suggestionRow}>
                            <Text numberOfLines={2}>{item.name}</Text>
                          </Pressable>
                        )}
                      />
                    </View>
                  ) : null}
                </View>
                <MapLegend bottomOffset={12} />
              </View>

              {location ? (
                <Text style={styles.placeLabel} numberOfLines={2}>
                  📍 {locationName ?? locationLabel({ ...i, location, locationName: locationName ?? undefined })}
                </Text>
              ) : null}

              <View style={styles.mapActions}>
                <Button
                  title={markMode ? 'Tap map to move pin…' : 'Move pin on map'}
                  variant="secondary"
                  onPress={() => {
                    if (busy) return;
                    setMarkMode(true);
                  }}
                  disabled={markMode || busy}
                />
                {markMode ? (
                  <Button title="Cancel" variant="ghost" onPress={() => setMarkMode(false)} disabled={busy} />
                ) : null}
              </View>

              <Card>
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
                <Input placeholder="Title" value={title} onChangeText={setTitle} />

                <Text style={[styles.label, styles.labelGap]}>Description</Text>
                <Input
                  placeholder="Description"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  style={styles.multiline}
                />

                <View style={styles.gap} />
                <Button
                  title={busy ? 'Saving…' : 'Save changes'}
                  variant="primary"
                  fullWidth
                  loading={busy}
                  onPress={() => void save()}
                />
                <View style={styles.gapSm} />
                <Button title="Delete mark" variant="danger" fullWidth disabled={busy} onPress={() => void deleteMark()} />
              </Card>
            </>
          ) : (
            <Card>
              <Text style={styles.muted}>This report is approved or resolved and cannot be edited.</Text>
              <View style={styles.gap} />
              <Button title="Back" variant="secondary" fullWidth onPress={() => navigation.goBack()} />
            </Card>
          )}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  pad: { padding: spacing.lg, paddingBottom: spacing.xl * 3 },
  metaCard: { marginBottom: spacing.md },
  h1: { fontSize: 18, fontWeight: '700', color: colors.text, marginTop: spacing.md },
  hint: { fontSize: 13, color: colors.textMuted, marginTop: spacing.xs, lineHeight: 20 },
  mapSection: {
    height: 280,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
    position: 'relative',
  },
  map: { flex: 1, minHeight: 280 },
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
  searchHint: { padding: spacing.sm, color: colors.textMuted, fontSize: 13 },
  placeLabel: { fontSize: 13, color: colors.text, marginBottom: spacing.sm },
  mapActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
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
  gap: { height: spacing.md },
  gapSm: { height: spacing.sm },
  muted: { fontSize: 14, color: colors.textMuted },
  err: { color: colors.danger, marginBottom: spacing.md },
});
