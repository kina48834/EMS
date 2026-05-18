import { useCallback } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { emsColors } from '@ems/shared/theme/colors';
import { useAppLayout } from '../../context/AppLayoutContext';
import { useUser } from '../../context/UserContext';
import { ROLE_LABELS } from '../../lib/roleMeta';
import { navigate } from '../../navigation/navigationRef';
import { navItemsForRole, type NavScreenItem } from '../../navigation/roleNav';
import { colors, radius, spacing, typography } from '../../theme';

type Props = {
  onLogout: () => void | Promise<void>;
};

export default function NavMenuPopup({ onLogout }: Props) {
  const { sidebarOpen, closeSidebar, activeScreen } = useAppLayout();
  const user = useUser();
  const insets = useSafeAreaInsets();

  const items = navItemsForRole(user.role).filter((i) => i.screen !== 'Profile');

  const goTo = useCallback(
    (item: NavScreenItem) => {
      closeSidebar();
      if (activeScreen === item.screen) return;
      navigate(item.screen);
    },
    [closeSidebar, activeScreen],
  );

  if (!sidebarOpen) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={closeSidebar}>
      <Pressable style={styles.backdrop} onPress={closeSidebar} accessibilityLabel="Close menu">
        <View style={[styles.anchor, { paddingTop: insets.top + 56 }]} pointerEvents="box-none">
          <Pressable style={styles.popup} onPress={(e) => e.stopPropagation()}>
            <View style={styles.header}>
              <Text style={styles.userName} numberOfLines={1}>
                {user.name}
              </Text>
              <Text style={styles.userRole}>{ROLE_LABELS[user.role] ?? user.role}</Text>
            </View>

            {items.map((item) => {
              const active = activeScreen === item.screen;
              return (
                <Pressable
                  key={item.screen}
                  onPress={() => goTo(item)}
                  style={[styles.menuItem, active && styles.menuItemActive]}
                >
                  <Text style={[styles.menuLabel, active && styles.menuLabelActive]}>{item.label}</Text>
                </Pressable>
              );
            })}

            <Pressable
              style={[styles.menuItem, activeScreen === 'Profile' && styles.menuItemActive]}
              onPress={() => goTo({ label: 'Profile', screen: 'Profile' })}
            >
              <Text style={[styles.menuLabel, activeScreen === 'Profile' && styles.menuLabelActive]}>Profile</Text>
            </Pressable>

            <Pressable
              style={styles.logoutBtn}
              onPress={() => {
                closeSidebar();
                void onLogout();
              }}
            >
              <Text style={styles.logoutText}>Logout</Text>
            </Pressable>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
  },
  anchor: {
    flex: 1,
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
  },
  popup: {
    width: '100%',
    maxWidth: 300,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 8px 24px rgba(15, 23, 42, 0.15)' }
      : {
          shadowColor: '#0f172a',
          shadowOpacity: 0.15,
          shadowRadius: 16,
          elevation: 8,
        }),
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.xs,
  },
  userName: { ...typography.h3, color: colors.text, fontSize: 16 },
  userRole: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  menuItem: {
    marginHorizontal: spacing.sm,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  menuItemActive: { backgroundColor: emsColors.primary },
  menuLabel: { fontSize: 15, fontWeight: '600', color: colors.text },
  menuLabelActive: { color: '#fff' },
  logoutBtn: {
    marginHorizontal: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.dangerLight,
    borderWidth: 1,
    borderColor: '#fecdd3',
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: colors.danger },
});
