import { useMemo, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation/types';
import { useApi } from '../context/ApiContext';
import type { User } from '../models';
import AuthLayout from '../components/auth/AuthLayout';
import AuthField from '../components/auth/AuthField';
import DemoAccountCard from '../components/auth/DemoAccountCard';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import AlertBanner from '../components/ui/Alert';
import { DEMO_ACCOUNTS } from '../constants/demoAccounts';
import { formatApiError } from '../lib/apiErrorMessage';
import { colors, spacing } from '../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'> & { onLoggedIn: (u: User) => void };

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export default function LoginScreen({ navigation, onLoggedIn }: Props) {
  const api = useApi();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const emailInvalid = touched && email.trim().length > 0 && !isValidEmail(email);
  const canSubmit = email.trim().length > 0 && password.length > 0 && !emailInvalid;

  const mobileDemos = useMemo(() => DEMO_ACCOUNTS.filter((a) => a.mobileSupported), []);

  async function signIn(loginEmail: string, loginPassword: string) {
    const e = loginEmail.trim().toLowerCase();
    if (!e || !loginPassword) {
      setTouched(true);
      setError('Enter your email and password.');
      return;
    }
    if (!isValidEmail(e)) {
      setTouched(true);
      setError('Enter a valid email address.');
      return;
    }

    Keyboard.dismiss();
    setBusy(true);
    setError(null);
    try {
      const user = await api.login({ email: e, password: loginPassword });
      onLoggedIn(user);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Use your EMS account. Data syncs with Supabase over Wi‑Fi or mobile data."
      onBack={() => navigation.navigate('Register')}
      backLabel="Register"
      footer={
        <Text style={styles.footer}>
          New here?{' '}
          <Text style={styles.footerLink} onPress={() => navigation.navigate('Register')}>
            Register first
          </Text>
        </Text>
      }
    >
      <Card style={styles.card}>
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
            returnKeyType="next"
          />
        </AuthField>

        <AuthField label="Password">
          <Input
            placeholder="Your password"
            secureTextEntry
            textContentType="password"
            autoComplete="password"
            value={password}
            onChangeText={setPassword}
            editable={!busy}
            returnKeyType="go"
            onSubmitEditing={() => void signIn(email, password)}
          />
        </AuthField>

        {error ? <AlertBanner style={styles.alertGap}>{error}</AlertBanner> : null}

        <Button
          title={busy ? 'Signing in…' : 'Sign in'}
          variant="primary"
          fullWidth
          loading={busy}
          disabled={!canSubmit}
          onPress={() => void signIn(email, password)}
        />
      </Card>

      <Card style={styles.demoCard}>
        <Text style={styles.demoTitle}>Demo accounts</Text>
        <Text style={styles.demoSub}>
          Run 00_all_in_one.sql then demo_accounts.sql in Supabase. Disable email confirmation under Auth →
          Providers → Email.
        </Text>
        <View style={styles.demoGrid}>
          {DEMO_ACCOUNTS.map((account) => (
            <DemoAccountCard
              key={account.key}
              account={account}
              disabled={busy}
              onPress={() => {
                if (!account.mobileSupported) return;
                setEmail(account.email);
                setPassword(account.password);
                void signIn(account.email, account.password);
              }}
            />
          ))}
        </View>
        <Text style={styles.demoFoot}>
          Quick try: {mobileDemos.map((a) => a.label).join(' or ')} — tap a card above.
        </Text>
      </Card>

      <Pressable style={styles.secondaryLink} onPress={() => navigation.navigate('Register')}>
        <Text style={styles.secondaryLinkText}>← Register first</Text>
      </Pressable>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md },
  alertGap: { marginBottom: spacing.md },
  demoCard: { marginBottom: spacing.md },
  demoTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: spacing.xs },
  demoSub: { fontSize: 12, color: colors.textMuted, lineHeight: 18, marginBottom: spacing.md },
  demoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  demoFoot: { fontSize: 12, color: colors.textMuted, marginTop: spacing.md, lineHeight: 18 },
  secondaryLink: { alignItems: 'center', paddingVertical: spacing.sm },
  secondaryLinkText: { fontSize: 15, fontWeight: '600', color: colors.primary },
  footer: { fontSize: 15, color: colors.textMuted, textAlign: 'center' },
  footerLink: { color: colors.primary, fontWeight: '700' },
});
