import { useCallback, useEffect, useRef, useState } from 'react';
import { formatApiError } from '../lib/apiErrorMessage';
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
import type { AppStackParamList } from '../navigation/types';
import { useApi } from '../context/ApiContext';
import { useUser } from '../context/UserContext';
import type { IncidentType } from '../models';
import { reverseGeocode, searchPlacesPh, type PlaceSuggestion } from '../nominatim';
import LocationPickerMap from '../components/maps/LocationPickerMap';
import type { LocationPickerMapRef } from '../components/maps/LocationPickerMap.types';
import MapScreenShell from '../components/layout/MapScreenShell';
import Button from '../components/ui/Button';
import HeaderIconButton from '../components/ui/HeaderIconButton';
import MapLegend from '../components/MapLegend';
import { colors } from '../theme';
import { incidentsToMarkers } from '../lib/incidentMap';

function formatCoord(n: number) {
  return n.toFixed(6);
}

type Props = NativeStackScreenProps<AppStackParamList, 'MapPicker'>;

export default function MapPickerScreen({ navigation, route }: Props) {
  const api = useApi();
  const user = useUser();
  const { draftType, draftTitle, draftDescription } = route.params;
  const mapRef = useRef<LocationPickerMapRef>(null);

  const [markMode, setMarkMode] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);
  const [placeName, setPlaceName] = useState<string | null>(null);
  const [resolvingName, setResolvingName] = useState(false);
  const [markers, setMarkers] = useState<ReturnType<typeof incidentsToMarkers>>([]);

  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [results, setResults] = useState<PlaceSuggestion[]>([]);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadIncidents = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const items = await api.listIncidentsForReporter(user.id);
      setMarkers(incidentsToMarkers(items));
      setTimeout(() => mapRef.current?.fitToMarkers(), 100);
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setBusy(false);
    }
  }, [api, user.id]);

  useEffect(() => {
    void loadIncidents();
  }, [loadIncidents]);

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

  async function savePin(lat: number, lng: number, nameHint?: string | null) {
    const barangayId = user.barangayId;
    if (!barangayId) {
      setError('Missing barangay for this account.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      let locationName = nameHint ?? undefined;
      if (!locationName) {
        setResolvingName(true);
        locationName = (await reverseGeocode(lat, lng)) ?? undefined;
        setPlaceName(locationName ?? null);
        setResolvingName(false);
      }
      await api.createIncident({
        reporterId: user.id,
        barangayId,
        type: draftType as IncidentType,
        title: draftTitle,
        description: draftDescription,
        location: { lat, lng },
        locationName,
      });
      navigation.pop(2);
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setBusy(false);
      setResolvingName(false);
    }
  }

  function onMapPick(lat: number, lng: number) {
    if (!markMode || busy) return;
    setPin({ lat, lng });
    setPlaceName(null);
    setMarkMode(false);
    mapRef.current?.focusPoint(lat, lng);
    void savePin(lat, lng);
  }

  function pickSearchResult(item: PlaceSuggestion) {
    setPin({ lat: item.lat, lng: item.lng });
    setPlaceName(item.name);
    setSearchOpen(false);
    setMarkMode(false);
    mapRef.current?.focusPoint(item.lat, item.lng);
    void savePin(item.lat, item.lng, item.name);
  }

  return (
    <MapScreenShell
      title="Mark location"
      subtitle="Tap the map or search for a place"
      headerRight={<HeaderIconButton label="Refresh marks" icon="↻" onPress={() => void loadIncidents()} />}
    >
      <View style={styles.flex}>
        <LocationPickerMap
        ref={mapRef}
        style={styles.map}
        markers={markers}
        pin={pin}
        pickEnabled={markMode && !busy}
        onPick={onMapPick}
      />

      {busy ? (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : null}

      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search places (PH)"
          value={query}
          onChangeText={onQueryChange}
          onFocus={() => setSearchOpen(true)}
        />
        {searchOpen ? (
          <View style={styles.suggestions}>
            {searchLoading ? <Text style={styles.hint}>Searching...</Text> : null}
            {!searchLoading && results.length === 0 ? <Text style={styles.hint}>No results</Text> : null}
            <FlatList
              data={results}
              keyExtractor={(item, index) => `${item.lat}-${item.lng}-${index}`}
              style={{ maxHeight: 220 }}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <Pressable onPress={() => pickSearchResult(item)}>
                  <Text style={styles.suggestionRow} numberOfLines={2}>
                    {item.name}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        ) : null}
      </View>

      <MapLegend bottomInset={150} />

      <View style={styles.bottomCard}>
        {error ? <Text style={styles.err}>{error}</Text> : null}
        {pin ? (
          <View style={styles.pinInfo}>
            <Text style={styles.placeLabel} numberOfLines={3}>
              {resolvingName ? 'Looking up place name…' : placeName ?? 'Pinned location'}
            </Text>
            <Text style={styles.coords}>
              {formatCoord(pin.lat)}, {formatCoord(pin.lng)}
            </Text>
          </View>
        ) : markMode ? (
          <Text style={styles.hintCenter}>Tap the map to drop your pin.</Text>
        ) : (
          <Text style={styles.hintCenter}>Press Mark location, then tap once on the map.</Text>
        )}
        <View style={styles.actions}>
          <Button
            title={markMode ? 'Tap the map…' : 'Mark location'}
            onPress={() => {
              if (busy) return;
              setMarkMode(true);
              setError(null);
            }}
            disabled={markMode || busy}
          />
          {markMode ? (
            <Button title="Cancel" variant="secondary" onPress={() => setMarkMode(false)} disabled={busy} />
          ) : null}
        </View>
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
    backgroundColor: '#00000014',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchWrap: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    zIndex: 10,
  },
  searchInput: {
    backgroundColor: '#fffffff2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  suggestions: {
    marginTop: 6,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  suggestionRow: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', fontSize: 13 },
  hint: { padding: 10, color: '#64748b' },
  hintCenter: { color: '#475569', marginBottom: 10, textAlign: 'center' },
  bottomCard: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  err: { color: '#be123c', fontWeight: '600', marginBottom: 8 },
  pinInfo: { marginBottom: 10 },
  placeLabel: { fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  coords: { fontFamily: 'Menlo', fontSize: 12, color: '#64748b' },
  actions: { gap: 8 },
});
