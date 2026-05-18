import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import type { NativeStackHeaderLeftProps } from '@react-navigation/native-stack';
import { HeaderBackButton } from '@react-navigation/elements';
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
import MenuButton from './src/components/layout/MenuButton';
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

const appStackScreenOptions = {
  ...baseStackOptions,
  headerLeft: (props: NativeStackHeaderLeftProps) => (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <MenuButton />
      {props.canGoBack ? <HeaderBackButton {...props} /> : null}
    </View>
  ),
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
    <AppStack.Navigator screenOptions={appStackScreenOptions} screenListeners={screenListeners}>
      <AppStack.Screen name="Dashboard" options={{ headerShown: false }}>
        {(props) => <DashboardScreen {...props} />}
      </AppStack.Screen>
      <AppStack.Screen name="Profile" component={ProfileScreen} options={{ title: 'My Profile' }} />
      <AppStack.Screen name="CreateReport" component={CreateReportScreen} options={{ title: 'Report & Map' }} />
      <AppStack.Screen name="MapPicker" component={MapPickerScreen} options={{ title: 'Mark Location' }} />
      <AppStack.Screen name="MarksMap" component={MarksMapScreen} options={{ title: 'My Marks Map' }} />
      <AppStack.Screen name="Detail" component={DetailScreen} options={{ title: 'Incident Details' }} />
      <AppStack.Screen name="Edit" component={EditScreen} options={{ title: 'Edit mark' }} />
    </AppStack.Navigator>
  );
}

function ResponderNavigator() {
  const screenListeners = useSidebarScreenListeners();

  return (
    <ResponderStack.Navigator screenOptions={appStackScreenOptions} screenListeners={screenListeners}>
      <ResponderStack.Screen name="ResponderDashboard" options={{ headerShown: false }}>
        {(props) => <ResponderDashboardScreen {...props} />}
      </ResponderStack.Screen>
      <ResponderStack.Screen name="Profile" component={ProfileScreen} options={{ title: 'My Profile' }} />
      <ResponderStack.Screen
        name="ResponderMarksMap"
        component={ResponderMarksMapScreen}
        options={{ title: 'Resident Marks Map' }}
      />
      <ResponderStack.Screen name="ResponderDetail" component={ResponderDetailScreen} options={{ title: 'Respond' }} />
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
  const bootstrappedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const me = await restoreAuthUser();
      if (cancelled) return;
      bootstrappedRef.current = true;
      setUser(me);
      setLoading(false);
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f5f9' },
  gate: { flex: 1, justifyContent: 'center', padding: 24 },
  gateTitle: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  gateBody: { marginBottom: 20, color: '#444', lineHeight: 22 },
  gateBtn: { color: emsColors.primary, fontSize: 16, fontWeight: '600', textAlign: 'center' },
});
