import { useCallback, useState } from 'react';
import { formatApiError } from '../lib/apiErrorMessage';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import type { AppStackParamList } from '../navigation/types';
import { useApi } from '../context/ApiContext';
import { useUser } from '../context/UserContext';
import { type Alert as EmsAlert, type Incident, type IncidentResponderRow } from '../models';
import { confirmAction } from '../lib/confirm';
import { canManageOwnMark } from '../lib/incidentManage';
import Button from '../components/ui/Button';
import ButtonRow, { ButtonRowItem } from '../components/ui/ButtonRow';
import Card from '../components/ui/Card';
import Screen from '../components/ui/Screen';
import StatusBadge from '../components/ui/StatusBadge';
import { colors, spacing } from '../theme';

type Props = NativeStackScreenProps<AppStackParamList, 'Detail'>;

export default function DetailScreen({ navigation, route }: Props) {
  const api = useApi();
  const user = useUser();
  const { incidentId } = route.params;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [incident, setIncident] = useState<Incident | null>(null);
  const [responses, setResponses] = useState<IncidentResponderRow[]>([]);
  const [alerts, setAlerts] = useState<EmsAlert[]>([]);

  const load = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const inc = await api.getIncidentById(incidentId);
      const res = await api.listResponsesByIncident(incidentId);
      const al = await api.listAlertsByBarangay(inc.barangayId);
      const filtered = al.filter((a) => a.incidentId === inc.id);
      setIncident(inc);
      setResponses(res);
      setAlerts(filtered);
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setBusy(false);
    }
  }, [api, incidentId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const canEdit = incident ? canManageOwnMark(incident, user.id) : false;

  async function deleteIncident() {
    if (!incident || !canEdit) return;
    const ok = await confirmAction('Delete marked report?', 'This action cannot be undone.', {
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    setBusy(true);
    setError(null);
    try {
      await api.deleteIncident(incident.id);
      navigation.goBack();
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setBusy(false);
    }
  }

  const i = incident;

  return (
    <Screen title="Incident details">
      {busy && !i ? <ActivityIndicator color={colors.primary} /> : null}
      {error ? <Text style={styles.err}>{error}</Text> : null}
      {!i && !busy ? <Text style={styles.muted}>Incident not loaded.</Text> : null}
      {i ? (
        <>
          <Card>
            <View style={styles.rowBadges}>
              <StatusBadge status={i.status} />
              <Text style={styles.type}>{i.type}</Text>
            </View>
            <Text style={styles.title}>{i.title}</Text>
            <Text style={styles.section}>Description</Text>
            <Text style={styles.body}>{i.description}</Text>
            <Text style={styles.meta}>
              {i.locationName ?? `Location: ${i.location.lat.toFixed(5)}, ${i.location.lng.toFixed(5)}`}
            </Text>
            <Text style={styles.meta}>Created: {new Date(i.createdAt).toLocaleString()}</Text>
            <ButtonRow>
              {canEdit ? (
                <ButtonRowItem>
                  <Button
                    title="Edit"
                    variant="outline"
                    fullWidth
                    onPress={() => navigation.navigate('Edit', { incidentId: i.id })}
                  />
                </ButtonRowItem>
              ) : null}
              {canEdit ? (
                <ButtonRowItem>
                  <Button title="Delete" variant="danger" fullWidth onPress={() => void deleteIncident()} />
                </ButtonRowItem>
              ) : null}
              <ButtonRowItem>
                <Button title="Back" variant="secondary" fullWidth onPress={() => navigation.goBack()} />
              </ButtonRowItem>
            </ButtonRow>
          </Card>

          <Text style={styles.h2}>Responses</Text>
          {responses.length === 0 ? (
            <Text style={styles.muted}>No responses yet.</Text>
          ) : (
            responses.map((r) => (
              <Card key={r.id}>
                <Text style={styles.cardTitle}>Responder: {r.responderKind}</Text>
                <Text style={styles.body}>Status: {r.status}</Text>
                {r.notes ? <Text style={styles.body}>{r.notes}</Text> : null}
                <Text style={styles.small}>{new Date(r.createdAt).toLocaleString()}</Text>
              </Card>
            ))
          )}

          <Text style={styles.h2}>Alerts</Text>
          {alerts.length === 0 ? (
            <Text style={styles.muted}>No alerts yet.</Text>
          ) : (
            alerts.map((a) => (
              <Card key={a.id}>
                <Text style={styles.cardTitle}>via {a.channel}</Text>
                <Text style={styles.body}>{a.message}</Text>
                <Text style={styles.small}>{new Date(a.createdAt).toLocaleString()}</Text>
              </Card>
            ))
          )}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  rowBadges: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  type: { fontSize: 13, fontWeight: '600', color: colors.textMuted, textTransform: 'capitalize' },
  title: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  section: { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.xs },
  body: { fontSize: 15, color: colors.text, lineHeight: 22 },
  meta: { fontSize: 12, color: colors.textMuted, marginTop: spacing.sm },
  h2: { fontSize: 17, fontWeight: '700', color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm },
  cardTitle: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: spacing.xs },
  small: { fontSize: 12, color: colors.textMuted, marginTop: spacing.sm },
  muted: { fontSize: 14, color: colors.textMuted },
  err: { color: colors.danger, marginBottom: spacing.md },
});
