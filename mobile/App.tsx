import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { navigationRef } from './src/navigation/navigationRef';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { emsColors } from '@ems/shared/theme/colors';
import { ApiProvider } from './src/context/ApiContext';
import { UserProvider } from './src/context/UserContext';
import { ems } from './src/emsClient';
import { supabase } from './src/lib/supabase';
import { restoreAuthUser, scheduleProfileReload } from './src/lib/authBootstrap';
import { assertSupabaseConfig } from './src/lib/supabase';
import type { AuthStackParamList, AppStackParamList, ResponderStackParamList } from './src/navigation/types';
import { Role, type User } from './src/models';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import CreateReportScreen from './src/screens/CreateReportScreen';
import MapPickerScreen from './src/screens/MapPickerScreen';
import MarksMapScreen from './src/screens/MarksMapScreen';
import DetailScreen from './src/screens/DetailScreen';
import EditScreen from './src/screens/EditScreen';
import ResponderDashboardScreen from './src/screens/responder/ResponderDashboardScreen';
import ResponderMarksMapScreen from './src/screens/responder/ResponderMarksMapScreen';
import ResponderDetailScreen from './src/screens/responder/ResponderDetailScreen';
import ProfileScreen from './src/screens/profile/ProfileScreen';
import AppLayoutShell from './src/components/layout/AppLayoutShell';
import { useAppLayout } from './src/context/AppLayoutContext';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();
const ResponderStack = createNativeStackNavigator<ResponderStackParamList>();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: emsColors.primary,
    background: '#f1f5f9',
    card: '#ffffff',
    text: '#0f172a',
    border: '#e2e8f0',
  },
};

const baseStackOptions = {
  headerShadowVisible: false,
  headerStyle: { backgroundColor: '#f1f5f9' },
  headerTintColor: emsColors.primaryDark,
  headerTitleStyle: { fontWeight: '700', fontSize: 17 },
  contentStyle: { backgroundColor: '#f1f5f9' },
  animation: 'slide_from_right',
} as const;

const stackScreenOptions = {
  ...baseStackOptions,
  headerShown: false,
} as const;

function useSidebarScreenListeners() {
  const { closeSidebar } = useAppLayout();
  return { focus: () => closeSidebar() };
}

function AuthNavigator({ onLoggedIn }: { onLoggedIn: (u: User) => void }) {
  return (
    <AuthStack.Navigator
      initialRouteName="Register"
      screenOptions={{
        ...baseStackOptions,
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <AuthStack.Screen name="Register">
        {(props) => <RegisterScreen {...props} onRegistered={onLoggedIn} />}
      </AuthStack.Screen>
      <AuthStack.Screen name="Login">{(props) => <LoginScreen {...props} onLoggedIn={onLoggedIn} />}</AuthStack.Screen>
    </AuthStack.Navigator>
  );
}

function ResidentNavigator() {
  const screenListeners = useSidebarScreenListeners();

  return (
    <AppStack.Navigator screenOptions={stackScreenOptions} screenListeners={screenListeners}>
      <AppStack.Screen name="Dashboard">{(props) => <DashboardScreen {...props} />}</AppStack.Screen>
      <AppStack.Screen name="Profile" component={ProfileScreen} />
      <AppStack.Screen name="CreateReport" component={CreateReportScreen} />
      <AppStack.Screen name="MapPicker" component={MapPickerScreen} />
      <AppStack.Screen name="MarksMap" component={MarksMapScreen} />
      <AppStack.Screen name="Detail" component={DetailScreen} />
      <AppStack.Screen name="Edit" component={EditScreen} />
    </AppStack.Navigator>
  );
}

function ResponderNavigator() {
  const screenListeners = useSidebarScreenListeners();

  return (
    <ResponderStack.Navigator screenOptions={stackScreenOptions} screenListeners={screenListeners}>
      <ResponderStack.Screen name="ResponderDashboard">
        {(props) => <ResponderDashboardScreen {...props} />}
      </ResponderStack.Screen>
      <ResponderStack.Screen name="Profile" component={ProfileScreen} />
      <ResponderStack.Screen name="ResponderMarksMap" component={ResponderMarksMapScreen} />
      <ResponderStack.Screen name="ResponderDetail" component={ResponderDetailScreen} />
    </ResponderStack.Navigator>
  );
}

function UnsupportedRoleGate({ role, onLogout }: { role: string; onLogout: () => Promise<void> }) {
  return (
    <View style={styles.gate}>
      <Text style={styles.gateTitle}>EMS — role not on mobile</Text>
      <Text style={styles.gateBody}>
        Signed in as {role}. This Expo app supports Resident and Emergency Responder accounts. Use the web app for
        barangay officials and system admins.
      </Text>
      <Text style={styles.gateBtn} onPress={() => void onLogout()}>
        Log out
      </Text>
    </View>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [bootError, setBootError] = useState<string | null>(null);
  const bootstrappedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        assertSupabaseConfig();
        const me = await restoreAuthUser();
        if (cancelled) return;
        bootstrappedRef.current = true;
        setUser(me);
        setBootError(null);
      } catch (e) {
        if (cancelled) return;
        setBootError(e instanceof Error ? e.message : 'Failed to start EMS');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        return;
      }
      if (!bootstrappedRef.current) return;
      if (event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY') {
        scheduleProfileReload(setUser);
      }
    });

    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
    };
  }, []);

  const logout = useCallback(async () => {
    await ems.logout();
    setUser(null);
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={emsColors.primary} />
        <StatusBar style="auto" />
      </View>
    );
  }

  if (bootError) {
    return (
      <View style={styles.center}>
        <Text style={styles.bootErrorTitle}>Cannot start EMS</Text>
        <Text style={styles.bootErrorMsg}>{bootError}</Text>
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <ApiProvider>
      <NavigationContainer ref={navigationRef} theme={navTheme}>
        {user == null ? (
          <AuthNavigator onLoggedIn={setUser} />
        ) : user.role === Role.resident ? (
          <UserProvider user={user} setUser={setUser}>
            <AppLayoutShell onLogout={logout}>
              <ResidentNavigator />
            </AppLayoutShell>
          </UserProvider>
        ) : user.role === Role.emergencyResponders ? (
          <UserProvider user={user} setUser={setUser}>
            <AppLayoutShell onLogout={logout}>
              <ResponderNavigator />
            </AppLayoutShell>
          </UserProvider>
        ) : (
          <UnsupportedRoleGate role={user.role} onLogout={logout} />
        )}
      </NavigationContainer>
      <StatusBar style="auto" />
    </ApiProvider>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f5f9', padding: 24 },
  bootErrorTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 8, textAlign: 'center' },
  bootErrorMsg: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 20 },
  gate: { flex: 1, justifyContent: 'center', padding: 24 },
  gateTitle: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  gateBody: { marginBottom: 20, color: '#444', lineHeight: 22 },
  gateBtn: { color: emsColors.primary, fontSize: 16, fontWeight: '600', textAlign: 'center' },
});
