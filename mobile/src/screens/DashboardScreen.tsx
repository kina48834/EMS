import { useCallback, useState } from 'react';
import { formatApiError } from '../lib/apiErrorMessage';
import { ActivityIndicator, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../navigation/types';
import { useApi } from '../context/ApiContext';
import { useUser } from '../context/UserContext';
import { type Incident } from '../models';
import { confirmAction } from '../lib/confirm';
import { canManageOwnMark } from '../lib/incidentManage';
import IncidentCard from '../components/incident/IncidentCard';
import QuickAction from '../components/ui/QuickAction';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import Screen from '../components/ui/Screen';
import AlertBanner from '../components/ui/Alert';
import { useLayout } from '../hooks/useLayout';
import { colors, spacing } from '../theme';

type Props = NativeStackScreenProps<AppStackParamList, 'Dashboard'>;

export default function DashboardScreen({ navigation }: Props) {
  const api = useApi();
  const user = useUser();
  const { gap, isWide, stackActions } = useLayout();
  const [busy, setBusy] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);

  const refresh = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const items = await api.listIncidentsForReporter(user.id);
      setIncidents(items);
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setBusy(false);
      setInitialLoad(false);
    }
  }, [api, user.id]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  async function deleteIncident(i: Incident) {
    if (!canManageOwnMark(i, user.id)) return;
    const ok = await confirmAction('Delete report?', 'This cannot be undone.', {
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    setBusy(true);
    setError(null);
    try {
      await api.deleteIncident(i.id);
      await refresh();
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setBusy(false);
    }
  }

  function openEdit(i: Incident) {
    if (!canManageOwnMark(i, user.id)) return;
    navigation.navigate('Edit', { incidentId: i.id });
  }

  return (
    <Screen
      title="My reports"
      subtitle="View, edit, and manage your marked incidents."
      showBack={false}
      refreshControl={
        <RefreshControl refreshing={busy && !initialLoad} onRefresh={refresh} tintColor={colors.primary} />
      }
    >
      <View style={[styles.actions, { gap }, isWide && styles.actionsWide, stackActions && styles.actionsStack]}>
        <QuickAction
          title="New report"
          subtitle="Save details & mark on map"
          icon="➕"
          variant="primary"
          onPress={() => navigation.navigate('CreateReport')}
          style={styles.actionTile}
        />
        <QuickAction
          title="Map view"
          subtitle={`${incidents.length} mark${incidents.length === 1 ? '' : 's'} on map`}
          icon="🗺️"
          variant="secondary"
          onPress={() => navigation.navigate('MarksMap')}
          style={styles.actionTile}
        />
      </View>

      {error ? <AlertBanner style={styles.err}>{error}</AlertBanner> : null}

      {initialLoad && incidents.length === 0 ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading your reports…</Text>
        </View>
      ) : null}

      {!initialLoad && incidents.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No reports yet"
          body="Create a report, save the details, then mark its location on the map."
          action={
            <Button
              title="Create first report"
              variant="primary"
              size="lg"
              fullWidth
              icon="➕"
              onPress={() => navigation.navigate('CreateReport')}
            />
          }
        />
      ) : null}

      {incidents.length > 0 ? (
        <View style={styles.listHead}>
          <Text style={styles.listTitle}>Your reports</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{incidents.length}</Text>
          </View>
        </View>
      ) : null}

      {incidents.map((i) => (
        <IncidentCard
          key={i.id}
          incident={i}
          canManage={canManageOwnMark(i, user.id)}
          onOpen={() => navigation.navigate('Detail', { incidentId: i.id })}
          onEdit={() => openEdit(i)}
          onDelete={() => void deleteIncident(i)}
        />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  actionsWide: { maxWidth: 720 },
  actionsStack: { flexDirection: 'column' },
  actionTile: { flex: 1, minWidth: 0 },
  err: { marginBottom: spacing.md },
  loading: { alignItems: 'center', paddingVertical: spacing.xxl },
  loadingText: { marginTop: spacing.md, fontSize: 14, color: colors.textMuted },
  listHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  listTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  countBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  countText: { fontSize: 12, fontWeight: '700', color: colors.primaryDark },
});
