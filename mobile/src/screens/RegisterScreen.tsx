import { useEffect, useState } from 'react';
import { formatApiError } from '../lib/apiErrorMessage';
import { Keyboard, Pressable, StyleSheet, Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { Gender } from '@ems/shared/types';
import type { AuthStackParamList } from '../navigation/types';
import { useApi } from '../context/ApiContext';
import type { User } from '../models';
import AuthLayout from '../components/auth/AuthLayout';
import AuthField from '../components/auth/AuthField';
import BarangayPicker from '../components/auth/BarangayPicker';
import ProfileFormFields, { type ProfileFormState } from '../components/profile/ProfileFormFields';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import AlertBanner from '../components/ui/Alert';
import { colors, spacing } from '../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'> & { onRegistered: (u: User) => void };

const MIN_PASSWORD = 6;

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export default function RegisterScreen({ navigation, onRegistered }: Props) {
  const api = useApi();
  const [profile, setProfile] = useState<ProfileFormState>({
    name: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    gender: '',
  });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [barangays, setBarangays] = useState<Awaited<ReturnType<typeof api.getBarangays>>>([]);
  const [barangaysLoading, setBarangaysLoading] = useState(true);
  const [barangayId, setBarangayId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setBarangaysLoading(true);
      try {
        const list = await api.getBarangays();
        if (cancelled) return;
        setBarangays(list);
        setBarangayId(list[0]?.id ?? null);
        setError(null);
      } catch (e) {
        if (!cancelled) setError(formatApiError(e));
      } finally {
        if (!cancelled) setBarangaysLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [api]);

  const emailInvalid = touched && email.trim().length > 0 && !isValidEmail(email);
  const passwordShort = touched && password.length > 0 && password.length < MIN_PASSWORD;
  const canSubmit =
    profile.name.trim().length >= 2 &&
    isValidEmail(email) &&
    password.length >= MIN_PASSWORD &&
    Boolean(barangayId) &&
    !barangaysLoading;

  async function submit() {
    setTouched(true);
    const n = profile.name.trim();
    const em = email.trim().toLowerCase();
    if (!n || n.length < 2) {
      setError('Enter your full name (at least 2 characters).');
      return;
    }
    if (!isValidEmail(em)) {
      setError('Enter a valid email address.');
      return;
    }
    if (password.length < MIN_PASSWORD) {
      setError(`Password must be at least ${MIN_PASSWORD} characters.`);
      return;
    }
    if (!barangayId) {
      setError('Select your barangay.');
      return;
    }

    Keyboard.dismiss();
    setBusy(true);
    setError(null);
    try {
      const user = await api.registerResident({
        name: n,
        email: em,
        password,
        barangayId,
        phone: profile.phone.trim() || undefined,
        address: profile.address.trim() || undefined,
        dateOfBirth: profile.dateOfBirth.trim() || undefined,
        gender: (profile.gender || undefined) as Gender | undefined,
      });
      onRegistered(user);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      title="Create account"
      subtitle="Register as a resident with your contact details and barangay. Syncs with Supabase when online."
      footer={
        <Text style={styles.footer}>
          Already have an account?{' '}
          <Text style={styles.footerLink} onPress={() => navigation.navigate('Login')}>
            Sign in
          </Text>
        </Text>
      }
    >
      <Card>
        <ProfileFormFields value={profile} onChange={(p) => setProfile((prev) => ({ ...prev, ...p }))} />

        <AuthField label="Email">
          <Input
            placeholder="you@example.com"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
            invalid={emailInvalid}
            editable={!busy}
          />
        </AuthField>

        <AuthField label="Password" hint={`At least ${MIN_PASSWORD} characters`}>
          <Input
            placeholder="Create a password"
            secureTextEntry
            textContentType="newPassword"
            autoComplete="password-new"
            value={password}
            onChangeText={setPassword}
            invalid={passwordShort}
            editable={!busy}
          />
        </AuthField>

        <AuthField label="Barangay" hint="Where you live — used to route incidents">
          <BarangayPicker barangays={barangays} value={barangayId} onChange={setBarangayId} loading={barangaysLoading} />
        </AuthField>

        {error ? <AlertBanner style={styles.alertGap}>{error}</AlertBanner> : null}

        <Button
          title={busy ? 'Creating account…' : 'Create account'}
          variant="primary"
          fullWidth
          loading={busy}
          disabled={!canSubmit}
          onPress={() => void submit()}
        />
      </Card>

      <Pressable style={styles.secondaryLink} onPress={() => navigation.navigate('Login')}>
        <Text style={styles.secondaryLinkText}>Already have an account? Sign in →</Text>
      </Pressable>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  alertGap: { marginBottom: spacing.md },
  secondaryLink: { alignItems: 'center', paddingVertical: spacing.md },
  secondaryLinkText: { fontSize: 15, fontWeight: '600', color: colors.primary },
  footer: { fontSize: 15, color: colors.textMuted, textAlign: 'center' },
  footerLink: { color: colors.primary, fontWeight: '700' },
});
