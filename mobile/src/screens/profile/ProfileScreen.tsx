import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { Gender } from '@ems/shared/types';
import { formatDateOfBirth, genderLabel } from '@ems/shared/profileFields';
import { useApi } from '../../context/ApiContext';
import { useUser, useUserContext } from '../../context/UserContext';
import ProfileFormFields, { type ProfileFormState } from '../../components/profile/ProfileFormFields';
import AuthField from '../../components/auth/AuthField';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Screen from '../../components/ui/Screen';
import AlertBanner from '../../components/ui/Alert';
import { ROLE_LABELS } from '../../lib/roleMeta';
import { colors, radius, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<{ Profile: undefined }, 'Profile'>;

function toForm(user: { name: string; phone?: string; address?: string; dateOfBirth?: string; gender?: Gender }): ProfileFormState {
  return {
    name: user.name,
    phone: user.phone ?? '',
    address: user.address ?? '',
    dateOfBirth: user.dateOfBirth ?? '',
    gender: user.gender ?? '',
  };
}

export default function ProfileScreen({ navigation }: Props) {
  const api = useApi();
  const user = useUser();
  const { setUser, refreshUser } = useUserContext();

  const [form, setForm] = useState<ProfileFormState>(() => toForm(user));
  const [barangayName, setBarangayName] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileBusy, setProfileBusy] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm(toForm(user));
  }, [user]);

  const loadBarangay = useCallback(async () => {
    if (!user.barangayId) {
      setBarangayName(null);
      return;
    }
    try {
      const list = await api.getBarangays();
      setBarangayName(list.find((b) => b.id === user.barangayId)?.name ?? user.barangayId);
    } catch {
      setBarangayName(user.barangayId);
    }
  }, [api, user.barangayId]);

  useEffect(() => {
    void loadBarangay();
  }, [loadBarangay]);

  async function saveProfile() {
    setProfileBusy(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await api.updateOwnProfile({
        name: form.name.trim(),
        phone: form.phone.trim() || undefined,
        address: form.address.trim() || undefined,
        dateOfBirth: form.dateOfBirth.trim() || undefined,
        gender: (form.gender || undefined) as Gender | undefined,
      });
      setUser(updated);
      setMessage('Profile saved.');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setProfileBusy(false);
    }
  }

  async function savePassword() {
    setPasswordBusy(true);
    setError(null);
    setMessage(null);
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      setPasswordBusy(false);
      return;
    }
    try {
      await api.changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage('Password updated.');
      await refreshUser();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setPasswordBusy(false);
    }
  }

  return (
    <Screen title="My profile" subtitle="Account ID, contact details, and security">
      <Card>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.idBox}>
          <Text style={styles.idLabel}>Account ID</Text>
          <Text style={styles.idValue} selectable>
            {user.id}
          </Text>
          <Text style={styles.idHint}>Unique EMS account number from registration.</Text>
        </View>
        <InfoRow label="Role" value={ROLE_LABELS[user.role] ?? user.role} />
        <InfoRow label="Email" value={user.email} />
        {user.barangayId ? <InfoRow label="Barangay" value={barangayName ?? user.barangayId} /> : null}
        {user.responderKind ? <InfoRow label="Responder type" value={user.responderKind} /> : null}
        <InfoRow label="Phone" value={user.phone ?? '—'} />
        <InfoRow label="Address" value={user.address ?? '—'} />
        <InfoRow label="Date of birth" value={formatDateOfBirth(user.dateOfBirth)} />
        <InfoRow label="Gender" value={genderLabel(user.gender)} />
        <InfoRow label="Member since" value={new Date(user.createdAt).toLocaleString()} />
      </Card>

      {message ? <AlertBanner variant="success" style={styles.banner}>{message}</AlertBanner> : null}
      {error ? <AlertBanner style={styles.banner}>{error}</AlertBanner> : null}

      <Card>
        <Text style={styles.sectionTitle}>Personal information</Text>
        <ProfileFormFields value={form} onChange={(p) => setForm((prev) => ({ ...prev, ...p }))} />
        <Button title={profileBusy ? 'Saving…' : 'Save profile'} variant="primary" fullWidth loading={profileBusy} onPress={() => void saveProfile()} />
      </Card>

      <Card style={styles.lastCard}>
        <Text style={styles.sectionTitle}>Change password</Text>
        <AuthField label="Current password">
          <Input value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry autoComplete="password" />
        </AuthField>
        <AuthField label="New password" hint="At least 6 characters">
          <Input value={newPassword} onChangeText={setNewPassword} secureTextEntry autoComplete="password-new" />
        </AuthField>
        <AuthField label="Confirm new password">
          <Input value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry autoComplete="password-new" />
        </AuthField>
        <Button
          title={passwordBusy ? 'Updating…' : 'Change password'}
          variant="primary"
          fullWidth
          loading={passwordBusy}
          onPress={() => void savePassword()}
        />
      </Card>

      <Button title="← Back" variant="ghost" fullWidth onPress={() => navigation.goBack()} />
    </Screen>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.md },
  idBox: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  idLabel: { ...typography.caption, color: colors.primaryDark, textTransform: 'uppercase', letterSpacing: 0.6 },
  idValue: { fontSize: 14, fontWeight: '700', color: colors.primaryDark, fontFamily: 'Menlo', marginTop: 6 },
  idHint: { fontSize: 12, color: colors.textMuted, marginTop: 6, lineHeight: 18 },
  infoRow: { marginBottom: spacing.sm },
  infoLabel: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  infoValue: { fontSize: 15, color: colors.text, marginTop: 2 },
  banner: { marginBottom: spacing.md },
  lastCard: { marginBottom: spacing.lg },
});
