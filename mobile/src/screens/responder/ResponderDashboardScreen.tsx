import { useCallback, useState } from 'react';
import { formatApiError } from '../../lib/apiErrorMessage';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ResponderStackParamList } from '../../navigation/types';
import { useApi } from '../../context/ApiContext';
import { useUser } from '../../context/UserContext';
import type { Incident, IncidentResponse } from '../../models';
import Button from '../../components/ui/Button';
import QuickAction from '../../components/ui/QuickAction';
import Card from '../../components/ui/Card';
import Screen from '../../components/ui/Screen';
import AlertBanner from '../../components/ui/Alert';
import StatusBadge from '../../components/ui/StatusBadge';
import { colors, spacing } from '../../theme';

type Props = NativeStackScreenProps<ResponderStackParamList, 'ResponderDashboard'>;

export default function ResponderDashboardScreen({ navigation }: Props) {
  const api = useApi();
  const user = useUser();
  const barangayId = user.barangayId;

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [myResponses, setMyResponses] = useState<Record<string, IncidentResponse | undefined>>({});

  const refresh = useCallback(async () => {
    if (!barangayId) return;
    setBusy(true);
    setError(null);
    try {
      const next = await api.listIncidentsForResponder(barangayId);
      setIncidents(next);
      const entries = await Promise.all(
        next.map(async (i) => {
          const r = await api.getResponse(user.id, i.id);
          return [i.id, r] as const;
        }),
      );
      const map: Record<string, IncidentResponse | undefined> = {};
      for (const [id, r] of entries) map[id] = r;
      setMyResponses(map);
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setBusy(false);
    }
  }, [api, barangayId, user.id]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  if (!barangayId || !user.responderKind) {
    return (
      <Screen title="Responder" subtitle="Account missing barangay or responder type." showBack={false}>
        <Text style={styles.err}>Cannot load queue.</Text>
      </Screen>
    );
  }

  return (
    <Screen
      title="Emergency responder"
      subtitle={`${user.responderKind} · approved incidents in your barangay`}
      showBack={false}
      refreshControl={<RefreshControl refreshing={busy && incidents.length > 0} onRefresh={refresh} tintColor={colors.primary} />}
    >
      <QuickAction
        title="Resident marks map"
        subtitle="View all marked locations in your barangay"
        icon="🗺️"
        variant="primary"
        onPress={() => navigation.navigate('ResponderMarksMap')}
        style={{ marginBottom: spacing.lg }}
      />

      {error ? <AlertBanner>{error}</AlertBanner> : null}

      <Text style={styles.section}>Approved queue ({incidents.length})</Text>
      {incidents.length === 0 && !busy ? (
        <Card>
          <Text style={styles.empty}>No approved incidents yet.</Text>
        </Card>
      ) : null}

      {incidents.map((i) => {
        const mine = myResponses[i.id];
        return (
          <Card key={i.id}>
            <View style={styles.cardHead}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {i.title}
              </Text>
              <StatusBadge status={i.status} />
            </View>
            <Text style={styles.meta} numberOfLines={2}>
              {i.locationName ?? `${i.location.lat.toFixed(5)}, ${i.location.lng.toFixed(5)}`}
            </Text>
            <Text style={styles.metaSmall}>
              Your response: {mine ? mine.status : 'Not started'}
            </Text>
            <Button
              title="Respond"
              variant="secondary"
              onPress={() => navigation.navigate('ResponderDetail', { incidentId: i.id })}
            />
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: { marginBottom: spacing.md },
  section: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  err: { color: colors.danger, marginBottom: spacing.md },
  empty: { fontSize: 14, color: colors.textMuted },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  cardTitle: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.text },
  meta: { fontSize: 13, color: colors.textMuted, marginBottom: spacing.xs },
  metaSmall: { fontSize: 12, color: colors.textMuted, marginBottom: spacing.md },
});
