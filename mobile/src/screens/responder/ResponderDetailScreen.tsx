import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ResponderStackParamList } from '../../navigation/types';
import { useApi } from '../../context/ApiContext';
import { useUser } from '../../context/UserContext';
import type { Incident, IncidentResponse, ResponseStatus } from '../../models';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Screen from '../../components/ui/Screen';
import StatusBadge from '../../components/ui/StatusBadge';
import { locationLabel } from '../../lib/incidentMap';
import { colors, spacing } from '../../theme';

type Props = NativeStackScreenProps<ResponderStackParamList, 'ResponderDetail'>;

const STATUS_OPTIONS: Array<{ value: ResponseStatus; label: string }> = [
  { value: 'enRoute', label: 'En route' },
  { value: 'onSite', label: 'On site' },
  { value: 'resolved', label: 'Resolved' },
];

export default function ResponderDetailScreen({ navigation, route }: Props) {
  const api = useApi();
  const user = useUser();
  const { incidentId } = route.params;

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [incident, setIncident] = useState<Incident | null>(null);
  const [responses, setResponses] = useState<IncidentResponse[]>([]);
  const [status, setStatus] = useState<ResponseStatus>('enRoute');
  const [notes, setNotes] = useState('');

  const load = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const inc = await api.getIncidentById(incidentId);
      const res = await api.listResponsesByIncident(incidentId);
      const mine = await api.getResponse(user.id, incidentId);
      setIncident(inc);
      setResponses(res);
      if (mine) {
        setStatus(mine.status);
        setNotes(mine.notes);
      }
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

  async function saveResponse() {
    if (!incident || !user.responderKind) return;
    setBusy(true);
    setError(null);
    try {
      await api.upsertResponse({
        incidentId: incident.id,
        responderId: user.id,
        responderKind: user.responderKind,
        status,
        notes: notes.trim(),
      });
      if (status === 'resolved') {
        await api.updateIncident(incident.id, { status: 'resolved' });
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  const i = incident;

  return (
    <Screen contentContainerStyle={styles.pad}>
      {busy && !i ? <ActivityIndicator color={colors.primary} /> : null}
      {error ? <Text style={styles.err}>{error}</Text> : null}
      {i ? (
        <>
          <Card>
            <View style={styles.row}>
              <StatusBadge status={i.status} />
              <Text style={styles.type}>{i.type}</Text>
            </View>
            <Text style={styles.title}>{i.title}</Text>
            <Text style={styles.body}>{i.description}</Text>
            <Text style={styles.meta}>{locationLabel(i)}</Text>
          </Card>

          <Card>
            <Text style={styles.h2}>Your response</Text>
            <View style={styles.statusRow}>
              {STATUS_OPTIONS.map((opt) => (
                <Button
                  key={opt.value}
                  title={opt.label}
                  variant={status === opt.value ? 'primary' : 'secondary'}
                  onPress={() => setStatus(opt.value)}
                  style={styles.statusBtn}
                />
              ))}
            </View>
            <Text style={styles.label}>Notes</Text>
            <Input
              placeholder="Communication / status notes"
              value={notes}
              onChangeText={setNotes}
              multiline
              style={styles.notes}
            />
            <Button title={busy ? 'Saving…' : 'Save update'} variant="primary" fullWidth loading={busy} onPress={() => void saveResponse()} />
          </Card>

          <Text style={styles.h2}>All responder updates</Text>
          {responses.length === 0 ? (
            <Text style={styles.muted}>No updates yet.</Text>
          ) : (
            responses.map((r) => (
              <Card key={r.id}>
                <Text style={styles.cardTitle}>{r.responderKind}</Text>
                <Text style={styles.body}>Status: {r.status}</Text>
                {r.notes ? <Text style={styles.body}>{r.notes}</Text> : null}
              </Card>
            ))
          )}

          <Button title="Back" variant="ghost" onPress={() => navigation.goBack()} />
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  pad: { paddingBottom: spacing.xl * 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  type: { fontSize: 13, fontWeight: '600', color: colors.textMuted, textTransform: 'capitalize' },
  title: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  body: { fontSize: 15, color: colors.text, lineHeight: 22 },
  meta: { fontSize: 12, color: colors.textMuted, marginTop: spacing.sm },
  h2: { fontSize: 17, fontWeight: '700', color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm },
  label: { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginBottom: spacing.xs },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  statusBtn: { paddingVertical: spacing.sm, minHeight: 40 },
  notes: { minHeight: 88, textAlignVertical: 'top' },
  cardTitle: { fontSize: 14, fontWeight: '600', marginBottom: spacing.xs },
  muted: { fontSize: 14, color: colors.textMuted },
  err: { color: colors.danger, marginBottom: spacing.md },
});
